# Context Builder preparation gate

The [source/normalization guide](context-builder-sources.md) adds concrete #78
bindings and the gate's `normalizeSources` method without changing preparation authority.

Studio #77 implements the **unreleased development** authorization boundary in
`src/context-builder/`. It has no package export and is not a production release.
It uses the accepted-but-unreleased Codex Context Builder 1.0.0 candidate; #86
must supply immutable release tuples before production adoption. Prompt SDK v1
exports, generated validators and release lock remain unchanged.

## Trusted host versus request data

`createPreparationGate({ mode, verifier, decisionOwners, sourceBindings, getTime })`
is installed by the trusted host, never constructed from a serialized request.
Mode is explicitly `synthetic` or `production`. There is no default verifier,
ambient credential, network lookup, path search or clock.

- `verifier`: trusted implementation with stable `id`, matching `mode`, and async
  `verify({ request, requestIdentity, callerId, at, signal })`. The host reviews and
  installs this code and its trust roots. It authenticates policy evidence and
  checks current revocation state; a digest or supplied allow string is not proof.
- `decisionOwners`: explicit allowlist of opaque UUID owner identities. Policy
  decisions from other owners fail closed, even if an adapter returns them.
- `getTime`: host-provided current UTC time, `YYYY-MM-DDTHH:mm:ssZ`. Test clocks are
  fixed/deterministic. Production hosts must supply trustworthy current time;
  request evaluation_time is never silently substituted for it. The gate samples
  before/after verification, rejects backwards time within an operation, and
  rechecks before delivery. No hidden `Date.now()` is used.
- `sourceBindings`: trusted inventory entries `{ source, artifact, read }`.
  `source` is the complete approved source descriptor, including immutable version,
  classification and fragment plan. `artifact` contains exactly `byte_size`,
  `sha256`, `media_type`, including for private opaque handles. These expected
  bytes come from verified secure inventory, not from untrusted lookup results.
  `read({ maxBytes, signal })` is a pre-bound reader of that exact artifact.

The host passes `callerId` from its authenticated session/channel, **not** from
the untrusted request.caller_id. The gate compares both and binds the verified
decision to the complete canonical request identity and pinned target prompt.
Malicious code already installed as a trusted verifier/reader/clock can lie;
this library is not an in-process sandbox or a production signing service.
Configuring a callback to echo untrusted decisions does not implement authentication.

## Local verifier result interface

This closed adapter result is a Platform implementation interface, not a new
Codex wire document. It has exactly these fields:

| Fields | Required meaning |
| --- | --- |
| authority_mode, verifier_id | Match installed trust mode and verifier identity |
| decision_id, owner_id | Opaque UUID decision identity and allowlisted owner |
| decision | `allow` or `deny`; only allow can proceed |
| preparation_reference | Exact request reference, authenticated by the verifier |
| request_identity | Complete canonical request byte-size/SHA-256 identity |
| caller_id, target, purpose, max_classification | Exactly match validated request; target includes prompt identity |
| not_before, review_after, expires_at | Ordered UTC bounds; current time must be inside and strictly before review/expiry |
| revocation | Exactly `{ status, checked_at }`; status must be `active`, checked_at equals supplied `at` |

Revoked, unknown, stale, missing or unavailable revocation evidence fails. The
verifier must actually consult its trusted policy/revocation mechanism; setting
checked_at to the supplied time without checking is not conforming. It must not
obtain source content as part of verifying permission. Verification errors and
malformed responses are replaced with value-free diagnostics.

The exact request identity also binds source versions/fragment plans, all slots,
intent, builder/package IDs, policy versions, evaluation time and limits. A
caller cannot reuse correlation IDs to authorize a different request. Source
descriptors must independently match the installed inventory, preventing policy
requests from lowering source classification or swapping an artifact handle.

## Calls and effects

`gate.check({ request, prompt, callerId, signal })` validates the explicit data,
the pinned complete Prompt Definition and slot constraints, inventory and
budget; verifies policy; and returns `{ authorized: true, authority_mode,
preparation: { review_after, expires_at }, audit }`. This is informational protected
metadata, not a capability or cache entry. No source reader is called.

`gate.readSources({ request, prompt, callerId, signal })` repeats all checks. It
verifies policy independently immediately before each source read and once more
before delivery. It never accepts a check result, caller allow flag or use-
authorization record as preparation permission. Each request is snapshotted
before the first await; mutation during verification cannot expand its scope.

The gate first checks every requested source against the complete inventory and
aggregate byte budget, so a later unknown source cannot cause earlier reads.
Only trusted read closures receive `maxBytes` and `signal`—never caller-provided
URIs, handles, paths, credentials or module names. Thus traversal/URL variants
cannot redirect a reader. There is no filesystem path resolver in this gate.
Real filesystem/remote adapters in #78 must additionally enforce containment,
symlink/redirect policy, immutable resolution and bounded streaming; installing
an unsafe reader is not made safe by this gate. Readers must obey maxBytes before
allocation; the gate also copies/checks exact returned length and SHA-256.

Success returns `{ authority_mode, preparation, sources: [{ source_id, bytes }], audit }`.
These raw bytes and lifecycle bounds are **protected**, not normalized candidates,
a Context Package or a public receipt. Bounds narrow across all checks and source
windows. No bytes are returned on any failure, including final-read revocation;
already completed reads are not undone. Downstream processing must use the bounds,
preserve classification and perform its own delivery/use revalidation.

There is no authorization cache, retry, grant renewal or source fallback. Requests
with non-JSON objects/accessors, malformed Unicode, cycles or excessive depth/data
are rejected. The object API assumes duplicate-key-aware parsing at ingress; it
does not accept raw JSON strings or recover duplicate keys already discarded by
an external parser. Local safety limits are 64 nesting levels, 100,000 visited
values and two million string/key code units. More permissive limits need review.

Cancellation is checked before new effects and propagated to adapters. An adapter
that ignores cancellation may continue or hang; this gate cannot terminate foreign
code or reverse I/O. Revocation is checked at explicit boundaries, not an atomic
transaction with an external source service. Deployments needing stronger atomic
revocation must implement that in the trusted reader/policy service.

## Synthetic authority, privacy and next boundaries

`createSyntheticPreparationVerifier(decisions)` installs explicit offline fixture
decisions only; it does not create an allow decision from a request. It returns
`{ verifier, revoke(decisionId) }` for deterministic tests. Its fixed synthetic mode
and verifier identity cannot be installed in a production-mode gate; relabeling
only the descriptor still fails the returned authority-mode check. Deliberately
rewriting a verifier's results is trusted-host behavior, not a supported promotion
path. This module ships no real production policy verifier or signing keys.

Failures throw `PreparationError`; `toJSON()` contains only a `diagnostic` with
stage/code/action. No IDs, hashes, field paths, source locations, raw errors,
credentials or policy bodies are included. Success has a separate `audit` projection
with only authorization stage, verified outcome and authority_mode; errors provide
`toAudit()` with only stage, failed outcome and code. Log those projections, not
request, verifier response, read bytes or arbitrary Error stacks. These contain no
identities or timestamps and do not constitute a signed receipt or proof of approval.
Durable audit/receipt delivery is implemented in #82. The gate
cannot claim required-audit completion or successful package assembly.

Preparation is distinct from separate exact-instance Context Package use
authorization. Nothing here grants permission to render, execute, publish or
establish canon. Source normalization is documented in the guide above; selection (#79), assembly (#80),
lifecycle (#81), audit (#82) and SDK integration (#83) remain separate tasks.

## Pinned schema generation and verification

Request validation is generated from reviewed Codex commit
`291453e2a957fb83dedb0c209ed2cdd14ba90c0e` (merged by Codex #11).
Builder schema SHA-256: `4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3`.
Referenced Context Package schema SHA-256:
`d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617`.
This is a development source pin, not a production release tuple. No local
normative schema fork is added. After obtaining those exact approved schema blobs:

```sh
node scripts/generate-builder-request-validator.mjs /absolute/context-builder.schema.json /absolute/context-package.schema.json
node --test tests/context-builder/preparation.test.js
npm test
```

The generator verifies both digests and uses the existing locked Ajv toolchain.
Its output must reproduce byte-for-byte. Tests use only synthetic/public fixtures
and read spies: malformed/denied/mismatched/expired/revoked decisions prove zero
reads; other tests cover between-read revocation, final delivery, mutability,
private projections, byte integrity, traversal-shaped inputs and mode isolation.
