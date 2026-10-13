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

### Candidate build and approval procedure

For v1, the builder produced an approval-candidate set from the exact merged
commit/tree. It never creates tags, releases or uploads, and its provenance fields
describe the state when those files were built. To prepare a future version, build
into a new external directory from its exact reviewed merge commit and tree:

```sh
node scripts/build-comic-manifest-release.mjs /absolute/new/output \
  --source-commit "$MERGED_COMMIT" --source-tree "$MERGED_TREE"
```

`node scripts/create-comic-manifest-approval-packet.mjs /absolute/new/output`
prints a detached packet with no owner decision. After the owner reviews the exact
source and eight file tuples, record that decision in the detached packet and run
`node scripts/verify-comic-manifest-approval.mjs /absolute/new/output /path/to/owner-approval.json`.
The verifier's `approval_record_matches: true` means the record matches all eight
files; `owner_identity_authenticated: false` and
`external_owner_authentication_required: true` mean it does not authenticate the
owner or authorize publication. Publish only those approved files, unchanged and
without rebuilding.
See the [API/release guide](../docs/comic-manifest-release.md) for detailed
versioning, provenance, review and media-type guidance.

## Context Builder v1 preparation (#86)

See [release/integration guide](../docs/context-builder-v1.md). The independent
API inventory is `context-builder-api-v1.json`. Run
`node scripts/check-builder-release.mjs`; it now passes following actual immutable
contract publication, verified lock adoption and validator regeneration. See
[verification evidence](context-builder-verification.md). The original SDK lock
below is unchanged. Owner merge and CI are required before implementation
publication; `--candidate` rehearsals remain explicitly nonpublishable. No script
grants approval or performs network publication.

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
