# Provider-neutral model execution

The Prompt SDK executes a rendered prompt through an adapter without importing
or depending on a provider SDK. The public boundary is the Codex Provider
Execution v1 contract: requests declare portable requirements and explicit
provider extensions, descriptors advertise support, and results preserve the
exact adapter, provider, model, timing, usage, finish, output, and error
identity observed for one synchronous call.

```js
import {
  createExecutionRequest,
  executePrompt,
  MockTextAdapter,
  renderPrompt
} from "@definitely-secure-studio/platform/prompt-sdk";

const rendered = renderPrompt(definition, { inputValues });
const request = createExecutionRequest(rendered, {
  execution_id: "exec_example_0001",
  idempotency_key: "idem_example_0001",
  target: {
    adapter_id: "studio.mock.text",
    provider_id: "studio-mock",
    model_id: "mock-text-v1"
  },
  capabilities: { required: ["text-generation"], optional: [] },
  parameters: { max_output_tokens: 128 },
  expected_output: { kind: "text", media_type: "text/plain", validation: "none" },
  delegation: {
    caller_id: "example.runner",
    human_owner: "accountable-owner",
    purpose: "Run a synthetic local example.",
    authority_reference: "https://example.invalid/authority/example"
  },
  observability: { retention: "metadata-only", capture_prompt: false, capture_output: false }
});

const result = await executePrompt(request, { adapter: new MockTextAdapter() });
```

## Adapter interface

An adapter implements two asynchronous methods:

- `describe()` returns a `provider-adapter-descriptor`.
- `execute(request, { signal })` performs at most one provider call and returns
  `{ content, finish_reason, usage?, warnings?, provider_request_id? }`, or
  throws `AdapterExecutionError` with normalized safe fields.

The executor validates both request and descriptor before invocation. Required
capabilities, target identity, portable parameter ranges, output media type,
and extensions are negotiated explicitly. Descriptor defaults are materialized
only in the effective request passed to the adapter; the caller's request is
unchanged. Optional omissions and emulation remain visible as warnings.

There is no implicit routing, parameter clamping, repair, authority expansion,
or retry. Timeout and caller cancellation abort the adapter signal and settle
the execution even if an adapter ignores it. A retryable result is guidance to
the caller, not permission for the executor to repeat a call.

Malformed caller requests raise `ExecutionValidationError`. Preflight mismatch,
provider failure, timeout, cancellation, invalid provider output, and unexpected
adapter exceptions return contract-shaped failures. Unexpected exception text
is not exposed. Adapters must not place credentials, provider response bodies,
or supplied prompt values in normalized errors or warnings.

`MockTextAdapter` is deterministic, provider-free, and intended for unit and
integration testing. It supports configured outcomes, normalized failures,
delay, cancellation, and call inspection without network access.

Provider Execution v1 is pinned to an accepted provisional Codex commit and is
release-blocking until Studio issue #72 publishes its immutable artifact tuple.
