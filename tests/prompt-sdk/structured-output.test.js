import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MockTextAdapter, StructuredOutputError, createExecutionRequest, executePrompt,
  processStructuredOutput, renderPrompt, tryProcessStructuredOutput,
  validateStructuredOutputDocument
} from "../../src/prompt-sdk/index.js";

const definition = JSON.parse(await readFile(new URL("../fixtures/prompt-definition.json", import.meta.url), "utf8"));
const schemaSource = await readFile(new URL("../fixtures/structured-output/reference-facts.schema.json", import.meta.url), "utf8");

function hash(source) { return `sha256:${createHash("sha256").update(source).digest("hex")}`; }

function schemaReference(source = schemaSource, overrides = {}) {
  const document = JSON.parse(source);
  return {
    schema_id: document.$id, repository: "DefinitelySecureStudio/codex", contract: "reference-facts",
    version: "1.0.0", tag: "contract/reference-facts/v1.0.0", commit: "2222222222222222222222222222222222222222",
    artifact_uri: "https://example.invalid/definitely-secure/contracts/reference-facts-v1.0.0.json",
    media_type: "application/schema+json", byte_size: Buffer.byteLength(source), sha256: hash(source), ...overrides
  };
}

function request({ validation = "json-schema", schema = schemaReference(), observability, capabilities } = {}) {
  const rendered = renderPrompt(definition, { inputValues: { item: "blue cube", attributes: {} } });
  return createExecutionRequest(rendered, {
    execution_id: "exec_structured_0001", idempotency_key: "idem_structured_0001",
    target: { adapter_id: "studio.mock.text", provider_id: "studio-mock", model_id: "mock-text-v1" },
    capabilities: capabilities ?? { required: ["text-generation", "structured-output"], optional: [] }, parameters: {},
    expected_output: { kind: "json", media_type: "application/json", validation, ...(validation === "json-schema" ? { schema } : {}) },
    delegation: { caller_id: "structured.test", human_owner: "andrewperis", purpose: "Validate a synthetic structured response.", authority_reference: "https://github.com/DefinitelySecureStudio/studio/issues/68" },
    observability: observability ?? { retention: "metadata-only", capture_prompt: false, capture_output: false }
  });
}

async function execution(raw, requestOptions) {
  const input = request(requestOptions);
  const result = await executePrompt(input, { adapter: new MockTextAdapter({ content: raw }), clock: (() => { let value = 0; return () => value++; })() });
  assert.equal(result.status, "succeeded");
  return { input, result };
}

function options(overrides = {}) {
  return { processing_id: "structured_process_0001", rawRetention: "identity-only", providerConstraintMode: "adapter-emulated", schemaSource, ...overrides };
}

test("parses once, validates the exact schema, and distinguishes raw from normalized", async () => {
  const raw = '{\n  "unknown_fields": ["weight"],\n  "facts": [{"value":"blue","field":"color"}]\n}';
  const { input, result } = await execution(raw, { observability: { retention: "restricted-content", capture_prompt: false, capture_output: true } });
  const processed = processStructuredOutput(input, result, options({ rawRetention: "inline" }));
  assert.equal(processed.status, "validated");
  assert.equal(processed.raw.content, raw);
  assert.deepEqual(processed.normalized.value, { unknown_fields: ["weight"], facts: [{ value: "blue", field: "color" }] });
  assert.notEqual(processed.raw.sha256, processed.normalized.sha256);
  assert.equal(processed.expectation.schema.sha256, schemaReference().sha256);
  assert.deepEqual(processed.provider_constraint, { mode: "adapter-emulated", capability: "structured-output", adapter_id: "studio.mock.text", independently_validated: true });
  assert.equal(validateStructuredOutputDocument(processed).valid, true);
});

test("supports syntax-only JSON without loading a schema", async () => {
  const { input, result } = await execution('[3,{"ok":true}]', { validation: "json-syntax" });
  const processed = processStructuredOutput(input, result, { ...options(), schemaSource: undefined });
  assert.deepEqual(processed.normalized.value, [3, { ok: true }]);
  assert.equal(processed.expectation.validation, "json-syntax");
});

test("malformed and duplicate-key JSON fail explicitly without normalized data", async () => {
  for (const [raw, code] of [['{"facts":[}', "STRUCTURED_OUTPUT_JSON_SYNTAX"], ['{"facts":[],"facts":[],"unknown_fields":[]}', "STRUCTURED_OUTPUT_DUPLICATE_KEY"]]) {
    const { input, result } = await execution(raw);
    const attempt = tryProcessStructuredOutput(input, result, options());
    assert.equal(attempt.ok, false);
    assert.equal(attempt.failure.stage, "parse");
    assert.equal(attempt.failure.diagnostics[0].code, code);
    assert.equal("normalized" in attempt.failure, false);
    assert.equal("content" in attempt.failure.raw, false);
    assert.equal(validateStructuredOutputDocument(attempt.failure).valid, true);
    assert.throws(() => processStructuredOutput(input, result, options()), (error) => error instanceof StructuredOutputError && error.code === code);
  }
});

test("schema-invalid values return precise value-free diagnostics and no fabricated fields", async () => {
  const sensitive = "PRIVATE-STRUCTURED-VALUE";
  const { input, result } = await execution(`{"facts":[{"field":"color","value":{"secret":"${sensitive}"}}]}`, { observability: { retention: "restricted-content", capture_prompt: false, capture_output: true } });
  const processingOptions = options({ rawRetention: "inline" });
  const attempt = tryProcessStructuredOutput(input, result, processingOptions);
  assert.equal(attempt.ok, false);
  assert.equal(attempt.failure.stage, "schema-validation");
  assert.ok(attempt.failure.diagnostics.some(({ code, path }) => code === "STRUCTURED_OUTPUT_SCHEMA_TYPE" && path === "/facts/0/value"));
  assert.ok(attempt.failure.diagnostics.some(({ code }) => code === "STRUCTURED_OUTPUT_SCHEMA_REQUIRED"));
  assert.equal("normalized" in attempt.failure, false);
  assert.match(attempt.failure.raw.content, new RegExp(sensitive));
  assert.doesNotMatch(JSON.stringify(attempt.failure.diagnostics), new RegExp(sensitive));
  assert.equal(validateStructuredOutputDocument(attempt.failure).valid, true);
  assert.throws(() => processStructuredOutput(input, result, processingOptions), (error) => {
    assert.ok(error instanceof StructuredOutputError);
    assert.doesNotMatch(JSON.stringify(error), new RegExp(sensitive));
    return true;
  });
});

test("verifies schema bytes, id, dialect, and offline compilation before use", async () => {
  const raw = '{"facts":[],"unknown_fields":[]}';
  const { input, result } = await execution(raw);
  const corrupted = `${schemaSource} `;
  let attempt = tryProcessStructuredOutput(input, result, options({ schemaSource: corrupted }));
  assert.equal(attempt.failure.stage, "schema-integrity");
  assert.equal(attempt.failure.diagnostics[0].code, "STRUCTURED_OUTPUT_SCHEMA_SIZE_MISMATCH");

  for (const [mutate, code, stage] of [
    [(schema) => { schema.$id = "urn:example:different"; }, "STRUCTURED_OUTPUT_SCHEMA_ID_MISMATCH", "schema-integrity"],
    [(schema) => { schema.$schema = "http://json-schema.org/draft-07/schema#"; }, "STRUCTURED_OUTPUT_SCHEMA_DIALECT", "schema-load"],
    [(schema) => { schema.properties.facts = { $ref: "https://example.invalid/unavailable.json" }; }, "STRUCTURED_OUTPUT_SCHEMA_COMPILE", "schema-load"]
  ]) {
    const document = JSON.parse(schemaSource); mutate(document); const source = `${JSON.stringify(document)}\n`;
    const exactInput = request({ schema: schemaReference(source, { schema_id: schemaReference().schema_id }) });
    const exactResult = await executePrompt(exactInput, { adapter: new MockTextAdapter({ content: raw }) });
    attempt = tryProcessStructuredOutput(exactInput, exactResult, options({ schemaSource: source }));
    assert.equal(attempt.failure.stage, stage);
    assert.equal(attempt.failure.diagnostics[0].code, code);
  }
});

test("enforces raw output integrity and explicit restricted retention", async () => {
  const raw = '{"facts":[],"unknown_fields":[]}';
  const { input, result } = await execution(raw);
  let attempt = tryProcessStructuredOutput(input, result, options({ rawRetention: "inline" }));
  assert.equal(attempt.failure.diagnostics[0].code, "STRUCTURED_OUTPUT_RETENTION_NOT_AUTHORIZED");
  assert.equal("content" in attempt.failure.raw, false);

  const referenced = structuredClone(result);
  referenced.output.delivery = "reference";
  delete referenced.output.content;
  referenced.output.reference = { artifact_uri: "https://example.invalid/restricted/raw.json", media_type: "application/json", byte_size: referenced.output.byte_size, sha256: referenced.output.sha256 };
  attempt = tryProcessStructuredOutput(input, referenced, options({ rawSource: `${raw} ` }));
  assert.equal(attempt.failure.stage, "raw-integrity");
  assert.ok(attempt.failure.diagnostics.some(({ code }) => code === "STRUCTURED_OUTPUT_RAW_SIZE_MISMATCH"));
  assert.equal(validateStructuredOutputDocument(attempt.failure).valid, true);
});

test("rejects byte-order marks and invalid UTF-8 before JSON parsing", async () => {
  const { input, result } = await execution('{"facts":[],"unknown_fields":[]}');
  for (const [rawSource, code] of [[Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]), "STRUCTURED_OUTPUT_BOM_NOT_ALLOWED"], [Buffer.from([0xc3, 0x28]), "STRUCTURED_OUTPUT_UTF8_INVALID"]]) {
    const referenced = structuredClone(result);
    referenced.output.delivery = "reference";
    referenced.output.byte_size = rawSource.byteLength;
    referenced.output.sha256 = hash(rawSource);
    delete referenced.output.content;
    referenced.output.reference = { artifact_uri: "https://example.invalid/restricted/raw.json", media_type: "application/json", byte_size: rawSource.byteLength, sha256: hash(rawSource) };
    const attempt = tryProcessStructuredOutput(input, referenced, options({ rawSource }));
    assert.equal(attempt.failure.stage, "raw-integrity");
    assert.ok(attempt.failure.diagnostics.some((entry) => entry.code === code));
    assert.equal(validateStructuredOutputDocument(attempt.failure).valid, true);
  }
});

test("retains an exact raw reference only under compatible policy", async () => {
  const raw = '{"facts":[],"unknown_fields":[]}';
  const { input, result } = await execution(raw, { observability: { retention: "restricted-content", capture_prompt: false, capture_output: true } });
  const rawReference = { artifact_uri: "https://example.invalid/restricted/raw.json", media_type: "application/json", byte_size: result.output.byte_size, sha256: result.output.sha256 };
  const processed = processStructuredOutput(input, result, options({ rawRetention: "reference", rawReference }));
  assert.deepEqual(processed.raw.reference, rawReference);
  assert.equal(processed.provider_constraint.mode, "adapter-emulated");
  assert.equal("content" in processed.raw, false);
});

test("rejects provider-native claims that contradict adapter emulation provenance", async () => {
  const { input, result } = await execution('{"facts":[],"unknown_fields":[]}');
  const attempt = tryProcessStructuredOutput(input, result, options({ providerConstraintMode: "provider-native" }));
  assert.equal(attempt.ok, false);
  assert.equal(attempt.error.code, "STRUCTURED_OUTPUT_CONSTRAINT_PROVENANCE_MISMATCH");
});

test("records a provider-native constraint without importing provider SDK types", async () => {
  const { input, result } = await execution('{"facts":[],"unknown_fields":[]}');
  const nativeInput = structuredClone(input);
  nativeInput.target.adapter_id = "studio.native.text";
  const nativeResult = structuredClone(result);
  nativeResult.identity.adapter_id = "studio.native.text";
  nativeResult.warnings = nativeResult.warnings.filter(({ code, details }) => !(code === "CAPABILITY_EMULATED" && details?.capability === "structured-output"));
  const processed = processStructuredOutput(nativeInput, nativeResult, options({ providerConstraintMode: "provider-native" }));
  assert.deepEqual(processed.provider_constraint, { mode: "provider-native", capability: "structured-output", adapter_id: "studio.native.text", independently_validated: true });
});

test("contract validation independently detects raw and normalized identity corruption", async () => {
  const raw = '{"facts":[],"unknown_fields":[]}';
  const { input, result } = await execution(raw, { observability: { retention: "restricted-content", capture_prompt: false, capture_output: true } });
  const processed = processStructuredOutput(input, result, options({ rawRetention: "inline" }));
  const badRaw = structuredClone(processed); badRaw.raw.sha256 = `sha256:${"0".repeat(64)}`;
  assert.ok(validateStructuredOutputDocument(badRaw).diagnostics.some(({ code }) => code === "STRUCTURED_RAW_DIGEST_MISMATCH"));
  const badNormalized = structuredClone(processed); badNormalized.normalized.value.facts.push({ field: "x", value: 1 });
  assert.ok(validateStructuredOutputDocument(badNormalized).diagnostics.some(({ code }) => code === "STRUCTURED_NORMALIZED_SIZE_MISMATCH"));
});

test("preflight rejects failed execution and missing explicit processing options", async () => {
  const { input, result } = await execution('{"facts":[],"unknown_fields":[]}');
  const missing = tryProcessStructuredOutput(input, result);
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "STRUCTURED_OUTPUT_OPTIONS_REQUIRED");
  const failed = structuredClone(result); failed.status = "failed"; failed.finish_reason = "error"; delete failed.output;
  failed.error = { category: "output-validation", code: "SYNTHETIC_FAILURE", message: "Synthetic failure.", retryable: false, stage: "output-validation" };
  assert.throws(() => processStructuredOutput(input, failed, options()), (error) => error instanceof StructuredOutputError && error.code === "STRUCTURED_OUTPUT_EXECUTION_FAILED");
});
