# Protected artifact lifecycle, optional caching and replay

Studio #81 extends the unreleased [preparation/assembly pipeline](context-builder-assembly.md).
No released SDK, Context Package or Codex contract changes. Default operation uses
only memory and retains no shared cache. There is no filesystem, network storage,
implicit clock, timer, source refresh or background cleanup.

## Immutable prepared artifacts

`gate.prepareArtifact(input)` builds an authorized package and returns
`{ artifact, artifact_identity, serialized }`. The local envelope has format
`studio-prepared-artifact-v1`, full `request_identity`, `input_identity` over the
request plus registered raw artifact tuples, and the frozen `prepared` assembly
result. Its identity covers Studio JSON v1 canonical UTF-8 bytes; `serialized` is
that exact canonical string. Source artifact tuples include approved private
digests in the input identity even though the package intentionally omits them.

This is a development storage envelope, **not** a Codex audited build result,
signature, publication receipt or use authorization. Strings, digests, request
identities, lineage and package contents are protected. Never put them in public
logs, source, CI artifacts or public receipts. No returned object grants access.

`gate.replay(input)` bypasses cache reads/writes and rebuilds through registered,
approved pinned readers with fresh preparation checks. It never fetches a newer
source or permits access to revoked inputs. Identical authorized inputs and bounds
yield identical serialized artifacts. `comparePreparedArtifacts(left, right)`
verifies claimed identities/serialization, then returns `identical`, `same_inputs`,
`same_request`, and `same_package`. Changes to request policy/budgets/purpose are
traceable through request identity; changed private byte tuples through input
identity; narrowed authority through package identity even if inputs are unchanged.
Comparison itself grants no access to either artifact; the host must already have
permission to hold both. It emits no content or digest.

## Cache boundary

Install an optional trusted `cache` in `createPreparationGate`. It implements:

- `get({ scope, at })`: return the canonical protected source-cache string, or
  `undefined` for a miss. Do not return history that is no longer reusable.
- `put({ scope, at, reuseUntil, serialized })`: explicitly retain the protected
  string under that immutable scope. `at` is the gate's injected verified time.

The cache reuses **verified raw source bytes**, not preapproved packages or decisions.
Every hit reruns normalization, selection and assembly, allowing the same relational
checks as a fresh build. The scope hashes the entire request (caller, purpose,
classification, prompt/target, source versions, budgets, evaluation time, IDs and
builder/policy versions), registered byte tuples, verifier ID, authority mode and
decision-owner list. This deliberately prefers exact, narrow reuse over hits across
different builds. No caller supplies a cache key to the gate.

Fresh authorization precedes cache access and follows cache reads/writes. Final
assembly authorization still applies. Hits verify scope, canonical serialization,
source order/IDs, exact byte sizes and SHA-256 before normalization. Cache input is
bounded to 48 MiB encoded and the existing 8 MiB/source, 32 MiB aggregate raw limits.
Retained preparation bounds can only narrow current bounds, never extend them.
Even an adapter returning expired history cannot renew that historical grant.
Cache failures are sanitized and fail closed: no silent fresh-read fallback or
partially returned artifact. A slow adapter must honor its own resource bounds;
the host must isolate uncooperative trusted code.

Storage is a **trusted control-plane adapter**, not an untrusted arbitrary blob
service. It must authenticate access, preserve preparation bounds and immutable
records, enforce retention, and prevent unauthorized read/write/rollback. Byte
checks detect source corruption, not a malicious host forging policy history.
Changing verifier implementation requires a new verifier ID/cache namespace or
explicit eviction. Production secure storage and real private-source onboarding
remain separately reviewed; no built-in production adapter is supplied.

## Memory store and retention

`createMemoryArtifactStore({ authorizeAccess, retentionSeconds, maxEntries = 32,
maxBytes = 67108864 })` implements the interface without disk. All options are
explicit positive safe integers. `authorizeAccess({ operation, scope, at })` is
required and must return exactly true for the operation; errors fail closed without
echoing exception text. It is a trusted-host access policy, not an end-user boolean.
Synthetic tests use an allow-all function; production integrations must not expose
the store or such a policy to untrusted callers.

The store also supports trusted-host operations:

- `get({ scope, at, history: true })` requires separate `history` permission and
  can read retained evidence after reuse expiry, but never after retention expiry.
- `evict({ scope, at })` requires `evict` permission and removes that exact entry.
- `cleanup({ at })` requires global `cleanup` permission (`scope: null`) and removes
  retention-expired entries without reading their contents.

Ordinary gets require `reuse`; puts require `retain`. Retention is measured from
the supplied insertion time, not a hidden clock. Gets reject times before insertion.
Expired reuse returns a miss; retention-expired entries are deleted on get/cleanup.
Bounded FIFO eviction removes oldest entries on capacity pressure, never emits their
contents, and does not refresh on access. Oversized single entries fail. Existing
immutable keys cannot be overwritten; repeated writes never extend retention or
reuse. A retained conflicting rebuild therefore fails until the owner evicts it or
uses a new build identity. Expiry/revocation does not authorize a historical read.

The same explicit host-only store interface can retain prepared artifact strings
under a separate namespace containing artifact identity and access scope; this is
not automatic and does not make them source-cache entries. Choose a reuse deadline
no later than their preparation/package bounds. Secure adapters must separately
enforce history access, retention policy, encryption and deletion requirements.
Memory eviction releases references, not guaranteed physical zeroization of JS
strings/GC copies. It does not revoke copies already legitimately delivered; package
use still needs independently verified authorization at use time.

## Verification and remaining work

Run `node --test tests/context-builder/lifecycle.test.js`, `npm test`, and
`node scripts/check-sdk-release.mjs`. Tests use only synthetic public/fake-private
bytes: deterministic replay, cache scope boundaries, fresh revocation, narrowed
and expired grants, hostile/corrupt cache data, safe adapter errors, access controls,
history/cleanup, bounded eviction, immutable leases and private tuple differences.
Durable audit/public receipts (#82), consumer interfaces and immutable release
remain separate. See [ADR 0013](adr/0013-context-artifact-lifecycle.md).
