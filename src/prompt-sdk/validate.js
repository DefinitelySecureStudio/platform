import validateSchema from "./generated/prompt-definition-v1-schema.js";
import { canonicalJson } from "./canonical-json.js";
import { diagnostic, pointer, report } from "./diagnostics.js";

const CORE_CAPABILITIES = Object.freeze(["text-generation", "structured-output"]);
const CONSTRAINTS = Object.freeze({
  string: new Set(["enum", "min_length", "max_length", "pattern"]),
  integer: new Set(["enum", "minimum", "maximum"]),
  number: new Set(["enum", "minimum", "maximum"]),
  boolean: new Set(["enum"]),
  object: new Set([]),
  array: new Set(["min_items", "max_items"])
});
const PLACEHOLDER = /\$\{([^}\n]{1,128})\}|\{\{([^}\n]{1,128})\}\}|<%=?([^%\n]{1,128})%>/gu;
const SECRET_WORD = /(?:^|[^a-z])(secret|token|password|passwd|credential|api[_-]?key|private[_-]?key)(?:$|[^a-z])/iu;
const IMPLICIT_ACCESS = /\b(?:process\.env|deno\.env|secret\s*manager|secretsmanager)\b|\b(?:os\.getenv|getenv|readfile)\s*\(|\bENV\s*\[|(?:env|file|secret|vault):\/\/|\/(?:etc|proc)\//iu;
const POLICY_CLAIM = /\b(?:authorized|approved|permission granted|establish(?:es)? canon|publication approved|policy allows)\b/iu;

function keywordCode(keyword) {
  return `SCHEMA_${keyword.replace(/([a-z])([A-Z])/gu, "$1_$2").replaceAll("-", "_").toUpperCase()}`;
}

function schemaPath(error) {
  const segments = error.instancePath ? error.instancePath.split("/").slice(1).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")) : [];
  if (error.keyword === "required") segments.push(error.params.missingProperty);
  if (error.keyword === "additionalProperties") segments.push(error.params.additionalProperty);
  return pointer(segments);
}

function schemaDiagnostics(definition) {
  if (validateSchema(definition)) return [];
  return (validateSchema.errors ?? []).map((error) => diagnostic(
    "error",
    keywordCode(error.keyword),
    `Prompt Definition schema violation: ${error.message}.`,
    schemaPath(error),
    { keyword: error.keyword, schema_path: error.schemaPath, ...error.params }
  ));
}

function jsonEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function matchesType(value, type) {
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}

function violatesConstraint(value, constraints = {}) {
  if (constraints.enum && !constraints.enum.some((candidate) => jsonEqual(candidate, value))) return "enum";
  if (typeof value === "string") {
    if (constraints.min_length !== undefined && [...value].length < constraints.min_length) return "min_length";
    if (constraints.max_length !== undefined && [...value].length > constraints.max_length) return "max_length";
    if (constraints.pattern !== undefined) {
      try { if (!new RegExp(constraints.pattern, "u").test(value)) return "pattern"; } catch { return "pattern"; }
    }
  }
  if (typeof value === "number") {
    if (constraints.minimum !== undefined && value < constraints.minimum) return "minimum";
    if (constraints.maximum !== undefined && value > constraints.maximum) return "maximum";
  }
  if (Array.isArray(value)) {
    if (constraints.min_items !== undefined && value.length < constraints.min_items) return "min_items";
    if (constraints.max_items !== undefined && value.length > constraints.max_items) return "max_items";
  }
}

function lintLiteral(text, path, diagnostics) {
  if (typeof text !== "string") return;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const expression = (match[1] ?? match[2] ?? match[3]).trim();
    const secret = SECRET_WORD.test(expression);
    diagnostics.push(diagnostic(
      secret ? "error" : "warning",
      secret ? "SUSPICIOUS_SECRET_PLACEHOLDER" : "UNRESOLVED_PLACEHOLDER",
      secret ? "Template contains a secret-like placeholder; credentials and implicit secret lookup are prohibited." : "Template contains placeholder-looking text, but Prompt Definition v1 literal text does not interpolate.",
      path,
      { syntax: match[0].startsWith("${") ? "dollar-brace" : match[0].startsWith("{{") ? "double-brace" : "template-tag" }
    ));
  }
  if (IMPLICIT_ACCESS.test(text)) {
    diagnostics.push(diagnostic("error", "PROHIBITED_IMPLICIT_ACCESS", "Template appears to request implicit environment, secret, or filesystem access.", path));
  }
}

function semanticDiagnostics(definition, options) {
  if (definition === null || typeof definition !== "object" || Array.isArray(definition)) return [];
  const diagnostics = [];
  const inputs = Array.isArray(definition.inputs) ? definition.inputs : [];
  const contexts = Array.isArray(definition.context_slots) ? definition.context_slots : [];
  const inputNames = new Map();
  const contextNames = new Map();
  const referencedInputs = new Set();
  const referencedContexts = new Set();

  for (const [index, input] of inputs.entries()) {
    if (!input || typeof input !== "object" || Array.isArray(input) || typeof input.name !== "string") continue;
    if (inputNames.has(input.name)) diagnostics.push(diagnostic("error", "DUPLICATE_INPUT", `Duplicate input declaration: ${input.name}.`, ["inputs", index, "name"], { name: input.name, first_index: inputNames.get(input.name) }));
    else inputNames.set(input.name, index);

    const constraints = input.constraints && typeof input.constraints === "object" && !Array.isArray(input.constraints) ? input.constraints : undefined;
    if (constraints && CONSTRAINTS[input.type]) {
      for (const name of Object.keys(constraints)) {
        if (!CONSTRAINTS[input.type].has(name)) diagnostics.push(diagnostic("error", "INAPPLICABLE_CONSTRAINT", `Constraint ${name} does not apply to ${input.type} inputs.`, ["inputs", index, "constraints", name], { name: input.name, input_type: input.type, constraint: name }));
      }
      for (const [minimum, maximum] of [["min_length", "max_length"], ["minimum", "maximum"], ["min_items", "max_items"]]) {
        if (constraints[minimum] !== undefined && constraints[maximum] !== undefined && constraints[minimum] > constraints[maximum]) {
          diagnostics.push(diagnostic("error", "CONTRADICTORY_CONSTRAINTS", `${minimum} must not exceed ${maximum}.`, ["inputs", index, "constraints"], { name: input.name, minimum, maximum }));
        }
      }
      if (constraints.pattern !== undefined) {
        try { new RegExp(constraints.pattern, "u"); } catch { diagnostics.push(diagnostic("error", "INVALID_CONSTRAINT_PATTERN", "Input pattern is not a valid ECMA-262 regular expression.", ["inputs", index, "constraints", "pattern"], { name: input.name })); }
      }
    }
    if (Object.hasOwn(input, "default")) {
      if (input.required === true) diagnostics.push(diagnostic("error", "REQUIRED_INPUT_DEFAULT", "A required input must not declare a default.", ["inputs", index, "default"], { name: input.name }));
      if (typeof input.type === "string" && !matchesType(input.default, input.type)) diagnostics.push(diagnostic("error", "INVALID_DEFAULT_TYPE", `Default does not match declared ${input.type} type.`, ["inputs", index, "default"], { name: input.name, expected: input.type }));
      else {
        const constraint = violatesConstraint(input.default, constraints);
        if (constraint) diagnostics.push(diagnostic("error", "DEFAULT_CONSTRAINT_VIOLATION", `Default violates ${constraint}.`, ["inputs", index, "default"], { name: input.name, constraint }));
      }
      if (typeof input.default === "string") lintLiteral(input.default, ["inputs", index, "default"], diagnostics);
    }
  }

  for (const [index, context] of contexts.entries()) {
    if (!context || typeof context !== "object" || Array.isArray(context) || typeof context.name !== "string") continue;
    if (contextNames.has(context.name)) diagnostics.push(diagnostic("error", "DUPLICATE_CONTEXT_SLOT", `Duplicate context slot declaration: ${context.name}.`, ["context_slots", index, "name"], { name: context.name, first_index: contextNames.get(context.name) }));
    else contextNames.set(context.name, index);
    if (inputNames.has(context.name)) diagnostics.push(diagnostic("error", "DECLARATION_NAME_COLLISION", `Context slot duplicates input name: ${context.name}.`, ["context_slots", index, "name"], { name: context.name, input_index: inputNames.get(context.name) }));
  }

  const messages = Array.isArray(definition.template?.messages) ? definition.template.messages : [];
  for (const [messageIndex, message] of messages.entries()) {
    const parts = Array.isArray(message?.parts) ? message.parts : [];
    for (const [partIndex, part] of parts.entries()) {
      if (!part || typeof part !== "object" || Array.isArray(part)) continue;
      const path = ["template", "messages", messageIndex, "parts", partIndex];
      if (part.type === "text") lintLiteral(part.text, [...path, "text"], diagnostics);
      if (part.type === "input" && typeof part.name === "string") {
        referencedInputs.add(part.name);
        if (!inputNames.has(part.name)) diagnostics.push(diagnostic("error", "UNDECLARED_INPUT_REFERENCE", `Template references undeclared input: ${part.name}.`, [...path, "name"], { name: part.name }));
      }
      if (part.type === "context" && typeof part.slot === "string") {
        referencedContexts.add(part.slot);
        if (!contextNames.has(part.slot)) diagnostics.push(diagnostic("error", "UNDECLARED_CONTEXT_REFERENCE", `Template references undeclared context slot: ${part.slot}.`, [...path, "slot"], { slot: part.slot }));
        const previous = parts[partIndex - 1];
        if (previous?.type === "context" && previous.slot === part.slot) diagnostics.push(diagnostic("warning", "DUPLICATE_ADJACENT_CONTEXT", `Context slot ${part.slot} is injected in adjacent parts.`, path, { slot: part.slot }));
      }
    }
    if (message?.role === "assistant-example") {
      const text = parts.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("");
      if (POLICY_CLAIM.test(text)) diagnostics.push(diagnostic("warning", "ASSISTANT_EXAMPLE_POLICY_CLAIM", "Assistant example contains an apparent policy, authority, Canon, or publication claim.", ["template", "messages", messageIndex]));
    }
  }

  for (const [name, index] of inputNames) if (!referencedInputs.has(name)) diagnostics.push(diagnostic("warning", "UNUSED_INPUT", `Declared input is not referenced: ${name}.`, ["inputs", index, "name"], { name, required: inputs[index].required === true }));
  for (const [name, index] of contextNames) if (!referencedContexts.has(name)) diagnostics.push(diagnostic("warning", "UNUSED_CONTEXT_SLOT", `Declared context slot is not referenced: ${name}.`, ["context_slots", index, "name"], { slot: name, required: contexts[index].required === true }));

  const deprecation = definition.lifecycle?.deprecation;
  if (deprecation && typeof deprecation === "object") {
    const deprecatedAt = Date.parse(deprecation.deprecated_at);
    const supportUntil = Date.parse(deprecation.support_until);
    if (Number.isFinite(deprecatedAt) && Number.isFinite(supportUntil) && supportUntil < deprecatedAt) diagnostics.push(diagnostic("error", "INVALID_SUPPORT_WINDOW", "Deprecation support_until must not precede deprecated_at.", ["lifecycle", "deprecation", "support_until"]));
  }
  if (definition.lifecycle?.status === "stable") diagnostics.push(diagnostic("error", "UNRELEASED_CONTRACT_STABLE_LIFECYCLE", "A prompt cannot be stable while Prompt Definition v1 remains unreleased.", ["lifecycle", "status"], { contract_status: "provisional-unreleased" }));

  const requiredCapabilities = Array.isArray(definition.capabilities?.required) ? definition.capabilities.required : [];
  const optionalCapabilities = Array.isArray(definition.capabilities?.optional) ? definition.capabilities.optional : [];
  const supportedCapabilities = new Set(options.supportedCapabilities ?? CORE_CAPABILITIES);
  for (const capability of requiredCapabilities) {
    if (optionalCapabilities.includes(capability)) diagnostics.push(diagnostic("error", "CAPABILITY_SET_OVERLAP", `Capability appears in required and optional sets: ${capability}.`, ["capabilities", "optional"], { capability }));
    if (!supportedCapabilities.has(capability)) diagnostics.push(diagnostic("error", "UNSUPPORTED_REQUIRED_CAPABILITY", `Required capability is unsupported: ${capability}.`, ["capabilities", "required"], { capability }));
  }
  for (const capability of optionalCapabilities) if (!supportedCapabilities.has(capability)) diagnostics.push(diagnostic("warning", "UNSUPPORTED_OPTIONAL_CAPABILITY", `Optional capability is unsupported: ${capability}.`, ["capabilities", "optional"], { capability }));
  if (definition.output?.kind === "json" && !requiredCapabilities.includes("structured-output") && !optionalCapabilities.includes("structured-output")) diagnostics.push(diagnostic("error", "JSON_OUTPUT_MISSING_CAPABILITY", "JSON output must declare structured-output as required or optional.", ["capabilities"]));

  const supportedExtensions = new Set(options.supportedExtensions ?? []);
  if (definition.extensions && typeof definition.extensions === "object" && !Array.isArray(definition.extensions)) {
    for (const [namespace, extension] of Object.entries(definition.extensions)) {
      if (extension?.required === true && extension.fallback !== "reject") diagnostics.push(diagnostic("error", "REQUIRED_EXTENSION_FALLBACK", "A required extension must use reject fallback.", ["extensions", namespace, "fallback"], { namespace }));
      if (!supportedExtensions.has(namespace)) diagnostics.push(diagnostic(extension?.required === true ? "error" : "warning", extension?.required === true ? "UNSUPPORTED_REQUIRED_EXTENSION" : "UNSUPPORTED_OPTIONAL_EXTENSION", `${extension?.required === true ? "Required" : "Optional"} extension is unsupported: ${namespace}.`, ["extensions", namespace], { namespace, fallback: extension?.fallback }));
    }
  }
  return diagnostics;
}

export function validatePromptDefinition(definition, options = {}) {
  try {
    canonicalJson(definition);
  } catch (error) {
    return report([diagnostic("error", "NON_JSON_DEFINITION", "Prompt definition must contain only explicit JSON data values.", error.path ?? "", { reason: error.details?.kind ?? "non-json" })]);
  }
  return report([...schemaDiagnostics(definition), ...semanticDiagnostics(definition, options)]);
}

export function validatePromptDefinitions(definitions, options = {}) {
  if (!Array.isArray(definitions)) return report([diagnostic("error", "DEFINITION_SET_TYPE", "Prompt definition set must be an array.")]);
  const diagnostics = [];
  const identities = new Map();
  for (const [index, definition] of definitions.entries()) {
    const item = validatePromptDefinition(definition, options);
    diagnostics.push(...item.diagnostics.map((entry) => ({ ...entry, path: pointer([index]) + entry.path })));
    const safeJson = !item.diagnostics.some(({ code }) => code === "NON_JSON_DEFINITION");
    if (safeJson && typeof definition?.id === "string" && typeof definition?.version === "string") {
      const identity = `${definition.id}@${definition.version}`;
      if (identities.has(identity)) diagnostics.push(diagnostic("error", "DUPLICATE_PROMPT_VERSION", `Duplicate prompt identity and version: ${identity}.`, [index], { id: definition.id, version: definition.version, first_index: identities.get(identity) }));
      else identities.set(identity, index);
    }
  }
  return report(diagnostics);
}
