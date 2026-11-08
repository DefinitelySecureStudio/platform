import assert from 'node:assert/strict';
import {
  appendFileSync, closeSync, fsyncSync, lstatSync, mkdirSync, mkdtempSync,
  openSync, rmSync, statSync, symlinkSync, writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { MockTextAdapter } from '../../src/prompt-sdk/index.js';
import {
  createSyntheticExecutionAuthorityVerifier,
  SYNTHETIC_EXECUTION_PURPOSE
} from '../../src/offline-orchestration-prototype/execution-authority.js';
import {
  createOfflineOrchestrationPrototypeForTest,
  LocalFilePrototypeStore,
  LOCAL_FILE_STORE_TRUST_BOUNDARY
} from '../../src/offline-orchestration-prototype/testing.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
const productionSource = JSON.stringify(fixture.production);

function temporaryDirectory() {
  return mkdtempSync(join(tmpdir(), 'dss-o08-local-store-'));
}

function recordingBootstrapFilesystem({ failPath } = {}) {
  const calls = [];
  const paths = new Map();
  return {
    calls,
    filesystem: {
      mkdirSync(path, options) { calls.push(['mkdir', path]); return mkdirSync(path, options); },
      lstatSync,
      openSync(path, flags) {
        const fd = openSync(path, flags);
        paths.set(fd, path);
        calls.push(['open', path]);
        return fd;
      },
      fsyncSync(fd) {
        const path = paths.get(fd);
        calls.push(['fsync', path]);
        if (path === failPath) throw new Error('INJECTED_BOOTSTRAP_FSYNC_FAILURE');
        return fsyncSync(fd);
      },
      closeSync(fd) {
        calls.push(['close', paths.get(fd)]);
        paths.delete(fd);
        return closeSync(fd);
      }
    }
  };
}

function authority() {
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
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/106'
  });
  return createSyntheticExecutionAuthorityVerifier([record('execute', '1'), record('retry', '2')]).verifier;
}

function runtime() {
  return {
    now: () => 10_000,
    epochId: 'local-file-store-test-epoch',
    wallNow: () => Date.parse('2026-10-28T17:00:00Z'),
    setTimer: (callback, delay) => setTimeout(callback, delay),
    clearTimer: timer => clearTimeout(timer)
  };
}

function prototype(store, onMockCall = () => {}) {
  return createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: runtime(),
    idFactory: randomUUID,
    executionAuthorityProvider: authority(),
    onMockCall
  });
}

test('local file store round-trips canonical events and immutable blobs after reopening', t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const jobId = '10000000-0000-4000-8000-000000000001';
  const blobKey = `input:${jobId}`;
  const bytes = Buffer.from('synthetic persisted bytes');
  const store = new LocalFilePrototypeStore(root);
  assert.equal(store.append({ job_id: jobId, type: 'admitted', sequence: 0 }), true);
  assert.equal(store.writeImmutable(blobKey, bytes), true);
  assert.throws(() => store.writeImmutable(blobKey, Buffer.from('replacement')));

  const reopened = new LocalFilePrototypeStore(root);
  assert.deepEqual(reopened.readEvents(jobId), [{ job_id: jobId, type: 'admitted', sequence: 0 }]);
  assert.deepEqual(reopened.readImmutable(blobKey), bytes);
  assert.deepEqual(reopened.readJobIds(), [jobId]);
  assert.equal(reopened.eventCount, 1);
  assert.equal(reopened.blobCount, 1);
  assert.equal(LOCAL_FILE_STORE_TRUST_BOUNDARY.same_account_hostile_edits, 'not-protected');
  assert.equal(LOCAL_FILE_STORE_TRUST_BOUNDARY.automatic_claim_takeover, false);
  assert.equal(statSync(root).mode & 0o777, 0o700);
  assert.equal(statSync(join(root, 'events', `${Buffer.from(jobId).toString('base64url')}.jsonl`)).mode & 0o777, 0o600);
});

test('local file store preserves one-shot claims across instances and never takes them over', t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const jobId = '10000000-0000-4000-8000-000000000002';
  const first = new LocalFilePrototypeStore(root);
  const acquired = first.claimResume(jobId);
  assert.equal(acquired.status, 'acquired');
  assert.equal(typeof acquired.claim_id, 'string');

  const reopened = new LocalFilePrototypeStore(root);
  assert.deepEqual(reopened.claimResume(jobId), { status: 'held' });
  assert.equal(reopened.readEvents(jobId).length, 0);
});

test('bootstrap fsyncs each directory and its parent before continuing initialization', t => {
  const parent = temporaryDirectory();
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const root = join(parent, 'store');
  const { calls, filesystem } = recordingBootstrapFilesystem();
  new LocalFilePrototypeStore(root, { bootstrapFilesystem: filesystem });

  const expected = [];
  const durableDirectory = (path, parentPath) => {
    expected.push(['mkdir', path]);
    for (const syncedPath of [path, parentPath]) {
      expected.push(['open', syncedPath], ['fsync', syncedPath], ['close', syncedPath]);
    }
  };
  durableDirectory(root, parent);
  durableDirectory(join(root, 'events'), root);
  durableDirectory(join(root, 'blobs'), root);
  durableDirectory(join(root, 'resume-claims'), root);
  assert.deepEqual(calls, expected);
});

test('bootstrap fsync failures stop initialization before child directories or store use', async t => {
  const parent = temporaryDirectory();
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const root = join(parent, 'store');
  for (const failPath of [root, parent]) await t.test(`failure syncing ${failPath === root ? 'root' : 'parent'}`, () => {
    const { calls, filesystem } = recordingBootstrapFilesystem({ failPath });
    assert.throws(() => new LocalFilePrototypeStore(root, { bootstrapFilesystem: filesystem }),
      /INJECTED_BOOTSTRAP_FSYNC_FAILURE/);
    assert.ok(calls.some(([operation, path]) => operation === 'fsync' && path === failPath));
    assert.equal(calls.some(([operation, path]) => operation === 'mkdir' && path === join(root, 'events')), false);
  });
  assert.equal(new LocalFilePrototypeStore(root).readJobIds().length, 0);
});

test('local file store returns unknown for a truncated event log and rejects a symlinked root', t => {
  const parent = temporaryDirectory();
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const root = join(parent, 'store');
  const store = new LocalFilePrototypeStore(root);
  const jobId = '10000000-0000-4000-8000-000000000003';
  store.append({ job_id: jobId, type: 'admitted', sequence: 0 });
  const path = join(root, 'events', `${Buffer.from(jobId).toString('base64url')}.jsonl`);
  appendFileSync(path, '{"partial":');
  assert.deepEqual(store.readEvents(jobId), { state: 'unknown' });

  const alias = join(parent, 'alias');
  symlinkSync(root, alias, 'dir');
  assert.throws(() => new LocalFilePrototypeStore(alias), /LOCAL_STORE_UNSAFE_DIRECTORY/);
});

test('local file store quarantines persisted pending event and blob writes after restart', t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const jobId = '10000000-0000-4000-8000-000000000004';
  const blobKey = `input:${jobId}`;
  const store = new LocalFilePrototypeStore(root);
  store.append({ job_id: jobId, type: 'admitted', sequence: 0 });
  store.writeImmutable(blobKey, Buffer.from('synthetic protected bytes'));
  writeFileSync(join(root, 'events', `${Buffer.from(jobId).toString('base64url')}.jsonl.pending`), 'ambiguous');
  writeFileSync(join(root, 'blobs', `${Buffer.from(blobKey).toString('base64url')}.blob.pending`), 'ambiguous');

  const reopened = new LocalFilePrototypeStore(root);
  assert.deepEqual(reopened.readEvents(jobId), { state: 'unknown' });
  assert.deepEqual(reopened.readImmutable(blobKey), { state: 'unknown' });
  assert.deepEqual(reopened.readJobIds(), { state: 'unknown' });
});

test('local file store treats non-canonical UTF-8 event bytes as unknown', t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const jobId = '10000000-0000-4000-8000-000000000005';
  const store = new LocalFilePrototypeStore(root);
  const encodedId = Buffer.from(jobId).toString('base64url');
  writeFileSync(join(root, 'events', `${encodedId}.jsonl`), Buffer.from([0xff, 0x0a]));
  assert.deepEqual(store.readEvents(jobId), { state: 'unknown' });
});

test('runner can inspect a committed synthetic result from a reopened local store without writes or calls', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  let calls = 0;
  const first = prototype(store, ({ phase }) => {
    if (phase === 'dispatch-confirmed') calls++;
  });
  const completed = await first.submit({ productionSource });
  assert.equal(completed.kind, 'terminal');
  assert.equal(completed.result.status, 'complete');
  assert.equal(calls, 1);

  let restartedCalls = 0;
  const reopened = new LocalFilePrototypeStore(root);
  const restarted = prototype(reopened, () => { restartedCalls++; });
  const beforeEvents = reopened.eventCount;
  const beforeBlobs = reopened.blobCount;
  const inspection = restarted.inspectRecovery(completed.job_id);
  assert.equal(inspection.status, 'terminal');
  assert.equal(inspection.read_only, true);
  assert.equal(inspection.writes_performed, 0);
  assert.equal(inspection.provider_calls_performed, 0);
  assert.equal(reopened.eventCount, beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  await assert.rejects(() => restarted.submit({ productionSource }), error => error.code === 'JOB_STORE_LIFETIME_LIMIT');
});
