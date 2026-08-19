import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AdapterExecutionError, ExecutionValidationError, MockTextAdapter,
  createExecutionRequest, executePrompt, mockTextAdapterDescriptor,
  renderPrompt, validateExecutionCompatibility, validateExecutionDocument,
  validateExecutionResult
} from "../../src/prompt-sdk/index.js";

const definition = JSON.parse(await readFile(new URL("../fixtures/prompt-definition.json", import.meta.url), "utf8"));

function request(overrides = {}) {
  const rendered = renderPrompt(definition, { inputValues: { item: "blue cube", attributes: {} } });
  return createExecutionRequest(rendered, {
    execution_id: "exec_test_0001", correlation_id: "build_test_0001", idempotency_key: "idem_test_0001",
    target: { adapter_id: "studio.mock.text", provider_id: "studio-mock", model_id: "mock-text-v1" },
    capabilities: { required: ["text-generation"], optional: [] }, parameters: {},
    expected_output: { kind: "text", media_type: "text/plain", validation: "none" },
    delegation: { caller_id: "test.runner", human_owner: "andrewperis", purpose: "Exercise a synthetic provider-neutral adapter.", authority_reference: "https://github.com/DefinitelySecureStudio/studio/issues/65" },
    observability: { retention: "metadata-only", capture_prompt: false, capture_output: false },
    ...overrides
  });
}

const clock = (...values) => { let index = 0; return () => values[Math.min(index++, values.length - 1)]; };

test("validates adapter, request, and result contract kinds", async () => {
  const adapter = new MockTextAdapter();
  const input = request({ capabilities: { required: ["text-generation", "seeded-generation"], optional: ["structured-output"] } });
  assert.equal(validateExecutionDocument(await adapter.describe()).valid, true);
  assert.equal(validateExecutionDocument(input).valid, true);
  const result = await executePrompt(input, { adapter, clock: clock(0, 12) });
  assert.equal(validateExecutionResult(result, { request: input, descriptor: await adapter.describe() }).valid, true);
});

test("executes one provider-neutral adapter call with exact identity and output provenance", async () => {
  const adapter = new MockTextAdapter();
  const result = await executePrompt(request(), { adapter, clock: clock(0, 12) });
  assert.equal(result.status, "succeeded");
  assert.deepEqual(result.identity, { adapter_id: "studio.mock.text", adapter_version: "1.0.0", provider_id: "studio-mock", model_id: "mock-text-v1", model_revision: "synthetic-1" });
  assert.equal(result.provider_request_id, "request-mock-0001");
  assert.equal(result.output.sha256, "sha256:ad56d367cf578d1295ce4a8b14d7ebb4357a1311f4fcd5e3d672a5d8f10f5d4a");
  assert.equal(result.output.classification, request().rendered_prompt.classification);
  assert.equal(adapter.calls.length, 1);
});

test("materializes adapter defaults only in the effective adapter request", async () => {
  const input = request({ parameters: {} });
  const adapter = new MockTextAdapter();
  const result = await executePrompt(input, { adapter, clock: clock(0, 1) });
  assert.deepEqual(input.parameters, {});
  assert.deepEqual(adapter.calls[0].parameters, { max_output_tokens: 256, temperature: 1, top_p: 1 });
  assert.equal(result.warnings.filter(({ code }) => code === "PARAMETER_DEFAULT_APPLIED").length, 3);
});

test("rejects capability, target, parameter, and extension mismatches before invocation", async () => {
  const cases = [
    request({ capabilities: { required: ["text-generation", "image-generation"], optional: [] } }),
    request({ target: { adapter_id: "studio.mock.text", provider_id: "other", model_id: "mock-text-v1" } }),
    request({ parameters: { max_output_tokens: 5000 } }),
    request({ extensions: { "studio.unsupported": { required: true, fallback: "reject", configuration: {} } } })
  ];
  for (const input of cases) {
    const adapter = new MockTextAdapter();
    const result = await executePrompt(input, { adapter, clock: clock(0, 1) });
    assert.equal(result.status, "failed");
    assert.equal(result.error.category, "capability-mismatch");
    assert.equal(adapter.calls.length, 0);
  }
});

test("reports emulation and omitted optional features without rejecting execution", async () => {
  const input = request({
    capabilities: { required: ["text-generation"], optional: ["structured-output", "image-generation"] },
    extensions: { "studio.unsupported": { required: false, fallback: "omit", configuration: {} } }
  });
  const adapter = new MockTextAdapter();
  const result = await executePrompt(input, { adapter, clock: clock(0, 1) });
  assert.equal(result.status, "succeeded");
  const codes = result.warnings.map(({ code }) => code);
  for (const code of ["OPTIONAL_CAPABILITY_EMULATED", "OPTIONAL_CAPABILITY_UNAVAILABLE", "OPTIONAL_EXTENSION_OMITTED"]) assert.ok(codes.includes(code));
});

test("rejects malformed requests with structured diagnostics and no invocation", async () => {
  const malformed = structuredClone(request());
  malformed.rendered_prompt.sha256 = `sha256:${"0".repeat(64)}`;
  const adapter = new MockTextAdapter();
  await assert.rejects(() => executePrompt(malformed, { adapter }), (error) => {
    assert.ok(error instanceof ExecutionValidationError);
    assert.ok(error.report.diagnostics.some(({ code }) => code === "RENDERED_PROMPT_DIGEST_MISMATCH"));
    return true;
  });
  assert.equal(adapter.calls.length, 0);
});

test("preserves normalized retry guidance without retrying", async () => {
  const adapter = new MockTextAdapter({ error: new AdapterExecutionError({
    category: "rate-limit", code: "PROVIDER_RATE_LIMIT", message: "Retry later.", retryable: true,
    stage: "provider", retry_after_ms: 1000, provider: { code: "synthetic_rate_limit", http_status: 429, request_id: "request-test-429" }
  }) });
  const result = await executePrompt(request(), { adapter, clock: clock(0, 5) });
  assert.equal(result.status, "failed");
  assert.equal(result.error.retry_after_ms, 1000);
  assert.equal(result.error.provider.request_id, "request-test-429");
  assert.equal(adapter.calls.length, 1);
});

test("redacts unexpected adapter exceptions", async () => {
  const secret = "secret-provider-value";
  const adapter = { describe: async () => mockTextAdapterDescriptor(), execute: async () => { throw new Error(secret); } };
  const result = await executePrompt(request(), { adapter, clock: clock(0, 1) });
  assert.equal(result.error.code, "ADAPTER_UNEXPECTED_ERROR");
  assert.doesNotMatch(JSON.stringify(result), new RegExp(secret));
});

test("returns cancellation before invocation and during a non-cooperative call", async () => {
  const before = new AbortController();
  before.abort();
  const untouched = new MockTextAdapter();
  assert.equal((await executePrompt(request(), { adapter: untouched, signal: before.signal, clock: clock(0, 0) })).status, "cancelled");
  assert.equal(untouched.calls.length, 0);

  const during = new AbortController();
  const adapter = { describe: async () => mockTextAdapterDescriptor(), execute: async () => new Promise(() => {}) };
  const pending = executePrompt(request(), { adapter, signal: during.signal, clock: clock(0, 2) });
  setImmediate(() => during.abort());
  assert.equal((await pending).status, "cancelled");
});

test("enforces timeout even when an adapter ignores its signal", async () => {
  const adapter = { describe: async () => mockTextAdapterDescriptor(), execute: async () => new Promise(() => {}) };
  const result = await executePrompt(request({ timeout_ms: 5 }), { adapter, clock: clock(0, 5) });
  assert.equal(result.status, "timed-out");
  assert.equal(result.error.category, "timeout");
});

test("normalizes invalid adapter outcomes into a safe failure", async () => {
  const adapter = { describe: async () => mockTextAdapterDescriptor(), execute: async () => ({ content: 42 }) };
  const result = await executePrompt(request(), { adapter, clock: clock(0, 1) });
  assert.equal(result.error.code, "INVALID_ADAPTER_OUTCOME");
  assert.equal(validateExecutionDocument(result).valid, true);
});

test("semantic validators catch duplicate capabilities and unsafe retry claims", () => {
  const descriptor = mockTextAdapterDescriptor();
  descriptor.capabilities.push(structuredClone(descriptor.capabilities[0]));
  assert.ok(validateExecutionDocument(descriptor).diagnostics.some(({ code }) => code === "DUPLICATE_CAPABILITY"));
  const compatibility = validateExecutionCompatibility(request(), mockTextAdapterDescriptor());
  assert.equal(compatibility.valid, true);
  assert.throws(() => new AdapterExecutionError({ category: "authentication", code: "AUTH_FAILED", message: "No.", retryable: true }), TypeError);
});
