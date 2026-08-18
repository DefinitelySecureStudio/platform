export class PromptRenderError extends Error {
  constructor(code, message, { path = [], details = {} } = {}) {
    super(message);
    this.name = "PromptRenderError";
    this.code = code;
    this.path = Object.freeze([...path]);
    this.details = Object.freeze({ ...details });
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      path: [...this.path],
      details: { ...this.details }
    };
  }
}

export function fail(code, message, path = [], details = {}) {
  throw new PromptRenderError(code, message, { path, details });
}
