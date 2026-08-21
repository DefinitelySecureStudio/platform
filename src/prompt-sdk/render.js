import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical-json.js";
import { PromptRenderError, fail } from "./errors.js";

const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"];
const ROLES = new Set(["instruction", "user", "assistant-example"]);
const TYPES = new Set(["string", "integer", "number", "boolean", "object", "array"]);
const RENDERER = Object.freeze({
  name: "@definitely-secure-studio/platform/prompt-sdk",
  version: "0.1.0",
  algorithm: "typed-parts-v1",
  canonical_json: "studio-json-v1",
  contract: Object.freeze({
    repository: "DefinitelySecureStudio/codex",
    commit: "dfd31a693674dc03dec4784dcdd1345f647cff1e",
    status: "provisional-unreleased"
  })
});

function record(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("INVALID_DEFINITION", "Expected an object.", path);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail("INVALID_DEFINITION", "Expected a plain object.", path);
  }
  if (Object.values(Object.getOwnPropertyDescriptors(value)).some((descriptor) => !Object.hasOwn(descriptor, "value")) || Object.getOwnPropertySymbols(value).length > 0) {
    fail("INVALID_DEFINITION", "Objects must contain only explicit JSON data properties.", path);
  }
  return value;
}

function array(value, path) {
  if (!Array.isArray(value)) fail("INVALID_DEFINITION", "Expected an array.", path);
  return value;
}

function declarations(items, kind) {
  const map = new Map();
  for (const [index, declaration] of array(items, [kind]).entries()) {
    record(declaration, [kind, index]);
    if (typeof declaration.name !== "string" || declaration.name.length === 0) {
      fail("INVALID_DEFINITION", "Declaration name must be a non-empty string.", [kind, index, "name"]);
    }
    if (map.has(declaration.name)) {
      fail("DUPLICATE_DECLARATION", `Duplicate ${kind} declaration: ${declaration.name}.`, [kind, index, "name"], { name: declaration.name, declaration: kind });
    }
    map.set(declaration.name, { declaration, index });
  }
  return map;
}

function jsonType(value) {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "object";
  return typeof value;
}

function validType(value, type) {
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (type === "array") return Array.isArray(value);
  return typeof value === type;
}

function equalScalar(left, right) {
  return typeof left === typeof right && Object.is(left, right);
}

function validateConstraints(value, declaration, path, defaultValue = false) {
  const constraints = declaration.constraints ?? {};
  let violation;
  if (constraints.enum && !constraints.enum.some((candidate) => equalScalar(candidate, value))) violation = "enum";
  if (typeof value === "string") {
    if (constraints.min_length !== undefined && [...value].length < constraints.min_length) violation = "min_length";
    if (constraints.max_length !== undefined && [...value].length > constraints.max_length) violation = "max_length";
    if (constraints.pattern !== undefined) {
      let expression;
      try { expression = new RegExp(constraints.pattern, "u"); } catch {
        fail("INVALID_DEFINITION", "Input constraint contains an invalid ECMA-262 pattern.", [...path, "constraints", "pattern"]);
      }
      if (!expression.test(value)) violation = "pattern";
    }
  }
  if (typeof value === "number") {
    if (constraints.minimum !== undefined && value < constraints.minimum) violation = "minimum";
    if (constraints.maximum !== undefined && value > constraints.maximum) violation = "maximum";
  }
  if (Array.isArray(value)) {
    if (constraints.min_items !== undefined && value.length < constraints.min_items) violation = "min_items";
    if (constraints.max_items !== undefined && value.length > constraints.max_items) violation = "max_items";
  }
  if (violation) {
    const code = defaultValue ? "INVALID_INPUT_DEFAULT" : "INPUT_CONSTRAINT_VIOLATION";
    fail(code, `${defaultValue ? "Default" : "Input"} for ${declaration.name} violates ${violation}.`, path, { name: declaration.name, constraint: violation });
  }
}

function validateInput(value, declaration, path, defaultValue = false) {
  if (!TYPES.has(declaration.type)) fail("INVALID_DEFINITION", `Unsupported input type: ${declaration.type}.`, [...path, "type"]);
  if (!validType(value, declaration.type)) {
    const code = defaultValue ? "INVALID_INPUT_DEFAULT" : "INVALID_INPUT_TYPE";
    fail(code, `${defaultValue ? "Default" : "Input"} ${declaration.name} must be ${declaration.type}.`, path, { name: declaration.name, expected: declaration.type, actual: jsonType(value) });
  }
  if (declaration.type === "object" || declaration.type === "array") canonicalJson(value, path);
  validateConstraints(value, declaration, path, defaultValue);
}

function resolveInputs(inputMap, supplied) {
  record(supplied, ["input_values"]);
  const unknown = Object.keys(supplied).filter((name) => !inputMap.has(name)).sort();
  if (unknown.length) fail("UNKNOWN_INPUT", `Unknown input: ${unknown[0]}.`, ["input_values", unknown[0]], { names: unknown });
  const values = new Map();
  const provenance = [];
  for (const [name, { declaration, index }] of inputMap) {
    if (!CLASSIFICATIONS.includes(declaration.classification)) {
      fail("INVALID_DEFINITION", `Input ${name} has an invalid classification.`, ["inputs", index, "classification"], { name });
    }
    const provided = Object.hasOwn(supplied, name);
    if (!provided && !Object.hasOwn(declaration, "default")) {
      if (declaration.required) fail("MISSING_REQUIRED_INPUT", `Required input is missing: ${name}.`, ["input_values", name], { name });
      continue;
    }
    if (declaration.required && Object.hasOwn(declaration, "default")) {
      fail("INVALID_INPUT_DEFAULT", `Required input ${name} cannot declare a default.`, ["inputs", index, "default"], { name });
    }
    const value = provided ? supplied[name] : declaration.default;
    validateInput(value, declaration, provided ? ["input_values", name] : ["inputs", index, "default"], !provided);
    values.set(name, value);
    provenance.push({ name, source: provided ? "provided" : "default", classification: declaration.classification });
  }
  return { values, provenance };
}

function resolveContexts(contextMap, supplied, packageProvenance = new Map()) {
  record(supplied, ["context_values"]);
  const unknown = Object.keys(supplied).filter((name) => !contextMap.has(name)).sort();
  if (unknown.length) fail("UNKNOWN_CONTEXT", `Unknown context slot: ${unknown[0]}.`, ["context_values", unknown[0]], { names: unknown });
  const values = new Map();
  const provenance = [];
  for (const [name, { declaration, index }] of contextMap) {
    const acceptedClassifications = array(declaration.accepted_classifications, ["context_slots", index, "accepted_classifications"]);
    if (acceptedClassifications.length === 0 || acceptedClassifications.some((value) => !CLASSIFICATIONS.includes(value))) {
      fail("INVALID_DEFINITION", `Context slot ${name} has invalid accepted classifications.`, ["context_slots", index, "accepted_classifications"], { slot: name });
    }
    if (!Object.hasOwn(supplied, name)) {
      if (declaration.required) fail("MISSING_REQUIRED_CONTEXT", `Required context is missing: ${name}.`, ["context_values", name], { slot: name });
      continue;
    }
    const context = record(supplied[name], ["context_values", name]);
    const classification = context.classification;
    if (!CLASSIFICATIONS.includes(classification) || !acceptedClassifications.includes(classification)) {
      fail("CONTEXT_CLASSIFICATION_MISMATCH", `Context ${name} has an unacceptable classification.`, ["context_values", name, "classification"], { slot: name, classification, accepted: declaration.accepted_classifications });
    }
    const mediaType = context.media_type ?? "text/plain";
    if (declaration.accepted_media_types && !declaration.accepted_media_types.includes(mediaType)) {
      fail("CONTEXT_MEDIA_TYPE_MISMATCH", `Context ${name} has an unacceptable media type.`, ["context_values", name, "media_type"], { slot: name, media_type: mediaType, accepted: declaration.accepted_media_types });
    }
    if (!Object.hasOwn(context, "value")) fail("INVALID_CONTEXT_VALUE", `Context ${name} has no value.`, ["context_values", name, "value"], { slot: name });
    const content = typeof context.value === "string" ? context.value : canonicalJson(context.value, ["context_values", name, "value"]);
    const byteSize = Buffer.byteLength(content, "utf8");
    if (declaration.max_bytes !== undefined && byteSize > declaration.max_bytes) {
      fail("CONTEXT_TOO_LARGE", `Context ${name} exceeds its byte limit.`, ["context_values", name, "value"], { slot: name, byte_size: byteSize, max_bytes: declaration.max_bytes });
    }
    values.set(name, { ...context, media_type: mediaType });
    provenance.push({ slot: name, classification, media_type: mediaType, byte_size: byteSize, ...(context.reference === undefined ? {} : { reference: context.reference }), ...(packageProvenance.has(name) ? { package: structuredClone(packageProvenance.get(name)) } : {}) });
  }
  return { values, provenance };
}

function textValue(value, path) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) return canonicalJson(value, path);
  fail("UNSUPPORTED_PART_FORMAT", "Text format accepts only string, number, integer, or boolean values.", path, { format: "text", actual: jsonType(value) });
}

function renderPart(part, path, inputMap, inputs, contextMap, contexts) {
  record(part, path);
  const format = part.format ?? "text";
  if (format !== "text" && format !== "json") fail("UNSUPPORTED_PART_FORMAT", `Unsupported part format: ${format}.`, [...path, "format"], { format });
  if (part.type === "text") {
    if (typeof part.text !== "string") fail("INVALID_PART", "Literal text must be a string.", [...path, "text"]);
    return part.text;
  }
  if (part.type === "input") {
    if (!inputMap.has(part.name)) fail("UNDECLARED_INPUT_REFERENCE", `Template references undeclared input: ${part.name}.`, [...path, "name"], { name: part.name });
    if (!inputs.has(part.name)) return "";
    const value = inputs.get(part.name);
    return format === "json" ? canonicalJson(value, [...path, "name"]) : textValue(value, [...path, "name"]);
  }
  if (part.type === "context") {
    if (!contextMap.has(part.slot)) fail("UNDECLARED_CONTEXT_REFERENCE", `Template references undeclared context: ${part.slot}.`, [...path, "slot"], { slot: part.slot });
    if (!contexts.has(part.slot)) return "";
    const value = contexts.get(part.slot).value;
    return format === "json" ? canonicalJson(value, [...path, "slot"]) : textValue(value, [...path, "slot"]);
  }
  fail("INVALID_PART", `Unsupported template part type: ${part.type}.`, [...path, "type"], { type: part.type });
}

function effectiveClassification(inputProvenance, contextProvenance) {
  const used = [...inputProvenance.map((item) => item.classification), ...contextProvenance.map((item) => item.classification)];
  return used.reduce((highest, value) => CLASSIFICATIONS.indexOf(value) > CLASSIFICATIONS.indexOf(highest) ? value : highest, "public");
}

function renderPromptCore(definition, { inputValues = {}, contextValues = {} } = {}, packageProvenance) {
  record(definition, []);
  if (definition.spec_version !== "1.0.0") fail("UNSUPPORTED_SPEC_VERSION", `Unsupported Prompt Definition version: ${definition.spec_version}.`, ["spec_version"], { supported: ["1.0.0"] });
  record(definition.template, ["template"]);
  if (definition.template?.format !== "studio-messages-v1") fail("UNSUPPORTED_TEMPLATE_FORMAT", `Unsupported template format: ${definition.template?.format}.`, ["template", "format"], { supported: ["studio-messages-v1"] });
  const inputMap = declarations(definition.inputs, "inputs");
  const contextMap = declarations(definition.context_slots, "context_slots");
  for (const [name, { index }] of contextMap) {
    if (inputMap.has(name)) fail("DUPLICATE_DECLARATION", `Context slot duplicates input name: ${name}.`, ["context_slots", index, "name"], { name, declaration: "cross-kind" });
  }
  const resolvedInputs = resolveInputs(inputMap, inputValues);
  const resolvedContexts = resolveContexts(contextMap, contextValues, packageProvenance);
  const messages = array(definition.template.messages, ["template", "messages"]).map((message, messageIndex) => {
    record(message, ["template", "messages", messageIndex]);
    if (!ROLES.has(message.role)) fail("INVALID_MESSAGE_ROLE", `Unsupported Studio message role: ${message.role}.`, ["template", "messages", messageIndex, "role"], { role: message.role });
    const parts = array(message.parts, ["template", "messages", messageIndex, "parts"]);
    if (parts.length === 0) fail("INVALID_DEFINITION", "Template messages must contain at least one part.", ["template", "messages", messageIndex, "parts"]);
    return { role: message.role, content: parts.map((part, partIndex) => renderPart(part, ["template", "messages", messageIndex, "parts", partIndex], inputMap, resolvedInputs.values, contextMap, resolvedContexts.values)).join("") };
  });
  if (messages.length === 0) fail("INVALID_DEFINITION", "Template must contain at least one message.", ["template", "messages"]);

  const renderedPrompt = {
    format: "studio-rendered-messages-v1",
    definition: { id: definition.id, version: definition.version, spec_version: definition.spec_version },
    renderer: RENDERER,
    classification: effectiveClassification(resolvedInputs.provenance, resolvedContexts.provenance),
    messages,
    inputs: resolvedInputs.provenance,
    contexts: resolvedContexts.provenance
  };
  const canonical = canonicalJson(renderedPrompt);
  return Object.freeze({
    renderedPrompt: Object.freeze(renderedPrompt),
    canonical,
    byteSize: Buffer.byteLength(canonical, "utf8"),
    sha256: `sha256:${createHash("sha256").update(canonical, "utf8").digest("hex")}`
  });
}

export function renderPrompt(definition, values) {
  return renderPromptCore(definition, values);
}

export function renderPromptWithContextProvenance(definition, values, packageProvenance) {
  return renderPromptCore(definition, values, packageProvenance);
}

export function tryRenderPrompt(definition, values) {
  try {
    return { ok: true, value: renderPrompt(definition, values) };
  } catch (error) {
    if (error instanceof PromptRenderError) return { ok: false, error: error.toJSON() };
    throw error;
  }
}
