# ADR 0015: Explicit approved Context Builder to SDK handoff

- Status: Proposed, accepted by owner merge
- Date: 2026-09-16
- Owner: @andrewperis
- Issue: [Studio #83](https://github.com/DefinitelySecureStudio/studio/issues/83)
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Governing decisions: ADR 0008–0014 and Codex RFC 0006
- Evidence: [handoff guide](../context-builder-handoff.md), real-build synthetic examples and tests

Integrate outside the released SDK using its public package binding, rendering,
execution, structured-output and provenance interfaces. Only audited prepared builds
enter review. Independently installed use authority must return an exact
request/package-identity-bound grant; no builder-generated production approval.
Revalidate scope/time/revocation after descriptor awaits immediately before execution.
If the approval decision changes, fail rather than misattribute rendered provenance.

Keep exact build/package/use/execution links in protected local handoff metadata
without modifying immutable SDK provenance or publishing private fingerprints.
Return value-free integration failures and require explicit structured processing.
Default examples use real builds and independent synthetic fixture approvals with
mock execution. Retain defensive snapshot bounds and separately trusted adapter,
clock, authority and retention policies.

No retrieval is moved into the SDK. No production authority deployment, Manifest/
Orchestrator engine, release permission, contract change, new dependency or immutable
release. Review before production integration, authority/target/scope/time changes,
consumer adoption or #86.
