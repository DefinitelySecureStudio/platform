# ADR 0010: Offline pinned readers and explicit fragment normalization

- Status: Proposed, accepted by owner merge
- Date: 2026-09-15
- Owner: @andrewperis
- Issue: [Studio #78](https://github.com/DefinitelySecureStudio/studio/issues/78)
- Governing decisions: [ADR 0008](0008-context-builder-pipeline.md), [ADR 0009](0009-context-preparation-policy.md), Codex RFC 0006
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Evidence: [source interfaces and limits](../context-builder-sources.md), synthetic source tests and conformance record

Use explicit in-memory artifacts, flat local public snapshots and authorized
private-export streams. All return the preparation gate's existing binding shape.
Bind immutable source identity and metadata independently of source content;
verify size/digest before parsing and reject contradictory inventory references.
No network fetch, branch resolution, checkout or secret discovery is implemented.

Normalize only explicit UTF-8 ranges and JSON pointers with caller-assigned opaque
IDs. Use fatal decoding, bounded duplicate-key-aware JSON parsing, own-property
pointer traversal and existing Studio JSON canonicalization. Retain metadata and
classification exactly. Revalidate policy after normalization; do not expose partial
output, self-issued use authorization or a finished Context Package.

Reject implicit chunking, content-inferred authority, permissive JSON.parse-only
handling and arbitrary nested filesystem paths. The flat snapshot reader uses
no-follow file opens and root/file checks, but requires host-controlled directory
ancestors: portable Node pathname APIs are not a hostile-directory sandbox.
Use an isolated reader service if directory hierarchy races are in the threat model.
Private readers remain injected trusted code and must enforce transport bounds.

Local byte/parser/chunk ceilings trade accepted input size for predictable resource
use. Their explicit rejection is preferable to hidden truncation or partial facts.
These interfaces remain development-only until #86. Selection/assembly, persistent
version registries and audit/publication remain later boundaries; no Codex contract
changes or real source/production trust onboarding are approved by this decision.
