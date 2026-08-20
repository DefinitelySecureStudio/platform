# ADR 0004: Filesystem-backed prompt registry

- Status: Accepted by merge
- Date: 2026-08-20
- Decision owner: `@andrewperis`
- Issue: [DefinitelySecureStudio/studio#66](https://github.com/DefinitelySecureStudio/studio/issues/66)

## Context

Callers need deterministic prompt discovery and exact identity/version
resolution without coupling storage to execution or requiring a hosted prompt
management service. Non-exact resolution and lifecycle transitions must not
silently weaken reproducibility.

## Decision

Implement a provider- and vendor-neutral registry abstraction backed by one or
more explicit approved filesystem roots. Discover only `*.prompt.json`, reject
symlinks, validate every definition before atomically replacing the snapshot,
and expose content identity using root id, relative path, byte size, and digest.

Exact version resolution is the default. Range/latest resolution requires an
explicit opt-in and lifecycle allowlist, uses a documented strict full-SemVer
subset, rejects equal-precedence ambiguity, and warns callers to pin the result.
Deprecated definitions warn without replacement; retired definitions require an
explicit audit/reproduction option. Duplicate exact identities always fail.

## Consequences

- Repository-backed use is supported through an approved checkout without a
  GitHub or SaaS runtime dependency.
- Snapshot refresh is deterministic, atomic, and controlled by the caller.
- Absolute host paths, prompt contents, and credentials do not enter discovery
  metadata or structured failures.
- Watchers, remote fetching, hosted storage, publication, execution, and access
  authorization remain separate responsibilities.
- The provisional Prompt Definition contract pin remains release-blocking until
  issue #72 publishes immutable contract artifacts.
