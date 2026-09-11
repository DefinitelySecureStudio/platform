# Reviewed release inputs

`api-v1.json` inventories the public entry point. Changes require API and
compatibility review; the test suite detects accidental export additions/removals.

Run `node scripts/check-sdk-release.mjs` for a machine-readable readiness
report (exit 1 while blocked). Its current expected result is not ready.
It never creates tags, uploads files, changes version/status or grants approval.

The later owner-reviewed adoption change adds `contract-lock.json`:
`{ "contracts": [ ...five downloaded Codex manifests... ] }`.
Each manifest retains the builder's repository, contract, version, tag, commit,
schema_id and assets with URI, media type, byte size and SHA-256. Add
`publication: { "immutable": true, "verified_at": "RFC3339 timestamp" }`
only after independently verifying GitHub immutable status, exact tag target,
and downloaded asset bytes. Retain links to that evidence in the release review.

This is an offline consistency check of reviewed evidence, not online proof.
The owner must verify evidence before adopting it. The script checks the four
public runtime metadata pins; the fifth provenance generator pin and every
compiled validator must additionally be checked against downloaded schema bytes
as specified in the [release guide](../docs/prompt-sdk-v1.md).
