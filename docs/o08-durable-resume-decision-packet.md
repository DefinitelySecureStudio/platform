# O08 durable-resume decision packet

Status: the narrow synthetic resume scope was accepted by the contract owner
on 2026-11-08; the local storage trust boundary is selected below. This does
not define a released contract or claim O08 completion. It contains no private
creative material.

## Current evidence and gap

At the start of this slice, Platform `main` at `31fd4d0` had bounded
same-process retry and an experimental opt-in local-file resume path with
atomic claims and durable writes. The default prototype remains in-memory.
The first attempt is retry-eligible only when its verified provider outcome is
the exact rate-limit-before-acceptance case. Explicit retry
then rechecks current authority and immutable evidence, honors the original
deadline and two-attempt limit, and creates one new attempt with a new execution
ID and idempotency key. The opt-in synthetic no-context path can resume only
the narrowly eligible first attempt after restart; inspection remains
read-only, and other recovery states are not replayed.

The ordinary prototype defaults to in-memory state and monotonic retry timing.
The opt-in local-file store supplies the durable primitives used by the
no-context resume path below. The job deadline and same-process retry delay are
monotonic and tied to the current clock epoch. Retry eligibility also retains
the original `retry_not_before`; resume must preserve and verify both that value
and the original job deadline. The mock adapter records calls but does not
deduplicate them. Provider Execution v1 carries an `idempotency_key`; the
Platform mock currently derives a distinct key for each attempt. No existing
contract here states that an arbitrary adapter/provider will honor that key or
retain a deduplication record.

The original same-process retry proof did not generalize to replaying an
uncertain dispatch. A dispatch marker without a verified provider outcome must
remain unresolved. The later bounded resume implementation described below
adds an injected stable time authority to verify both original bounds without
resetting the budget or shortening the retry delay.

## Recommended first bounded resume contract

If the owner wants durable resume, start with only a persisted, terminal,
first-attempt `retry-eligible` state whose immutable evidence proves the exact
before-acceptance rate-limit outcome. On restart:

1. Read only bounded, payload-free routing metadata needed to identify the job
   and its pinned production identity. Reject malformed or ambiguous metadata.
2. Verify current execution authority (and package-use authority on the opt-in
   context path) for the retry action before protected evidence access.
3. After authority verification, read the injected synthetic time authority
   with its exact time-domain/epoch identity. A current sample `now` is
   time-eligible exactly when `retry_not_before <= now < original_deadline`.
   Before `retry_not_before`, wait; at or after `original_deadline`, fail
   closed. This sample is preliminary and must not be reused after an await.
   Unknown epoch, rollback, or unverifiable time fails closed; never reset
   either bound.
4. Acquire an atomic transactional single-runner claim. If claim acquisition is
   asynchronous, revalidate authority and obtain a fresh time sample after it
   resolves and before protected evidence reads. Apply the same rule after each
   asynchronous protected read or evidence-validation boundary.
5. Validate immutable event and blob evidence, the event-chain integrity anchor,
   and every pinned input, prompt, provider outcome, and result byte against its
   recorded size and digest.
6. After asynchronous adapter preflight, revalidate current authority and obtain
   a fresh time sample. Make the dispatch-intent marker durable before invoking
   the adapter. Because marker commit may itself be asynchronous, revalidate
   authority and time again after its confirmed commit. The fresh sample must
   still satisfy `retry_not_before <= freshly_validated_now < original_deadline`.
7. Permit at most one caller-authorized new attempt, with a new execution ID and
   idempotency key, only after the verified before-acceptance proof and the final
   fresh time/authority check. Preserve the original result, deadline, retry
   bound, and evidence. There must be no await or other asynchronous boundary
   between the final validated time sample and invoking the provider effect. A
   missing/ambiguous marker commit acknowledgement, a crash after that marker,
   or a dispatch with no verified outcome is quarantined and never automatically
   replayed. Ambiguous commits in claim, event, or blob transactions are also
   quarantined for explicit reconciliation.

This path avoids duplicate effects by requiring evidence that the prior request
was not accepted. It does not promise deduplication across attempts or providers.

## Production decisions remain outside the accepted synthetic scope

### 1. Deadline across process restart

The current monotonic deadline and `retry_not_before` cannot be compared across
a new process or boot. For the finite synthetic proof, inject a deterministic
time authority with an explicit domain ID/epoch and stable absolute instants.
Persist both the original deadline and retry bound in that domain and fail
closed if the authority is unavailable, its epoch is unknown/different, time
moves backward, or either bound cannot be verified. A stored monotonic
observation by itself does not prove elapsed time across reboot. A production
clock service remains a separate contract decision; do not silently substitute
local wall time or create a new deadline on restart.

### 2. Storage and single-runner claim

Choose whether O08 authorizes a persistent job store, its atomic transactional
append/write and compare-and-claim guarantees, integrity protections, and
behavior when a claim or commit acknowledgement is ambiguous. Require immutable
evidence and durable dispatch-intent markers before adapter invocation. The
proposal prohibits automatic lease takeover; an abandoned/ambiguous claim is
quarantined pending explicit reconciliation. The current store is in-memory
and has no crash-safe transaction or inter-process claim contract.

Digests detect byte mismatch only when the expected digest and event history
are themselves trusted. If an actor can rewrite persisted bytes and matching
digest/event metadata, plain hashes do not prove authenticity or prevent a
fabricated before-acceptance outcome. The threat model must either trust
storage access controls/append-only guarantees or define a separately protected
authenticated chain/root (for example, a signing key unavailable to the store
writer). The current prototype supplies neither durable integrity anchor nor a
production threat model.

### 3. Uncertain dispatch and idempotency

Recommended first version: never automatically replay a dispatch whose outcome
is uncertain. Keep it unresolved. If future work must retry that case, require
an adapter/provider-specific contract that specifies stable key scope, exact
request fingerprint binding, deduplication retention, and the response returned
for a duplicate. A fresh key per attempt cannot suppress a duplicate effect.
Provider Execution v1's key field alone does not establish those semantics.

## Accepted first-resume contract and selected local trust boundary — 2026-11-08

Andy (@andrewperis), as contract owner, approved the narrow first-resume scope:
resume only from a fully committed, terminal first-attempt result that proves
the provider rejected the request before acceptance; recheck current authority
and the original time bounds; quarantine uncertain outcomes rather than replay
them. This does not authorize generic exactly-once claims or provider
deduplication.

For the first local synthetic implementation slice, use a caller-selected,
owner-controlled directory on a supported local filesystem, with an existing,
durably provisioned owner-controlled parent. The implementation checks private
directory/file modes, current-user ownership where the platform exposes it,
and rejects symlinked roots/files. Initialization fsyncs the store root and its
parent, then each child directory and its parent, before it returns. The caller
must ensure the path is on supported local storage; network/shared filesystem
detection is not reliable and such filesystems are outside this contract. Store
one canonical newline-delimited lifecycle event log per job and immutable
blobs created exclusively. Event and blob writes are not reported successful
until `fsync`, exact read-back and pending-marker removal are confirmed. A
pending marker after a crash makes the record unknown and requires
reconciliation. Use an exclusive per-job claim marker; never expire, steal, or
automatically release a claim after restart. A malformed log, partial blob, or
ambiguous claim/write is unknown. No provider call occurs from this
storage-only slice.

Trust assumption: the filesystem, OS account boundary, and directory owner are
trusted against malicious modification by the same account or an administrator.
Stored digests detect mismatch against trusted event metadata; they do not
authenticate an event log and do not resist an actor who can rewrite both data
and metadata. No signing key or separate integrity service is introduced.

The initial storage slice supplies local persistent store and claim primitives
plus restart/corruption tests, but does not reconstruct jobs or dispatch resumed
attempts. The bounded follow-up below adds read-only candidate
rehydration/classification; it does not consume a claim or dispatch. The
subsequent writable-resume slice below adds only the approved synthetic
no-context path. O09 remains open and is not satisfied by these primitives.

## Bounded read-only candidate rehydration slice — 2026-11-08

The runner's internal test factory accepts an explicitly injected synthetic
resume-time authority with fixed authority, domain, and epoch identifiers.
There is no fallback to the machine wall clock. At admission, the runner stores
the stable start and original deadline alongside the existing pinned
production/prompt evidence. After a safe first-attempt terminal result, it
samples that same authority and appends a separate `resume-window` event with
the sample time, original deadline, and `retry_not_before` derived from the
provider's verified before-acceptance rate-limit result. This event is appended
after terminal persistence so the bound cannot be shortened by an earlier
sample. Same-process retry behavior is unchanged.

On a reopened local store, read-only recovery first validates the exact
no-context synthetic path: the pinned comic-manifest-v1 production and prompt,
single first-attempt lifecycle, immutable provider outcome/result bytes,
terminal links, stable time authority identity, and the separate resume-window
link. It then samples the injected stable time and classifies inclusive
`retry_not_before <= now < original_deadline`, expired, not-yet-eligible,
empty-window, and unverifiable cases. Corrupt or mismatched evidence cannot
produce a candidate. A candidate response is explicitly read-only and says
current authority must still be checked. This slice does not read package
content, support context-enabled jobs, acquire a resume claim, rebuild the
material ledger/job, issue a new attempt, or call the mock/provider.

The deterministic tests use the pinned synthetic fixture and a fixed test time
inside its review period. A real-time run does not rewind the fixture's review
date. The time authority is an injected test seam, not a production clock
service. The local-store trust assumption above still applies: a writer able to
rewrite both persisted records and digests can forge self-consistent evidence.
The classifier by itself is not proof of durable resume safety or exactly-once
behavior; the separately bounded runtime slice below adds a narrow synthetic
resume path, without making either broader claim.

## Narrow no-context writable resume slice — 2026-11-08

The experimental prototype now exposes `resume({ jobId, authorizeResume: true,
signal?, mockOutcome? })` when constructed with an explicit `LocalFilePrototypeStore`,
execution authority provider, and synthetic resume-time authority. No local
wall-clock substitution is permitted for cross-restart eligibility. The new
JavaScript method and local-store export are experimental; no wire schema or
production service contract is added.

Resume first reads only lifecycle routing metadata and checks that it names the
single pinned, no-context, first-attempt rate-limit candidate. It verifies
current retry authority and stable time before an atomic one-shot claim. A
missing, held, malformed, or uncertain claim fails closed. After claim, it
rechecks authority/time before reading protected input, prompt, provider
outcome, and result blobs; the guard is repeated around each synchronous blob
read. It validates the exact prior outcome/result evidence, reconstructs the
material ledger from the verified blobs, and performs mock preflight. After the
awaited preflight it rechecks authority and the original time interval. After
post-claim authorization it pairs the validated stable-time sample with a fresh
monotonic sample from the same epoch to map the remaining original deadline.
Unreadable or unknown lifecycle state before or after claim returns
`reconciliation-required` and never triggers replay.

The same durable one-shot claim is acquired by the original runner's ordinary
`retry()` path before protected retry evidence is read. Thus an in-flight
resume and a same-process retry cannot both proceed to a second dispatch. If
the other path already owns the claim, the caller fails closed; a held claim is
never taken over or released.

The existing attempt path creates a new attempt and idempotency key, writes
the durable `dispatch-started` marker before the mock effect, then performs the
final current-authority/time and pinned-evidence checks immediately before the
single mock call. The persisted deadline and retry bound are unchanged, and
the event history enforces a maximum of two attempts. Any acquired claim is
never released or taken over. Uncertain marker, evidence, or outcome writes
remain quarantined; a restart cannot replay them. This is bounded at-most-one
mock invocation for this claimed attempt, not provider-level deduplication or
generic exactly-once behavior.

Tests cover explicit authorization, authority denial before claim, revocation
during claim/preflight, retry and deadline boundaries, concurrent callers,
unknown claims, final evidence uncertainty, marker uncertainty, uncertain
provider-outcome persistence, successful attempt-two linkage, and repeated
resume. Context-enabled recovery, live providers, production data, automatic
claim takeover, and O09 remain out of scope. O08 stays open pending remaining
criteria and independent review.

The implementation and subprocess acceptance evidence above cover the bounded
no-context runtime path. Broader O08 criteria, different storage backends,
context-enabled recovery, production durability guarantees, and O09 remain
separate and unaccepted.

## Synthetic subprocess restart and crash acceptance — 2026-11-09

`resume-subprocess.test.js` seeds only the pinned Comic Manifest fixture in a
private temporary local store, then exercises the runner from fresh Node child
processes. It verifies: a new process completes attempt two with the original
attempt linkage; two processes are released together at a barrier immediately
before the real atomic claim and yield one claim/second dispatch; a separate
staggered contention case pauses a claim winner in preflight; process exit
immediately after claim leaves a held claim with no takeover; exit after the
durable dispatch marker leaves no mock effect and no replay; and exit after one
mock effect plus a durable but
unlinked provider-outcome blob is quarantined without a second mock effect.
The test-only worker records every adapter `execute()` entry in a shared
temporary per-execution effect log, including normal restarts and both crash
points; all call counts are checked against the durable event history.

These are process-crash and local-filesystem integration tests around the
existing fsync-backed prototype store. They do not simulate power loss, prove
behavior on other filesystems, add a production backend, or provide a generic
exactly-once guarantee. O08 remains open pending its remaining criteria and
review; O09 remains gated separately.

## Finite synthetic restart and crash-point fixtures

All rows use the existing exact synthetic production, an injected deterministic
time authority, a transactional test store, and the mock adapter. Protected
bytes, decisions, and effects remain synthetic. Automatic lease takeover is
disabled. For every denied, blocked, or uncertain row, assert exact call counts
and zero unauthorized effects.

| Crash point / fixture | Expected decision | New provider calls | Required evidence |
| --- | --- | ---: | --- |
| Before resume claim transaction begins | Fresh explicit resume may proceed after current authority/time checks | Exactly 1 only if all gates pass | Original deadline and `retry_not_before` retained; one durable claim and new attempt/key |
| Claim transaction definitely aborts before commit | No claim is held; a fresh explicit request may retry checks | 0 for aborted request | No partial event/blob mutation |
| Claim commit acknowledgement is ambiguous | Quarantine; no automatic lease takeover | 0 | Claim/commit state marked for reconciliation; no protected reads or dispatch |
| Claim commit is confirmed, process crashes before dispatch-intent marker | Quarantine; no automatic lease takeover | 0 | Durable claim retained; no provider call inferred; explicit reconciliation required |
| Dispatch-intent transaction is ambiguous, or marker commits and process crashes before/while adapter invocation | Uncertain; never automatically replay | 0 after restart | Marker durable before invocation; no fabricated provider outcome/absence |
| Adapter returns before-acceptance rate limit, then crash occurs before outcome and terminal evidence commits | Quarantine as an unverified outcome | 0 | Missing outcome cannot create retry eligibility |
| Before-acceptance outcome, result, terminal link, and immutable evidence are durably committed; `now < retry_not_before` | Not yet time-eligible; preserve state and wait | 0 | Original result, deadline, and `retry_not_before` unchanged |
| Fully committed eligible state; `now == retry_not_before < original_deadline` | Earliest time-eligible instant; one explicit resume may start attempt 2 if all other gates pass | Exactly 1 | Inclusive retry bound; original result, deadline, and `retry_not_before` unchanged |
| Same fully committed eligible state; `retry_not_before <= now < original_deadline` | Time-eligible; one explicit resume may start attempt 2 if all other gates pass | Exactly 1 | New attempt/key; original result, deadline, and `retry_not_before` unchanged |
| `now >= original_deadline` | Expired; do not resume | 0 | Original deadline retained; no reset |
| `retry_not_before >= original_deadline` | No eligible time interval exists; do not resume | 0 | Both original bounds retained |
| Time authority epoch is unknown/different, unavailable, or rolled back | Unverifiable; do not resume | 0 | No use of persisted monotonic observation to infer elapsed reboot time |
| Authority is denied, expired, revoked, missing, or unverifiable | Deny resume | 0 | No protected evidence read after denial; no dispatch |
| Two runners race to resume the same eligible job | One confirmed claim at most; loser denied/conflict | At most 1 total | Atomic transaction; no automatic takeover; no duplicate dispatch |
| Attempt limit already consumed | Exhausted; do not resume | 0 | Existing attempts preserved |
| Required event/blob is missing, malformed, corrupt, mismatched, or ambiguous | Quarantine/reconciliation required | 0 | No success-implying write and no provider call |
| Persisted bytes and plain hashes are both edited to a self-consistent forgery | Outcome follows selected threat model; hashes alone cannot authenticate it | 0 | Test demonstrates limitation; require a protected chain/root or trusted-storage assumption |
| Terminal result and close evidence are valid | Read-only terminal inspection | 0 | No new attempt, write, or mutation |
| Resume was denied, then current authority is later granted | Re-evaluate authority on a fresh explicit request | At most 1 if all other gates pass | No cached authority; same original deadline, `retry_not_before`, and budgets |

Uncertain dispatch replay is prohibited in the recommended first version. If a
later owner-approved version considers it, require a separate finite
adapter-conformance matrix for same-key/same-request replay,
same-key/different-request rejection, dedupe-window expiry, duplicate response,
and provider unavailability. Do not fold that behavior into the first
before-acceptance-only resume path.

### Fresh-time checks across asynchronous boundaries

Do not carry an admission/claim-time `now` snapshot into later work. Use a
deterministic injected clock and cross each asynchronous boundary below with
each listed anomaly. Every anomaly fixture must produce zero provider calls.

| Asynchronous boundary | Time anomaly at the fresh post-boundary check | Expected result |
| --- | --- | --- |
| Claim acquisition | `now == original_deadline` | Fail closed; zero calls |
| Claim acquisition | `now < retry_not_before` | Not yet eligible; zero calls |
| Claim acquisition | Time authority epoch changes or becomes unknown | Fail closed; zero calls |
| Claim acquisition | Authority reports a rollback from its last validated sample | Fail closed; zero calls |
| Claim acquisition | Time authority is unavailable or returns a non-finite reading | Fail closed; zero calls |
| Evidence read/validation | `now == original_deadline` | Fail closed; zero calls |
| Evidence read/validation | `now < retry_not_before` | Not yet eligible; zero calls |
| Evidence read/validation | Time authority epoch changes or becomes unknown | Fail closed; zero calls |
| Evidence read/validation | Authority reports a rollback from its last validated sample | Fail closed; zero calls |
| Evidence read/validation | Time authority is unavailable or returns a non-finite reading | Fail closed; zero calls |
| Adapter preflight | `now == original_deadline` | Fail closed; zero calls |
| Adapter preflight | `now < retry_not_before` | Not yet eligible; zero calls |
| Adapter preflight | Time authority epoch changes or becomes unknown | Fail closed; zero calls |
| Adapter preflight | Authority reports a rollback from its last validated sample | Fail closed; zero calls |
| Adapter preflight | Time authority is unavailable or returns a non-finite reading | Fail closed; zero calls |
| Dispatch-marker commit | `now == original_deadline` | Fail closed; zero calls |
| Dispatch-marker commit | `now < retry_not_before` | Not yet eligible; zero calls |
| Dispatch-marker commit | Time authority epoch changes or becomes unknown | Fail closed; zero calls |
| Dispatch-marker commit | Authority reports a rollback from its last validated sample | Fail closed; zero calls |
| Dispatch-marker commit | Time authority is unavailable or returns a non-finite reading | Fail closed; zero calls |
| Immediately before provider effect | Fresh sample is within `retry_not_before <= now < original_deadline` | Time gate passes; continue only if every other gate passes |
| Immediately before provider effect | `now == original_deadline` or `now < retry_not_before` | Fail closed/not yet eligible; zero calls |
| Immediately before provider effect | Time authority epoch changes or becomes unknown | Fail closed; zero calls |
| Immediately before provider effect | Authority reports rollback from its last validated sample | Fail closed; zero calls |
| Immediately before provider effect | Time authority is unavailable or returns a non-finite reading | Fail closed; zero calls |

The final time/authority check and provider invocation occur in one synchronous
turn, with no await between them. A passing earlier sample is not evidence that
the deadline or retry bound still passes after claim, evidence access, or
preflight.

The test-only `resume-proposal-harness.test.js` exercises this matrix against an
in-memory reference model: the inclusive retry boundary, fresh checks after
async claim/evidence/preflight/marker stages, marker-before-effect ordering,
held/ambiguous claims, invalid evidence, and uncertain-dispatch quarantine.
This validates the proposal's scenario logic only. It is not wired to the
orchestration runner and does not establish runtime conformance, implement a
durable store/time authority, prove storage authenticity, or satisfy O08.

## O08 acceptance evidence map — 2026-11-09

This map distinguishes executable prototype evidence from the separate
reference-only proposal model. The proposal harness is not wired into the
runner.

| Acceptance area | Runner/store evidence | Reference-only or remaining limit |
| --- | --- | --- |
| Candidate boundaries and corrupt state | `resume-candidate.test.js` covers candidate classification; `local-file-store.test.js` covers persistence and corruption. | The proposal harness models additional time/async combinations; those cases do not prove runner behavior. |
| Current authority, protected evidence and retry lineage | `resume-candidate.test.js` and runner retry/resume tests cover denial, evidence validation, attempt linkage and no dispatch on failed gates. | Context-enabled resume and arbitrary providers are excluded. |
| One-shot claims and process contention | Resume/candidate runner tests and `local-file-store.test.js` cover claim behavior. `resume-subprocess.test.js` releases two processes together immediately before `claimResume`, asserting one claim, one second attempt, two total dispatch markers and one mock effect. | A separate test covers staggered preflight contention. Filesystem/OS trust assumptions apply. |
| Restart and crash points | `resume-subprocess.test.js` verifies restart linkage, permanent claim/no takeover, no replay after marker, and quarantine after an unlinked outcome blob; the shared effect log counts actual mock calls. | Process-crash tests do not simulate power loss or prove behavior on other filesystems. |
| Original bounds and attempt ceiling | Candidate boundary and runner resume tests cover the original deadline, inclusive retry bound and two-attempt cap; subprocess events assert second-attempt linkage. | Provider idempotency and generic exactly-once behavior are not established. |
| Async fresh-time/authority matrix | Runner resume tests cover implemented boundaries; `resume-proposal-harness.test.js` enumerates the broader claim/evidence/preflight/marker scenario matrix. | Harness-only cases are reference logic, not runner conformance. |
| Storage bootstrap and integrity | `local-file-store.test.js` covers initialization ordering, immutable writes and corruption handling. | Digests cannot authenticate a record against an actor who can modify both record and digest. |
| Full O08 acceptance | Independent acceptance verdict is pending. | This finite synthetic evidence does not close O08; broader criteria remain open. |

The simultaneous-process barrier demonstrates one successful claim and at most
one mock effect for this pinned local synthetic fixture. It does not generalize
to other filesystems, production deployment, live providers, or arbitrary
durable-resume implementations.

## Scope estimate and exclusions

The owner-approved local store slice was estimated at 1–2 focused days. The
read-only candidate slice was separately bounded to roughly one focused day.
The no-context writable slice above is likewise narrow; the broader O08
durable-resume acceptance remains incomplete and subject to independent review.
Production-grade
persistent storage, an authenticated integrity root, provider-specific
deduplication, and O09's result linkage remain separate decisions. This slice
does not introduce a provider, alter current retry behavior, close O08, or
unblock O09.
