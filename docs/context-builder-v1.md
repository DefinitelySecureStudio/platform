# Context Builder v1 release and integration guide

Studio #86 **release preparation**, awaiting owner merge, Codex publication and
verified adoption. The package API is a review candidate, not an assertion that
production artifacts have been published. #86 and Epic #5 must remain open.

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
| `createPreparationGate(options)` | Trusted verifier, owner allowlist, reader inventory, explicit clock; check/read/normalize/select/build methods. [Preparation](context-builder-preparation.md) |
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
defines the additive package export; their source pins remain provisional until
the following release gates complete.

## Owner-reviewed publication sequence

1. Review/merge coordinated Codex and Platform preparation PRs. Confirm #75–#85
   completion, Constitution 1.0.0 at `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`,
   Apache-2.0 LICENSE/NOTICE, locked MIT dependency notices, public-only fixture
   and artifact contents, all local and Node 22/24 CI tests. Run `npm audit`;
   resolve findings or obtain an explicit documented owner exception.
2. Build, owner-approve and publish the Codex `contract/context-builder/v1.0.0`
   release per its checklist. Verify immutable status, tag target, draft=false,
   and all downloaded schema/bundle/manifest bytes against the reviewed build.
   Do not republish any old Context Package or SDK contract release.
3. In a follow-up adoption PR, add `release/context-builder-contract-lock.json`
   containing that downloaded manifest plus `publication: { immutable: true,
   verified_at, release_url }`. Record the exact verified commit/URI/type/size/hash
   and online evidence. Update generator provenance to that commit and the header
   `// Generated from Codex COMMIT; released immutable contract.`; regenerate all
   three validators from downloaded verified schemas, never edit generated code.
   Preserve exact schema digests and the original SDK lock. Historical fixture
   pins remain valid historical evidence, not release provenance.
4. `node scripts/check-builder-release.mjs` must pass (currently intentionally
   blocked). This is an offline consistency check, not online publication proof
   or a substitute for owner approval. Merge adoption and require CI before build.
5. From clean merged main run `node scripts/build-builder-release.mjs /absolute/new/output`.
   Build twice, compare every byte, inspect source/package file lists and licenses,
   install the package in a clean temporary directory, and run packaged tests,
   examples, public imports and CLI. Record source commit, audit/tests, approval
   and workflow links. `--candidate` supports rehearsal only: it marks artifacts
   nonpublishable and can omit the unavailable Builder lock. Never upload those
   rehearsal artifacts as a final release.
6. Create the owner-approved draft `context-builder/v1.0.0` at the exact merged
   build commit; attach the five assets and manifest. Download into a new directory
   and run `node scripts/verify-builder-downloads.mjs /trusted/build/context-builder-v1.0.0.manifest.json /download/directory`.
   Publish once, then independently verify immutable=true, draft=false, exact
   tag commit and re-download/reverify all six assets. The byte verifier does
   not query GitHub, establish approval, authenticate a manifest or prove immutability.
7. Retain verification evidence in Studio #86 and close it and Epic #5 only after
   actual publication verification. No closing keyword belongs on preparation PRs.

## Epic #6/#7 handoff

Deliver exact contract and implementation release tuples, downloaded verification
evidence, dependency/API inventories, mock reference flows, security coverage map,
limitations and adapter onboarding requirements. Comic Manifest/Orchestrator
consumers must pin these identities, bind declared slots, obtain fresh preparation
and use decisions and preserve protected evidence. This release adds no orchestration,
private source access or downstream publication authority.
