import { createHash } from "node:crypto";
import validateSchema from "./generated/context-package-v1-schema.js";
import { canonicalJson } from "./canonical-json.js";
import { ContextPackageError } from "./context-errors.js";
import { CONTEXT_PACKAGE_CONTRACT, diagnostic, pointer, report } from "./diagnostics.js";
import { parseJsonDocument } from "./parse-json.js";
import { renderPromptWithContextProvenance } from "./render.js";
import { validatePromptDefinition } from "./validate.js";

const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"];

function sha256(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function identity(value) { const canonical = canonicalJson(value); return { byte_size: Buffer.byteLength(canonical, "utf8"), sha256: sha256(canonical) }; }
function rank(value) { return CLASSIFICATIONS.indexOf(value); }
function sameIdentity(left, right) { return left?.id === right?.id && left?.version === right?.version && left?.instance_id === right?.instance_id; }

function keywordCode(keyword) {
  return `CONTEXT_SCHEMA_${keyword.replace(/([a-z])([A-Z])/gu, "$1_$2").replaceAll("-", "_").toUpperCase()}`;
}

function schemaPath(error) {
  const segments = error.instancePath ? error.instancePath.split("/").slice(1).map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~")) : [];
  if (error.keyword === "required") segments.push(error.params.missingProperty);
  if (error.keyword === "additionalProperties") segments.push(error.params.additionalProperty);
  return pointer(segments);
}

function schemaDiagnostics(document) {
  if (validateSchema(document)) return [];
  return (validateSchema.errors ?? []).map((error) => diagnostic("error", keywordCode(error.keyword), `Context Package schema violation: ${error.message}.`, schemaPath(error), { keyword: error.keyword, schema_path: error.schemaPath, ...error.params }));
}

function unique(items, property, path, code, label, diagnostics) {
  const seen = new Map();
  for (const [index, item] of items.entries()) {
    const value = item?.[property];
    if (typeof value !== "string") continue;
    if (seen.has(value)) diagnostics.push(diagnostic("error", code, `Duplicate ${label}: ${value}.`, [...path, index, property], { [property]: value, first_index: seen.get(value) }));
    else seen.set(value, index);
  }
  return seen;
}

function packageDiagnostics(document) {
  const diagnostics = [];
  const manifest = document.manifest;
  if (!manifest || typeof manifest !== "object") return diagnostics;
  try {
    const computed = identity(manifest);
    if (computed.byte_size !== document.manifest_identity?.byte_size) diagnostics.push(diagnostic("error", "MANIFEST_SIZE_MISMATCH", "Manifest canonical byte size does not match manifest_identity.", ["manifest_identity", "byte_size"], { computed_byte_size: computed.byte_size }));
    if (computed.sha256 !== document.manifest_identity?.sha256) diagnostics.push(diagnostic("error", "MANIFEST_DIGEST_MISMATCH", "Manifest canonical digest does not match manifest_identity.", ["manifest_identity", "sha256"]));
  } catch (error) {
    diagnostics.push(diagnostic("error", "MANIFEST_NON_CANONICAL", "Manifest cannot be represented as Studio canonical JSON v1.", ["manifest"], { reason: error.details?.kind ?? "non-json" }));
  }
  const sources = Array.isArray(manifest.sources) ? manifest.sources : [];
  const sections = Array.isArray(manifest.sections) ? manifest.sections : [];
  const sourceIds = unique(sources, "source_id", ["manifest", "sources"], "DUPLICATE_CONTEXT_SOURCE", "context source id", diagnostics);
  unique(sections, "slot", ["manifest", "sections"], "DUPLICATE_CONTEXT_SECTION", "context section slot", diagnostics);
  let total = 0;
  for (const [index, section] of sections.entries()) {
    if (!section || typeof section !== "object") continue;
    let representation;
    try { representation = section.media_type === "text/plain" ? section.content : canonicalJson(section.content); } catch (error) {
      diagnostics.push(diagnostic("error", "SECTION_NON_CANONICAL", "Context section content cannot be represented canonically.", ["manifest", "sections", index, "content"], { reason: error.details?.kind ?? "non-json" }));
      continue;
    }
    if (typeof representation === "string") {
      const bytes = Buffer.byteLength(representation, "utf8");
      const digest = sha256(representation);
      total += bytes;
      if (bytes !== section.byte_size) diagnostics.push(diagnostic("error", "SECTION_SIZE_MISMATCH", "Context section byte size does not match content.", ["manifest", "sections", index, "byte_size"], { slot: section.slot, computed_byte_size: bytes }));
      if (digest !== section.sha256) diagnostics.push(diagnostic("error", "SECTION_DIGEST_MISMATCH", "Context section digest does not match content.", ["manifest", "sections", index, "sha256"], { slot: section.slot }));
    }
    for (const sourceId of section.source_ids ?? []) {
      if (!sourceIds.has(sourceId)) diagnostics.push(diagnostic("error", "CONTEXT_SOURCE_NOT_FOUND", "Context section cites a source absent from the package.", ["manifest", "sections", index, "source_ids"], { slot: section.slot, source_id: sourceId }));
      const sourceIndex = sourceIds.get(sourceId);
      const source = sourceIndex === undefined ? undefined : sources[sourceIndex];
      if (source && rank(section.classification) < rank(source.classification)) diagnostics.push(diagnostic("error", "SECTION_CLASSIFICATION_DOWNGRADE", "Context section classification is lower than a referenced source.", ["manifest", "sections", index, "classification"], { slot: section.slot, source_id: sourceId }));
    }
  }
  if (total !== manifest.total_content_bytes) diagnostics.push(diagnostic("error", "TOTAL_CONTENT_SIZE_MISMATCH", "total_content_bytes does not equal the sum of section byte sizes.", ["manifest", "total_content_bytes"], { computed_byte_size: total }));
  const highest = [...sources, ...sections].reduce((value, item) => Math.max(value, rank(item?.classification)), 0);
  if (rank(manifest.classification) !== highest) diagnostics.push(diagnostic("error", "PACKAGE_CLASSIFICATION_MISMATCH", "Package classification must equal its highest source or section classification.", ["manifest", "classification"], { expected: CLASSIFICATIONS[highest] }));
  const created = Date.parse(manifest.created_at);
  const review = Date.parse(manifest.review_after);
  const expires = Date.parse(manifest.expires_at);
  if ([created, review, expires].every(Number.isFinite) && (created > review || review > expires)) diagnostics.push(diagnostic("error", "PACKAGE_TIME_ORDER_INVALID", "Package time order must satisfy created_at <= review_after <= expires_at.", ["manifest"]));
  return diagnostics;
}

function authorizationDiagnostics(document) {
  const diagnostics = [];
  const decided = Date.parse(document.decided_at);
  const expires = Date.parse(document.expires_at);
  if (Number.isFinite(decided) && Number.isFinite(expires) && decided > expires) diagnostics.push(diagnostic("error", "AUTHORIZATION_TIME_ORDER_INVALID", "Authorization decided_at must not follow expires_at.", ["expires_at"]));
  return diagnostics;
}

function semanticDiagnostics(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) return [];
  if (document.kind === "context-package") return packageDiagnostics(document);
  if (document.kind === "context-authorization") return authorizationDiagnostics(document);
  return [];
}

export function validateContextDocument(document) {
  try { canonicalJson(document); } catch (error) {
    return report([diagnostic("error", "NON_JSON_CONTEXT_DOCUMENT", "Context document must contain only explicit JSON data values.", error.path ?? "", { reason: error.details?.kind ?? "non-json" })], CONTEXT_PACKAGE_CONTRACT);
  }
  return report([...schemaDiagnostics(document), ...semanticDiagnostics(document)], CONTEXT_PACKAGE_CONTRACT);
}

export function parseContextPackageJson(source, { reference } = {}) {
  let bytes;
  if (typeof source === "string") bytes = Buffer.from(source, "utf8");
  else if (source instanceof Uint8Array) bytes = Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  if (!bytes) return { value: undefined, byteSize: undefined, sha256: undefined, report: report([diagnostic("error", "CONTEXT_SOURCE_TYPE", "Context Package JSON must be supplied as a string or byte array.")], CONTEXT_PACKAGE_CONTRACT) };
  const byteSize = bytes.byteLength;
  const digest = sha256(bytes);
  if ((bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) || bytes[0] === 0xff || bytes[0] === 0xfe) return { value: undefined, byteSize, sha256: digest, report: report([diagnostic("error", "CONTEXT_BOM_NOT_ALLOWED", "Context Package JSON must not contain a byte-order mark.")], CONTEXT_PACKAGE_CONTRACT) };
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch {
    return { value: undefined, byteSize, sha256: digest, report: report([diagnostic("error", "CONTEXT_ENCODING_INVALID", "Context Package JSON must be valid UTF-8.")], CONTEXT_PACKAGE_CONTRACT) };
  }
  const parsed = parseJsonDocument(text, { label: "Context Package JSON" });
  const diagnostics = [...parsed.diagnostics];
  if (parsed.value !== undefined) {
    const validation = validateContextDocument(parsed.value);
    diagnostics.push(...validation.diagnostics);
    if (validation.valid && parsed.value.kind !== "context-package") diagnostics.push(diagnostic("error", "CONTEXT_PACKAGE_KIND", "Parsed artifact must be an inline context-package document.", ["kind"]));
  }
  if (reference !== undefined) {
    const validation = validateContextDocument(reference);
    diagnostics.push(...validation.diagnostics.map((entry) => ({ ...entry, path: `/reference${entry.path}` })));
    if (validation.valid && reference.kind !== "context-package-reference") diagnostics.push(diagnostic("error", "CONTEXT_REFERENCE_KIND", "reference must be a context-package-reference document.", ["reference", "kind"]));
    if (validation.valid && reference.kind === "context-package-reference" && parsed.value?.kind === "context-package") {
      if (byteSize !== reference.artifact.byte_size) diagnostics.push(diagnostic("error", "CONTEXT_ARTIFACT_SIZE_MISMATCH", "Serialized package byte size does not match its reference.", ["reference", "artifact", "byte_size"], { computed_byte_size: byteSize }));
      if (digest !== reference.artifact.sha256) diagnostics.push(diagnostic("error", "CONTEXT_ARTIFACT_DIGEST_MISMATCH", "Serialized package digest does not match its reference.", ["reference", "artifact", "sha256"]));
      if (!sameIdentity(parsed.value.manifest?.package, reference.package)) diagnostics.push(diagnostic("error", "CONTEXT_REFERENCE_IDENTITY_MISMATCH", "Package identity does not match its detached reference.", ["reference", "package"]));
      if (parsed.value.manifest_identity?.byte_size !== reference.manifest_identity.byte_size || parsed.value.manifest_identity?.sha256 !== reference.manifest_identity.sha256) diagnostics.push(diagnostic("error", "CONTEXT_REFERENCE_MANIFEST_MISMATCH", "Manifest identity does not match its detached reference.", ["reference", "manifest_identity"]));
    }
  }
  return { value: parsed.value, byteSize, sha256: digest, report: report(diagnostics, CONTEXT_PACKAGE_CONTRACT) };
}

function bindingDiagnostics(definition, packageDocument, authorization, at) {
  const diagnostics = [];
  const definitionValidation = validatePromptDefinition(definition);
  diagnostics.push(...definitionValidation.diagnostics.map((entry) => ({ ...entry, path: `/definition${entry.path}` })));
  const packageValidation = validateContextDocument(packageDocument);
  diagnostics.push(...packageValidation.diagnostics.map((entry) => ({ ...entry, path: `/package${entry.path}` })));
  const authorizationValidation = validateContextDocument(authorization);
  diagnostics.push(...authorizationValidation.diagnostics.map((entry) => ({ ...entry, path: `/authorization${entry.path}` })));
  const atTime = Date.parse(at);
  if (typeof at !== "string" || !Number.isFinite(atTime)) diagnostics.push(diagnostic("error", "CONTEXT_EVALUATION_TIME_INVALID", "Binding requires an explicit RFC 3339 evaluation time.", ["at"]));
  if (!definitionValidation.valid || !packageValidation.valid || !authorizationValidation.valid || !Number.isFinite(atTime)) return diagnostics;
  if (packageDocument.kind !== "context-package") diagnostics.push(diagnostic("error", "CONTEXT_PACKAGE_KIND", "Binding requires an inline context-package document.", ["package", "kind"]));
  if (authorization.kind !== "context-authorization") diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_KIND", "Binding requires a context-authorization document.", ["authorization", "kind"]));
  if (diagnostics.some(({ severity }) => severity === "error")) return diagnostics;
  const manifest = packageDocument.manifest;
  if (authorization.decision !== "allow") diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_DENIED", "Context authorization decision does not allow use.", ["authorization", "decision"], { decision_id: authorization.decision_id }));
  if (!sameIdentity(manifest.package, authorization.package)) diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_PACKAGE_MISMATCH", "Authorization package identity does not match.", ["authorization", "package"]));
  if (authorization.prompt.id !== definition.id || authorization.prompt.version !== definition.version) diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_PROMPT_MISMATCH", "Authorization prompt identity/version does not match.", ["authorization", "prompt"]));
  if (authorization.purpose !== manifest.purpose) diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_PURPOSE_MISMATCH", "Authorization purpose does not match package purpose.", ["authorization", "purpose"]));
  const created = Date.parse(manifest.created_at);
  const review = Date.parse(manifest.review_after);
  const expires = Date.parse(manifest.expires_at);
  if (atTime < created) diagnostics.push(diagnostic("error", "CONTEXT_PACKAGE_NOT_YET_VALID", "Context package evaluation precedes creation.", ["at"]));
  if (atTime >= review) diagnostics.push(diagnostic("error", "CONTEXT_PACKAGE_REVIEW_REQUIRED", "Context package has reached its review boundary.", ["at"]));
  if (atTime >= expires) diagnostics.push(diagnostic("error", "CONTEXT_PACKAGE_EXPIRED", "Context package has expired.", ["at"]));
  if (atTime < Date.parse(authorization.decided_at)) diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_NOT_YET_VALID", "Context authorization decision is not yet valid.", ["at"]));
  if (atTime >= Date.parse(authorization.expires_at)) diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_EXPIRED", "Context authorization has expired.", ["at"]));
  if (rank(manifest.classification) > rank(authorization.max_classification)) diagnostics.push(diagnostic("error", "CONTEXT_AUTHORIZATION_CLASSIFICATION_EXCEEDED", "Package classification exceeds authorization ceiling.", ["authorization", "max_classification"]));
  const slots = new Map((definition.context_slots ?? []).map((slot, index) => [slot.name, { slot, index }]));
  const sections = new Map(manifest.sections.map((section, index) => [section.slot, { section, index }]));
  const placed = new Map();
  for (const [messageIndex, message] of (definition.template?.messages ?? []).entries()) for (const [partIndex, part] of (message.parts ?? []).entries()) if (part.type === "context") {
    const format = part.format ?? "text";
    if (!placed.has(part.slot)) placed.set(part.slot, []);
    placed.get(part.slot).push({ format, messageIndex, partIndex });
  }
  for (const [name, { section, index }] of sections) {
    const declaration = slots.get(name);
    if (!declaration) { diagnostics.push(diagnostic("error", "UNKNOWN_CONTEXT_PACKAGE_SECTION", "Package section is not declared by the prompt.", ["package", "manifest", "sections", index, "slot"], { slot: name })); continue; }
    if (!authorization.sections.includes(name)) diagnostics.push(diagnostic("error", "CONTEXT_SECTION_NOT_AUTHORIZED", "Package section is absent from authorization scope.", ["authorization", "sections"], { slot: name }));
    if (!placed.has(name)) diagnostics.push(diagnostic("error", "CONTEXT_SECTION_NOT_PLACED", "Package section has no explicit template placement.", ["definition", "context_slots", declaration.index, "name"], { slot: name }));
    const expectedFormat = section.media_type === "application/json" ? "json" : "text";
    for (const placement of placed.get(name) ?? []) if (placement.format !== expectedFormat) diagnostics.push(diagnostic("error", "CONTEXT_FORMAT_MEDIA_MISMATCH", "Template context format does not match package section media type.", ["definition", "template", "messages", placement.messageIndex, "parts", placement.partIndex, "format"], { slot: name, media_type: section.media_type }));
    const accepted = declaration.slot.accepted_media_types ?? ["text/plain"];
    if (!declaration.slot.accepted_classifications.includes(section.classification)) diagnostics.push(diagnostic("error", "CONTEXT_CLASSIFICATION_MISMATCH", "Package section classification is not accepted by the prompt slot.", ["package", "manifest", "sections", index, "classification"], { slot: name }));
    if (!accepted.includes(section.media_type)) diagnostics.push(diagnostic("error", "CONTEXT_MEDIA_TYPE_MISMATCH", "Package section media type is not accepted by the prompt slot.", ["package", "manifest", "sections", index, "media_type"], { slot: name, media_type: section.media_type }));
    if (declaration.slot.max_bytes !== undefined && section.byte_size > declaration.slot.max_bytes) diagnostics.push(diagnostic("error", "CONTEXT_TOO_LARGE", "Package section exceeds the prompt slot byte limit.", ["package", "manifest", "sections", index, "byte_size"], { slot: name, byte_size: section.byte_size, max_bytes: declaration.slot.max_bytes }));
  }
  for (const [name, { slot, index }] of slots) if (slot.required && !sections.has(name)) diagnostics.push(diagnostic("error", "MISSING_REQUIRED_CONTEXT", "Required context package section is missing.", ["definition", "context_slots", index, "name"], { slot: name }));
  for (const [index, name] of authorization.sections.entries()) if (!sections.has(name)) diagnostics.push(diagnostic("error", "AUTHORIZATION_UNKNOWN_SECTION", "Authorization names a section absent from the package.", ["authorization", "sections", index], { slot: name }));
  return diagnostics;
}

export function validateContextBinding(definition, packageDocument, authorization, { at } = {}) {
  return report(bindingDiagnostics(definition, packageDocument, authorization, at), CONTEXT_PACKAGE_CONTRACT);
}

export function bindContextPackage(definition, packageDocument, authorization, { at } = {}) {
  const validation = validateContextBinding(definition, packageDocument, authorization, { at });
  if (!validation.valid) {
    const first = validation.diagnostics.find(({ severity }) => severity === "error");
    throw new ContextPackageError(first.code, first.message, validation);
  }
  const manifest = packageDocument.manifest;
  const sources = new Map(manifest.sources.map((source) => [source.source_id, source]));
  const contextValues = {};
  const provenance = new Map();
  for (const section of manifest.sections) {
    contextValues[section.slot] = {
      value: structuredClone(section.content), classification: section.classification,
      media_type: section.media_type,
      reference: `context-package:${manifest.package.id}@${manifest.package.version}:${manifest.package.instance_id}/${section.slot}`
    };
    provenance.set(section.slot, {
      package: { id: manifest.package.id, version: manifest.package.version, instance_id: manifest.package.instance_id, manifest_sha256: packageDocument.manifest_identity.sha256 },
      section: { sha256: section.sha256, source_ids: [...section.source_ids] },
      sources: section.source_ids.map((sourceId) => { const source = sources.get(sourceId); return { source_id: source.source_id, kind: source.kind, version: source.version, classification: source.classification }; }),
      authorization: { decision_id: authorization.decision_id, authority_reference: authorization.authority_reference }
    });
  }
  return Object.freeze({ contextValues: Object.freeze(contextValues), provenance });
}

export function renderPromptWithContextPackage(definition, { inputValues = {}, packageDocument, authorization, at } = {}) {
  const bound = bindContextPackage(definition, packageDocument, authorization, { at });
  return renderPromptWithContextProvenance(definition, { inputValues, contextValues: bound.contextValues }, bound.provenance);
}
