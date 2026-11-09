import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createSyntheticExecutionAuthorityVerifier, SYNTHETIC_EXECUTION_PURPOSE } from '../../src/offline-orchestration-prototype/execution-authority.js';
import { LocalFilePrototypeStore, createOfflineOrchestrationPrototypeForTest } from '../../src/offline-orchestration-prototype/testing.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
const productionSource = JSON.stringify(fixture.production);
const stableStart = Date.parse('2026-11-08T02:40:00Z');
const workerPath = fileURLToPath(new URL('./resume-subprocess-worker.mjs', import.meta.url));

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

async function seedCandidate(t) {
  const root = mkdtempSync(join(tmpdir(), 'dss-o08-subprocess-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  const runner = createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: {
      now: () => 10_000,
      epochId: 'parent-seed-process',
      wallNow: () => Date.parse('2026-11-08T02:40:00Z'),
      setTimer: () => 1,
      clearTimer: () => {}
    },
    idFactory: randomUUID,
    executionAuthorityProvider: authority().verifier,
    resumeTimeAuthority: {
      id: 'studio.synthetic.resume-time-v1', mode: 'synthetic',
      domain_id: 'synthetic-resume-time-v1', epoch_id: 'subprocess-fixture-epoch',
      now: () => stableStart
    }
  });
  const result = await runner.submit({
    productionSource,
    noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 }
  });
  assert.equal(result.kind, 'terminal');
  assert.equal(result.retry_eligible, true);
  const events = store.readEvents(result.job_id);
  const window = events.find(event => event.type === 'resume-window');
  assert.equal(window.retry_not_before_at_ms, stableStart + 10);
  return { root, jobId: result.job_id, store, window };
}

function startWorker(seed, mode = 'normal', extraEnv = {}) {
  const effectLog = extraEnv.DSS_O08_EFFECT_LOG ?? join(seed.root, 'synthetic-effects.log');
  const childEnvironment = {};
  for (const key of ['PATH', 'TMPDIR', 'TEMP', 'SystemRoot', 'WINDIR', 'LANG', 'LC_ALL']) {
    if (process.env[key] !== undefined) childEnvironment[key] = process.env[key];
  }
  const child = spawn(process.execPath, [workerPath], {
    cwd: process.cwd(),
    env: {
      ...childEnvironment,
      DSS_O08_STORE_ROOT: seed.root,
      DSS_O08_JOB_ID: seed.jobId,
      DSS_O08_STABLE_NOW: String(seed.window.retry_not_before_at_ms),
      DSS_O08_WORKER_MODE: mode,
      DSS_O08_EFFECT_LOG: effectLog,
      ...extraEnv
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  let allStdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    allStdout += chunk;
  });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const closed = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Subprocess timed out. stderr=${stderr}`));
    }, 15_000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout: allStdout, stderr });
    });
  });
  return {
    child,
    closed
  };
}

function effectCount(path) {
  if (!existsSync(path)) return 0;
  const contents = readFileSync(path, 'utf8').trim();
  return contents ? contents.split('\n').length : 0;
}

async function waitForFile(path, root, child) {
  if (existsSync(path)) return;
  await new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    let watcher;
    const finish = error => {
      if (settled) return;
      settled = true;
      watcher?.close();
      clearTimeout(timer);
      if (error) {
        child.kill('SIGKILL');
        reject(error);
      } else resolve();
    };
    watcher = watch(root, () => { if (existsSync(path)) finish(); });
    timer = setTimeout(() => finish(new Error(`Expected subprocess marker was not created: ${path}`)), 5_000);
    if (existsSync(path)) finish();
  });
}

async function runWorker(seed, mode = 'normal', extraEnv = {}) {
  const worker = startWorker(seed, mode, extraEnv);
  const exit = await worker.closed;
  let message;
  if (exit.code === 0 && exit.stdout.trim()) message = JSON.parse(exit.stdout.trim().split('\n').at(-1));
  else if (exit.code === 0) throw new Error(`Resume worker exited without a result. stderr=${exit.stderr}`);
  return { ...exit, pid: message?.pid, result: message?.result };
}

test('a separate Node process resumes the pinned synthetic candidate from the durable store', async t => {
  const seeded = await seedCandidate(t);
  const pidBefore = process.pid;
  const child = await runWorker(seeded);
  assert.equal(child.code, 0, child.stderr);
  assert.notEqual(child.pid, pidBefore);
  assert.equal(child.result.kind, 'terminal');
  const events = seeded.store.readEvents(seeded.jobId);
  const prepared = events.filter(event => event.type === 'prepared');
  assert.equal(prepared.length, 2);
  assert.equal(prepared[1].retry_of_attempt_id, prepared[0].attempt_id);
  assert.equal(events.filter(event => event.type === 'dispatch-started').length, 2);
  assert.equal(effectCount(join(seeded.root, 'synthetic-effects.log')), 1);
});

test('two Node processes contend for one durable claim and only the winner dispatches', async t => {
  const seeded = await seedCandidate(t);
  const ready = join(seeded.root, 'preflight.ready');
  const release = join(seeded.root, 'preflight.release');
  const winner = startWorker(seeded, 'hold-preflight', {
    DSS_O08_READY_MARKER: ready,
    DSS_O08_RELEASE_MARKER: release,
    DSS_O08_EFFECT_LOG: join(seeded.root, 'synthetic-effects.log')
  });
  await waitForFile(ready, seeded.root, winner.child);
  const contender = await runWorker(seeded);
  assert.equal(contender.code, 0, contender.stderr);
  assert.equal(contender.result.status, 'resume-claim-held');
  assert.equal(effectCount(join(seeded.root, 'synthetic-effects.log')), 0);
  writeFileSync(release, 'release\n', { flag: 'wx', mode: 0o600 });
  const completed = await winner.closed;
  assert.equal(completed.code, 0, completed.stderr);
  const result = JSON.parse(completed.stdout.trim().split('\n').at(-1)).result;
  assert.equal(result.kind, 'terminal');
  assert.equal(effectCount(join(seeded.root, 'synthetic-effects.log')), 1);
  assert.equal(seeded.store.readEvents(seeded.jobId).filter(event => event.type === 'dispatch-started').length, 2);
});

test('process death after claim leaves a permanent claim and no takeover', async t => {
  const seeded = await seedCandidate(t);
  const crashed = await runWorker(seeded, 'crash-after-claim');
  assert.equal(crashed.code, 73);
  const restarted = await runWorker(seeded);
  assert.equal(restarted.code, 0, restarted.stderr);
  assert.equal(restarted.result.status, 'resume-claim-held');
  assert.equal(effectCount(join(seeded.root, 'synthetic-effects.log')), 0);
  assert.equal(seeded.store.readEvents(seeded.jobId).filter(event => event.type === 'dispatch-started').length, 1);
});

test('process death after durable dispatch marker does not replay the mock call', async t => {
  const seeded = await seedCandidate(t);
  const effectLog = join(seeded.root, 'synthetic-effects.log');
  const crashed = await runWorker(seeded, 'crash-after-dispatch-marker', { DSS_O08_EFFECT_LOG: effectLog });
  assert.equal(crashed.code, 74);
  assert.equal(effectCount(effectLog), 0);
  const restarted = await runWorker(seeded);
  assert.equal(restarted.code, 0, restarted.stderr);
  assert.equal(restarted.result.status, 'resume-not-eligible');
  assert.equal(effectCount(effectLog), 0);
  assert.equal(seeded.store.readEvents(seeded.jobId).filter(event => event.type === 'dispatch-started').length, 2);
});

test('process death after one mock effect and an unlinked outcome blob quarantines without replay', async t => {
  const seeded = await seedCandidate(t);
  const effectLog = join(seeded.root, 'synthetic-effects.log');
  const crashed = await runWorker(seeded, 'crash-after-outcome-blob', {
    DSS_O08_EFFECT_LOG: effectLog
  });
  assert.equal(crashed.code, 75);
  assert.equal(effectCount(effectLog), 1);
  const restarted = await runWorker(seeded);
  assert.equal(restarted.code, 0, restarted.stderr);
  assert.equal(restarted.result.status, 'resume-not-eligible');
  assert.equal(effectCount(effectLog), 1);
  assert.equal(seeded.store.readEvents(seeded.jobId).filter(event => event.type === 'dispatch-started').length, 2);
});
