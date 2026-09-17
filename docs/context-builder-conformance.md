# Context Builder conformance, security and reference suite

Studio #85 consolidates the tests shipped with #76–#84; security validation was not
postponed to this suite. No runtime, released SDK, immutable schema or dependency
changes are made. Codex's accepted synthetic request/normalized/result/receipt
fixtures remain pinned at `291453e2a957fb83dedb0c209ed2cdd14ba90c0e`. This work reuses
those reviewed contracts without another Codex change or cross-repository PR.

## Run the reusable suite

```sh
npm ci
node scripts/check-context-builder.mjs
npm test
```

The dedicated runner executes every `tests/context-builder/*.test.js`, the pinned
SDK Builder-contract and Context Package tests, both genuine build→review→SDK→mock
examples, the fake-private CLI build, and the SDK baseline readiness check. It
returns nonzero on any failure or fixture mutation. It never regenerates a golden,
loads a production credential, calls a model, follows a live source branch or
uploads a protected test artifact. The broader `npm test` remains the complete
Platform regression run.

The runner preloads an accidental-network guard into Node and inherited Node CLI
subprocesses. TCP/TLS, HTTP(S), fetch and common DNS entry points fail immediately.
A subprocess test verifies the guard. This is a tripwire for trusted tests, **not
an OS sandbox or defense against malicious test code/native programs**. It does
not prevent arbitrary non-Node child programs from networking. Default tests use
only in-process fakes and private temporary files. Dependency installation still
needs registry access. Do not put live-provider tests or credentials into this job.

The existing read-only CI workflow runs `npm ci`, `npm test` and the dedicated suite
on Node 22 and 24. Pinned actions and job IDs are preserved. No repository branch
protection, release permission, required-check settings or secret configuration is
changed; CI results still need to complete on the pull request.

## Adapter/verifier author contract

Import `sourceBindingConformance` and `preparationVerifierConformance` from
`tests/support/context-builder-conformance.js` in a Node test file.

`sourceBindingConformance(name, createBinding)` calls an async factory with
`{ source, artifact, bytes, t }` for each case. Return a fresh real binding under
test; adapt the source kind/reference for the reader without changing IDs, fragments,
authority or continuity. `artifact` always pins the expected valid bytes. The corrupt
case supplies same-length altered transport bytes: do not recompute the expected
digest to make the fault disappear. Use `t.after` for private temporary-file cleanup.

The common reader cases check exact repeated normalization and metadata preservation,
corruption rejection, denial/cancellation before `read`, revocation during a read,
safe raw-error handling, no retries, and bounded options passed to the reader.
The built-in memory, local public snapshot and approved fake-private stream adapters
plus an independently implemented byte binding all run these same cases. They test
the adapter **through the gate**; they do not certify direct unauthorized calls to
trusted reader code or replace adapter-specific filesystem/transport tests.

`preparationVerifierConformance(name, createVerifier)` supplies a synthetic explicit
decision and expects `{ verifier, revoke() }`. The verifier must process it through
its actual boundary using an offline fake backend. The suite checks allow, deny,
unapproved owner, caller/target/request/purpose/ceiling mismatches, not-yet-valid and
expired decisions, and revocation. Rejections must occur before any source read and
must not echo evidence. Both the supplied synthetic verifier and an independent fake
policy service implement the factory. Production identity/signature/revocation
backend mapping needs additional isolated tests; passing this harness is not
production authority onboarding or a security certification.

## Explicit positive/negative coverage map

Paths below are relative to `tests/`; each row includes both acceptance and rejection
coverage. These are behavioral boundaries, not a claim of exhaustive proof.

| Boundary | Positive evidence | Negative/adversarial evidence | Tests |
| --- | --- | --- | --- |
| Codex request, normalized, result and receipt contracts | Pinned explicit/lexical fixtures; exact golden packages; schema validation | Missing required context, wrong identity/classification, closed receipt fields | `prompt-sdk/context-builder-contract.test.js`, `context-builder/reference-conformance.test.js`, `audit.test.js` |
| Preparation authority | Exact owner/caller/request/target/purpose decisions | Unknown owner, denial, stale/revoked grants, synthetic-as-production, zero reads on rejection | `context-builder/preparation.test.js`, `adapter-conformance.test.js` |
| Source adapters and byte identity | Memory/public snapshot/approved-export and independent fake | Corruption, exceptions, short/oversized streams, no retries | `context-builder/sources.test.js`, `adapter-conformance.test.js` |
| Filesystem/input containment | Owned snapshots, explicit regular CLI input | Traversal, symlinks, hard links, changed files, unsafe output directories | `context-builder/sources.test.js`, `cli.test.js` |
| UTF-8/JSON normalization | Exact multibyte ranges, JSON pointers and canonical values | Invalid UTF-8, duplicate keys, invalid pointers, parser depth/node budgets | `context-builder/sources.test.js` |
| Filtering/ranking/claims | Explicit order, lexical unique-token scores, deterministic ties/permutations | Ineligible scope/classification/media/time, shared-claim conflicts, no-match, tampered lineage | `context-builder/selection.test.js`, `reference-conformance.test.js` |
| Hostile source instructions | Exact inert text preservation | Content cannot alter authority, policy or source classification | `context-builder/sources.test.js`, `selection.test.js`, `reference-conformance.test.js` |
| Assembly budgets and package semantics | Exact UTF-8/JSON/LF counts, required reservation, optional omission | Required overflow, zero capacity, unsafe arithmetic, no-section output | `context-builder/assembly.test.js` |
| Classification and private provenance | Maximum classification and retained source evidence | Downgrades rejected; private tuples/handles omitted from package/public projections | `context-builder/assembly.test.js`, `handoff.test.js`, `audit.test.js` |
| Cache, retention and replay | Exact-scope hits, immutable artifacts, fresh replay, explicit cleanup | Caller/purpose/budget/source/trust isolation, corrupt cache, stale/revoked reuse, forbidden history | `context-builder/lifecycle.test.js`, `reference-conformance.test.js` |
| Required audit | Exact acknowledgments and body-free protected trace | Sink timeout/failure, repeated references, post-audit expiry/revocation/narrowing | `context-builder/audit.test.js` |
| Public attestation | Independently allowlisted receipt and controlled resolver | Private IDs/hashes/extra fields, missing approval, copied references, denied resolution | `context-builder/audit.test.js` |
| SDK/use-authority handoff | Genuine built text/JSON packages to mock execution and exact provenance | Wrong instance/purpose/sections/grant, too-low ceiling, stale or changed authority; adapter non-invocation | `context-builder/handoff.test.js` |
| Structured processing | Independent JSON parsing and linked result provenance | Malformed/schema-invalid output, identity tampering, raw diagnostic leakage | `context-builder/handoff.test.js`, `prompt-sdk/structured-output.test.js` (full regression suite) |
| CLI/review workflow | Validate/plan/build/verify/replay, safe JSON exits, consented 0600 files | Missing authority, malformed files, denied/expired builds, tampered artifacts, unsafe overwrite | `context-builder/cli.test.js` |
| Offline defaults and release baseline | Network-guarded reference/CLI flows; readiness checker | Fetch/TCP/HTTP/DNS blocked; golden mutation fails | `context-builder/offline-conformance.test.js`, dedicated runner |

## Reference matrix and reviewed golden policy

`tests/fixtures/context-builder-reference-golden.json` contains full expected
packages/lineage/omissions or closed expected failures for:

- public canon read from a pinned temporary local snapshot;
- approved synthetic private text export;
- mixed public text/internal fake-private JSON;
- hostile embedded instructions retained as inert public synthetic text;
- conflicting continuity (`INELIGIBLE`);
- contradictory eligible shared claims (`CONFLICT`);
- incomplete required context (`REQUIRED_CONTEXT_MISSING`).

The independent scenario oracle starts from accepted Codex golden package documents
and explicit hand-reviewed transformations; it does **not** call the Builder to
calculate expected output. Tests compare complete results and pinned canonical
identities. Successful scenarios run twice with reversed reader registration and
new audit references, require identical stable artifacts, and validate binding with
the independent fixture use grant. SDK mock execution and private provenance
redaction are additionally covered end-to-end by the handoff tests/examples.

The Platform golden lock records exact bytes/SHA-256 and the Codex baseline; its
candidate status is accepted through owner review/merge of #85. The original Codex
fixture lock is unchanged. Tests only read these files and assert they remain
unchanged. There is no update flag or snapshot-rewrite mode.

Golden changes require an explicit PR explanation of contract/policy impact and
owner review of source scenarios, expected content, package classification, identities
and negative outcomes—not merely an updated hash. `.github/CODEOWNERS` requests
@andrewperis review for Builder fixture locks/goldens and the oracle. Whether GitHub
blocks a merge without that approval depends on repository branch rules; this task
does not change those rules. Update reviewed expectations/lock deliberately only
after understanding the difference. Never accept a new golden solely because the
implementation emitted it. A normative contract change belongs in Codex first and
must not overwrite released bytes.

All content is synthetic/public, including the fake-private classifications and
exports. Temporary protected files are cleaned up; no real Lore, credentials,
private-network fixtures or paid-provider output is captured. This suite supplies
evidence for review, not release approval. Immutable publication and production trust
onboarding remain #86/separately approved work. See [ADR 0017](adr/0017-builder-conformance.md).
