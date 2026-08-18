import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parsePromptJson, validatePromptDefinition, validatePromptDefinitions } from "../../src/prompt-sdk/index.js";

const validPath = new URL("../fixtures/validation/valid.prompt.json", import.meta.url);
const schemaInvalidPath = new URL("../fixtures/validation/schema-invalid.prompt.json", import.meta.url);
const duplicateKeyPath = new URL("../fixtures/validation/duplicate-key.prompt.json", import.meta.url);
const valid = JSON.parse(await readFile(validPath, "utf8"));

function clone() { return structuredClone(valid); }
function codes(result) { return result.diagnostics.map(({ code }) => code); }

test("accepts a schema-conformant, semantically complete prompt", () => {
  const result = validatePromptDefinition(valid);
  assert.equal(result.valid, true);
  assert.deepEqual(result.summary, { errors: 0, warnings: 0 });
  assert.equal(result.contract.commit, "bd31b6249e068d3317306afb857d68024f2929be");
  assert.equal(result.contract.schema_byte_size, 18384);
});

test("returns machine-readable diagnostics for schema violations", async () => {
  const definition = JSON.parse(await readFile(schemaInvalidPath, "utf8"));
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("SCHEMA_REQUIRED"));
  assert.ok(codes(result).includes("SCHEMA_ADDITIONAL_PROPERTIES"));
  assert.ok(codes(result).includes("SCHEMA_PATTERN"));
  assert.ok(result.diagnostics.every(({ severity, code, path, details }) => severity === "error" && code && typeof path === "string" && details));
});

test("detects duplicate declarations, collisions, and undeclared references", () => {
  const definition = clone();
  definition.inputs.push(structuredClone(definition.inputs[0]));
  const collidingContext = {
    name: "source_text",
    description: "Synthetic collision.",
    required: false,
    accepted_classifications: ["public"]
  };
  definition.context_slots.push(collidingContext, structuredClone(collidingContext));
  definition.template.messages[1].parts.push({ type: "input", name: "missing_input" });
  definition.template.messages[1].parts.push({ type: "context", slot: "missing_context" });
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("DUPLICATE_INPUT"));
  assert.ok(codes(result).includes("DUPLICATE_CONTEXT_SLOT"));
  assert.ok(codes(result).includes("DECLARATION_NAME_COLLISION"));
  assert.ok(codes(result).includes("UNDECLARED_INPUT_REFERENCE"));
  assert.ok(codes(result).includes("UNDECLARED_CONTEXT_REFERENCE"));
});

test("checks constraint applicability, contradictions, defaults, and lifecycle windows", () => {
  const definition = clone();
  Object.assign(definition.inputs[0], {
    required: false,
    default: "x",
    constraints: { min_length: 5, max_length: 2, minimum: 10 }
  });
  definition.lifecycle = {
    status: "deprecated",
    deprecation: {
      deprecated_at: "2026-08-18T00:00:00Z",
      support_until: "2026-08-17T00:00:00Z",
      no_replacement_reason: "Synthetic retirement."
    }
  };
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("INAPPLICABLE_CONSTRAINT"));
  assert.ok(codes(result).includes("CONTRADICTORY_CONSTRAINTS"));
  assert.ok(codes(result).includes("DEFAULT_CONSTRAINT_VIOLATION"));
  assert.ok(codes(result).includes("INVALID_SUPPORT_WINDOW"));

  const malformed = clone();
  malformed.inputs[0].required = false;
  malformed.inputs[0].default = 42;
  malformed.inputs[0].constraints.pattern = "(";
  const malformedResult = validatePromptDefinition(malformed);
  assert.ok(codes(malformedResult).includes("INVALID_DEFAULT_TYPE"));
  assert.ok(codes(malformedResult).includes("INVALID_CONSTRAINT_PATTERN"));
});

test("distinguishes authoring warnings from security errors", () => {
  const warning = clone();
  warning.template.messages[0].parts[0].text = "The token ${DISPLAY_NAME} is literal in v1.";
  const warningResult = validatePromptDefinition(warning);
  assert.equal(warningResult.valid, true);
  assert.equal(warningResult.summary.warnings, 1);
  assert.ok(codes(warningResult).includes("UNRESOLVED_PLACEHOLDER"));

  const unsafe = clone();
  unsafe.template.messages[0].parts[0].text = "Load {{API_KEY}} from process.env before continuing.";
  const unsafeResult = validatePromptDefinition(unsafe);
  assert.equal(unsafeResult.valid, false);
  assert.ok(codes(unsafeResult).includes("SUSPICIOUS_SECRET_PLACEHOLDER"));
  assert.ok(codes(unsafeResult).includes("PROHIBITED_IMPLICIT_ACCESS"));
  assert.doesNotMatch(JSON.stringify(unsafeResult.diagnostics), /actual|API_KEY/);
});

test("warns about unused declarations, repeated context, and authority claims", () => {
  const definition = clone();
  definition.inputs.push({ name: "unused_input", description: "Synthetic unused value.", type: "boolean", required: false, classification: "public" });
  definition.context_slots.push({ name: "repeated_context", description: "Synthetic repeated context.", required: false, accepted_classifications: ["public"] });
  definition.context_slots.push({ name: "unused_context", description: "Synthetic unused context.", required: false, accepted_classifications: ["public"] });
  definition.template.messages.push({
    role: "assistant-example",
    parts: [
      { type: "text", text: "Publication approved. " },
      { type: "context", slot: "repeated_context" },
      { type: "context", slot: "repeated_context" }
    ]
  });
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, true);
  assert.ok(codes(result).includes("UNUSED_INPUT"));
  assert.ok(codes(result).includes("UNUSED_CONTEXT_SLOT"));
  assert.ok(codes(result).includes("DUPLICATE_ADJACENT_CONTEXT"));
  assert.ok(codes(result).includes("ASSISTANT_EXAMPLE_POLICY_CLAIM"));
});

test("checks capability and extension compatibility", () => {
  const definition = clone();
  definition.capabilities.required.push("example.image-generation");
  definition.capabilities.optional.push("text-generation", "example.advisory");
  definition.extensions = {
    "example.required": { required: true, fallback: "omit", configuration: {} },
    "example.optional": { required: false, fallback: "omit", configuration: {} }
  };
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("CAPABILITY_SET_OVERLAP"));
  assert.ok(codes(result).includes("UNSUPPORTED_REQUIRED_CAPABILITY"));
  assert.ok(codes(result).includes("UNSUPPORTED_OPTIONAL_CAPABILITY"));
  assert.ok(codes(result).includes("REQUIRED_EXTENSION_FALLBACK"));
  assert.ok(codes(result).includes("UNSUPPORTED_REQUIRED_EXTENSION"));
  assert.ok(codes(result).includes("UNSUPPORTED_OPTIONAL_EXTENSION"));
});

test("requires structured-output for JSON output and blocks stable use before contract release", () => {
  const definition = clone();
  definition.output = { kind: "json", media_type: "application/json", description: "Synthetic JSON output." };
  definition.lifecycle.status = "stable";
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("JSON_OUTPUT_MISSING_CAPABILITY"));
  assert.ok(codes(result).includes("UNRELEASED_CONTRACT_STABLE_LIFECYCLE"));
});

test("detects exact duplicate prompt identity/version across a set", () => {
  const result = validatePromptDefinitions([valid, clone()]);
  assert.equal(result.valid, false);
  assert.ok(codes(result).includes("DUPLICATE_PROMPT_VERSION"));
  assert.equal(result.diagnostics.find(({ code }) => code === "DUPLICATE_PROMPT_VERSION").path, "/1");
});

test("parses raw JSON with duplicate-key and syntax evidence without echoing source", async () => {
  const duplicate = parsePromptJson(await readFile(duplicateKeyPath, "utf8"));
  assert.ok(codes({ diagnostics: duplicate.diagnostics }).includes("DUPLICATE_JSON_KEY"));
  assert.equal(duplicate.diagnostics[0].path, "/spec_version");

  const invalid = parsePromptJson("{\"private\": SUPER_SECRET}");
  assert.equal(invalid.value, undefined);
  assert.equal(invalid.diagnostics[0].code, "JSON_SYNTAX");
  assert.doesNotMatch(JSON.stringify(invalid.diagnostics), /SUPER_SECRET/);
});

test("rejects non-JSON library values without invoking accessors", () => {
  let reads = 0;
  const definition = Object.defineProperty({}, "secret", { enumerable: true, get() { reads += 1; return "hidden"; } });
  const result = validatePromptDefinition(definition);
  assert.equal(result.valid, false);
  assert.equal(result.diagnostics[0].code, "NON_JSON_DEFINITION");
  assert.equal(reads, 0);
});

test("CLI emits JSON and uses warnings-as-errors as a CI quality gate", () => {
  const cli = fileURLToPath(new URL("../../src/prompt-sdk/cli.js", import.meta.url));
  const passing = spawnSync(process.execPath, [cli, "validate", "--format", "json", fileURLToPath(validPath)], { encoding: "utf8" });
  assert.equal(passing.status, 0, passing.stderr);
  assert.equal(JSON.parse(passing.stdout).valid, true);

  const warning = clone();
  warning.template.messages[0].parts[0].text = "The token ${DISPLAY_NAME} is literal in v1.";
  const failing = spawnSync(process.execPath, [cli, "validate", "--format", "json", "--warnings-as-errors", "-"], { encoding: "utf8", input: JSON.stringify(warning) });
  assert.equal(failing.status, 1);
  const output = JSON.parse(failing.stdout);
  assert.equal(output.valid, false);
  assert.equal(output.summary.errors, 0);
  assert.equal(output.summary.warnings, 1);
});
