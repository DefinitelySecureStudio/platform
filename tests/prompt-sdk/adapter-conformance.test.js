import { readFile } from 'node:fs/promises';
import { adapterConformance } from '../support/adapter-conformance.js';
import { MockTextAdapter, mockTextAdapterDescriptor, renderPrompt, createExecutionRequest } from '../../src/prompt-sdk/index.js';
const definition = JSON.parse(await readFile(new URL('../../examples/cli/prompt.json', import.meta.url)));
const options = JSON.parse(await readFile(new URL('../../examples/cli/execution-options.json', import.meta.url)));
function request(descriptor) {
  return structuredClone(createExecutionRequest(renderPrompt(definition, { inputValues: { item: 'synthetic cube', attributes: {} } }), {
    ...options, target: { adapter_id: descriptor.adapter.id, provider_id: descriptor.provider.id, model_id: descriptor.model.id }
  }));
}
adapterConformance('MockTextAdapter', async mode => {
  const adapter = new MockTextAdapter({ delay_ms: mode === 'slow' ? 30 : 0, content: mode === 'invalid' ? null : 'Synthetic output.' });
  if (mode === 'error') adapter.execute = async function(input) { this.calls.push(input); throw new Error('CONFORMANCE_SECRET'); };
  return { adapter, request: request(await adapter.describe()), calls: () => adapter.calls.length };
});
adapterConformance('Independent fake adapter', async mode => {
  const descriptor = mockTextAdapterDescriptor();
  descriptor.adapter.id = 'studio.conformance.fake';
  let count = 0;
  const adapter = {
    async describe() { return structuredClone(descriptor); },
    async execute() {
      count++;
      if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 30));
      if (mode === 'error') throw new Error('CONFORMANCE_SECRET');
      if (mode === 'invalid') return {};
      return { content: 'Independent synthetic output.', finish_reason: 'stop', usage: { provider_reported: false } };
    }
  };
  return { adapter, request: request(descriptor), calls: () => count };
});
