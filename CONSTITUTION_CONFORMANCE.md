# Constitution conformance record

## Constitutional alignment

- Constitution: [Definitely Secure Studio Constitution v1.0.0](https://github.com/DefinitelySecureStudio/studio/tree/constitution/v1.0.0)
- Constitution tag: `constitution/v1.0.0`
- Constitution commit: [`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`](https://github.com/DefinitelySecureStudio/studio/commit/a9cc8a503aa30e17820edc62ac95f7cbe10e0564)
- Status: `Conforming candidate` (effective after accountable-owner approval and merge of this implementation pull request)
- Assessed scope: the scaffold plus the dependency-free Prompt Definition v1 renderer, explicit input/context resolution, canonicalization, structured errors, tests, examples, and runtime ADR in the candidate diff
- Excluded scope: full Prompt Definition semantic validation, context-package authorization/integrity/expiry validation, provider adapters, model execution, agents, deployments, production data, builds, and releases
- Accountable owner: [`@andrewperis`](https://github.com/andrewperis), Platform maintainer
- Assessment base revision and date: `571d82f91eea330c3087b74b1c272ffa86299300`; candidate diff assessed 2026-08-17
- Checklist revision: `a9cc8a503aa30e17820edc62ac95f7cbe10e0564`
- Applicable profiles: universal; repository and production-system; agent and automated-workflow; release
- Evidence: this record; renderer source and tests in the candidate diff; GitHub settings verified 2026-08-17; Studio issue [#63](https://github.com/DefinitelySecureStudio/studio/issues/63); implementation pull request
- Active constitutional exceptions: None
- Residual risk: the accepted Prompt Definition v1 contract is pinned to a provisional exact Codex commit until issue #72 releases immutable artifacts; complete definition validation (#64), context-package trust checks (#67), and provider execution remain outside this renderer
- Next review: 2026-11-17, on replacement of the provisional contract reference, or before consequential provider, private-context, agent, deployment, or release use and on Constitution, authority, contract, data, dependency, visibility, owner, or security change

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
| U13 | P | Rendering is deterministic for the same definition and explicit values; canonical output has no time, randomness, host state, filesystem, network, environment, or provider input. |
| U14 | N/A | No selected generated output or release bytes exist. |
| U15 | P | Protected Git history and required future workflow evidence provide attributable, ordered audit records. |
| U16 | P | Content boundaries, trust boundaries, secret handling, private reporting, recovery, and release controls precede implementation. |
| U17 | P | Least-privilege secrets and minimal versioned runtime inputs are mandatory. |
| U18 | P | README, tests, automation, CONTRIBUTING, SECURITY, and PR template prohibit secrets in every recorded surface. |
| U19 | P | Classification follows private inputs through logs, fixtures, artifacts, caches, and releases. |
| U20 | N/A | No provider is selected; selection triggers contractual/technical review. |
| U21 | P | CONTRIBUTING requires source, rights, license, and notice review for third-party dependencies/assets. |
| U22 | P | Sensitive disclosure, unsafe dependency, or uncertain rights stops work and uses private reporting. |
| U23 | P | Tests and PR validation are defined independently of producers; release gates cover cross-domain concerns before use. |
| U24 | P | Automated checks remain bounded and cannot replace A4 security, rights, creative, or publication review. |
| U25 | P | Durable inputs use Studio-owned contracts, immutable portable artifacts, integrity digests, and independent validation. |
| U26 | P | Provider-specific features must remain behind Codex contracts with portable baselines and explicit exit behavior. |
| U27 | P | Versioned dependencies, migration/rollout documentation, compatibility, and rollback are required before change. |

### Repository and production-system profile

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| R1 | P | README, Studio architecture, CODEOWNERS, LICENSE, and NOTICE define one public production-software responsibility and prohibited content. |
| R2 | P | Protected `main`, CODEOWNER review, private reporting, enabled security protections, Node 22 engine declaration, built-in tests, and zero third-party packages match the current runtime risk. |
| R3 | P | Architecture requires immutable references. The renderer uses the policy-permitted exact accepted Codex commit provisionally and records replacement by the issue #72 artifact as release-blocking. |
| R4 | P | Public code/tests/fixtures/logs use synthetic or public data and exclude private Lore, unpublished Canon, secrets, and protected context. |
| R5 | P | This file is the required declaration. |

### Agent and automated-workflow profile

| ID | Result | Evidence or rationale |
| --- | --- | --- |
| G1 | P | Automation policy requires identity, owner, authority, actions, data, tools, destinations, budgets, duration, monitoring, and revocation. |
| G2 | P | Authorization/policy must be enforced outside model output; inputs are validated against owned contracts. |
| G3 | P | Automation cannot self-approve or cross A4 gates. |
| G4 | P | Calls, retries, failures, transformations, outputs, approvals, and governing revisions are required audit evidence. |
| G5 | P | Failure, timeout, provider loss, partial/duplicate action, recovery, rollback, containment, and takeover tests are prerequisites. |

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
| O1 | P | PL-1 through PL-6 are classified; no unresolved Blocker or Major remains in assessed scope. |
| O2 | P | Candidate status is explicit; owner merge makes the assessed implementation conforming. |
| O3 | P | Approval covers only the base revision and issue #63 candidate diff. |
| O4 | P | Date and material triggers are explicit. |

## Approval

The owner approves this assessment by reviewing and merging the implementation
pull request. No provider, context-package integration, deployment, or release
inherits conformance from this renderer assessment.
