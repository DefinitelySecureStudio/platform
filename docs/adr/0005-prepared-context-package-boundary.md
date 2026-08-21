# ADR 0005: Prepared Context Package boundary

- Status: Accepted by merge
- Date: 2026-08-20
- Decision owner: `@andrewperis`
- Issue: [DefinitelySecureStudio/studio#67](https://github.com/DefinitelySecureStudio/studio/issues/67)

## Context

Prompt rendering needs approved context without coupling the SDK to search,
retrieval, lore stores, or a particular Context Builder. Integrity,
authorization, provenance, classification, and expiry must survive the handoff.

## Decision

Consume only an explicit Context Package v1 document plus a separate explicit
authorization and evaluation time. Verify the pinned Codex schema and canonical
manifest, section, source, scope, time, classification, media, placement, and
size constraints before binding. Carry value-free package, section,
source-version, and authorization provenance into rendering and execution.

Package construction and selection remain outside the SDK. Missing, stale,
unauthorized, corrupt, undeclared, incompatible, or oversized context fails
closed without retrieval, fallback, or hidden time access.

## Consequences

- Context producers and consumers remain independently testable.
- Callers provide time explicitly, so binding is deterministic.
- Private content can flow at runtime while diagnostics/provenance remain
  reader-safe; callers remain responsible for secure transport and storage.
- The provisional pin remains release-blocking until issue #72 publishes
  immutable contract artifacts.
