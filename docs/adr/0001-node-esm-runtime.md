# ADR 0001: Node.js ESM for the initial Platform runtime

- Status: Accepted by merge
- Date: 2026-08-17
- Decision owner: `@andrewperis`
- Issue: [DefinitelySecureStudio/studio#63](https://github.com/DefinitelySecureStudio/studio/issues/63)

## Context

The first Platform capability is a provider-neutral Prompt Definition v1
renderer. It needs deterministic UTF-8 and JSON behavior, cryptographic hashing,
structured errors, and portable automated tests. No framework, service, package
registry, or provider SDK is needed.

## Decision

Use dependency-free ECMAScript modules on Node.js 22 or newer. Use only built-in
APIs for SHA-256, byte sizing, fixtures, and tests. Keep the renderer as a small
library under `src/prompt-sdk/`; do not couple it to a CLI, web framework,
provider adapter, environment configuration, filesystem lookup, or network
service.

## Consequences

- A supported Node.js runtime is the only development dependency.
- There is no third-party dependency or lockfile in this change.
- `node:test` provides the initial test runner; `npm test` is the stable command.
- Provider adapters and other runtimes can consume the canonical rendered-prompt
  value without changing template semantics.
- A future runtime change requires another ADR, compatibility evidence, and a
  migration path.
