# ADR 0002: Reproducible compiled Prompt Definition schema validation

- Status: Accepted by merge
- Date: 2026-08-17
- Decision owner: `@andrewperis`
- Issue: [DefinitelySecureStudio/studio#64](https://github.com/DefinitelySecureStudio/studio/issues/64)

## Context

Prompt validation must implement the Codex-owned JSON Schema exactly, work
offline in library and CI use, and avoid a runtime checkout or copied schema.
Prompt Definition v1 is accepted but not yet released as an immutable contract
artifact. A handwritten structural validator would create a competing contract
and make parity difficult to prove.

## Decision

Compile the exact accepted Prompt Definition v1 schema into standalone ESM with
Ajv 8.20.0 and ajv-formats 3.0.1. Pin all dependency bytes in
`package-lock.json`. The generator accepts an explicit schema path, verifies its
18,384 bytes against SHA-256
`6ac345956582d25c2db9c81b85cab9c73b2cbcfc79b8aac7a43d847c07173cb9`,
and refuses a mismatch before emitting code. The generated file records Codex
commit `bd31b6249e068d3317306afb857d68024f2929be` and is never edited manually.

Keep semantic and security lint rules in reviewed Platform source. They extend
structural validation without redefining schema fields. Diagnostics distinguish
errors from advisory warnings and never include supplied runtime values.

## Consequences

- Validation is deterministic, provider-free, offline, and usable without a
  Codex checkout after installation.
- Generated code is reproducible only from the exact accepted schema bytes; an
  intentional contract update changes the pinned commit, digest, generated code,
  tests, documentation, and conformance assessment together.
- Ajv and its transitive runtime packages become reviewed, locked third-party
  dependencies. Their licenses are recorded in `THIRD_PARTY_NOTICES`.
- The provisional commit reference remains release-blocking. Studio issue #72
  must replace it with the released immutable artifact tuple before release.
- Complete authorization and integrity checks for supplied context packages
  remain in the issue #67 boundary.
