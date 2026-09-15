# Verified sources and normalization

Studio #78 extends the [preparation gate](context-builder-preparation.md) with
offline source adapters and `gate.normalizeSources(input)`. This is an unreleased
development API in `src/context-builder/`, not a package export or a production
release. No Codex contract, Prompt SDK behavior or immutable release is changed.

## Source inventory and readers

The trusted host registers full approved source descriptors, not live repositories
or search queries. Every binding pins source id/version, kind, classification,
authority/continuity, validity, evidence reference, fragment plan, locator/opaque
handle, media type, byte size and SHA-256. The preparation gate compares the request
against that exact inventory. A reference without a verified byte tuple cannot load.
Repeated locators with contradictory versions, identities, classifications, kinds
or authority/continuity metadata fail during inventory construction. Duplicate
source IDs also fail. Cross-process historical immutability remains the secure
inventory owner's responsibility; this module is not a persistent version registry.

| Factory | Source kind | Byte acquisition |
| --- | --- | --- |
| createMemorySourceBinding({ source, artifact, bytes }) | caller-supplied / synthetic | Copies explicitly supplied Uint8Array bytes; no resolution |
| createPublicSnapshotBinding({ source, artifact, root, filename }) | public-canon, public classification | Async factory for an already-downloaded, pinned local snapshot |
| createApprovedExportBinding({ source, artifact, readExport }) | approved-private, opaque reference | Injected authorized async byte stream for the exact opaque handle |

`artifact` contains exactly `media_type`, `byte_size`, `sha256`. Public descriptors
also carry the exact artifact URI; both tuples must agree. Private metadata comes
from a separately approved secure inventory. Private digests are not put into
public source records. These tuples establish byte identity, not permission,
publication approval or canon truth. The verifier remains a separate trusted gate.

The returned bindings have the existing `{ source, artifact, read }` shape. Install
them in `createPreparationGate({ ...trustedConfiguration, sourceBindings })`.
Directly invoking a binding is trusted-host I/O, **not an authorization API**;
untrusted requests must enter through the gate. Factories validate/copy supplied
metadata; the file factory inspects root metadata only, and never opens source
content until its authorized `read` call. Memory bytes are already supplied by the
host, not fetched on construction. No adapter clones repositories, follows branches,
downloads URLs, evaluates source code or discovers credentials. URI labels are
never dereferenced; upstream snapshot acquisition needs its own explicit approval.

### Local public snapshots

`root` is an absolute host-controlled directory. `filename` is one flat ASCII
inventory name (letters/digits/underscores/hyphens with optional dot-separated
extensions), not a request URI or nested path. Slash, backslash, encoded traversal,
dot-segments and absolute paths are rejected. Root symlinks are rejected; the
canonical root identity is checked again at read boundaries. Final files are opened
with `O_NOFOLLOW` and nonblocking mode, and must be regular files with a single link.
Symlinks, hard links, directories, missing files, size changes and checksum mismatch
fail. Reads use an explicit descriptor and bounded chunks; size/timestamps/root
identity are rechecked before returning verified bytes. Unsupported no-follow
platforms fail closed. Node 22/24 POSIX CI is the supported baseline.

The root and its ancestors must be controlled by the trusted host and not subject
to hostile concurrent rename/mount replacement. Node's portable pathname APIs do
not provide a race-free directory-relative open sandbox; these checks are not a
claim of containment under an adversary who can replace the trusted directory
hierarchy. Such deployments need a reviewed OS-isolated reader service. Flat
filenames and no-follow opens protect against untrusted artifact filenames and
leaf symlinks without treating a live checkout as a source.

### Approved private exports

`readExport({ handle, maxBytes, signal })` is an explicitly installed trusted
function returning an async iterable of Uint8Array chunks. It receives only the
opaque handle and bounded read options, never private paths, credentials or
caller-selected modules. It must enforce access and byte bounds in its transport;
the adapter cannot prevent arbitrary injected code from allocating or ignoring
cancellation. The adapter checks each chunk against remaining space **before
copying**, copies to prevent later mutation, limits chunk count, closes the iterator
on failure and verifies final size/digest. Oversized/short/corrupt streams and raw
reader exceptions fail with sanitized errors, never partial content.

## Normalization flow

Call `gate.normalizeSources({ request, prompt, callerId, signal })`. The gate:

1. Snapshots/validates the request, pinned prompt, exact inventory and all limits.
2. Revalidates preparation policy before each source read; verifies exact returned
   bytes and rechecks policy before raw-byte delivery, as in #77.
3. Rechecks byte identity before parsing. Fatal UTF-8 decoding validates the entire
   artifact, not just selected fragments. Leading source BOMs and invalid encoding
   are rejected. Embedded U+FEFF characters remain literal data.
4. Normalizes each explicit approved fragment, preserving assigned opaque candidate
   IDs/claim IDs and exact source metadata; it does not infer chunks from content.
5. Validates the resulting closed Codex normalized-source records and revalidates
   preparation again before returning them. Revocation/expiry during normalization
   prevents delivery. No candidate or partial list is returned on failure.

Success is `{ authority_mode, preparation, normalizedSources, audit }`. Each record
contains the complete canonical request identity/build ID, exact source id/version,
classification, validity, authority/continuity metadata and explicit fragment
evidence. The order is request source order, then candidate-ID order; reader
registration/acquisition order is irrelevant. Results and nested JSON are frozen.
The preparation bounds narrow across read and normalization handoff checks. There
is no normalization cache, hidden clock, random ID or implicit permission renewal.

For `text/plain`, ranges are nonempty half-open UTF-8 byte offsets on complete
Unicode boundaries. The string is exact: no trimming, CRLF conversion, Unicode
normalization, truncation or summarization. byte_size/SHA-256 cover exact fragment
UTF-8 bytes. A fragment starting at an embedded BOM preserves it.

For `application/json`, a bounded duplicate-key-aware parser validates the complete
document before RFC 6901 pointer extraction. Escaped equivalent keys count as
duplicates, including in unselected branches. Trailing data/commas, malformed
strings, unpaired surrogates and non-finite numbers fail. Pointer traversal uses
own properties only; array indexes are canonical decimal, with no leading zeros,
dash index or `length` lookup. Missing values fail, while null/false/zero/empty
objects and arrays remain legitimate JSON values. Numbers follow the existing
finite ECMAScript/Studio JSON v1 canonicalization semantics; original serialized
bytes remain pinned separately. Candidate identities cover canonical extracted
JSON, not raw whitespace or object-key order. No reviver or executable content runs.

Source-provided policy, classification or instruction text is just content. It
cannot change registered classification, source authority, selection policy,
permission or canon status. This task normalizes all declared fragments; eligibility,
ranking/conflicts and budgeted slot assembly remain #79/#80 responsibilities.

## Limits, errors and privacy

- Adapter artifact ceiling: 8 MiB; normalization aggregate source ceiling: 32 MiB.
  Both are checked from trusted metadata before loading. Request limits may be
  lower and still apply. Limits are bytes, never estimated tokens.
- Export stream: at most 4,096 chunks, including empty chunks, and no more bytes
  than the exact immutable tuple. Trusted transports must also bound allocations.
- JSON: at most 64 nested levels, 100,000 values and two million decoded key/string
  code units. These local safety caps can reject otherwise structurally valid
  inputs; widening them requires review, not hidden default changes.
- Existing request candidate counts and fragment-overlap checks apply. No fallback
  parsing or repair occurs after a budget failure. Parsing is synchronous and bounded;
  cancellation is checked at async boundaries, not a promise of preemptive CPU abort.

Known reader failures are reconstructed as safe `PreparationError` diagnostics.
INVALID_SOURCE describes encoding/parsing/fragment failures; SOURCE_INTEGRITY,
SOURCE_UNAVAILABLE and BUDGET_EXCEEDED distinguish identity/access/resource failures.
Normalized documents contain protected content and private content identities;
never log or publish them. Only the existing value-free audit/error projections
are reader-safe. Durable audit/public attestation issuance remains #82, and a
normalized source does not authorize package use, execution or publication.

## Reproduction and verification

Source/normalized validators use the same reviewed Codex candidate commit
`291453e2a957fb83dedb0c209ed2cdd14ba90c0e` as #76/#77. The generator checks Builder
schema SHA-256 `4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3`
and Context Package schema SHA-256
`d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617` before compiling.
No normative schema copy or new dependency is added. Given those exact schema blobs:

```sh
node scripts/generate-builder-source-validator.mjs /absolute/context-builder.schema.json /absolute/context-package.schema.json
node --test tests/context-builder/sources.test.js
npm test
```

Tests use only synthetic content, temporary public snapshot files and injected
fake private exports. They cover exact Codex fixture equivalence, fragment identity,
repeated/reordered reads, identity-before-parse, hostile JSON/UTF-8, ceilings,
immutable conflicts, safe pointers, traversal/symlinks, denial-before-I/O and
revocation/cancellation before normalized handoff. Production private exports and
trust onboarding remain separately approved; immutable publication remains #86.
