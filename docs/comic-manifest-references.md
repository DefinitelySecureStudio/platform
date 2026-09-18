# Comic Manifest immutable reference verification (#92)

The unreleased `./comic-manifest` module adds `planComicReferences`,
`createComicReferenceResolver` and `COMIC_REFERENCE_LIMITS`. They implement the
existing [Codex v1 reference semantics](https://github.com/DefinitelySecureStudio/codex/blob/e415596f2ec73f4d25b289532a72a565ff33c28d/specs/manifests/comic-manifest-v1.md)
without changing schemas or released Prompt SDK/Context Builder bytes.

## Planning and exact identities

`planComicReferences(productionSource)` accepts the bounded raw input forms from
[the validation API](comic-manifest-validation.md). It validates a production
record and returns `{valid:true,manifest_identity,classification,references,diagnostics:[]}`.
This is a **protected inventory plan**, not public provenance or authorization.
It performs no reads. Other record kinds fail with `RECORD_KIND`.

Each frozen entry contains `reference`, `classification`, `uses`, and internal
content-identity `checks`. The reference selectors are local adapter arguments,
not additions to the normative stored schemas:

| Selector | Preserved identity |
| --- | --- |
| `{kind:"public",dependency}` | Complete repository/version/immutable-tag/commit/artifact URI/media-type/size/SHA-256 tuple, for canon, dependencies, prompt definitions and public assets |
| Existing `{kind:"protected",handle,media_type,byte_size,sha256}` asset reference | Exact opaque handle plus protected byte identity; never a public location |
| `{kind:"context-package",package,manifest_identity}` | Exact package id/version/instance and complete canonical manifest identity |
| `{kind:"builder-result",identity}` | Complete canonical Builder result identity |

Exact selectors deduplicate in first-use order. `uses` preserves every consumer,
including asset IDs and ordered panel IDs from #91; multiple panels can share one
verified artifact. Missing/duplicate local references already fail local validation.
The planner does not normalize URIs, change versions, refresh sources or interpret
creative text as a reference. Explicit branch/latest/wildcard tags fail. An arbitrary
tag name cannot prove immutability: the host must review tag-to-commit authenticity
when installing an inventory entry. No branch resolution exists in this module.

## Host installation

```js
import { createComicReferenceResolver } from
  '@definitely-secure-studio/platform/comic-manifest';

const resolver = createComicReferenceResolver({
  bindings,                 // reviewed fixed-source closures, described below
  requiredPublicReferences, // exact public selectors for required contracts/tools
  authorize,               // host-installed trusted access verifier
  getTime,                 // explicit current UTC policy clock
  callerId, purpose, maxClassification,
  timeoutMs: 30_000
});
const result = await resolver.verify(productionJson, abortController.signal);
```

This configuration is **trusted host code**, never supplied from a manifest,
source artifact or model output. Every binding contains:

- `referenceSource`: raw JSON for one exact selector above;
- `artifactSource`: raw JSON with only `media_type`, `byte_size` and `sha256`;
- `classification`: the host-reviewed classification; and
- `read({maxBytes,signal})`: a trusted function returning an async iterable of
  Uint8Array/Buffer chunks from a fixed authorized source.

The metadata is snapshotted. Duplicate selectors, conflicting public URI/protected
handle mappings, invalid limits, media/size/digest disagreement with declared public
or protected asset references, and missing authority configuration fail installation
with a fixed `RESOLVER_CONFIGURATION` error. Public bindings must be public;
protected asset bindings must not be public. Context/Builder byte transport is
`application/json`. Canonical context identities do not specify raw transport bytes,
so the host must install a separately verified size/digest tuple for that transport.

`requiredPublicReferences` is a nonempty list of installed public selector JSON
strings. The host lists the approved contract/tool baseline; omission from a
production plan fails before any read. Exact versions/commits/bytes remain pinned.
The host is responsible for selecting the correct contract/tool roles; this API
cannot infer those roles from an arbitrary repository name. Synthetic candidate
pins are development inputs, not evidence of an immutable production release.

**Readers receive only the expected byte bound and an AbortSignal.** No request URI,
path, object-store key or handle is forwarded to redirect them. Bind a reviewed
source in the closure when installing the inventory. The core has no network or
filesystem adapter, follows no redirects and never uses ambient credentials. Changed
URIs (including traversal/encoded paths), commits, hashes or handles fail exact
inventory matching instead of selecting another reader. A filesystem/network
adapter installed by a host must enforce its own approved root, symlink, redirect,
credential and destination controls inside that trusted closure; it must not map
untrusted request strings to locations. No direct Lore checkout is supported.

## Access verification, limits and failure

All selectors, classifications, required dependencies and total byte budgets are
checked before any reader is invoked. Then every selected source is authorized
before the first read. Authorization repeats immediately before each read, after
verification and again for all sources before delivery. A denied or unconfigured
source in the initial plan causes **zero reads** across the operation.

`authorize({scope,signal})` must authenticate current access against host-owned trust
and revocation policy, then return bounded raw JSON with exactly:

```text
decision: "allow" or "deny"
scope: the exact received scope
not_before: UTC timestamp
expires_at: UTC timestamp
revocation: { status: "active" or "revoked", checked_at: scope.at }
```

The frozen scope binds `operation: "comic-reference-read"`, installed `caller_id`,
`purpose`, `max_classification`, exact `manifest_identity`, exact canonical
`reference_identity`, transport `artifact`, source `classification` and explicit
current `at`. The response must match that scope exactly, have a currently valid
interval and active current revocation evidence. A bare allow flag, document-supplied
grant, missing verifier or unverifiable response is insufficient. This adapter
protocol is not a signed production grant format or a new Codex contract. Production
trust/provider onboarding remains separately reviewed; a synthetic fake cannot
serve as a production authority.

`getTime()` and decision bounds use real calendar-valid UTC timestamps with seconds
or exactly three fractional digits (`...Z` or `....000Z`). Clock reversal, future or
expired grants fail. The earliest grant expiry observed during the entire operation
is retained; later responses cannot extend it or silently renew permission. Policy
time is checked around every stream read and before delivery. Operational timeout
uses a separate monotonic clock and abort timer, not an implicit policy time.

Limits: at most 256 unique references, 8 MiB per artifact, 32 MiB total expected
bytes, 4,096 chunks per artifact, and 30 seconds per verification. The host may
choose a shorter positive timeout. Chunks are checked before copying; shared-memory
or non-byte chunks fail. The operation copies reader buffers so later mutation of a
reader's chunk cannot alter collected bytes. Reads cannot silently truncate: final
size and SHA-256 must equal the pinned values. JSON identity checks additionally use
the bounded raw parser (including its depth/value/string limits).

Hangs in an async verifier, policy clock, reader or iterator are deadline-bounded.
External cancellation propagates a private internal signal; failures attempt iterator
cleanup without waiting indefinitely. Trusted adapters must honor cancellation and
bound their own acquisition: JavaScript cannot forcibly stop arbitrary host code
that ignores its signal or blocks the event loop. The core neither retries nor
falls back, and never reports partial artifacts as successful.

## Content verification and result handling

After raw byte identity verifies, prompt definitions must match the declared complete
canonical identity and logical id/version. Context Package documents pass the unchanged
released package validator and match package id/version/instance, canonical manifest
identity and classification. Builder results must be prepared v1 records with the
exact complete canonical identity and package classification. These are artifact
identity checks; #93 adds full prompt/Builder/package relationship and SDK handoff
integration. Historical preparation/use references do not authorize these reads or
subsequent package use. Actual use still needs its separate current authorization.

Success returns `{valid:true,manifest_identity,classification,artifacts,diagnostics:[]}`.
Each artifact retains its complete selector, classification, transport identity,
consumer uses and copied bytes. Metadata/arrays are frozen; returned byte buffers
are caller-owned and mutable. Reverify before a later consequential use if bytes
can change. This result is **protected according to the production classification**.
It is not an attestation, public projection, release record, canon assertion or
reusable permission grant. Never log/publish the plan, selectors, hashes, bytes or
restricted authority responses. #96 owns separately reviewed safe projection.

All runtime failures return only `{valid:false,diagnostics:[{stage,code}]}`; no
partial artifacts, raw exceptions, URLs, handles, digests, private IDs or content
appear. Ordinary parse/schema/local validation diagnostics pass through unchanged.
Reference codes are `REFERENCE_SHAPE`, `RECORD_KIND`, `REFERENCE_LIMIT`,
`CLASSIFICATION`, `FLOATING_REFERENCE`, `SOURCE_UNCONFIGURED`, `REQUIRED_REFERENCE`,
`ARTIFACT_LIMIT`, `TOTAL_LIMIT`, `ARTIFACT_INTEGRITY`, `ARTIFACT_IDENTITY`,
`SOURCE_UNAVAILABLE`, `AUTHORITY_UNVERIFIABLE`, `ACCESS_DENIED`, `STALE_AUTHORITY`,
`CANCELLED` and `TIMEOUT`.

## Verification and governance

Run `node --test tests/comic-manifest/references.test.js`, then `npm test`.
Public synthetic fixtures cover exact tuples/identities, shared panel assets,
protected handles, missing/substituted/floating sources, transport/canonical mismatch,
limits, denied and stale authority, revocation before delivery, cancellation, cleanup
and hung adapters. An isolated subprocess disables ambient filesystem/network/process
and dynamic-code APIs after module loading while explicit memory readers resolve
all fixture references. No actual private sources, paid providers or public projection
are involved. Existing offline Builder conformance remains part of regression checks.

Constitution v1.0.0, tag `constitution/v1.0.0`, commit
`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`; Studio ADR 0018 at
`7b5065cef76bea9580609caba356b0d8fe7cc17c`. Owner @andrewperis reviews the exact
change. Universal, repository/production-system and automated-workflow profiles
apply to these controlled effects. The module remains unreleased, with production
adoption gated by #99. Existing normative schemas and foundation releases are
unchanged. Rollback removes the new resolver/planner exports and installed adapters;
it never rewrites historical artifacts or restores revoked permission. Reassess on
source, trust, classification, policy-clock, containment or downstream-use changes.
