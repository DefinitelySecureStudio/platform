# O08 durable-resume decision packet

Status: proposal for contract-owner review. This document does not change the
prototype, define a released contract, authorize persistent storage, or claim
O08 completion. It contains no private creative material.

## Current evidence and gap

Platform `main` at `2466db85c13b8f16038d147a0d650614535198c5` has a bounded
same-process retry. The first attempt is retry-eligible only when its verified
provider outcome is the exact rate-limit-before-acceptance case. Explicit retry
then rechecks current authority and immutable evidence, honors the original
deadline and two-attempt limit, and creates one new attempt with a new execution
ID and idempotency key. Recovery after a new runner/process is read-only.

The supported store is in-memory only. The job deadline is monotonic and tied to
the current clock epoch. The mock adapter records calls but does not deduplicate
them. Provider Execution v1 carries an `idempotency_key`; the Platform mock
currently derives a distinct key for each attempt. No existing contract here
states that an arbitrary adapter/provider will honor that key or retain a
deduplication record.

Therefore the current safe retry proof does not generalize to replaying an
uncertain dispatch. A dispatch marker without a verified provider outcome must
remain unresolved. A restart-resume implementation also needs a way to verify
that the original job deadline has not expired without resetting its budget.

## Recommended first bounded resume contract

If the owner wants durable resume, start with only a persisted, terminal,
first-attempt `retry-eligible` state whose immutable evidence proves the exact
before-acceptance rate-limit outcome. On restart:

1. Read only bounded, payload-free routing metadata needed to identify the job
   and its pinned production identity. Reject malformed or ambiguous metadata.
2. Verify current execution authority (and package-use authority on the opt-in
   context path) for the retry action before protected evidence access.
3. Acquire an atomic single-runner claim. Recheck current authority after any
   asynchronous claim/verification boundary and immediately before each
   protected read or new effect.
4. Validate the event chain and every pinned input, prompt, provider outcome,
   and result byte against its recorded size and digest.
5. Verify the original absolute deadline and remaining attempt budget. Never
   replace an expired or unverifiable deadline with a fresh budget.
6. Permit at most one caller-authorized new attempt, with a new execution ID and
   idempotency key, only after the verified before-acceptance proof. Preserve
   the first attempt's immutable result and evidence.
7. Keep a dispatch with missing, ambiguous, corrupt, or unverifiable outcome in
   reconciliation-required state. Do not replay it under this first contract.

This path avoids duplicate effects by requiring evidence that the prior request
was not accepted. It does not promise deduplication across attempts or providers.

## Owner decisions required before implementation

### 1. Deadline across process restart

The current monotonic deadline cannot be compared across a new process or boot.
Choose a supported time basis and rollback policy for persisted jobs. A proposed
option is a persisted absolute UTC deadline checked using a host clock with a
persisted monotonic observation guard; if the clock is unavailable, moves
backward, or cannot be reconciled, fail closed without resume. The current
prototype has no durable trusted-clock service, so this is a contract choice,
not an implementation assumption.

### 2. Storage and single-runner claim

Choose whether O08 authorizes a persistent job store, its atomic append/write
and compare-and-claim guarantees, integrity protections, and behavior when a
claim or commit acknowledgement is ambiguous. The current store is in-memory
and has no crash-safe transaction or inter-process lease contract.

### 3. Uncertain dispatch and idempotency

Recommended first version: never automatically replay a dispatch whose outcome
is uncertain. Keep it unresolved. If future work must retry that case, require
an adapter/provider-specific contract that specifies stable key scope, exact
request fingerprint binding, deduplication retention, and the response returned
for a duplicate. A fresh key per attempt cannot suppress a duplicate effect.
Provider Execution v1's key field alone does not establish those semantics.

## Finite synthetic acceptance matrix after decisions

All rows use the existing exact synthetic production and mock adapter. Protected
bytes, decisions, and effects remain synthetic. For every denied, blocked, or
uncertain row, assert exact call counts and zero unauthorized effects.

| Restart state / fixture | Expected decision | New provider calls | Required evidence |
| --- | --- | ---: | --- |
| First attempt has verified before-acceptance rate limit; current authorities allow; original deadline and attempt budget remain | One explicit resume may start attempt 2 | Exactly 1 | New attempt/key; prior result bytes unchanged; one atomic claim |
| Same state, but authority is denied, expired, revoked, missing, or unverifiable | Deny resume | 0 | No protected evidence read after denial; no claim left active |
| Two runners race to resume the same eligible job | One wins; the other receives a safe conflict/denial | At most 1 total | Atomic claim; immutable event sequence; no duplicate dispatch |
| Original deadline expired or its persisted clock basis cannot be verified | Expired/unverifiable; do not resume | 0 | Original deadline retained; no reset |
| Attempt limit already consumed | Exhausted; do not resume | 0 | Existing attempts preserved |
| Any required event/blob is missing, malformed, corrupt, mismatched, or ambiguous | Reconciliation required | 0 | No new write that implies success; no provider call |
| Dispatch-started exists but no verified outcome exists | Unresolved; do not replay | 0 | No fabricated absence/result; exact prior evidence retained |
| Terminal result and job-close evidence are valid | Read-only terminal inspection | 0 | No new attempt, write, or mutation |
| Resume was denied, then current authority is later granted | Re-evaluate current authority on a fresh explicit resume request | At most 1 if all other gates still pass | No cached authority; same original deadline and budgets |

If the owner chooses to support replay of uncertain dispatch, add a separate
finite adapter-conformance matrix for same-key/same-request replay,
same-key/different-request rejection, dedupe-window expiry, duplicate response,
and provider unavailability. Do not fold that behavior into the first
before-acceptance-only resume path.

## Scope estimate and exclusions

The decision packet is a review artifact and fits within the discovery portion
of O08. A runtime implementation should be re-estimated after the owner selects
the deadline and storage guarantees; it likely exceeds the existing two-focused-
day bound if it includes production-grade persistent storage or a real provider
deduplication integration. This proposal does not change schemas, add storage,
introduce a provider, alter current retry behavior, close O08, or unblock O09.
