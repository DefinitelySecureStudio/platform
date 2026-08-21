# Changelog

All notable changes to the platform will be documented in this file.

Releases follow the Studio's content-addressed dependency, versioning, and
provenance strategy. See `docs/architecture.md`.

## Unreleased

- Added Context Package v1 parsing, integrity and authorization validation,
  prompt-slot binding, classification and provenance propagation, deterministic
  mocks, adversarial tests, an example, documentation, and an ADR.
- Added a vendor-neutral filesystem prompt registry with deterministic
  discovery, exact and guarded non-exact resolution, lifecycle warnings,
  conflict detection, atomic refresh, source digests, tests, and examples.
- Added Provider Execution v1 validation, synchronous adapter execution,
  capability negotiation, normalized provenance/errors, cancellation and
  timeout handling, and a deterministic mock adapter.
- Added Prompt Definition v1 schema validation, semantic/security linting,
  machine-readable diagnostics, duplicate-key-safe parsing, collection checks,
  and a CI-ready CLI.
- Added a dependency-free Prompt Definition v1 renderer with strict explicit
  value resolution, deterministic canonical output, structured errors, tests,
  and synthetic examples.
- Adopted Constitution v1.0.0 with a revision-scoped conformance assessment and
  pre-implementation agent, workflow, and release control requirements.
- Created the initial repository scaffold and ownership boundaries.
