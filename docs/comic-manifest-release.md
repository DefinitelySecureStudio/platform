# Comic Manifest v1 API and release guide

Status: Codex Comic Manifest 1.0.0 and Platform Comic Manifest 1.0.0 are
published immutably, and their exact public release assets have been independently
downloaded and verified. The Platform component tag is `comic-manifest/v1.0.0`;
the additive Platform package version is `1.2.0` and remains private. The package
was not published to npm.

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
[conformance](comic-manifest-conformance.md),
[renditions](comic-manifest-renditions.md), and
[Platform v1.0.0 publication verification](comic-manifest-platform-release-v1.0.0.md)
for detailed behavior and exact release evidence.

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
paths already recorded by Issue 98; the released Platform source did not edit those
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
release artifacts is claimed. The owner separately approved Platform publication for the exact built artifact
tuples now listed in the publication verification record.

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


The v1 release sequence is complete. Codex Comic Manifest 1.0.0 was published
and its exact immutable assets were independently downloaded before Platform
adopted those published tuples. Platform source commit
`f0672d90a47473da6a27614cad07abc175546d67` (tree `b876a434e5f557d88d254cd1e75a8121f23c4ba3`) produced the approved candidate set.
The owner approved those exact eight tuples before publication. GitHub published
`comic-manifest/v1.0.0` immutably; its tag resolves to the source commit, and all eight
public downloads match the approved sizes and SHA-256 values. See the [Platform
v1.0.0 publication verification](comic-manifest-platform-release-v1.0.0.md)
for the release URL, exact hashes, and declared/upload/download media types.

The additive Platform package remains private; no npm publication occurred.
The candidate manifest's `build_provenance` records build-time facts: at build
time, owner approval was absent and Platform publication had not happened. It
was not rewritten after approval or publication. The detached approval verifier
matched the owner record to the exact source and eight files; it does not
authenticate the identity of the person who supplied that record. The
repository readiness check covers Codex adoption only, not Platform release
readiness.

For a future Platform component release, build once from its exact reviewed
merge commit into a clean directory outside the checkout:

```sh
node scripts/build-comic-manifest-release.mjs /path/to/platform-release-candidate --source-commit "$MERGED_COMMIT" --source-tree "$MERGED_TREE"
```

Generate a detached approval packet from those bytes:

```sh
node scripts/create-comic-manifest-approval-packet.mjs /path/to/platform-release-candidate > /path/to/platform-owner-approval.json
```

After the owner reviews the exact source identity and all eight filename/size/
SHA-256 tuples, record the decision in the separate packet and run the read-only
verifier:

```sh
node scripts/verify-comic-manifest-approval.mjs /path/to/platform-release-candidate /path/to/platform-owner-approval.json
```

The verifier requires the exact owner, source commit/tree/tag, eight regular
files, and all matching digest tuples. `approval_record_matches: true` means
the supplied record matches the bytes; it does not authenticate the person who
wrote the record or create approval. Confirm owner approval through the
authenticated review path before publication. After approval, publish those
same eight files unchanged. Verify the tag target and release state, then
download every public asset fresh and compare its size and SHA-256 with the
approved tuples. Record GitHub upload and public-download MIME separately from
the declared media types.

The Epic #101 handoff includes the verified Codex and Platform release tuples,
API/CLI and adapter responsibilities and limits, synthetic conformance
coverage, source/package manifests, and the production-trust and approval
gates. Epic #101 owns orchestration design; this package adds no scheduling,
retries, resumable jobs, provider routing, generation, rendering, or
distribution automation. Issue #99 and Epic #6 closeout remain separate owner
actions after independent verification; this documentation change does not
close either.
