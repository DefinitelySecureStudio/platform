export class PromptRegistryError extends Error {
  constructor(code, message, { details = {}, diagnostics = [] } = {}) {
    super(message);
    this.name = "PromptRegistryError";
    this.code = code;
    this.details = Object.freeze({ ...details });
    this.diagnostics = Object.freeze(diagnostics.map((entry) => Object.freeze({ ...entry })));
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: { ...this.details },
      diagnostics: this.diagnostics.map((entry) => ({ ...entry }))
    };
  }
}

export function registryFail(code, message, details = {}, diagnostics = []) {
  throw new PromptRegistryError(code, message, { details, diagnostics });
}
