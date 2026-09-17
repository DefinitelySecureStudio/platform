# Comic Manifest contract consumer proof (Studio #89)

This is a **test-only consumer of an unreleased Codex 1.0.0 candidate**. It adds no
Manifest runtime, orchestration, source retrieval, trust issuer or publication API.
Codex owns the schema and semantics; public creative authority remains in Universe.

The [fixture lock](../tests/fixtures/comic-manifest-contract-lock.json) pins Codex
commit `53e4bd7738ae33c928bf72864d69d413168cc5b4` by full source paths, sizes and
SHA-256 digests. The schema and scenario are verbatim test artifacts, not local
normative schema forks or production dependencies. The existing Context Builder
fixture is identical to the pinned Codex bytes and is reused unchanged. All apparent
private context, grants, IDs, publication numbers and URLs are synthetic. A fixed
fixture UUID is not a production attestation or evidence of secure issuance.

The [Codex specification](https://github.com/DefinitelySecureStudio/codex/blob/53e4bd7738ae33c928bf72864d69d413168cc5b4/specs/manifests/comic-manifest-v1.md)
and RFC 0007 define three immutable payloads, exact-version support, relational
invariants, detached approvals and public projection. Schema validity proves only
structure. No matching hash, stored preparation result or supplied decision object
can authorize access, renew an expired grant, declassify output or promote canon.

## Verification

`node --test tests/prompt-sdk/comic-manifest-contract.test.js` checks exact artifact
pins; the three records and detached approval schema; SDK canonical identity
agreement; exact package/prompt/Builder linkage; and public-byte verification without
private record access. It renders the referenced prepared package through the
released SDK API at an explicit historical fixture time. Negative cases reject
unknown fields/versions, public private IDs, rehashed package/prompt substitutions,
expired/denied/wrong-purpose use and preparation evidence substituted for a grant.
No provider, external URL or real source is invoked. `npm test` includes this proof.

This is not a Manifest validator or full synthetic build execution. Codex's separate
fixture oracle tests candidate relational semantics. Production raw JSON hardening,
current trusted verifier/revocation adapters, media/rights inspection, approval
verification and safe projection remain #90–#98 responsibilities. Human disclosure
review must inspect free text and output bytes; sentinel checks do not prove safety.

## Adoption and constitutional scope

Merge the coordinated Codex contract PR before this proof. Refresh test pins only
from reviewed exact Codex blobs and verify bytes; do not edit the copies by hand.
Production adoption waits for #99's immutable contract and implementation releases
and full verified artifact tuples. Source commit URLs are not release assets.
Released Prompt SDK/Context Package/Context Builder code, schemas, lockfiles and
artifacts remain unchanged. Rollback removes this test-only consumer.

Constitution: v1.0.0, `constitution/v1.0.0`, Studio commit
`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`; Studio ADR 0018 at
`7b5065cef76bea9580609caba356b0d8fe7cc17c` governs the boundary. Owner @andrewperis;
Codex and Platform maintainers review the exact PR revisions. Universal,
repository/production-system and automated-workflow design profiles apply to the
consumer seam; this bounded offline proof grants no real access, disclosure,
publication or canon authority. Runtime/release conformance is not claimed.
