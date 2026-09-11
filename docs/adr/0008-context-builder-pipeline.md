# ADR 0008: Explicit Context Builder pipeline

- Status: Proposed; dependent on Studio ADR 0017 and owner-approved merge
- Date: 2026-09-11
- Owner: @andrewperis
- Issue: [Studio #75](https://github.com/DefinitelySecureStudio/studio/issues/75)
- Governing design: [Studio ADR 0017](https://github.com/DefinitelySecureStudio/studio/blob/main/adr/0017-context-builder-architecture.md)
- Constitution: v1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Evidence: this ADR, [implementation outline](../context-builder-architecture.md), coordinated PRs and scoped conformance record

## Context

Prompt SDK 1.0.0 consumes prepared context. Its schema and binding checks are
not a producer API or permission to read sources. Builder needs a separate
implementation boundary that can verify preparation authority before I/O and
hand the exact resulting package to an external use-authorization authority.

## Decision

Keep Node.js ESM and the existing test/runtime baseline. Plan a separate
`src/context-builder/` capability, with no new exported API or runtime code in
this ADR change. Reuse released Prompt SDK validation/binding through supported
interfaces; do not import its generated validators or internal implementation
as the Builder's normative source.

Use a pure normalize/filter/select/assemble core and an explicit async facade
for policy verification, bounded source reads, optional storage and audit.
All sources, timestamps, IDs, policy versions and budgets are caller-explicit.
Do not allow arbitrary caller-created objects to bypass verification by being
named a verified decision; the facade owns the validation/trust transition.

Default to deterministic explicit/lexical selection, synthetic fixtures,
memory-only retention and offline fakes. No paid models, embeddings/vector
backend, real Lore access, hosted registry or new runtime is required.
Source and policy implementations are injected trusted code with explicit
configuration, not modules selected by untrusted source text.

After assembly validate Context Package v1 and expose a **prepared** result.
A separate trusted authority returns exact-instance use authorization; the
Prompt SDK rechecks package, authorization and explicit time before binding.
No Builder result means permission to execute, publish or establish canon.

## Failures and effects

Malformed requests and unverifiable/denied preparation fail before source read.
Missing/corrupt sources, authority conflicts, required-slot deficits, budget
failure, expiry and revocation fail closed; no implicit alternate source or
permission renewal. Cancellation is propagated to adapters and stops new work;
non-cooperating external I/O remains an explicit adapter risk, not a claim of
rollback. No partial prepared package is delivered as success.

Optional observer delivery can fail without changing successful pure computation;
if governing policy requires an audit record, delivery is gated on that record.
The exact distinction and codes are specified in #76/#82. An audit sink never
grants access. Logs/public evidence omit protected content and fingerprints.

## Consequences and rollout

Scoped interfaces add explicit configuration overhead but allow offline tests,
versioned adapters and secure readers without vendor or repository coupling.
Authorization authenticity/revocation and private storage remain deployment
responsibilities with independent review, not mock capabilities promoted to trust.

[Studio #76](https://github.com/DefinitelySecureStudio/studio/issues/76) finalizes
contracts and names; Studio #77–#85 implement with focused negative tests.
#86 publishes required immutable contract versions before implementation release.
Changing Prompt SDK retrieval behavior or published Context Package schemas is
not an implementation shortcut. Accept Studio's cross-repository ADR first,
then this local ADR. Production implementation and trust onboarding follow in
their own PRs; no new release is required for this documentation-only decision.
