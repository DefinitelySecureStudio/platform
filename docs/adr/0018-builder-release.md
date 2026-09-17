# ADR 0018: independently gated Context Builder v1 release

Status: proposed; accepted on owner merge. Owner: @andrewperis. 2026-09-16.
Issue: Studio #86. Constitution 1.0.0 at
`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`.

Expose the reviewed Builder API and offline CLI additively in private Platform
package 1.1.0, independently versioned as Context Builder 1.0.0. Preserve Prompt
SDK 1.0.0 behavior, API and immutable contracts. Freeze an API inventory and reuse
the existing offline security suite. No dependency graph changes.

Prepare deterministic Git-blob source and npm package artifacts without publishing
to npm. Require clean commits, exclusive output directories, two matching builds,
explicit owner review and immutable downloaded contract adoption. A candidate
rehearsal cannot pass the final download verifier. Final preparation emits exact
source/package/lock identities; the separate verifier compares downloads to a
trusted local manifest. Online tag/immutability and approval verification remain
mandatory human-reviewed release steps, not claims made by an offline script.

Reject republishing SDK v1 bytes, floating references, synthetic release evidence,
automatic approval/publication and closing Epic #5 before downloads are verified.
Production trust backends and Epic #6/#7 remain separately scoped. No exception.
