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
  commit: "8cf6297b5180ca201328f45681417c10771e4e1a",
  spec_version: "1.0.0",
  schema_sha256: "sha256:7c0aaa6698c782e54779a0099cf13f8e163aa9559ae4765df58d3061b22e6334",
  schema_byte_size: 23168,
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
