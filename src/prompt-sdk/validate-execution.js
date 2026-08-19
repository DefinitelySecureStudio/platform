import { createHash } from "node:crypto";
import validateSchema from "./generated/provider-execution-v1-schema.js";
import { canonicalJson } from "./canonical-json.js";
import { diagnostic, EXECUTION_CONTRACT, pointer, report } from "./diagnostics.js";

const PARAMETER_NAMES = ["max_output_tokens", "temperature", "top_p", "stop_sequences", "seed"];
const RETRYABLE_CATEGORIES = new Set(["rate-limit", "timeout", "provider-unavailable", "transport", "invalid-provider-response"]);
const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"];

function keywordCode(keyword) {
  return `EXECUTION_SCHEMA_${keyword.replace(/([a-z])([A-Z])/gu, "$1_$2").replaceAll("-", "_").toUpperCase()}`;
}

function schemaPath(error) {
  const segments = error.instancePath ? error.instancePath.split("/").slice(1).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")) : [];
  if (error.keyword === "required") segments.push(error.params.missingProperty);
  if (error.keyword === "additionalProperties") segments.push(error.params.additionalProperty);
  return pointer(segments);
}

function schemaDiagnostics(document) {
  if (validateSchema(document)) return [];
  return (validateSchema.errors ?? []).map((error) => diagnostic(
    "error",
    keywordCode(error.keyword),
    `Provider Execution schema violation: ${error.message}.`,
    schemaPath(error),
    { keyword: error.keyword, schema_path: error.schemaPath, ...error.params }
  ));
}

function uniqueNames(items, property, path, code, label, diagnostics) {
  const seen = new Map();
  for (const [index, item] of items.entries()) {
    const name = item?.[property];
    if (typeof name !== "string") continue;
    if (seen.has(name)) diagnostics.push(diagnostic("error", code, `Duplicate ${label}: ${name}.`, [...path, index, property], { name, first_index: seen.get(name) }));
    else seen.set(name, index);
  }
  return seen;
}

function descriptorDiagnostics(descriptor) {
  const diagnostics = [];
  const capabilities = Array.isArray(descriptor.capabilities) ? descriptor.capabilities : [];
  const names = uniqueNames(capabilities, "name", ["capabilities"], "DUPLICATE_CAPABILITY", "capability descriptor", diagnostics);
  if (!names.has("text-generation")) diagnostics.push(diagnostic("error", "TEXT_GENERATION_CAPABILITY_MISSING", "Every v1 adapter descriptor requires text-generation capability.", ["capabilities"]));
  if (!descriptor.execution_modes?.includes("synchronous")) diagnostics.push(diagnostic("error", "SYNCHRONOUS_MODE_MISSING", "Every v1 adapter descriptor requires synchronous execution mode.", ["execution_modes"]));
  const extensionNames = descriptor.supported_extensions ?? [];
  if (new Set(extensionNames).size !== extensionNames.length) diagnostics.push(diagnostic("error", "DUPLICATE_SUPPORTED_EXTENSION", "Supported extension namespaces must be unique.", ["supported_extensions"]));
  const parameters = descriptor.parameters && typeof descriptor.parameters === "object" ? descriptor.parameters : {};
  for (const name of PARAMETER_NAMES) {
    const support = parameters[name];
    if (!support || typeof support !== "object" || name === "stop_sequences") continue;
    if (support.minimum > support.maximum) diagnostics.push(diagnostic("error", "CONTRADICTORY_PARAMETER_RANGE", `Parameter support minimum exceeds maximum: ${name}.`, ["parameters", name], { parameter: name }));
    if (support.default !== undefined && (support.default < support.minimum || support.default > support.maximum)) diagnostics.push(diagnostic("error", "PARAMETER_DEFAULT_OUT_OF_RANGE", `Parameter default is outside the declared range: ${name}.`, ["parameters", name, "default"], { parameter: name }));
  }
  if (parameters.temperature && (parameters.temperature.minimum < 0 || parameters.temperature.maximum > 2)) diagnostics.push(diagnostic("error", "NONPORTABLE_PARAMETER_RANGE", "Temperature support must remain inside the portable 0–2 domain.", ["parameters", "temperature"]));
  if (parameters.top_p && (parameters.top_p.minimum <= 0 || parameters.top_p.maximum > 1)) diagnostics.push(diagnostic("error", "NONPORTABLE_PARAMETER_RANGE", "top_p support must remain inside the portable (0, 1] domain.", ["parameters", "top_p"]));
  if (parameters.seed && !names.has("seeded-generation")) diagnostics.push(diagnostic("error", "SEED_CAPABILITY_MISSING", "Descriptor seed support requires seeded-generation capability.", ["parameters", "seed"]));
  return diagnostics;
}

function renderedPromptIdentityDiagnostics(renderedPrompt) {
  if (!renderedPrompt || typeof renderedPrompt !== "object" || Array.isArray(renderedPrompt)) return [];
  const { byte_size: expectedBytes, sha256: expectedDigest, ...canonicalValue } = renderedPrompt;
  try {
    const canonical = canonicalJson(canonicalValue);
    const byteSize = Buffer.byteLength(canonical, "utf8");
    const sha256 = `sha256:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
    const diagnostics = [];
    if (byteSize !== expectedBytes) diagnostics.push(diagnostic("error", "RENDERED_PROMPT_SIZE_MISMATCH", "Rendered prompt canonical byte size does not match its identity.", ["rendered_prompt", "byte_size"], { computed_byte_size: byteSize }));
    if (sha256 !== expectedDigest) diagnostics.push(diagnostic("error", "RENDERED_PROMPT_DIGEST_MISMATCH", "Rendered prompt canonical digest does not match its identity.", ["rendered_prompt", "sha256"]));
    return diagnostics;
  } catch (error) {
    return [diagnostic("error", "RENDERED_PROMPT_NON_CANONICAL", "Rendered prompt cannot be represented as Studio canonical JSON v1.", ["rendered_prompt"], { reason: error.details?.kind ?? "non-json" })];
  }
}

function requestDiagnostics(request) {
  const diagnostics = renderedPromptIdentityDiagnostics(request.rendered_prompt);
  const required = Array.isArray(request.capabilities?.required) ? request.capabilities.required : [];
  const optional = Array.isArray(request.capabilities?.optional) ? request.capabilities.optional : [];
  if (!required.includes("text-generation")) diagnostics.push(diagnostic("error", "TEXT_GENERATION_NOT_REQUIRED", "Every v1 execution request requires text-generation.", ["capabilities", "required"]));
  for (const capability of required) if (optional.includes(capability)) diagnostics.push(diagnostic("error", "CAPABILITY_SET_OVERLAP", `Capability appears in required and optional sets: ${capability}.`, ["capabilities"], { capability }));
  if (request.parameters?.seed !== undefined && !required.includes("seeded-generation")) diagnostics.push(diagnostic("error", "SEED_CAPABILITY_NOT_REQUIRED", "Using seed requires seeded-generation as a required capability.", ["parameters", "seed"]));
  if (request.parameters?.temperature !== undefined && request.parameters?.top_p !== undefined) diagnostics.push(diagnostic("warning", "MULTIPLE_SAMPLING_CONTROLS", "temperature and top_p are both set; combined behavior is target-dependent.", ["parameters"]));
  const stops = request.parameters?.stop_sequences;
  if (Array.isArray(stops) && new Set(stops).size !== stops.length) diagnostics.push(diagnostic("error", "DUPLICATE_STOP_SEQUENCE", "stop_sequences must contain unique strings.", ["parameters", "stop_sequences"]));
  if (request.expected_output?.kind === "json" && !required.includes("structured-output") && !optional.includes("structured-output")) diagnostics.push(diagnostic("error", "STRUCTURED_OUTPUT_CAPABILITY_MISSING", "JSON output requires structured-output as required or optional.", ["capabilities"]));
  if (request.extensions && typeof request.extensions === "object" && !Array.isArray(request.extensions)) {
    for (const [namespace, extension] of Object.entries(request.extensions)) {
      if (extension?.required === true && extension.fallback !== "reject") diagnostics.push(diagnostic("error", "REQUIRED_EXTENSION_FALLBACK", "Required extensions must use reject fallback.", ["extensions", namespace, "fallback"], { namespace }));
    }
  }
  const sensitive = CLASSIFICATIONS.indexOf(request.rendered_prompt?.classification) >= CLASSIFICATIONS.indexOf("confidential");
  const capturesBody = request.observability?.capture_prompt === true || request.observability?.capture_output === true;
  if (sensitive && capturesBody && request.observability?.retention !== "restricted-content") diagnostics.push(diagnostic("error", "SENSITIVE_CAPTURE_REQUIRES_RESTRICTED_RETENTION", "Confidential or restricted body capture requires restricted-content retention.", ["observability"]));
  return diagnostics;
}

function resultDiagnostics(result) {
  const diagnostics = [];
  const startedAt = Date.parse(result.timing?.started_at);
  const completedAt = Date.parse(result.timing?.completed_at);
  if (Number.isFinite(startedAt) && Number.isFinite(completedAt)) {
    if (completedAt < startedAt) diagnostics.push(diagnostic("error", "TIMING_ORDER_INVALID", "completed_at must not precede started_at.", ["timing", "completed_at"]));
    if (result.timing?.duration_ms !== completedAt - startedAt) diagnostics.push(diagnostic("error", "TIMING_DURATION_MISMATCH", "duration_ms must equal the timestamp difference.", ["timing", "duration_ms"], { computed_duration_ms: completedAt - startedAt }));
  }
  const usage = result.usage;
  if (usage && usage.input_tokens !== undefined && usage.output_tokens !== undefined && usage.total_tokens !== undefined && usage.total_tokens !== usage.input_tokens + usage.output_tokens) diagnostics.push(diagnostic("error", "USAGE_TOTAL_MISMATCH", "total_tokens must equal input_tokens plus output_tokens.", ["usage", "total_tokens"]));
  if (usage?.provider_reported === false && [usage.input_tokens, usage.output_tokens, usage.total_tokens].some((value) => value !== undefined)) diagnostics.push(diagnostic("error", "UNREPORTED_USAGE_COUNTS", "Token counts must be omitted when provider_reported is false.", ["usage"]));
  const error = result.error;
  if (error?.retryable === true && !RETRYABLE_CATEGORIES.has(error.category)) diagnostics.push(diagnostic("error", "ERROR_CATEGORY_NOT_RETRYABLE", `Error category cannot be retryable: ${error.category}.`, ["error", "retryable"], { category: error.category }));
  if (error?.retry_after_ms !== undefined && error.retryable !== true) diagnostics.push(diagnostic("error", "RETRY_AFTER_WITHOUT_RETRY", "retry_after_ms requires retryable true.", ["error", "retry_after_ms"]));
  const output = result.output;
  if (output?.delivery === "inline" && typeof output.content === "string") {
    const byteSize = Buffer.byteLength(output.content, "utf8");
    const sha256 = `sha256:${createHash("sha256").update(output.content, "utf8").digest("hex")}`;
    if (byteSize !== output.byte_size) diagnostics.push(diagnostic("error", "OUTPUT_SIZE_MISMATCH", "Inline output byte size does not match content.", ["output", "byte_size"], { computed_byte_size: byteSize }));
    if (sha256 !== output.sha256) diagnostics.push(diagnostic("error", "OUTPUT_DIGEST_MISMATCH", "Inline output digest does not match content.", ["output", "sha256"]));
  }
  if (output?.delivery === "reference" && output.reference && (output.byte_size !== output.reference.byte_size || output.sha256 !== output.reference.sha256 || output.media_type !== output.reference.media_type)) diagnostics.push(diagnostic("error", "OUTPUT_REFERENCE_IDENTITY_MISMATCH", "Referenced output identity must match the outer output identity.", ["output", "reference"]));
  return diagnostics;
}

function semanticDiagnostics(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) return [];
  if (document.kind === "provider-adapter-descriptor") return descriptorDiagnostics(document);
  if (document.kind === "execution-request") return requestDiagnostics(document);
  if (document.kind === "execution-result") return resultDiagnostics(document);
  return [];
}

export function validateExecutionDocument(document) {
  try {
    canonicalJson(document);
  } catch (error) {
    return report([diagnostic("error", "NON_JSON_EXECUTION_DOCUMENT", "Execution document must contain only explicit JSON data values.", error.path ?? "", { reason: error.details?.kind ?? "non-json" })], EXECUTION_CONTRACT);
  }
  return report([...schemaDiagnostics(document), ...semanticDiagnostics(document)], EXECUTION_CONTRACT);
}

function identityDiagnostics(request, descriptor) {
  const diagnostics = [];
  const pairs = [
    ["adapter_id", request.target?.adapter_id, descriptor.adapter?.id],
    ["provider_id", request.target?.provider_id, descriptor.provider?.id],
    ["model_id", request.target?.model_id, descriptor.model?.id]
  ];
  for (const [field, requested, described] of pairs) if (requested !== described) diagnostics.push(diagnostic("error", "TARGET_IDENTITY_MISMATCH", `Request ${field} does not match the adapter descriptor.`, ["target", field], { field }));
  return diagnostics;
}

export function validateExecutionCompatibility(request, descriptor) {
  const requestReport = validateExecutionDocument(request);
  const descriptorReport = validateExecutionDocument(descriptor);
  const diagnostics = [
    ...requestReport.diagnostics.map((entry) => ({ ...entry, path: `/request${entry.path}` })),
    ...descriptorReport.diagnostics.map((entry) => ({ ...entry, path: `/descriptor${entry.path}` }))
  ];
  const effectiveParameters = {};
  if (requestReport.valid && descriptorReport.valid) {
    diagnostics.push(...identityDiagnostics(request, descriptor));
    if (!descriptor.execution_modes.includes("synchronous")) diagnostics.push(diagnostic("error", "SYNCHRONOUS_MODE_UNSUPPORTED", "Adapter does not declare synchronous execution.", ["descriptor", "execution_modes"]));
    const capabilities = new Map(descriptor.capabilities.map((capability) => [capability.name, capability]));
    for (const capability of request.capabilities.required) {
      const support = capabilities.get(capability);
      if (!support) diagnostics.push(diagnostic("error", "REQUIRED_CAPABILITY_UNAVAILABLE", `Required capability is unavailable: ${capability}.`, ["request", "capabilities", "required"], { capability }));
      else if (support.implementation === "emulated") diagnostics.push(diagnostic("warning", "CAPABILITY_EMULATED", `Required capability is implemented through adapter emulation: ${capability}.`, ["descriptor", "capabilities"], { capability }));
    }
    for (const capability of request.capabilities.optional) {
      const support = capabilities.get(capability);
      if (!support) diagnostics.push(diagnostic("warning", "OPTIONAL_CAPABILITY_UNAVAILABLE", `Optional capability is unavailable: ${capability}.`, ["request", "capabilities", "optional"], { capability }));
      else if (support.implementation === "emulated") diagnostics.push(diagnostic("warning", "OPTIONAL_CAPABILITY_EMULATED", `Optional capability uses adapter emulation: ${capability}.`, ["descriptor", "capabilities"], { capability }));
    }
    const textCapability = capabilities.get("text-generation");
    if (textCapability?.limits?.max_input_bytes !== undefined && request.rendered_prompt.byte_size > textCapability.limits.max_input_bytes) diagnostics.push(diagnostic("error", "PROMPT_EXCEEDS_ADAPTER_LIMIT", "Rendered prompt exceeds adapter max_input_bytes.", ["request", "rendered_prompt", "byte_size"]));
    if (textCapability?.limits?.max_output_tokens !== undefined && request.parameters.max_output_tokens > textCapability.limits.max_output_tokens) diagnostics.push(diagnostic("error", "OUTPUT_TOKENS_EXCEED_CAPABILITY_LIMIT", "max_output_tokens exceeds the text-generation capability limit.", ["request", "parameters", "max_output_tokens"]));
    if (textCapability?.limits?.output_media_types && !textCapability.limits.output_media_types.includes(request.expected_output.media_type)) diagnostics.push(diagnostic("error", "OUTPUT_MEDIA_TYPE_UNAVAILABLE", "Expected output media type is unavailable from the adapter.", ["request", "expected_output", "media_type"]));

    for (const name of PARAMETER_NAMES) {
      const value = request.parameters[name];
      const support = descriptor.parameters[name];
      if (value === undefined) {
        if (support?.default !== undefined) {
          effectiveParameters[name] = support.default;
          diagnostics.push(diagnostic("warning", "PARAMETER_DEFAULT_APPLIED", `Adapter default applied for omitted portable parameter: ${name}.`, ["request", "parameters"], { parameter: name }));
        }
        continue;
      }
      effectiveParameters[name] = value;
      if (!support) {
        diagnostics.push(diagnostic("error", "PORTABLE_PARAMETER_UNSUPPORTED", `Portable parameter is unsupported by the adapter: ${name}.`, ["request", "parameters", name], { parameter: name }));
        continue;
      }
      if (name === "stop_sequences") {
        if (value.length > support.max_items || value.some((item) => [...item].length > support.max_item_length)) diagnostics.push(diagnostic("error", "PORTABLE_PARAMETER_OUT_OF_RANGE", "stop_sequences exceeds adapter count or length support.", ["request", "parameters", name], { parameter: name }));
      } else if (value < support.minimum || value > support.maximum) diagnostics.push(diagnostic("error", "PORTABLE_PARAMETER_OUT_OF_RANGE", `Portable parameter is outside adapter support: ${name}.`, ["request", "parameters", name], { parameter: name }));
    }
    for (const [namespace, extension] of Object.entries(request.extensions ?? {})) {
      if (!descriptor.supported_extensions.includes(namespace)) {
        const rejects = extension.required === true || extension.fallback === "reject";
        diagnostics.push(diagnostic(rejects ? "error" : "warning", rejects ? "REQUIRED_EXTENSION_UNAVAILABLE" : "OPTIONAL_EXTENSION_OMITTED", `${rejects ? "Required" : "Optional"} extension is unavailable: ${namespace}.`, ["request", "extensions", namespace], { namespace, fallback: extension.fallback }));
      }
    }
  }
  return { ...report(diagnostics, EXECUTION_CONTRACT), effectiveParameters };
}

export function validateExecutionResult(result, { request, descriptor } = {}) {
  const base = validateExecutionDocument(result);
  const diagnostics = [...base.diagnostics];
  if (base.valid && request && descriptor) {
    if (result.execution_id !== request.execution_id) diagnostics.push(diagnostic("error", "RESULT_EXECUTION_ID_MISMATCH", "Result execution_id does not match the request.", ["execution_id"]));
    if ((result.correlation_id ?? undefined) !== (request.correlation_id ?? undefined)) diagnostics.push(diagnostic("error", "RESULT_CORRELATION_ID_MISMATCH", "Result correlation_id does not match the request.", ["correlation_id"]));
    const expectedIdentity = { adapter_id: descriptor.adapter.id, adapter_version: descriptor.adapter.version, provider_id: descriptor.provider.id, model_id: descriptor.model.id, model_revision: descriptor.model.revision };
    for (const [field, expected] of Object.entries(expectedIdentity)) if ((result.identity?.[field] ?? undefined) !== (expected ?? undefined)) diagnostics.push(diagnostic("error", "RESULT_IDENTITY_MISMATCH", `Result identity does not match descriptor field: ${field}.`, ["identity", field], { field }));
    if (result.output) {
      if (result.output.kind !== request.expected_output.kind || result.output.media_type !== request.expected_output.media_type) diagnostics.push(diagnostic("error", "RESULT_OUTPUT_CONTRACT_MISMATCH", "Result output kind/media type does not match the request.", ["output"]));
      if (CLASSIFICATIONS.indexOf(result.output.classification) < CLASSIFICATIONS.indexOf(request.rendered_prompt.classification)) diagnostics.push(diagnostic("error", "RESULT_CLASSIFICATION_DOWNGRADE", "Result output classification is lower than the rendered prompt.", ["output", "classification"]));
    }
  }
  return report(diagnostics, EXECUTION_CONTRACT);
}
