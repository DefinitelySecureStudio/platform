import { readFile } from 'node:fs/promises';
import { renderPrompt, createExecutionRequest, executePrompt, MockTextAdapter, LocalExecutionObserver } from '../src/prompt-sdk/index.js';

const definition = JSON.parse(await readFile(new URL('../tests/fixtures/prompt-definition.json', import.meta.url)));
const request = createExecutionRequest(renderPrompt(definition, { inputValues: { item: 'blue cube', attributes: {} } }), {
  execution_id: 'exec_provenance_example', correlation_id: 'build_example', idempotency_key: 'idem_example',
  target: { adapter_id: 'studio.mock.text', provider_id: 'studio-mock', model_id: 'mock-text-v1' },
  capabilities: { required: ['text-generation'], optional: [] }, parameters: {},
  expected_output: { kind: 'text', media_type: 'text/plain', validation: 'none' },
  delegation: { caller_id: 'example', human_owner: 'andrewperis', purpose: 'Synthetic provenance example.', authority_reference: 'https://github.com/DefinitelySecureStudio/studio/issues/69' },
  observability: { retention: 'metadata-only', capture_prompt: false, capture_output: false }
});
const observer = new LocalExecutionObserver();
await executePrompt(request, { adapter: new MockTextAdapter(), observer, clock: () => 0 });
console.log(JSON.stringify(observer.snapshot()[0], null, 2));
