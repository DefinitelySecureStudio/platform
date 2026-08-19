const RETRYABLE_CATEGORIES = new Set(["rate-limit", "timeout", "provider-unavailable", "transport", "invalid-provider-response"]);

export class ExecutionValidationError extends Error {
  constructor(message, report, code = "INVALID_EXECUTION_DOCUMENT") {
    super(message);
    this.name = "ExecutionValidationError";
    this.code = code;
    this.report = report;
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, report: this.report };
  }
}

export class AdapterExecutionError extends Error {
  constructor({ category, code, message, retryable = false, stage = "adapter", retry_after_ms, provider } = {}) {
    super(message ?? "Provider execution failed.");
    this.name = "AdapterExecutionError";
    this.executionError = Object.freeze({
      category: category ?? "internal",
      code: code ?? "ADAPTER_EXECUTION_FAILED",
      message: this.message,
      retryable: Boolean(retryable),
      stage,
      ...(retry_after_ms === undefined ? {} : { retry_after_ms }),
      ...(provider === undefined ? {} : { provider: { ...provider } })
    });
    if (this.executionError.retryable && !RETRYABLE_CATEGORIES.has(this.executionError.category)) {
      throw new TypeError(`Error category is not retryable: ${this.executionError.category}.`);
    }
    if (retry_after_ms !== undefined && !this.executionError.retryable) throw new TypeError("retry_after_ms requires retryable true.");
  }

  toJSON() {
    return { name: this.name, ...this.executionError };
  }
}
