# Definitely Secure Studio Platform

Context Builder v1 [release/integration guide](docs/context-builder-v1.md): public
API/CLI candidate, compatibility, adapter guides and owner-gated publication.

Production software for the Definitely Secure Studio creative toolchain.

See the [Prompt SDK v1 API/release guide](docs/prompt-sdk-v1.md) for quick start,
compatibility, limitations and release readiness.

The [reference prompt library](examples/reference-prompts/README.md) demonstrates
offline end-to-end v1 flows with reviewed golden fixtures.

Use the [Prompt CLI](docs/prompt-cli.md) to validate, inspect, render, execute
synthetic tests and validate structured outputs.

> [!NOTE]
> Platform uses Node.js ESM with repository-local architecture decisions for
> runtime and dependency choices.

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

Node.js 22 or newer is required. The Prompt SDK validates and lints Prompt
Definition v1 documents, then converts valid definitions into deterministic,
provider-neutral rendered prompts. It can execute those prompts through a
provider-neutral synchronous adapter boundary with explicit capability
negotiation, provenance, cancellation, and normalized failures. See the
[validation](docs/prompt-validation.md), [rendering](docs/prompt-renderer.md),
and [execution](docs/provider-execution.md) guides.
Prepared, authorized packages use the explicit
[Context Package v1 integration](docs/context-packages.md), without retrieval or
selection inside the SDK.
The unreleased Context Builder development pipeline provides
[verified source normalization](docs/context-builder-sources.md) and
[deterministic selection](docs/context-builder-selection.md), and
[budgeted package assembly](docs/context-builder-assembly.md) behind a separate
preparation gate, with [protected lifecycle and replay](docs/context-builder-lifecycle.md).
[Required audit and independent synthetic attestations](docs/context-builder-audit.md)
provide the development build-result boundary. The
[SDK review/use handoff](docs/context-builder-handoff.md) supports offline text/JSON
mock execution. The [offline Builder authoring CLI](docs/context-builder-cli.md)
adds explicit validate/plan/build/verify/replay workflows; immutable release remains pending.
The [Builder conformance suite](docs/context-builder-conformance.md) consolidates
security coverage, reusable adapter/verifier tests and reviewed offline references.
The [prompt registry](docs/prompt-registry.md) discovers validated definitions
from approved filesystem/repository locations and resolves exact versions with
explicit lifecycle behavior.
Successful JSON execution results use the
[Structured Output v1 processor](docs/structured-output.md) for exact raw
identity, independent parsing/schema validation, and typed normalized results.

```sh
npm ci
npm test
npm run validate:prompt -- path/to/prompt.json
node examples/prompt-renderer.mjs
node examples/prompt-registry.mjs path/to/approved/prompts
node examples/context-package.mjs
node examples/structured-output.mjs
```

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change. Report
security vulnerabilities through the private process in
[SECURITY.md](SECURITY.md), not a public issue.

## License

Except where otherwise noted, original work in this repository is licensed
under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) and
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES) for attribution, dependency licenses,
and important boundaries.

The license does not grant rights to Definitely Secure Studio names, the Prompt
Mark, wordmarks, logos, other brand assets, or proprietary creative material.
Third-party material remains subject to its own terms. Examples and fixtures
must be synthetic, properly licensed, or already public.

The [Comic Manifest contract consumer proof](docs/comic-manifest-contracts.md)
checks the unreleased Codex candidate against the released SDK using offline
synthetic fixtures; it does not add a Manifest runtime or production dependency.

The unreleased [Comic Manifest validation API](docs/comic-manifest-validation.md)
provides bounded raw JSON parsing and record-local validation. Passing validation
does not establish current authorization, cross-record integrity or publication readiness.
