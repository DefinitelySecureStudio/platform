# Context Builder contract publication verification

Verified 2026-09-17T02:17:14Z for Studio #86. This records actual Codex publication,
not Platform implementation publication or owner approval of this adoption PR.

- Owner-reviewed preparation: [Codex #12](https://github.com/DefinitelySecureStudio/codex/pull/12)
  and [Platform #28](https://github.com/DefinitelySecureStudio/platform/pull/28), both merged.
- Exact Codex source/tag commit: `2301597014f6fefe8a3cf772e2e02527cda6a254`.
- [Release](https://github.com/DefinitelySecureStudio/codex/releases/tag/contract/context-builder/v1.0.0):
  ID `390391225`, `contract/context-builder/v1.0.0`, published `2026-09-17T02:17:03Z`.
- GitHub release API reported `immutable: true`, `draft: false`; Git ref API
  resolved the tag directly to that commit. Repository immutable releases enabled.
- 111 Codex tests passed on the merged commit. Two independent artifact builds
  were byte-identical. Draft downloads and fresh published downloads each matched
  all three built files byte-for-byte. Source bundle file identities also verified.
- Platform preparation [Node 22/24 CI](https://github.com/DefinitelySecureStudio/platform/actions/runs/35173606191)
  succeeded. Prior local and packaged suites each passed 401 tests; dependency
  audit reported zero findings. Adoption has its own PR test/CI evidence.

| Download | Bytes | SHA-256 |
| --- | ---: | --- |
| `context-builder-v1.0.0.schema.json` | 20802 | `4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3` |
| `context-builder-v1.0.0.bundle.json` | 607530 | `3bba06db5c2568c787a5352c15a12f4f736e5e5d4a44ff2bc028910a022aada7` |
| `context-builder-v1.0.0.manifest.json` | 1162 | `360fd99c4fe49e6ae13292087b213bd36b418964a898dc643a4edb3afe8b0225` |

The manifest is retained verbatim as the dependency lock except for the added
verified `publication` field. All three Builder validators are regenerated from
the published schema and the downloaded, already released Context Package schema
(`d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617`).
Only their source-provenance header changes; generated validation code is identical.
The old five-contract SDK lock, released Context Package bytes and historical
fixture/golden locks are unchanged. No npm publication or visibility changes.

Remaining: owner reviews/merges adoption; CI passes; build twice from that merged
Platform commit, verify package tests and all artifacts; publish the owner-reviewed
implementation release and verify fresh downloads, immutable status and exact tag
commit. Only then close Studio #86 and Epic #5. Offline readiness is not approval.
