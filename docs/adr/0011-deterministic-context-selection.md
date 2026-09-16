# ADR 0011: Versioned exact and lexical context selection

- Status: Proposed, accepted by owner merge
- Date: 2026-09-16
- Owner: @andrewperis
- Issue: [Studio #79](https://github.com/DefinitelySecureStudio/studio/issues/79)
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Governing decisions: ADR 0008–0010 and Codex RFC 0006
- Evidence: [selection guide](../context-builder-selection.md), synthetic selection tests and conformance record

Implement the accepted `explicit-v1` and `lexical-v1` policies as an internal pure
selection stage, reached through the preparation gate's verified normalization
pipeline. Preserve exact source/fragment provenance, filter before ranking, detect
contradictory eligible shared claims before top-k, and use explicit ASCII tie breaks.
Revalidate authority before handoff; never accept caller-provided normalized records
as permission. Missing required context fails; optional absence is explicit.

Do not invent authority precedence, newer-version supersession, content-based
deduplication, private-source preference, summaries or facts. Distinct candidate
IDs remain distinct evidence even with equal claims. Immutable identities establish
which bytes were selected, not whether the claim is true or publishable.

This bounded offline baseline has no new dependency or external service. Lexical
matching is intentionally simple and not semantic contradiction detection; trusted
inventories assign claims and scope. Work scales with eligible text and queries,
so hosts must constrain workload/concurrency. Richer retrieval needs separately
reviewed versioned policy, trust and deterministic test evidence.

The development-only protected selection is not a released build-result contract,
Context Package, public receipt or use grant. Assembly/budgets remain #80, durable
lifecycle/audit and SDK/CLI handoff later tasks, and immutable release #86. No Codex
schema or released Prompt SDK behavior changes are authorized by this decision.
