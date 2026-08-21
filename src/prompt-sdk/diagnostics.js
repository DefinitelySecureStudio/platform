export const CONTRACT = Object.freeze({
  repository: "DefinitelySecureStudio/codex",
  commit: "bd31b6249e068d3317306afb857d68024f2929be",
  spec_version: "1.0.0",
  schema_sha256: "sha256:6ac345956582d25c2db9c81b85cab9c73b2cbcfc79b8aac7a43d847c07173cb9",
  schema_byte_size: 18384,
  status: "provisional-unreleased"
});

export const PROMPT_DEFINITION_CONTRACT = CONTRACT;

export const EXECUTION_CONTRACT = Object.freeze({
  repository: "DefinitelySecureStudio/codex",
  commit: "dfd31a693674dc03dec4784dcdd1345f647cff1e",
  spec_version: "1.0.0",
  schema_sha256: "sha256:4366665b89d7633974c4be15cac74f754e722b41031f708ca2f825ead892cb8b",
  schema_byte_size: 25285,
  status: "provisional-unreleased"
});

export const CONTEXT_PACKAGE_CONTRACT = Object.freeze({
  repository: "DefinitelySecureStudio/codex",
  commit: "dfd31a693674dc03dec4784dcdd1345f647cff1e",
  spec_version: "1.0.0",
  schema_sha256: "sha256:a0915675a2036c8f929c53a212fcd14740e12fda0ef643fe13d727f0d62e9509",
  schema_byte_size: 8409,
  status: "provisional-unreleased"
});

export const STRUCTURED_OUTPUT_CONTRACT = Object.freeze({
  repository: "DefinitelySecureStudio/codex",
  commit: "275e0cda2e699fbcb1cdd56323a4d58e3f65e507",
  spec_version: "1.0.0",
  schema_sha256: "sha256:6ea2c5d4804b92bbca386d2b64063d72980ca1d294d23338be6adc057caaeeb2",
  schema_byte_size: 8427,
  status: "provisional-unreleased"
});

export function pointer(segments) {
  if (typeof segments === "string") return segments || "";
  return segments.length ? `/${segments.map((segment) => String(segment).replaceAll("~", "~0").replaceAll("/", "~1")).join("/")}` : "";
}

export function diagnostic(severity, code, message, path = "", details = {}) {
  return { severity, code, message, path: pointer(path), details };
}

export function sortDiagnostics(diagnostics) {
  const rank = { error: 0, warning: 1 };
  return diagnostics.sort((left, right) =>
    rank[left.severity] - rank[right.severity]
    || left.path.localeCompare(right.path)
    || left.code.localeCompare(right.code)
    || left.message.localeCompare(right.message));
}

export function report(diagnostics, contract = CONTRACT) {
  const sorted = sortDiagnostics(diagnostics);
  const errors = sorted.filter(({ severity }) => severity === "error").length;
  const warnings = sorted.length - errors;
  return {
    valid: errors === 0,
    contract,
    summary: { errors, warnings },
    diagnostics: sorted
  };
}
