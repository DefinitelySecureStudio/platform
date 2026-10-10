# Platform Comic Manifest v1.0.0 publication verification

**Status: published and verified.** The immutable public release is [Comic Manifest Platform v1.0.0](https://github.com/DefinitelySecureStudio/platform/releases/tag/comic-manifest/v1.0.0).

| Field | Verified value |
| --- | --- |
| Repository | `DefinitelySecureStudio/platform` (public) |
| Tag | [`comic-manifest/v1.0.0`](https://github.com/DefinitelySecureStudio/platform/releases/tag/comic-manifest/v1.0.0) |
| Source commit | [`f0672d90a47473da6a27614cad07abc175546d67`](https://github.com/DefinitelySecureStudio/platform/commit/f0672d90a47473da6a27614cad07abc175546d67) |
| Source tree | `b876a434e5f557d88d254cd1e75a8121f23c4ba3` |
| Published | `2026-10-10T13:46:16Z` |
| Public download verification | `2026-10-10T13:46:51.832250+00:00` |
| Draft / prerelease / immutable | `false` / `false` / `true` |
| Repository immutable-release setting | Enabled; owner enforcement is off. No setting was changed. |

GitHub reported the exact release title, tag, target commit, published state, and `immutable: true`. The tag ref resolves to the approved source commit. The owner approved the exact source identity and eight asset tuples before publication; the detached packet verifier matched the record and bytes. That verifier does not authenticate the identity of the person who wrote the approval record.

Every public asset below was downloaded over unauthenticated HTTPS. Each request returned HTTP 200; downloaded size and SHA-256 match the approved packet. The declared media type is from the artifact manifest. GitHub upload metadata and public download response types are shown separately.

| Asset | Bytes | SHA-256 | Declared media type | GitHub upload type | Public download type |
| --- | ---: | --- | --- | --- | --- |
| [comic-manifest-v1.0.0.source.tar.gz](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.source.tar.gz) | 491339 | `b383cee702b4ceba0c4090bceee0c2f6c451bce18c148162543b4e1316226501` | `application/gzip` | `application/x-gtar` | `application/octet-stream` |
| [comic-manifest-v1.0.0.package.tgz](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.package.tgz) | 225334 | `98f9ad51546620a2197672b2bfd21e6bc31f72b274dc56bb3c50590edfe493ec` | `application/gzip` | `application/x-gtar` | `application/octet-stream` |
| [comic-manifest-v1.0.0.package-lock.json](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.package-lock.json) | 3149 | `ef90ff0593d91ed26980629ce896ac08294281ed2521db01d7e19ad89b5d87bd` | `application/json` | `application/json` | `application/octet-stream` |
| [comic-manifest-v1.0.0.sdk-contract-lock.json](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.sdk-contract-lock.json) | 7588 | `6b4b515cc606f2c50b1baead50faaddd3d87d3a1d7b2c9b14e4170e36776dfab` | `application/json` | `application/json` | `application/octet-stream` |
| [comic-manifest-v1.0.0.context-builder-contract-lock.json](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.context-builder-contract-lock.json) | 1366 | `297dfa1e7e1e89b63eba0df5d3e012d6243f449bdcddc9e9e34714e786f7e595` | `application/json` | `application/json` | `application/octet-stream` |
| [comic-manifest-v1.0.0.contract-lock.json](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.contract-lock.json) | 2678 | `d74950fc19669f1187aca54669b80f32c332685ef4f3a4a8361c4a9dd1a12e7a` | `application/json` | `application/json` | `application/octet-stream` |
| [comic-manifest-v1.0.0.api-v1.json](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.api-v1.json) | 1317 | `5f3d3e069a99f3533fb17d795d636cd9960c67ebd0be925d063652d3cfb71238` | `application/json` | `application/json` | `application/octet-stream` |
| [comic-manifest-v1.0.0.manifest.json](https://github.com/DefinitelySecureStudio/platform/releases/download/comic-manifest/v1.0.0/comic-manifest-v1.0.0.manifest.json) | 6159 | `7e01965f6b7f2ba341073d3854185f46a95a3ed13af3862fb26f656839e4f1d6` | `application/json` | `application/json` | `application/octet-stream` |

GitHub recorded `application/x-gtar` for the two gzip archives at upload and `application/octet-stream` for every public download. JSON assets were uploaded as `application/json`; their public downloads also returned `application/octet-stream`. These transport types do not change the manifest-declared type or release bytes.

The additive Platform package remains version `1.2.0` and private; it was not published to npm. SDK and Context Builder lock files are historical compatibility snapshots, not republications of earlier releases. This follow-up documentation and proof record do not change the immutable release assets or source commit.

The machine-readable proof is [`release/comic-manifest-v1.0.0-publication-proof.json`](../release/comic-manifest-v1.0.0-publication-proof.json). Epic #101 receives this verified release identity alongside the API/CLI and adapter limits, synthetic conformance evidence, provenance, and production-trust and approval boundaries described in the [release guide](comic-manifest-release.md).
