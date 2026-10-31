# Offline orchestration prototype

Status: experimental, synthetic-only prototype. This is not a released
orchestration contract or production execution path.

The prototype exercises a bounded host-owned lifecycle around the existing
Provider Execution and Comic Manifest implementations. It uses one exact public
synthetic Comic Manifest fixture, the existing Prompt SDK, and one
`MockTextAdapter` instance. It does not contact a provider, use credentials,
write to a filesystem, or persist state across processes. The store is in-memory
only.

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
- At most two attempts per job and one mock provider call per attempt.
- A fixed 300,000 ms monotonic job budget. It is not reset between attempts.
- One synthetic mock adapter only. No real providers, network, production
  storage, filesystem, scheduler, daemon, credential handling, or automatic
  restart continuation.
- Read-only recovery inspection. State uncertainty, integrity mismatch, an
  unknown clock epoch, or an expired nonterminal deadline cannot authorize a
  write or another provider call.
- Caller retry authorization is explicit. The retry API also checks the exact
  normalized rate-limit category, retryable flag, and `retry_after_ms` within
  the Provider Execution v1 range of 1–86,400,000 ms, safe
  `RATE_LIMITED_BEFORE_ACCEPTANCE` provider code, no output, same pinned
  production identity, remaining deadline, and attempt ceiling. Mock rate-limit
  options outside that range are rejected before admission or provider dispatch.

## Resource limits

| Resource | Prototype limit |
| --- | ---: |
| Active jobs | 1 |
| Attempts per job | 2 |
| Provider calls per attempt | 1 |
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

The current Comic Manifest validator cannot represent an internal failed result
with no output digest: an empty transformation list fails schema validation,
while a transformation with empty output digests or withheld private outputs
fails semantic validation (`src/comic-manifest/semantics.js`, lines 53–59).
The closed result schema otherwise allows failed results with `OUTPUT_MISSING`
or `VALIDATION_FAILED`, but that does not satisfy the internal transformation
rule.

Accordingly, this prototype preserves a normalized no-output rate-limit,
cancellation, or other unsupported outcome in its in-memory host outcome record
and returns `contract-mapping-blocked`; it does not fabricate an output,
create an invalid Comic Manifest result, or retry. Although the retry method
checks the draft allowlist, it cannot become eligible until the prior result is
terminal and validated. The owner decision for this prototype is to keep the
draft RFC retry path blocked until a separate design resolution provides a
truthful result mapping. No host-only retry bypass, schema change, or
released-contract change is authorized here.

Provider Execution v1 reports cancellation according to its existing signal
semantics. If cancellation wins before SDK settlement, this host cannot infer
whether an adapter-side operation may have completed after the signal; it keeps
the exact SDK result and does not relabel it as success or timeout. A provider
`timed-out` result is likewise preserved and marked `contract-mapping-blocked`,
as its mapping is deferred in the RFC.

## Using the prototype

The package subpath is `@definitely-secure-studio/platform/offline-orchestration-prototype`.
Its public factory accepts no storage, provider, or runtime injection. It is
intended only for local synthetic experimentation. The internal test seam is
not listed in package exports and must not be treated as a supported API.

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
The second attempt always closes the job; there is no third attempt or hidden
retry. Delay is measured conservatively from terminal completion. A caller may
use `closeJob()` instead. A restart can only inspect; it cannot resume retry.

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
