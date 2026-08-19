import { AdapterExecutionError } from "./execution-errors.js";

const DESCRIPTOR = {
  spec_version: "1.0.0",
  kind: "provider-adapter-descriptor",
  adapter: { id: "studio.mock.text", version: "1.0.0" },
  provider: { id: "studio-mock", display_name: "Studio Mock Provider" },
  model: { id: "mock-text-v1", display_name: "Mock Text v1", revision: "synthetic-1" },
  execution_modes: ["synchronous"],
  capabilities: [
    { name: "text-generation", implementation: "native", limits: { max_input_bytes: 1048576, max_output_tokens: 4096, accepted_input_media_types: ["text/plain"], output_media_types: ["text/plain", "application/json"] } },
    { name: "structured-output", implementation: "emulated", limits: { output_media_types: ["application/json"] } },
    { name: "seeded-generation", implementation: "native" }
  ],
  parameters: {
    max_output_tokens: { minimum: 1, maximum: 4096, default: 256 },
    temperature: { minimum: 0, maximum: 2, default: 1 },
    top_p: { minimum: 0.01, maximum: 1, default: 1 },
    stop_sequences: { max_items: 8, max_item_length: 256 },
    seed: { minimum: 0, maximum: 9007199254740991 }
  },
  supported_extensions: ["studio.mock.trace-label"]
};

const clone = (value) => structuredClone(value);

export class MockTextAdapter {
  constructor({ content = "Synthetic mock response.", finish_reason = "stop", usage = { provider_reported: true, input_tokens: 18, output_tokens: 4, total_tokens: 22 }, provider_request_id = "request-mock-0001", warnings = [], delay_ms = 0, error } = {}) {
    this.configuration = { content, finish_reason, usage, provider_request_id, warnings, delay_ms, error };
    this.calls = [];
  }

  async describe() { return clone(DESCRIPTOR); }

  async execute(request, { signal } = {}) {
    this.calls.push(clone(request));
    const { delay_ms: delay, error } = this.configuration;
    if (signal?.aborted) throw new AdapterExecutionError({ category: "cancelled", code: "EXECUTION_CANCELLED", message: "Execution was cancelled.", stage: "adapter" });
    if (delay > 0) await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, delay);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new AdapterExecutionError({ category: "cancelled", code: "EXECUTION_CANCELLED", message: "Execution was cancelled.", stage: "adapter" }));
      }, { once: true });
    });
    if (error) throw error instanceof AdapterExecutionError ? error : new AdapterExecutionError(error);
    return clone({
      content: this.configuration.content,
      finish_reason: this.configuration.finish_reason,
      usage: this.configuration.usage,
      provider_request_id: this.configuration.provider_request_id,
      warnings: this.configuration.warnings
    });
  }
}

export function mockTextAdapterDescriptor() { return clone(DESCRIPTOR); }
