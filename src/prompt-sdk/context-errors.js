export class ContextPackageError extends Error {
  constructor(code, message, report) {
    super(message);
    this.name = "ContextPackageError";
    this.code = code;
    this.report = report;
  }

  toJSON() {
    return { name: this.name, code: this.code, message: this.message, report: this.report };
  }
}
