# O08 durable-resume decision packet

Status: the narrow synthetic resume scope was accepted by the contract owner
on 2026-11-08; the local storage trust boundary is selected below. This does
not define a released contract or claim O08 completion. It contains no private
creative material.

## Current evidence and gap

Platform `main` at `94e4fe60c84a455b524d14f57b1adaa4c4ad7c9f` has a bounded
same-process retry. The first attempt is retry-eligible only when its verified
provider outcome is the exact rate-limit-before-acceptance case. Explicit retry
then rechecks current authority and immutable evidence, honors the original
deadline and two-attempt limit, and creates one new attempt with a new execution
ID and idempotency key. Recovery after a new runner/process is read-only.

The supported store is in-memory only. The job deadline and retry delay are
monotonic and tied to the current clock epoch. Retry eligibility also retains
the original `retry_not_before`; resume must preserve and verify both that value
and the original job deadline. The mock adapter records calls but does not
deduplicate them. Provider Execution v1 carries an `idempotency_key`; the
Platform mock currently derives a distinct key for each attempt. No existing
contract here states that an arbitrary adapter/provider will honor that key or
retain a deduplication record.

Therefore the current safe retry proof does not generalize to replaying an
uncertain dispatch. A dispatch marker without a verified provider outcome must
remain unresolved. A restart-resume implementation also needs a way to verify
that both the original job deadline and `retry_not_before` remain valid without
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
owner-controlled directory on a supported local filesystem. The implementation
checks private directory/file modes, current-user ownership where the platform
exposes it, and rejects symlinked roots/files. The caller must ensure the path
is on supported local storage; network/shared filesystem detection is not
reliable and such filesystems are outside this contract. Store one canonical
newline-delimited lifecycle event log per job and immutable blobs created
exclusively. Event and blob writes are not reported successful until `fsync`,
exact read-back and pending-marker removal are confirmed. A pending marker after
a crash makes the record unknown and requires reconciliation. Use an exclusive
per-job claim marker; never expire, steal, or automatically release a claim
after restart. A malformed log, partial blob, or ambiguous claim/write is
unknown. No provider call occurs from this storage-only slice.

Trust assumption: the filesystem, OS account boundary, and directory owner are
trusted against malicious modification by the same account or an administrator.
Stored digests detect mismatch against trusted event metadata; they do not
authenticate an event log and do not resist an actor who can rewrite both data
and metadata. No signing key or separate integrity service is introduced.

The implementation is deliberately split at the storage boundary to fit the
issue's 1–2 focused-day cap: this slice supplies local persistent store and
claim primitives plus restart/corruption tests, but does not reconstruct jobs
or dispatch resumed attempts. Writable resume rehydration and effect
authorization remain the next bounded implementation slice. O09 remains open
and is not satisfied by this store primitive.

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

## Scope estimate and exclusions

The owner-approved local store slice is estimated at 1–2 focused days, including
focused tests and handoff. The complete writable-resume/reconstruction flow is
estimated above that bound and is intentionally split. Production-grade
persistent storage, an authenticated integrity root, provider-specific
deduplication, and O09's result linkage remain separate decisions. This slice
does not introduce a provider, alter current retry behavior, close O08, or
unblock O09.
