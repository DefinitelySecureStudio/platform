import { RELEASE_CONTRACTS } from './release-contracts.js';
export const CONTRACT = RELEASE_CONTRACTS['prompt-definition'];
export const PROMPT_DEFINITION_CONTRACT = CONTRACT;
export const EXECUTION_CONTRACT = RELEASE_CONTRACTS['provider-execution'];
export const CONTEXT_PACKAGE_CONTRACT = RELEASE_CONTRACTS['context-package'];
export const STRUCTURED_OUTPUT_CONTRACT = RELEASE_CONTRACTS['structured-output'];

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
