import { createHash } from "node:crypto";
import { AdapterExecutionError, ExecutionValidationError } from "./execution-errors.js";
import { validateExecutionCompatibility, validateExecutionDocument, validateExecutionResult } from "./validate-execution.js";

function identity(descriptor, request) {
  return descriptor ? {
    adapter_id: descriptor.adapter.id,
    adapter_version: descriptor.adapter.version,
    provider_id: descriptor.provider.id,
    model_id: descriptor.model.id,
    ...(descriptor.model.revision === undefined ? {} : { model_revision: descriptor.model.revision })
  } : {
    adapter_id: request.target.adapter_id,
    adapter_version: "0.0.0",
    provider_id: request.target.provider_id,
    model_id: request.target.model_id
  };
}

function timing(started, completed) {
  return { started_at: new Date(started).toISOString(), completed_at: new Date(completed).toISOString(), duration_ms: Math.max(0, completed - started) };
}

function warning(entry) {
  return { code: entry.code, message: entry.message, ...(Object.keys(entry.details ?? {}).length ? { details: entry.details } : {}) };
}

function failure(request, descriptor, started, completed, error, warnings = []) {
  const status = error.category === "cancelled" ? "cancelled" : error.category === "timeout" ? "timed-out" : "failed";
  const result = {
    spec_version: "1.0.0", kind: "execution-result", execution_id: request.execution_id,
    ...(request.correlation_id === undefined ? {} : { correlation_id: request.correlation_id }),
    status, identity: identity(descriptor, request), timing: timing(started, completed),
    finish_reason: status === "cancelled" ? "cancelled" : "error", warnings, error
  };
  if (validateExecutionDocument(result).valid) return result;
  return {
    ...result, status: "failed", finish_reason: "error",
    error: { category: "invalid-provider-response", code: "INVALID_NORMALIZED_ERROR", message: "The adapter error could not be normalized safely.", retryable: true, stage: "normalization" }
  };
}

function compatibilityError() {
  return {
    category: "capability-mismatch", code: "EXECUTION_PREFLIGHT_REJECTED",
    message: "The adapter cannot satisfy the execution request.", retryable: false, stage: "preflight"
  };
}

function normalizeThrown(error) {
  if (error instanceof AdapterExecutionError) return error.executionError;
  return { category: "internal", code: "ADAPTER_UNEXPECTED_ERROR", message: "The adapter failed without a normalized error.", retryable: false, stage: "adapter" };
}

export async function executePrompt(request, { adapter, signal, clock = Date.now } = {}) {
  if (!adapter || typeof adapter.describe !== "function" || typeof adapter.execute !== "function") throw new TypeError("adapter must implement describe() and execute().");
  const requestValidation = validateExecutionDocument(request);
  if (!requestValidation.valid) throw new ExecutionValidationError("Execution request does not satisfy the provider-neutral contract.", requestValidation);
  const started = clock();
  let descriptor;
  try { descriptor = await adapter.describe(); } catch {
    return failure(request, undefined, started, clock(), { category: "internal", code: "ADAPTER_DESCRIPTION_FAILED", message: "The adapter descriptor could not be loaded.", retryable: false, stage: "preflight" });
  }
  const descriptorValidation = validateExecutionDocument(descriptor);
  if (!descriptorValidation.valid) return failure(request, undefined, started, clock(), { category: "invalid-provider-response", code: "INVALID_ADAPTER_DESCRIPTOR", message: "The adapter descriptor is invalid.", retryable: true, stage: "preflight" });
  const compatibility = validateExecutionCompatibility(request, descriptor);
  const preflightWarnings = compatibility.diagnostics.filter(({ severity }) => severity === "warning").map(warning);
  if (!compatibility.valid) return failure(request, descriptor, started, clock(), compatibilityError(), preflightWarnings);
  if (signal?.aborted) return failure(request, descriptor, started, clock(), { category: "cancelled", code: "EXECUTION_CANCELLED", message: "Execution was cancelled before provider invocation.", retryable: false, stage: "preflight" }, preflightWarnings);

  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  let timeout;
  let timedOut = false;
  if (request.timeout_ms !== undefined) timeout = setTimeout(() => { timedOut = true; controller.abort(new Error("timeout")); }, request.timeout_ms);
  const effectiveRequest = { ...request, parameters: compatibility.effectiveParameters };
  try {
    const aborted = new Promise((resolve) => controller.signal.addEventListener("abort", () => resolve({ aborted: true }), { once: true }));
    const invocation = Promise.resolve().then(() => adapter.execute(effectiveRequest, { signal: controller.signal })).then(
      (outcome) => ({ outcome }),
      (error) => ({ error })
    );
    const settled = await Promise.race([invocation, aborted]);
    const completed = clock();
    if (timedOut) return failure(request, descriptor, started, completed, { category: "timeout", code: "EXECUTION_TIMEOUT", message: "Execution exceeded its timeout.", retryable: true, stage: "transport" }, preflightWarnings);
    if (signal?.aborted) return failure(request, descriptor, started, completed, { category: "cancelled", code: "EXECUTION_CANCELLED", message: "Execution was cancelled.", retryable: false, stage: "transport" }, preflightWarnings);
    if (settled.error) throw settled.error;
    const { outcome } = settled;
    if (!outcome || typeof outcome.content !== "string") return failure(request, descriptor, started, completed, { category: "invalid-provider-response", code: "INVALID_ADAPTER_OUTCOME", message: "The adapter returned an invalid outcome.", retryable: true, stage: "normalization" }, preflightWarnings);
    const output = {
      kind: request.expected_output.kind, media_type: request.expected_output.media_type, delivery: "inline",
      classification: request.rendered_prompt.classification, byte_size: Buffer.byteLength(outcome.content, "utf8"),
      sha256: `sha256:${createHash("sha256").update(outcome.content, "utf8").digest("hex")}`, content: outcome.content
    };
    const result = {
      spec_version: "1.0.0", kind: "execution-result", execution_id: request.execution_id,
      ...(request.correlation_id === undefined ? {} : { correlation_id: request.correlation_id }),
      ...(outcome.provider_request_id === undefined ? {} : { provider_request_id: outcome.provider_request_id }),
      status: "succeeded", identity: identity(descriptor, request), timing: timing(started, completed),
      finish_reason: outcome.finish_reason ?? "unknown", ...(outcome.usage === undefined ? {} : { usage: outcome.usage }),
      warnings: [...preflightWarnings, ...(outcome.warnings ?? [])], output
    };
    const resultValidation = validateExecutionResult(result, { request, descriptor });
    if (!resultValidation.valid) return failure(request, descriptor, started, completed, { category: "invalid-provider-response", code: "INVALID_NORMALIZED_RESULT", message: "The adapter outcome could not be normalized safely.", retryable: true, stage: "normalization" }, preflightWarnings);
    return result;
  } catch (error) {
    const normalized = timedOut
      ? { category: "timeout", code: "EXECUTION_TIMEOUT", message: "Execution exceeded its timeout.", retryable: true, stage: "transport" }
      : signal?.aborted
        ? { category: "cancelled", code: "EXECUTION_CANCELLED", message: "Execution was cancelled.", retryable: false, stage: "transport" }
        : normalizeThrown(error);
    return failure(request, descriptor, started, clock(), normalized, preflightWarnings);
  } finally {
    if (timeout) clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
