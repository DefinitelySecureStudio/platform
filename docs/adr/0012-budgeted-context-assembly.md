# ADR 0012: Whole-candidate budgeted Context Package assembly

- Status: Proposed, accepted by owner merge
- Date: 2026-09-16
- Owner: @andrewperis
- Issue: [Studio #80](https://github.com/DefinitelySecureStudio/studio/issues/80)
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Governing decisions: ADR 0008–0011 and Codex RFC 0006
- Evidence: [assembly guide](../context-builder-assembly.md), synthetic assembly tests and conformance record

Implement the reviewed whole-candidate-v1 algorithm behind the preparation gate.
Reserve required slots first, then consider optional slots in declaration order.
Reject required overflow and omit whole optional sections; never truncate facts,
JSON or Unicode. Use exact UTF-8/canonical JSON sizes and reject arithmetic overflow.
Do not add token estimation: the v1 contract deliberately excludes it pending a
versioned estimator specification. Host workload limits remain necessary.

Emit unchanged Context Package v1 documents, validate using the released SDK's
public API, preserve source evidence and maximum classification, and narrow lifecycle
to all observed request/source/preparation bounds. Recheck preparation after initial
assembly and recalculate manifest identity if final bounds narrow. Do not mint use
authorization, a public receipt or a final audited build-result.

This remains an unreleased development API. No normative contract/schema bytes,
released SDK behavior, dependencies, production trust or real private-source access
change. Persistent lifecycle/audit, consumption interfaces and publication remain
separately reviewed tasks.
