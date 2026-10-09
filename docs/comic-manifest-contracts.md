# Comic Manifest contract consumer proof (Studio #89)

Codex Comic Manifest 1.0.0 is published at immutable tag
[`contract/comic-manifest/v1.0.0`](https://github.com/DefinitelySecureStudio/codex/releases/tag/contract/comic-manifest/v1.0.0).
This is still a **test-only consumer proof**: it adds no Platform Manifest runtime,
orchestration, source retrieval, trust issuer or publication API. Codex owns the
schema and semantics; public creative authority remains in Universe.

The [fixture lock](../tests/fixtures/comic-manifest-contract-lock.json) remains
pinned to the owner-reviewed Codex source snapshot at commit
`8044643bf888067f5a6e0d212f843d72e8787f2b`; it records historical test bytes, not
the runtime release pin. The published Codex tag targets
`12e437e30328a3bb9cd2d15e6307a70b4b7e0e2a`. Its schema has the same byte size and
SHA-256 as the reviewed fixture, so this adoption leaves the fixture, golden,
catalog and oracle bytes unchanged. Runtime metadata pins the published release
tuple separately. All apparent private context, grants, IDs, publication numbers
and URLs are synthetic. A fixed fixture UUID is not a production attestation or
evidence of secure issuance.

The [Codex specification](https://github.com/DefinitelySecureStudio/codex/blob/8044643bf888067f5a6e0d212f843d72e8787f2b/specs/manifests/comic-manifest-v1.md),
RFC 0007 and RFC 0008 define three immutable payloads, exact-version support,
rendition profiles, relational invariants, detached approvals and public projection.
Schema validity proves only structure. No matching hash, stored preparation result
or supplied decision object can authorize access, renew an expired grant, declassify
output or promote canon.

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
fixture oracle tests candidate relational semantics. Production raw JSON hardening
and current trusted verifier/revocation adapters remain explicit host responsibilities.
#96 adds bounded raw output-byte verification and an allowlisted proposal boundary in
[comic-manifest-build-results.md](comic-manifest-build-results.md). The #95 approval
boundary still requires an external trusted verifier. Human disclosure review must
inspect free text, URLs, and output bytes; sentinel checks do not prove safety.

## Adoption and constitutional scope

The Codex contract publication is complete and its exact immutable release tuple
is recorded in the runtime lock. This test proof retains its separately reviewed
historical fixture pins. Production use of the Platform implementation still waits
for its own release, exact verified artifact tuples and separate owner approval.
Source commit URLs are not release assets. Released Prompt SDK/Context Package/
Context Builder code, schemas, lockfiles and artifacts remain unchanged. Rollback
removes this test-only consumer.

Constitution: v1.0.0, `constitution/v1.0.0`, Studio commit
`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`; Studio ADR 0018 at
`7b5065cef76bea9580609caba356b0d8fe7cc17c` governs the boundary. Owner @andrewperis;
Codex and Platform maintainers review the exact PR revisions. Universal,
repository/production-system and automated-workflow design profiles apply to the
consumer seam; this bounded offline proof grants no real access, disclosure,
publication or canon authority. Runtime/release conformance is not claimed.
