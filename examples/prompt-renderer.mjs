import { renderPrompt } from "../src/prompt-sdk/index.js";

const definition = {
  spec_version: "1.0.0",
  id: "prompt.example.greet-public-name",
  version: "1.0.0",
  name: "Greet a public name",
  description: "Synthetic rendering example.",
  purpose: "Demonstrate explicit provider-neutral rendering; it does not authorize publication.",
  owners: ["@andrewperis"],
  lifecycle: { status: "draft" },
  inputs: [
    { name: "name", description: "Synthetic display name.", type: "string", required: true, classification: "public" }
  ],
  context_slots: [],
  template: {
    format: "studio-messages-v1",
    messages: [
      { role: "user", parts: [{ type: "text", text: "Greet " }, { type: "input", name: "name" }] }
    ]
  },
  capabilities: { required: ["text-generation"], optional: [] },
  output: { kind: "text", media_type: "text/plain", description: "A synthetic greeting for human review." },
  provenance: {
    origin: "studio-original",
    created_by: "@andrewperis",
    created_at: "2026-08-17T00:00:00Z",
    source_references: [],
    rights: { basis: "studio-original", reviewed_by: "@andrewperis", reviewed_at: "2026-08-17T00:00:00Z", notices: [] }
  },
  governance: {
    constitution: { version: "1.0.0", tag: "constitution/v1.0.0", commit: "a9cc8a503aa30e17820edc62ac95f7cbe10e0564" },
    decision_owner: "@andrewperis",
    evidence: ["https://github.com/DefinitelySecureStudio/studio/issues/63"]
  }
};

const result = renderPrompt(definition, { inputValues: { name: "Avery" } });
console.log(result.renderedPrompt.messages);
console.log(result.sha256);
