import '../support/offline-network-tripwire.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { MockTextAdapter } from '../../src/prompt-sdk/index.js';
import { createSyntheticExecutionAuthorityVerifier, SYNTHETIC_EXECUTION_PURPOSE }
  from '../../src/offline-orchestration-prototype/execution-authority.js';
import { createOfflineOrchestrationPrototypeForTest, LocalFilePrototypeStore }
  from '../../src/offline-orchestration-prototype/testing.js';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
const productionSource = JSON.stringify(fixture.production);
const stableStart = Date.parse('2026-11-08T02:40:00Z');
const retryDecision = '20000000-0000-4000-8000-000000000002';

function authority() {
  return createSyntheticExecutionAuthorityVerifier(['execute', 'retry'].map((action, index) => ({
    decision_id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    decision: 'allow', action, purpose: SYNTHETIC_EXECUTION_PURPOSE,
    production: {
      production_id: fixture.production.production_id, revision: fixture.production.revision,
      identity_sha256: 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc'
    },
    not_before: '2026-01-01T00:00:00Z', review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/studio/issues/111'
  })));
}

function clock(epochId) {
  let monotonic = 10_000;
  const timers = new Map();
  let nextTimer = 0;
  return {
    now: () => monotonic, epochId, wallNow: () => stableStart,
    setTimer(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimer(id) { timers.delete(id); },
    advance(delta) { monotonic += delta; },
    fireTimers() {
      const callbacks = [...timers.values()];
      timers.clear();
      for (const callback of callbacks) callback();
    }
  };
}

function eventPath(h) {
  return join(h.root, 'events', `${Buffer.from(h.first.job_id).toString('base64url')}.jsonl`);
}
function rewriteEvents(h, entries) {
  writeFileSync(eventPath(h), entries.map(entry => JSON.stringify(entry)).join('\n') + '\n');
}
function reopened(h) {
  return createOfflineOrchestrationPrototypeForTest({ store: new LocalFilePrototypeStore(h.root),
    runtime: clock('inspection-epoch'), executionAuthorityProvider: authority().verifier });
}
function assertInspection(h, status) {
  const before = readFileSync(eventPath(h));
  for (const runner of [h.runner, reopened(h)]) {
    const result = runner.inspectRecovery(h.first.job_id);
    assert.equal(result.status, status, JSON.stringify(result));
    assert.equal(result.read_only, true);
    assert.equal(result.no_writes, true);
    assert.equal(result.no_provider_calls, true);
  }
  assert.deepEqual(readFileSync(eventPath(h)), before);
  // Retrying or stopping must never rewrite the first terminal result.
  assert.deepEqual(readFileSync(h.firstResultPath), h.firstResultBytes);
}
function assertIntegrity(h) {
  for (const runner of [h.runner, reopened(h)]) {
    const result = runner.inspectRecovery(h.first.job_id);
    assert.equal(result.code, 'RECONCILIATION_REQUIRED', JSON.stringify(result));
    assert.equal(result.stage, 'integrity');
  }
}

async function stoppedRetry(t, { resumed = true, phase = 'created', reason = 'deadline', claimDelay = 0 } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'dss-o10-recovery-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  const execution = authority();
  const originalClock = clock('original-epoch');
  let activeClock = originalClock;
  let stableNow = stableStart;
  let stopping = false;
  const mocks = [];
  function stop() {
    if (reason === 'authorization') execution.revoke(retryDecision);
    else { activeClock.advance(300_000); stableNow += 300_000; }
  }
  function makeRunner(selectedStore) {
    if (claimDelay && selectedStore !== store) {
      const claimResume = selectedStore.claimResume.bind(selectedStore);
      selectedStore.claimResume = (...args) => {
        const result = claimResume(...args);
        activeClock.advance(claimDelay);
        stableNow += claimDelay;
        return result;
      };
    }
    return createOfflineOrchestrationPrototypeForTest({
      store: selectedStore, runtime: activeClock, idFactory: randomUUID,
      executionAuthorityProvider: execution.verifier,
      resumeTimeAuthority: {
        id: 'studio.synthetic.resume-time-v1', mode: 'synthetic',
        domain_id: 'synthetic-resume-time-v1', epoch_id: 'fixture-epoch-1', now: () => stableNow
      },
      onMockCall({ phase: observed }) { if (stopping && phase === observed) stop(); },
      mockAdapterFactory(configuration) {
        const mock = new MockTextAdapter(configuration);
        if (stopping && phase === 'in-flight') {
          const execute = mock.execute.bind(mock);
          mock.execute = (...args) => { stop(); activeClock.fireTimers(); return execute(...args); };
        }
        mocks.push(mock);
        return mock;
      }
    });
  }
  let runner = makeRunner(store);
  const first = await runner.submit({ productionSource, noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 } });
  assert.equal(first.retry_eligible, true);
  const initial = store.readEvents(first.job_id);
  const firstResult = initial.find(entry => entry.type === 'result-prepared');
  const firstResultPath = join(root, 'blobs', `${Buffer.from(`result:${firstResult.result_id}`).toString('base64url')}.blob`);
  const firstResultBytes = readFileSync(firstResultPath);
  stableNow += 10;
  if (resumed) {
    activeClock = clock('new-restarted-epoch');
    runner = makeRunner(new LocalFilePrototypeStore(root));
  } else originalClock.advance(10);
  stopping = true;
  const options = { mockOutcome: { kind: 'success', delay_ms: phase === 'in-flight' ? 5_000 : 0 } };
  const stopped = resumed
    ? await runner.resume({ jobId: first.job_id, authorizeResume: true, ...options })
    : await runner.retry({ authorizeRetry: true, ...options });
  return { root, store, runner, first, stopped, mocks, initial, firstResultPath, firstResultBytes };
}

for (const phase of ['created', 'dispatch-confirmed', 'in-flight']) {
  test(`O10 F1: resumed deadline at ${phase} retains truthful recovery across epochs`, async t => {
    const h = await stoppedRetry(t, { phase });
    const status = phase === 'in-flight' ? 'contract-mapping-blocked' : 'budget-exhausted';
    assert.equal(h.stopped.status, status);
    assert.deepEqual(h.mocks.map(mock => mock.calls.length), [1, phase === 'in-flight' ? 1 : 0]);
    const entries = h.store.readEvents(h.first.job_id);
    const prepared = entries.findLast(entry => entry.type === 'prepared');
    const admitted = entries.find(entry => entry.type === 'admitted');
    assert.deepEqual(prepared.resumed_clock, {
      clock_epoch_id: 'new-restarted-epoch', sampled_monotonic_ms: 10_000,
      sampled_at_ms: stableStart + 10, deadline_monotonic_ms: 309_990
    });
    assert.equal(prepared.resumed_clock.deadline_monotonic_ms,
      prepared.resumed_clock.sampled_monotonic_ms + admitted.resume_time.deadline_at_ms
      - prepared.resumed_clock.sampled_at_ms);
    const stop = entries.findLast(entry => entry.type === 'budget-exhausted');
    assert.equal(stop.deadline_monotonic_ms, prepared.resumed_clock.deadline_monotonic_ms);
    assert.notEqual(stop.deadline_monotonic_ms, admitted.deadline_monotonic_ms);
    const outcomes = entries.filter(entry => entry.type === 'provider-outcome' && entry.attempt_id === prepared.attempt_id);
    assert.equal(outcomes.length, phase === 'in-flight' ? 1 : 0);
    if (phase === 'in-flight') assert.equal(outcomes[0].status, 'cancelled');
    assertInspection(h, status);
  });
}

test('O10 F1: resumed mapping samples both clocks after the durable claim', async t => {
  const h = await stoppedRetry(t, { claimDelay: 25 });
  const prepared = h.store.readEvents(h.first.job_id).findLast(e => e.type === 'prepared');
  assert.deepEqual(prepared.resumed_clock, {
    clock_epoch_id: 'new-restarted-epoch', sampled_monotonic_ms: 10_025,
    sampled_at_ms: stableStart + 35, deadline_monotonic_ms: 309_990
  });
  assert.deepEqual(h.mocks.map(mock => mock.calls.length), [1, 0]);
  assertInspection(h, 'budget-exhausted');
});

const clockCorruptions = {
  'missing mapping': prepared => { delete prepared.resumed_clock; },
  'null mapping': prepared => { prepared.resumed_clock = null; },
  'extra mapping field': prepared => { prepared.resumed_clock.extra = true; },
  'array mapping': prepared => { prepared.resumed_clock = []; },
  'negative stable date': prepared => { prepared.resumed_clock.sampled_at_ms = -1; },
  'fractional stable date': prepared => { prepared.resumed_clock.sampled_at_ms += 0.5; },
  'negative monotonic sample': prepared => { prepared.resumed_clock.sampled_monotonic_ms = -1; },
  'noninteger translated deadline': prepared => { prepared.resumed_clock.deadline_monotonic_ms += 0.5; },
  'missing epoch': prepared => { delete prepared.resumed_clock.clock_epoch_id; },
  'empty epoch': prepared => { prepared.resumed_clock.clock_epoch_id = ''; },
  'noninteger monotonic sample': prepared => { prepared.resumed_clock.sampled_monotonic_ms = 10_000.5; },
  'invalid stable date': prepared => { prepared.resumed_clock.sampled_at_ms = Number.MAX_SAFE_INTEGER; },
  'sample before retry bound': (prepared, entries) => {
    prepared.resumed_clock.sampled_at_ms = entries.find(e => e.type === 'resume-window').retry_not_before_at_ms - 1;
    prepared.resumed_clock.deadline_monotonic_ms += 1;
  },
  'sample at stable deadline': (prepared, entries) => {
    prepared.resumed_clock.sampled_at_ms = entries.find(e => e.type === 'admitted').resume_time.deadline_at_ms;
    prepared.resumed_clock.deadline_monotonic_ms = prepared.resumed_clock.sampled_monotonic_ms;
  },
  'incorrect translation': prepared => { prepared.resumed_clock.deadline_monotonic_ms += 1; },
  'conflicting stop deadline': (_prepared, entries) => {
    entries.findLast(e => e.type === 'budget-exhausted').deadline_monotonic_ms += 1;
  },
  'original epoch deadline substituted': (_prepared, entries) => {
    entries.findLast(e => e.type === 'budget-exhausted').deadline_monotonic_ms = entries.find(e => e.type === 'admitted').deadline_monotonic_ms;
  }
};
for (const [name, corrupt] of Object.entries(clockCorruptions)) {
  test(`O10 F1: reject ${name}`, async t => {
    const h = await stoppedRetry(t);
    const entries = structuredClone(h.store.readEvents(h.first.job_id));
    corrupt(entries.findLast(e => e.type === 'prepared'), entries);
    rewriteEvents(h, entries);
    assertIntegrity(h);
  });
}

test('O10 F1: historical same-process deadline records need no resumed mapping', async t => {
  const h = await stoppedRetry(t, { resumed: false });
  const entries = h.store.readEvents(h.first.job_id);
  assert.equal(entries.findLast(e => e.type === 'prepared').resumed_clock, undefined);
  assertInspection(h, 'budget-exhausted');
});

for (const resumed of [false, true]) {
  for (const phase of ['created', 'dispatch-confirmed']) {
    test(`O10 F3: ${resumed ? 'resumed' : 'ordinary'} retry denied at ${phase} is safely closed`, async t => {
      const h = await stoppedRetry(t, { resumed, phase, reason: 'authorization' });
      assert.equal(h.stopped.status, 'authorization-denied');
      assert.deepEqual(h.mocks.map(mock => mock.calls.length), [1, 0]);
      const entries = h.store.readEvents(h.first.job_id);
      const prepared = entries.findLast(e => e.type === 'prepared');
      const trailing = entries.slice(entries.indexOf(prepared));
      assert.deepEqual(trailing.map(e => e.type), phase === 'created'
        ? ['prepared', 'authorization-blocked', 'job-closed']
        : ['prepared', 'dispatch-started', 'authorization-blocked', 'job-closed']);
      assert.deepEqual(trailing.at(-2), { type: 'authorization-blocked', job_id: h.first.job_id,
        attempt_id: prepared.attempt_id, execution_id: prepared.execution_id, action: 'retry' });
      assert.equal(trailing.at(-1).reason, 'execution-authority-denied');
      assertInspection(h, 'closed-without-result');
    });
  }
}

const authorizationCorruptions = {
  'wrong action': (stop) => { stop.action = 'execute'; },
  'wrong job': (stop) => { stop.job_id = randomUUID(); },
  'wrong attempt': (stop) => { stop.attempt_id = randomUUID(); },
  'wrong execution': (stop) => { stop.execution_id = randomUUID(); },
  'missing execution': (stop) => { delete stop.execution_id; },
  'extra field': (stop) => { stop.reason = 'denied'; },
  'stop before preparation': (stop, entries) => {
    entries.splice(entries.indexOf(stop), 1);
    entries.splice(entries.findLastIndex(e => e.type === 'prepared'), 0, stop);
  },
  'stop before dispatch': (stop, entries) => {
    entries.splice(entries.indexOf(stop), 1);
    entries.splice(entries.findLastIndex(e => e.type === 'dispatch-started'), 0, stop);
  },
  'closure before stop': (stop, entries) => {
    const closure = entries.pop(); entries.splice(entries.indexOf(stop), 0, closure);
  },
  'wrong closure reason': (_stop, entries) => { entries.at(-1).reason = 'retry-budget-exhausted'; },
  'missing closure': (_stop, entries) => { entries.pop(); },
  'missing stop': (stop, entries) => { entries.splice(entries.indexOf(stop), 1); },
  'duplicate stop': (stop, entries) => { entries.splice(-1, 0, { ...stop }); },
  'duplicate closure': (_stop, entries) => { entries.push({ ...entries.at(-1) }); },
  'contradictory budget stop': (stop, entries) => { entries.splice(-1, 0, {
    type: 'budget-exhausted', job_id: stop.job_id, attempt_id: stop.attempt_id,
    execution_id: stop.execution_id, reason: 'time',
    deadline_monotonic_ms: entries.find(e => e.type === 'admitted').deadline_monotonic_ms
  }); },
  'contradictory cancellation stop': (stop, entries) => { entries.splice(-1, 0, {
    type: 'cancelled-before-dispatch', job_id: stop.job_id,
    attempt_id: stop.attempt_id, reason: 'caller-cancelled'
  }); },
  'contradictory provider outcome': (stop, entries) => { entries.splice(-1, 0, {
    ...entries.find(e => e.type === 'provider-outcome'), attempt_id: stop.attempt_id,
    execution_id: stop.execution_id
  }); },
  'contradictory result': (stop, entries) => { entries.splice(-1, 0, {
    ...entries.find(e => e.type === 'result-prepared'), attempt_id: stop.attempt_id,
    execution_id: stop.execution_id
  }); }
};
for (const [name, corrupt] of Object.entries(authorizationCorruptions)) {
  test(`O10 F3: reject authorization closure with ${name}`, async t => {
    const h = await stoppedRetry(t, { reason: 'authorization', phase: 'dispatch-confirmed' });
    const entries = structuredClone(h.store.readEvents(h.first.job_id));
    corrupt(entries.findLast(e => e.type === 'authorization-blocked'), entries);
    rewriteEvents(h, entries);
    assertIntegrity(h);
    assert.deepEqual(h.mocks.map(mock => mock.calls.length), [1, 0]);
  });
}
