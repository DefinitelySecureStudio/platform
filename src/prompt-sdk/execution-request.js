import { ExecutionValidationError } from "./execution-errors.js";
import { validateExecutionDocument } from "./validate-execution.js";

export function createExecutionRequest(renderResult, options) {
  if (!renderResult?.renderedPrompt || !options) throw new TypeError("A render result and explicit execution options are required.");
  const request = {
    spec_version: "1.0.0",
    kind: "execution-request",
    execution_id: options.execution_id,
    ...(options.correlation_id === undefined ? {} : { correlation_id: options.correlation_id }),
    idempotency_key: options.idempotency_key,
    rendered_prompt: {
      ...renderResult.renderedPrompt,
      byte_size: renderResult.byteSize,
      sha256: renderResult.sha256
    },
    target: options.target,
    capabilities: options.capabilities,
    parameters: options.parameters ?? {},
    expected_output: options.expected_output,
    ...(options.timeout_ms === undefined ? {} : { timeout_ms: options.timeout_ms }),
    ...(options.cancellation_id === undefined ? {} : { cancellation_id: options.cancellation_id }),
    delegation: options.delegation,
    observability: options.observability,
    ...(options.extensions === undefined ? {} : { extensions: options.extensions })
  };
  const validation = validateExecutionDocument(request);
  if (!validation.valid) throw new ExecutionValidationError("Execution request does not satisfy the provider-neutral contract.", validation);
  return Object.freeze(request);
}
