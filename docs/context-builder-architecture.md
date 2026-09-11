# Context Builder implementation outline

Issue #75 design candidate, not an implemented API. The governing cross-repository
design is [Studio Context Builder architecture](https://github.com/DefinitelySecureStudio/studio/blob/main/context-builder/ARCHITECTURE.md);
local decisions are in [ADR 0008](adr/0008-context-builder-pipeline.md).
Public function names and request serialization remain subject to the Codex
contract work tracked in [Studio #76](https://github.com/DefinitelySecureStudio/studio/issues/76).
All task numbers in this outline refer to Studio issues.

## Proposed module seams

| Seam | Responsibility | Must not do |
| --- | --- | --- |
| Request validator | Exact prompt/version, allowed policy/source forms, limits, time | Read sources or trust an allow flag |
| Preparation verifier | Authenticate approved scope, purpose, caller, target, time/revocation | Issue its own human approval |
| Source readers | Read only verified-scope pinned artifacts; enforce bounds and integrity | Clone repositories, follow branches or infer credentials |
| Normalizer | Valid UTF-8 text/JSON → exact classified source/fragment candidates | Execute source instructions or establish truth |
| Selector | Eligibility/conflict checks before versioned deterministic ranking | Rank unauthorized candidates or invent facts |
| Assembler | Required/optional slot budgets, manifest/source identities and validity | Lower classification or silently truncate meaning |
| Lifecycle/store | Optional scoped storage and replay under revalidated permission | Renew approval because bytes are cached |
| Evidence projection | Restricted lineage versus public opaque attestation | Publish private source IDs/paths/hashes |
| Facade | Coordinate stages and cancellation; return prepared result | Use a model, publish, self-authorize or orchestrate downstream builds |

Pure core inputs include normalized bytes/candidates, exact prompt slot
definitions, explicit evaluation time and IDs, eligibility/ranking/assembly
versions and byte limits. Identical inputs produce identical semantic output.
Operational duration and transport telemetry are recorded separately from the
deterministic package. Token estimates, if enabled, must declare estimator
version; bytes and model tokens are not interchangeable.

The async facade may call only configured policy/source/store/audit adapters.
Caller cancellation prevents new steps and reaches cooperative adapters. No
hidden retries or fallbacks occur. Exact failure schema, continuation behavior
and required-audit gate are finalized under #76 before runtime implementation.

## Existing contracts and gaps

The [v1 contract lock](../release/contract-lock.json) pins the five immutable
Codex contracts at `62e78b606986988518b9dc502c25ae1cd189684a`.
Reuse Prompt Definition slot constraints and Context Package source/section/
manifest/reference/use-authorization semantics. Bind through the existing
Prompt SDK public boundary. Provider execution, structured response validation
and execution provenance remain downstream responsibilities.

Neither Context Package nor execution provenance defines pre-read preparation
grants, authenticated source readers, normalized candidate IDs, continuity/
conflict selection, Builder budget decisions, replay keys or public/private
Builder audit records. These are explicit #76 contract gaps, not fields to add
unilaterally to closed released schemas.

The released context authorization names a prepared instance. A preparation
grant precedes that instance and is distinct. The verified production policy
provider must be chosen/configured outside source data; tests use a deliberately
synthetic verifier whose decisions cannot be mistaken for production approval.

## API sketch and downstream contract

Conceptual facade:

```text
buildContext(explicitRequest, { preparationVerifier, sourceReaders,
  optionalStore, auditSink, signal })
  -> prepared package/reference + scoped report + evidence handle
```

Conceptual pure operations: validateBuildRequest, normalizeSources,
selectCandidates, assemblePackage and verifyReplay. These names are design
sketches only: do not publish them in the SDK API inventory until reviewed.
The eventual exact request binds source versions, intent, target, classification
ceiling, preparation evidence, explicit time, deterministic IDs and budgets.

After preparation, an authorized reviewer/provider evaluates evidence and
issues separate exact-instance use authorization. Prompt SDK validates that
decision at binding time. Manifest/Orchestrator consumers receive prepared
package references, correlation identities and approved safe evidence handles;
this epic defines no comic-manifest schema or multi-step orchestration engine.

## Verification plan

Add tests with each task, then consolidate under #85:

- Spy readers prove denied/malformed/expired scope causes zero source I/O.
- Verified artifacts reject byte corruption, unsupported formats, traversal,
  symlink escape, oversize and embedded attempts to override policy.
- Input-order permutations produce identical selection, package and identities;
  authority/continuity conflicts and empty required slots fail explicitly.
- Multibyte text/JSON budget boundaries preserve representation and classification.
- Revoked/expired scopes and cross-caller/purpose cache reuse cannot expose bytes.
- Public projections contain no private content, paths, IDs or hashes; required
  audit failure gates delivery, optional sink failure cannot become permission.
- Build → external synthetic authorization → Prompt SDK bind/render → mock
  execute demonstrates the handoff; invalid cases prove no provider invocation.

Use synthetic public snapshots and approved-private exports, fixed times,
explicit policies and offline readers. No actual Universe Bible, Lore dataset,
production signer/store or paid service is needed to demonstrate v1 conformance.
Their later onboarding still requires rights/access, trust, retention and
security review. No runtime or data-access authority is created by this document.
