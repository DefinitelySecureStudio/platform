// Synthetic operator replay only. Never accepts live inputs or credentials.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const platformRoot = new URL('../', import.meta.url);
const { createSyntheticExecutionAuthorityVerifier, SYNTHETIC_EXECUTION_PURPOSE } = await import(new URL('src/offline-orchestration-prototype/execution-authority.js', platformRoot));
const { createOfflineOrchestrationPrototypeForTest, LocalFilePrototypeStore } = await import(new URL('src/offline-orchestration-prototype/testing.js', platformRoot));
const { canonicalJson } = await import(new URL('src/prompt-sdk/index.js', platformRoot));
const fixture = JSON.parse(readFileSync(new URL('tests/fixtures/comic-manifest-v1.json', platformRoot)));
const productionSource = JSON.stringify(fixture.production);
const stableStart = Date.parse('2026-11-08T02:40:00Z');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function authority() {
  return createSyntheticExecutionAuthorityVerifier(['execute', 'retry'].map((action, i) => ({
    decision_id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    decision: 'allow', action, purpose: SYNTHETIC_EXECUTION_PURPOSE,
    production: { production_id: fixture.production.production_id, revision: 1,
      identity_sha256: 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc' },
    not_before: '2026-01-01T00:00:00Z', review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/studio/issues/112'
  }))).verifier;
}
function runtime(epochId) {
  let now = 10000;
  return { now: () => now, epochId, wallNow: () => stableStart + now - 10000,
    setTimer: () => 1, clearTimer() {}, advance: delta => { now += delta; } };
}
function idFactory(start = 1) {
  return () => `90000000-0000-4000-8000-${String(start++).padStart(12, '0')}`;
}
async function run(mode) {
  const root = mkdtempSync(join(tmpdir(), 'dss-operator-replay-'));
  try {
    const mono = runtime('first-epoch');
    let stableNow = stableStart;
    let calls = 0;
    const store = new LocalFilePrototypeStore(root);
    const make = (nextStore, nextRuntime, firstId) => createOfflineOrchestrationPrototypeForTest({
      store: nextStore, runtime: nextRuntime, idFactory: idFactory(firstId),
      executionAuthorityProvider: authority(),
      resumeTimeAuthority: { id: 'studio.synthetic.resume-time-v1', mode: 'synthetic',
        domain_id: 'synthetic-resume-time-v1', epoch_id: 'stable-epoch', now: () => stableNow },
      onMockCall({ phase, mock }) {
        if (phase !== 'created') return;
        const execute = mock.execute.bind(mock);
        mock.execute = (...args) => { calls++; return execute(...args); };
      }
    });
    let runner = make(store, mono, 1);
    const first = await runner.submit({ productionSource,
      ...(mode === 'success' ? {} : { noOutputResultVersion: '1.1.0',
        mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 } }) });
    assert.equal(first.result.status, mode === 'success' ? 'complete' : 'failed');
    if (mode !== 'success') assert.equal(first.retry_eligible, true);
    const outcomes = [first];
    if (mode === 'retry' || mode === 'resume') {
      stableNow += 10;
      if (mode === 'retry') {
        mono.advance(10);
        outcomes.push(await runner.retry({ authorizeRetry: true }));
      } else {
        runner = make(new LocalFilePrototypeStore(root), runtime('new-epoch'), 100);
        outcomes.push(await runner.resume({ jobId: first.job_id, authorizeResume: true }));
      }
    }
    if (mode === 'retry' || mode === 'resume') {
      assert.equal(outcomes.at(-1).result.status, 'complete');
      assert.equal(outcomes.at(-1).kind, 'terminal');
    }
    const diagnostic = runner.inspectRecovery(first.job_id);
    assert.equal(diagnostic.status, mode === 'rate-limit' ? 'retry-delay-not-elapsed' : 'terminal');
    assert.equal(calls, mode === 'retry' || mode === 'resume' ? 2 : 1);
    const snapshot = {};
    // Entropy-bearing store-slot/claim tokens are coordination state, not replay output.
    for (const directory of ['events', 'blobs']) {
      for (const file of readdirSync(join(root, directory)).sort()) {
        const key = directory + '/' + file;
        snapshot[key] = readFileSync(join(root, key)).toString('base64');
      }
    }
    return { mode, calls, diagnostic, outcomes, snapshot };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const results = [];
for (const mode of ['success', 'rate-limit', 'retry', 'resume']) {
  const baseline = await run(mode);
  for (let i = 1; i < 3; i++) assert.deepEqual(await run(mode), baseline);
  results.push({ scenario: mode, repetitions: 3, calls_per_run: baseline.calls,
    diagnostic: baseline.diagnostic.status, event_and_blob_files: Object.keys(baseline.snapshot).length,
    canonical_evidence_sha256: sha(canonicalJson(baseline)), result: 'byte-identical' });
}
console.log(JSON.stringify({ fixed_ids_and_clocks: true, excluded: ['random store-slot token', 'random resume-claim token'], results }, null, 2));
