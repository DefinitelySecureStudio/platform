# Context Builder v1 release and integration guide

Context Builder v1.0.0 is published in an
[immutable Platform GitHub release](https://github.com/DefinitelySecureStudio/platform/releases/tag/context-builder/v1.0.0)
from source/tag commit `7df7ea812e0987167407a07ab48b4b7e9a33f91b`. The coordinated
[Platform preparation PR #28](https://github.com/DefinitelySecureStudio/platform/pull/28)
and [contract-adoption PR #29](https://github.com/DefinitelySecureStudio/platform/pull/29)
are merged. The Codex contract is also
[published immutably](https://github.com/DefinitelySecureStudio/codex/releases/tag/contract/context-builder/v1.0.0)
at `2301597014f6fefe8a3cf772e2e02527cda6a254`; the
[dependency lock](../release/context-builder-contract-lock.json) and
[dated contract verification record](../release/context-builder-verification.md)
retain its downloaded identities and evidence. The [Studio delivery issue #86](https://github.com/DefinitelySecureStudio/studio/issues/86)
and [Epic #5](https://github.com/DefinitelySecureStudio/studio/issues/5) are closed
after publication verification.

The Codex specification source at its immutable release commit still carries the
earlier “candidate, unreleased” heading. The current publication status is established
by GitHub release metadata, the verified contract lock and the downloaded-asset
record below; this documentation update leaves that source and all release assets
unchanged.

This guide records artifact publication, not production readiness. The containing
Platform package remains private and has not been published to npm. The release
does not grant production trust onboarding, real Lore access, canon approval or
public creative publication. The shipped CLI build/replay path remains synthetic
only; see the limits below.

The component version is Context Builder 1.0.0 (`context-builder/v1.0.0`); the
containing private Platform package advances additively to 1.1.0. Prompt SDK
renderer/processor identities remain 1.0.0. Its five immutable contract references,
Context Package schema and existing SDK public API remain unchanged. No npm
publication or repository/package visibility change is authorized by this guide.

## Quick start (Node 22 or 24)

From a reviewed checkout or verified source artifact:

```sh
npm ci
npm test
node scripts/check-context-builder.mjs
node src/context-builder/cli.js --help
node src/context-builder/cli.js build --fixture tests/fixtures/context-builder-v1.json --synthetic --authority examples/context-builder-cli/context-builder-v1-authority.json --at 2026-09-15T12:00:00Z --json
node examples/context-builder-handoff.mjs
```

These are offline public-synthetic examples with independent fixture approvals.
The last command demonstrates text and structured package→review→SDK→mock execution.
Its fixed time is for synthetic fixtures, never a production clock. The package
exposes `studio-context` when installed; direct Node invocation also works from the
source archive. Use `--output` only with the CLI's explicit protected-write consent.
Default command output does not include context bodies. See [CLI](context-builder-cli.md).

## Public API and adapters

Import `@definitely-secure-studio/platform/context-builder`. The exact supported
export inventory is [context-builder-api-v1.json](../release/context-builder-api-v1.json),
tested through the package export. Internal modules and generated validators are
not public entry points. The example's internal hash helpers are fixture setup,
not additional public Builder exports; consumers use the specified canonical identity.

| Interface | Responsibility / guide |
| --- | --- |
| `createPreparationGate(options)` | Trusted verifier, owner allowlist, readers and clock; `check`, `readSources`, `normalizeSources`, `selectSources`, `assemblePackage`, `prepareArtifact`, `replay`. [Preparation](context-builder-preparation.md) |
| `createMemorySourceBinding`, `createPublicSnapshotBinding`, `createApprovedExportBinding` | Exact byte identities; pre-bound safe readers. [Source adapter guide](context-builder-sources.md) |
| `createAuditedContextBuilder(options)` | Package-producing `build(input)` with required audit acknowledgment. [Audit and receipt adapters](context-builder-audit.md) |
| `createMemoryArtifactStore`, `comparePreparedArtifacts` | Explicit scoped retention and stable comparison; not authorization. [Lifecycle](context-builder-lifecycle.md) |
| `createContextHandoff(options)` | Independent exact-package use decision before prepare/execute. [Use-policy adapter and review flow](context-builder-handoff.md) |
| `parseBuilderJson`, `inspectBuildRequest` | Strict ingress and source-free inspection. [Authoring](context-builder-cli.md) |
| `createBuildArtifact`, `verifyBuildArtifact`, `compareBuildArtifacts`, `serializeBuildArtifact` | Protected replay envelope, integrity and stable comparison; no approval. [Authoring](context-builder-cli.md) |
| `PreparationError` | Value-free diagnostic and audit projections; do not log raw inputs/stacks. [Preparation](context-builder-preparation.md) |
| `createSyntheticPreparationVerifier`, `createSyntheticAuditSink`, `createSyntheticAttestor`, `createSyntheticUseAuthorizationProvider`, `createSyntheticFixtureBuilder` | Explicit offline fixtures only, never real production trust/signing services. |

Use the audited builder for downstream package handoff, not the lower-level gate
as a substitute for required audit. Source readers and policy verifiers are trusted
host code, never loaded from serialized requests. They must enforce their own
backend identity, cancellation, containment, byte bounds and revocation mapping.
Run the [reusable source/verifier tests](context-builder-conformance.md) with offline
fake backends before production onboarding; generic tests cannot certify a backend.

Preparation permission, reviewer approval, exact-package use authorization, public
attestation and human canon/publication authority are distinct. A hash, successful
build, cached result or synthetic allow record is not any of those permissions.

## Compatibility, deprecation and limitations

Builder contracts and implementation use independent SemVer and exact version
negotiation. Patch fixes must preserve supported semantics; additive APIs require
a minor release; incompatible identity/security/behavior changes require a major
version and explicit migration. Closed wire fields and unknown policy versions
fail, never silently downgrade. Deprecation requires owner approval, consumer
inventory, migration instructions and a dated support window. Rollback selects a
previous verified release; never move tags or overwrite artifacts.

V1 provides explicit fragment plans, UTF-8 text/JSON, deterministic explicit and
ASCII text lexical selection, whole-candidate byte budgets and host-injected
trust. No embedding/model retrieval, token estimates, multilingual lexical promise,
automatic retries/repair, live Lore, vendor SDK, production verifier/key store or
distributed transactional revocation. In-process callbacks are not sandboxed;
deadlines/cancellation cannot undo foreign effects. CLI build/replay is synthetic
only. Package validity is not truth, quality, canon or publication approval.

Historical #76–#85 guides describe the development stage they shipped. This guide
defines the additive package export. Historical fixture source pins remain valid;
runtime schema provenance now uses the verified immutable contract lock.

## Verified release record and status boundary

The Platform release page records Context Builder 1.0.0 in private Platform
package 1.1.0, exact source/tag commit
`7df7ea812e0987167407a07ab48b4b7e9a33f91b`, immutable release status, and its
artifact set. The completed [Studio issue #86](https://github.com/DefinitelySecureStudio/studio/issues/86)
records that all six implementation assets were freshly downloaded and matched
two independent builds; it also records manifest SHA-256
`2396fa21a59841aae95e3225e2f015092e0271b79b5346679d2d03e4345aec7b`. The
[release notes](https://github.com/DefinitelySecureStudio/platform/releases/tag/context-builder/v1.0.0)
and issue record include release-time source/package test results and Node 22/24
CI evidence. The original [Codex contract verification record](../release/context-builder-verification.md)
is a dated historical record of the contract publication step; it is not the
Platform implementation release record.

The published release makes the documented API and `studio-context` CLI available
as immutable artifacts. It does not publish the package to npm or change repository
visibility. Production trust verifiers, real private-source integrations, secure
storage deployment and downstream use authorization still require their own
reviewed implementations and operational approval. The synthetic CLI, a successful
build, an immutable artifact or a closed tracking issue does not grant those
permissions. Do not repeat or overwrite the v1 publication steps; future versions
need a separately reviewed version-aware release process.

## Epic #6/#7 handoff

The immutable Codex contract and Platform implementation release tuples,
API/adapter guides, mock reference flows, conformance evidence and limitations are
recorded in the v1 release artifacts. Comic Manifest/Orchestrator consumers must pin
these identities, bind declared slots, obtain fresh preparation and use decisions,
and preserve protected evidence. This release adds no orchestration, private source
access or downstream publication authority.
