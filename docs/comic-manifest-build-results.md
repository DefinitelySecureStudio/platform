# Comic Manifest build-result verification and public proposal (#96)

`createComicBuildResultBoundary` verifies one explicit production record, one
complete build-result record, one public-release candidate, and an exact episode
assignment. It returns protected evidence and a separate reader-safe proposal.
It does not publish a record, write Universe canon, retrieve inputs, render media,
or install a trust provider.

```js
import {
  createComicApprovalBoundary,
  createComicBuildResultBoundary
} from '@definitely-secure-studio/platform/comic-manifest';

const approvalBoundary = createComicApprovalBoundary({
  producerActor: hostProducerId,
  getTime: () => trustedPolicyClock(),
  verifyCurrentApproval: binding => hostCheckIssuerRoleAndRevocation(binding)
});

const builds = createComicBuildResultBoundary({
  approvalBoundary,
  readArtifactBytes: ({ artifactUri, maxBytes }) =>
    hostReadExactBuildArtifact(artifactUri, { maxBytes }),
  verifyCurrentDisclosureApproval: binding =>
    hostVerifyQualifiedDisclosureReview(binding),
  verifyPrivateInfluence: binding =>
    hostVerifyOpaquePrivateLineageAttestation(binding)
});

const decision = await builds.verify({
  productionSource,
  resultSource,
  candidateSource,
  previousSource,
  assignmentSource,
  approvalSources
});
if (decision.valid) {
  // Keep decision.protected_evidence in the restricted evidence boundary.
  // Present decision.proposal for downstream Universe review.
}
```

All record arguments are raw JSON strings or bounded byte arrays. They are
validated and snapshotted before the first asynchronous callback. Approval input
arrays are also copied before awaiting. The #95 approval boundary runs after byte,
attestation, and disclosure callbacks, so the current role/revocation check occurs
at the proposal boundary. Each callback receives frozen input and must return the
literal boolean `true`; labels or caller-supplied statuses never authorize.

## Exact record and input linkage

The result must be `complete`; partial, failed, empty, diagnostic-bearing or
missing-required-output results cannot produce a proposal. #94's
`validateComicOutputCompatibility` checks the exact production ID/revision/
identity, copied input references, declared output profile/media/dimensions/
accessibility/rights metadata, required-output presence, and release output
preservation. #96 keeps this metadata relationship check separate from artifact
byte verification.

The public candidate's `input_canon` must equal the production record's exact
`inputs.canon` reference C(n). It cannot name a later C(n+1) snapshot containing
this release. Its public dependencies must equal the ordered, exact-tuple-
deduplicated list derived from production dependencies, prompt definitions, and
public asset dependencies. Tool, workflow identity, start/end times,
reproducibility, and ordered transformation step IDs must match the selected
result. A non-passing gate in either the build result or candidate blocks a
proposal.

## Bounded artifact-byte provider

The caller must install `readArtifactBytes`; the module has no path, URL, network,
or storage reader. For each selected build-result output it passes a frozen
request containing the exact artifact URI, media type, expected byte size and
SHA-256, rendition ID, production/result identities, and `maxBytes`. The provider
may return one `Uint8Array`/`Buffer` or an async iterable of byte chunks. Each
chunk is copied once before the next asynchronous step, hashed as raw bytes, and
counted against the per-artifact and cumulative ceilings. Shared-memory views,
proxies, other object types, empty/incomplete artifacts, oversized data, missing
bytes, size mismatches, and digest mismatches fail with fixed diagnostics.

The default per-artifact ceiling is 50,000,000 bytes, the cumulative ceiling is
200,000,000 bytes, and each artifact stream is limited to 65,536 chunks. A host
may choose a lower cumulative bound or raise it up to 1,000,000,000 bytes. The
provider must enforce `maxBytes` while reading so an
oversized source is rejected before unbounded allocation; Platform independently
checks every observed chunk and total. Byte verification proves only the recorded
length and SHA-256. It does not inspect media signatures, dimensions, rendering,
accessibility quality, rights, or disclosure safety.

Only selected build-result artifact locations are read. Public output locations
are not fetched: #94 requires the candidate to preserve each selected output's
content identity while allowing its public URI to differ. URIs with embedded
userinfo or credential-like query parameters are rejected before any provider
call. Other URL/text safety requires the explicit qualified disclosure review;
no string scan is treated as proof of non-disclosure.

## Disclosure and private influence

`verifyCurrentDisclosureApproval` is required for every proposal. It receives the
exact validated candidate, candidate identity, publication scope, frozen
allowlisted proposal, approved public artifact tuples, and verified private-byte
observations. The host must check a current, explicit qualified review of the
actual text, URLs, metadata, and selected bytes for the exact candidate. The
callback is intentionally not a heuristic scanner or a model-generated allow
boolean.

Private influence is derived from non-public production/result classification,
protected/non-public asset references, non-public prompt context, or private
transformation flags. The candidate must itself be classified `public`, and its
`private_context.influenced` declaration must agree with the derived influence.
When influence is present,
`verifyPrivateInfluence` must externally verify the candidate's opaque
`attestation_reference`. Its frozen binding contains the exact production ID,
revision and identity; result ID, attempt and identity; release candidate ID,
revision and identity; verified result and public artifact identities; and full
input/transformation lineage. The verifier must authenticate its issuer and
compare the stored restricted mapping; a caller-supplied mapping or reference
alone is not authority. Changing any bound input requires a new attestation.

The existing #95 approval boundary then checks the current detached publication
roles, exact candidate subject, artifact digests, scope, intended action,
producer separation, expiry and revocation. It requires `publisher` and
`canon-editor`, plus `disclosure-reviewer` when private context influenced the
candidate. This verifies current approval evidence; it does not perform the
publication action or declare canon.

## Separated output

Success returns:

- `protected_evidence`: complete parsed production, result, candidate, predecessor
  and detached approval records; exact identities and input lineage; verified
  artifact lengths/digests; and callback outcomes. Keep this object in restricted
  storage and out of public logs.
  - `proposal`: a newly built DTO from an explicit field allowlist. It includes only
    public release metadata, C(n), public dependencies, the selected outputs and
    their approved public hashes/locations, safe gate/execution fields, and the
    opaque approved attestation reference. It omits production/result IDs and
    identities, build artifact locations, detached/public approver identities and
    private evidence fields that have no public allowlisted representation.

The proposal intentionally retains reviewed free text and public URLs. Platform
does not claim static canary or string scanning can prove those fields safe; the
qualified disclosure verifier must review the exact proposal and reject private
identifiers, locations, hashes, and encoded/content-derived fingerprints there.

The proposal is not a `comic-public-release` record: approval identities are
deliberately absent. It is a reader-safe review proposal for Universe's separate
editor decision. Platform performs no write, publication, numbering, or canon
promotion.

## Offline conformance

```sh
node --test tests/comic-manifest/build-result.test.js
node --test tests/comic-manifest/*.test.js
npm test
```

Tests use synthetic text and binary bytes, a fake explicit byte provider, and
offline approval/attestation adapters. They cover exact identity/input/C(n)
linkage, all declared outputs, missing/short/empty/oversized/tampered bytes,
unrelated/incomplete results, stream and Buffer mutation, source mutation across
awaits, current authorization after external awaits, attestation binding,
disclosure denial for nested/free-text/URL canaries, credential-bearing URIs,
value-free diagnostics, proposal allowlisting, and the no-influence branch. These
fakes exercise local boundary behavior; they do not establish production trust or
review infrastructure.
