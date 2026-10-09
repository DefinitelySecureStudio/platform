# Reviewed release inputs

## Comic Manifest v1 preparation (#99)

The additive component candidate is `comic-manifest/v1.0.0` in package
`1.2.0`. Its independent Codex contract lock is
`comic-manifest-contract-lock.json`; it must not be appended to the historical
five-contract Prompt SDK lock or the separately verified Context Builder lock.
Run `node scripts/check-comic-manifest-release.mjs` to verify the exact published
Codex lock, immutable tag target, fresh-download tuple and regenerated runtime pin.
This is only the upstream contract-adoption gate. Platform remains private and
unpublished; a successful check does not approve or publish the Platform package.
After merge, the builder produces an approval-candidate set from the exact merge
commit/tree; it never creates tags, releases, uploads, changes publication status,
or grants approval. Its status fields describe the state when the files were built.

`comic-manifest-verification.md` records the exact evidence required for a
post-merge candidate. The API inventory is `comic-manifest-api-v1.json`. Build
into a new external directory from the exact merge commit and tree:

```sh
node scripts/build-comic-manifest-release.mjs /absolute/new/output \
  --source-commit "$MERGED_COMMIT" --source-tree "$MERGED_TREE"
```

`node scripts/create-comic-manifest-approval-packet.mjs /absolute/new/output`
prints a detached packet with no owner decision. After an external authenticated
owner decision, record it in that packet and run
`node scripts/verify-comic-manifest-approval.mjs /absolute/new/output /path/to/owner-approval.json`.
The verifier's `approval_record_matches: true` result means the record matches
the exact eight files; `owner_identity_authenticated: false` and
`external_owner_authentication_required: true` make clear that it does not
authenticate the owner or authorize publication. Upload the approved files
unchanged without rebuilding.
See the [API/release guide](../docs/comic-manifest-release.md) for the full
workflow, artifact media-type handling, and Codex-before-Platform order.

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
