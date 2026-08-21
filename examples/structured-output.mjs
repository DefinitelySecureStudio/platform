import { readFile } from "node:fs/promises";
import {
  MockTextAdapter, createExecutionRequest, executePrompt,
  processStructuredOutput, renderPrompt
} from "../src/prompt-sdk/index.js";

const definition = JSON.parse(await readFile(new URL("../tests/fixtures/prompt-definition.json", import.meta.url), "utf8"));
const schemaSource = await readFile(new URL("../tests/fixtures/structured-output/reference-facts.schema.json", import.meta.url), "utf8");
const rendered = renderPrompt(definition, { inputValues: { item: "blue cube", attributes: {} } });
const request = createExecutionRequest(rendered, {
  execution_id: "exec_structured_example_0001", idempotency_key: "idem_structured_example_0001",
  target: { adapter_id: "studio.mock.text", provider_id: "studio-mock", model_id: "mock-text-v1" },
  capabilities: { required: ["text-generation", "structured-output"], optional: [] }, parameters: {},
  expected_output: {
    kind: "json", media_type: "application/json", validation: "json-schema",
    schema: {
      schema_id: "urn:definitely-secure:contract:reference-facts:1.0.0:result",
      repository: "DefinitelySecureStudio/codex", contract: "reference-facts", version: "1.0.0",
      tag: "contract/reference-facts/v1.0.0", commit: "2222222222222222222222222222222222222222",
      artifact_uri: "https://example.invalid/definitely-secure/contracts/reference-facts-v1.0.0.json",
      media_type: "application/schema+json", byte_size: Buffer.byteLength(schemaSource),
      sha256: "sha256:35381afb0b74539ba760c79711751ff138c79543ef6139bed3d5c2e9db164c8d"
    }
  },
  delegation: { caller_id: "structured.example", human_owner: "andrewperis", purpose: "Run a synthetic structured-output example.", authority_reference: "https://github.com/DefinitelySecureStudio/studio/issues/68" },
  observability: { retention: "metadata-only", capture_prompt: false, capture_output: false }
});
const execution = await executePrompt(request, { adapter: new MockTextAdapter({ content: '{"facts":[{"field":"color","value":"blue"}],"unknown_fields":[]}' }) });
const structured = processStructuredOutput(request, execution, {
  processing_id: "structured_example_0001", rawRetention: "identity-only",
  providerConstraintMode: "adapter-emulated", schemaSource
});

console.log(JSON.stringify(structured, null, 2));
