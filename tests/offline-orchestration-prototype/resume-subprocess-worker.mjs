import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, watch, writeFileSync } from 'node:fs';
import { createSyntheticExecutionAuthorityVerifier, SYNTHETIC_EXECUTION_PURPOSE } from '../../src/offline-orchestration-prototype/execution-authority.js';
import { createOfflineOrchestrationPrototypeForTest, LocalFilePrototypeStore } from '../../src/offline-orchestration-prototype/testing.js';
import { MockTextAdapter } from '../../src/prompt-sdk/index.js';

const root = process.env.DSS_O08_STORE_ROOT;
const jobId = process.env.DSS_O08_JOB_ID;
const mode = process.env.DSS_O08_WORKER_MODE;
const stableNow = Number(process.env.DSS_O08_STABLE_NOW);
const production = {
  production_id: 'urn:uuid:10000000-0000-4000-8000-000000000001',
  revision: 1,
  identity_sha256: 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc'
};
const record = (action, suffix) => ({
  decision_id: `20000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
  decision: 'allow',
  action,
  purpose: SYNTHETIC_EXECUTION_PURPOSE,
  production,
  not_before: '2026-01-01T00:00:00Z',
  review_after: '2027-01-01T00:00:00Z',
  expires_at: '2027-02-01T00:00:00Z',
  authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/109'
});
const authority = createSyntheticExecutionAuthorityVerifier([record('execute', '1'), record('retry', '2')]);
const store = new LocalFilePrototypeStore(root);
const effectLog = process.env.DSS_O08_EFFECT_LOG;

class ObservedMock extends MockTextAdapter {
  async execute(request, options) {
    appendFileSync(effectLog, `${process.pid}\n`, { flag: 'a', mode: 0o600 });
    return super.execute(request, options);
  }
}

if (mode === 'crash-after-claim') {
  const claimResume = store.claimResume.bind(store);
  store.claimResume = value => {
    const result = claimResume(value);
    if (result.status === 'acquired') process.exit(73);
    return result;
  };
}

if (mode === 'barrier-before-claim') {
  const claimResume = store.claimResume.bind(store);
  store.claimResume = value => {
    const ready = `${process.env.DSS_O08_CLAIM_READY_DIR}/${process.pid}.ready`;
    const release = process.env.DSS_O08_CLAIM_RELEASE_MARKER;
    writeFileSync(ready, 'ready\n', { flag: 'wx', mode: 0o600 });
    const deadline = Date.now() + 10_000;
    const poll = new Int32Array(new SharedArrayBuffer(4));
    while (!existsSync(release)) {
      if (Date.now() >= deadline) process.exit(76);
      Atomics.wait(poll, 0, 0, 5);
    }
    return claimResume(value);
  };
}

if (mode === 'crash-after-dispatch-marker') {
  const append = store.append.bind(store);
  store.append = event => {
    const result = append(event);
    if (event.type === 'dispatch-started') process.exit(74);
    return result;
  };
}

let mockAdapterFactory = configuration => new ObservedMock(configuration);
if (mode === 'hold-preflight') {
  mockAdapterFactory = configuration => new class extends ObservedMock {
    async describe() {
      const ready = process.env.DSS_O08_READY_MARKER;
      const release = process.env.DSS_O08_RELEASE_MARKER;
      writeFileSync(ready, 'ready\n', { flag: 'wx', mode: 0o600 });
      await new Promise(resolve => {
        const watcher = watch(root, () => {
          if (existsSync(release)) { watcher.close(); resolve(); }
        });
        if (existsSync(release)) { watcher.close(); resolve(); }
      });
      return super.describe();
    }
  }(configuration);
}
if (mode === 'crash-after-outcome-blob') {
  const writeImmutable = store.writeImmutable.bind(store);
  store.writeImmutable = (key, bytes) => {
    const result = writeImmutable(key, bytes);
    if (key.startsWith('provider-outcome:')) process.exit(75);
    return result;
  };
}

const monotonicEpoch = `subprocess-${process.pid}`;
const runner = createOfflineOrchestrationPrototypeForTest({
  store,
  runtime: {
    now: () => Number(process.hrtime.bigint() / 1_000_000n),
    epochId: monotonicEpoch,
    wallNow: () => Date.parse('2026-11-08T02:40:00Z'),
    setTimer: (callback, delay) => setTimeout(callback, delay),
    clearTimer: timer => clearTimeout(timer)
  },
  idFactory: randomUUID,
  executionAuthorityProvider: authority.verifier,
  resumeTimeAuthority: {
    id: 'studio.synthetic.resume-time-v1',
    mode: 'synthetic',
    domain_id: 'synthetic-resume-time-v1',
    epoch_id: 'subprocess-fixture-epoch',
    now: () => stableNow
  },
  mockAdapterFactory
});

const result = await runner.resume({ jobId, authorizeResume: true });
process.stdout.write(`${JSON.stringify({ pid: process.pid, result })}\n`);
