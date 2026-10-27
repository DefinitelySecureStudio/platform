# Reviewed release inputs

## Comic Manifest v1 publication status and build provenance (#99)

The Platform Comic Manifest v1.0.0 component was published immutably at the
[release tag `comic-manifest/v1.0.0`](https://github.com/DefinitelySecureStudio/platform/releases/tag/comic-manifest/v1.0.0),
from source commit `f0672d90a47473da6a27614cad07abc175546d67` and tree
`b876a434e5f557d88d254cd1e75a8121f23c4ba3`. The exact release state and all
eight public asset hashes, sizes and MIME observations are in the
[publication proof](comic-manifest-v1.0.0-publication-proof.json). The additive
package is version `1.2.0`, remains private, and was not published to npm.

The independent Codex contract lock is `comic-manifest-contract-lock.json`;
do not append it to the historical five-contract Prompt SDK lock or the
separately verified Context Builder lock. Run
`node scripts/check-comic-manifest-release.mjs` to verify the published Codex
lock, immutable tag target, fresh-download tuple and regenerated runtime pin.
This is only the upstream contract-adoption gate. A passing result is not current
Platform publication status, Platform package approval, or npm publication.

The committed API inventory `comic-manifest-api-v1.json` retains
`publication_status: candidate-unpublished`. This is build-time candidate
metadata and is intentionally preserved; it is not the current GitHub release
status or npm publication status. The candidate artifact and its provenance are
not rewritten after owner approval or publication. Use the publication proof
above for current release state. The dated
[verification record](comic-manifest-verification.md) remains a historical
pre-publication snapshot.

### Reconstruct and verify the released v1 candidate

The builder and approval verifier are fixed to Platform Comic Manifest v1.0.0:
they hard-code component version `1.0.0`, tag `comic-manifest/v1.0.0`, and
filename prefix `comic-manifest-v1.0.0`. The exact v1 source tree uses package
version `1.2.0`. Use these commands only to reconstruct and verify the
approval-candidate set for the already-published v1 release. They do not prepare
a future version.

Start from a clean checkout of released source commit
`f0672d90a47473da6a27614cad07abc175546d67` (tree
`b876a434e5f557d88d254cd1e75a8121f23c4ba3`) and write artifacts outside the
checkout:

```sh
node scripts/build-comic-manifest-release.mjs /absolute/v1.0.0-reconstruction \
  --source-commit f0672d90a47473da6a27614cad07abc175546d67 \
  --source-tree b876a434e5f557d88d254cd1e75a8121f23c4ba3
node scripts/create-comic-manifest-approval-packet.mjs /absolute/v1.0.0-reconstruction \
  > /absolute/v1.0.0-reconstructed-packet.json
```

Packet creation emits no owner decision. To check the reconstructed files against
the separately retained owner-approved v1 packet, run the read-only verifier:

```sh
node scripts/verify-comic-manifest-approval.mjs /absolute/v1.0.0-reconstruction \
  /path/to/owner-approved-v1.0.0-packet.json
```

The verifier's `approval_record_matches: true` means the record matches all eight
files; `owner_identity_authenticated: false` and
`external_owner_authentication_required: true` mean it does not authenticate the
owner or authorize publication. These commands do not create or move tags, create
releases, upload files, replace release assets, or publish. Do not move
`comic-manifest/v1.0.0` or publish replacement assets.

A future component or package version requires a separately reviewed,
version-aware workflow that binds the requested component version, tag, package
version, filenames, and approval verification rules, with tests for that version.
Do not use these v1-only commands to prepare a future release. See the
[API/release guide](../docs/comic-manifest-release.md) for the versioning and
provenance boundary.
## Context Builder v1 publication

Context Builder v1.0.0 is published immutably at the exact source/tag commit
recorded on the [release page](https://github.com/DefinitelySecureStudio/platform/releases/tag/context-builder/v1.0.0).
See the [release and integration guide](../docs/context-builder-v1.md), independent
API inventory (`context-builder-api-v1.json`), and [Codex contract verification
record](context-builder-verification.md). The original Prompt SDK lock is unchanged.
The Platform package remains private and is not published to npm. Local release
verification scripts do not grant approval or perform network publication.

## Prompt SDK v1 inputs

`api-v1.json` inventories the public entry point. Changes require API and
compatibility review; the test suite detects accidental export additions/removals.

Run `node scripts/check-sdk-release.mjs` for a machine-readable readiness
report (exit 1 while blocked). The adopted references now pass this offline check.
It never creates tags, uploads files, changes version/status or grants approval.

This owner-reviewed adoption candidate adds `contract-lock.json`:
`{ "contracts": [ ...five downloaded Codex manifests... ] }`.
Each manifest retains the builder's repository, contract, version, tag, commit,
schema_id and assets with URI, media type, byte size and SHA-256. Add
`publication: { "immutable": true, "verified_at": "RFC3339 timestamp" }`
only after independently verifying GitHub immutable status, exact tag target,
and downloaded asset bytes. Retain links to that evidence in the release review.

This is an offline consistency check of reviewed evidence, not online proof.
The owner must verify evidence before adopting it. The script checks all five
runtime metadata pins. Tests also check compiled validator commit/digest headers;
all five validators were regenerated from the downloaded published schema assets.
All tags resolve to `62e78b606986988518b9dc502c25ae1cd189684a`, GitHub reported
`immutable: true`, and all 15 downloaded published assets matched local build
bytes. The lock includes per-release URLs and verification times.

Platform publication is still separate from dependency readiness. After owner
merge and successful CI, build/inspect the package/source artifacts, record
sizes/digests and the exact Platform commit, and publish the reviewed immutable
`prompt-sdk/v1.0.0` release. See the [release guide](../docs/prompt-sdk-v1.md).
