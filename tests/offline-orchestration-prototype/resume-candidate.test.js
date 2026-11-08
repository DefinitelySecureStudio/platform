import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  createSyntheticExecutionAuthorityVerifier,
  SYNTHETIC_EXECUTION_PURPOSE
} from '../../src/offline-orchestration-prototype/execution-authority.js';
import {
  createOfflineOrchestrationPrototypeForTest,
  LocalFilePrototypeStore
} from '../../src/offline-orchestration-prototype/testing.js';
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
  return createSyntheticExecutionAuthorityVerifier([record('execute', '1'), record('retry', '2')]).verifier;
}

function runtime(epochId = 'original-monotonic-epoch') {
  return {
    now: () => 10_000,
    epochId,
    wallNow: () => Date.parse('2026-11-08T02:40:00Z'),
    setTimer: () => 1,
    clearTimer: () => {}
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

function createRunner(store, { timeAuthority = resumeAuthority(), monotonicEpoch = 'original-monotonic-epoch', onMockCall } = {}) {
  return createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: runtime(monotonicEpoch),
    idFactory: randomUUID,
    executionAuthorityProvider: authority(),
    resumeTimeAuthority: timeAuthority,
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

async function seedRetryEligible(t, retryAfterMs = 10) {
  const root = mkdtempSync(join(tmpdir(), 'dss-o08-resume-candidate-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  let providerCalls = 0;
  const runner = createRunner(store, { onMockCall: ({ phase }) => { if (phase === 'dispatch-confirmed') providerCalls++; } });
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
  return { root, jobId: result.job_id, store, result, admitted, terminal, window, providerCalls };
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
  assert.equal(inspected.status, 'resume-candidate');
  assert.equal(inspected.authority_check_required, true);
  assert.equal(inspected.read_only, true);
  assert.equal(inspected.writes_performed, 0);
  assert.equal(inspected.provider_calls_performed, 0);
  assert.equal(reopened.eventCount, beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(resumeClaimCalls(), 0);
  assert.equal(laterCalls, 0);
  assert.equal(seeded.providerCalls, 1);
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
