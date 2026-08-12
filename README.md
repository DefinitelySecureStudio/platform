# Definitely Secure Studio Platform

Production software for the Definitely Secure Studio creative toolchain.

> [!NOTE]
> This repository is an early, language-neutral scaffold. Runtime and package
> choices will be made through repository-local architecture decisions as the
> first production capabilities are defined.

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
| [`.github/`](.github/) | Contribution and repository workflow templates |

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Report
security vulnerabilities through the private process in
[SECURITY.md](SECURITY.md), not a public issue.

## License status

No open-source license has been selected yet. Until the licensing decision in
[studio issue #31](https://github.com/DefinitelySecureStudio/studio/issues/31)
is completed and a license is added, the repository contents remain all rights
reserved. Public visibility does not grant permission to use, copy, modify, or
distribute the software.

© 2026 Definitely Secure Studio. All rights reserved.
