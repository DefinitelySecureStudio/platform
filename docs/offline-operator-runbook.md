# Synthetic operator runbook (O11)

## Scope and acceptance

Target: Platform documentation, replay script and existing Node 22/24 CI. This
bounded handoff covers one pinned public synthetic production, MockTextAdapter,
the no-context LocalFilePrototypeStore path and a finite four-scenario replay.
The accompanying existing tests cover limits, cancellation, corruption and
recovery refusal. No runtime contract or implementation is changed. Estimated
scope: one focused person-day including tests and review; no new service.

Prerequisite: O10's three findings were resolved by Platform PR #78, merged at
`a91d16af1f807289a22671d9b94eebdcf050a66b`. The independent bounded re-review
passed for that tree; this runbook does not close Studio issues or grant live
execution permission. Tracking: [O11](https://github.com/DefinitelySecureStudio/studio/issues/112)
and [O12](https://github.com/DefinitelySecureStudio/studio/issues/113).

## Start from a clean checkout

Use Linux with Node 22 or 24 and npm. Select the exact reviewed PR or merged
commit, not a moving branch. Record `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`,
`node --version` and `npm --version` alongside the test logs. A local directory
with uncommitted changes or reused dependencies is not clean-checkout evidence.

```sh
# In a fresh checkout of the selected commit:
npm ci
# Installation may use the package registry. The following checks are offline.
export NODE_OPTIONS="--import=$PWD/tests/support/offline-network-tripwire.mjs"
node --test
node scripts/check-comic-manifest-conformance.mjs
node scripts/check-context-builder.mjs
node scripts/check-offline-operator-replay.mjs
```

All commands must exit zero. Retain complete logs, not only the final line.
The tripwire blocks the instrumented Node network APIs and is not an OS network
sandbox. Security tests intentionally exercise a denied network operation.
Use direct Node commands after enabling the tripwire: npm itself may attempt
registry update checks, which the tripwire correctly rejects.
Never install provider credentials or production data for these commands.
The synthetic fixture dates, IDs and clocks are fixed, not real authorization.

## Replay matrix and expected output

The replay script uses test-only injection, one fresh caller-owned temporary
local store per run, and exactly three repetitions of each row. It asserts
identical canonical result/event/blob evidence and diagnostics within each row,
and prints one JSON summary. It deletes only its own temporary stores in a
`finally` block. It is a harness, not an operator CLI for arbitrary stored jobs.

| Scenario | Mock calls per run | Final inspection |
| --- | ---: | --- |
| Success | 1 | `terminal` |
| Confirmed no-output rate limit | 1 | `retry-delay-not-elapsed` |
| Authorized retry after delay | 2 | `terminal` |
| Reopened local-store resume after delay | 2 | `terminal` |

Retry and resume explicitly opt into the unreleased result candidate 1.1.0.
The default stable mapping does not represent that no-output failure. Resume
reopens the store with a different monotonic epoch in the same process; actual
process-boundary tests remain in `resume-subprocess.test.js`. Random store-slot
and resume-claim coordination tokens are excluded from normalized comparisons;
results, events and blob bytes are not excluded. Matching this finite matrix
is not a claim of reproducible external generation or generic exactly-once work.

## Limits and cancellation

The existing prototype admits one job per store, at most two attempts and one
mock call per attempt, with a fixed 300,000 ms job budget. Retry does not reset
the budget. Resource limits also bound input/output material and lifecycle
entries; consult [the complete resource table](offline-orchestration-prototype.md#resource-limits).
Do not increase limits to force a failed fixture through.

Caller cancellation uses an AbortSignal on submit/retry/resume. Before dispatch,
a confirmed stop creates no provider outcome. After dispatch, cancellation does
not prove no work occurred: preserve the actual SDK outcome and recorded host
stop. A result mapping may remain `contract-mapping-blocked`. Unknown writes,
late settlement and ambiguous dispatch must not be relabeled success or retried.
A terminal job is not reopened by a late timer or cancellation callback.

Reproduce bounded stop/refusal behavior with the existing focused suite:

```sh
node --test tests/offline-orchestration-prototype/runner.test.js \
  tests/offline-orchestration-prototype/o10-recovery-regressions.test.js \
  tests/offline-orchestration-prototype/retry-package-use-authority.test.js \
  tests/offline-orchestration-prototype/resume-candidate.test.js \
  tests/offline-orchestration-prototype/local-file-store.test.js \
  tests/offline-orchestration-prototype/resume-subprocess.test.js
```

These tests include cancellation and deadlines before and after dispatch,
authority changes across awaited preparation, retry ceilings and corrupted
recovery evidence. Counts overlap the full suite and must not be added to it.
The separate resume-proposal-harness tests are reference-model evidence, not
runtime implementation conformance.

## Recovery decisions

`inspectRecovery(jobId)` is read-only. Use its fixed public diagnostic projection
for operator reporting; never dump raw prompts, paths, identifiers, digests or
exceptions from a protected store into public logs.

- `terminal`: preserve the committed result. Do not rerun it.
- `retry-delay-not-elapsed`: wait within the original deadline; no immediate retry.
- An eligible resume candidate is not permission: require current explicit
  execution/retry authorization, an admissible time mapping, remaining budget,
  verified immutable evidence and the durable one-shot claim. The supported
  path is only the confirmed first-attempt no-output rate-limit candidate.
- Denied/revoked/expired authority, cancellation, exhausted budget, an unknown
  clock epoch, `reconciliation-required`, integrity errors or uncertain writes:
  stop. Preserve the store for scoped investigation. Do not edit events, delete
  a claim, fabricate a result, or reset the deadline to get another call.
- `closed-without-result` can be an intentional authorization-denied retry closure;
  it is not automatically corruption. The original result remains unchanged.

The prototype has no general repair, force-resume, cleanup or daemon command.
Do not use the replay harness against an existing store: it creates fresh stores
and does not accept a store path.

## Storage and escalation

LocalFilePrototypeStore uses caller-owned private directories (0700) and files
(0600), rejects unsafe ownership/modes and symlinks, and verifies immutable blob
bytes and event links. Protect the host account and filesystem. This is neither
encryption nor authentication against a hostile same-account or administrator
edit. Never change security permissions broadly to make an inspection pass.

For a failure, retain the commit/tree and runtime versions, command exit status,
value-free diagnostic, and private evidence locally. Report only synthetic,
non-sensitive summaries. Seek engineering review instead of automatic retry.
The harness temporary data is disposable; real persisted job evidence is not.

## Unsupported readiness claims

No live providers, production content, credentials, deployment, scheduler,
remote/shared database, other-filesystem proof, power-loss durability,
context-enabled restart, authenticating malicious same-account edits, or general
exactly-once external effects are supported by this handoff. O11/O12 contribute
to the synthetic orchestration core only, not completion of the full epic.
See [prototype boundaries](offline-orchestration-prototype.md) and
[the O08 storage decision](o08-durable-resume-decision-packet.md).
