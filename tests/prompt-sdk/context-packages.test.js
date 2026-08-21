import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ContextPackageError, bindContextPackage, canonicalJson, createExecutionRequest,
  createMockContextAuthorization, createMockContextPackage, parseContextPackageJson,
  renderPromptWithContextPackage, validateContextBinding, validateContextDocument
} from "../../src/prompt-sdk/index.js";

const baseDefinition = JSON.parse(await readFile(new URL("../fixtures/prompt-definition.json", import.meta.url), "utf8"));

function definition() {
  const value = structuredClone(baseDefinition);
  value.id = "prompt.reference.context-package";
  value.template.messages[0].parts[0].text = "Describe the explicit item using only supplied inputs and context.";
  value.context_slots[0].required = true;
  value.context_slots.push({ name: "context_facts", description: "Explicit synthetic structured facts.", required: true, accepted_classifications: ["internal"], accepted_media_types: ["application/json"], max_bytes: 100 });
  value.template.messages[1].parts.push({ type: "text", text: "\nFacts: " }, { type: "context", slot: "context_facts", format: "json" });
  value.governance.evidence = ["https://github.com/DefinitelySecureStudio/studio/issues/67"];
  return value;
}

function reidentify(packageDocument) {
  const document = structuredClone(packageDocument);
  document.manifest.total_content_bytes = document.manifest.sections.reduce((sum, section) => sum + section.byte_size, 0);
  return rehashManifest(document);
}

function rehashManifest(packageDocument) {
  const document = structuredClone(packageDocument);
  const canonical = canonicalJson(document.manifest);
  document.manifest_identity = { canonicalization: "studio-json-v1", byte_size: Buffer.byteLength(canonical), sha256: `sha256:${createHash("sha256").update(canonical).digest("hex")}` };
  return document;
}

function expectCode(code, operation) {
  assert.throws(operation, (error) => {
    assert.ok(error instanceof ContextPackageError);
    assert.equal(error.code, code);
    assert.doesNotMatch(JSON.stringify(error), /PRIVATE-CONTEXT-VALUE/u);
    return true;
  });
}

function expectBindingDiagnostic(code, packageDocument, authorization = createMockContextAuthorization(), prompt = definition(), at = "2026-08-20T12:00:00Z") {
  const validation = validateContextBinding(prompt, packageDocument, authorization, { at });
  assert.equal(validation.valid, false);
  assert.ok(validation.diagnostics.some((entry) => entry.code === code), `${code} was absent from ${validation.diagnostics.map((entry) => entry.code).join(", ")}`);
}

test("validates deterministic mock package and authorization documents", () => {
  const packageDocument = createMockContextPackage();
  const authorization = createMockContextAuthorization();
  assert.equal(validateContextDocument(packageDocument).valid, true);
  assert.equal(validateContextDocument(authorization).valid, true);
  assert.equal(packageDocument.manifest_identity.byte_size, 1427);
  assert.equal(packageDocument.manifest_identity.sha256, "sha256:1c5b3e293a37898c045c4830c116545f52d38e87e40220b1733637b2ef734c2b");
});

test("binds explicit package sections and renders them only at declared placements", () => {
  const result = renderPromptWithContextPackage(definition(), {
    inputValues: { item: "blue cube", attributes: {} },
    packageDocument: createMockContextPackage(), authorization: createMockContextAuthorization(), at: "2026-08-20T12:00:00Z"
  });
  assert.match(result.renderedPrompt.messages[1].content, /Notes: Synthetic approved note\.\nFacts: \{"count":1,"facts":\["synthetic"\]\}$/u);
  assert.equal(result.renderedPrompt.classification, "internal");
  assert.equal(result.renderedPrompt.contexts.length, 2);
  const facts = result.renderedPrompt.contexts.find(({ slot }) => slot === "context_facts");
  assert.equal(facts.package.package.version, "1.0.0");
  assert.equal(facts.package.package.manifest_sha256, "sha256:1c5b3e293a37898c045c4830c116545f52d38e87e40220b1733637b2ef734c2b");
  assert.deepEqual(facts.package.sources, [{ source_id: "source.synthetic.internal", kind: "synthetic", version: "1.0.0", classification: "internal" }]);
  assert.equal(facts.package.authorization.decision_id, "context_auth_reference_0001");
});

test("preserves package provenance through an execution request", () => {
  const rendered = renderPromptWithContextPackage(definition(), {
    inputValues: { item: "cube", attributes: {} }, packageDocument: createMockContextPackage(),
    authorization: createMockContextAuthorization(), at: "2026-08-20T12:00:00Z"
  });
  const request = createExecutionRequest(rendered, {
    execution_id: "exec_context_0001", idempotency_key: "idem_context_0001",
    target: { adapter_id: "studio.mock.text", provider_id: "studio-mock", model_id: "mock-text-v1" },
    capabilities: { required: ["text-generation"], optional: [] }, parameters: {},
    expected_output: { kind: "text", media_type: "text/plain", validation: "none" },
    delegation: { caller_id: "context.test", human_owner: "andrewperis", purpose: "Exercise synthetic Context Package v1 provenance.", authority_reference: "https://github.com/DefinitelySecureStudio/studio/issues/67" },
    observability: { retention: "restricted-content", capture_prompt: false, capture_output: false }
  });
  assert.equal(request.rendered_prompt.contexts[0].package.package.id, "context-package.reference.synthetic");
  assert.equal(request.rendered_prompt.contexts[1].package.sources[0].version, "1.0.0");
});

test("parses and verifies exact detached package artifact references", () => {
  const packageDocument = createMockContextPackage();
  const source = `${JSON.stringify(packageDocument, null, 2)}\n`;
  const reference = {
    spec_version: "1.0.0", kind: "context-package-reference", package: structuredClone(packageDocument.manifest.package),
    artifact: { artifact_uri: "https://artifacts.definitelysecure.studio/context-packages/synthetic/mock.json", media_type: "application/vnd.definitely-secure-studio.context-package+json", byte_size: Buffer.byteLength(source), sha256: `sha256:${createHash("sha256").update(source).digest("hex")}` },
    manifest_identity: structuredClone(packageDocument.manifest_identity)
  };
  const parsed = parseContextPackageJson(source, { reference });
  assert.equal(parsed.report.valid, true);
  assert.equal(parsed.value.manifest.package.instance_id, "ctxpkg_reference_0001");
  reference.artifact.sha256 = `sha256:${"0".repeat(64)}`;
  assert.ok(parseContextPackageJson(source, { reference }).report.diagnostics.some(({ code }) => code === "CONTEXT_ARTIFACT_DIGEST_MISMATCH"));
  assert.equal(parseContextPackageJson(Buffer.from(source), { reference: { ...reference, artifact: { ...reference.artifact, sha256: `sha256:${createHash("sha256").update(source).digest("hex")}` } } }).report.valid, true);
  assert.ok(parseContextPackageJson(Buffer.from([0xef, 0xbb, 0xbf, ...Buffer.from(source)])).report.diagnostics.some(({ code }) => code === "CONTEXT_BOM_NOT_ALLOWED"));
  assert.ok(parseContextPackageJson(Buffer.from([0xc3, 0x28])).report.diagnostics.some(({ code }) => code === "CONTEXT_ENCODING_INVALID"));
});

test("detects manifest, section, source-link, total-size, and classification corruption", () => {
  const cases = [];
  const manifest = createMockContextPackage(); manifest.manifest_identity.sha256 = `sha256:${"0".repeat(64)}`; cases.push([manifest, "MANIFEST_DIGEST_MISMATCH"]);
  const section = createMockContextPackage(); section.manifest.sections[0].content = "PRIVATE-CONTEXT-VALUE"; cases.push([section, "SECTION_SIZE_MISMATCH"]);
  const source = createMockContextPackage(); source.manifest.sections[0].source_ids = ["source.synthetic.missing"]; cases.push([reidentify(source), "CONTEXT_SOURCE_NOT_FOUND"]);
  const total = createMockContextPackage(); total.manifest.total_content_bytes += 1; cases.push([rehashManifest(total), "TOTAL_CONTENT_SIZE_MISMATCH"]);
  const classification = createMockContextPackage(); classification.manifest.classification = "public"; cases.push([reidentify(classification), "PACKAGE_CLASSIFICATION_MISMATCH"]);
  for (const [document, code] of cases) {
    const validation = validateContextDocument(document);
    assert.equal(validation.valid, false);
    assert.ok(validation.diagnostics.some((entry) => entry.code === code));
    assert.doesNotMatch(JSON.stringify(validation), /PRIVATE-CONTEXT-VALUE/u);
  }
});

test("fails required missing, unknown, incompatible, unplaced, and oversized sections", () => {
  const missing = createMockContextPackage(); missing.manifest.sections = missing.manifest.sections.filter(({ slot }) => slot !== "context_facts");
  const missingAuth = createMockContextAuthorization(); missingAuth.sections = ["approved_notes"];
  expectCode("MISSING_REQUIRED_CONTEXT", () => bindContextPackage(definition(), reidentify(missing), missingAuth, { at: "2026-08-20T12:00:00Z" }));

  const unknown = createMockContextPackage(); unknown.manifest.sections[1].slot = "unknown_context";
  const unknownAuth = createMockContextAuthorization(); unknownAuth.sections[1] = "unknown_context";
  expectBindingDiagnostic("UNKNOWN_CONTEXT_PACKAGE_SECTION", reidentify(unknown), unknownAuth);

  const incompatible = definition(); incompatible.context_slots[1].accepted_classifications = ["public"];
  expectCode("CONTEXT_CLASSIFICATION_MISMATCH", () => bindContextPackage(incompatible, createMockContextPackage(), createMockContextAuthorization(), { at: "2026-08-20T12:00:00Z" }));
  const format = definition(); format.template.messages[1].parts.at(-1).format = "text";
  expectCode("CONTEXT_FORMAT_MEDIA_MISMATCH", () => bindContextPackage(format, createMockContextPackage(), createMockContextAuthorization(), { at: "2026-08-20T12:00:00Z" }));
  const unplaced = definition(); unplaced.template.messages[1].parts = unplaced.template.messages[1].parts.filter((part) => part.slot !== "context_facts");
  expectCode("CONTEXT_SECTION_NOT_PLACED", () => bindContextPackage(unplaced, createMockContextPackage(), createMockContextAuthorization(), { at: "2026-08-20T12:00:00Z" }));
  const oversized = definition(); oversized.context_slots[1].max_bytes = 10;
  expectCode("CONTEXT_TOO_LARGE", () => bindContextPackage(oversized, createMockContextPackage(), createMockContextAuthorization(), { at: "2026-08-20T12:00:00Z" }));
});

test("enforces package and authorization time windows from explicit time only", () => {
  const packageDocument = createMockContextPackage();
  const authorization = createMockContextAuthorization();
  expectBindingDiagnostic("CONTEXT_PACKAGE_NOT_YET_VALID", packageDocument, authorization, definition(), "2026-08-19T23:59:59Z");
  expectBindingDiagnostic("CONTEXT_PACKAGE_REVIEW_REQUIRED", packageDocument, authorization, definition(), "2026-08-21T00:00:00Z");
  expectCode("CONTEXT_EVALUATION_TIME_INVALID", () => bindContextPackage(definition(), packageDocument, authorization));
});

test("enforces deny, exact package/prompt/purpose/section scope, and classification ceiling", () => {
  const packageDocument = createMockContextPackage();
  const at = { at: "2026-08-20T12:00:00Z" };
  const deny = createMockContextAuthorization(); deny.decision = "deny"; deny.sections = [];
  expectCode("CONTEXT_AUTHORIZATION_DENIED", () => bindContextPackage(definition(), packageDocument, deny, at));
  const prompt = createMockContextAuthorization(); prompt.prompt.id = "prompt.reference.different";
  expectCode("CONTEXT_AUTHORIZATION_PROMPT_MISMATCH", () => bindContextPackage(definition(), packageDocument, prompt, at));
  const purpose = createMockContextAuthorization(); purpose.purpose = "Different synthetic purpose.";
  expectCode("CONTEXT_AUTHORIZATION_PURPOSE_MISMATCH", () => bindContextPackage(definition(), packageDocument, purpose, at));
  const section = createMockContextAuthorization(); section.sections = ["approved_notes"];
  expectCode("CONTEXT_SECTION_NOT_AUTHORIZED", () => bindContextPackage(definition(), packageDocument, section, at));
  const classification = createMockContextAuthorization(); classification.max_classification = "public";
  expectCode("CONTEXT_AUTHORIZATION_CLASSIFICATION_EXCEEDED", () => bindContextPackage(definition(), packageDocument, classification, at));
});

test("returns structured binding reports and serializable errors without raw content", () => {
  const packageDocument = createMockContextPackage();
  packageDocument.manifest.sections[0].content = "PRIVATE-CONTEXT-VALUE";
  const validation = validateContextBinding(definition(), packageDocument, createMockContextAuthorization(), { at: "2026-08-20T12:00:00Z" });
  assert.equal(validation.valid, false);
  assert.doesNotMatch(JSON.stringify(validation), /PRIVATE-CONTEXT-VALUE/u);
  assert.ok(validation.diagnostics.some(({ code }) => code === "SECTION_SIZE_MISMATCH"));
  assert.throws(() => bindContextPackage(definition(), packageDocument, createMockContextAuthorization(), { at: "2026-08-20T12:00:00Z" }), ContextPackageError);
});
