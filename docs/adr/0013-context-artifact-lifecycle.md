# ADR 0013: Explicit protected artifact retention and authorized replay

- Status: Proposed, accepted by owner merge
- Date: 2026-09-16
- Owner: @andrewperis
- Issue: [Studio #81](https://github.com/DefinitelySecureStudio/studio/issues/81)
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Governing decisions: ADR 0008–0012 and Codex RFC 0006
- Evidence: [lifecycle guide](../context-builder-lifecycle.md), synthetic lifecycle tests and conformance record

Use a local versioned canonical prepared-artifact envelope with complete request
and pinned-input identities. Leave default runs memory-only without shared caching.
Optional trusted storage reuses verified raw bytes under complete request/trust
scope, not packages or authorization decisions. Fresh policy checks surround cache
I/O; rerun normalization/selection/assembly on every hit and retain shorter bounds.

Separate historical retention from reuse permission. Require explicit access policy,
time, retention and resource bounds; provide memory FIFO eviction and explicit
cleanup. Do not renew immutable entries on access/write. Production storage must
protect metadata integrity as well as content; hashes alone do not authenticate
authority history. No disk, production secure-store adapter or real-source access
is introduced. Memory reference release is not guaranteed physical erasure.

Replay bypasses the cache and invokes only approved pinned readers after renewed
preparation checks. Compare verified canonical identities without disclosing bytes.
Retained evidence cannot grant reuse, execution or publication permission. Richer
reuse across distinct build scopes is rejected in favor of exact safe boundaries.

No normative Codex or immutable SDK contract change, new dependency or release.
Durable audit/public receipts, consumer integration and publication remain later
tasks. Reassess before production retention, namespace/trust, source identity,
clock, revocation or retention-policy changes.
