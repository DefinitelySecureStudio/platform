import { readFile } from "node:fs/promises";
import { createMockContextAuthorization, createMockContextPackage,
  renderPromptWithContextPackage } from "../src/prompt-sdk/index.js";

const definition = JSON.parse(await readFile(new URL("../tests/fixtures/prompt-definition.json", import.meta.url), "utf8"));
definition.id = "prompt.reference.context-package";
definition.template.messages[0].parts[0].text = "Describe the item using supplied context.";
definition.context_slots[0].required = true;
definition.context_slots.push({ name: "context_facts", description: "Synthetic facts.", required: true, accepted_classifications: ["internal"], accepted_media_types: ["application/json"], max_bytes: 100 });
definition.template.messages[1].parts.push({ type: "text", text: "\nFacts: " }, { type: "context", slot: "context_facts", format: "json" });

const result = renderPromptWithContextPackage(definition, {
  inputValues: { item: "blue cube", attributes: {} },
  packageDocument: createMockContextPackage(),
  authorization: createMockContextAuthorization(),
  at: "2026-08-20T12:00:00Z"
});

console.log(JSON.stringify({ renderedPrompt: result.renderedPrompt, sha256: result.sha256 }, null, 2));
