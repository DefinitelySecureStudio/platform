# Constitution conformance record

## Constitutional alignment

- Constitution: [Definitely Secure Studio Constitution v1.0.0](https://github.com/DefinitelySecureStudio/studio/tree/constitution/v1.0.0)
- Constitution tag: `constitution/v1.0.0`
- Constitution commit: [`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`](https://github.com/DefinitelySecureStudio/studio/commit/a9cc8a503aa30e17820edc62ac95f7cbe10e0564)
- Status: `Conforming candidate` (effective after accountable-owner approval and merge of this implementation pull request)
- Assessed scope: the merged Platform through issue #67 plus Structured Output v1 contract integration, exact raw/schema verification, parse-once normalization, independent schema validation, retention/provider-constraint provenance, explicit failures, tests, example, documentation, and ADR in the issue #68 candidate diff
- Excluded scope: schema publication/remote retrieval, repair, restricted raw storage/access, business-semantic validation, downstream authorization, real providers/credentials, retry/routing, streaming, agents, deployments, production data, builds, and releases
- Accountable owner: [`@andrewperis`](https://github.com/andrewperis), Platform maintainer
- Assessment base revision and date: `d1d0aa3b6ff69a64d1afbad516a63d2512484170`; issue #68 candidate diff assessed 2026-08-20
- Checklist revision: `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Applicable profiles: universal; repository and production-system; agent and automated-workflow; release
- Evidence: this record; exact compiled contract schema, independent synthetic schema and raw/normalized fixtures, 67 Prompt SDK tests, example, documentation, ADR, and coordinated Codex contract; GitHub settings verified 2026-08-17; Studio issue [#68](https://github.com/DefinitelySecureStudio/studio/issues/68); implementation pull requests
- Active constitutional exceptions: None
- Residual risk: all four Codex contracts are compiled from provisional exact commits until issue #72 releases immutable artifacts; callers supply approved schema bytes and enforce raw-store access/resource limits; business validation, real providers, retry/routing, and human gates remain outside this implementation
- Next review: 2026-11-20, on replacement of a provisional contract reference, addition of a storage backend or repository authentication, or before consequential provider, private-context, agent, deployment, or release use and on Constitution, authority, contract, data, dependency, visibility, owner, or security change

Before merge this implementation remains a `Conforming candidate`. Owner review
and merge provide the A4 governance approval and GitHub records the exact commit.
Production-sensitive evidence must remain restricted with only a reader-safe,
non-derivable attestation in public records.

## Findings

| ID | Severity | Disposition | Evidence |
| --- | --- | --- | --- |
| PL-1 | Major | Resolved in adopting change | Automation and PR policy now make agent delegation, external policy enforcement, failure recovery, release gates, A4 approval, and byte identity prerequisites. |
| PL-2 | Major | Resolved 2026-08-17 | Secret scanning, push protection, vulnerability alerts, and Dependabot security updates were enabled. |
| PL-3 | Minor | Resolved 2026-08-17 | Undocumented Projects was disabled. |
| PL-4 | Advisory | Narrowed by this change | The deterministic renderer is assessed; provider, context-package, deployment, and release behavior remain deferred and trigger reassessment. |
| PL-5 | Major | Resolved in candidate | Rendering accepts only explicit declared values, preserves classification/provenance outside message bytes, rejects incompatible values with redacted structured errors, and produces deterministic canonical bytes and a digest. |
| PL-6 | Advisory | Open, release-blocking | Prompt Definition v1 is pinned to accepted Codex commit `bd31b6249e068d3317306afb857d68024f2929be`; replace it with the immutable released artifact from Studio issue #72 before release. |
| PL-7 | Major | Resolved in candidate | Exact compiled schema validation, semantic/compatibility checks, security linting, duplicate-key parsing, redacted diagnostics, fixtures, and CI exit behavior make malformed or unsafe prompt definitions fail before rendering/execution. |
| PL-8 | Major | Resolved in candidate | Provider-neutral preflight rejects unsupported targets, capabilities, parameters, and required extensions before invocation; one-call execution preserves exact identity and safe normalized outcomes without hidden retry, routing, or provider SDK coupling. |
| PL-9 | Major | Resolved in candidate | Registry discovery validates every approved-root definition before atomic snapshot replacement, fails duplicate identities and symlinks, exposes source digests and lifecycle, and requires explicit policy for non-exact or retired resolution. |
| PL-10 | Major | Resolved in candidate | Context binding verifies exact package/section identities, source links and versions, authorization scope/time/classification, prompt compatibility, and redacted fail-closed behavior while preserving value-free provenance through execution. |
| PL-11 | Major | Resolved in candidate | Structured processing distinguishes exact raw evidence from canonical normalized JSON, verifies immutable schemas offline, rejects malformed/schema-invalid output without repair/defaults, enforces retention, and treats provider constraints only as adapter provenance. |

## Checklist evidence

`P` means Pass and `N/A` has the stated rationale. IDs follow the pinned
checklist order.

### Assessment identity

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| I1 | P | Identity, base revision, public scaffold environment, audience, scope, and exclusions are exact. |
| I2 | P | Version, immutable tag, full commit, and checklist revision are pinned. |
| I3 | P | `@andrewperis` is accountable owner/CODEOWNER; automation proposes and the human reviews and merges. |
| I4 | P | Profiles, evidence, date, freshness, status, findings, and triggers are recorded. |
| I5 | P | Public evidence is reader-safe; future production evidence uses restricted attestations when necessary. |

### Universal profile

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| U1 | P | README, architecture, CODEOWNERS, and dependency policy identify owners and authorities for Platform, Codex, Universe, and Lore. |
| U2 | P | Platform implements but cannot redefine contracts, Canon, Lore, brand, or governance. |
| U3 | P | Updated automation policy requires explicit authority, data, tool, destination, time, budget, and escalation bounds before enablement. |
| U4 | P | Updated PR/automation controls reserve A4 gates for the accountable human. |
| U5 | P | Uncertain, risky, out-of-contract, private, or irreversible work must stop for review. |
| U6 | P | Runtime inputs, proposed release artifacts, and public Canon are separate states and authorities. |
| U7 | P | README/architecture assign reader-safe Canon to Universe and private planning truth to Lore. |
| U8 | N/A | Platform cannot promote or retcon Canon; Universe reviews proposed public records. |
| U9 | P | Private context is minimal, approved runtime data and cannot persist in source, logs, builds, or fixtures. |
| U10 | N/A | No creative generation workflow exists. |
| U11 | P | Architecture requires exact contract/input versions, commits, URIs, media types, sizes, digests, workflow identity, and attestations. |
| U12 | P | Proposed artifacts and validation are distinct from approval; missing evidence is not a pass. |
| U13 | P | Structured processing is deterministic for the same explicit request/result/schema bytes, retention, and constraint mode; parse-once validation uses no clock, randomness, host state, network, repair, or provider assertion. |
| U14 | N/A | No selected generated output or release bytes exist. |
| U15 | P | Protected Git history and required future workflow evidence provide attributable, ordered audit records. |
| U16 | P | Content boundaries, trust boundaries, secret handling, private reporting, recovery, and release controls precede implementation. |
| U17 | P | Least-privilege secrets and minimal versioned runtime inputs are mandatory. |
| U18 | P | Diagnostics and serialized errors omit raw/parsed values and schema contents; retained bodies require explicit restricted-content capture and synthetic tests assert redaction. |
| U19 | P | Execution classification follows raw and normalized representations, retention, references, fixtures, logs, artifacts, caches, and downstream use. |
| U20 | P | No provider is selected; the mock is synthetic, while real adapter/provider selection remains an explicit contractual, privacy, security, and technical review trigger. |
| U21 | P | Ajv and transitive dependencies are exact-lockfile resolved, reviewed in ADR 0002, and recorded with license/source attribution in `THIRD_PARTY_NOTICES`. |
| U22 | P | Sensitive disclosure, unsafe dependency, or uncertain rights stops work and uses private reporting. |
| U23 | P | Independent tests cover schema/raw identities, syntax/schema success, malformed/duplicate/schema-invalid output, dialect/id/offline-ref failure, retention, provenance, redaction, and corruption. |
| U24 | P | Automated checks remain bounded and cannot replace A4 security, rights, creative, or publication review. |
| U25 | P | Durable inputs use Studio-owned contracts, exact prompt versions, root-relative source identity, byte size and integrity digests, and independent validation. |
| U26 | P | Provider-native/emulated output constraints remain adapter capabilities; the core consumes only Provider Execution strings and independently validates without SDK types. |
| U27 | P | Versioned dependencies, migration/rollout documentation, compatibility, and rollback are required before change. |

### Repository and production-system profile

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| R1 | P | README, Studio architecture, CODEOWNERS, LICENSE, and NOTICE define one public production-software responsibility and prohibited content. |
| R2 | P | Protected `main`, CODEOWNER review, private reporting, security protections, Node 22 engine, built-in tests, exact npm lock/integrities, dependency audit, and third-party notices match the current runtime risk. |
| R3 | P | All four schema generators verify exact accepted Codex commit bytes by size/digest and emit reproducible code; replacement by immutable issue #72 artifacts remains release-blocking. |
| R4 | P | Public code/tests/fixtures/logs use synthetic data; registry diagnostics expose safe root ids and relative paths but not prompt bodies, host-absolute paths, secrets, or protected context. |
| R5 | P | This file is the required declaration. |

### Agent and automated-workflow profile

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| G1 | P | Automation policy requires identity, owner, authority, actions, data, tools, destinations, budgets, duration, monitoring, and revocation. |
| G2 | P | Exact schema compilation and deterministic raw parsing/validation execute outside model output; provider constraints never self-attest validity and schema/default/repair behavior cannot invent data or approval. |
| G3 | P | Automation cannot self-approve or cross A4 gates. |
| G4 | P | Execution results preserve correlation, exact provider identity, timing, usage, finish reason, output digest, warnings, and normalized failure/retry guidance; the executor itself never retries. |
| G5 | P | Synthetic tests cover preflight failure, normalized provider failure, no retry, timeout, cancellation, non-cooperative adapters, invalid response, and exception redaction. |

### Release profile

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| L1 | P | Automation policy requires exact candidate digest, contents, audience, destination, purpose, criteria, owners, and governing versions. |
| L2 | P | Every Article 9 gate must have an explicit current result before release. |
| L3 | P | The policy forbids release without resolved blocking findings and accountable dispositions. |
| L4 | P | PR and automation policy require technical, schema, provenance, security/privacy/rights, accessibility/safety, packaging, and A4 review as applicable. |
| L5 | P | Release notes, notices, migration, monitoring, rollback, withdrawal, and correction are prerequisites. |
| L6 | P | Published bytes must match the approved candidate and immutable provenance exactly. |

### Assessment outcome

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| O1 | P | PL-1 through PL-11 are classified; no unresolved Blocker or Major remains in assessed scope. |
| O2 | P | Candidate status is explicit; owner merge makes the assessed implementation conforming. |
| O3 | P | Approval covers only the base revision and issue #68 candidate diff. |
| O4 | P | Date and material triggers are explicit. |

## Approval

The owner approves this assessment by reviewing and merging the implementation
pull request. No provider response, schema publication/retrieval, restricted raw
store, business truth, downstream authorization, retry/routing, deployment,
publication, or release inherits conformance from this assessment.
