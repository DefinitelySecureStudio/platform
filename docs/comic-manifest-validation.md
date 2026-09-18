# Comic Manifest parsing and local validation (Studio #90)

The **unreleased** `@definitely-secure-studio/platform/comic-manifest` entry point
parses and validates explicit raw JSON against the owner-merged Codex candidate.
It has no source reader, network fetcher, execution engine, approval provider or
publisher. It does not mutate the released Prompt SDK or Context Builder.

```js
import {
  parseComicManifestJson,
  validateComicManifest,
  COMIC_MANIFEST_LIMITS,
  COMIC_MANIFEST_CONTRACT
} from '@definitely-secure-studio/platform/comic-manifest';

// rawJson is a caller-supplied string, Buffer or plain Uint8Array.
const result = validateComicManifest(rawJson);
if (!result.valid) {
  // Safe to route as diagnostics: only fixed stage/code pairs, no input values.
  console.error(result.diagnostics);
} else {
  // value and identity may be protected. Keep them in the approved data boundary.
  const { value, identity } = result;
}
```

## API and result contract

| Export | Meaning |
| --- | --- |
| `parseComicManifestJson(source)` | Bounded JSON grammar/encoding checks; success `{valid:true,value,diagnostics:[]}` does not establish a Comic Manifest schema |
| `validateComicManifest(source)` | Parse, dispatch exact kind/version, validate the generated closed schema, check record-local invariants; success adds canonical `identity` |
| `COMIC_MANIFEST_LIMITS` | Frozen contract maximums; callers may reject stricter limits before invoking the API |
| `COMIC_MANIFEST_CONTRACT` | Frozen reviewed source commit, schema ID/size/digest and explicit `unreleased-development` status |

Both functions return `{valid:false,diagnostics:[{stage,code}]}` on failure. There
is one deterministic first-failure diagnostic, no partial `value` or identity, no
raw exception and no caller-supplied labels. They neither throw for malformed input
nor log. Successful parsed objects have null prototypes and all objects/arrays
are recursively frozen. The caller owns the result and must handle its contents
according to classification; only diagnostics are value-free.

Inputs are primitive strings, Buffer or exact-prototype Uint8Array. Plain objects,
boxed strings, proxies, subclasses, shared-memory views, ArrayBuffer and streams
are unsupported. Raw input is deliberate: accepting parsed objects would lose
duplicate-key/encoding evidence and allow accessors or coercion hooks. Byte inputs
are copied within the byte budget using intrinsic access; user-defined length,
buffer, iterator or conversion methods are not invoked. Supply a complete bounded
raw input, not an unbounded stream or implicit path/URL.

`validateComicManifest` accepts `comic-production`, `comic-build-result`,
`comic-public-release`, and the separately defined `comic-approval-binding` envelope
at exact `spec_version: "1.0.0"`. Unknown fields/kinds/versions fail; there is no
coercion, defaulting, repair, remote schema resolution or permissive extension mode.
Canonical identity covers the complete validated record using existing
`studio-json-v1`: sorted object keys, preserved array order, no whitespace/Unicode
normalization, UTF-8 size and SHA-256. Raw transport integrity is a separate check.

## Parser bounds and diagnostics

- At most 8 MiB UTF-8 bytes per document (checked before parsing/byte-input copying).
- Root depth zero, maximum depth 32; at most 100,000 JSON values including root.
  Object member names have separate string checks and are not counted as values.
- At most 32,768 decoded UTF-8 bytes per string or member name. Escaped token scans
  also have a bounded worst-case limit before string decoding/allocation.
- Strict JSON whitespace/grammar; duplicate **decoded** object keys, BOM, invalid
  UTF-8, raw/escaped unpaired surrogates, non-finite and unsafe integer values fail.
- Schema field/count/string limits apply additionally; schema lengths count Unicode
  code points. No partial documents or truncated strings are returned.

Parse codes: `INPUT_TYPE`, `INPUT_BYTES`, `INVALID_UNICODE`, `JSON_BOM`,
`JSON_SYNTAX`, `DUPLICATE_KEY`, `DEPTH_LIMIT`, `VALUE_LIMIT`, `STRING_LIMIT`,
`NUMBER_RANGE`. Schema codes: `SCHEMA_INVALID`, `UNSUPPORTED_KIND`,
`UNSUPPORTED_VERSION`. Diagnostics omit property names, paths, source fragments,
Ajv parameters, object values, exception messages and stack traces. Parser scan
order, then kind/version/schema, then local semantic order determines the first
failure. Ajv runs fail-fast and its raw diagnostic state is discarded.

## What local semantics establish

Production checks revision/predecessor shape, unique local identities, ordered
text speaker rules, local asset/prompt references, declared input classification,
required rendition presence and media/dimension consistency. Input tuples reject
explicit floating tag names but their immutability/authenticity still needs an
artifact verifier. Result checks unique outputs/gates, declared input classification,
execution time order, tool membership and complete protected transformation shape.

Release checks revision/predecessor shape, final title, deduplicated public tuples,
output identities, exact gate ordering, required public approver roles, decision
and publication time order, and public transformation digests drawn only from the
record's declared public dependencies/canon/outputs. It cannot establish that those
declared public inputs really are public. Approval binding checks time ordering,
publication scope bounds and sorted artifact-list shape for the claimed role; it
cannot authenticate the actor or evaluate current permission.

Semantic codes: `REVISION`, `DUPLICATE_ID`, `LOCAL_REFERENCE`, `SPEAKER`,
`CLASSIFICATION`, `REQUIRED_RENDITION`, `DIMENSIONS`, `FLOATING_REFERENCE`,
`TIME_ORDER`, `TRANSFORMATION`, `TOOL_REFERENCE`, `FINAL_TITLE`,
`DUPLICATE_REFERENCE`, `GATE_ORDER`, `APPROVAL_ROLE`, `PUBLIC_PROVENANCE`,
`ARTIFACT_ORDER`, `APPROVAL_ARTIFACTS`; unexpected internal failures use the fixed
`SEMANTIC_INVALID`. Timestamps are schema-validated UTC calendar values; ordering
preserves sub-millisecond precision and RFC3339 leap-second syntax without reading
a clock or rounding through JavaScript Date.

**`valid: true` is record-local validity, not build success, current authorization,
disclosure safety, canon status or publication eligibility.** Partial/failed result
records, release candidates with failed gates and historical approval envelopes
can be valid records. This API never checks the wall clock, renews a grant, marks
a gate complete, follows a reference, issues an attestation or approves a payload.

#91–#94 add richer episode/reference/foundation/output integration. #95 handles
cross-revision/current approval boundaries; #96 handles cross-record build-result
verification and public projection. Actual predecessor bytes, complete public
input lineage, artifact hashes/dimensions, trusted identities/revocation, required
output matching against production, human rights/accessibility/disclosure review
and actual publication remain outside this local API. Never use it as a replacement
for those checks. Normative gaps return to Codex, not local schema edits.

## Contract adoption and reproducible generation

Normative source: [Codex specification](https://github.com/DefinitelySecureStudio/codex/blob/e415596f2ec73f4d25b289532a72a565ff33c28d/specs/manifests/comic-manifest-v1.md)
and RFC 0007, merged commit `e415596f2ec73f4d25b289532a72a565ff33c28d`.
[Runtime metadata](../src/comic-manifest/contract.js) pins the exact schema bytes;
[development fixture lock](../tests/fixtures/comic-manifest-validation-lock.json)
pins schema, scenario and negative fixtures to that same reviewed commit. These
bytes match the previously reviewed #89 artifacts. They are candidate source
references, **not immutable production release tuples**. #99 remains the release
gate; no tag, registry publishing or production-ready claim is introduced here.

```sh
npm ci
npm run generate:comic-schema -- tests/fixtures/comic-manifest-v1.schema.json
node --test tests/comic-manifest/*.test.js
npm test
```

The generator verifies schema size/digest and the installed/locked Ajv 8.20.0 and
ajv-formats 3.0.1 versions before writing standalone validators. It takes explicit
local bytes and never fetches. The committed generated file must reproduce exactly;
it is not hand-edited. Existing schema fixture bytes and released schema/code/locks
stay unchanged. New reviewed contract versions require a separate pin update,
regeneration, conformance and owner review, never edits under an existing identity.

Tests cover reviewed positive/negative fixtures, malformed grammar, duplicate and
prototype keys, exact byte/depth/value/string limits, Unicode, unsafe coercion hooks,
value-free failures, local semantics, canonical identity agreement, reproducible
generation and schema tampering. An isolated effects test disables filesystem,
network, process execution, dynamic code and clock APIs **after module loading**,
then validates all record kinds without calling any of them. This demonstrates
validation effects, not that Node loads installed modules without filesystem access.

## Constitutional and rollback scope

Constitution v1.0.0, tag `constitution/v1.0.0`, Studio commit
`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`; ADR 0018 at
`7b5065cef76bea9580609caba356b0d8fe7cc17c`. Owner: @andrewperis. Universal,
repository/production-system and automated-workflow implementation profiles apply
to this bounded module. Tests support parsing, privacy and effect-boundary review;
owner review of the exact PR remains required. No creative/canon decision, real
private-source access, production trust onboarding or release conformance is
claimed. Rollback removes the unreleased entry point and its development consumer;
it does not alter historical contracts or revive permission. Reassess on contract,
resource-limit, diagnostic, effect or authority-boundary changes.
