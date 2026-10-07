# Comic Manifest v1 verification record — Studio #99

Status: release preparation candidate; no tag, release, or npm package has been
published. The source branches are still under preparation review. This checklist
records what is verified locally and what must be reverified against the exact
post-merge candidate. It does not convert a successful test, AI review, draft
PR, or owner acceptance of the Issue 98 golden packet into release approval.

## Preparation evidence — 2026-10-07

- Codex prep branch `codex/issue-99-release-prep`, head
  `edef7684d07f7b1f53ca7b077b521077a0a164d4`, tree
  `87af93e4d96b603387dbcbfad87e7c7cd67f2bea`. All 246 Codex tests pass. Two
  clean local builds matched byte-for-byte: schema 30,860 bytes
  (`7bd3c5392ae0db0c5baba553c233142d3d4427471f5850123eef7b87d4c8eaa4`),
  source bundle 858,401 bytes
  (`793256d94b5b87a00d8cdee957d4784fcf40aeff87fc6da66bff184764b5dd76`),
  release manifest 1,152 bytes
  (`c8d8edd1d0d2db652bd41e2e05f58304e6859c2bc0cdec250966dd4c89b60ed8`).
- Platform prep branch is based on Issue 98's merged tree
  `e50bffc8aee795cf0ccb0c2dcab881cc943c3656`. The candidate package version is
  `1.2.0`; component tag proposal is `comic-manifest/v1.0.0`. The npm package
  allowlist contains runtime sources and notices only; tests, examples, and
  fixtures are excluded. Its extracted CLI validation uses only the synthetic
  public release fixture. Candidate builds are deterministic and readiness is
  intentionally blocked by missing Codex publication and runtime-pin adoption.
- The Platform lock retains Ajv 8.20.0, ajv-formats 3.0.1,
  fast-deep-equal 3.1.3 (MIT), json-schema-traverse 1.0.0 (MIT), and
  require-from-string 2.0.2 (MIT). The fresh audit identified one moderate
  advisory in transitive fast-uri 3.1.7, GHSA-hrr3-gc8f-f4qj, patched in 3.1.8.
  The lock now pins 3.1.8 within Ajv's existing range; `package.json` is
  unchanged and no dependency was added. NOTICE was updated to 3.1.8
  (BSD-3-Clause); project LICENSE/NOTICE are Apache-2.0.
- After the lock update, fresh `npm audit --json` runs against both exact
  lockfiles reported zero vulnerabilities. `npm ls --depth=1` confirms the
  installed Platform tree matches the lock. Re-run the audit on the exact
  post-merge lock before publication.

## Evidence to bind to an exact head

- Codex publication: exact approved source commit and `contract/comic-manifest/v1.0.0` tag target; immutable release status; fresh downloads of schema, source bundle, and release manifest; declared and observed transport media types recorded separately; byte size and SHA-256 for each download.
- Platform candidate: source commit, `comic-manifest/v1.0.0` component tag proposal, package version 1.2.0, source archive/package/lock/API inventory/contract locks, and artifact-manifest identities.
- Verification: Codex tests; Platform `npm test`; offline Comic Manifest conformance with fixture snapshot; two clean Codex builds and two clean Platform builds compared byte-for-byte; extracted package API and CLI smoke flow; Node 22/24 CI results; fresh locked-dependency audit; LICENSE/NOTICE and third-party notice review.
- Approval: owner decision attached to the exact merged Codex and Platform artifact identities, plus any required independent reviewer findings. The Issue 98 acceptance at Platform source head `97dcd990e87bd0368ddcbecf66d1a6718bc7629e`, recorded in chat at `2026-10-07T19:15:38Z`, applies only to its reviewed proposed goldens/catalog/oracle bytes. It is not a GitHub review or release approval.

## Candidate status and blocker

The local release builder and lock use `candidate: true` until Codex's tag and
assets have been published and independently verified. Platform's readiness
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
