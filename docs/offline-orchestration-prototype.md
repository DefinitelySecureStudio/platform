# Offline orchestration prototype

Status: experimental, synthetic-only prototype. This is not a released
orchestration contract or production execution path.

The prototype exercises a bounded host-owned lifecycle around the existing
Provider Execution and Comic Manifest implementations. Its default path uses
one exact public synthetic Comic Manifest fixture, the existing Prompt SDK, and
one `MockTextAdapter` instance. An explicitly installed, opt-in path also reads
the exact public Context Builder fixture through six bounded synthetic readers
under separate current execution and package-use authority. Neither path
contacts a provider or uses credentials. The default path uses an in-memory
store; a separate experimental opt-in no-context resume path uses the local
file store described in the O08 packet and persists synthetic state across
processes. Neither path is a production execution service.

This implementation was informed by [RFC 0010 at Codex commit
`3f5549f29faf1ca3e0912e6b8407dbe19310a7e2`](https://github.com/DefinitelySecureStudio/codex/blob/3f5549f29faf1ca3e0912e6b8407dbe19310a7e2/rfcs/0010-build-attempt-lifecycle.md)
and [RFC 0011 at the same commit](https://github.com/DefinitelySecureStudio/codex/blob/3f5549f29faf1ca3e0912e6b8407dbe19310a7e2/rfcs/0011-job-limits-and-recovery.md).
Both RFCs are drafts; neither is an accepted or released contract. This
prototype does not change their status, the Provider Execution v1 contract, or
the Comic Manifest schema.

## Deliberate scope

- One admitted job per in-memory store instance for its lifetime; there is no
  queue or eviction. A completed job or host-side stop cannot be replaced in
  the same store. Create a fresh prototype instance for another isolated run.
  Validation or preflight rejection before any job bytes/events are stored does
  not consume the slot. If admission leaves orphaned bytes, the state is
  unresolved and reuse is blocked because this prototype has no cleanup path.
- One exact `comic-production` fixture revision and its required text transcript
  rendition. Any other production identity, revision, or rendition is rejected.
- At most two attempts per job and at most one provider call per attempt.
- A fixed 300,000 ms monotonic job budget. It is not reset between attempts.
- One synthetic mock adapter only. No real providers, network, production
  storage, scheduler, daemon, or credential handling. Only the explicit
  experimental no-context resume uses the local filesystem; it is bounded to
  the pinned eligible first-attempt rate-limit case.
- `inspectRecovery()` is read-only. The separate opt-in `resume()` path may
  continue only that narrow candidate after current checks and a durable
  one-shot claim. Uncertainty, integrity mismatch, an unknown clock epoch, or
  an expired nonterminal deadline cannot authorize another provider call.
- Each prototype instance requires an explicitly installed synthetic execution
  authority verifier. It rechecks finite preexisting decisions for the exact
  synthetic production identity, purpose, and action before input use, again
  after asynchronous preflight, and immediately before dispatch. The verifier
  rejects missing, duplicate, malformed, denied, expired, revoked, or
  unverifiable evidence. There is no default allow path, grant renewal, or
  implicit fetch.
- Caller retry authorization is explicit. The retry API also checks the exact
  normalized rate-limit category, retryable flag, and `retry_after_ms` within
  the Provider Execution v1 range of 1–86,400,000 ms, safe
  `RATE_LIMITED_BEFORE_ACCEPTANCE` provider code, no output, same pinned
  production identity, remaining deadline, and attempt ceiling. Mock rate-limit
  options outside that range are rejected before admission or provider dispatch.
- The opt-in synthetic Context Builder input path is available only when the host
  installs the exact finite fixture readers and a separate current package-use
  verifier. Both authorities are checked before each fixture read, after awaited
  reads and preflight, before cached retry evidence, and at dispatch. Omitted
  `syntheticContext` preserves the existing no-context path. There is no fetch,
  renewal, or request-supplied reader/approval path.
- Missing or corrupt bytes from any installed context fixture reader fail with
  the same value-free input error before admission. No reader bytes are copied
  into diagnostics or persisted on these failure paths.

## Resource limits

| Resource | Prototype limit |
| --- | ---: |
| Active jobs | 1 |
| Attempts per job | 2 |
| Provider calls per attempt (maximum) | 1 |
| Job budget | 300,000 ms |
| Prompt per attempt | 8 MiB, further reduced by the mock descriptor's 1 MiB input cap |
| Normalized output per call | 16 MiB |
| Generated artifacts per job | 64 MiB |
| Aggregate payload material per job | 128 MiB, with 1 MiB reserved for lifecycle metadata |
| Lifecycle entries per job | 32 |
| Lifecycle metadata per entry | 32 KiB |
| Lifecycle metadata per job | 1 MiB |
| Comic Manifest parsing | Current validator limits: 8 MiB, depth 32, 100,000 values, 32,768 UTF-8 bytes per string |

The prototype charges canonical production and prompt bytes, normalized
provider-outcome bytes, result bytes, and artifact bytes to its in-memory
material ledger. It rejects arithmetic overflow and over-limit reservations
before dispatch or writes. These figures are prototype policy, not a new schema
or public service guarantee.

## Lifecycle and outcomes

For a successful mock call, the host records `admitted`, `prepared`, and
`dispatch-started` before the only mock execution call. It stores and verifies
the exact normalized outcome, prepares the result bytes, persists and verifies
the artifact and result, records the terminal link, and closes the job. The
attempt, execution, and result IDs are distinct. Retry lineage uses a new
attempt ID and retains the original production identity.

The in-memory store provides deterministic fault injection for tests. An
unconfirmed dispatch marker prevents the mock call. Ambiguous outcome or result
writes stop further work; the prototype does not retry them or infer absence.
Inspection is read-only and verifies stored production, prompt, outcome,
artifact, and result bytes where present. These tests exercise process-like
reconstruction over a shared in-memory test store; they do not demonstrate
durable or cross-process recovery.

### Current no-output mapping boundary

The stable Comic Manifest v1 validator cannot represent an internal failed result
with no output digest: an empty transformation list fails schema validation,
while a transformation with empty output digests or withheld private outputs
fails semantic validation (`src/comic-manifest/semantics.js`, lines 53–59).
The closed result schema otherwise allows failed results with `OUTPUT_MISSING`
or `VALIDATION_FAILED`, but that does not satisfy the internal transformation
rule.

On an initial attempt, a normalized successful SDK outcome whose content is
partial or does not match the pinned transcript remains in the immutable
provider-outcome record, while the admitted job retains the actual input
reference. The current Manifest mapping reports `contract-mapping-blocked`; it
does not create an artifact, fabricate a Comic result or mark the job
successful. The failed mapping is not retry-eligible.

For a dispatched attempt with a retained provider outcome but no valid Comic
Manifest mapping, the default v1 path preserves that outcome and returns
`contract-mapping-blocked`; it does not fabricate output, create an invalid
result, or authorize a retry. Pre-dispatch host stops instead return the
host-side outcomes described below. There is one explicit local exception:
callers may opt in to the unreleased 1.1.0 result candidate described later,
which supports a confirmed no-action rate limit and a delayed, caller-authorized
retry when its exact checks pass. This candidate does not change the default v1
path, stable validators, or released contract. Cancellation, timeout, uncertain
outcomes, and other unmappable failures remain outside that candidate.

Provider Execution v1 reports cancellation according to its existing signal
semantics. If cancellation wins before SDK settlement, this host cannot infer
whether an adapter-side operation may have completed after the signal; it keeps
the exact SDK result and does not relabel it as success or timeout. A provider
`timed-out` result is likewise preserved and marked `contract-mapping-blocked`,
as its mapping is deferred in the RFC.

The host's monotonic job deadline is a separate stop condition. If it fires
after the mock call begins, the SDK observes an abort signal and preserves its
existing normalized `cancelled` outcome; the host separately records
`budget-exhausted`. Neither event creates a Comic Manifest result when the
existing schema cannot represent that outcome. A non-cooperative mock may settle
later, but the SDK/host processing race ignores that late fulfillment or
rejection. The host timer and caller-abort listener are removed after execution
settles; invoking a captured late callback after a committed terminal result
does not change stored evidence. On a stopped second attempt, a confirmed SDK
outcome may close the host job only after the `contract-mapping-blocked` and
`job-closed` writes are confirmed, while leaving the earlier immutable Comic
result unchanged. Provider timeouts and uncertain outcome or closure writes
remain unresolved for reconciliation. These are distinct host/SDK states, not
a new result mapping.

### Timeout and cancellation mapping analysis

The stop point determines what the host can establish. It does not by itself
provide a Comic Manifest result mapping:

| Stop point | Established facts | Current host behavior and mapping boundary |
| --- | --- | --- |
| Before admission | No job has been admitted or dispatched. In the opt-in context path, authorized fixture bytes may already have been read during preflight, but no immutable admitted input record or provider outcome exists. | A caller abort observed at the runner's pre-admission checks returns `cancelled-before-admission`; a job budget reached at the post-preflight check returns `budget-exhausted` with `time-before-admission`. An unverifiable host clock returns `deadline-unverifiable`. These host outcomes create no Comic result. |
| After admission, before dispatch | The job may have immutable input and prepared evidence, but no provider call or provider outcome exists. Tests cover caller cancellation and deadline at this boundary. | Record the host stop (`cancelled-before-dispatch` or `budget-exhausted`) and close the host job when its writes are confirmed. Do not invent a provider outcome, Comic terminal result, or rate-limit retry eligibility. |
| After dispatch begins | The mock execution call was made. A host deadline or caller cancellation aborts the SDK signal; a non-cooperative adapter may still have performed work. | Preserve the SDK's actual normalized outcome and separate host deadline evidence. Ignore late settlement. When no valid Comic mapping exists, return `contract-mapping-blocked`; if the outcome/write state is uncertain, keep the job unresolved for read-only inspection. |

Not every pre-admission stop is returned as one of those host outcomes. A
deadline expiring during an awaited `requireContextBoundary` check in the
opt-in context path rejects with `EXECUTION_DEADLINE_EXPIRED`. In the default
no-context path, if the deadline expires during the post-preflight authority
await, the following deadline check returns `budget-exhausted` with
`time-before-admission` (covered by the no-context authority-await test).
Denied or unverifiable execution or package-use authority rejects with its
fixed authority error. In the opt-in context path, cancellation or the bounded
reader timeout while a protected reader is pending rejects with
`SYNTHETIC_CONTEXT_INPUT_INVALID`. Rejected boundaries are not
`cancelled-before-admission` or `budget-exhausted` return values; these paths
still create no admitted job or Comic result.

Provider Execution's own `timed-out` outcome also remains unmapped. The local
1.1.0 candidate described later is narrower: it does not map cancellation, timeout,
pre-dispatch stops, or uncertain external effects. A truthful stable mapping
for those cases remains a separate contract decision. This analysis records the
current boundary and changes no runtime behavior.

## Using the prototype

The package subpath is `@definitely-secure-studio/platform/offline-orchestration-prototype`.
Its experimental factory accepts an explicitly installed
`executionAuthorityProvider`. This is an experimental JavaScript API change,
not a stable wire schema or production service. The provider is trusted host
configuration; it must implement both asynchronous `verify` and synchronous
`isCurrent` checks. The exported `createSyntheticExecutionAuthorityVerifier`
installs a finite synthetic fixture and supports in-memory revocation. It
never creates decisions. Each decision binds one action (`execute` or `retry`),
the exact synthetic production ID, revision and content digest, the fixed
synthetic purpose, a validity window, and an authority reference. Both actions
need their own installed decision. The record fields are `decision_id`,
`decision`, `action`, `purpose`, `production` (`production_id`, `revision`, and
`identity_sha256`), `not_before`, `review_after`, `expires_at`, and
`authority_reference`. Install the verifier with
`createOfflineOrchestrationPrototype({ executionAuthorityProvider: fixture.verifier })`.
`retry({ authorizeRetry: true })` remains separately required; that caller flag
does not replace current retry authority.

The optional Context Builder fixture path requires both
`syntheticContextReaders` and `contextUseAuthorityProvider` at factory creation,
then `submit({ productionSource, syntheticContext: true })`. Readers are the
finite slots `canon`, `dependency-0`, `dependency-1`, `prompt-description`,
`context-package`, and `builder-result`; each receives only `{ maxBytes, signal }`.
The host supplies them as trusted factory configuration. The package-use
verifier is created with `createSyntheticContextUseVerifier(decisions)` and
supports in-memory revocation. Each decision binds action, production identity,
prompt identity, package instance and manifest identity, Builder result identity,
package purpose, exact section list, classification, and a finite validity
window. Preparation and the fixture's historical use-authorization document
remain provenance; neither grants current use. The validator and renderer reuse
Prompt SDK v1 and Builder artifact validation without changing their schemas.

The exact `comic-manifest-v1` and `context-builder-v1` fixture bytes are read
only through those installed slots. Positive synthetic tests use the fixture's
explicit clock, `2026-09-15T12:10:00Z`. The public factory uses its host wall
clock; the fixture authority is expired after its review boundary and therefore
fails closed at current real time. No test clock silently resets a public run.
Package bytes and raw authorization records never enter diagnostics or lifecycle
events. Read-only recovery remains the previously accepted inspection path and
is outside this new execution-read boundary.

Execution authority is checked before the runner parses or renders the
submitted production input, after mock preflight, and immediately before a mock
call. In the opt-in context path, execution and package-use authority are both
checked before protected reads and rechecked across awaited verification,
preflight, and dispatch boundaries. The runner synchronously rechecks current
revocation, wall-clock validity, cancellation, and the monotonic job deadline
before each protected effect. A denied or unverifiable check fails closed.
Preparation authority is separate and cannot authorize execution or package
use. Omitting `syntheticContext` retains the no-context path; enabling it proves
package-use controls only for the installed synthetic fixtures, not general or
production package access.

The prototype remains intended only for local synthetic experimentation. Its
new factory option and `syntheticContext` switch are experimental JavaScript
surface only; they do not change a stable request or result schema. The internal
test seam is not listed in package exports.

Use the existing [fixture](../tests/fixtures/comic-manifest-v1.json) as the
only accepted production input. A completed mock result only demonstrates the
synthetic lifecycle and structural compatibility; it does not establish content
quality, rights, safety, approval, release eligibility, or publication
authority.

## Local opt-in no-output retry candidate (2026-10-31)

Default behavior described above remains available. Passing
`noOutputResultVersion: '1.1.0'` to `submit` explicitly selects the **unreleased**
Comic build-result candidate for confirmed no-action rate-limit failures only.
Success continues to emit v1. Other versions fail before admission. Cancellation,
validation failure and timeout remain unmapped when no verified output exists.

```js
const first = await runner.submit({
  productionSource,
  noOutputResultVersion: '1.1.0',
  mockOutcome: { kind: 'rate-limit', retry_after_ms: 10 }
});
// After the delay, while the original job deadline and budgets permit:
const second = await runner.retry({ authorizeRetry: true });
```

The first failed result has `outputs: []`, `diagnostics: ['OUTPUT_MISSING']`,
and one actual-input transformation with empty output digests and false withheld
flags. Immutable outcome and result bytes plus terminal linkage must verify.
Retry rechecks pinned inputs, prompt, protected outcome and terminal result
before allocating IDs and again immediately before dispatch after async mock
preflight. IDs are fresh; the prepared event links `retry_of_attempt_id`.
A confirmed second result or retained unmappable outcome closes the host job;
uncertain outcomes or writes remain unresolved. There is no third attempt or
hidden retry. Delay is measured conservatively from terminal completion. A caller may
use `closeJob()` instead. With the default in-memory store, a process restart
cannot continue this job. The separate opt-in local-file-store `resume()` path
supports only the narrow no-context candidate documented in the O08 packet.

The only retry admission proof in this prototype is the exact normalized mock
rate-limit outcome that states the request was rate-limited before acceptance.
Each attempt makes at most one provider call and uses a distinct
`idempotency_key` derived from its fresh execution ID. The mock does not
deduplicate across keys, and the prototype
does not claim cross-attempt or provider-level deduplication, or exactly-once
effects. A retry is an explicit continuation after the no-acceptance proof,
under the original job deadline and two-attempt cap. The experimental
no-context resume path and its limits are documented in the O08 packet. Tests
cover denied retry (no second call), authorized retry (one new call/key on the
successful fixture path), immutable prior result, the second-attempt limit,
and read-only `inspectRecovery()`.

The experimental validator lives in `src/comic-manifest/result-candidate.js`;
the stable `validateComicManifest` entry point continues to reject 1.1.0.
`candidate-contract.js` pins exact local Codex schema bytes. Regenerate with:

```sh
node scripts/generate-comic-result-candidate.mjs /path/to/codex/schemas/json/comic-manifest/v1.1/comic-build-result.schema.json
```

Codex's `specs/comic-build-result-1.1-candidate.md` records the additive minor
compatibility choice, exact schema ID, lifecycle and migration boundary. This
is a local implementation candidate, not a published contract pin or production
consumer adoption. Existing release manifests, v1 validators and fixtures are
unchanged. O02/O03 owner review remains pending. Real providers, durable storage,
cancellation retries, timeout/integrity mapping and production use are excluded.

### Confirmed unmappable retry outcomes

A second attempt with a confirmed, retained provider outcome that cannot map to
Comic Manifest (for example output-validation failure, normalized cancellation,
or a successful response with mismatched output) closes the **host job** after
confirming the `contract-mapping-blocked` event and `job-closed` append. It returns
`status: 'contract-mapping-blocked', job_closed: true`. The prior terminal result
and both provider outcomes remain immutable; no second Comic result or terminal
result link is fabricated. Recovery reports the host job as terminal.

This closes an exhausted job, not the unresolved contract mapping. Uncertain
outcome/readback/index/close writes and provider timeouts still require
reconciliation and do not claim confirmed closure. The store's existing
one-job lifetime limit remains in force even after confirmed closure.

The candidate validator's bounded no-output path requires exactly one prompt
binding. Schema-valid productions with zero or multiple prompt bindings receive
`ACTUAL_INPUTS`; validation does not throw or claim support for a broader
transformation path. The stable schema and v1 validation behavior are unchanged.

## Integrated O05–O07 evidence and remaining boundaries

The following merged changes and tests describe the current bounded synthetic
implementation: [PR #56](https://github.com/DefinitelySecureStudio/platform/pull/56)
adds current execution authority; [PR #57](https://github.com/DefinitelySecureStudio/platform/pull/57)
adds distinct package-use authority; [PR #58](https://github.com/DefinitelySecureStudio/platform/pull/58)
covers in-flight deadline and cancellation; [PR #59](https://github.com/DefinitelySecureStudio/platform/pull/59)
covers invalid inputs and partial outputs; and [PR #60](https://github.com/DefinitelySecureStudio/platform/pull/60)
covers pending protected readers across cancellation and timeout. [PR #63](https://github.com/DefinitelySecureStudio/platform/pull/63)
adds current package-use denial and expiry checks on cached retry evidence.

| Workstream | Evidence in this prototype | Remaining boundary |
| --- | --- | --- |
| [O05 #106](https://github.com/DefinitelySecureStudio/studio/issues/106): authorization before use | `runner.test.js` exercises current execution authority before input use/dispatch, distinct package-use authority for the opt-in Context Builder fixture, and rechecks across awaits. `retry-package-use-authority.test.js` covers revoked/expired package-use evidence on cached retry; `resume-candidate.test.js` covers authority before resume claim and protected reads. PRs #56, #57 and #63 provide merged code/test evidence. | Evidence is only for installed synthetic fixtures, local store and in-memory verifiers. It does not prove authorization for arbitrary readers, package discovery/fetch/renewal, real data or production services. Preparation authority remains separate. The issue is still open. |
| [O06 #107](https://github.com/DefinitelySecureStudio/studio/issues/107): deadline and cancellation | `runner.test.js` covers pre-admission, pre-dispatch, in-flight cancellation/deadline, late settlement and preservation of existing results. `context-reader-lifecycle.test.js` covers all six pending reader slots, late fulfillment/rejection, signal propagation, cleanup and no downstream effects. Second-attempt checks preserve the prior immutable result and original deadline. PRs #58 and #60 provide merged test evidence. | Andy accepted safe stopping, preservation of valid results/evidence, and unresolved uncertainty as O06's bounded acceptance. Host outcomes/SDK outcomes remain distinct from Comic results. New Comic mappings remain separate work. The issue is still open. |
| [O07 #108](https://github.com/DefinitelySecureStudio/studio/issues/108): invalid input and partial failure | `runner.test.js` covers missing/empty/corrupt/rejected reads for all six installed fixture slots, malformed/unsupported production input, and partial/mismatched initial output. It asserts retained actual input and provider outcome, sanitized diagnostics, no false Comic success, and no unauthorized retry. PR #59 adds that finite test coverage. | Andy accepted attempt-level input/outcome linkage for unmappable partial results; the runner keeps `contract-mapping-blocked` and does not fabricate a formal Comic transformation or result. Evidence is limited to the pinned synthetic readers and mock. The issue remains open. |

The accepted O06 boundary is limited to deterministic synthetic safe stopping,
resource cleanup, and preservation of verified results and immutable evidence;
uncertain in-flight outcomes remain unresolved and are never converted into
success or absence. New Comic Manifest results for cancellation, timeout, or
uncertain external effects require a separate contract decision. O05, O06 and
O07 receive bounded prerequisite passes only for the synthetic path described
in the [durable-resume decision packet](o08-durable-resume-decision-packet.md);
their Studio issues remain open and no broader production readiness is implied.
O08 receives a scoped pass for its accepted synthetic, no-context,
local-filesystem behavior, while issue #109 remains open and O09 remains
separately gated.
