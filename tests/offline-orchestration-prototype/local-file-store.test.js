import assert from 'node:assert/strict';
import {
  appendFileSync, closeSync, fsyncSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  openSync, rmSync, statSync, symlinkSync, writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { canonicalJson, MockTextAdapter } from '../../src/prompt-sdk/index.js';
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
const sha256 = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

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

function prototype(store, onMockCall = () => {}, runtimeOverride = runtime(), mockAdapterFactoryOverride) {
  return createOfflineOrchestrationPrototypeForTest({
    store,
    runtime: runtimeOverride,
    idFactory: randomUUID,
    executionAuthorityProvider: authority(),
    ...(mockAdapterFactoryOverride ? { mockAdapterFactory: mockAdapterFactoryOverride } : {}),
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
  assert.deepEqual(inspection, {
    status: 'terminal',
    stage: 'terminal',
    code: 'TERMINAL_RESULT_VERIFIED',
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: false
  });
  const events = reopened.readEvents(completed.job_id);
  const resultPrepared = events.filter(item => item.type === 'result-prepared');
  const persisting = events.filter(item => item.type === 'persisting');
  const terminal = events.filter(item => item.type === 'terminal');
  assert.equal(resultPrepared.length, 1);
  assert.equal(persisting.length, 1);
  assert.equal(terminal.length, 1);
  const expected = completed.result;
  const resultBytes = reopened.readImmutable(`result:${expected.result_id}`);
  assert.ok(Buffer.isBuffer(resultBytes));
  assert.equal(resultBytes.toString('utf8'), canonicalJson(expected));
  for (const link of [resultPrepared[0], persisting[0], terminal[0]]) {
    assert.equal(link.attempt_id, completed.attempt_id);
    assert.equal(link.execution_id, completed.execution_id);
    assert.equal(link.result_id, expected.result_id);
    assert.equal(link.result_byte_size, resultBytes.byteLength);
    assert.equal(link.result_sha256, sha256(resultBytes));
  }
  assert.equal(resultPrepared[0].status, expected.status);
  const outcome = events.find(item => item.type === 'provider-outcome');
  assert.equal(outcome.attempt_id, completed.attempt_id);
  assert.equal(outcome.execution_id, completed.execution_id);
  assert.equal(outcome.status, 'succeeded');
  assert.equal(outcome.payload_key, `provider-outcome:${completed.execution_id}`);
  const outcomeBytes = reopened.readImmutable(outcome.payload_key);
  assert.ok(Buffer.isBuffer(outcomeBytes));
  assert.equal(outcomeBytes.byteLength, outcome.byte_size);
  assert.equal(sha256(outcomeBytes), outcome.sha256);
  for (const output of expected.outputs) {
    const artifact = output.artifact;
    const artifactBytes = reopened.readImmutable(`artifact:${artifact.artifact_uri}`);
    assert.ok(Buffer.isBuffer(artifactBytes));
    assert.equal(artifactBytes.byteLength, artifact.byte_size);
    assert.equal(sha256(artifactBytes), artifact.sha256);
  }
  assert.equal(reopened.eventCount, beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  await assert.rejects(() => restarted.submit({ productionSource }), error => error.code === 'JOB_STORE_LIFETIME_LIMIT');
});

test('read-only recovery rejects duplicate result links after reopening and keeps diagnostics value-free', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  let calls = 0;
  const first = prototype(store, ({ phase }) => {
    if (phase === 'dispatch-confirmed') calls++;
  });
  const completed = await first.submit({ productionSource });
  const eventPath = join(root, 'events', `${Buffer.from(completed.job_id).toString('base64url')}.jsonl`);
  const entries = readFileSync(eventPath, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));
  const terminalIndex = entries.findIndex(item => item.type === 'terminal');
  assert.ok(terminalIndex >= 0);
  const duplicate = structuredClone(entries[terminalIndex]);
  duplicate.private_content = 'PRIVATE-CONTENT-SENTINEL';
  duplicate.exception_text = 'EXCEPTION-TEXT-SENTINEL';
  duplicate.path = root;
  duplicate.fingerprint = 'FINGERPRINT-SENTINEL';
  duplicate.secret_digest = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  entries.splice(terminalIndex + 1, 0, duplicate);
  writeFileSync(eventPath, `${entries.map(item => canonicalJson(item)).join('\n')}\n`);

  let restartedCalls = 0;
  const reopened = new LocalFilePrototypeStore(root);
  const restarted = prototype(reopened, () => { restartedCalls++; });
  const beforeEvents = structuredClone(reopened.readEvents(completed.job_id));
  const beforeBlobs = reopened.blobCount;
  const inspection = restarted.inspectRecovery(completed.job_id);
  assert.deepEqual(inspection, {
    status: 'reconciliation-required',
    stage: 'integrity',
    code: 'RECONCILIATION_REQUIRED',
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: false
  });
  const diagnostic = JSON.stringify(inspection);
  for (const value of [completed.job_id, completed.attempt_id, completed.execution_id,
    completed.result.result_id, root, completed.result.outputs[0].artifact.artifact_uri,
    completed.result.outputs[0].artifact.sha256, 'PRIVATE-CONTENT-SENTINEL',
    'EXCEPTION-TEXT-SENTINEL', 'FINGERPRINT-SENTINEL', 'secret_digest']) {
    assert.equal(diagnostic.includes(value), false);
  }
  assert.deepEqual(reopened.readEvents(completed.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 1);
});


function localEventPath(root, jobId) {
  return join(root, 'events', `${Buffer.from(jobId).toString('base64url')}.jsonl`);
}

function localBlobPath(root, key) {
  return join(root, 'blobs', `${Buffer.from(key).toString('base64url')}.blob`);
}

function writeLocalEventLog(root, jobId, entries) {
  writeFileSync(localEventPath(root, jobId), `${entries.map(item => canonicalJson(item)).join('\n')}\n`);
}

function writeLocalBlob(root, key, bytes) {
  writeFileSync(localBlobPath(root, key), bytes);
}

function assertSafeReconciliation(inspection, values) {
  assert.deepEqual(inspection, {
    status: 'reconciliation-required',
    stage: 'integrity',
    code: 'RECONCILIATION_REQUIRED',
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: false
  });
  const publicValue = JSON.stringify(inspection);
  for (const value of values) assert.equal(publicValue.includes(value), false);
}

test('reopened inspection rejects orphan attempt lifecycle records without exposing their values', async t => {
  for (const orphanType of ['prepared', 'dispatch-started', 'provider-outcome']) {
    await t.test(orphanType, async t => {
      const root = temporaryDirectory();
      t.after(() => rmSync(root, { recursive: true, force: true }));
      const store = new LocalFilePrototypeStore(root);
      let calls = 0;
      const completed = await prototype(store, ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; }).submit({ productionSource });
      const entries = structuredClone(store.readEvents(completed.job_id));
      const source = entries.find(item => item.type === orphanType);
      assert.ok(source);
      const orphan = structuredClone(source);
      orphan.attempt_id = 'urn:uuid:30000000-0000-4000-8000-000000000003';
      orphan.private_content = 'ORPHAN-PRIVATE-CONTENT-SENTINEL';
      orphan.exception_text = 'ORPHAN-EXCEPTION-SENTINEL';
      orphan.fingerprint = 'ORPHAN-FINGERPRINT-SENTINEL';
      const closeIndex = entries.findIndex(item => item.type === 'job-closed');
      assert.ok(closeIndex >= 0);
      entries.splice(closeIndex, 0, orphan);
      writeLocalEventLog(root, completed.job_id, entries);

      const reopened = new LocalFilePrototypeStore(root);
      let restartedCalls = 0;
      const restarted = prototype(reopened, () => { restartedCalls++; });
      const beforeEvents = structuredClone(reopened.readEvents(completed.job_id));
      const beforeBlobs = reopened.blobCount;
      const inspection = restarted.inspectRecovery(completed.job_id);
      assertSafeReconciliation(inspection, [
        root, completed.job_id, completed.attempt_id, completed.execution_id,
        completed.result.result_id, completed.result.outputs[0].artifact.artifact_uri,
        completed.result.outputs[0].artifact.sha256, 'ORPHAN-PRIVATE-CONTENT-SENTINEL',
        'ORPHAN-EXCEPTION-SENTINEL', 'ORPHAN-FINGERPRINT-SENTINEL'
      ]);
      assert.deepEqual(reopened.readEvents(completed.job_id), beforeEvents);
      assert.equal(reopened.blobCount, beforeBlobs);
      assert.equal(restartedCalls, 0);
      assert.equal(calls, 1);
    });
  }
});

test('reopened inspection reconciles absent and non-object prepared production before canonicalization', async t => {
  for (const corruption of ['absent', 'non-object']) {
    await t.test(corruption, async t => {
      const root = temporaryDirectory();
      t.after(() => rmSync(root, { recursive: true, force: true }));
      const store = new LocalFilePrototypeStore(root);
      let calls = 0;
      const completed = await prototype(store, ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; }).submit({ productionSource });
      const entries = structuredClone(store.readEvents(completed.job_id));
      const prepared = entries.find(item => item.type === 'prepared');
      assert.ok(prepared);
      if (corruption === 'absent') delete prepared.production;
      else prepared.production = 'MALFORMED-PRODUCTION-SENTINEL';
      prepared.private_content = 'MALFORMED-PRIVATE-CONTENT-SENTINEL';
      prepared.exception_text = 'MALFORMED-EXCEPTION-SENTINEL';
      writeLocalEventLog(root, completed.job_id, entries);

      const reopened = new LocalFilePrototypeStore(root);
      let restartedCalls = 0;
      const restarted = prototype(reopened, () => { restartedCalls++; });
      const beforeEvents = structuredClone(reopened.readEvents(completed.job_id));
      const beforeBlobs = reopened.blobCount;
      assertSafeReconciliation(restarted.inspectRecovery(completed.job_id), [
        root, completed.job_id, completed.attempt_id, completed.execution_id,
        completed.result.result_id, 'MALFORMED-PRODUCTION-SENTINEL',
        'MALFORMED-PRIVATE-CONTENT-SENTINEL', 'MALFORMED-EXCEPTION-SENTINEL'
      ]);
      assert.deepEqual(reopened.readEvents(completed.job_id), beforeEvents);
      assert.equal(reopened.blobCount, beforeBlobs);
      assert.equal(restartedCalls, 0);
      assert.equal(calls, 1);
    });
  }
});

test('reopened inspection rejects a 1.1.0 no-output result paired with a success outcome', async t => {
  const root = temporaryDirectory();
  const successRoot = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  t.after(() => rmSync(successRoot, { recursive: true, force: true }));
  const failedStore = new LocalFilePrototypeStore(root);
  let calls = 0;
  const failed = await prototype(failedStore, ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; }).submit({
    productionSource,
    noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 }
  });
  assert.equal(failed.result.spec_version, '1.1.0');
  const successStore = new LocalFilePrototypeStore(successRoot);
  const successful = await prototype(successStore).submit({ productionSource });
  const successOutcomeEvent = successStore.readEvents(successful.job_id).find(item => item.type === 'provider-outcome');
  const successOutcome = JSON.parse(successStore.readImmutable(successOutcomeEvent.payload_key).toString('utf8'));
  successOutcome.execution_id = failed.execution_id;
  if (Object.hasOwn(successOutcome, 'idempotency_key')) successOutcome.idempotency_key = `idem-${failed.execution_id}`;
  const bytes = Buffer.from(canonicalJson(successOutcome), 'utf8');
  const entries = structuredClone(failedStore.readEvents(failed.job_id));
  const outcome = entries.find(item => item.type === 'provider-outcome');
  outcome.status = 'succeeded';
  outcome.byte_size = bytes.byteLength;
  outcome.sha256 = sha256(bytes);
  outcome.private_content = 'OUTCOME-PRIVATE-CONTENT-SENTINEL';
  writeLocalBlob(root, outcome.payload_key, bytes);
  writeLocalEventLog(root, failed.job_id, entries);

  const reopened = new LocalFilePrototypeStore(root);
  let restartedCalls = 0;
  const restarted = prototype(reopened, () => { restartedCalls++; });
  const beforeEvents = structuredClone(reopened.readEvents(failed.job_id));
  const beforeBlobs = reopened.blobCount;
  assertSafeReconciliation(restarted.inspectRecovery(failed.job_id), [
    root, failed.job_id, failed.attempt_id, failed.execution_id, failed.result.result_id,
    failed.result.outputs.length === 0 ? 'NO-ARTIFACT' : failed.result.outputs[0].artifact.artifact_uri,
    'OUTCOME-PRIVATE-CONTENT-SENTINEL'
  ]);
  assert.deepEqual(reopened.readEvents(failed.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 1);
});

test('reopened v1.0 result inspection checks production-output compatibility after linked digest updates', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  let calls = 0;
  const completed = await prototype(store, ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; }).submit({ productionSource });
  const resultKey = `result:${completed.result.result_id}`;
  const result = JSON.parse(store.readImmutable(resultKey).toString('utf8'));
  assert.equal(result.spec_version, '1.0.0');
  result.outputs[0].rendition_id = 'tampered-rendition';
  const bytes = Buffer.from(canonicalJson(result), 'utf8');
  const entries = structuredClone(store.readEvents(completed.job_id));
  const terminal = entries.find(item => item.type === 'terminal');
  assert.ok(terminal);
  terminal.private_content = 'COMPATIBILITY-PRIVATE-CONTENT-SENTINEL';
  for (const item of entries) {
    if (['result-prepared', 'persisting', 'terminal'].includes(item.type)) {
      item.result_byte_size = bytes.byteLength;
      item.result_sha256 = sha256(bytes);
    }
  }
  writeLocalBlob(root, resultKey, bytes);
  writeLocalEventLog(root, completed.job_id, entries);

  const reopened = new LocalFilePrototypeStore(root);
  let restartedCalls = 0;
  const restarted = prototype(reopened, () => { restartedCalls++; });
  const beforeEvents = structuredClone(reopened.readEvents(completed.job_id));
  const beforeBlobs = reopened.blobCount;
  assertSafeReconciliation(restarted.inspectRecovery(completed.job_id), [
    root, completed.job_id, completed.attempt_id, completed.execution_id, completed.result.result_id,
    completed.result.outputs[0].artifact.artifact_uri, completed.result.outputs[0].artifact.sha256,
    'COMPATIBILITY-PRIVATE-CONTENT-SENTINEL'
  ]);
  assert.deepEqual(reopened.readEvents(completed.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 1);
});


test('reopened no-result close requires its linked stop and rejects orphan dispatch records', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  let calls = 0;
  const controller = new AbortController();
  const value = prototype(store, ({ phase }) => {
    if (phase === 'created') controller.abort();
    if (phase === 'dispatch-confirmed') calls++;
  });
  const stopped = await value.submit({
    productionSource,
    signal: controller.signal
  });
  assert.equal(stopped.status, 'cancelled-before-dispatch');
  assert.equal(store.readEvents(stopped.job_id).some(item => item.type === 'terminal'), false);
  const validInspection = prototype(store).inspectRecovery(stopped.job_id);
  assert.equal(validInspection.status, 'closed-without-result');
  assert.equal(validInspection.code, 'JOB_CLOSED_WITHOUT_RESULT');
  const entries = structuredClone(store.readEvents(stopped.job_id));
  const prepared = entries.find(item => item.type === 'prepared');
  assert.ok(prepared);
  const orphanDispatch = {
    ...structuredClone(prepared),
    type: 'dispatch-started',
    attempt_id: 'urn:uuid:30000000-0000-4000-8000-000000000003',
    execution_id: 'exec-offline-30000000-0000-4000-8000-000000000003',
    call_number: 1,
    private_content: 'LOCAL-NO-RESULT-PRIVATE-SENTINEL',
    exception_text: 'LOCAL-NO-RESULT-EXCEPTION-SENTINEL'
  };
  const closeIndex = entries.findIndex(item => item.type === 'job-closed');
  assert.ok(closeIndex >= 0);
  entries.splice(closeIndex, 0, orphanDispatch);
  writeLocalEventLog(root, stopped.job_id, entries);

  const reopened = new LocalFilePrototypeStore(root);
  let restartedCalls = 0;
  const restarted = prototype(reopened, () => { restartedCalls++; });
  const beforeEvents = structuredClone(reopened.readEvents(stopped.job_id));
  const beforeBlobs = reopened.blobCount;
  assertSafeReconciliation(restarted.inspectRecovery(stopped.job_id), [
    root, stopped.job_id, stopped.attempt_id, stopped.execution_id,
    'LOCAL-NO-RESULT-PRIVATE-SENTINEL', 'LOCAL-NO-RESULT-EXCEPTION-SENTINEL'
  ]);
  assert.deepEqual(reopened.readEvents(stopped.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 0);
});


test('reopened retry expiry validates a job-scoped budget stop against its last eligible result', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  const clockState = { now: 10_000 };
  const controlledRuntime = { ...runtime(), now: () => clockState.now };
  let calls = 0;
  const value = prototype(store, ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; }, controlledRuntime);
  const first = await value.submit({
    productionSource,
    noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 }
  });
  assert.equal(first.retry_eligible, true);
  const admitted = store.readEvents(first.job_id).find(item => item.type === 'admitted');
  assert.ok(Number.isSafeInteger(admitted.deadline_monotonic_ms));
  clockState.now = admitted.deadline_monotonic_ms;

  const stopped = await value.retry({ authorizeRetry: true });
  assert.equal(stopped.status, 'budget-exhausted');
  const events = store.readEvents(first.job_id);
  const budgetStop = events.find(item => item.type === 'budget-exhausted' && item.attempt_id === undefined);
  assert.deepEqual(budgetStop, {
    job_id: first.job_id,
    type: 'budget-exhausted',
    reason: 'time',
    deadline_monotonic_ms: admitted.deadline_monotonic_ms
  });
  assert.equal(events.at(-1).type, 'job-closed');
  assert.equal(events.at(-1).reason, 'retry-budget-exhausted');
  assert.equal(calls, 1);

  const reopened = new LocalFilePrototypeStore(root);
  let restartedCalls = 0;
  const restarted = prototype(reopened, () => { restartedCalls++; }, controlledRuntime);
  const beforeEvents = structuredClone(reopened.readEvents(first.job_id));
  const beforeBlobs = reopened.blobCount;
  assert.deepEqual(restarted.inspectRecovery(first.job_id), {
    status: 'budget-exhausted',
    stage: 'limits',
    code: 'BUDGET_EXHAUSTED',
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: false
  });
  assert.deepEqual(reopened.readEvents(first.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 1);

  for (const corruption of ['deadline', 'reason', 'close', 'missing-result-chain']) {
    const corrupted = structuredClone(events);
    const stop = corrupted.find(item => item.type === 'budget-exhausted' && item.attempt_id === undefined);
    const close = corrupted.find(item => item.type === 'job-closed');
    assert.ok(stop);
    assert.ok(close);
    if (corruption === 'deadline') stop.deadline_monotonic_ms++;
    if (corruption === 'reason') stop.reason = 'attempts';
    if (corruption === 'close') close.reason = 'budget-time';
    if (corruption === 'missing-result-chain') {
      for (let index = corrupted.length - 1; index >= 0; index--) {
        if (['result-prepared', 'persisting', 'terminal'].includes(corrupted[index].type)) {
          corrupted.splice(index, 1);
        }
      }
    }
    writeLocalEventLog(root, first.job_id, corrupted);

    const corruptedStore = new LocalFilePrototypeStore(root);
    let corruptedCalls = 0;
    const corruptedRunner = prototype(corruptedStore, () => { corruptedCalls++; }, controlledRuntime);
    const unchangedEvents = structuredClone(corruptedStore.readEvents(first.job_id));
    const unchangedBlobs = corruptedStore.blobCount;
    assertSafeReconciliation(corruptedRunner.inspectRecovery(first.job_id), [
      root, first.job_id, first.attempt_id, first.execution_id,
      first.result.result_id, 'RETRY-BUDGET-PRIVATE-SENTINEL'
    ]);
    assert.deepEqual(corruptedStore.readEvents(first.job_id), unchangedEvents);
    assert.equal(corruptedStore.blobCount, unchangedBlobs);
    assert.equal(corruptedCalls, 0);
    writeLocalEventLog(root, first.job_id, events);
  }
});

test('reopened result chain rejects cancelled-before-dispatch naming a completed attempt', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  const clockState = { now: 10_000 };
  const controlledRuntime = { ...runtime(), now: () => clockState.now };
  let calls = 0;
  const value = prototype(store, ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; }, controlledRuntime);
  const first = await value.submit({
    productionSource,
    noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 }
  });
  clockState.now += 10;
  const completed = await value.retry({ authorizeRetry: true });
  assert.equal(completed.kind, 'terminal');
  assert.equal(completed.result.status, 'complete');
  assert.equal(calls, 2);
  const validReopened = new LocalFilePrototypeStore(root);
  assert.equal(prototype(validReopened, () => {}, controlledRuntime).inspectRecovery(first.job_id).status, 'terminal');

  const entries = structuredClone(store.readEvents(first.job_id));
  assert.ok(entries.some(item => item.type === 'dispatch-started' && item.attempt_id === completed.attempt_id));
  assert.ok(entries.some(item => item.type === 'terminal' && item.attempt_id === completed.attempt_id));
  const closeIndex = entries.findIndex(item => item.type === 'job-closed');
  assert.ok(closeIndex >= 0);
  entries.splice(closeIndex, 0, {
    job_id: first.job_id,
    type: 'cancelled-before-dispatch',
    attempt_id: completed.attempt_id,
    reason: 'caller-cancelled',
    private_content: 'CONTRADICTORY-STOP-PRIVATE-SENTINEL'
  });
  writeLocalEventLog(root, first.job_id, entries);

  const reopened = new LocalFilePrototypeStore(root);
  let restartedCalls = 0;
  const restarted = prototype(reopened, () => { restartedCalls++; }, controlledRuntime);
  const beforeEvents = structuredClone(reopened.readEvents(first.job_id));
  const beforeBlobs = reopened.blobCount;
  assertSafeReconciliation(restarted.inspectRecovery(first.job_id), [
    root, first.job_id, first.attempt_id, first.execution_id, completed.attempt_id,
    completed.execution_id, completed.result.result_id, 'CONTRADICTORY-STOP-PRIVATE-SENTINEL'
  ]);
  assert.deepEqual(reopened.readEvents(first.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 2);
});


test('reopened inspection accepts a result after the linked attempt observes its deadline', async t => {
  const root = temporaryDirectory();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = new LocalFilePrototypeStore(root);
  const clockState = { now: 10_000 };
  const controlledRuntime = { ...runtime(), now: () => clockState.now };
  let calls = 0;
  const mockAdapterFactory = configuration => new (class extends MockTextAdapter {
    async execute(...args) {
      const admitted = store.readEvents(store.readJobIds()[0]).find(item => item.type === 'admitted');
      clockState.now = admitted.deadline_monotonic_ms;
      return super.execute(...args);
    }
  })(configuration);
  const value = prototype(store,
    ({ phase }) => { if (phase === 'dispatch-confirmed') calls++; },
    controlledRuntime, mockAdapterFactory);
  const completed = await value.submit({ productionSource });
  assert.equal(completed.result.status, 'complete');
  assert.equal(calls, 1);
  const entries = store.readEvents(completed.job_id);
  const dispatch = entries.find(item => item.type === 'dispatch-started');
  const budgetStop = entries.find(item => item.type === 'budget-exhausted');
  const outcome = entries.find(item => item.type === 'provider-outcome');
  const preparedResult = entries.find(item => item.type === 'result-prepared');
  assert.deepEqual(budgetStop, {
    job_id: completed.job_id,
    type: 'budget-exhausted',
    reason: 'time',
    attempt_id: completed.attempt_id,
    execution_id: completed.execution_id,
    deadline_monotonic_ms: entries.find(item => item.type === 'admitted').deadline_monotonic_ms
  });
  assert.ok(entries.indexOf(dispatch) < entries.indexOf(budgetStop));
  assert.ok(entries.indexOf(budgetStop) < entries.indexOf(outcome));
  assert.ok(entries.indexOf(outcome) < entries.indexOf(preparedResult));

  const reopened = new LocalFilePrototypeStore(root);
  let restartedCalls = 0;
  const restarted = prototype(reopened, () => { restartedCalls++; }, controlledRuntime);
  const beforeEvents = structuredClone(reopened.readEvents(completed.job_id));
  const beforeBlobs = reopened.blobCount;
  assert.equal(restarted.inspectRecovery(completed.job_id).status, 'terminal');
  assert.deepEqual(reopened.readEvents(completed.job_id), beforeEvents);
  assert.equal(reopened.blobCount, beforeBlobs);
  assert.equal(restartedCalls, 0);
  assert.equal(calls, 1);
});
