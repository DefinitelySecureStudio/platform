# Changelog

## Unreleased — Context Builder preparation (#77)

- Add a development-only preparation gate with exact scope/caller/prompt/owner
  verification, bounded registered reads, revocation/lifecycle rechecks and
  value-free diagnostics. Add deterministic synthetic authority and read-spy tests.
- Generate request validation from the reviewed Codex candidate; no released
  Prompt SDK interface, immutable schema or dependency lock changes.

## 1.0.0 — stable adoption candidate, artifact publication pending

- Adopt all five published immutable Codex contracts with complete verified
  schema/bundle manifests and exact source commit.
- Regenerate every validator from published assets; expose released runtime
  references and permit stable prompt lifecycle.
- Align package, renderer and structured processor versions at 1.0.0.
  Render/processing identities change because they include runtime provenance;
  prompt messages, outputs, policy and algorithms are unchanged.
- Strengthen readiness checks and negative tests for all five dependency pins.

## Unreleased — Prompt SDK v1 release preparation

- Final API inventory, quick start, adapter guide, compatibility/deprecation
  policy, known limitations and owner-reviewed release checklist.
- Context Package candidate schema id normalized to the canonical v1 URN;
  refreshed exact pin and compiled validator, with no payload semantics change.

## 0.1.0 — implementation baseline

Prompt definition validation/lint; deterministic rendering; provider-neutral
execution; filesystem registry; context-package integration; structured outputs;
metadata-only provenance; CLI/authoring workflow; offline conformance suite and
reference goldens. Provisional contract dependencies remain release-blocking
until immutable Codex artifacts are verified. No stable v1 tag is claimed here.
