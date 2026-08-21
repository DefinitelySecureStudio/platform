# ADR 0006: Independent structured-output validation

- Status: Accepted by merge
- Date: 2026-08-20
- Decision owner: `@andrewperis`
- Issue: [DefinitelySecureStudio/studio#68](https://github.com/DefinitelySecureStudio/studio/issues/68)

## Context

Callers need machine-readable model results without treating provider JSON mode
as proof of validity or losing exact raw-response identity. Schema retrieval,
provider SDK types, repair, and raw retention also cross different trust and
policy boundaries.

## Decision

Process only successful Provider Execution JSON results. Verify raw identity and
caller-supplied immutable schema bytes, parse once with duplicate-key evidence,
validate independently under JSON Schema Draft 2020-12 with no remote loading,
and produce a distinct canonical normalized value or explicit contract-shaped
failure. Require explicit policy-compatible raw retention.

Record provider-native/emulated constraint use as adapter provenance only. Do
not fetch schemas, repair/coerce/default output, retry providers, or let native
constraint claims skip core validation.

## Consequences

- Raw audit evidence and normalized downstream data remain distinguishable.
- Schema and parsing failures cannot masquerade as partial structured values.
- Approved schema loading stays with callers/registries and has no ambient
  network path inside the Prompt SDK.
- Restricted bodies require explicit capture policy; safe errors remain
  value-free.
- The provisional exact Codex pin remains release-blocking until issue #72.
