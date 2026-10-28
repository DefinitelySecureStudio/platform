import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  COMIC_MANIFEST_LIMITS,
  validateComicManifest,
  validateComicOutputCompatibility
} from '../../src/comic-manifest/index.js';
import { createOfflineOrchestrationPrototype } from '@definitely-secure-studio/platform/offline-orchestration-prototype';
import { canonicalJson, MockTextAdapter } from '../../src/prompt-sdk/index.js';
import {
  createOfflineOrchestrationPrototypeForTest,
  InMemoryPrototypeStore,
  MaterialLedger,
  assertAtMost,
  checkedAdd
} from '../../src/offline-orchestration-prototype/testing.js';
import { OFFLINE_ORCHESTRATION_LIMITS } from '../../src/offline-orchestration-prototype/limits.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
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

function runner({ store = new InMemoryPrototypeStore(), runtime = createRuntime().runtime, ...seams } = {}) {
  return {
    store,
    value: createOfflineOrchestrationPrototypeForTest({ store, runtime, idFactory: idFactory(), ...seams }),
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

test('package subpath exposes only the synthetic offline runner surface', async () => {
  const value = createOfflineOrchestrationPrototype();
  assert.deepEqual(Object.keys(value).sort(), ['closeJob', 'inspectRecovery', 'retry', 'submit']);
  const result = await value.submit({ productionSource });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.result.status, 'complete');
  await assert.rejects(() => value.retry({ authorizeRetry: true }),
    error => error.code === 'RETRY_NOT_AVAILABLE');
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

test('deadline wins a cancellation tie after dispatch and leaves timers cleared', async () => {
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
  assert.equal(result.status, 'contract-mapping-blocked');
  assert.equal(mock.calls.length, 1);
  const entries = h.store.readEvents(result.job_id);
  assert.ok(entries.some(entry => entry.type === 'budget-exhausted' && entry.reason === 'time'));
  assert.ok(entries.some(entry => entry.type === 'contract-mapping-blocked'
    && entry.reason === 'no-output-result-not-representable-under-current-validator'));
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
