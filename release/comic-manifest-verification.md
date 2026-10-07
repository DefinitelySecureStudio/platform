# Comic Manifest v1 verification record — Studio #99

Status: release preparation candidate; no tag, release, or npm package has been
published. The source branches are still under preparation review. This checklist
records what is verified locally and what must be reverified against the exact
post-merge candidate. It does not convert a successful test, AI review, draft
PR, or owner acceptance of the Issue 98 golden packet into release approval.

## Preparation evidence — 2026-10-07

- Codex prep branch `codex/issue-99-release-prep`, head
  `36fd0a90230e4e8166f67248ba97b8fb6440d024`, tree
  `d0c723b75cf214d4e6cac23d152638d070783fe2`. All 247 Codex tests pass. Two
  clean local builds matched byte-for-byte: schema 30,860 bytes
  (`7bd3c5392ae0db0c5baba553c233142d3d4427471f5850123eef7b87d4c8eaa4`),
  source bundle 862,769 bytes
  (`3e786ed053e0d497e809076c4ccbdaad0544c26c004b24c20c5cf6210675080b`),
  release manifest 1,152 bytes
- Platform prep branch includes current main after the Studio #98 DNS lookup
  guard merge, commit `1b5fd00189e6dcc3f3c7f1a76f4229029c9fb8ea`, tree
  `ccc876bd1e8184d29e53b4aa4bec3d2d630cfd8e`. The candidate package version is
  `1.2.0`; component tag proposal is `comic-manifest/v1.0.0`. The npm package
  allowlist contains runtime sources and notices only; tests, examples, and
  fixtures are excluded. Its offline smoke installs the local candidate
  tarball into an isolated consumer using a separate generated lock and cache,
  imports the package export, and invokes the installed `studio-comic` binary
  with only the synthetic public release fixture. The external output guard
  resolves symlinked ancestors before creating candidate outputs, and the new
  download verifier checks exact manifest bytes and the fixed asset allowlist.
  Candidate builds are deterministic and readiness is intentionally blocked
  by missing Codex publication and runtime-pin adoption.
- The Platform lock retains Ajv 8.20.0, ajv-formats 3.0.1,
  fast-deep-equal 3.1.3 (MIT), json-schema-traverse 1.0.0 (MIT), and
  require-from-string 2.0.2 (MIT). The fresh audit identified one moderate
  advisory in transitive fast-uri 3.1.7, GHSA-hrr3-gc8f-f4qj, patched in 3.1.8.
  The lock now pins 3.1.8 within Ajv's existing range; `package.json` is
  unchanged and no dependency was added. NOTICE was updated to 3.1.8
  (BSD-3-Clause); project LICENSE/NOTICE are Apache-2.0.
- After the lock update and main integration, fresh `npm audit --json` runs
  against both exact lockfiles reported zero vulnerabilities. The Codex lock
  SHA-256 is `d655c146d12f82d5583ffe3a3c9740c1716cee4158035e8db5929977e1a48721`;
  the Platform lock SHA-256 is
  `ef90ff0593d91ed26980629ce896ac08294281ed2521db01d7e19ad89b5d87bd`.
  `npm ls --depth=1` confirms the installed Platform tree matches the lock.
  Re-run both audits on the exact post-merge release heads before publication.

## Evidence to bind to an exact head

- Codex publication: exact approved source commit and `contract/comic-manifest/v1.0.0` tag target; immutable release status; fresh downloads of schema, source bundle, and release manifest; declared and observed transport media types recorded separately; byte size and SHA-256 for each download.
- Platform candidate: source commit, `comic-manifest/v1.0.0` component tag proposal, package version 1.2.0, source archive/package/lock/API inventory/contract locks, and artifact-manifest identities.
- Verification: Codex 247/247 tests and CI run 17 on Node 22/24; Platform
  699/699 tests, offline Comic Manifest conformance 324/324 with 29 fixtures
  unchanged, and CI run 73 on Node 22/24; two clean builds per repository
  compared byte-for-byte; isolated local-tarball consumer import and installed
  CLI invocation; fresh zero-finding audits of both exact lockfiles;
  LICENSE/NOTICE and third-party notice review.
- After a future approved Platform publication, download the complete asset set
  into a new directory and run
  `node scripts/verify-comic-manifest-downloads.mjs /path/to/trusted-build-manifest.json /path/to/fresh-downloads`.
  The trusted manifest must be the separately retained exact local build output.
  The verifier checks the downloaded manifest bytes, exact asset allowlist,
  regular files, declared media type, size, and SHA-256; it never extracts an
  archive. Preserve GitHub's observed transport MIME as separate evidence.
- Approval: owner decision attached to the exact merged Codex and Platform artifact identities, plus any required independent reviewer findings. The Issue 98 acceptance at Platform source head `97dcd990e87bd0368ddcbecf66d1a6718bc7629e`, recorded in chat at `2026-10-07T19:15:38Z`, applies only to its reviewed proposed goldens/catalog/oracle bytes. It is not a GitHub review or release approval.

## Candidate status and blocker

The local release builder and lock use `candidate: true` until Codex's tag and
assets have been published and independently verified. The checker requires
both lock and nested publication statuses to say `published`, alongside the
immutable verification evidence. Platform's readiness
checker must return blocked while publication is absent, the runtime schema pin
is still an unreleased source reference, or an exact published tuple differs.
After Codex publication, Platform must adopt the exact downloaded tuple and
regenerate the validator from the downloaded schema before a final Platform
artifact build. Do not mark readiness or publication complete based on draft
assets, generated files, local hashes, or source links.

No new runtime dependencies are planned. The lockfile-only package version
change must leave Ajv, Ajv formats, and their transitive locked packages
unchanged. Final audit evidence must be fresh and tied to the exact lockfile;
an unavailable audit service is an unresolved gate, not a clean result.
