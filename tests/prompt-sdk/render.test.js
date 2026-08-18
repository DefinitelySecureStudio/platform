import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { canonicalJson, PromptRenderError, renderPrompt, tryRenderPrompt } from "../../src/prompt-sdk/index.js";

const fixtureUrl = new URL("../fixtures/prompt-definition.json", import.meta.url);
const definition = JSON.parse(await readFile(fixtureUrl, "utf8"));

function clone(value = definition) {
  return structuredClone(value);
}

function expectCode(code, operation) {
  assert.throws(operation, (error) => {
    assert.ok(error instanceof PromptRenderError);
    assert.equal(error.code, code);
    assert.ok(Array.isArray(error.path));
    return true;
  });
}

test("renders typed parts into a canonical provider-neutral prompt", () => {
  const result = renderPrompt(definition, {
    inputValues: { item: "blue cube", attributes: { size: 2, color: "blue" } },
    contextValues: {
      approved_notes: { value: "Synthetic note.", classification: "internal", media_type: "text/plain", reference: "context:example:1" }
    }
  });

  assert.deepEqual(result.renderedPrompt.messages, [
    { role: "instruction", content: "Describe the explicit item. ${HOME} and {{secret}} are literal." },
    { role: "user", content: "Item: blue cube\nAttributes: {\"color\":\"blue\",\"size\":2}\nConcise: true\nNotes: Synthetic note." }
  ]);
  assert.equal(result.renderedPrompt.classification, "internal");
  assert.deepEqual(result.renderedPrompt.inputs, [
    { name: "item", source: "provided", classification: "public" },
    { name: "attributes", source: "provided", classification: "public" },
    { name: "concise", source: "default", classification: "public" }
  ]);
  assert.equal(result.renderedPrompt.contexts[0].reference, "context:example:1");
  assert.match(result.sha256, /^sha256:[0-9a-f]{64}$/);
  assert.equal(result.byteSize, Buffer.byteLength(result.canonical, "utf8"));
  assert.equal(result.canonical, canonicalJson(result.renderedPrompt));
});

test("is deterministic across object insertion order", () => {
  const first = renderPrompt(definition, { inputValues: { item: "cube", attributes: { z: 1, a: { y: 2, b: 3 } } } });
  const second = renderPrompt(definition, { inputValues: { attributes: { a: { b: 3, y: 2 }, z: 1 }, item: "cube" } });
  assert.equal(first.canonical, second.canonical);
  assert.equal(first.sha256, second.sha256);
});

test("canonical JSON defines scalar, array, key, and escaping behavior", () => {
  assert.equal(canonicalJson({ z: -0, a: [true, "line\nquote\""] }), "{\"a\":[true,\"line\\nquote\\\"\"],\"z\":0}");
  expectCode("NON_JSON_VALUE", () => canonicalJson({ bad: Number.NaN }));
  expectCode("NON_JSON_VALUE", () => canonicalJson({ bad: 1n }));
  const cyclic = {};
  cyclic.self = cyclic;
  expectCode("NON_JSON_VALUE", () => canonicalJson(cyclic));
  const sparse = [];
  sparse[1] = "value";
  expectCode("NON_JSON_VALUE", () => canonicalJson(sparse));
  let getterReads = 0;
  const accessor = Object.defineProperty({}, "hidden", { enumerable: true, get() { getterReads += 1; return "implicit"; } });
  expectCode("NON_JSON_VALUE", () => canonicalJson(accessor));
  assert.equal(getterReads, 0);
});

test("does not resolve environment-looking literal text or undeclared state", () => {
  const result = renderPrompt(definition, { inputValues: { item: "cube", attributes: {} } });
  assert.equal(result.renderedPrompt.messages[0].content, "Describe the explicit item. ${HOME} and {{secret}} are literal.");
  assert.match(result.renderedPrompt.messages[1].content, /Notes: $/);
  assert.doesNotMatch(result.canonical, /\/Users\//);
});

test("rejects missing and unknown inputs deterministically", () => {
  expectCode("MISSING_REQUIRED_INPUT", () => renderPrompt(definition, { inputValues: { attributes: {} } }));
  try {
    renderPrompt(definition, { inputValues: { item: "cube", attributes: {}, zzz: "secret-z", aaa: "secret-a" } });
    assert.fail("expected an error");
  } catch (error) {
    assert.equal(error.code, "UNKNOWN_INPUT");
    assert.deepEqual(error.details.names, ["aaa", "zzz"]);
    assert.doesNotMatch(JSON.stringify(error), /secret-/);
  }
});

test("validates types, defaults, constraints, and text formatting", () => {
  expectCode("INVALID_INPUT_TYPE", () => renderPrompt(definition, { inputValues: { item: 12, attributes: {} } }));
  expectCode("INPUT_CONSTRAINT_VIOLATION", () => renderPrompt(definition, { inputValues: { item: "", attributes: {} } }));

  const invalidDefault = clone();
  invalidDefault.inputs[2].default = "yes";
  expectCode("INVALID_INPUT_DEFAULT", () => renderPrompt(invalidDefault, { inputValues: { item: "cube", attributes: {} } }));

  const textObject = clone();
  textObject.template.messages[1].parts[3].format = "text";
  expectCode("UNSUPPORTED_PART_FORMAT", () => renderPrompt(textObject, { inputValues: { item: "cube", attributes: {} } }));
});

test("formats finite numeric scalars and structured arrays without coercion", () => {
  const numeric = clone();
  numeric.inputs[1].type = "number";
  numeric.template.messages[1].parts[3].format = "text";
  const numberResult = renderPrompt(numeric, { inputValues: { item: "cube", attributes: -0 } });
  assert.match(numberResult.renderedPrompt.messages[1].content, /Attributes: 0\n/);

  const structured = clone();
  structured.inputs[1].type = "array";
  const arrayResult = renderPrompt(structured, { inputValues: { item: "cube", attributes: [{ z: 1, a: 2 }] } });
  assert.match(arrayResult.renderedPrompt.messages[1].content, /Attributes: \[\{\"a\":2,\"z\":1\}\]\n/);
});

test("enforces explicit context classification, media type, and byte limit", () => {
  const required = clone();
  required.context_slots[0].required = true;
  expectCode("MISSING_REQUIRED_CONTEXT", () => renderPrompt(required, { inputValues: { item: "cube", attributes: {} } }));
  expectCode("UNKNOWN_CONTEXT", () => renderPrompt(definition, { inputValues: { item: "cube", attributes: {} }, contextValues: { hidden: { value: "x" } } }));
  expectCode("CONTEXT_CLASSIFICATION_MISMATCH", () => renderPrompt(definition, { inputValues: { item: "cube", attributes: {} }, contextValues: { approved_notes: { value: "x", classification: "restricted" } } }));
  expectCode("CONTEXT_MEDIA_TYPE_MISMATCH", () => renderPrompt(definition, { inputValues: { item: "cube", attributes: {} }, contextValues: { approved_notes: { value: "x", classification: "public", media_type: "application/json" } } }));
  expectCode("CONTEXT_TOO_LARGE", () => renderPrompt(definition, { inputValues: { item: "cube", attributes: {} }, contextValues: { approved_notes: { value: "x".repeat(101), classification: "public" } } }));
});

test("renders structured context only through explicit JSON format", () => {
  const structured = clone();
  structured.context_slots[0].accepted_media_types = ["application/json"];
  structured.template.messages[1].parts[7].format = "json";
  const result = renderPrompt(structured, {
    inputValues: { item: "cube", attributes: {} },
    contextValues: { approved_notes: { value: { z: 1, a: [2] }, classification: "public", media_type: "application/json" } }
  });
  assert.match(result.renderedPrompt.messages[1].content, /Notes: \{\"a\":\[2\],\"z\":1\}$/);

  structured.template.messages[1].parts[7].format = "text";
  expectCode("UNSUPPORTED_PART_FORMAT", () => renderPrompt(structured, {
    inputValues: { item: "cube", attributes: {} },
    contextValues: { approved_notes: { value: {}, classification: "public", media_type: "application/json" } }
  }));
});

test("rejects undeclared references and invalid definition boundaries", () => {
  const inputReference = clone();
  inputReference.template.messages[0].parts.push({ type: "input", name: "missing" });
  expectCode("UNDECLARED_INPUT_REFERENCE", () => renderPrompt(inputReference, { inputValues: { item: "cube", attributes: {} } }));

  const contextReference = clone();
  contextReference.template.messages[0].parts.push({ type: "context", slot: "missing" });
  expectCode("UNDECLARED_CONTEXT_REFERENCE", () => renderPrompt(contextReference, { inputValues: { item: "cube", attributes: {} } }));

  const duplicate = clone();
  duplicate.context_slots[0].name = "item";
  expectCode("DUPLICATE_DECLARATION", () => renderPrompt(duplicate, { inputValues: { item: "cube", attributes: {} } }));

  const unsupported = clone();
  unsupported.spec_version = "2.0.0";
  expectCode("UNSUPPORTED_SPEC_VERSION", () => renderPrompt(unsupported));
});

test("returns serializable structured errors without input values", () => {
  const result = tryRenderPrompt(definition, { inputValues: { item: "PRIVATE-VALUE", attributes: "wrong" } });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "INVALID_INPUT_TYPE");
  assert.deepEqual(result.error.path, ["input_values", "attributes"]);
  assert.doesNotMatch(JSON.stringify(result.error), /PRIVATE-VALUE|wrong/);
});
