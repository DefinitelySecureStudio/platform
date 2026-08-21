import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical-json.js";

function identity(value) {
  const canonical = canonicalJson(value);
  return { canonicalization: "studio-json-v1", byte_size: Buffer.byteLength(canonical, "utf8"), sha256: `sha256:${createHash("sha256").update(canonical).digest("hex")}` };
}

function sectionIdentity(content, mediaType) {
  const representation = mediaType === "text/plain" ? content : canonicalJson(content);
  return { byte_size: Buffer.byteLength(representation, "utf8"), sha256: `sha256:${createHash("sha256").update(representation).digest("hex")}` };
}

export function createMockContextPackage() {
  const text = "Synthetic approved note.";
  const facts = { count: 1, facts: ["synthetic"] };
  const textIdentity = sectionIdentity(text, "text/plain");
  const factsIdentity = sectionIdentity(facts, "application/json");
  const manifest = {
    package: { id: "context-package.reference.synthetic", version: "1.0.0", instance_id: "ctxpkg_reference_0001" },
    builder: { id: "studio.mock.context-builder", version: "1.0.0" },
    created_at: "2026-08-20T00:00:00Z", review_after: "2026-08-21T00:00:00Z", expires_at: "2026-08-22T00:00:00Z",
    purpose: "Render synthetic approved context for issue #67 integration testing.",
    authority_reference: "https://github.com/DefinitelySecureStudio/studio/issues/67",
    classification: "internal", total_content_bytes: textIdentity.byte_size + factsIdentity.byte_size,
    sources: [
      { source_id: "source.synthetic.public", kind: "synthetic", version: "1.0.0", classification: "public", evidence_reference: "https://github.com/DefinitelySecureStudio/studio/issues/67" },
      { source_id: "source.synthetic.internal", kind: "synthetic", version: "1.0.0", classification: "internal", evidence_reference: "https://github.com/DefinitelySecureStudio/studio/issues/67" }
    ],
    sections: [
      { slot: "approved_notes", classification: "public", media_type: "text/plain", content: text, ...textIdentity, source_ids: ["source.synthetic.public"] },
      { slot: "context_facts", classification: "internal", media_type: "application/json", content: facts, ...factsIdentity, source_ids: ["source.synthetic.internal"] }
    ]
  };
  return { spec_version: "1.0.0", kind: "context-package", manifest, manifest_identity: identity(manifest) };
}

export function createMockContextAuthorization({ promptId = "prompt.reference.context-package", promptVersion = "1.0.0" } = {}) {
  return {
    spec_version: "1.0.0", kind: "context-authorization", decision_id: "context_auth_reference_0001", decision: "allow",
    package: { id: "context-package.reference.synthetic", version: "1.0.0", instance_id: "ctxpkg_reference_0001" },
    prompt: { id: promptId, version: promptVersion }, sections: ["approved_notes", "context_facts"], max_classification: "internal",
    purpose: "Render synthetic approved context for issue #67 integration testing.", decided_by: "@andrewperis",
    decided_at: "2026-08-20T00:00:00Z", expires_at: "2026-08-21T00:00:00Z",
    authority_reference: "https://github.com/DefinitelySecureStudio/studio/issues/67"
  };
}
