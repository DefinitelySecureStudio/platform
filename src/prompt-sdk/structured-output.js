import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import validateContractSchema from "./generated/structured-output-v1-schema.js";
import { canonicalJson } from "./canonical-json.js";
import { diagnostic, pointer, report, STRUCTURED_OUTPUT_CONTRACT } from "./diagnostics.js";
import { parseJsonDocument } from "./parse-json.js";
import { StructuredOutputError } from "./structured-output-errors.js";
import { validateExecutionDocument } from "./validate-execution.js";

const VALIDATOR = Object.freeze({ name: "studio.prompt-sdk", version: "0.1.0", algorithm: "parse-once-validate-v1", json_schema_draft: "2020-12" });
const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"];

function sha256(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }

function bytesOf(source) {
  if (typeof source === "string") return Buffer.from(source, "utf8");
  if (source instanceof Uint8Array) return Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  return undefined;
}

function decodeUtf8(bytes, label) {
  if ((bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) || bytes[0] === 0xff || bytes[0] === 0xfe) {
    return { diagnostics: [diagnostic("error", "STRUCTURED_OUTPUT_BOM_NOT_ALLOWED", `${label} must not contain a byte-order mark.`)] };
  }
  try { return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), diagnostics: [] }; } catch {
    return { diagnostics: [diagnostic("error", "STRUCTURED_OUTPUT_UTF8_INVALID", `${label} must be valid UTF-8.`)] };
  }
}

function keywordCode(keyword) {
  return `STRUCTURED_OUTPUT_CONTRACT_${keyword.replace(/([a-z])([A-Z])/gu, "$1_$2").replaceAll("-", "_").toUpperCase()}`;
}

function schemaPath(error) {
  const segments = error.instancePath ? error.instancePath.split("/").slice(1).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")) : [];
  if (error.keyword === "required") segments.push(error.params.missingProperty);
  if (error.keyword === "additionalProperties") segments.push(error.params.additionalProperty);
  return pointer(segments);
}

function contractSchemaDiagnostics(document) {
  if (validateContractSchema(document)) return [];
  return (validateContractSchema.errors ?? []).map((error) => diagnostic("error", keywordCode(error.keyword), `Structured Output contract violation: ${error.message}.`, schemaPath(error), { keyword: error.keyword, schema_path: error.schemaPath, ...error.params }));
}

function documentIdentityDiagnostics(document) {
  const diagnostics = [];
  const raw = document?.raw;
  if (raw?.retention === "inline" && typeof raw.content === "string") {
    const bytes = Buffer.from(raw.content, "utf8");
    if (bytes.byteLength !== raw.byte_size) diagnostics.push(diagnostic("error", "STRUCTURED_RAW_SIZE_MISMATCH", "Inline raw output byte size does not match content.", ["raw", "byte_size"], { computed_byte_size: bytes.byteLength }));
    if (sha256(bytes) !== raw.sha256) diagnostics.push(diagnostic("error", "STRUCTURED_RAW_DIGEST_MISMATCH", "Inline raw output digest does not match content.", ["raw", "sha256"]));
  }
  if (raw?.retention === "reference" && raw.reference && (raw.reference.byte_size !== raw.byte_size || raw.reference.sha256 !== raw.sha256 || raw.reference.media_type !== raw.media_type)) diagnostics.push(diagnostic("error", "STRUCTURED_RAW_REFERENCE_MISMATCH", "Raw output reference identity does not match raw identity.", ["raw", "reference"]));
  if (document?.kind === "structured-output-result" && document.normalized) {
    try {
      const canonical = canonicalJson(document.normalized.value);
      const bytes = Buffer.from(canonical, "utf8");
      if (bytes.byteLength !== document.normalized.byte_size) diagnostics.push(diagnostic("error", "STRUCTURED_NORMALIZED_SIZE_MISMATCH", "Normalized byte size does not match the canonical value.", ["normalized", "byte_size"], { computed_byte_size: bytes.byteLength }));
      if (sha256(bytes) !== document.normalized.sha256) diagnostics.push(diagnostic("error", "STRUCTURED_NORMALIZED_DIGEST_MISMATCH", "Normalized digest does not match the canonical value.", ["normalized", "sha256"]));
    } catch (error) {
      diagnostics.push(diagnostic("error", "STRUCTURED_NORMALIZED_NON_CANONICAL", "Normalized output is not Studio canonical JSON data.", ["normalized", "value"], { reason: error.details?.kind ?? "non-json" }));
    }
  }
  return diagnostics;
}

export function validateStructuredOutputDocument(document) {
  try { canonicalJson(document); } catch (error) {
    return report([diagnostic("error", "NON_JSON_STRUCTURED_OUTPUT_DOCUMENT", "Structured Output document must contain only explicit JSON data values.", error.path ?? "", { reason: error.details?.kind ?? "non-json" })], STRUCTURED_OUTPUT_CONTRACT);
  }
  return report([...contractSchemaDiagnostics(document), ...documentIdentityDiagnostics(document)], STRUCTURED_OUTPUT_CONTRACT);
}

function processingDiagnostic(code, message, path = "", keyword) {
  return { code, message, path: pointer(path), ...(keyword === undefined ? {} : { keyword }) };
}

function processingReport(diagnostics) {
  return report(diagnostics.map((entry) => diagnostic("error", entry.code, entry.message, entry.path, entry.keyword === undefined ? {} : { keyword: entry.keyword })), STRUCTURED_OUTPUT_CONTRACT);
}

function providerConstraint(mode, adapterId) {
  return {
    mode, capability: "structured-output",
    ...(mode === "portable-only" ? {} : { adapter_id: adapterId }),
    independently_validated: true
  };
}

function rawRecord(output, rawText, retention, reference) {
  return {
    media_type: "application/json", classification: output.classification, retention,
    byte_size: output.byte_size, sha256: output.sha256,
    ...(retention === "inline" ? { content: rawText } : {}),
    ...(retention === "reference" ? { reference } : {})
  };
}

function baseDocument(request, options, raw, constraint) {
  return {
    spec_version: "1.0.0", processing_id: options.processing_id,
    execution_id: request.execution_id, expectation: structuredClone(request.expected_output),
    raw, validator: { ...VALIDATOR }, provider_constraint: constraint
  };
}

function failureDocument(base, stage, diagnostics) {
  return { ...base, kind: "structured-output-failure", status: "failed", stage, diagnostics };
}

function failedAttempt(base, stage, diagnostics) {
  const failure = failureDocument(base, stage, diagnostics);
  const validation = validateStructuredOutputDocument(failure);
  if (!validation.valid) return { ok: false, error: new StructuredOutputError("STRUCTURED_OUTPUT_INTERNAL_CONTRACT", "Structured-output failure could not satisfy its contract.", validation).toJSON() };
  return { ok: false, failure: Object.freeze(failure), report: processingReport(diagnostics) };
}

function schemaDiagnostics(errors) {
  return (errors ?? []).map((error) => {
    const segments = error.instancePath ? error.instancePath.split("/").slice(1).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")) : [];
    if (error.keyword === "required") segments.push(error.params.missingProperty);
    return processingDiagnostic(`STRUCTURED_OUTPUT_SCHEMA_${error.keyword.replace(/([a-z])([A-Z])/gu, "$1_$2").replaceAll("-", "_").toUpperCase()}`, `Structured output failed the declared schema keyword: ${error.keyword}.`, segments, error.keyword);
  });
}

function schemaValidator(schemaSource, reference) {
  const bytes = bytesOf(schemaSource);
  if (!bytes) return { stage: "schema-load", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_SOURCE_TYPE", "Schema artifact must be supplied as a string or byte array.")] };
  if (bytes.byteLength !== reference.byte_size) return { stage: "schema-integrity", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_SIZE_MISMATCH", "Schema artifact byte size does not match its reference.", "/expectation/schema/byte_size")] };
  if (sha256(bytes) !== reference.sha256) return { stage: "schema-integrity", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_DIGEST_MISMATCH", "Schema artifact digest does not match its reference.", "/expectation/schema/sha256")] };
  const decoded = decodeUtf8(bytes, "Output schema");
  if (decoded.diagnostics.length) return { stage: "schema-load", diagnostics: decoded.diagnostics.map(({ code, message, path }) => processingDiagnostic(code, message, path)) };
  const parsed = parseJsonDocument(decoded.text, { label: "Output schema JSON" });
  if (parsed.diagnostics.length) return { stage: "schema-load", diagnostics: parsed.diagnostics.map((entry) => processingDiagnostic(entry.code === "JSON_SYNTAX" ? "STRUCTURED_OUTPUT_SCHEMA_JSON_SYNTAX" : "STRUCTURED_OUTPUT_SCHEMA_DUPLICATE_KEY", entry.code === "JSON_SYNTAX" ? "Output schema artifact is not valid JSON." : "Output schema artifact contains a duplicate object member.", entry.path)) };
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return { stage: "schema-load", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_DOCUMENT_TYPE", "Output schema artifact must be a JSON object.")] };
  if (parsed.value.$schema !== "https://json-schema.org/draft/2020-12/schema") return { stage: "schema-load", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_DIALECT", "Output schema must declare JSON Schema Draft 2020-12.", "/$schema")] };
  if (parsed.value.$id !== reference.schema_id) return { stage: "schema-integrity", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_ID_MISMATCH", "Output schema $id does not match schema_id.", "/$id")] };
  try {
    const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, strictTypes: false, allowUnionTypes: true });
    addFormats(ajv);
    return { validate: ajv.compile(parsed.value) };
  } catch {
    return { stage: "schema-load", diagnostics: [processingDiagnostic("STRUCTURED_OUTPUT_SCHEMA_COMPILE", "Output schema could not be compiled without external resolution.")] };
  }
}

function prepare(request, result, options) {
  if (!options || typeof options !== "object") throw new StructuredOutputError("STRUCTURED_OUTPUT_OPTIONS_REQUIRED", "Explicit structured-output processing options are required.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_OPTIONS_REQUIRED", "Explicit structured-output processing options are required.")]));
  for (const name of ["processing_id", "rawRetention", "providerConstraintMode"]) if (options[name] === undefined) throw new StructuredOutputError("STRUCTURED_OUTPUT_OPTION_REQUIRED", `Structured-output option is required: ${name}.`, processingReport([processingDiagnostic("STRUCTURED_OUTPUT_OPTION_REQUIRED", `Structured-output option is required: ${name}.`, [name])]));
  const requestValidation = validateExecutionDocument(request);
  const resultValidation = validateExecutionDocument(result);
  if (!requestValidation.valid || !resultValidation.valid) throw new StructuredOutputError("STRUCTURED_OUTPUT_EXECUTION_INVALID", "Execution request and result must satisfy Provider Execution v1.", report([...requestValidation.diagnostics.map((entry) => ({ ...entry, path: `/request${entry.path}` })), ...resultValidation.diagnostics.map((entry) => ({ ...entry, path: `/result${entry.path}` }))], STRUCTURED_OUTPUT_CONTRACT));
  if (result.execution_id !== request.execution_id) throw new StructuredOutputError("STRUCTURED_OUTPUT_EXECUTION_MISMATCH", "Execution result does not match the request.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_EXECUTION_MISMATCH", "Execution result does not match the request.", "/execution_id")]));
  if ((result.correlation_id ?? undefined) !== (request.correlation_id ?? undefined) || result.identity.adapter_id !== request.target.adapter_id || result.identity.provider_id !== request.target.provider_id || result.identity.model_id !== request.target.model_id) throw new StructuredOutputError("STRUCTURED_OUTPUT_EXECUTION_PROVENANCE_MISMATCH", "Execution result identity does not match the request target/correlation.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_EXECUTION_PROVENANCE_MISMATCH", "Execution result identity does not match the request target/correlation.", "/identity")]));
  if (result.status !== "succeeded" || !result.output) throw new StructuredOutputError("STRUCTURED_OUTPUT_EXECUTION_FAILED", "Only a successful execution result can be processed.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_EXECUTION_FAILED", "Only a successful execution result can be processed.", "/status")]));
  if (request.expected_output?.kind !== "json" || request.expected_output.media_type !== "application/json" || !["json-syntax", "json-schema"].includes(request.expected_output.validation)) throw new StructuredOutputError("STRUCTURED_OUTPUT_EXPECTATION_REQUIRED", "Execution request must declare a JSON structured-output expectation.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_EXPECTATION_REQUIRED", "Execution request must declare a JSON structured-output expectation.", "/expected_output")]));
  const capabilities = [...request.capabilities.required, ...request.capabilities.optional];
  if (!capabilities.includes("structured-output")) throw new StructuredOutputError("STRUCTURED_OUTPUT_CAPABILITY_REQUIRED", "Execution request must declare the structured-output capability.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_CAPABILITY_REQUIRED", "Execution request must declare the structured-output capability.", "/capabilities")]));
  if (result.output.kind !== "json" || result.output.media_type !== "application/json") throw new StructuredOutputError("STRUCTURED_OUTPUT_MEDIA_MISMATCH", "Execution output is not JSON.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_MEDIA_MISMATCH", "Execution output is not JSON.", "/output")]));
  if (CLASSIFICATIONS.indexOf(result.output.classification) < CLASSIFICATIONS.indexOf(request.rendered_prompt.classification)) throw new StructuredOutputError("STRUCTURED_OUTPUT_CLASSIFICATION_DOWNGRADE", "Execution output classification is lower than the rendered prompt.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_CLASSIFICATION_DOWNGRADE", "Execution output classification is lower than the rendered prompt.", "/output/classification")]));
  if (!["identity-only", "inline", "reference"].includes(options.rawRetention)) throw new StructuredOutputError("STRUCTURED_OUTPUT_RETENTION_INVALID", "rawRetention is unsupported.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_RETENTION_INVALID", "rawRetention is unsupported.", "/rawRetention")]));
  if (!["portable-only", "provider-native", "adapter-emulated"].includes(options.providerConstraintMode)) throw new StructuredOutputError("STRUCTURED_OUTPUT_CONSTRAINT_MODE_INVALID", "providerConstraintMode is unsupported.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_CONSTRAINT_MODE_INVALID", "providerConstraintMode is unsupported.", "/providerConstraintMode")]));
  const emulatedConstraint = result.warnings.some((warning) => ["CAPABILITY_EMULATED", "OPTIONAL_CAPABILITY_EMULATED"].includes(warning.code) && warning.details?.capability === "structured-output");
  if (options.providerConstraintMode !== "portable-only" && !request.capabilities.required.includes("structured-output")) throw new StructuredOutputError("STRUCTURED_OUTPUT_CONSTRAINT_NOT_REQUIRED", "Native or emulated provider constraints require structured-output as a required capability.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_CONSTRAINT_NOT_REQUIRED", "Native or emulated provider constraints require structured-output as a required capability.", "/capabilities/required")]));
  if ((options.providerConstraintMode === "adapter-emulated") !== emulatedConstraint) throw new StructuredOutputError("STRUCTURED_OUTPUT_CONSTRAINT_PROVENANCE_MISMATCH", "Provider constraint mode does not match execution capability provenance.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_CONSTRAINT_PROVENANCE_MISMATCH", "Provider constraint mode does not match execution capability provenance.", "/providerConstraintMode")]));

  let source = result.output.delivery === "inline" ? result.output.content : options.rawSource;
  const rawBytes = bytesOf(source);
  if (!rawBytes) throw new StructuredOutputError("STRUCTURED_OUTPUT_RAW_SOURCE_REQUIRED", "Referenced output requires exact raw source bytes.", processingReport([processingDiagnostic("STRUCTURED_OUTPUT_RAW_SOURCE_REQUIRED", "Referenced output requires exact raw source bytes.", "/rawSource")]));
  const rawIssues = [];
  if (rawBytes.byteLength !== result.output.byte_size) rawIssues.push(processingDiagnostic("STRUCTURED_OUTPUT_RAW_SIZE_MISMATCH", "Raw output byte size does not match execution provenance.", "/output/byte_size"));
  if (sha256(rawBytes) !== result.output.sha256) rawIssues.push(processingDiagnostic("STRUCTURED_OUTPUT_RAW_DIGEST_MISMATCH", "Raw output digest does not match execution provenance.", "/output/sha256"));
  const decoded = decodeUtf8(rawBytes, "Raw structured output");
  rawIssues.push(...decoded.diagnostics.map(({ code, message, path }) => processingDiagnostic(code, message, path)));
  const reference = options.rawRetention === "reference" ? (options.rawReference ?? (result.output.delivery === "reference" ? result.output.reference : undefined)) : undefined;
  const retentionAuthorized = options.rawRetention === "identity-only" || (request.observability.retention === "restricted-content" && request.observability.capture_output === true);
  if (!retentionAuthorized) rawIssues.push(processingDiagnostic("STRUCTURED_OUTPUT_RETENTION_NOT_AUTHORIZED", "Raw body retention requires explicit restricted-content output capture.", "/rawRetention"));
  const referenceValid = reference && reference.byte_size === rawBytes.byteLength && reference.sha256 === sha256(rawBytes) && reference.media_type === result.output.media_type;
  if (options.rawRetention === "reference" && !referenceValid) rawIssues.push(processingDiagnostic("STRUCTURED_OUTPUT_RAW_REFERENCE_MISMATCH", "Raw reference must match the exact raw output identity.", "/rawReference"));
  const effectiveRetention = !retentionAuthorized || (options.rawRetention === "inline" && decoded.text === undefined) || (options.rawRetention === "reference" && !referenceValid) ? "identity-only" : options.rawRetention;
  const actualOutput = { ...result.output, byte_size: rawBytes.byteLength, sha256: sha256(rawBytes) };
  const raw = rawRecord(actualOutput, decoded.text ?? "", effectiveRetention, referenceValid ? reference : undefined);
  const constraint = providerConstraint(options.providerConstraintMode, result.identity.adapter_id);
  return { raw, rawText: decoded.text, rawIssues, base: baseDocument(request, options, raw, constraint) };
}

export function tryProcessStructuredOutput(request, result, options) {
  let prepared;
  try { prepared = prepare(request, result, options); } catch (error) {
    if (error instanceof StructuredOutputError) return { ok: false, error: error.toJSON() };
    throw error;
  }
  const { base, rawText, rawIssues } = prepared;
  if (rawIssues.length) return failedAttempt(base, "raw-integrity", rawIssues);
  const parsed = parseJsonDocument(rawText, { label: "Raw structured output JSON" });
  if (parsed.diagnostics.length) {
    const diagnostics = parsed.diagnostics.map((entry) => processingDiagnostic(entry.code === "JSON_SYNTAX" ? "STRUCTURED_OUTPUT_JSON_SYNTAX" : "STRUCTURED_OUTPUT_DUPLICATE_KEY", entry.code === "JSON_SYNTAX" ? "Raw output is not valid JSON." : "Raw output contains a duplicate object member.", entry.path));
    return failedAttempt(base, "parse", diagnostics);
  }
  if (request.expected_output.validation === "json-schema") {
    const compiled = schemaValidator(options.schemaSource, request.expected_output.schema);
    if (!compiled.validate) return failedAttempt(base, compiled.stage, compiled.diagnostics);
    if (!compiled.validate(parsed.value)) {
      const diagnostics = schemaDiagnostics(compiled.validate.errors);
      return failedAttempt(base, "schema-validation", diagnostics);
    }
  }
  const canonical = canonicalJson(parsed.value);
  const bytes = Buffer.from(canonical, "utf8");
  const resultDocument = {
    ...base, kind: "structured-output-result", status: "validated",
    normalized: { media_type: "application/json", canonicalization: "studio-json-v1", value: structuredClone(parsed.value), byte_size: bytes.byteLength, sha256: sha256(bytes) }
  };
  const validation = validateStructuredOutputDocument(resultDocument);
  if (!validation.valid) return { ok: false, error: new StructuredOutputError("STRUCTURED_OUTPUT_INTERNAL_CONTRACT", "Structured output could not be normalized into its contract.", validation).toJSON() };
  return { ok: true, result: Object.freeze(resultDocument) };
}

export function processStructuredOutput(request, result, options) {
  const attempt = tryProcessStructuredOutput(request, result, options);
  if (attempt.ok) return attempt.result;
  if (attempt.failure) {
    const first = attempt.failure.diagnostics[0];
    throw new StructuredOutputError(first.code, first.message, attempt.report, attempt.failure);
  }
  throw new StructuredOutputError(attempt.error.code, attempt.error.message, attempt.error.report);
}
