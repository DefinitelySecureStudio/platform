import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createSyntheticExecutionAuthorityVerifier,
  SYNTHETIC_EXECUTION_PURPOSE
} from '../../src/offline-orchestration-prototype/execution-authority.js';
import { createOfflineOrchestrationPrototype } from '../../src/offline-orchestration-prototype/index.js';
import { MockTextAdapter } from '../../src/prompt-sdk/index.js';
import {
  createOfflineOrchestrationPrototypeForTest,
  LocalFilePrototypeStore
} from '../../src/offline-orchestration-prototype/testing.js';
import { UNKNOWN_STORE_STATE } from '../../src/offline-orchestration-prototype/memory-store.js';
import { canonicalJson } from '../../src/prompt-sdk/index.js';
import { OFFLINE_ORCHESTRATION_LIMITS } from '../../src/offline-orchestration-prototype/limits.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
const productionSource = JSON.stringify(fixture.production);
const stableStart = Date.parse('2026-11-08T02:40:00Z');

function authority() {
  const production = {
    production_id: 'urn:uuid:10000000-0000-4000-8000-000000000001',
    revision: 1,
    identity_sha256: 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc'
  };
  const record = (action, suffix) => ({
    decision_id: `20000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    decision: 'allow', action, purpose: SYNTHETIC_EXECUTION_PURPOSE, production,
    not_before: '2026-01-01T00:00:00Z', review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/109'
  });
  return createSyntheticExecutionAuthorityVerifier([record('execute', '1'), record('retry', '2')]);
}

function runtime(epochId = 'original-monotonic-epoch') {
  let monotonic = 10_000;
  return {
    now: () => monotonic,
    epochId,
    wallNow: () => Date.parse('2026-11-08T02:40:00Z'),
    setTimer: () => 1,
    clearTimer: () => {},
    advance: delta => { monotonic += delta; }
  };
}

function resumeAuthority({ domain = 'synthetic-resume-time-v1', epoch = 'fixture-epoch-1', now } = {}) {
  return {
    id: 'studio.synthetic.resume-time-v1',
    mode: 'synthetic',
    domain_id: domain,
    epoch_id: epoch,
    now: now ?? (() => stableStart)
  };
}

function createRunner(store, { timeAuthority = resumeAuthority(), monotonicEpoch = 'original-monotonic-epoch',
  onMockCall, executionAuthorityProvider, mockAdapterFactory, runtimeOverride } = {}) {
  return createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: runtimeOverride ?? runtime(monotonicEpoch),
    idFactory: randomUUID,
    executionAuthorityProvider: executionAuthorityProvider ?? authority().verifier,
    resumeTimeAuthority: timeAuthority,
    mockAdapterFactory,
    onMockCall
  });
}

function observeResumeClaims(store) {
  const claimResume = store.claimResume.bind(store);
  let calls = 0;
  store.claimResume = (...args) => {
    calls++;
    return claimResume(...args);
  };
  return () => calls;
}

function rewriteProviderOutcome(root, jobId, transform) {
  const eventPath = join(root, 'events', `${Buffer.from(jobId).toString('base64url')}.jsonl`);
  const lines = readFileSync(eventPath, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
  const row = lines.find(item => item.type === 'provider-outcome');
  const blobPath = join(root, 'blobs', `${Buffer.from(row.payload_key).toString('base64url')}.blob`);
  const value = transform(JSON.parse(readFileSync(blobPath, 'utf8')));
  const bytes = Buffer.from(canonicalJson(value), 'utf8');
  writeFileSync(blobPath, bytes);
  row.byte_size = bytes.byteLength;
  row.sha256 = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  writeFileSync(eventPath, `${lines.map(item => canonicalJson(item)).join('\n')}\n`);
}

async function seedRetryEligible(t, retryAfterMs = 10, {
  mockAdapterFactory, runtimeOverride = runtime(), timeAuthority
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dss-o08-resume-candidate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  let providerCalls = 0;
  const runner = createRunner(store, {
    mockAdapterFactory,
    runtimeOverride,
    timeAuthority: timeAuthority ?? resumeAuthority({
      now: () => stableStart + runtimeOverride.now() - 10_000
    }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const result = await runner.submit({
    productionSource,
    noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: retryAfterMs }
  });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.retry_eligible, true);
  const entries = store.readEvents(result.job_id);
  const admitted = entries.find(item => item.type === 'admitted');
  const terminal = entries.find(item => item.type === 'terminal');
  const window = entries.find(item => item.type === 'resume-window');
  assert.ok(admitted.resume_time);
  assert.equal(typeof window?.retry_not_before_at_ms, 'number');
  assert.equal(providerCalls, 1);
  return { root, jobId: result.job_id, store, runner, result, admitted, terminal, window,
    providerCalls: () => providerCalls, runtime: runtimeOverride };
}

test('reopened local store reports a read-only candidate at the inclusive retry bound', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const reopened = new LocalFilePrototypeStore(seeded.root);
  const resumeClaimCalls = observeResumeClaims(reopened);
  const beforeEvents = reopened.eventCount;
  const beforeBlobs = reopened.blobCount;
  let laterCalls = 0;
  const restarted = createRunner(reopened, {
    monotonicEpoch: 'new-process-monotonic-epoch',
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall: () => { laterCalls++; }
  });

  const inspected = restarted.inspectRecovery(seeded.jobId);
  assert.deepEqual(inspected, {
    status: 'resume-candidate',
    stage: 'resume',
    code: 'RESUME_CANDIDATE',
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: true
  });

  const result = seeded.result.result;
  const events = reopened.readEvents(seeded.jobId);
  const resultPrepared = events.filter(item => item.type === 'result-prepared');
  const persisting = events.filter(item => item.type === 'persisting');
  const terminal = events.filter(item => item.type === 'terminal');
  assert.equal(resultPrepared.length, 1);
  assert.equal(persisting.length, 1);
  assert.equal(terminal.length, 1);
  for (const link of [resultPrepared[0], persisting[0], terminal[0]]) {
    assert.equal(link.attempt_id, seeded.result.attempt_id);
    assert.equal(link.execution_id, seeded.result.execution_id);
    assert.equal(link.result_id, result.result_id);
    assert.equal(link.result_byte_size, Buffer.byteLength(canonicalJson(result)));
    assert.equal(link.result_sha256, `sha256:${createHash('sha256').update(canonicalJson(result)).digest('hex')}`);
  }
  assert.equal(resultPrepared[0].status, 'failed');
  const resultBytes = reopened.readImmutable(`result:${result.result_id}`);
  assert.ok(Buffer.isBuffer(resultBytes));
  assert.equal(resultBytes.toString('utf8'), canonicalJson(result));
  assert.deepEqual(result.outputs, []);
  const outcome = events.find(item => item.type === 'provider-outcome');
  assert.equal(outcome.attempt_id, seeded.result.attempt_id);
  assert.equal(outcome.execution_id, seeded.result.execution_id);
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.payload_key, `provider-outcome:${seeded.result.execution_id}`);
  const resumeWindow = events.find(item => item.type === 'resume-window');
  assert.equal(resumeWindow.terminal_result_id, result.result_id);
  const diagnostic = JSON.stringify(inspected);
  for (const value of [seeded.jobId, seeded.result.attempt_id, seeded.result.execution_id,
    result.result_id, outcome.payload_key, resultPrepared[0].result_sha256]) {
    assert.equal(diagnostic.includes(value), false);
  }
  assert.equal(reopened.eventCount, beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(resumeClaimCalls(), 0);
  assert.equal(laterCalls, 0);
  assert.equal(seeded.providerCalls(), 1);
});

test('read-only resume candidate classification enforces retry and deadline boundaries', async t => {
  const early = await seedRetryEligible(t, 10);
  const earlyRunner = createRunner(new LocalFilePrototypeStore(early.root), {
    monotonicEpoch: 'restart-early',
    timeAuthority: resumeAuthority({ now: () => early.window.retry_not_before_at_ms - 1 })
  });
  assert.equal(earlyRunner.inspectRecovery(early.jobId).status, 'retry-delay-not-elapsed');

  const late = await seedRetryEligible(t, 10);
  const deadline = late.admitted.resume_time.deadline_at_ms;
  const beforeDeadline = createRunner(new LocalFilePrototypeStore(late.root), {
    monotonicEpoch: 'restart-before-deadline', timeAuthority: resumeAuthority({ now: () => deadline - 1 })
  });
  assert.equal(beforeDeadline.inspectRecovery(late.jobId).status, 'resume-candidate');
  const candidateStore = new LocalFilePrototypeStore(late.root);
  const resumeClaimCalls = observeResumeClaims(candidateStore);
  const repeatedCandidateRunner = createRunner(candidateStore, {
    monotonicEpoch: 'restart-repeated-candidate',
    timeAuthority: resumeAuthority({ now: () => deadline - 1 })
  });
  assert.equal(repeatedCandidateRunner.inspectRecovery(late.jobId).status, 'resume-candidate');
  assert.equal(resumeClaimCalls(), 0);
  const atDeadline = createRunner(new LocalFilePrototypeStore(late.root), {
    monotonicEpoch: 'restart-at-deadline', timeAuthority: resumeAuthority({ now: () => deadline })
  });
  assert.equal(atDeadline.inspectRecovery(late.jobId).status, 'budget-exhausted');

  const empty = await seedRetryEligible(t, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
  const noWindow = createRunner(new LocalFilePrototypeStore(empty.root), {
    monotonicEpoch: 'restart-empty-window', timeAuthority: resumeAuthority({
      now: () => empty.window.retry_not_before_at_ms
    })
  });
  assert.equal(empty.window.retry_not_before_at_ms, empty.admitted.resume_time.deadline_at_ms);
  assert.equal(noWindow.inspectRecovery(empty.jobId).status, 'resume-window-empty');
});

test('unknown or rolled-back stable time never yields a resume candidate', async t => {
  const seeded = await seedRetryEligible(t, 10);
  for (const [label, provider] of [
    ['domain mismatch', resumeAuthority({ domain: 'different-domain', now: () => stableStart + 100 })],
    ['epoch mismatch', resumeAuthority({ epoch: 'different-epoch', now: () => stableStart + 100 })],
    ['rollback', resumeAuthority({ now: () => seeded.window.checked_at_ms - 1 })],
    ['unavailable', resumeAuthority({ now: () => { throw new Error('fixture unavailable'); } })],
    ['non-finite', resumeAuthority({ now: () => Number.NaN })]
  ]) await t.test(label, () => {
    const restarted = createRunner(new LocalFilePrototypeStore(seeded.root), {
      monotonicEpoch: `restart-${label.replaceAll(' ', '-')}`, timeAuthority: provider
    });
    assert.equal(restarted.inspectRecovery(seeded.jobId).status, 'deadline-unverifiable');
  });
});

test('repeated read-only inspection detects rollback within the otherwise eligible interval', async t => {
  const seeded = await seedRetryEligible(t, 10);
  let now = seeded.window.retry_not_before_at_ms + 1;
  const store = new LocalFilePrototypeStore(seeded.root);
  const resumeClaimCalls = observeResumeClaims(store);
  const restarted = createRunner(store, {
    monotonicEpoch: 'restart-eligible-time-rollback',
    timeAuthority: resumeAuthority({ now: () => now })
  });

  assert.equal(restarted.inspectRecovery(seeded.jobId).status, 'resume-candidate');
  now--;
  assert.equal(now, seeded.window.retry_not_before_at_ms);
  assert.equal(restarted.inspectRecovery(seeded.jobId).status, 'deadline-unverifiable');
  assert.equal(resumeClaimCalls(), 0);
});

test('corrupt or mismatched persisted resume evidence never yields a candidate', async t => {
  const badInput = await seedRetryEligible(t, 10);
  const inputPath = join(badInput.root, 'blobs', `${Buffer.from(`input:${badInput.jobId}`).toString('base64url')}.blob`);
  writeFileSync(inputPath, Buffer.from('tampered synthetic input'));
  const corruptRunner = createRunner(new LocalFilePrototypeStore(badInput.root), {
    monotonicEpoch: 'restart-corrupt-input', timeAuthority: resumeAuthority({ now: () => stableStart + 100 })
  });
  assert.equal(corruptRunner.inspectRecovery(badInput.jobId).status, 'reconciliation-required');

  const badBound = await seedRetryEligible(t, 10);
  const resumeWindow = badBound.store.readEvents(badBound.jobId).find(item => item.type === 'resume-window');
  const eventPath = join(badBound.root, 'events', `${Buffer.from(badBound.jobId).toString('base64url')}.jsonl`);
  const lines = readFileSync(eventPath, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
  const row = lines.find(item => item.type === 'resume-window');
  row.retry_not_before_at_ms++;
  writeFileSync(eventPath, `${lines.map(item => canonicalJson(item)).join('\n')}\n`);
  assert.equal(resumeWindow.retry_not_before_at_ms + 1, row.retry_not_before_at_ms);
  const mismatchRunner = createRunner(new LocalFilePrototypeStore(badBound.root), {
    monotonicEpoch: 'restart-bad-retry-bound', timeAuthority: resumeAuthority({ now: () => stableStart + 100 })
  });
  assert.notEqual(mismatchRunner.inspectRecovery(badBound.jobId).status, 'resume-candidate');
});

test('malformed or cross-execution provider outcomes never yield candidates', async t => {
  const cases = [
    ['malformed provider outcome', value => ({ ...value, unexpected_field: 'invalid' })],
    ['wrong-kind provider document with malformed descriptor field', value => ({
      ...value, kind: 'provider-adapter-descriptor', supported_extensions: 1
    })],
    ['malformed same-kind error category', value => ({
      ...value, error: { ...value.error, category: { toString: null } }
    })],
    ['provider outcome for a different execution', value => ({
      ...value, execution_id: `exec-offline-${randomUUID()}`
    })]
  ];
  for (const [name, transform] of cases) await t.test(name, async t => {
    const seeded = await seedRetryEligible(t, 10);
    rewriteProviderOutcome(seeded.root, seeded.jobId, transform);
    const store = new LocalFilePrototypeStore(seeded.root);
    const resumeClaimCalls = observeResumeClaims(store);
    let providerCalls = 0;
    const restarted = createRunner(store, {
      monotonicEpoch: `restart-${name.replaceAll(' ', '-')}`,
      timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
      onMockCall: () => { providerCalls++; }
    });

    const inspected = restarted.inspectRecovery(seeded.jobId);
    assert.notEqual(inspected.status, 'resume-candidate');
    assert.equal(inspected.read_only, true);
    assert.equal(resumeClaimCalls(), 0);
    assert.equal(providerCalls, 0);
  });
});

test('explicit writable resume uses a one-shot claim and appends attempt two before one mock call', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const resumeClaimCalls = observeResumeClaims(store);
  const callObservations = [];
  const resumed = createRunner(store, {
    monotonicEpoch: 'resume-happy-path',
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall({ phase, mock, executionId }) {
      if (phase === 'dispatch-confirmed') {
        callObservations.push({ executionId, existingCalls: mock.calls.length,
          dispatches: store.readEvents(seeded.jobId).filter(item => item.type === 'dispatch-started').length });
      }
    }
  });

  const result = await resumed.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.retry_eligible, false);
  assert.equal(resumeClaimCalls(), 1);
  assert.equal(callObservations.length, 1);
  assert.equal(callObservations[0].existingCalls, 0);
  assert.equal(callObservations[0].dispatches, 2);
  assert.notEqual(callObservations[0].executionId, seeded.result.execution_id);
  assert.equal(resumed.inspectRecovery(seeded.jobId).status, 'terminal');

  const entries = store.readEvents(seeded.jobId);
  const prepared = entries.filter(item => item.type === 'prepared');
  const dispatches = entries.filter(item => item.type === 'dispatch-started');
  assert.equal(prepared.length, 2);
  assert.equal(prepared[1].retry_of_attempt_id, prepared[0].attempt_id);
  assert.equal(dispatches.length, 2);
  assert.equal(dispatches[1].execution_id, prepared[1].execution_id);
  assert.equal(entries.filter(item => item.type === 'resume-window').length, 1);
  assert.equal(entries.find(item => item.type === 'resume-window').retry_not_before_at_ms,
    seeded.window.retry_not_before_at_ms);
  assert.equal(entries.find(item => item.type === 'admitted').resume_time.deadline_at_ms,
    seeded.admitted.resume_time.deadline_at_ms);
  assert.equal(store.claimResume(seeded.jobId).status, 'held');

  const repeat = await resumed.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.notEqual(repeat.status, 'terminal');
  assert.equal(callObservations.length, 1);
});

test('public prototype can resume a candidate only with an installed local store and synthetic time authority', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const prototype = createOfflineOrchestrationPrototype({
    store: new LocalFilePrototypeStore(seeded.root),
    executionAuthorityProvider: authority().verifier,
    resumeTimeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms })
  });
  const result = await prototype.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.kind, 'terminal');
  assert.equal(prototype.inspectRecovery(seeded.jobId).status, 'terminal');
  assert.throws(() => createOfflineOrchestrationPrototype({
    executionAuthorityProvider: authority().verifier,
    resumeTimeAuthority: resumeAuthority()
  }), error => error.code === 'RESUME_STORE_UNAVAILABLE');
});

test('resume requires explicit intent and current authority before claim or protected reads', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const claimCalls = observeResumeClaims(store);
  const originalRead = store.readImmutable.bind(store);
  let protectedReads = 0;
  store.readImmutable = key => { protectedReads++; return originalRead(key); };
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });

  await assert.rejects(() => runner.resume({ jobId: seeded.jobId }),
    error => error.code === 'EXPLICIT_RESUME_AUTHORIZATION_REQUIRED');
  assert.equal(claimCalls(), 0);
  assert.equal(protectedReads, 0);
  assert.equal(providerCalls, 0);

  const deniedAuthority = authority();
  deniedAuthority.revoke('20000000-0000-4000-8000-000000000002');
  const deniedRunner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    executionAuthorityProvider: deniedAuthority.verifier,
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const denied = await deniedRunner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(denied.status, 'execution-authority-denied');
  assert.equal(claimCalls(), 0);
  assert.equal(protectedReads, 0);
  assert.equal(providerCalls, 0);
});

test('resume time boundaries stop before claim, protected reads, or provider calls', async t => {
  const seeded = await seedRetryEligible(t, 10);
  for (const [label, now, expected] of [
    ['before retry bound', seeded.window.retry_not_before_at_ms - 1, 'retry-delay-not-elapsed'],
    ['at original deadline', seeded.admitted.resume_time.deadline_at_ms, 'budget-exhausted']
  ]) await t.test(label, async t => {
    const store = new LocalFilePrototypeStore(seeded.root);
    const claimCalls = observeResumeClaims(store);
    let protectedReads = 0;
    const originalRead = store.readImmutable.bind(store);
    store.readImmutable = key => { protectedReads++; return originalRead(key); };
    let providerCalls = 0;
    const runner = createRunner(store, {
      monotonicEpoch: `resume-${label.replaceAll(' ', '-')}`,
      timeAuthority: resumeAuthority({ now: () => now }),
      onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
    });
    const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
    assert.equal(result.status, expected);
    assert.equal(claimCalls(), 0);
    assert.equal(protectedReads, 0);
    assert.equal(providerCalls, 0);
  });
});

test('unknown event state is reconciliation-required before claiming or after a held claim', async t => {
  const before = await seedRetryEligible(t, 10);
  const beforeStore = new LocalFilePrototypeStore(before.root);
  beforeStore.readEvents = () => UNKNOWN_STORE_STATE;
  let beforeClaims = 0;
  const claimBefore = beforeStore.claimResume.bind(beforeStore);
  beforeStore.claimResume = jobId => { beforeClaims++; return claimBefore(jobId); };
  const beforeRunner = createRunner(beforeStore, {
    timeAuthority: resumeAuthority({ now: () => before.window.retry_not_before_at_ms })
  });
  assert.equal((await beforeRunner.resume({ jobId: before.jobId, authorizeResume: true })).status,
    'reconciliation-required');
  assert.equal(beforeClaims, 0);

  const after = await seedRetryEligible(t, 10);
  const afterStore = new LocalFilePrototypeStore(after.root);
  const claimAfter = afterStore.claimResume.bind(afterStore);
  afterStore.claimResume = jobId => {
    const claim = claimAfter(jobId);
    if (claim.status === 'acquired') afterStore.readEvents = () => UNKNOWN_STORE_STATE;
    return claim;
  };
  let protectedReads = 0;
  afterStore.readImmutable = () => { protectedReads++; return UNKNOWN_STORE_STATE; };
  let providerCalls = 0;
  const afterRunner = createRunner(afterStore, {
    timeAuthority: resumeAuthority({ now: () => after.window.retry_not_before_at_ms }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const afterResult = await afterRunner.resume({ jobId: after.jobId, authorizeResume: true });
  assert.equal(afterResult.status, 'reconciliation-required');
  assert.equal(protectedReads, 0);
  assert.equal(providerCalls, 0);
  assert.equal(claimAfter(after.jobId).status, 'held');
});

test('deadline mapping pairs post-claim stable and monotonic samples after asynchronous authority advances both clocks', async t => {
  const seeded = await seedRetryEligible(t, 10);
  let stableNow = seeded.window.retry_not_before_at_ms;
  const monotonic = runtime('resume-post-claim-paired-clock');
  const base = authority();
  let retryVerifications = 0;
  const executionAuthorityProvider = Object.freeze({
    id: base.verifier.id,
    mode: 'synthetic',
    async verify(request) {
      const evidence = await base.verifier.verify(request);
      if (request.action === 'retry' && ++retryVerifications === 2) {
        stableNow += 50_000;
        monotonic.advance(50_000);
      }
      return evidence;
    },
    isCurrent: base.verifier.isCurrent.bind(base.verifier)
  });
  class AdvancingDescriptionMock extends MockTextAdapter {
    async describe() {
      const result = await super.describe();
      monotonic.advance(25_000);
      return result;
    }
  }
  let dispatches = 0;
  const runner = createRunner(new LocalFilePrototypeStore(seeded.root), {
    monotonicEpoch: 'resume-post-claim-paired-clock',
    runtimeOverride: monotonic,
    timeAuthority: resumeAuthority({ now: () => stableNow }),
    executionAuthorityProvider,
    mockAdapterFactory: configuration => new AdvancingDescriptionMock(configuration),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') dispatches++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.kind, 'terminal');
  assert.equal(retryVerifications, 5);
  assert.equal(dispatches, 1);
  assert.equal(monotonic.now(), 85_000);
});

test('concurrent resume calls share one atomic claim and make at most one provider call', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const firstStore = new LocalFilePrototypeStore(seeded.root);
  const secondStore = new LocalFilePrototypeStore(seeded.root);
  let providerCalls = 0;
  const timeAuthority = resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms });
  const first = createRunner(firstStore, {
    monotonicEpoch: 'resume-racer-one', timeAuthority,
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const second = createRunner(secondStore, {
    monotonicEpoch: 'resume-racer-two', timeAuthority,
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const results = await Promise.all([
    first.resume({ jobId: seeded.jobId, authorizeResume: true }),
    second.resume({ jobId: seeded.jobId, authorizeResume: true })
  ]);
  assert.equal(results.filter(result => result.kind === 'terminal').length, 1);
  assert.equal(results.filter(result => result.status === 'resume-claim-held').length, 1);
  assert.equal(providerCalls, 1);
});

test('resume claim blocks the original runner retry while resumed adapter preflight is pending', async t => {
  const seeded = await seedRetryEligible(t, 10);
  seeded.runtime.advance(10);
  let enteredDescribeResolve;
  const enteredDescribe = new Promise(resolve => { enteredDescribeResolve = resolve; });
  let releaseDescribe;
  const describeGate = new Promise(resolve => { releaseDescribe = resolve; });
  class PendingDescriptionMock extends MockTextAdapter {
    async describe() {
      enteredDescribeResolve();
      await describeGate;
      return super.describe();
    }
  }
  let resumedDispatches = 0;
  const resumed = createRunner(new LocalFilePrototypeStore(seeded.root), {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    mockAdapterFactory: configuration => new PendingDescriptionMock(configuration),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') resumedDispatches++; }
  });

  const resumePending = resumed.resume({ jobId: seeded.jobId, authorizeResume: true });
  await enteredDescribe;
  await assert.rejects(
    () => seeded.runner.retry({ authorizeRetry: true }),
    error => error.code === 'RETRY_CLAIM_HELD'
  );
  assert.equal(seeded.providerCalls(), 1);
  assert.equal(resumedDispatches, 0);

  releaseDescribe();
  const result = await resumePending;
  assert.equal(result.kind, 'terminal');
  assert.equal(seeded.providerCalls(), 1);
  assert.equal(resumedDispatches, 1);
  assert.equal(seeded.store.readEvents(seeded.jobId).filter(item => item.type === 'dispatch-started').length, 2);
});

test('pending original retry owns the durable claim and blocks resumed dispatch', async t => {
  let executeCount = 0;
  let executionStartedResolve;
  const executionStarted = new Promise(resolve => { executionStartedResolve = resolve; });
  let releaseExecution;
  const executionGate = new Promise(resolve => { releaseExecution = resolve; });
  class PendingOutcomeMock extends MockTextAdapter {
    async execute(request, options) {
      if (++executeCount === 2) {
        executionStartedResolve();
        await executionGate;
      }
      return super.execute(request, options);
    }
  }
  const retryRuntime = runtime();
  const seeded = await seedRetryEligible(t, 10, {
    mockAdapterFactory: configuration => new PendingOutcomeMock(configuration),
    runtimeOverride: retryRuntime
  });
  retryRuntime.advance(10);
  let resumedDispatches = 0;
  const resumed = createRunner(new LocalFilePrototypeStore(seeded.root), {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') resumedDispatches++; }
  });

  const retryPending = seeded.runner.retry({ authorizeRetry: true });
  await executionStarted;
  const resumeResult = await resumed.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(resumeResult.status, 'resume-not-eligible');
  assert.equal(resumedDispatches, 0);
  assert.equal(seeded.providerCalls(), 2);

  releaseExecution();
  const retryResult = await retryPending;
  assert.equal(retryResult.kind, 'terminal');
  assert.equal(seeded.providerCalls(), 2);
  assert.equal(seeded.store.readEvents(seeded.jobId).filter(item => item.type === 'dispatch-started').length, 2);
});

test('revocation during claim acquisition stops before any protected read or provider call', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const claimResume = store.claimResume.bind(store);
  let claimCalls = 0;
  store.claimResume = jobId => {
    claimCalls++;
    const claim = claimResume(jobId);
    if (claim.status === 'acquired') executionAuthority.revoke('20000000-0000-4000-8000-000000000002');
    return claim;
  };
  let protectedReads = 0;
  const originalRead = store.readImmutable.bind(store);
  store.readImmutable = key => { protectedReads++; return originalRead(key); };
  let providerCalls = 0;
  const executionAuthority = authority();
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    executionAuthorityProvider: executionAuthority.verifier,
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'execution-authority-denied');
  assert.equal(claimCalls, 1);
  assert.equal(protectedReads, 0);
  assert.equal(providerCalls, 0);
  assert.equal(claimResume(seeded.jobId).status, 'held');
});

test('stable-time rollback during claim acquisition stops before protected reads', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  let now = seeded.window.retry_not_before_at_ms + 1;
  const claimResume = store.claimResume.bind(store);
  store.claimResume = jobId => {
    const claim = claimResume(jobId);
    now = seeded.window.retry_not_before_at_ms;
    return claim;
  };
  let protectedReads = 0;
  const originalRead = store.readImmutable.bind(store);
  store.readImmutable = key => { protectedReads++; return originalRead(key); };
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => now }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'deadline-unverifiable');
  assert.equal(protectedReads, 0);
  assert.equal(providerCalls, 0);
  assert.equal(claimResume(seeded.jobId).status, 'held');
});

test('unknown one-shot claim fails closed before protected reads or provider calls', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  let claimCalls = 0;
  store.claimResume = () => { claimCalls++; return { status: 'unknown' }; };
  let protectedReads = 0;
  const originalRead = store.readImmutable.bind(store);
  store.readImmutable = key => { protectedReads++; return originalRead(key); };
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(claimCalls, 1);
  assert.equal(protectedReads, 0);
  assert.equal(providerCalls, 0);
});

test('stable deadline expiry during asynchronous mock preflight prevents dispatch', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  let now = seeded.window.retry_not_before_at_ms;
  const deadline = seeded.admitted.resume_time.deadline_at_ms;
  class AdvancingMock extends MockTextAdapter {
    async describe() {
      const descriptor = await super.describe();
      now = deadline;
      return descriptor;
    }
  }
  let dispatches = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => now }),
    mockAdapterFactory: configuration => new AdvancingMock(configuration),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') dispatches++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'budget-exhausted');
  assert.equal(dispatches, 0);
  assert.equal(store.claimResume(seeded.jobId).status, 'held');
});

test('authority revocation during asynchronous mock preflight prevents dispatch', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const executionAuthority = authority();
  class RevokingMock extends MockTextAdapter {
    async describe() {
      const descriptor = await super.describe();
      executionAuthority.revoke('20000000-0000-4000-8000-000000000002');
      return descriptor;
    }
  }
  let dispatches = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    executionAuthorityProvider: executionAuthority.verifier,
    mockAdapterFactory: configuration => new RevokingMock(configuration),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') dispatches++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'execution-authority-denied');
  assert.equal(dispatches, 0);
  assert.equal(store.claimResume(seeded.jobId).status, 'held');
});

test('stable deadline expiry during final awaited authority check blocks the mock effect', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const deadline = seeded.admitted.resume_time.deadline_at_ms;
  let now = seeded.window.retry_not_before_at_ms;
  const baseAuthority = authority();
  let retryVerifications = 0;
  const executionAuthorityProvider = Object.freeze({
    id: baseAuthority.verifier.id,
    mode: 'synthetic',
    async verify(request) {
      if (request.action === 'retry') retryVerifications++;
      const evidence = await baseAuthority.verifier.verify(request);
      if (retryVerifications === 5) now = deadline;
      return evidence;
    },
    isCurrent: baseAuthority.verifier.isCurrent.bind(baseAuthority.verifier)
  });
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => now }),
    executionAuthorityProvider,
    onMockCall({ phase, mock }) {
      if (phase !== 'dispatch-confirmed') return;
      const execute = mock.execute.bind(mock);
      mock.execute = (...args) => { providerCalls++; return execute(...args); };
    }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(retryVerifications, 5);
  assert.equal(providerCalls, 0);
  assert.equal(store.readEvents(seeded.jobId).filter(item => item.type === 'dispatch-started').length, 2);
});

test('ambiguous prior result read after final authority verification quarantines without another provider call', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const originalResultKey = `result:${seeded.terminal.result_id}`;
  const readImmutable = store.readImmutable.bind(store);
  let hidePriorResult = false;
  store.readImmutable = key => key === originalResultKey && hidePriorResult
    ? UNKNOWN_STORE_STATE : readImmutable(key);
  const baseAuthority = authority();
  let retryVerifications = 0;
  const executionAuthorityProvider = Object.freeze({
    id: baseAuthority.verifier.id,
    mode: 'synthetic',
    async verify(request) {
      if (request.action === 'retry') retryVerifications++;
      const evidence = await baseAuthority.verifier.verify(request);
      if (retryVerifications === 5) hidePriorResult = true;
      return evidence;
    },
    isCurrent: baseAuthority.verifier.isCurrent.bind(baseAuthority.verifier)
  });
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    executionAuthorityProvider,
    onMockCall({ phase, mock }) {
      if (phase !== 'dispatch-confirmed') return;
      const execute = mock.execute.bind(mock);
      mock.execute = (...args) => { providerCalls++; return execute(...args); };
    }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(providerCalls, 0);
  assert.equal(retryVerifications, 5);
  assert.equal(store.claimResume(seeded.jobId).status, 'held');
});

test('unverifiable dispatch marker is quarantined and never replayed after restart', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const append = store.append.bind(store);
  const readEvents = store.readEvents.bind(store);
  let hideDispatchReadback = false;
  store.append = entry => {
    append(entry);
    if (entry.type === 'dispatch-started' && entry.attempt_id !== seeded.terminal.attempt_id) {
      hideDispatchReadback = true;
    }
  };
  store.readEvents = jobId => {
    if (hideDispatchReadback) { hideDispatchReadback = false; return UNKNOWN_STORE_STATE; }
    return readEvents(jobId);
  };
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(providerCalls, 0);
  const restarted = createRunner(new LocalFilePrototypeStore(seeded.root), {
    monotonicEpoch: 'resume-after-ambiguous-marker',
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; }
  });
  const repeat = await restarted.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(repeat.status, 'resume-not-eligible');
  assert.equal(providerCalls, 0);
  assert.equal(readEvents(seeded.jobId).filter(item => item.type === 'dispatch-started').length, 2);
});

test('uncertain new provider-outcome write is not replayed after restart', async t => {
  const seeded = await seedRetryEligible(t, 10);
  const store = new LocalFilePrototypeStore(seeded.root);
  const originalOutcomeKey = `provider-outcome:${seeded.terminal.execution_id}`;
  const readImmutable = store.readImmutable.bind(store);
  const writeImmutable = store.writeImmutable.bind(store);
  let unknownNewOutcome = false;
  store.readImmutable = key => key.startsWith('provider-outcome:') && key !== originalOutcomeKey && unknownNewOutcome
    ? UNKNOWN_STORE_STATE : readImmutable(key);
  store.writeImmutable = (key, bytes) => {
    const result = writeImmutable(key, bytes);
    if (key.startsWith('provider-outcome:') && key !== originalOutcomeKey) unknownNewOutcome = true;
    return result;
  };
  let providerCalls = 0;
  const runner = createRunner(store, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall({ phase, mock }) {
      if (phase !== 'dispatch-confirmed') return;
      const execute = mock.execute.bind(mock);
      mock.execute = (...args) => { providerCalls++; return execute(...args); };
    }
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.status, 'reconciliation-required');
  assert.equal(providerCalls, 1);
  const restarted = createRunner(new LocalFilePrototypeStore(seeded.root), {
    monotonicEpoch: 'resume-after-uncertain-outcome',
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall({ phase, mock }) {
      if (phase !== 'dispatch-confirmed') return;
      const execute = mock.execute.bind(mock);
      mock.execute = (...args) => { providerCalls++; return execute(...args); };
    }
  });
  const repeat = await restarted.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(repeat.status, 'resume-not-eligible');
  assert.equal(providerCalls, 1);
});


function writeResumeEventLog(root, jobId, entries) {
  const eventPath = join(root, 'events', `${Buffer.from(jobId).toString('base64url')}.jsonl`);
  writeFileSync(eventPath, `${entries.map(item => canonicalJson(item)).join('\n')}\n`);
}

function assertResumeReconciliation(inspection, values) {
  assert.deepEqual(inspection, {
    status: 'reconciliation-required',
    stage: 'integrity',
    code: 'RECONCILIATION_REQUIRED',
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: false
  });
  const value = JSON.stringify(inspection);
  for (const item of values) assert.equal(value.includes(item), false);
}

async function completeSeededRetry(seeded, onMockCall = () => {}) {
  seeded.runtime.advance(10);
  const reopened = new LocalFilePrototypeStore(seeded.root);
  const runner = createRunner(reopened, {
    timeAuthority: resumeAuthority({ now: () => seeded.window.retry_not_before_at_ms }),
    onMockCall
  });
  const result = await runner.resume({ jobId: seeded.jobId, authorizeResume: true });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.retry_eligible, false);
  return { reopened, runner, result };
}

test('completed retry inspection rejects a second prepared/dispatch before the first terminal', async t => {
  const seeded = await seedRetryEligible(t, 10);
  let resumedCalls = 0;
  const completed = await completeSeededRetry(seeded, ({ phase }) => {
    if (phase === 'dispatch-confirmed') resumedCalls++;
  });
  assert.equal(completed.runner.inspectRecovery(seeded.jobId).status, 'terminal');
  const entries = structuredClone(completed.reopened.readEvents(seeded.jobId));
  const prepared = entries.filter(item => item.type === 'prepared');
  const dispatches = entries.filter(item => item.type === 'dispatch-started');
  const firstTerminal = entries.find(item => item.type === 'terminal' && item.attempt_id === prepared[0].attempt_id);
  assert.equal(prepared.length, 2);
  assert.equal(dispatches.length, 2);
  assert.ok(firstTerminal);
  const moved = new Set([prepared[1], dispatches[1]]);
  const interleaved = entries.filter(item => !moved.has(item));
  const terminalIndex = interleaved.indexOf(firstTerminal);
  interleaved.splice(terminalIndex, 0, prepared[1], dispatches[1]);
  writeResumeEventLog(seeded.root, seeded.jobId, interleaved);

  const reopened = new LocalFilePrototypeStore(seeded.root);
  let inspectionCalls = 0;
  const probe = createRunner(reopened, { onMockCall: () => { inspectionCalls++; } });
  const beforeEvents = structuredClone(reopened.readEvents(seeded.jobId));
  const beforeBlobs = reopened.blobCount;
  const finalTerminal = entries.find(item => item.type === 'terminal' && item.attempt_id === prepared[1].attempt_id);
  assertResumeReconciliation(probe.inspectRecovery(seeded.jobId), [
    seeded.root, seeded.jobId, prepared[0].attempt_id, prepared[1].attempt_id,
    prepared[0].execution_id, prepared[1].execution_id,
    firstTerminal.result_id, finalTerminal.result_id,
    'PRIVATE-RESULT-SENTINEL'
  ]);
  assert.deepEqual(reopened.readEvents(seeded.jobId), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(inspectionCalls, 0);
  assert.equal(seeded.providerCalls(), 1);
  assert.equal(resumedCalls, 1);
});

test('completed retry inspection rejects mismatched and duplicate resume-window links', async t => {
  for (const corruption of ['mismatched-result-link', 'duplicate-window']) {
    await t.test(corruption, async t => {
      const seeded = await seedRetryEligible(t, 10);
      let resumedCalls = 0;
      const completed = await completeSeededRetry(seeded, ({ phase }) => {
        if (phase === 'dispatch-confirmed') resumedCalls++;
      });
      const entries = structuredClone(completed.reopened.readEvents(seeded.jobId));
      const firstPrepared = entries.find(item => item.type === 'prepared');
      const firstWindow = entries.find(item => item.type === 'resume-window');
      const secondPrepared = entries.find(item => item.type === 'prepared'
        && item.attempt_id !== firstPrepared.attempt_id);
      const secondTerminal = entries.find(item => item.type === 'terminal'
        && item.attempt_id === secondPrepared.attempt_id);
      assert.ok(firstWindow);
      assert.ok(secondTerminal);
      if (corruption === 'mismatched-result-link') {
        firstWindow.terminal_result_id = secondTerminal.result_id;
        firstWindow.private_content = 'WINDOW-PRIVATE-CONTENT-SENTINEL';
      } else {
        const duplicate = structuredClone(firstWindow);
        duplicate.private_content = 'WINDOW-PRIVATE-CONTENT-SENTINEL';
        duplicate.exception_text = 'WINDOW-EXCEPTION-SENTINEL';
        const nextIndex = entries.indexOf(secondPrepared);
        entries.splice(nextIndex, 0, duplicate);
      }
      writeResumeEventLog(seeded.root, seeded.jobId, entries);

      const reopened = new LocalFilePrototypeStore(seeded.root);
      let inspectionCalls = 0;
      const probe = createRunner(reopened, { onMockCall: () => { inspectionCalls++; } });
      const beforeEvents = structuredClone(reopened.readEvents(seeded.jobId));
      const beforeBlobs = reopened.blobCount;
      assertResumeReconciliation(probe.inspectRecovery(seeded.jobId), [
        seeded.root, seeded.jobId, firstPrepared.attempt_id, secondPrepared.attempt_id,
        firstPrepared.execution_id, secondPrepared.execution_id,
        firstWindow.terminal_result_id, secondTerminal.result_id,
        seeded.result.result.result_id, 'WINDOW-PRIVATE-CONTENT-SENTINEL',
        'WINDOW-EXCEPTION-SENTINEL'
      ]);
      assert.deepEqual(reopened.readEvents(seeded.jobId), beforeEvents);
      assert.equal(reopened.blobCount, beforeBlobs);
      assert.equal(inspectionCalls, 0);
      assert.equal(seeded.providerCalls(), 1);
      assert.equal(resumedCalls, 1);
    });
  }
});
