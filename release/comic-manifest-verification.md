# Comic Manifest v1 verification record — Studio #99

Status: release preparation candidate; no tag, release, or npm package has been
published. The source branches are still under preparation review. This checklist
records what is verified locally and what must be reverified against the exact
post-merge candidate. It does not convert a successful test, AI review, draft
PR, or owner acceptance of the Issue 98 golden packet into release approval.

## Preparation evidence — 2026-10-07

- Codex prep branch `codex/issue-99-release-prep`, head
  `7a13c5ded2c902da77355fdd606ec8a5337279fc`, tree
  `d6fa8ec1f5ac5bfa50d72329467625621bc66aa3`. All 246 Codex tests pass. Two
  clean local builds matched byte-for-byte: schema 30,860 bytes
  (`7bd3c5392ae0db0c5baba553c233142d3d4427471f5850123eef7b87d4c8eaa4`),
  source bundle 858,201 bytes
  (`4b891bea075a6fc0daf1bf14e8462a0ca858c11444f1277b6363b4f54c0b32cb`),
  release manifest 1,152 bytes
  (`554eacb20db42e49d96a7550c8d4bda6f41ac6041dd9f11344b793b2a8def43e`).
- Platform prep branch is based on Issue 98's merged tree
  `e50bffc8aee795cf0ccb0c2dcab881cc943c3656`. The candidate package version is
  `1.2.0`; component tag proposal is `comic-manifest/v1.0.0`. The npm package
  allowlist contains runtime sources and notices only; tests, examples, and
  fixtures are excluded. Its extracted CLI validation uses only the synthetic
  public release fixture. Candidate builds are deterministic and readiness is
  intentionally blocked by missing Codex publication and runtime-pin adoption.
- The lockfile contains the existing pinned versions only: Ajv 8.20.0 and
  ajv-formats 3.0.1, plus fast-deep-equal 3.1.3 (MIT), fast-uri 3.1.7
  (BSD-3-Clause), json-schema-traverse 1.0.0 (MIT), and require-from-string
  2.0.2 (MIT). No dependency was added or upgraded. NOTICE review found the
  existing fast-uri entry said 3.1.5 while the lock says 3.1.7; the entry is
  corrected. The projects retain Apache-2.0 LICENSE/NOTICE files.
- `npm audit --json` could not reach `registry.npmjs.org` (`ENOTFOUND`), so a
  fresh advisory audit is unresolved and is a release gate. `npm ls --depth=1`
  confirmed the installed dependency versions match the lockfile; that is not
  a substitute for the audit.

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
