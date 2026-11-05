import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  COMIC_MANIFEST_LIMITS,
  planComicReferences,
  validateComicManifest,
  validateComicOutputCompatibility
} from '../../src/comic-manifest/index.js';
import {
  createOfflineOrchestrationPrototype,
  createSyntheticExecutionAuthorityVerifier,
  createSyntheticContextUseVerifier,
  SYNTHETIC_CONTEXT_READER_SLOTS
} from '@definitely-secure-studio/platform/offline-orchestration-prototype';
import { canonicalJson, MockTextAdapter } from '../../src/prompt-sdk/index.js';
import { contextUseRequest } from '../../src/offline-orchestration-prototype/context-use-authority.js';
import {
  createOfflineOrchestrationPrototypeForTest as createOfflineOrchestrationPrototypeForTestRaw,
  InMemoryPrototypeStore,
  MaterialLedger,
  assertAtMost,
  checkedAdd
} from '../../src/offline-orchestration-prototype/testing.js';
import { OFFLINE_ORCHESTRATION_LIMITS } from '../../src/offline-orchestration-prototype/limits.js';
import { SYNTHETIC_EXECUTION_PURPOSE } from '../../src/offline-orchestration-prototype/execution-authority.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
const contextFixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json', import.meta.url), 'utf8'));
const productionSource = JSON.stringify(fixture.production);
const sha = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

function createRuntime({ start = 10_000, epochId = 'test-monotonic-epoch' } = {}) {
  let monotonic = start;
  let timers = new Map();
  let timerNumber = 0;
  return {
    runtime: {
      now: () => monotonic,
      get timerCount() { return timers.size; },
      epochId,
      wallNow: () => Date.UTC(2026, 9, 28, 17, 0, 0),
      setTimer(callback, delay) {
        const id = ++timerNumber;
        timers.set(id, { callback, delay });
        return id;
      },
      clearTimer(id) { timers.delete(id); }
    },
    set(value) { monotonic = value; },
    advance(delta) { monotonic += delta; },
    get timerCount() { return timers.size; },
    fireTimers() {
      const pending = [...timers.values()];
      timers.clear();
      for (const timer of pending) timer.callback();
    }
  };
}

function idFactory() {
  let index = 1;
  return () => `10000000-0000-4000-8000-${String(index++).padStart(12, '0')}`;
}

function authorityFixture(overrides = {}) {
  const record = (action, suffix) => ({
    decision_id: `20000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    decision: 'allow',
    action,
    purpose: SYNTHETIC_EXECUTION_PURPOSE,
    production: {
      production_id: 'urn:uuid:10000000-0000-4000-8000-000000000001',
      revision: 1,
      identity_sha256: 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc'
    },
    not_before: '2026-01-01T00:00:00Z',
    review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/106',
    ...overrides[action]
  });
  return createSyntheticExecutionAuthorityVerifier([record('execute', '001'), record('retry', '002')]);
}

function syntheticContextFixture({ decision = 'allow', revoke = false, readerOverrides = {}, recordOverrides = {} } = {}) {
  const runtime = createRuntime();
  runtime.runtime.wallNow = () => Date.parse(fixture.at);
  const productionReport = validateComicManifest(canonicalJson(fixture.production));
  const production = { value: fixture.production, identity: productionReport.identity, canonical: canonicalJson(fixture.production) };
  const requests = ['execute', 'retry'].map(action => contextUseRequest(production, action));
  const useRecord = (action, suffix, request) => ({
    decision_id: `30000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    decision, request,
    authorization: structuredClone(contextFixture.authorization),
    not_before: '2026-09-15T00:00:00Z',
    review_after: '2026-09-16T00:00:00Z',
    expires_at: '2026-09-16T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/106',
    ...recordOverrides[action]
  });
  const use = createSyntheticContextUseVerifier([
    useRecord('execute', '001', requests[0]), useRecord('retry', '002', requests[1])
  ]);
  if (revoke) use.revoke('30000000-0000-4000-8000-000000000001');
  const plan = planComicReferences(production.canonical);
  const slots = Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, undefined]));
  for (const entry of plan.references) {
    let slot;
    if (entry.reference.kind === 'context-package') slot = 'context-package';
    else if (entry.reference.kind === 'builder-result') slot = 'builder-result';
    else if (entry.uses[0].role === 'canon') slot = 'canon';
    else if (entry.uses[0].role === 'dependency') slot = `dependency-${entry.uses[0].index}`;
    else if (entry.uses[0].role === 'prompt') slot = 'prompt-description';
    let bytes;
    if (entry.reference.kind === 'public') {
      bytes = Buffer.from(fixture.dependency_bytes[entry.reference.dependency.artifact.artifact_uri], 'utf8');
    } else if (entry.reference.kind === 'context-package') {
      bytes = Buffer.from(canonicalJson(contextFixture.result.package), 'utf8');
    } else {
      bytes = Buffer.from(canonicalJson(contextFixture.result), 'utf8');
    }
    slots[slot] = bytes;
  }
  const reads = [];
  const readers = Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, async ({ maxBytes, signal }) => {
    reads.push(slot);
    if (signal.aborted) throw new Error('cancelled');
    const result = readerOverrides[slot] ? await readerOverrides[slot](Buffer.from(slots[slot])) : Buffer.from(slots[slot]);
    assert.ok(result.byteLength <= maxBytes);
    return result;
  }]));
  const contextInputProvider = { id: 'studio.synthetic.comic-context-readers', mode: 'synthetic', readers };
  return { runtime, production, reads, contextInputProvider, use: use.verifier, revoke: use.revoke, useAuthority: use };
}

function createOfflineOrchestrationPrototypeForTest(seams = {}) {
  return createOfflineOrchestrationPrototypeForTestRaw({
    executionAuthorityProvider: authorityFixture().verifier,
    ...seams
  });
}

function runner({ store = new InMemoryPrototypeStore(), runtime = createRuntime().runtime, ...seams } = {}) {
  const authority = seams.executionAuthorityProvider ? undefined : authorityFixture();
  return {
    store,
    authority,
    value: createOfflineOrchestrationPrototypeForTest({
      store, runtime, idFactory: idFactory(),
      executionAuthorityProvider: authority?.verifier,
      ...seams
    }),
    runtime
  };
}

test('runs exactly one synthetic mock call and commits a validated immutable result in order', async () => {
  const h = runner();
  const mocks = [];
  let dispatchObservedBeforeMock = false;
  const instance = createOfflineOrchestrationPrototypeForTest({
    store: h.store,
    runtime: h.runtime,
    idFactory: idFactory(),
    onMockCall({ phase, mock }) {
      if (phase === 'created') mocks.push(mock);
      if (phase === 'dispatch-confirmed') {
        const events = h.store.readEvents(h.store.readJobIds()[0]);
        dispatchObservedBeforeMock = events.at(-1)?.type === 'dispatch-started' && mock.calls.length === 0;
      }
    }
  });

  const result = await instance.submit({ productionSource, correlation_id: 'caller-correlation-1' });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.result.status, 'complete');
  assert.equal(result.retry_eligible, false);
  assert.equal(validateComicManifest(JSON.stringify(result.result)).valid, true);
  assert.equal(validateComicOutputCompatibility(productionSource, JSON.stringify(result.result)).valid, true);
  assert.equal(dispatchObservedBeforeMock, true);
  assert.equal(mocks.length, 1);
  assert.equal(mocks[0].calls.length, 1);
  assert.equal(mocks[0].calls[0].correlation_id, 'caller-correlation-1');
  assert.notEqual(result.attempt_id, result.result.result_id);
  assert.notEqual(result.execution_id, result.attempt_id);

  const events = h.store.readEvents(result.job_id);
  assert.deepEqual(events.map(item => item.type), [
    'admitted', 'prepared', 'dispatch-started', 'provider-outcome', 'result-prepared',
    'persisting', 'terminal', 'job-closed'
  ]);
  assert.equal(events[1].production.identity.sha256, fixture.result.production.identity.sha256);
  assert.equal(events[2].execution_id, result.execution_id);
  const outcome = JSON.parse(h.store.readImmutable(events[3].payload_key).toString('utf8'));
  assert.equal(outcome.correlation_id, 'caller-correlation-1');
  assert.equal(outcome.status, 'succeeded');

  const output = result.result.outputs[0];
  const artifactBytes = h.store.readImmutable(`artifact:${output.artifact.artifact_uri}`);
  assert.equal(artifactBytes.toString('utf8'), fixture.production.renditions[0].transcript);
  assert.equal(sha(artifactBytes), output.artifact.sha256);
  const resultBytes = h.store.readImmutable(`result:${result.result.result_id}`);
  assert.equal(resultBytes.toString('utf8'), canonicalJson(result.result));
  assert.equal(h.runtime.timerCount, 0);
});

test('opt-in pinned Context Builder input is validated and used only with current package-use authority', async () => {
  const context = syntheticContextFixture();
  const mocks = [];
  const h = runner({ runtime: context.runtime.runtime,
    syntheticContextReaders: context.contextInputProvider, contextUseAuthorityProvider: context.use,
    onMockCall({ phase, mock }) { if (phase === 'created') mocks.push(mock); }
  });
  const result = await h.value.submit({ productionSource, syntheticContext: true });
  assert.equal(result.result.status, 'complete');
  assert.equal(mocks[0].calls.length, 1);
  const rendered = mocks[0].calls[0].rendered_prompt;
  assert.ok(JSON.stringify(rendered).includes('Synthetic approved note.'));
  assert.ok(JSON.stringify(rendered).includes('facts'));
  assert.deepEqual([...context.reads].sort(), [...SYNTHETIC_CONTEXT_READER_SLOTS].sort());
});

test('Context Builder use denial, expiry, revocation, malformed pins, and real-time staleness stop before reads', async t => {
  const cases = [
    ['denied', () => syntheticContextFixture({ decision: 'deny' }), 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED'],
    ['revoked', () => syntheticContextFixture({ revoke: true }), 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED'],
    ['expired', () => syntheticContextFixture({ recordOverrides: { execute: {
      review_after: '2026-09-15T12:09:00Z', expires_at: '2026-09-15T12:30:00Z'
    } } }), 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED']
  ];
  for (const [name, make, code] of cases) await t.test(name, async () => {
    const context = make(); const mocks = [];
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: context.use, onMockCall({ phase, mock }) { if (phase === 'created') mocks.push(mock); } });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }), error => error.code === code);
    assert.deepEqual(context.reads, []);
    assert.equal(mocks.length, 0);
    assert.equal(h.store.eventCount, 0);
  });

  await t.test('malformed evidence pin', async () => {
    const context = syntheticContextFixture();
    const provider = {
      ...context.use,
      async verify(input) {
        const evidence = await context.use.verify(input);
        return { ...evidence, request: { ...evidence.request,
          builder_result_identity: { ...evidence.request.builder_result_identity, sha256: `sha256:${'0'.repeat(64)}` } } };
      },
      isCurrent: () => true
    };
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: provider });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    assert.deepEqual(context.reads, []);
  });

  await t.test('expired under the actual host wall clock', async () => {
    const context = syntheticContextFixture();
    const h = runner({ syntheticContextReaders: context.contextInputProvider, contextUseAuthorityProvider: context.use });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    assert.deepEqual(context.reads, []);
  });
});

test('execution and package-use authority are rechecked across asynchronous boundaries and deadlines', async t => {
  await t.test('execution denial precedes all context reads', async () => {
    const context = syntheticContextFixture(); const denied = authorityFixture({ execute: { decision: 'deny' } });
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: context.use, executionAuthorityProvider: denied.verifier });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'EXECUTION_AUTHORITY_DENIED');
    assert.deepEqual(context.reads, []);
  });

  await t.test('revocation during awaited authority verification precedes every reader', async () => {
    const context = syntheticContextFixture();
    const provider = {
      ...context.use,
      async verify(input) {
        const evidence = await context.use.verify(input);
        if (input.request.action === 'execute') context.revoke('30000000-0000-4000-8000-000000000001');
        return evidence;
      }
    };
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: provider });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    assert.deepEqual(context.reads, []);
  });

  await t.test('cancellation during awaited package-use verification precedes every reader', async () => {
    const context = syntheticContextFixture(); const controller = new AbortController();
    const provider = {
      ...context.use,
      async verify(input) {
        const evidence = await context.use.verify(input);
        if (input.request.action === 'execute') controller.abort();
        return evidence;
      }
    };
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: provider });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true, signal: controller.signal }),
      error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    assert.deepEqual(context.reads, []);
  });

  await t.test('revocation during a protected read prevents later reads and mock calls', async () => {
    let context;
    context = syntheticContextFixture({ readerOverrides: { 'context-package': bytes => {
      context.revoke('30000000-0000-4000-8000-000000000001'); return bytes;
    } } });
    const mocks = [];
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: context.use, onMockCall({ phase, mock }) { if (phase === 'created') mocks.push(mock); } });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    assert.deepEqual(context.reads, ['canon', 'dependency-0', 'dependency-1', 'prompt-description', 'context-package']);
    assert.equal(mocks.length, 0);
  });

  await t.test('revocation during mock preflight prevents job admission and dispatch', async () => {
    const context = syntheticContextFixture(); const mocks = [];
    class RevokingMock extends MockTextAdapter {
      async describe() {
        context.revoke('30000000-0000-4000-8000-000000000001');
        return super.describe();
      }
    }
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: context.use,
      mockAdapterFactory: configuration => { const mock = new RevokingMock(configuration); mocks.push(mock); return mock; } });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    assert.deepEqual([...context.reads].sort(), [...SYNTHETIC_CONTEXT_READER_SLOTS].sort());
    assert.equal(mocks.length, 1);
    assert.equal(mocks[0].calls.length, 0);
    assert.equal(h.store.eventCount, 0);
  });

  await t.test('deadline during asynchronous reader prevents later protected reads', async () => {
    let context;
    context = syntheticContextFixture({ readerOverrides: { canon: bytes => {
      context.runtime.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
      return bytes;
    } } });
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: context.use });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'EXECUTION_DEADLINE_EXPIRED');
    assert.deepEqual(context.reads, ['canon']);
  });

  await t.test('successful authority await that crosses job deadline performs no protected read', async () => {
    const context = syntheticContextFixture();
    const provider = {
      ...context.use,
      async verify(input) {
        const evidence = await context.use.verify(input);
        if (input.request.action === 'execute') context.runtime.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
        return evidence;
      }
    };
    const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
      contextUseAuthorityProvider: provider });
    await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }),
      error => error.code === 'EXECUTION_DEADLINE_EXPIRED');
    assert.deepEqual(context.reads, []);
  });
});

test('corrupt pinned Context Builder bytes fail without dispatch or diagnostic content leakage', async () => {
  const context = syntheticContextFixture({ readerOverrides: { 'context-package': bytes => {
    bytes[0] ^= 1; return bytes;
  } } });
  const mocks = [];
  const h = runner({ runtime: context.runtime.runtime, syntheticContextReaders: context.contextInputProvider,
    contextUseAuthorityProvider: context.use, onMockCall({ phase, mock }) { if (phase === 'created') mocks.push(mock); } });
  await assert.rejects(() => h.value.submit({ productionSource, syntheticContext: true }), error => {
    assert.equal(error.code, 'SYNTHETIC_CONTEXT_INPUT_INVALID');
    assert.doesNotMatch(`${error.code} ${error.message}`, /Synthetic approved note|context_facts|urn:uuid:|sha256:/);
    return true;
  });
  assert.equal(mocks.length, 0);
  assert.equal(context.reads.includes('builder-result'), false);
});

test('explicit synthetic context retry reauthorizes cached context evidence without rereading fixtures', async () => {
  const context = syntheticContextFixture(); const clock = context.runtime; const mocks = [];
  const h = runner({ runtime: clock.runtime, syntheticContextReaders: context.contextInputProvider,
    contextUseAuthorityProvider: context.use,
    onMockCall({ phase, mock }) { if (phase === 'created') mocks.push(mock); } });
  const first = await h.value.submit({ productionSource, syntheticContext: true,
    noOutputResultVersion: '1.1.0', mockOutcome: { kind: 'rate-limit', retry_after_ms: 5 } });
  assert.equal(first.retry_eligible, true);
  clock.advance(5);
  const second = await h.value.retry({ authorizeRetry: true });
  assert.equal(second.result.status, 'complete');
  assert.equal(mocks.length, 2);
  assert.equal(mocks[0].calls.length, 1);
  assert.equal(mocks[1].calls.length, 1);
  assert.deepEqual([...context.reads].sort(), [...SYNTHETIC_CONTEXT_READER_SLOTS].sort());
});

test('package subpath exposes only the synthetic offline runner surface', async () => {
  const authority = authorityFixture();
  const value = createOfflineOrchestrationPrototype({ executionAuthorityProvider: authority.verifier });
  assert.deepEqual(Object.keys(value).sort(), ['closeJob', 'inspectRecovery', 'retry', 'submit']);
  const result = await value.submit({ productionSource });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.result.status, 'complete');
  await assert.rejects(() => value.retry({ authorizeRetry: true }),
    error => error.code === 'RETRY_NOT_AVAILABLE');
});

test('public factory fails closed unless a synthetic execution authority provider is installed', () => {
  assert.throws(() => createOfflineOrchestrationPrototype(),
    error => error.code === 'EXECUTION_AUTHORITY_UNAVAILABLE');
  const authority = authorityFixture();
  const readers = { id: 'studio.synthetic.comic-context-readers', mode: 'synthetic',
    readers: Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, async () => Buffer.alloc(0)])) };
  assert.throws(() => createOfflineOrchestrationPrototype({
    executionAuthorityProvider: authority.verifier, syntheticContextReaders: readers
  }), error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE');
});

test('synthetic execution authority fixture rejects empty, malformed, and duplicate decisions', () => {
  assert.throws(() => createSyntheticExecutionAuthorityVerifier([]), /Invalid synthetic execution authority fixture/);
  const authority = authorityFixture();
  const record = {
    decision_id: '30000000-0000-4000-8000-000000000001', decision: 'allow', action: 'execute',
    purpose: SYNTHETIC_EXECUTION_PURPOSE,
    production: { production_id: 'urn:uuid:10000000-0000-4000-8000-000000000001', revision: 1,
      identity_sha256: 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc' },
    not_before: '2026-01-01T00:00:00Z', review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z', authority_reference: 'https://example.test/authority'
  };
  assert.throws(() => createSyntheticExecutionAuthorityVerifier([{ ...record, unexpected: true }]),
    /Invalid synthetic execution authority fixture/);
  assert.throws(() => createSyntheticExecutionAuthorityVerifier([{
    ...record, decision_id: [record.decision_id]
  }]), /Invalid synthetic execution authority fixture/);
  assert.throws(() => createSyntheticExecutionAuthorityVerifier([{
    ...record, revocation: { status: 'revoked', checked_at: '2026-10-28T17:00:00Z' }
  }]), /Invalid synthetic execution authority fixture/);
  assert.throws(() => createSyntheticExecutionAuthorityVerifier([record, record]),
    /Invalid synthetic execution authority fixture/);
  assert.ok(authority);
});

test('denied, missing, malformed, expired, and unverifiable authority blocks input and mock use', async t => {
  const cases = ['revoked', 'missing', 'malformed', 'expired', 'unverifiable'];
  for (const mode of cases) await t.test(mode, async () => {
    let mockCreations = 0;
    let inputReads = 0;
    const base = authorityFixture(mode === 'expired' ? {
      execute: { review_after: '2026-10-01T00:00:00Z', expires_at: '2026-10-02T00:00:00Z' }
    } : {});
    if (mode === 'revoked') base.revoke('20000000-0000-4000-8000-000000000001');
    let provider = base.verifier;
    if (mode === 'missing') provider = { ...provider, async verify() { return null; } };
    if (mode === 'malformed') provider = { ...provider, async verify() { return { decision: 'allow' }; } };
    if (mode === 'unverifiable') provider = { ...provider, async verify() { throw new Error('private failure'); } };
    const store = new InMemoryPrototypeStore();
    const value = createOfflineOrchestrationPrototypeForTestRaw({
      store, runtime: createRuntime().runtime, idFactory: idFactory(),
      executionAuthorityProvider: provider,
      mockAdapterFactory() { mockCreations++; return new MockTextAdapter({ content: 'unexpected' }); }
    });
    const source = new Proxy({}, { get() { inputReads++; throw new Error('input read'); } });
    await assert.rejects(() => value.submit({ productionSource: source }), error =>
      ['EXECUTION_AUTHORITY_DENIED', 'EXECUTION_AUTHORITY_STALE', 'EXECUTION_AUTHORITY_UNAVAILABLE'].includes(error.code));
    assert.equal(inputReads, 0);
    assert.equal(mockCreations, 0);
    assert.equal(store.blobCount, 0);
    assert.equal(store.eventCount, 0);
  });
});

test('authority expiry during asynchronous verification blocks before input use', async () => {
  let wallNow = Date.UTC(2026, 9, 28, 17, 0, 0);
  const base = authorityFixture();
  const provider = {
    id: base.verifier.id, mode: 'synthetic',
    isCurrent: base.verifier.isCurrent,
    async verify(request) {
      const evidence = await base.verifier.verify(request);
      wallNow = Date.UTC(2027, 0, 1, 0, 0, 0);
      return evidence;
    }
  };
  const store = new InMemoryPrototypeStore();
  const value = createOfflineOrchestrationPrototypeForTestRaw({
    store, runtime: { ...createRuntime().runtime, wallNow: () => wallNow },
    executionAuthorityProvider: provider
  });
  let inputReads = 0;
  const source = new Proxy({}, { get() { inputReads++; throw new Error('input read'); } });
  await assert.rejects(() => value.submit({ productionSource: source }),
    error => error.code === 'EXECUTION_AUTHORITY_STALE');
  assert.equal(inputReads, 0);
  assert.equal(store.blobCount, 0);
  assert.equal(store.eventCount, 0);
});

test('authority expiry during post-preflight verification blocks admission and dispatch', async () => {
  let wallNow = Date.UTC(2026, 9, 28, 17, 0, 0);
  let verifications = 0;
  let mockCalls = 0;
  const base = authorityFixture();
  const provider = {
    id: base.verifier.id, mode: 'synthetic',
    isCurrent: base.verifier.isCurrent,
    async verify(request) {
      const evidence = await base.verifier.verify(request);
      if (++verifications === 2) wallNow = Date.UTC(2027, 0, 1, 0, 0, 0);
      return evidence;
    }
  };
  const store = new InMemoryPrototypeStore();
  const value = createOfflineOrchestrationPrototypeForTestRaw({
    store, runtime: { ...createRuntime().runtime, wallNow: () => wallNow },
    executionAuthorityProvider: provider,
    mockAdapterFactory(configuration) {
      return new (class extends MockTextAdapter {
        async execute(...args) { mockCalls++; return super.execute(...args); }
      })(configuration);
    }
  });
  await assert.rejects(() => value.submit({ productionSource }),
    error => error.code === 'EXECUTION_AUTHORITY_STALE');
  assert.equal(mockCalls, 0);
  assert.equal(store.blobCount, 0);
  assert.equal(store.eventCount, 0);
});

test('a successful authority await rechecks the deadline before job admission', async () => {
  const clock = createRuntime();
  const base = authorityFixture();
  let verifications = 0;
  let mockCalls = 0;
  const provider = {
    ...base.verifier,
    async verify(request) {
      const evidence = await base.verifier.verify(request);
      if (++verifications === 2) clock.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
      return evidence;
    }
  };
  const store = new InMemoryPrototypeStore();
  const value = createOfflineOrchestrationPrototypeForTestRaw({
    store, runtime: clock.runtime, executionAuthorityProvider: provider,
    mockAdapterFactory(configuration) {
      return new (class extends MockTextAdapter {
        async execute(...args) { mockCalls++; return super.execute(...args); }
      })(configuration);
    }
  });
  const result = await value.submit({ productionSource });
  assert.equal(result.status, 'budget-exhausted');
  assert.equal(result.reason, 'time-before-admission');
  assert.equal(mockCalls, 0);
  assert.equal(store.blobCount, 0);
  assert.equal(store.eventCount, 0);
});

test('deadline expiry during the final authority await prevents mock dispatch', async () => {
  const clock = createRuntime();
  const base = authorityFixture();
  let verifications = 0;
  let mock;
  const provider = {
    ...base.verifier,
    async verify(request) {
      const evidence = await base.verifier.verify(request);
      if (++verifications === 4) clock.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
      return evidence;
    }
  };
  const h = runner({
    runtime: clock.runtime,
    executionAuthorityProvider: provider,
    onMockCall({ phase, mock: observed }) {
      if (phase === 'dispatch-confirmed') mock = observed;
    }
  });
  const result = await h.value.submit({ productionSource });
  assert.equal(result.status, 'budget-exhausted');
  assert.equal(mock.calls.length, 0);
  assert.equal(h.store.readEvents(result.job_id).some(item => item.type === 'provider-outcome'), false);
});

test('wall-clock rollback after execution timing fails before dispatch', async () => {
  const base = authorityFixture();
  let samples = 0;
  const beforeReview = Date.UTC(2026, 9, 28, 17, 0, 0);
  const afterReview = Date.UTC(2027, 0, 2, 0, 0, 0);
  const runtime = {
    ...createRuntime().runtime,
    wallNow() { return ++samples === 8 ? afterReview : beforeReview; }
  };
  const store = new InMemoryPrototypeStore();
  const value = createOfflineOrchestrationPrototypeForTestRaw({
    store, runtime, executionAuthorityProvider: base.verifier
  });
  const result = await value.submit({ productionSource });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(samples >= 9, true);
  assert.equal(store.readEvents(result.job_id).some(item => item.type === 'dispatch-started'), false);
  assert.equal(store.readEvents(result.job_id).some(item => item.type === 'provider-outcome'), false);
});

test('wallStart clock failure clears the deadline timer and cancellation listener', async t => {
  for (const failure of ['rollback', 'non-finite']) {
    await t.test(failure, async () => {
      const runtimeState = createRuntime();
      const validWallTime = Date.UTC(2026, 9, 28, 17, 0, 0);
      let wallReads = 0;
      let clearCalls = 0;
      runtimeState.runtime.wallNow = () => {
        wallReads++;
        if (wallReads <= 6) return validWallTime;
        return failure === 'rollback' ? validWallTime - 1 : Number.NaN;
      };
      const originalClearTimer = runtimeState.runtime.clearTimer;
      runtimeState.runtime.clearTimer = timer => { clearCalls++; originalClearTimer(timer); };
      const store = new InMemoryPrototypeStore();
      const controller = new AbortController();
      const originalAdd = controller.signal.addEventListener.bind(controller.signal);
      const originalRemove = controller.signal.removeEventListener.bind(controller.signal);
      let added = 0;
      let removed = 0;
      controller.signal.addEventListener = (...args) => { added++; return originalAdd(...args); };
      controller.signal.removeEventListener = (...args) => { removed++; return originalRemove(...args); };
      let mock;
      const value = createOfflineOrchestrationPrototypeForTest({
        store, runtime: runtimeState.runtime, idFactory: idFactory(),
        onMockCall({ phase, mock: observed }) { if (phase === 'created') mock = observed; }
      });

      const result = await value.submit({ productionSource, signal: controller.signal });
      assert.equal(result.status, 'deadline-unverifiable');
      assert.equal(wallReads, 7);
      assert.equal(mock.calls.length, 0);
      assert.equal(runtimeState.timerCount, 0);
      assert.equal(clearCalls, 1);
      assert.equal(added, 1);
      assert.equal(removed, 1);
      assert.equal(store.readEvents(result.job_id).some(item => item.type === 'provider-outcome'), false);
    });
  }
});

test('Provider Execution timing uses advancing host wall-clock readings', async () => {
  const clock = createRuntime();
  let wall = Date.UTC(2026, 9, 28, 17, 0, 0);
  clock.runtime.wallNow = () => { wall += 1_000; return wall; };
  const h = runner({ runtime: clock.runtime });
  const value = createOfflineOrchestrationPrototypeForTest({ store: h.store, runtime: clock.runtime, idFactory: idFactory() });
  const result = await value.submit({ productionSource });
  assert.equal(result.result.status, 'complete');
  assert.equal(result.result.execution.finished_at > result.result.execution.started_at, true);
  const outcomeEvent = h.store.readEvents(result.job_id).find(item => item.type === 'provider-outcome');
  const providerResult = JSON.parse(h.store.readImmutable(outcomeEvent.payload_key).toString('utf8'));
  assert.equal(Date.parse(providerResult.timing.completed_at) - Date.parse(providerResult.timing.started_at),
    providerResult.timing.duration_ms);
});

test('accepts only the exact synthetic production revision before allocating IDs', async () => {
  const h = runner();
  let idsAllocated = 0;
  const nextId = idFactory();
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store, runtime: h.runtime,
    idFactory: () => { idsAllocated++; return nextId(); }
  });
  const changed = structuredClone(fixture.production);
  changed.title = 'Changed synthetic revision';
  await assert.rejects(() => value.submit({ productionSource: JSON.stringify(changed) }),
    error => error.code === 'UNSUPPORTED_PRODUCTION_REVISION');
  assert.equal(idsAllocated, 0);
  assert.equal(h.store.eventCount, 0);
  assert.equal(h.store.blobCount, 0);
  assert.equal((await value.submit({ productionSource })).result.status, 'complete');
  assert.ok(idsAllocated > 0);
});

test('a completed job consumes the in-memory store lifetime slot without another call or write', async () => {
  const h = runner();
  let idsAllocated = 0;
  let mock;
  const nextId = idFactory();
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store,
    runtime: h.runtime,
    idFactory: () => { idsAllocated++; return nextId(); },
    onMockCall: info => { if (info.phase === 'created') mock = info.mock; }
  });
  const result = await value.submit({ productionSource });
  const eventCount = h.store.eventCount;
  const blobCount = h.store.blobCount;
  const allocatedCount = idsAllocated;
  assert.equal(mock.calls.length, 1);
  await assert.rejects(() => value.submit({ productionSource }),
    error => error.code === 'JOB_STORE_LIFETIME_LIMIT');
  assert.equal(idsAllocated, allocatedCount);
  assert.equal(h.store.eventCount, eventCount);
  assert.equal(h.store.blobCount, blobCount);
  assert.equal(mock.calls.length, 1);
  assert.equal(h.store.readEvents(result.job_id).at(-1).type, 'job-closed');
  const anotherRunner = createOfflineOrchestrationPrototypeForTest({
    store: h.store, runtime: h.runtime, idFactory: idFactory()
  });
  await assert.rejects(() => anotherRunner.submit({ productionSource }),
    error => error.code === 'JOB_STORE_LIFETIME_LIMIT');
  assert.equal(h.store.eventCount, eventCount);
  assert.equal(h.store.blobCount, blobCount);
});

test('a pre-admission write failure with no stored bytes releases the store slot', async () => {
  let failFirstInput = true;
  const store = new InMemoryPrototypeStore({
    beforeBlobWrite(key) {
      if (failFirstInput && key.startsWith('input:')) { failFirstInput = false; return true; }
      return false;
    }
  });
  const clock = createRuntime();
  const value = createOfflineOrchestrationPrototypeForTest({ store, runtime: clock.runtime, idFactory: idFactory() });
  await assert.rejects(() => value.submit({ productionSource }), error => error.code === 'ADMISSION_FAILED');
  assert.equal(store.eventCount, 0);
  assert.equal(store.blobCount, 0);
  assert.equal((await value.submit({ productionSource })).result.status, 'complete');
});

test('shared-store concurrent preflights admit at most one runner and dispatch once', async () => {
  const store = new InMemoryPrototypeStore();
  const clock = createRuntime();
  let releaseDescriptions;
  const bothDescriptions = new Promise(resolve => { releaseDescriptions = resolve; });
  let descriptionCount = 0;
  const mocks = [];
  class GatedDescriptionMock extends MockTextAdapter {
    async describe() {
      descriptionCount++;
      if (descriptionCount === 2) releaseDescriptions();
      await bothDescriptions;
      return super.describe();
    }
  }
  const makeRunner = () => createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: clock.runtime,
    idFactory: idFactory(),
    mockAdapterFactory(configuration) {
      const mock = new GatedDescriptionMock(configuration);
      mocks.push(mock);
      return mock;
    }
  });
  const first = makeRunner();
  const second = makeRunner();
  const attempts = await Promise.allSettled([
    first.submit({ productionSource }),
    second.submit({ productionSource })
  ]);
  assert.equal(attempts.filter(item => item.status === 'fulfilled' && item.value.kind === 'terminal').length, 1);
  assert.equal(attempts.filter(item => item.status === 'rejected'
    && item.reason.code === 'JOB_STORE_LIFETIME_LIMIT').length, 1);
  assert.equal(store.readJobIds().length, 1);
  assert.equal(mocks.reduce((total, mock) => total + mock.calls.length, 0), 1);
});

test('pre-admission cancellation creates no job, IDs, blobs, or mock call', async () => {
  const h = runner();
  const controller = new AbortController();
  controller.abort();
  let idsAllocated = 0;
  const nextId = idFactory();
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store, runtime: h.runtime,
    idFactory: () => { idsAllocated++; return nextId(); },
    onMockCall: info => mocks.push(info.mock)
  });
  assert.equal((await value.submit({ productionSource, signal: controller.signal })).status,
    'cancelled-before-admission');
  assert.equal(idsAllocated, 0);
  assert.equal(h.store.eventCount, 0);
  assert.equal(h.store.blobCount, 0);
  assert.equal(mocks.length, 0);
  assert.equal((await value.submit({ productionSource })).result.status, 'complete');
  assert.ok(idsAllocated > 0);
});

test('cancellation during preflight description is rechecked before job admission', async () => {
  const h = runner();
  const controller = new AbortController();
  let releaseDescription;
  class DelayedDescriptionMock extends MockTextAdapter {
    describe() {
      return new Promise(resolve => {
        releaseDescription = async () => resolve(await super.describe());
      });
    }
  }
  let idsAllocated = 0;
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store,
    runtime: h.runtime,
    idFactory: () => { idsAllocated++; return '10000000-0000-4000-8000-000000000001'; },
    mockAdapterFactory: configuration => new DelayedDescriptionMock(configuration)
  });
  const pending = value.submit({ productionSource, signal: controller.signal });
  await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  await releaseDescription();
  assert.equal((await pending).status, 'cancelled-before-admission');
  assert.equal(idsAllocated, 0);
  assert.equal(h.store.eventCount, 0);
  assert.equal(h.store.blobCount, 0);
});

test('deadline reached during preflight stops before job admission', async () => {
  const h = runner();
  const start = h.runtime.now();
  const store = new InMemoryPrototypeStore({
    afterAppend() { return false; }
  });
  const clock = createRuntime({ start });
  let idsAllocated = 0;
  const delayedMockFactory = configuration => {
    class DeadlineDescriptionMock extends MockTextAdapter {
      async describe() {
        clock.set(start + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
        return super.describe();
      }
    }
    return new DeadlineDescriptionMock(configuration);
  };
  const value = createOfflineOrchestrationPrototypeForTest({
    store, runtime: clock.runtime,
    idFactory: () => { idsAllocated++; return '10000000-0000-4000-8000-000000000001'; },
    mockAdapterFactory: delayedMockFactory
  });
  const result = await value.submit({ productionSource });
  assert.equal(result.status, 'budget-exhausted');
  assert.equal(result.reason, 'time-before-admission');
  assert.equal(idsAllocated, 0);
  assert.equal(store.eventCount, 0);
  assert.equal(store.blobCount, 0);
});

test('cancellation after preparation but before dispatch records a host stop and makes no mock call', async () => {
  const controller = new AbortController();
  let aborted = false;
  const store = new InMemoryPrototypeStore({
    afterAppend(entry) {
      if (entry.type === 'prepared' && !aborted) {
        aborted = true;
        controller.abort();
      }
      return false;
    }
  });
  const h = runner({ store });
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store, runtime: h.runtime, idFactory: idFactory(),
    onMockCall: info => { if (info.phase === 'created') mocks.push(info.mock); }
  });
  const result = await value.submit({ productionSource, signal: controller.signal });
  assert.equal(result.status, 'cancelled-before-dispatch');
  const events = store.readEvents(result.job_id);
  assert.ok(events.some(entry => entry.type === 'cancelled-before-dispatch'));
  assert.equal(events.some(entry => entry.type === 'dispatch-started'), false);
  assert.equal(events.some(entry => entry.type === 'provider-outcome'), false);
  assert.equal(events.some(entry => entry.type === 'terminal'), false);
  assert.equal(mocks.length, 1);
  assert.equal(mocks[0].calls.length, 0);
  assert.equal(h.runtime.timerCount, 0);
  const beforeEvents = store.eventCount;
  const beforeBlobs = store.blobCount;
  await assert.rejects(() => value.submit({ productionSource }),
    error => error.code === 'JOB_STORE_LIFETIME_LIMIT');
  assert.equal(store.eventCount, beforeEvents);
  assert.equal(store.blobCount, beforeBlobs);
  assert.equal(mocks[0].calls.length, 0);
  let laterRunnerCreatedMock = false;
  const restarted = createOfflineOrchestrationPrototypeForTest({
    store, runtime: h.runtime, idFactory: idFactory(),
    onMockCall: () => { laterRunnerCreatedMock = true; }
  });
  await assert.rejects(() => restarted.submit({ productionSource }),
    error => error.code === 'JOB_STORE_LIFETIME_LIMIT');
  assert.equal(store.eventCount, beforeEvents);
  assert.equal(store.blobCount, beforeBlobs);
  assert.equal(laterRunnerCreatedMock, false);
});

test('deadline at the prepared-to-dispatch boundary prevents dispatch and clears controls', async () => {
  const clock = createRuntime();
  const store = new InMemoryPrototypeStore({
    afterAppend(entry) {
      if (entry.type === 'prepared') clock.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
      return false;
    }
  });
  const h = runner({ store, runtime: clock.runtime });
  let mock;
  const value = createOfflineOrchestrationPrototypeForTest({
    store, runtime: clock.runtime, idFactory: idFactory(),
    onMockCall({ phase, mock: instance }) { if (phase === 'created') mock = instance; }
  });
  const result = await value.submit({ productionSource });
  assert.equal(result.status, 'budget-exhausted');
  assert.equal(result.reason, 'time');
  assert.equal(mock.calls.length, 0);
  const entries = store.readEvents(result.job_id);
  assert.equal(entries.some(entry => entry.type === 'dispatch-started'), false);
  assert.equal(entries.some(entry => entry.type === 'provider-outcome'), false);
  assert.ok(entries.some(entry => entry.type === 'budget-exhausted' && entry.reason === 'time'));
  assert.equal(clock.timerCount, 0);
});

test('an already active job rejects another submission before allocating IDs', async () => {
  const h = runner();
  const controller = new AbortController();
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store, runtime: h.runtime, idFactory: idFactory(),
    onMockCall({ phase, mock }) {
      if (phase === 'created') mocks.push(mock);
      if (phase === 'dispatch-confirmed') setImmediate(() => controller.abort());
    }
  });
  const pending = value.submit({ productionSource, signal: controller.signal, mockOutcome: { kind: 'success', delay_ms: 5000 } });
  await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(() => value.submit({ productionSource }), error => error.code === 'JOB_ALREADY_ACTIVE');
  const result = await pending;
  assert.equal(result.status, 'contract-mapping-blocked');
  assert.equal(mocks[0].calls.length, 1);
  assert.equal(h.store.readEvents(result.job_id).some(entry => entry.type === 'dispatch-started'), true);
  assert.equal(h.store.readEvents(result.job_id).some(entry => entry.type === 'provider-outcome'), true);
});

test('deadline wins a cancellation tie before the mock call and leaves timers cleared', async () => {
  const clock = createRuntime();
  const h = runner({ runtime: clock.runtime });
  const controller = new AbortController();
  let mock;
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store,
    runtime: clock.runtime,
    idFactory: idFactory(),
    onMockCall({ phase, mock: instance }) {
      if (phase === 'created') mock = instance;
      if (phase === 'dispatch-confirmed') {
        clock.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
        controller.abort();
        clock.fireTimers();
      }
    }
  });
  const result = await value.submit({ productionSource, signal: controller.signal,
    mockOutcome: { kind: 'success', delay_ms: 5_000 } });
  assert.equal(result.status, 'budget-exhausted');
  assert.equal(mock.calls.length, 0);
  const entries = h.store.readEvents(result.job_id);
  assert.ok(entries.some(entry => entry.type === 'budget-exhausted' && entry.reason === 'time'));
  assert.equal(entries.some(entry => entry.type === 'provider-outcome'), false);
  assert.equal(entries.at(-1).type, 'job-closed');
  assert.equal(entries.some(entry => entry.type === 'terminal'), false);
  assert.equal(clock.timerCount, 0);
});

test('a provider timeout is protected and contract-mapping-blocked with no Comic Manifest result', async () => {
  const h = runner();
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store, runtime: h.runtime, idFactory: idFactory(), onMockCall: info => mocks.push(info.mock)
  });
  const result = await value.submit({ productionSource, mockOutcome: { kind: 'timeout' } });
  assert.equal(result.status, 'contract-mapping-blocked');
  assert.equal(mocks[0].calls.length, 1);
  const entries = h.store.readEvents(result.job_id);
  assert.ok(entries.some(entry => entry.type === 'contract-mapping-blocked'
    && entry.reason === 'provider-timeout-mapping-deferred'));
  const outcomeEvent = entries.find(entry => entry.type === 'provider-outcome');
  const outcome = JSON.parse(h.store.readImmutable(outcomeEvent.payload_key).toString('utf8'));
  assert.equal(outcome.status, 'timed-out');
  assert.equal(outcome.error.code, 'MOCK_TIMEOUT');
  assert.equal(entries.some(entry => entry.type === 'persisting' || entry.type === 'terminal'), false);
});

test('an eligible no-action rate limit is preserved but retry stays blocked by current result validation', async () => {
  const h = runner();
  let mock;
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store,
    runtime: h.runtime,
    idFactory: idFactory(),
    onMockCall: info => { if (info.phase === 'created') mock = info.mock; }
  });
  const result = await value.submit({ productionSource,
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 1 } });
  assert.equal(result.status, 'contract-mapping-blocked');
  assert.equal(mock.calls.length, 1);
  const entries = h.store.readEvents(result.job_id);
  const outcomeEvent = entries.find(entry => entry.type === 'provider-outcome');
  const outcome = JSON.parse(h.store.readImmutable(outcomeEvent.payload_key).toString('utf8'));
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.error.category, 'rate-limit');
  assert.equal(outcome.error.retryable, true);
  assert.equal(outcome.error.retry_after_ms, 1);
  assert.equal(outcome.error.provider.code, 'RATE_LIMITED_BEFORE_ACCEPTANCE');
  assert.ok(entries.some(entry => entry.type === 'contract-mapping-blocked'
    && entry.reason === 'no-output-result-not-representable-under-current-validator'));
  assert.equal(entries.some(entry => entry.type === 'result-prepared' || entry.type === 'terminal'), false);
  await assert.rejects(() => value.retry({ authorizeRetry: true }),
    error => error.code === 'RETRY_NOT_AVAILABLE');
  assert.equal(mock.calls.length, 1);
});

test('the maximum Provider Execution v1 retry delay is preserved without changing the retry gate', async () => {
  const h = runner();
  let mock;
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store,
    runtime: h.runtime,
    idFactory: idFactory(),
    onMockCall: info => { if (info.phase === 'created') mock = info.mock; }
  });
  const result = await value.submit({ productionSource,
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 86_400_000 } });
  assert.equal(result.status, 'contract-mapping-blocked');
  assert.equal(mock.calls.length, 1);
  const entries = h.store.readEvents(result.job_id);
  const outcomeEvent = entries.find(entry => entry.type === 'provider-outcome');
  const outcome = JSON.parse(h.store.readImmutable(outcomeEvent.payload_key).toString('utf8'));
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.error.category, 'rate-limit');
  assert.equal(outcome.error.retry_after_ms, 86_400_000);
  assert.ok(entries.some(entry => entry.type === 'contract-mapping-blocked'
    && entry.reason === 'no-output-result-not-representable-under-current-validator'));
  await assert.rejects(() => value.retry({ authorizeRetry: true }),
    error => error.code === 'RETRY_NOT_AVAILABLE');
  assert.equal(mock.calls.length, 1);
});

test('invalid rate-limit retry delays are rejected before admission, storage, or mock creation', async () => {
  const store = new InMemoryPrototypeStore();
  const clock = createRuntime();
  let factoryCalls = 0;
  const mockCallPhases = [];
  let idCalls = 0;
  const value = createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: clock.runtime,
    idFactory() {
      idCalls++;
      return `10000000-0000-4000-8000-${String(idCalls).padStart(12, '0')}`;
    },
    mockAdapterFactory(configuration) {
      factoryCalls++;
      return new MockTextAdapter(configuration);
    },
    onMockCall({ phase }) { mockCallPhases.push(phase); }
  });

  const invalidDelays = [undefined, 0, -1, 1.5, Number.NaN,
    Number.MAX_SAFE_INTEGER + 1, 86_400_001];
  for (const retryAfter of invalidDelays) {
    const mockOutcome = { kind: 'rate-limit' };
    if (retryAfter !== undefined) mockOutcome.retry_after_ms = retryAfter;
    await assert.rejects(() => value.submit({ productionSource, mockOutcome }),
      error => error.code === 'INVALID_MOCK_OUTCOME');
    assert.deepEqual(store.readJobIds(), []);
    assert.equal(store.eventCount, 0);
    assert.equal(store.blobCount, 0);
    assert.equal(factoryCalls, 0);
    assert.deepEqual(mockCallPhases, []);
    assert.equal(idCalls, 0);
  }

  // Invalid settings do not consume this store's lifetime job slot.
  const accepted = await value.submit({ productionSource });
  assert.equal(accepted.kind, 'terminal');
  assert.equal(factoryCalls, 1);
  assert.deepEqual(mockCallPhases, ['created', 'dispatch-confirmed']);
  assert.ok(idCalls > 0);
});

test('current Comic Manifest validation rejects internal no-output failure representations', () => {
  const candidate = structuredClone(fixture.result);
  candidate.status = 'failed';
  candidate.outputs = [];
  candidate.diagnostics = ['OUTPUT_MISSING'];
  candidate.execution.transformations = [];
  const noTransform = validateComicManifest(JSON.stringify(candidate));
  assert.equal(noTransform.valid, false);
  assert.ok(noTransform.diagnostics.some(item => item.stage === 'schema' && item.code === 'SCHEMA_INVALID'));

  candidate.execution.transformations = [structuredClone(fixture.result.execution.transformations[0])];
  candidate.execution.transformations[0].output_digests = [];
  candidate.execution.transformations[0].private_outputs_withheld = false;
  const emptyOutputDigests = validateComicManifest(JSON.stringify(candidate));
  assert.equal(emptyOutputDigests.valid, false);
  assert.ok(emptyOutputDigests.diagnostics.some(item => item.stage === 'semantic' && item.code === 'TRANSFORMATION'));

  candidate.execution.transformations[0].private_outputs_withheld = true;
  const withheldInternalOutput = validateComicManifest(JSON.stringify(candidate));
  assert.equal(withheldInternalOutput.valid, false);
  assert.ok(withheldInternalOutput.diagnostics.some(item => item.stage === 'semantic' && item.code === 'TRANSFORMATION'));
});

test('cancellation during provider execution preserves the SDK outcome without fabricating a Comic result', async () => {
  const h = runner();
  const controller = new AbortController();
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store: h.store, runtime: h.runtime, idFactory: idFactory(),
    onMockCall({ phase, mock }) {
      if (phase === 'created') mocks.push(mock);
      if (phase === 'dispatch-confirmed') setImmediate(() => controller.abort());
    }
  });
  const result = await value.submit({ productionSource, signal: controller.signal,
    mockOutcome: { kind: 'success', delay_ms: 5000 } });
  assert.equal(result.status, 'contract-mapping-blocked');
  assert.equal(mocks[0].calls.length, 1);
  const entries = h.store.readEvents(result.job_id);
  const outcomeEvent = entries.find(entry => entry.type === 'provider-outcome');
  const outcome = JSON.parse(h.store.readImmutable(outcomeEvent.payload_key).toString('utf8'));
  assert.equal(outcome.status, 'cancelled');
  assert.equal(entries.some(entry => entry.type === 'terminal'), false);
});

test('unconfirmed dispatch marker prevents the only mock call and blocks future work', async () => {
  let ambiguous = false;
  const store = new InMemoryPrototypeStore({
    afterAppend(entry) {
      if (entry.type === 'dispatch-started') { ambiguous = true; return true; }
      return false;
    },
    unknownEvents: () => ambiguous
  });
  const h = runner({ store });
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store, runtime: h.runtime, idFactory: idFactory(), onMockCall: info => mocks.push(info.mock)
  });
  const result = await value.submit({ productionSource });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(mocks[0].calls.length, 0);
  await assert.rejects(() => value.submit({ productionSource }), error => error.code === 'JOB_ALREADY_ACTIVE');
});

test('ambiguous outcome, artifact, result, and terminal writes never repeat or finalize', async t => {
  const cases = [
    ['provider outcome blob', key => key.startsWith('provider-outcome:'), 'dispatch-started'],
    ['artifact blob', key => key.startsWith('artifact:'), 'result-prepared'],
    ['result blob', key => key.startsWith('result:'), 'persisting']
  ];
  for (const [name, shouldFail, lastExpectedEvent] of cases) {
    await t.test(name, async () => {
      let failed = false;
      const store = new InMemoryPrototypeStore({
        afterBlobWrite(key) {
          if (!failed && shouldFail(key)) { failed = true; return true; }
          return false;
        },
        unknownBlob: key => failed && shouldFail(key)
      });
      const h = runner({ store });
      const mocks = [];
      const value = createOfflineOrchestrationPrototypeForTest({
        store, runtime: h.runtime, idFactory: idFactory(), onMockCall: info => mocks.push(info.mock)
      });
      const result = await value.submit({ productionSource });
      assert.equal(result.status, 'reconciliation-required');
      assert.equal(mocks[0].calls.length, 1);
      const entries = store.readEvents(result.job_id);
      assert.equal(entries.at(-1).type, lastExpectedEvent);
      assert.equal(entries.some(entry => entry.type === 'terminal'), false);
      assert.equal(entries.filter(entry => entry.type === 'dispatch-started').length, 1);
      await assert.rejects(() => value.submit({ productionSource }), error => error.code === 'JOB_ALREADY_ACTIVE');
    });
  }

  await t.test('terminal index append', async () => {
    let ambiguous = false;
    const store = new InMemoryPrototypeStore({
      afterAppend(entry) {
        if (entry.type === 'terminal') { ambiguous = true; return true; }
        return false;
      },
      unknownEvents: () => ambiguous
    });
    const h = runner({ store });
    const value = createOfflineOrchestrationPrototypeForTest({ store, runtime: h.runtime, idFactory: idFactory() });
    const result = await value.submit({ productionSource });
    assert.equal(result.status, 'reconciliation-required');
    assert.equal(store.readEvents(result.job_id).state, 'unknown');
    assert.equal(ambiguous, true);
  });
});

test('read-only recovery does not write, call, reset the deadline, or infer absence', async () => {
  let unknownEvents = false;
  const store = new InMemoryPrototypeStore({ unknownEvents: () => unknownEvents });
  const h = runner({ store });
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    store, runtime: h.runtime, idFactory: idFactory(),
    onMockCall: info => { if (info.phase === 'created') mocks.push(info.mock); }
  });
  const result = await value.submit({ productionSource, mockOutcome: { kind: 'timeout' } });
  const beforeEvents = store.eventCount;
  const beforeBlobs = store.blobCount;

  const restarted = createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: { ...h.runtime, epochId: 'different-clock-epoch' },
    idFactory: idFactory(),
    onMockCall: info => mocks.push(info.mock)
  });
  const unknownClock = restarted.inspectRecovery(result.job_id);
  assert.equal(unknownClock.status, 'contract-mapping-blocked');
  assert.equal(unknownClock.read_only, true);
  assert.equal(store.eventCount, beforeEvents);
  assert.equal(store.blobCount, beforeBlobs);
  assert.equal(mocks.length, 1);

  const sameEpochRestart = createOfflineOrchestrationPrototypeForTest({ store, runtime: h.runtime, idFactory: idFactory() });
  unknownEvents = true;
  assert.equal(sameEpochRestart.inspectRecovery(result.job_id).status, 'reconciliation-required');
  assert.equal(store.eventCount, beforeEvents);
  assert.equal(store.blobCount, beforeBlobs);
});

test('a restarted instance refuses to admit a second job while the stored job is unresolved', async () => {
  let unknownEvents = false;
  const store = new InMemoryPrototypeStore({
    afterAppend(entry) { if (entry.type === 'dispatch-started') { unknownEvents = true; return true; } return false; },
    unknownEvents: () => unknownEvents
  });
  const h = runner({ store });
  const first = createOfflineOrchestrationPrototypeForTest({ store, runtime: h.runtime, idFactory: idFactory() });
  const result = await first.submit({ productionSource });
  const restarted = createOfflineOrchestrationPrototypeForTest({ store, runtime: h.runtime, idFactory: idFactory() });
  await assert.rejects(() => restarted.submit({ productionSource }),
    error => error.code === 'JOB_STATE_UNRESOLVED');
  assert.equal(result.status, 'reconciliation-required');
});

test('an orphaned pre-admission input blob prevents a restarted instance from overlapping work', async () => {
  const store = new InMemoryPrototypeStore({
    beforeAppend(entry) { return entry.type === 'admitted'; }
  });
  const h = runner({ store });
  const first = createOfflineOrchestrationPrototypeForTest({ store, runtime: h.runtime, idFactory: idFactory() });
  const result = await first.submit({ productionSource });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(store.readEvents(result.job_id).length, 0);
  assert.equal(store.readJobIds().includes(result.job_id), true);
  const restarted = createOfflineOrchestrationPrototypeForTest({ store, runtime: h.runtime, idFactory: idFactory() });
  await assert.rejects(() => restarted.submit({ productionSource }),
    error => error.code === 'JOB_STATE_UNRESOLVED');
});

test('deadline expiry does not hide a committed terminal result during read-only inspection', async () => {
  const clock = createRuntime();
  const h = runner({ runtime: clock.runtime });
  const value = createOfflineOrchestrationPrototypeForTest({ store: h.store, runtime: clock.runtime, idFactory: idFactory() });
  const result = await value.submit({ productionSource });
  clock.set(10_000 + OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
  const inspection = value.inspectRecovery(result.job_id);
  assert.equal(inspection.status, 'terminal');
  assert.equal(inspection.read_only, true);
  assert.equal(inspection.writes_performed, 0);
  assert.equal(inspection.provider_calls_performed, 0);
});

test('read-only recovery requires every terminal artifact to be readable and match its result', async () => {
  let unreadableArtifact;
  const store = new InMemoryPrototypeStore({
    unknownBlob: key => key === unreadableArtifact
  });
  const clock = createRuntime();
  const value = createOfflineOrchestrationPrototypeForTest({ store, runtime: clock.runtime, idFactory: idFactory() });
  const result = await value.submit({ productionSource });
  unreadableArtifact = `artifact:${result.result.outputs[0].artifact.artifact_uri}`;
  const beforeEvents = store.eventCount;
  const beforeBlobs = store.blobCount;
  const inspection = value.inspectRecovery(result.job_id);
  assert.equal(inspection.status, 'reconciliation-required');
  assert.equal(inspection.read_only, true);
  assert.equal(store.eventCount, beforeEvents);
  assert.equal(store.blobCount, beforeBlobs);
});

test('input, prompt, output, artifact, aggregate, metadata and checked arithmetic caps reject before exceeding limits', async t => {
  const limits = OFFLINE_ORCHESTRATION_LIMITS;
  assert.equal(limits.maxManifestBytes, COMIC_MANIFEST_LIMITS.maxBytes);
  assert.equal(limits.maxManifestDepth, COMIC_MANIFEST_LIMITS.maxDepth);
  assert.equal(limits.maxManifestValues, COMIC_MANIFEST_LIMITS.maxValues);
  assert.equal(limits.maxManifestStringBytes, COMIC_MANIFEST_LIMITS.maxStringBytes);
  assert.equal(assertAtMost(limits.maxPromptBytesPerAttempt, limits.maxPromptBytesPerAttempt, 'PROMPT_LIMIT'),
    limits.maxPromptBytesPerAttempt);
  assert.throws(() => assertAtMost(limits.maxPromptBytesPerAttempt + 1,
    limits.maxPromptBytesPerAttempt, 'PROMPT_LIMIT'), error => error.code === 'PROMPT_LIMIT');
  assert.equal(assertAtMost(limits.maxNormalizedOutputBytesPerCall,
    limits.maxNormalizedOutputBytesPerCall, 'OUTPUT_LIMIT'), limits.maxNormalizedOutputBytesPerCall);
  assert.throws(() => assertAtMost(limits.maxNormalizedOutputBytesPerCall + 1,
    limits.maxNormalizedOutputBytesPerCall, 'OUTPUT_LIMIT'), error => error.code === 'OUTPUT_LIMIT');
  assert.equal(checkedAdd(Number.MAX_SAFE_INTEGER, 1), undefined);

  const ledger = new MaterialLedger();
  assert.equal(ledger.charge('input', limits.maxAggregateMaterialBytesPerJob
    - ledger.metadataReserveBytes), true);
  assert.equal(ledger.charge('one-byte-over', 1), false);

  const artifactLedger = new MaterialLedger();
  assert.equal(artifactLedger.reserve('artifact-a', limits.maxGeneratedArtifactBytesPerJob, { artifact: true }), true);
  assert.equal(artifactLedger.reserve('artifact-b', 1, { artifact: true }), false);

  await t.test('oversized mock output is rejected before SDK normalization and storage', async () => {
    const h = runner();
    const mocks = [];
    const oversizedContent = 'x'.repeat(limits.maxNormalizedOutputBytesPerCall + 1);
    const value = createOfflineOrchestrationPrototypeForTest({
      store: h.store,
      runtime: h.runtime,
      idFactory: idFactory(),
      mockAdapterFactory: () => new MockTextAdapter({ content: oversizedContent }),
      onMockCall: info => mocks.push(info.mock)
    });
    const result = await value.submit({ productionSource });
    assert.equal(result.status, 'contract-mapping-blocked');
    assert.equal(mocks[0].calls.length, 1);
    const providerOutcome = h.store.readEvents(result.job_id).find(entry => entry.type === 'provider-outcome');
    const storedOutcome = h.store.readImmutable(providerOutcome.payload_key).toString('utf8');
    assert.equal(storedOutcome.includes(oversizedContent), false);
    assert.equal(storedOutcome.includes('NORMALIZED_OUTPUT_LIMIT_EXCEEDED'), false);
  });

  await t.test('manifest parser limits used by the prototype remain the current Comic Manifest limits', async () => {
    const h = runner();
    let calls = 0;
    const value = createOfflineOrchestrationPrototypeForTest({
      store: h.store, runtime: h.runtime, idFactory: idFactory(), onMockCall: () => { calls++; }
    });
    const oversized = ' '.repeat(limits.maxManifestBytes + 1);
    await assert.rejects(() => value.submit({ productionSource: oversized }),
      error => error.code === 'INVALID_SYNTHETIC_PRODUCTION');
    assert.equal(calls, 0);
    assert.equal(h.store.eventCount, 0);
  });
});

test('lifecycle metadata enforces per-entry and per-job entry ceilings', () => {
  const store = new InMemoryPrototypeStore();
  assert.throws(() => store.append({ job_id: 'job-test', type: 'too-large', data: 'x'.repeat(32 * 1024) }),
    /LIFECYCLE_METADATA_LIMIT/);
  for (let index = 0; index < OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob; index++) {
    store.append({ job_id: 'job-test', type: `entry-${index}` });
  }
  assert.equal(store.readEvents('job-test').length, 32);
  assert.throws(() => store.append({ job_id: 'job-test', type: 'entry-over' }), /LIFECYCLE_METADATA_LIMIT/);
});

const candidateOptions = { productionSource, noOutputResultVersion: '1.1.0', mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 } };
test('explicit candidate enables one delayed caller-authorized retry with immutable history and fresh identities', async () => {
  const clock = createRuntime(); const h = runner({ runtime: clock.runtime });
  const first = await h.value.submit(candidateOptions);
  assert.equal(first.kind, 'terminal'); assert.equal(first.retry_eligible, true);
  assert.equal(first.result.spec_version, '1.1.0'); assert.equal(first.result.status, 'failed');
  assert.deepEqual(first.result.outputs, []); assert.deepEqual(first.result.diagnostics, ['OUTPUT_MISSING']);
  assert.deepEqual(first.result.execution.transformations[0].output_digests, []);
  assert.equal(validateComicManifest(JSON.stringify(first.result)).valid, false);
  const original = h.store.readImmutable(`result:${first.result.result_id}`);
  const eventsBefore = h.store.readEvents(first.job_id);
  await assert.rejects(() => h.value.retry(), e => e.code === 'EXPLICIT_RETRY_AUTHORIZATION_REQUIRED');
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_DELAY_NOT_ELAPSED');
  assert.deepEqual(h.store.readEvents(first.job_id), eventsBefore);
  clock.advance(10);
  const second = await h.value.retry({ authorizeRetry: true });
  assert.equal(second.kind, 'terminal'); assert.equal(second.result.status, 'complete');
  assert.equal(second.retry_eligible, false); assert.equal(second.result.spec_version, '1.0.0');
  for (const field of ['attempt_id', 'execution_id']) assert.notEqual(first[field], second[field]);
  assert.notEqual(first.result.result_id, second.result.result_id);
  assert.deepEqual(second.result.production, first.result.production);
  assert.deepEqual(h.store.readImmutable(`result:${first.result.result_id}`), original);
  const events = h.store.readEvents(first.job_id);
  assert.equal(events.filter(e => e.type === 'dispatch-started').length, 2);
  assert.equal(events.filter(e => e.type === 'prepared')[1].retry_of_attempt_id, first.attempt_id);
  assert.equal(events.at(-1).type, 'job-closed');
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
});

test('retry authority is rechecked before reading protected retry evidence', async () => {
  const clock = createRuntime();
  const store = new InMemoryPrototypeStore();
  const h = runner({ store, runtime: clock.runtime });
  const first = await h.value.submit(candidateOptions);
  const originalRead = store.readImmutable.bind(store);
  let reads = 0;
  store.readImmutable = key => { reads++; return originalRead(key); };
  const before = reads;
  h.authority.revoke('20000000-0000-4000-8000-000000000002');
  clock.advance(10);
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }),
    error => error.code === 'EXECUTION_AUTHORITY_DENIED');
  assert.equal(reads, before);
  assert.equal(store.readEvents(first.job_id).filter(e => e.type === 'dispatch-started').length, 1);
});

test('retry authority is rechecked after asynchronous mock preflight', async () => {
  const clock = createRuntime();
  const authority = authorityFixture();
  let descriptions = 0;
  const mocks = [];
  class RevokingMock extends MockTextAdapter {
    async describe() {
      if (++descriptions === 2) authority.revoke('20000000-0000-4000-8000-000000000002');
      return super.describe();
    }
  }
  const h = runner({
    runtime: clock.runtime,
    executionAuthorityProvider: authority.verifier,
    mockAdapterFactory: configuration => { const mock = new RevokingMock(configuration); mocks.push(mock); return mock; }
  });
  const first = await h.value.submit(candidateOptions);
  clock.advance(10);
  assert.equal((await h.value.retry({ authorizeRetry: true })).status, 'authorization-denied');
  assert.equal(mocks.reduce((count, mock) => count + mock.calls.length, 0), 1);
  assert.equal(h.store.readEvents(first.job_id).filter(e => e.type === 'dispatch-started').length, 1);
});

test('retry evidence is revalidated after final authority await before mock dispatch', async () => {
  const clock = createRuntime();
  let unknownEvidence = false;
  const store = new InMemoryPrototypeStore({
    unknownBlob: key => unknownEvidence && key.startsWith('provider-outcome:')
  });
  const authority = authorityFixture();
  let retryVerifications = 0;
  const provider = {
    ...authority.verifier,
    async verify(request) {
      const evidence = await authority.verifier.verify(request);
      if (request.action === 'retry' && ++retryVerifications === 3) unknownEvidence = true;
      return evidence;
    }
  };
  const mocks = [];
  const h = runner({
    store, runtime: clock.runtime, executionAuthorityProvider: provider,
    mockAdapterFactory: configuration => {
      const mock = new MockTextAdapter(configuration);
      mocks.push(mock);
      return mock;
    }
  });
  const first = await h.value.submit(candidateOptions);
  clock.advance(10);
  const result = await h.value.retry({ authorizeRetry: true });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(mocks.reduce((count, mock) => count + mock.calls.length, 0), 1);
  assert.equal(store.readEvents(first.job_id).filter(item => item.type === 'dispatch-started').length, 2);
  assert.equal(store.readEvents(first.job_id).some(item =>
    item.type === 'provider-outcome' && item.attempt_id !== first.attempt_id), false);
});

test('revocation scheduled during final authority verification prevents mock dispatch', async () => {
  const authority = authorityFixture();
  let verifications = 0;
  const provider = {
    ...authority.verifier,
    async verify(request) {
      const evidence = await authority.verifier.verify(request);
      if (++verifications === 4) queueMicrotask(() =>
        authority.revoke('20000000-0000-4000-8000-000000000001'));
      return evidence;
    }
  };
  const mocks = [];
  const h = runner({
    executionAuthorityProvider: provider,
    mockAdapterFactory: configuration => {
      const mock = new MockTextAdapter(configuration);
      mocks.push(mock);
      return mock;
    }
  });
  const result = await h.value.submit({ productionSource });
  assert.equal(result.status, 'authorization-denied');
  assert.equal(mocks.reduce((count, mock) => count + mock.calls.length, 0), 0);
});

test('cancellation during final authority verification prevents mock dispatch', async () => {
  const authority = authorityFixture();
  const controller = new AbortController();
  let verifications = 0;
  const provider = {
    ...authority.verifier,
    async verify(request) {
      const evidence = await authority.verifier.verify(request);
      if (++verifications === 4) controller.abort();
      return evidence;
    }
  };
  let mock;
  const h = runner({
    executionAuthorityProvider: provider,
    onMockCall({ phase, mock: observed }) {
      if (phase === 'dispatch-confirmed') mock = observed;
    }
  });
  const result = await h.value.submit({ productionSource, signal: controller.signal });
  assert.ok(['cancelled-before-dispatch', 'contract-mapping-blocked'].includes(result.status));
  assert.equal(verifications, 4);
  assert.equal(mock.calls.length, 0);
});

test('authority revoked by a synchronous dispatch observer prevents the mock call', async () => {
  const authority = authorityFixture();
  let mock;
  const h = runner({
    executionAuthorityProvider: authority.verifier,
    onMockCall({ phase, mock: observed }) {
      mock = observed;
      if (phase === 'dispatch-confirmed') authority.revoke('20000000-0000-4000-8000-000000000001');
    }
  });
  assert.equal((await h.value.submit({ productionSource })).status, 'authorization-denied');
  assert.equal(mock.calls.length, 0);
});

test('second rate limit is terminal and cannot open a third attempt', async () => {
  const clock = createRuntime(); const h = runner({ runtime: clock.runtime });
  const first = await h.value.submit(candidateOptions); clock.advance(10);
  const second = await h.value.retry({ authorizeRetry: true, mockOutcome: candidateOptions.mockOutcome });
  assert.equal(second.result.status, 'failed'); assert.equal(second.retry_eligible, false);
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
  assert.equal(h.store.readEvents(first.job_id).filter(e => e.type === 'dispatch-started').length, 2);
});

for (const kind of ['timeout', 'output-validation']) test(`candidate does not map or retry ${kind}`, async () => {
  const h = runner(); const r = await h.value.submit({ ...candidateOptions, mockOutcome: { kind } });
  assert.equal(r.status, 'contract-mapping-blocked');
  assert.equal(h.store.readEvents(r.job_id).some(e => e.type === 'terminal'), false);
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
});

test('candidate refuses unsupported versions before admission', async () => {
  const h = runner();
  await assert.rejects(() => h.value.submit({ ...candidateOptions, noOutputResultVersion: '1.2.0' }), e => e.code === 'UNSUPPORTED_RESULT_VERSION');
  assert.equal(h.store.blobCount, 0); assert.equal(h.store.eventCount, 0);
});

test('eligible retry expires within the original deadline and permits explicit close', async () => {
  const clock = createRuntime(); const h = runner({ runtime: clock.runtime });
  const r = await h.value.submit({ ...candidateOptions, mockOutcome: { kind: 'rate-limit', retry_after_ms: 86_400_000 } });
  assert.equal(r.retry_eligible, true); clock.advance(300_000);
  assert.equal((await h.value.retry({ authorizeRetry: true })).status, 'budget-exhausted');
  assert.equal(h.store.readEvents(r.job_id).filter(e => e.type === 'dispatch-started').length, 1);
  const another = runner(); await another.value.submit(candidateOptions);
  assert.equal(another.value.closeJob().status, 'closed-without-retry');
});

for (const target of ['input:', 'prompt:', 'result:', 'provider-outcome:']) test(`retry rechecks ${target} immutable evidence`, async () => {
  let breakRead = false;
  const store = new InMemoryPrototypeStore({ unknownBlob: key => breakRead && key.startsWith(target) });
  const clock = createRuntime(); const h = runner({ store, runtime: clock.runtime });
  const r = await h.value.submit(candidateOptions); assert.equal(r.kind, 'terminal');
  breakRead = true; clock.advance(10);
  assert.equal((await h.value.retry({ authorizeRetry: true })).status, 'reconciliation-required');
  assert.equal(store.readEvents(r.job_id).filter(e => e.type === 'dispatch-started').length, 1);
});

for (const phase of ['result-prepared', 'persisting', 'terminal']) test(`unconfirmed ${phase} never authorizes retry`, async () => {
  const store = new InMemoryPrototypeStore({ beforeAppend: e => e.type === phase });
  const h = runner({ store }); const r = await h.value.submit(candidateOptions);
  assert.equal(r.status, 'reconciliation-required');
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
  assert.equal(store.readEvents(r.job_id).filter(e => e.type === 'dispatch-started').length, 1);
});

test('candidate cancellation during dispatch remains unmapped and cannot retry', async () => {
  const controller = new AbortController();
  const h = runner({ onMockCall({ phase }) { if (phase === 'dispatch-confirmed') setImmediate(() => controller.abort()); } });
  const r = await h.value.submit({ ...candidateOptions, signal: controller.signal, mockOutcome: { kind: 'success', delay_ms: 5000 } });
  assert.equal(r.status, 'contract-mapping-blocked');
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
});

test('recovery of a candidate terminal attempt is read-only and cannot resume a retry', async () => {
  const h = runner(); const r = await h.value.submit(candidateOptions);
  const counts = [h.store.blobCount, h.store.eventCount];
  const restarted = createOfflineOrchestrationPrototypeForTest({ store: h.store, runtime: h.runtime });
  assert.equal(restarted.inspectRecovery(r.job_id).read_only, true);
  await assert.rejects(() => restarted.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
  assert.deepEqual([h.store.blobCount, h.store.eventCount], counts);
});

test('candidate retry rechecks proof after asynchronous mock preflight', async () => {
  let breakRead = false; let descriptions = 0;
  const store = new InMemoryPrototypeStore({ unknownBlob: key => breakRead && key.startsWith('provider-outcome:') });
  class ChangingMock extends MockTextAdapter {
    async describe() { if (++descriptions === 2) breakRead = true; return super.describe(); }
  }
  const clock = createRuntime(); const h = runner({ store, runtime: clock.runtime, mockAdapterFactory: config => new ChangingMock(config) });
  const r = await h.value.submit(candidateOptions); clock.advance(10);
  assert.equal((await h.value.retry({ authorizeRetry: true })).status, 'reconciliation-required');
  assert.equal(store.readEvents(r.job_id).filter(e => e.type === 'dispatch-started').length, 1);
});

for (const [name, error] of [
  ['missing safe proof', { category: 'rate-limit', retryable: true, retry_after_ms: 10 }],
  ['different safe proof', { category: 'rate-limit', retryable: true, retry_after_ms: 10, provider: { code: 'REQUEST_MAY_HAVE_STARTED' } }],
  ['not retryable', { category: 'rate-limit', retryable: false, provider: { code: 'RATE_LIMITED_BEFORE_ACCEPTANCE' } }],
  ['missing delay', { category: 'rate-limit', retryable: true, provider: { code: 'RATE_LIMITED_BEFORE_ACCEPTANCE' } }],
  ['wrong category', { category: 'transport', retryable: true, retry_after_ms: 10, provider: { code: 'RATE_LIMITED_BEFORE_ACCEPTANCE' } }]
]) test(`protected outcome ${name} never authorizes a terminal no-output result`, async () => {
  const h = runner({ mockAdapterFactory: config => new MockTextAdapter({ ...config, error: { ...error, code: 'SYNTHETIC_REJECTED', message: 'Synthetic failure.', stage: 'provider' } }) });
  const r = await h.value.submit(candidateOptions);
  assert.equal(r.status, 'contract-mapping-blocked');
  assert.equal(h.store.readEvents(r.job_id).some(e => e.type === 'terminal'), false);
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
});

test('unknown terminal links after commitment prevent retry without allocating new IDs', async () => {
  let hideEvents = false; let allocated = 0; const nextId = idFactory();
  const store = new InMemoryPrototypeStore({ unknownEvents: () => hideEvents });
  const clock = createRuntime(); const h = runner({ store, runtime: clock.runtime, idFactory: () => { allocated++; return nextId(); } });
  await h.value.submit(candidateOptions); const before = allocated; hideEvents = true; clock.advance(10);
  assert.equal((await h.value.retry({ authorizeRetry: true })).status, 'reconciliation-required');
  assert.equal(allocated, before);
});

test('cancelled retry authorization does not consume a second attempt', async () => {
  const clock = createRuntime(); const h = runner({ runtime: clock.runtime });
  const r = await h.value.submit(candidateOptions); clock.advance(10);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(() => h.value.retry({ authorizeRetry: true, signal: controller.signal }), e => e.code === 'RETRY_CANCELLED');
  assert.equal(h.store.readEvents(r.job_id).filter(e => e.type === 'dispatch-started').length, 1);
  assert.equal((await h.value.retry({ authorizeRetry: true })).result.status, 'complete');
});

for (const outcome of ['output-validation', 'cancelled', 'mismatched-success']) test(`confirmed unmappable second ${outcome} closes only the host job and preserves evidence`, async () => {
  const clock = createRuntime(); const controller = new AbortController(); let calls = 0;
  const h = runner({ runtime: clock.runtime,
    mockAdapterFactory: config => {
      calls++;
      return new MockTextAdapter(outcome === 'mismatched-success' && calls === 2 ? { ...config, content: 'Different synthetic output.' } : config);
    },
    onMockCall({ phase }) { if (outcome === 'cancelled' && calls === 2 && phase === 'dispatch-confirmed') setImmediate(() => controller.abort()); }
  });
  const first = await h.value.submit(candidateOptions);
  const original = h.store.readImmutable(`result:${first.result.result_id}`);
  clock.advance(10);
  const second = await h.value.retry({ authorizeRetry: true, signal: controller.signal,
    mockOutcome: outcome === 'output-validation' ? { kind: outcome } : { kind: 'success', delay_ms: outcome === 'cancelled' ? 5000 : 0 } });
  assert.equal(second.status, 'contract-mapping-blocked');
  assert.equal(second.job_closed, true);
  const events = h.store.readEvents(first.job_id);
  assert.equal(events.at(-1).type, 'job-closed');
  assert.equal(events.at(-1).reason, 'retry-contract-mapping-blocked');
  const outcomes = events.filter(e => e.type === 'provider-outcome');
  assert.equal(outcomes.length, 2);
  const lastOutcome = JSON.parse(h.store.readImmutable(outcomes[1].payload_key));
  assert.equal(lastOutcome.status, outcome === 'cancelled' ? 'cancelled' : outcome === 'mismatched-success' ? 'succeeded' : 'failed');
  if (outcome === 'mismatched-success') assert.equal(lastOutcome.output.content, 'Different synthetic output.');
  assert.deepEqual(h.store.readImmutable(`result:${first.result.result_id}`), original);
  assert.equal(events.filter(e => e.type === 'terminal').length, 1);
  assert.equal(h.value.inspectRecovery(first.job_id).status, 'terminal');
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
  await assert.rejects(() => h.value.submit({ productionSource }), e => e.code === 'JOB_STORE_LIFETIME_LIMIT');
});

for (const fault of ['outcome-readback', 'mapping-append', 'close-append', 'ambiguous-close']) test(`unmappable retry with ${fault} uncertainty remains unresolved`, async () => {
  let armed = false; let unknownEvents = false; let unknownOutcome;
  const store = new InMemoryPrototypeStore({
    afterBlobWrite(key) { if (armed && fault === 'outcome-readback' && key.startsWith('provider-outcome:')) unknownOutcome = key; },
    unknownBlob: key => key === unknownOutcome,
    beforeAppend(e) { return armed && ((fault === 'mapping-append' && e.type === 'contract-mapping-blocked') || (fault === 'close-append' && e.type === 'job-closed')); },
    afterAppend(e) { if (armed && fault === 'ambiguous-close' && e.type === 'job-closed') { unknownEvents = true; return true; } },
    unknownEvents: () => unknownEvents
  });
  const clock = createRuntime(); const h = runner({ store, runtime: clock.runtime });
  const first = await h.value.submit(candidateOptions); clock.advance(10); armed = true;
  const second = await h.value.retry({ authorizeRetry: true, mockOutcome: { kind: 'output-validation' } });
  assert.equal(second.status, 'reconciliation-required');
  assert.equal(second.job_closed, undefined);
  const inspection = h.value.inspectRecovery(first.job_id);
  assert.equal(inspection.read_only, true);
  assert.equal(inspection.status, fault === 'ambiguous-close' ? 'reconciliation-required'
    : fault === 'close-append' ? 'contract-mapping-blocked' : 'read-only-inspection-required');
  if (!unknownEvents) assert.equal(store.readEvents(first.job_id).some(e => e.type === 'job-closed'), false);
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
});

test('a timed-out second attempt preserves uncertainty without closing or fabricating a result', async () => {
  const clock = createRuntime(); const h = runner({ runtime: clock.runtime });
  const first = await h.value.submit(candidateOptions); clock.advance(10);
  const second = await h.value.retry({ authorizeRetry: true, mockOutcome: { kind: 'timeout' } });
  assert.equal(second.status, 'contract-mapping-blocked');
  assert.equal(second.job_closed, undefined);
  const events = h.store.readEvents(first.job_id);
  assert.equal(events.some(e => e.type === 'job-closed'), false);
  assert.equal(events.filter(e => e.type === 'terminal').length, 1);
  assert.equal(events.filter(e => e.type === 'provider-outcome').length, 2);
  await assert.rejects(() => h.value.retry({ authorizeRetry: true }), e => e.code === 'RETRY_NOT_AVAILABLE');
});
