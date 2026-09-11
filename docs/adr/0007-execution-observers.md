# ADR 0007: Execution provenance observers

Candidate for owner merge, 2026-09-11. Owner: @andrewperis.
Issue: https://github.com/DefinitelySecureStudio/studio/issues/69

Project accepted execution results into the Codex Execution Provenance v1
allowlist and deliver once to an optional vendor-neutral observer. Capture
effective parameters at negotiation, before adapter invocation. Use immutable
snapshots and bounded sink waiting so observability cannot obscure results.
Expose a pure builder for later validation/structured-output revisions.

Default storage is a bounded memory buffer. Body capture is excluded even when
execution policy allows it. Classification gates hashes/context identity, and
diagnostics become counts. This preserves traceability while keeping free-form
provider and prompt data out of sinks. Custom sinks own their storage policy.
