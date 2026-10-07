# Comic Manifest v1 API and release guide

Status: implementation is an unreleased candidate for Studio #99. The proposed
Platform component tag is `comic-manifest/v1.0.0`; the additive Platform npm
package version candidate is `1.2.0`. The package remains private. Neither tag
nor package is published by this change.

Codex owns normative meanings and the exact contract at
`contract/comic-manifest/v1.0.0`. Platform owns the implementation, CLI,
reference adapters, and verification. The initial Codex catalog is a single
Comic Manifest contract and does not republish Prompt SDK, Context Package, or
Context Builder assets. See the [Codex contract guide](comic-manifest-contracts.md),
[validation](comic-manifest-validation.md),
[references](comic-manifest-references.md),
[approvals](comic-manifest-approvals.md),
[build results](comic-manifest-build-results.md),
[CLI](comic-manifest-cli.md),
[conformance](comic-manifest-conformance.md), and
[renditions](comic-manifest-renditions.md) for detailed behavior.

## Library API

Import the provider-neutral entry point:

```js
import {
  parseComicManifestJson,
  validateComicManifest,
  planComicReferences,
  createComicReferenceResolver,
  validateComicRevision,
  createComicApprovalBoundary,
  createComicBuildResultBoundary,
  validateComicOutputCompatibility,
  diffComicRevision
} from '@definitely-secure-studio/platform/comic-manifest';
```

The complete export list is recorded in
[`release/comic-manifest-api-v1.json`](../release/comic-manifest-api-v1.json)
and is checked against the extracted package. The API performs bounded local
parsing, structural and record-local semantic validation, exact identity and
revision checks, adapter planning, build-result byte verification, approval
binding, compatibility checks, and disclosure-safe proposal/diff operations.
It does not itself fetch references, create trust, grant access, approve
creative quality, publish, or promote canon.

## Host adapters and trust boundary

Adapters are dependency-injected host code, not fields accepted from a comic
record. A host installs a fixed source reader for each exact selector and
implements current access verification, decision time, expiry and revocation
checks, cancellation, byte limits, and evidence retention. The resolver
authorizes all selected sources before its first read, rechecks authorization
around reads and before delivery, rejects redirects/fallbacks at the adapter
boundary, and verifies exact byte size and digest. Approval verification binds
the current candidate, detached decision, role, actor, action, scope, and
artifact digests. A boolean from a document, a hash, or a stored prior decision
does not confer current authority.

No production trust provider, direct Lore checkout, credential discovery,
context retrieval, permission renewal, or fallback reader is included. Test
adapters and the offline policy envelope use only public/synthetic fixtures.
Production trust onboarding is a separate reviewed boundary.

## CLI and review workflow

The `studio-comic` CLI exposes `validate`, `inspect`, `diff`, and synthetic
`verify`. It accepts explicit local file paths, emits fixed safe summaries, and
does no network access. Proposal output and protected evidence output require
separate explicit consent flags and separate protected destinations. Exit codes
are `0` success, `2` usage/input/local-validation failure, `3` synthetic
authority failure, `4` cross-record/revision/artifact mismatch, and `5`
protected-output I/O/consent failure. These are CLI statuses, not new schema
diagnostics.

Review uses the pinned source records, current candidate bytes, exact build
results, output bytes, detached approvals and the least-disclosing diff. A green
schema/test result establishes only its bounded machine predicate. Qualified
human reviewers remain responsible for creative/editorial meaning, canon,
rights, accessibility experience, disclosure, and publication authority.
Changes to golden/catalog/oracle/source expectations require the owner review
paths already recorded by Issue 98; this release candidate does not edit those
bytes.

The owner accepted the proposed Issue 98 golden packet at source head
`97dcd990e87bd0368ddcbecf66d1a6718bc7629e` in chat at
`2026-10-07T19:15:38Z`; PR #41 records that it was not a submitted GitHub review.
That acceptance applies only to the pinned golden packet. It is not evidence of
human review of the present release candidate or of final release approval.
The current public Constitution exception register lists no active Article 12
exception. No AI-review exception is claimed or relied on; AI-assisted review
and automation remain advisory and cannot replace the required qualified-human
decisions in Constitution Section 9.4.

## Compatibility, deprecation, and support

Consumers negotiate exact supported record-kind/version pairs. Comic Manifest
v1.0.0 rejects unknown versions, fields, enum values, and unsupported rendition
profiles; there is no silent minor-version acceptance. The separate Platform
package bump to 1.2.0 is additive to the established 1.1.0 package baseline;
historical Prompt SDK and Context Builder release metadata and assets remain
unchanged. Current release checks accept package 1.2.0 while preserving the
original 1.0.0/1.1.0 evidence. The immutable Context Builder v1 artifact must
continue to be built from its original 1.1.0 source revision.

Compatible corrections require a new reviewed patch contract release. Additive
contract capabilities require a reviewed version and explicit consumer support.
Changes that alter meaning, reject previously valid inputs, weaken a safety
boundary, or change identity/order require an accepted RFC and new major
version. Deprecation requires a consumer inventory, owner approval, migration
and rollback plan, and dated support window. No deprecation or support window
starts in this release.

## Limits and known limitations

The raw parser accepts UTF-8 JSON without BOM, duplicate keys, non-finite
numbers, or unpaired surrogates, with limits of 8 MiB per document, depth 32,
100,000 values, and 32 KiB per string. A host may impose stricter limits.
Reference verification supports at most 256 unique references, 8 MiB per
artifact, 32 MiB total expected bytes, 4,096 chunks per artifact, and 30 seconds
per verification; the host can choose a shorter timeout. The CLI summary output
is bounded separately. Exceeding a limit fails closed; no partial success is
returned.

Rendition profiles state permitted media types, dimensions, and byte caps. The
core does not decode or render images/PDFs, verify visual/alt-text quality,
perform layout/lettering, or establish rights. Hash and declared media-type
checks identify supplied bytes but do not prove that those bytes render as
declared or are safe to publish. External generation is not promised to be
bit-for-bit reproducible; deterministic processing of fixed synthetic inputs
is tested. Producer status, schema validity, or passing automation does not
establish Canon, permission, public disclosure, or release approval.

## Release order and Epic #101 handoff

The release sequence is Codex publication and fresh exact-download/immutability
verification; reviewed Platform adoption of those exact published tuples and
validator regeneration; Platform source/package build and owner approval; then
Platform publication and fresh verification. The current Platform lock remains
candidate/unpublished and readiness stays blocked until the first two steps are
complete. GitHub asset transport MIME may be `application/octet-stream`; record
it separately from the declared content media type in the contract manifest.

Epic #101 receives the verified Codex and Platform artifact tuples, API/CLI and
adapter limits, synthetic conformance evidence, source/package manifests, and
known production-trust/approval gates. It owns orchestration design; this
package adds no scheduling, retries, resumable jobs, provider routing,
generation, rendering, or distribution automation. Epic #6 and Issue #99 close
only after actual publication and fresh-download verification.
