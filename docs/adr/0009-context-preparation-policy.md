# ADR 0009: Explicit trusted preparation gate

- Status: Proposed, accepted by owner merge
- Owner: @andrewperis
- Date: 2026-09-15
- Issue: [Studio #77](https://github.com/DefinitelySecureStudio/studio/issues/77)
- Governing design: [ADR 0008](0008-context-builder-pipeline.md), Studio ADR 0017 and Codex RFC 0006
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Evidence: [implementation/interface](../context-builder-preparation.md), focused tests and conformance record

Use an explicitly configured policy verifier, decision-owner allowlist, trusted
clock and pre-bound immutable source inventory. The verifier's closed local
result binds complete request identity, authenticated caller, target, purpose,
classification ceiling and lifecycle/revocation state. Source inventory is an
independent exact-match check, not a caller-selected path or URI resolver.

Verify before each source read and before returning bytes. No approval cache or
transferable caller-created approval object exists. Snapshot inputs before async
effects, narrow lifecycle bounds across checks and sanitize all external errors.
The deterministic synthetic verifier has explicit synthetic mode and cannot be
silently installed as production authority. Arbitrary host-installed code remains
trusted; this library cannot establish authenticity for a lying verifier.

Alternatives rejected: implicit policy/env lookup, allow-string trust, copied use
authorization as preparation, source-path interpolation and authorization caching.
The cost is repeated policy checks and required host configuration. Real readers
must still enforce bounded I/O/containment; revocation is boundary-sampled, not an
atomic transaction with a remote service. Production trust onboarding is separate.

This is an unreleased development module, with generated validation pinned to the
reviewed candidate, no package export and no change to Prompt SDK semantics.
No Codex wire-contract gap is introduced: the policy adapter result is a local
implementation interface. #78 supplies concrete source adapters/normalization;
#82 supplies durable audit; #86 supplies immutable production adoption. Review on
trust, caller, owner, source mapping, classification, caching or lifecycle changes.
