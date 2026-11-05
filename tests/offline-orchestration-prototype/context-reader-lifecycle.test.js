import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createSyntheticExecutionAuthorityVerifier,
  createSyntheticContextUseVerifier,
  SYNTHETIC_CONTEXT_READER_SLOTS
} from '../../src/offline-orchestration-prototype/index.js';
import { validateComicManifest, planComicReferences } from '../../src/comic-manifest/index.js';
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

function makeRuntime() {
  let now = 10_000;
  const timers = new Map();
  let timerId = 0;
  return {
    runtime: {
      now: () => now,
      epochId: 'o06-pending-reader-test',
      wallNow: () => Date.parse(fixture.at),
      setTimer(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
      clearTimer(id) { timers.delete(id); }
    },
    timers,
    advance(ms) { now += ms; }
  };
}

function makeAbortSignal() {
  const listeners = new Set();
  let aborted = false;
  return {
    signal: {
      get aborted() { return aborted; },
      addEventListener(type, callback) { if (type === 'abort') listeners.add(callback); },
      removeEventListener(type, callback) { if (type === 'abort') listeners.delete(callback); },
      get listenerCount() { return listeners.size; }
    },
    abort() {
      if (aborted) return;
      aborted = true;
      for (const listener of [...listeners]) listener.call(this.signal, { type: 'abort', target: this.signal });
    }
  };
}

function makePendingReaderHarness(pendingReader) {
  const report = validateComicManifest(canonicalJson(fixture.production));
  const production = { value: fixture.production, identity: report.identity, canonical: canonicalJson(fixture.production) };
  const executionRecord = (action, suffix) => ({
    decision_id: `40000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    decision: 'allow', action, purpose: SYNTHETIC_EXECUTION_PURPOSE,
    production: {
      production_id: production.value.production_id,
      revision: production.value.revision,
      identity_sha256: production.identity.sha256
    },
    not_before: '2026-01-01T00:00:00Z', review_after: '2027-01-01T00:00:00Z',
    expires_at: '2027-02-01T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/107'
  });
  const execution = createSyntheticExecutionAuthorityVerifier([
    executionRecord('execute', '001'), executionRecord('retry', '002')
  ]);
  const requests = ['execute', 'retry'].map(action => contextUseRequest(production, action));
  const useRecord = (action, suffix, request) => ({
    decision_id: `50000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    decision: 'allow', request,
    authorization: structuredClone(contextFixture.authorization),
    not_before: '2026-09-15T00:00:00Z', review_after: '2026-09-16T00:00:00Z',
    expires_at: '2026-09-16T00:00:00Z',
    authority_reference: 'https://github.com/DefinitelySecureStudio/platform/issues/106'
  });
  const use = createSyntheticContextUseVerifier([
    useRecord('execute', '001', requests[0]), useRecord('retry', '002', requests[1])
  ]);
  const slots = Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, Buffer.from('synthetic-reader-bytes')]));
  const plan = planComicReferences(production.canonical);
  const firstEntry = plan.references[0];
  const firstSlot = firstEntry.reference.kind === 'public'
    ? firstEntry.uses[0].role === 'canon' ? 'canon' : `dependency-${firstEntry.uses[0].index}`
    : firstEntry.reference.kind === 'context-package' ? 'context-package' : 'builder-result';
  const reads = [];
  let readerSignal;
  const readers = Object.fromEntries(SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, async ({ signal }) => {
    reads.push(slot);
    if (slot === firstSlot) { readerSignal = signal; return pendingReader(); }
    return Buffer.from(slots[slot]);
  }]));
  const context = { id: 'studio.synthetic.comic-context-readers', mode: 'synthetic', readers };
  const runtime = makeRuntime();
  const store = new InMemoryPrototypeStore();
  let mockFactoryCalls = 0;
  const value = createOfflineOrchestrationPrototypeForTest({
    runtime: runtime.runtime, store,
    executionAuthorityProvider: execution.verifier,
    syntheticContextReaders: context,
    contextUseAuthorityProvider: use.verifier,
    mockAdapterFactory(configuration) { mockFactoryCalls++; return new MockTextAdapter(configuration); }
  });
  return { value, store, reads, firstSlot, runtime, get readerSignal() { return readerSignal; },
    get mockFactoryCalls() { return mockFactoryCalls; } };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

for (const stop of ['cancel', 'timeout']) {
  for (const late of ['fulfill', 'reject']) {
    test(`pending protected reader: ${stop}, then late ${late}, has no downstream effects`, async t => {
      t.mock.timers.enable({ apis: ['setTimeout'] });
      const trackedTimers = new Set();
      const nativeSetTimeout = globalThis.setTimeout;
      const nativeClearTimeout = globalThis.clearTimeout;
      globalThis.setTimeout = (callback, delay, ...args) => {
        const handle = nativeSetTimeout(callback, delay, ...args);
        trackedTimers.add(handle);
        return handle;
      };
      globalThis.clearTimeout = handle => { trackedTimers.delete(handle); return nativeClearTimeout(handle); };

      const pending = deferred();
      let readerStartedResolve;
      const readerStarted = new Promise(resolve => { readerStartedResolve = resolve; });
      const harness = makePendingReaderHarness(() => {
        readerStartedResolve();
        return pending.promise;
      });
      const caller = makeAbortSignal();
      try {
        const submit = harness.value.submit({ productionSource, syntheticContext: true, signal: caller.signal });
        await readerStarted;
        assert.deepEqual(harness.reads, [harness.firstSlot]);
        assert.ok(harness.readerSignal instanceof AbortSignal);
        assert.equal(harness.readerSignal.aborted, false);
        assert.equal(trackedTimers.size, 1);
        if (stop === 'cancel') caller.abort();
        else t.mock.timers.tick(1000);

        await assert.rejects(submit, error => error.code === 'SYNTHETIC_CONTEXT_INPUT_INVALID');
        assert.deepEqual(harness.reads, [harness.firstSlot]);
        assert.equal(harness.mockFactoryCalls, 0);
        assert.equal(harness.store.eventCount, 0);
        assert.equal(harness.store.blobCount, 0);
        assert.equal(trackedTimers.size, 0);
        assert.equal(caller.signal.listenerCount, 0);
        assert.equal(harness.readerSignal.aborted, true);
        if (stop === 'cancel') assert.equal(caller.signal.aborted, true);

        if (late === 'fulfill') pending.resolve(Buffer.from('late synthetic reader fulfillment'));
        else pending.reject(new Error('late synthetic reader rejection'));
        await Promise.resolve();
        await Promise.resolve();
        assert.deepEqual(harness.reads, [harness.firstSlot]);
        assert.equal(harness.mockFactoryCalls, 0);
        assert.equal(harness.store.eventCount, 0);
        assert.equal(harness.store.blobCount, 0);
        assert.equal(trackedTimers.size, 0);
        assert.equal(harness.readerSignal.aborted, true);
      } finally {
        globalThis.setTimeout = nativeSetTimeout;
        globalThis.clearTimeout = nativeClearTimeout;
        t.mock.timers.reset();
      }
    });
  }
}
