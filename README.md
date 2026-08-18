# Definitely Secure Studio Platform

Production software for the Definitely Secure Studio creative toolchain.

> [!NOTE]
> The first runtime capability uses dependency-free Node.js ESM. Runtime choices
> are recorded in repository-local architecture decisions as production
> capabilities are added.

## Responsibility

`platform` is the authoritative home for production software that powers
Definitely Secure Studio. Its intended scope includes:

- orchestration and production runtimes;
- context-builder implementations;
- manifest and release tooling;
- semantic indexing and search;
- production automation and integrations; and
- deployable services, applications, and their tests.

Stable, implementation-neutral contracts belong in `codex`. Experimental
agents, prompts, validators, and prototypes belong in `lab`. Public creative
canon belongs in `universe`; private or unrevealed world-building belongs in the
private `lore` repository.

The organization-wide ownership model is defined in the
[`studio` repository architecture](https://github.com/DefinitelySecureStudio/studio/blob/main/ARCHITECTURE.md).

## Constitutional alignment

This repository adopts the Definitely Secure Studio Constitution v1.0.0. See
[CONSTITUTION_CONFORMANCE.md](CONSTITUTION_CONFORMANCE.md) for the exact
reference, assessed revision, checklist evidence, findings, and review triggers.

## Content boundary

This is a public, content-neutral software repository. Do not commit:

- proprietary lore or unrevealed story details;
- unpublished canon, private character history, or private production context;
- production prompt instances containing private context;
- credentials, tokens, personal data, or confidential communications; or
- brand or creative source assets owned by another repository or asset store.

Examples, fixtures, logs, snapshots, and tests must use synthetic or already
public data. Production software may consume versioned public canon or a minimal
approved private context export at runtime, but must not persist that material
in source control, logs, build artifacts, or test fixtures.

## Repository layout

| Path | Purpose |
| --- | --- |
| [`src/`](src/) | Production application and library code |
| [`tests/`](tests/) | Automated tests and content-neutral fixtures |
| [`automation/`](automation/) | Build, release, maintenance, and operational automation |
| [`docs/`](docs/) | Platform architecture and operational documentation |
| [`examples/`](examples/) | Synthetic, runnable public-interface examples |
| [`.github/`](.github/) | Contribution and repository workflow templates |

## Development

Node.js 22 or newer is required. The initial Prompt SDK converts validated
Prompt Definition v1 documents into a deterministic, provider-neutral rendered
prompt. See [the renderer contract and usage guide](docs/prompt-renderer.md).

```sh
npm test
node examples/prompt-renderer.mjs
```

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Report
security vulnerabilities through the private process in
[SECURITY.md](SECURITY.md), not a public issue.

## License

Except where otherwise noted, original work in this repository is licensed
under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for attribution and
important boundaries.

The license does not grant rights to Definitely Secure Studio names, the Prompt
Mark, wordmarks, logos, other brand assets, or proprietary creative material.
Third-party material remains subject to its own terms. Examples and fixtures
must be synthetic, properly licensed, or already public.
