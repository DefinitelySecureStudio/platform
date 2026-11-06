import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createSyntheticExecutionAuthorityVerifier,
  createSyntheticContextUseVerifier,
  SYNTHETIC_CONTEXT_READER_SLOTS
} from '../../src/offline-orchestration-prototype/index.js';
import { planComicReferences, validateComicManifest } from '../../src/comic-manifest/index.js';
import { canonicalJson, MockTextAdapter } from '../../src/prompt-sdk/index.js';
import { contextUseRequest } from '../../src/offline-orchestration-prototype/context-use-authority.js';
import {
  createOfflineOrchestrationPrototypeForTest,
  InMemoryPrototypeStore
} from '../../src/offline-orchestration-prototype/testing.js';
import { SYNTHETIC_EXECUTION_PURPOSE } from '../../src/offline-orchestration-prototype/execution-authority.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
const contextFixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json', import.meta.url), 'utf8'));
const productionSource = JSON.stringify(fixture.production);

function makeHarness({ shortRetryUseWindow = false } = {}) {
  let monotonic = 10_000;
  let wallNow = Date.parse(fixture.at);
  let nextId = 1;
  const runtime = {
    now: () => monotonic,
    epochId: 'o05-cached-retry-package-use',
    wallNow: () => wallNow,
    setTimer: () => 1,
    clearTimer: () => {}
  };
  const report = validateComicManifest(canonicalJson(fixture.production));
  const production = { value: fixture.production, identity: report.identity, canonical: canonicalJson(fixture.production) };
  const executionRecords = ['execute', 'retry'].map((action, index) => ({
    decision_id: `60000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    decision: 'allow', action, purpose: SYNTHETIC_EXECUTION_PURPOSE,
    production: {
      production_id: production.value.production_id,
      revision: production.value.revision,
      identity_sha256: production.identity.sha256
    },
    not_before: '2026-01-01T00:00:00Z', review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/106'
  }));
  const execution = createSyntheticExecutionAuthorityVerifier(executionRecords);
  const requests = ['execute', 'retry'].map(action => contextUseRequest(production, action));
  const retryWindow = shortRetryUseWindow ? {
    review_after: '2026-09-15T12:10:01Z', expires_at: '2026-09-15T12:10:01Z'
  } : {};
  const useRecords = ['execute', 'retry'].map((action, index) => ({
    decision_id: `70000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    decision: 'allow', request: requests[index],
    authorization: structuredClone(contextFixture.authorization),
    not_before: '2026-09-15T00:00:00Z',
    review_after: '2026-09-16T00:00:00Z', expires_at: '2026-09-16T00:00:00Z',
    ...(action === 'retry' ? retryWindow : {}),
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/106'
  }));
  const use = createSyntheticContextUseVerifier(useRecords);
  const slots = Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, undefined]));
  for (const entry of planComicReferences(production.canonical).references) {
    let slot;
    if (entry.reference.kind === 'context-package') slot = 'context-package';
    else if (entry.reference.kind === 'builder-result') slot = 'builder-result';
    else if (entry.uses[0].role === 'canon') slot = 'canon';
    else if (entry.uses[0].role === 'dependency') slot = `dependency-${entry.uses[0].index}`;
    else if (entry.uses[0].role === 'prompt') slot = 'prompt-description';
    slots[slot] = Buffer.from(entry.reference.kind === 'public'
      ? fixture.dependency_bytes[entry.reference.dependency.artifact.artifact_uri]
      : entry.reference.kind === 'context-package'
        ? canonicalJson(contextFixture.result.package)
        : canonicalJson(contextFixture.result));
  }
  const reads = [];
  const readers = Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, async () => {
    reads.push(slot);
    return Buffer.from(slots[slot]);
  }]));
  const store = new InMemoryPrototypeStore();
  const mocks = [];
  const value = createOfflineOrchestrationPrototypeForTest({
    runtime, store,
    idFactory: () => `80000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`,
    executionAuthorityProvider: execution.verifier,
    syntheticContextReaders: { id: 'studio.synthetic.comic-context-readers', mode: 'synthetic', readers },
    contextUseAuthorityProvider: use.verifier,
    mockAdapterFactory(configuration) {
      const mock = new MockTextAdapter(configuration);
      mocks.push(mock);
      return mock;
    }
  });
  return {
    value, store, reads, mocks, revoke: use.revoke,
    setWallNow(value) { wallNow = value; },
    advance(value) { monotonic += value; }
  };
}

for (const denied of ['revoked', 'expired']) test(`cached retry with ${denied} package-use authority does not reread evidence or call provider`, async () => {
  const harness = makeHarness({ shortRetryUseWindow: denied === 'expired' });
  const first = await harness.value.submit({
    productionSource, syntheticContext: true, noOutputResultVersion: '1.1.0',
    mockOutcome: { kind: 'rate-limit', retry_after_ms: 5 }
  });
  assert.equal(first.retry_eligible, true);
  assert.deepEqual([...harness.reads].sort(), [...SYNTHETIC_CONTEXT_READER_SLOTS].sort());
  assert.equal(harness.mocks.length, 1);
  assert.equal(harness.mocks[0].calls.length, 1);

  if (denied === 'revoked') harness.revoke('70000000-0000-4000-8000-000000000002');
  else harness.setWallNow(Date.parse('2026-09-15T12:10:01Z'));
  harness.advance(5);
  let protectedEvidenceReads = 0;
  const readImmutable = harness.store.readImmutable.bind(harness.store);
  harness.store.readImmutable = key => {
    protectedEvidenceReads++;
    return readImmutable(key);
  };
  const eventCount = harness.store.eventCount;

  await assert.rejects(() => harness.value.retry({ authorizeRetry: true }),
    error => error.code === 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
  assert.equal(protectedEvidenceReads, 0);
  assert.equal(harness.reads.length, SYNTHETIC_CONTEXT_READER_SLOTS.length);
  assert.equal(harness.mocks.length, 1);
  assert.equal(harness.mocks[0].calls.length, 1);
  assert.equal(harness.store.eventCount, eventCount);
});
