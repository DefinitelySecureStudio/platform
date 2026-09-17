# Reviewed release inputs

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
