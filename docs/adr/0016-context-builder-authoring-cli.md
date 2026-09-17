# ADR 0016: Offline synthetic authoring CLI with explicit protected output

- Status: Proposed, accepted by owner merge
- Date: 2026-09-16
- Owner: @andrewperis
- Issue: [Studio #84](https://github.com/DefinitelySecureStudio/studio/issues/84)
- Constitution: 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Evidence: [CLI guide](../context-builder-cli.md), synthetic examples, subprocess tests and conformance record

Provide validation/plan, build and verify/replay through Builder development APIs.
Require explicit synthetic mode, decision file and clock for building. Plan declares
its input-file reads and grants no authority. Keep production credential injection
in separately reviewed trusted hosts, not arbitrary CLI modules or request files.

Emit status/counts/value-free diagnostics, with stable exit codes and no body/hash
logging. Save protected results only with explicit consent in exclusive owner-only
files under private owned directories. Strict bounded regular-file JSON ingress,
POSIX no-follow checks and no overwrite guard accidental exposure; trusted ancestor
directories and secure retention remain host assumptions, not a containment claim.

Verify means internal integrity, not authentic approval. Replay rebuilds using
explicit pinned authorized inputs and compares deterministic results excluding new
opaque audit references. Do not introduce use-grant creation, repository mutation,
provider invocation, publication or Canon promotion. No released SDK CLI/export,
immutable contract, dependency or release change. Reassess for production runtime
onboarding, filesystem/output policy, contract changes or #86.
