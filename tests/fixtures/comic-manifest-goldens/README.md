# Comic Manifest proposed goldens

These files are immutable review inputs for the offline conformance suite. The
suite reads them, checks their pinned digests, and compares runtime output to
them. No test or CI task writes or refreshes these files.

The proposal oracle is a test-only explicit allowlist in
`tests/support/comic-manifest-golden-oracle.js`. It imports no Platform runtime
module. Its source is the Codex v1 synthetic fixture at commit
`8044643bf888067f5a6e0d212f843d72e8787f2b`; the source blob IDs, SHA-256 values,
scenario transforms, and golden hashes are recorded in `review-lock.json`.

`status: proposed-owner-review` means that these expected outputs are pending
owner approval. A green test or merge does not establish owner approval. Golden,
oracle, source fixture, and lock changes are owner-review paths in
`.github/CODEOWNERS`. The existing read-only CI permissions remain unchanged.
