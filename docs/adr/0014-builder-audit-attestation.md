# ADR 0014: Required protected audit and independent opaque attestations

- Status: Proposed, accepted by owner merge
- Date: 2026-09-16
- Owner: @andrewperis
- Issue: [Studio #82](https://github.com/DefinitelySecureStudio/studio/issues/82)
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Governing decisions: ADR 0008–0013 and Codex RFC 0006
- Evidence: [audit guide](../context-builder-audit.md), synthetic audit tests and conformance record

Add an audited build facade over the trusted preparation gate. Deliver bounded
protected attempt/prepared/failure records, require exact acknowledgments, and
recheck authority after prepared evidence delivery. No package is returned on audit
failure. Prepared evidence is candidate evidence, not proof of client receipt/use.
During a sink outage report explicit failure; do not pretend durable tracing can
be guaranteed or retry secretly. Production adapters remain trusted, separately
reviewed infrastructure with retention/access/idempotency responsibilities.

Keep body-free operational IDs/identities protected. Public projections contain
only independently approved, newly assigned opaque references. Provide synthetic
allowlist issuance and access-controlled resolution, not a production signer.
Preparation evidence cannot impersonate use authorization or publication approval.
Preserve exact instance/prompt/package linkage to unchanged SDK contracts.

Use the existing reviewed result/receipt schemas with digest-pinned generated
validators. The operational record and development APIs are local, so no shared
Codex schema change is needed. No new dependency, real private input, immutable
release or production service. Review before production sink/attestor onboarding,
retention/access changes, consumer handoff or #86.
