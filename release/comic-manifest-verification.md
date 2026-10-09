# Comic Manifest v1 verification record — Studio #99

## Current state — 2026-10-09

Codex Comic Manifest 1.0.0 is published as an immutable GitHub release. The
Platform #42 preparation PR is merged; this branch prepares the separate Platform
adoption of the exact published Codex tuples. The Platform package stays private,
its API inventory remains `candidate-unpublished`, and no Platform tag/release,
asset upload, npm publication, visibility/security change, or Issue/Epic closure
has occurred.

### Published Codex identity

- Repository: `DefinitelySecureStudio/codex` (public).
- Source/tag target: commit `12e437e30328a3bb9cd2d15e6307a70b4b7e0e2a`, tree
  `cae3cbe3ae5945b53d544ef5be7dd19941e13689`.
- Tag: `contract/comic-manifest/v1.0.0`; GitHub ref resolves directly to the exact
  commit above.
- Release: [Comic Manifest v1.0.0](https://github.com/DefinitelySecureStudio/codex/releases/tag/contract/comic-manifest/v1.0.0),
  published `2026-10-09T16:00:19Z`; API verified `draft: false`,
  `prerelease: false`, `immutable: true`.
- Repository immutable-release policy was read as `enabled: true`; no security
  setting was changed.
- Owner A4 approval covered this exact Codex commit, tag and three asset tuples.
  It is distinct from and not inferred from the A3 AI-review exception or the
  Issue 98 golden acceptance.

| Asset | Declared media type | Bytes | SHA-256 | GitHub asset metadata | Public download |
|---|---|---:|---|---|---|
| `comic-manifest-v1.0.0.schema.json` | `application/schema+json` | 30,860 | `7bd3c5392ae0db0c5baba553c233142d3d4427471f5850123eef7b87d4c8eaa4` | `application/json` | HTTP 200, `application/octet-stream` |
| `comic-manifest-v1.0.0.bundle.json` | `application/json` | 865,650 | `bb131a7dbb96692172b4e44b56a272d041309e53b136433cc71a24c8d1b934de` | `application/json` | HTTP 200, `application/octet-stream` |
| `comic-manifest-v1.0.0.manifest.json` | `application/json` | 1,152 | `56bba6d990c429384e16d8aa49af99b3a25ca8733efa96b5681be5932dcba878` | `application/json` | HTTP 200, `application/octet-stream` |

All three assets were freshly downloaded from the draft before publication and
then again through both authenticated `gh release download` and unauthenticated
public HTTPS URLs after publication. Each download matched its approved local
counterpart byte-for-byte and by SHA-256. The table keeps contract-declared
content type, GitHub asset metadata content type, and public HTTP download content
type separate; no MIME value was copied between those layers.

### Platform adoption scope

The current Platform main base is `9476aeb27246230d982bd8cfde7cfc0d82939de7`
(tree `683e2dd392c93f1e55502edeb8aeed54c46ba3a3`), containing merged preparation
PR #42. This adoption changes the independent Comic Manifest contract lock,
runtime schema pin, generated validator provenance, readiness checks, tests and
release/constitution documentation. The released SDK and Context Builder locks,
package contents and assets remain unchanged. Reviewed Comic Manifest fixture,
golden, catalog, oracle and source bytes remain unchanged; the published schema
is byte-identical to the already reviewed fixture schema.

`package.json` remains `1.2.0` and `private: true`; no package is published. The
current readiness check confirms only upstream Codex publication/adoption. Even
when that check passes, the Platform artifact is still a candidate and requires
independent PR review, merge, and exact-head CI. After merge, build once from the
exact merge commit into a new external directory and generate a detached owner
approval packet from that exact eight-file set. Its manifest records candidate,
approval, and publication facts as build-time provenance, not live status. The
owner must separately approve that packet's exact source commit/tree/tag and all
eight filenames, sizes, and hashes. The read-only verifier rejects missing,
changed, extra, or symlinked files and does not rewrite the packet or artifacts.
After approval, publish those exact files unchanged; rebuilding after approval
would create a different set and require a new approval.

### Historical preparation and checks

- Codex source was built twice from the exact merged source commit before release;
  the two sets matched byte-for-byte. Codex `npm test` passed 248/248, and CI run
  [19](https://github.com/DefinitelySecureStudio/codex/actions/runs/37688411471)
  passed on the same source tree.
- The Codex source bundle contains 130 tracked public source entries including
  `LICENSE` and `NOTICE`; its credential-pattern scan found no matches.
- Platform #42 prepared the additive package/API candidate and passed its exact
  head CI. Its previous pre-merge Codex tuples are superseded by the published
  tuples above; this adoption updates those locks deliberately.
- Fresh `npm audit --json` on 2026-10-09 reported zero vulnerabilities for the
  unchanged Platform lock SHA-256 `ef90ff0593d91ed26980629ce896ac08294281ed2521db01d7e19ad89b5d87bd`.
  The raw report is retained at the task-level `prepared-artifacts/audit-evidence/platform-npm-audit-2026-10-09.json`
  (SHA-256 `b966435ec31b7d61483d849d853d936f86183d654661604e532f1be934735a79`).
- Platform dependencies remain Ajv 8.20.0, ajv-formats 3.0.1, fast-deep-equal
  3.1.3, fast-uri 3.1.8, json-schema-traverse 1.0.0, and require-from-string
  2.0.2. No dependency is added by this adoption. `NOTICE` attributes fast-uri
  3.1.8 under BSD-3-Clause and the other locked runtime packages under MIT;
  project `LICENSE` and `NOTICE` remain Apache-2.0.
- Existing review acceptance for Issue 98 at source head
  `97dcd990e87bd0368ddcbecf66d1a6718bc7629e`, recorded
  `2026-10-07T19:15:38Z`, applies only to its proposed golden/catalog/oracle
  bytes. It is neither a submitted GitHub review nor A4 release approval.

## Remaining gates

The parent independently reviews and merges this adoption PR after its exact-head
CI passes. Then build and inspect the Platform source/package, lock and artifact
manifest from the merged source, refresh the locked-dependency audit, and request a
separate owner decision naming the exact Platform artifacts. Platform publication
and Issue #99/Epic #6 closure remain blocked until that later decision and fresh
public-download verification. No human technical review of the Codex release assets
is claimed; the owner approval authorizes only the named Codex publication.
