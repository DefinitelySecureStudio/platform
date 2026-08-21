export class StructuredOutputError extends Error {
  constructor(code, message, report, failure) {
    super(message);
    this.name = "StructuredOutputError";
    this.code = code;
    this.report = report;
    if (failure !== undefined) this.failure = failure;
  }

  toJSON() {
    const failure = this.failure === undefined ? undefined : {
      ...this.failure,
      raw: { ...this.failure.raw, retention: "identity-only", content: undefined, reference: undefined }
    };
    if (failure) {
      delete failure.raw.content;
      delete failure.raw.reference;
    }
    return { name: this.name, code: this.code, message: this.message, report: this.report, ...(failure === undefined ? {} : { failure }) };
  }
}
