# Comic Manifest v1 API and release guide

Status: Codex Comic Manifest 1.0.0 is published immutably and its exact release
has been independently downloaded and verified. The Platform implementation is
still an unreleased Studio #99 candidate. Its proposed component tag is
`comic-manifest/v1.0.0`; the additive Platform npm package version is `1.2.0` and
the package remains private. The Platform tag and package have not been published.

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
That acceptance applies only to the pinned golden packet. The separate owner A4
decision approved the exact Codex commit, tag and asset tuples for Codex publication;
it did not approve Platform publication and is not represented as a human technical
review of the released artifacts.
The task-specific Epic #6 A3 AI-review exception covered code-merge review only
and did not authorize the A4 release decision. No separate human review of final
release artifacts is claimed. Platform publication still requires its own owner
decision on exact built artifact tuples.

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

The Codex publication and fresh immutable-download verification are complete.
This Platform adoption PR pins those exact published tuples and regenerates the
validator from the fresh download. The Platform package remains private and the
API inventory still records `candidate-unpublished`. After independent review,
merge and exact-head CI, build and inspect the Platform source/package artifacts,
then obtain a separate owner approval naming their exact tuples. Only that later
approval can authorize a Platform release and fresh verification. The readiness
check in this repository covers Codex adoption only; it is not final Platform
release readiness. After this PR is independently reviewed and merged, build the
Platform release artifact set once from the exact merge commit into a new
directory outside the checkout:

```sh
node scripts/build-comic-manifest-release.mjs /path/to/platform-release-candidate \
  --source-commit "$MERGED_COMMIT" --source-tree "$MERGED_TREE"
```

The builder records `build_provenance` fields as facts about that build: the
artifact set was built as an approval candidate while owner approval was absent
and Platform publication had not happened. These fields are not live publication
or approval state and are never changed after owner approval. The seven files in
the manifest plus the manifest itself form the eight-file immutable release set.

Generate the detached approval packet from that set:

```sh
node scripts/create-comic-manifest-approval-packet.mjs /path/to/platform-release-candidate \
  > /path/to/platform-owner-approval.json
```

The packet starts with `status: "awaiting-owner-decision"` and
`owner_approval: null`; it grants no approval. After the owner explicitly reviews
the exact source identity and all eight filename/size/SHA-256 tuples, record the
owner's decision in that separate packet by setting `status` to `approved` and
filling `owner_approval` with `decision: "approve"`, `owner: "@andrewperis"`,
an RFC 3339 `approved_at`, and a non-empty `decision_reference`, then run:

```sh
node scripts/verify-comic-manifest-approval.mjs /path/to/platform-release-candidate \
  /path/to/platform-owner-approval.json
```

This verifier is read-only. It requires the explicit `@andrewperis` approval
record, exact source commit/tree/tag, exactly eight regular files, and all eight
matching filename/size/digest tuples. Missing, changed, extra, or symlinked files
and mismatched approval fields fail closed. `approval_record_matches: true`
means the declared record matches those bytes; `owner_identity_authenticated:
false` and `external_owner_authentication_required: true` mean the verifier does
not authenticate who wrote it or create an approval. Before publication, confirm
the same owner decision through the external authenticated review path and retain
its reference in `decision_reference`.

After approval, publish those same eight files unchanged; do not rebuild after
approval. To verify a later fresh download, first download the full asset set to a
new empty directory, then run:

```sh
node scripts/verify-comic-manifest-downloads.mjs \
  /path/to/platform-release-candidate/comic-manifest-v1.0.0.manifest.json \
  /path/to/fresh-downloads
```

This compares the fresh bytes to the separately retained approved build set and
rejects missing or extra files. GitHub asset metadata records `application/json`
for the Codex uploads and public downloads returned `application/octet-stream`;
both are recorded separately from each contract-declared media type.

The local builder accepts an external commit identity only when its supplied
40-character tree hash exactly matches the clean local source tree; both values
are recorded in the artifact manifest. The adoption PR does not create a Platform
tag, release, upload or npm publication. A pre-merge PR build is review evidence
only; the owner approval packet must be generated from a fresh post-merge build.

Epic #101 receives the verified Codex and Platform artifact tuples, API/CLI and
adapter limits, synthetic conformance evidence, source/package manifests, and
known production-trust/approval gates. It owns orchestration design; this
package adds no scheduling, retries, resumable jobs, provider routing,
generation, rendering, or distribution automation. Epic #6 and Issue #99 close
only after actual publication and fresh-download verification.
