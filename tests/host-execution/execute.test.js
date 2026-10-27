import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  ExecutionValidationError, MockTextAdapter, createExecutionRequest,
  mockTextAdapterDescriptor, renderPrompt
} from '../../src/prompt-sdk/index.js';
import { executePromptWithPreflight } from '../../src/host-execution/index.js';
import { executePromptWithPreflightUsing } from '../../src/host-execution/execute.js';

const definition = JSON.parse(await readFile(new URL('../fixtures/prompt-definition.json', import.meta.url), 'utf8'));

function request(overrides = {}) {
  const rendered = renderPrompt(definition, { inputValues: { item: 'synthetic cube', attributes: {} } });
  return createExecutionRequest(rendered, {
    execution_id: 'exec_host_0001', correlation_id: 'corr_host_0001', idempotency_key: 'idem_host_0001',
    target: { adapter_id: 'studio.mock.text', provider_id: 'studio-mock', model_id: 'mock-text-v1' },
    capabilities: { required: ['text-generation'], optional: [] }, parameters: {},
    expected_output: { kind: 'text', media_type: 'text/plain', validation: 'none' },
    delegation: {
      caller_id: 'test.host-execution', human_owner: 'test-owner', purpose: 'Exercise host preflight.',
      authority_reference: 'https://example.invalid/authority/host-execution'
    },
    observability: { retention: 'metadata-only', capture_prompt: false, capture_output: false },
    ...overrides
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
}

function fakeRuntime({ now = 0, wallNow = 1_800_000_000_000, nowFunction } = {}) {
  let mono = now;
  let wall = wallNow;
  let nextId = 0;
  let clearCount = 0;
  const timers = new Map();
  return {
    runtime: {
      now: nowFunction ?? (() => mono),
      wallNow: () => wall,
      setTimer(callback, delay) {
        const id = ++nextId;
        timers.set(id, { callback, due: mono + delay, active: true });
        return id;
      },
      clearTimer(id) {
        clearCount += 1;
        const entry = timers.get(id);
        if (entry) entry.active = false;
      }
    },
    advance(milliseconds, { fire = true } = {}) {
      mono += milliseconds;
      wall += milliseconds;
      if (fire) {
        for (const entry of timers.values()) {
          if (entry.active && entry.due <= mono) {
            entry.active = false;
            entry.callback();
          }
        }
      }
    },
    activeTimerCount: () => [...timers.values()].filter(entry => entry.active).length,
    clearCount: () => clearCount
  };
}

function fakeSignal(initiallyAborted = false) {
  let aborted = initiallyAborted;
  const listeners = new Set();
  return {
    get aborted() { return aborted; },
    addEventListener(type, listener) {
      if (type === 'abort') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'abort') listeners.delete(listener);
    },
    abort() {
      if (aborted) return;
      aborted = true;
      for (const listener of [...listeners]) listener();
    },
    listenerCount: () => listeners.size
  };
}

const options = (adapter, extra = {}) => ({ adapter, preflightTimeoutMs: 100, ...extra });

test('validates the original request before options, then snapshots it synchronously', async () => {
  let descriptions = 0;
  const adapter = { describe() { descriptions += 1; return mockTextAdapterDescriptor(); }, execute: async () => ({ content: 'ok' }) };
  const malformed = structuredClone(request());
  malformed.rendered_prompt.sha256 = `sha256:${'0'.repeat(64)}`;
  malformed.uncloneable = () => {};
  await assert.rejects(() => executePromptWithPreflight(malformed, { preflightTimeoutMs: 0 }), error => {
    assert.ok(error instanceof ExecutionValidationError);
    assert.ok(error.report.diagnostics.some(({ code }) => code === 'NON_JSON_EXECUTION_DOCUMENT'));
    return true;
  });
  assert.equal(descriptions, 0);

  const input = structuredClone(request());
  const descriptor = deferred();
  const pending = executePromptWithPreflight(input, options({
    describe: () => descriptor.promise,
    execute: async () => ({ content: 'snapshot result' })
  }));
  input.execution_id = 'exec_changed_after_call';
  await flushMicrotasks();
  descriptor.resolve(mockTextAdapterDescriptor());
  const outcome = await pending;
  assert.equal(outcome.kind, 'execution');
  assert.equal(outcome.result.execution_id, 'exec_host_0001');
  assert.equal(outcome.result.status, 'succeeded');

  const proxiedRequest = new Proxy(structuredClone(request({ execution_id: 'exec_host_0003' })), {});
  const proxyOutcome = await executePromptWithPreflight(proxiedRequest, options(new MockTextAdapter()));
  assert.equal(proxyOutcome.kind, 'execution');
  assert.equal(proxyOutcome.result.execution_id, 'exec_host_0003');
});

test('validates adapter shape and invocation options before descriptor acquisition', async () => {
  let descriptions = 0;
  const adapter = { describe() { descriptions += 1; return mockTextAdapterDescriptor(); }, execute: async () => ({ content: 'ok' }) };
  const cyclicProvenance = {};
  cyclicProvenance.self = cyclicProvenance;
  const invalidCases = [
    { preflightTimeoutMs: 0 }, { preflightTimeoutMs: 1.5 }, { preflightTimeoutMs: Number.MAX_SAFE_INTEGER },
    { clock: 42 }, { signal: {} }, { observer: {} }, { observer: { observe() {} }, observerTimeoutMs: null },
    { observerTimeoutMs: 0 }, { observer: { observe() {} }, provenance: cyclicProvenance }, { adapter: { describe() {} } }
  ];
  for (const invalid of invalidCases) {
    const invocation = { ...options(adapter), ...invalid };
    await assert.rejects(() => executePromptWithPreflight(request(), invocation), TypeError);
  }
  assert.equal(descriptions, 0);

  const accessorOptions = Object.defineProperty({}, 'adapter', { get() { throw new Error('must not invoke option getter'); } });
  await assert.rejects(() => executePromptWithPreflight(request(), accessorOptions), TypeError);
  const accessorAdapter = { get describe() { throw new Error('must not invoke adapter getter'); }, execute() {} };
  await assert.rejects(() => executePromptWithPreflight(request(), options(accessorAdapter)), TypeError);
  assert.equal(descriptions, 0);
});

test('pre-abort returns only a host outcome and does not describe or observe', async () => {
  const signal = fakeSignal(true);
  let descriptions = 0;
  const records = [];
  const adapter = { describe() { descriptions += 1; return mockTextAdapterDescriptor(); }, execute: async () => ({ content: 'unused' }) };
  const outcome = await executePromptWithPreflight(request(), options(adapter, { signal, observer: { observe: record => records.push(record) } }));
  assert.equal(outcome.kind, 'preflight-stop');
  assert.equal(outcome.status, 'cancelled');
  assert.equal(outcome.preflight_timing.duration_ms, 0);
  assert.equal(descriptions, 0);
  assert.deepEqual(records, []);
});

test('stalled descriptor times out at host boundary, ignores late rejection, and cleans timer', async () => {
  const time = fakeRuntime();
  const descriptor = deferred();
  const records = [];
  let executions = 0;
  const adapter = { describe: () => descriptor.promise, execute: async () => { executions += 1; return { content: 'unused' }; } };
  const pending = executePromptWithPreflightUsing(request(), options(adapter, {
    preflightTimeoutMs: 25, observer: { observe: record => records.push(record) }
  }), time.runtime);
  await flushMicrotasks();
  time.advance(25);
  const outcome = await pending;
  assert.equal(outcome.kind, 'preflight-stop');
  assert.equal(outcome.status, 'timed-out');
  assert.equal(executions, 0);
  assert.deepEqual(records, []);
  assert.equal(time.activeTimerCount(), 0);
  assert.equal(time.clearCount(), 1);
  descriptor.reject(new Error('synthetic late descriptor failure'));
  await flushMicrotasks();
});

test('cancellation while describing returns only host outcome and removes its listener', async () => {
  const time = fakeRuntime();
  const signal = fakeSignal();
  const descriptor = deferred();
  const records = [];
  let executions = 0;
  const adapter = { describe: () => descriptor.promise, execute: async () => { executions += 1; return { content: 'unused' }; } };
  const pending = executePromptWithPreflightUsing(request(), options(adapter, {
    signal, observer: { observe: record => records.push(record) }
  }), time.runtime);
  await flushMicrotasks();
  assert.equal(signal.listenerCount(), 1);
  signal.abort();
  const outcome = await pending;
  assert.equal(outcome.kind, 'preflight-stop');
  assert.equal(outcome.status, 'cancelled');
  assert.equal(executions, 0);
  assert.deepEqual(records, []);
  assert.equal(signal.listenerCount(), 0);
  assert.equal(time.activeTimerCount(), 0);
  descriptor.resolve(mockTextAdapterDescriptor());
  await flushMicrotasks();
});

test('deadline wins simultaneous cancellation and descriptor settlement at the boundary', async () => {
  const time = fakeRuntime();
  const signal = fakeSignal();
  const descriptor = deferred();
  let executions = 0;
  const adapter = { describe: () => descriptor.promise, execute: async () => { executions += 1; return { content: 'unused' }; } };
  const pending = executePromptWithPreflightUsing(request(), options(adapter, { signal, preflightTimeoutMs: 10 }), time.runtime);
  await flushMicrotasks();
  time.advance(10, { fire: false });
  signal.abort();
  descriptor.resolve(mockTextAdapterDescriptor());
  const outcome = await pending;
  assert.equal(outcome.kind, 'preflight-stop');
  assert.equal(outcome.status, 'timed-out');
  assert.equal(executions, 0);
});

test('deadline is rechecked at handoff even when timer callback has not run', async () => {
  let call = 0;
  const time = fakeRuntime({ nowFunction: () => (++call >= 5 ? 10 : 0) });
  let executions = 0;
  const adapter = { describe: () => mockTextAdapterDescriptor(), execute: async () => { executions += 1; return { content: 'unused' }; } };
  const outcome = await executePromptWithPreflightUsing(request(), options(adapter, { preflightTimeoutMs: 10 }), time.runtime);
  assert.equal(outcome.kind, 'preflight-stop');
  assert.equal(outcome.status, 'timed-out');
  assert.equal(executions, 0);
});

test('invalid and non-JSON descriptors retain SDK invalid-descriptor classification', async () => {
  const malformed = { kind: 'provider-adapter-descriptor' };
  const nonJson = mockTextAdapterDescriptor();
  nonJson.loop = nonJson;
  for (const value of [malformed, nonJson]) {
    const records = [];
    let descriptions = 0;
    const adapter = {
      describe() { descriptions += 1; return value; },
      execute: async () => ({ content: 'unused' })
    };
    const outcome = await executePromptWithPreflight(request(), options(adapter, { observer: { observe: record => records.push(record) } }));
    assert.equal(descriptions, 1);
    assert.equal(outcome.kind, 'execution');
    assert.equal(outcome.result.status, 'failed');
    assert.equal(outcome.result.error.code, 'INVALID_ADAPTER_DESCRIPTOR');
    assert.equal(records.length, 1);
    assert.equal(records[0].record.status, 'failed');
  }
});

test('sync throws and async description failures retain SDK normalization and provenance', async () => {
  const secret = 'synthetic-descriptor-secret';
  for (const describe of [
    () => { throw new Error(secret); },
    async () => { throw new Error(secret); }
  ]) {
    const records = [];
    let descriptions = 0;
    const adapter = {
      describe() { descriptions += 1; return describe(); },
      execute: async () => ({ content: 'unused' })
    };
    const outcome = await executePromptWithPreflight(request(), options(adapter, { observer: { observe: record => records.push(record) } }));
    assert.equal(descriptions, 1);
    assert.equal(outcome.kind, 'execution');
    assert.equal(outcome.result.status, 'failed');
    assert.equal(outcome.result.error.code, 'ADAPTER_DESCRIPTION_FAILED');
    assert.doesNotMatch(JSON.stringify(outcome), new RegExp(secret));
    assert.equal(records.length, 1);
    assert.equal(records[0].record.status, 'failed');
  }
});

test('snapshot is per attempt, immutable to adapter mutation, execute keeps original this, and timing stays separate', async () => {
  const time = fakeRuntime();
  const firstDescriptor = deferred();
  const descriptors = [];
  const seenTimeouts = [];
  let descriptions = 0;
  const adapter = {
    marker: 'original-adapter',
    describe() {
      descriptions += 1;
      const descriptor = mockTextAdapterDescriptor();
      descriptor.model.revision = `snapshot-${descriptions}`;
      descriptors.push(descriptor);
      return descriptions === 1 ? firstDescriptor.promise : descriptor;
    },
    async execute(input) {
      assert.equal(this, adapter);
      seenTimeouts.push(input.timeout_ms);
      descriptors.at(-1).model.revision = 'mutated-after-snapshot';
      return { content: 'synthetic result' };
    }
  };

  const firstRequest = request({ timeout_ms: 23 });
  const first = executePromptWithPreflightUsing(firstRequest, options(adapter, {
    clock: (() => { let tick = 100; return () => { const out = tick; tick += 12; return out; }; })()
  }), time.runtime);
  await flushMicrotasks();
  time.advance(7, { fire: false });
  firstDescriptor.resolve(descriptors[0]);
  const firstOutcome = await first;
  assert.equal(firstOutcome.kind, 'execution');
  assert.equal(firstOutcome.result.identity.model_revision, 'snapshot-1');
  assert.equal(firstOutcome.result.timing.duration_ms, 12);
  assert.equal(firstOutcome.preflight_timing.duration_ms, 7);
  assert.equal(seenTimeouts[0], 23);

  const secondOutcome = await executePromptWithPreflightUsing(request({ execution_id: 'exec_host_0002' }), options(adapter), time.runtime);
  assert.equal(secondOutcome.result.identity.model_revision, 'snapshot-2');
  assert.equal(descriptions, 2);
});

test('request execution timeout starts after preflight and is passed through unchanged', async () => {
  const time = fakeRuntime();
  const descriptor = deferred();
  let receivedTimeout;
  const adapter = {
    describe: () => descriptor.promise,
    execute(input) {
      receivedTimeout = input.timeout_ms;
      return new Promise(() => {});
    }
  };
  const pending = executePromptWithPreflightUsing(request({ timeout_ms: 15 }), options(adapter, { preflightTimeoutMs: 200 }), time.runtime);
  await flushMicrotasks();
  time.advance(50, { fire: false });
  descriptor.resolve(mockTextAdapterDescriptor());
  const outcome = await pending;
  assert.equal(outcome.kind, 'execution');
  assert.equal(receivedTimeout, 15);
  assert.equal(outcome.result.status, 'timed-out');
  assert.equal(outcome.result.error.code, 'EXECUTION_TIMEOUT');
});

test('public wrapper rejects invalid preflight bounds without a default', async () => {
  let descriptions = 0;
  const adapter = { describe() { descriptions += 1; return mockTextAdapterDescriptor(); }, execute: async () => ({ content: 'ok' }) };
  await assert.rejects(() => executePromptWithPreflight(request(), { adapter }), TypeError);
  assert.equal(descriptions, 0);
});
