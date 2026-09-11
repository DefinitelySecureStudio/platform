import assert from 'node:assert/strict';
import test from 'node:test';
import { executePrompt, validateExecutionDocument, validateExecutionResult } from '../../src/prompt-sdk/index.js';

// Factories must be offline, deterministic, and return a fresh adapter per case.
// createCase(mode) -> { adapter, request, calls() }. Modes are documented in tests/README.md.
export function adapterConformance(name, createCase) {
  test(name + ': valid stable descriptor and successful normalized execution', async () => {
    const { adapter, request, calls } = await createCase('success');
    const descriptor = await adapter.describe();
    assert.equal(validateExecutionDocument(descriptor).valid, true);
    assert.deepEqual(await adapter.describe(), descriptor);
    const before = structuredClone(request);
    const result = await executePrompt(request, { adapter });
    assert.equal(result.status, 'succeeded');
    assert.equal(validateExecutionResult(result, { request, descriptor }).valid, true);
    assert.deepEqual(request, before);
    assert.equal(calls(), 1);
  });
  test(name + ': rejects unsupported capability without invocation', async () => {
    const { adapter, request, calls } = await createCase('success');
    request.capabilities.required.push('studio.conformance.unsupported');
    const result = await executePrompt(request, { adapter });
    assert.equal(result.error.code, 'EXECUTION_PREFLIGHT_REJECTED');
    assert.equal(calls(), 0);
  });
  test(name + ': cancellation before invocation', async () => {
    const { adapter, request, calls } = await createCase('success');
    const controller = new AbortController(); controller.abort();
    const result = await executePrompt(request, { adapter, signal: controller.signal });
    assert.equal(result.status, 'cancelled');
    assert.equal(calls(), 0);
  });
  test(name + ': deadline bounds a slow transport', async () => {
    const { adapter, request, calls } = await createCase('slow');
    request.timeout_ms = 1;
    const result = await executePrompt(request, { adapter });
    assert.equal(result.status, 'timed-out');
    assert.equal(calls(), 1);
    assert.equal(validateExecutionDocument(result).valid, true);
  });
  test(name + ': unexpected transport exception is redacted without retry', async () => {
    const { adapter, request, calls } = await createCase('error');
    const result = await executePrompt(request, { adapter });
    assert.equal(result.status, 'failed');
    assert.equal(result.error.code, 'ADAPTER_UNEXPECTED_ERROR');
    assert.doesNotMatch(JSON.stringify(result), /CONFORMANCE_SECRET/);
    assert.equal(calls(), 1);
  });
  test(name + ': malformed outcome fails normalization', async () => {
    const { adapter, request, calls } = await createCase('invalid');
    const result = await executePrompt(request, { adapter });
    assert.equal(result.status, 'failed');
    assert.equal(result.error.category, 'invalid-provider-response');
    assert.equal(calls(), 1);
  });
}
