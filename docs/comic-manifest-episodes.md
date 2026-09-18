# Comic Manifest episode structure and revision relationships (#91)

The unreleased `./comic-manifest` module now adds four pure functions on top of
[#90's raw-input validator](comic-manifest-validation.md). They consume explicit
bounded JSON strings/Buffer/Uint8Array, return fixed value-free diagnostics on
failure, and perform no storage, retrieval, generation, rendering or publication.
The owner-merged Codex schema and released SDK/Builder bytes are unchanged.

```js
import {
  describeComicEpisode,
  validateComicRevision,
  validateComicPublicationBinding,
  validateComicEpisodeMetadata
} from '@definitely-secure-studio/platform/comic-manifest';

const draft = describeComicEpisode(productionJson);
const revision = validateComicRevision(nextProductionJson, previousProductionJson);
const binding = validateComicPublicationBinding(productionJson, releaseJson,
  JSON.stringify({ production_id: productionId, episode_id: episodeId }));
const presentation = validateComicEpisodeMetadata(releaseJson, publicMetadataJson);
```

## Ordered episode structure

`describeComicEpisode(source)` accepts a `comic-production` record and returns
`{valid:true,identity,episode,diagnostics:[]}`. The frozen episode view contains
`production_id`, `revision`, `title` and ordered `panels`. Each panel retains its
ID, description, asset IDs and prompt bindings and gets a one-based `position`.
Its dialogue/caption entries retain all content/IDs and get positions within that
panel. Positions are derived views, never new fields written to the Codex record.

Drafts use the supplied opaque production UUID and may be `Untitled`. This API
never allocates, guesses or reserves a publication number. It preserves panel and
text array order, including non-alphabetical IDs; it never sorts content by ID.
The inherited local validator rejects duplicate panel IDs, duplicate text IDs
across panels, duplicate/dangling asset/prompt references, non-array ordering and
invalid dialogue/caption speaker relationships. Multiple panels may intentionally
reference the same asset or reviewed prompt definition. Text IDs remain unique
across the episode even when two panels contain identical words.

The closed v1 contract has no `next_panel`, independent `panel_order` or embedded
cross-panel command fields. Unsupported fields fail. Its cross-panel relationships
are global text-ID uniqueness and references to episode-scoped assets/prompts.
Adding a panel-link vocabulary requires a Codex proposal, not an implementation
extension. Array order is authoritative; changed order is a changed payload.

Creative description, dialogue, captions and speaker text remain inert strings,
even when they resemble instructions, commands or templates. They never create a
prompt binding. `prompt_bindings` must explicitly name declared reviewed prompt
references; this API does not load, execute or approve them. Semantic continuity
and whether an edited element represents the same creative element remain human
review obligations. The view preserves supplied IDs rather than inventing new ones.

**The episode view and identities may be protected.** They are not public projections
and must not be logged or published automatically. Public metadata is returned
separately by the publication-binding/presentation helpers below.

## Exact adjacent revision validation

`validateComicRevision(candidateSource, previousSource = null)` accepts production
or public-release records of the same kind. Success returns the ordinary validated
candidate result plus `relation`:

- `initial`: revision 1 and no predecessor supplied.
- `unchanged`: the same production/episode ID, revision and complete canonical
  identity as the supplied record. Formatting/object-key order may differ.
- `successor`: exactly the next revision, with a complete predecessor reference
  matching the supplied predecessor's ID, revision, canonical size and digest.

A revision greater than one needs explicit predecessor bytes. Skipped/backwards
revisions, wrong record kinds/episode identities, incorrect predecessor hashes or
sizes, and changed bytes under an existing revision fail. This includes reordering
panels or changing dialogue without advancing the revision. A production successor
retains its opaque production ID. A release correction retains `DS-NNNN`, increments
the revision and uses a new release ID. Exact same-revision replay is idempotent;
changed same-revision content cannot silently replace the supplied original.

Nothing is mutated or persisted. This checks an **explicit adjacent pair**, not a
history registry: callers must supply authoritative predecessor bytes and enforce
global uniqueness/append-only storage through their approved storage boundary.
It does not fetch missing history, authenticate that history, detect undisclosed
forks or establish that a release ID was never used elsewhere. Validate each pair
when checking a supplied chain. Passing this check does not carry approvals forward;
#95 owns current approval/invalidation integration. #96 owns full build-result and
artifact linkage.

## Publication binding and naming consistency

`validateComicPublicationBinding(productionSource, releaseSource, assignmentSource)`
requires exact production and public-release records plus explicit assignment JSON
with **only** string fields `production_id` and `episode_id`. Both IDs must match
the records, and the production/release titles must agree exactly. Public records
must have a final title, valid `DS-0001` through `DS-9999`, and the standard production
credit as required by the existing schema/local semantics.

The assignment is an API argument representing a caller-supplied mapping, not a
new versioned stored contract, signed grant or public record. It follows the
mapping used by Codex's synthetic harness. This function verifies consistency;
it cannot authenticate the editor, allocate a number, check global canonical
publication order, approve canon or establish current permission. Universe's
separate human assignment/publication gates remain mandatory. No assignment is
needed to describe or validate a draft.

Success is `{valid:true,production_identity,release_identity,metadata,diagnostics:[]}`.
The frozen `metadata` view contains exactly:

| Field | Derivation |
| --- | --- |
| `episode_id` | Release's permanent `DS-NNNN` |
| `number` | `#NNNN`, preserving four digits |
| `title` | Exact final release title |
| `display_title` | `Definitely Secure #NNNN — Episode Title` |
| `production_credit` | `A Definitely Secure Studio production.` |

This follows [Studio comic identity policy](https://github.com/DefinitelySecureStudio/studio/blob/7b5065cef76bea9580609caba356b0d8fe7cc17c/brand/comic-identity.md).
The helper does not derive slugs, filenames, translations or dates. Their eventual
contract-specific checks belong to rendition/publication work. Human review still
determines whether the title and other prose are meaningful, cleared and safe.

`validateComicEpisodeMetadata(releaseSource, metadataSource)` verifies an explicit
consumer-facing metadata object containing exactly the five string fields above.
Missing/extra fields, inconsistent number/title/credit/format and mismatched IDs
fail without normalization or silent correction. These presentation fields are a
helper view; they must not be injected into closed Codex payloads. Neither the view
nor its validation result certifies reader safety or publication eligibility.

## Diagnostics, conformance and authority

Failures have the same `{valid:false,diagnostics:[{stage,code}]}` shape as #90.
Underlying parse/schema/semantic failures pass through without input values.
Episode-stage codes are `RECORD_KIND`, `METADATA_SHAPE`, `PREDECESSOR_REQUIRED`,
`EPISODE_IDENTITY`, `IMMUTABLE_REVISION`, `REVISION_ORDER`, `PREDECESSOR_IDENTITY`,
`IMMUTABLE_RELEASE`, `PUBLICATION_BINDING`, `EPISODE_TITLE` and `EPISODE_METADATA`.
No failure includes text, IDs, hashes, paths, field names or raw exception data.

Run `node --test tests/comic-manifest/episode.test.js`, then `npm test`. Tests use
only the pinned synthetic Codex fixture and explicit synthetic edits: draft/no
number, order preservation, dialogue/captions, cross-panel uniqueness/references,
exact predecessors, replay versus overwrite, corrections, numbering, public metadata
and inert instruction-like text. The offline effects test also exercises these APIs
with filesystem, network, process, dynamic-code and clock operations disabled after
module loading. No real canon, image generation, illustration or layout is needed.

Constitution v1.0.0, tag `constitution/v1.0.0`, commit
`a9cc8a503aa30e17820edc62ac95f7cbe10e0564`, and Studio ADR 0018 at
`7b5065cef76bea9580609caba356b0d8fe7cc17c` govern. Owner @andrewperis reviews the
exact PR. Universal, repository/production-system and automated-workflow design
profiles apply. This change enforces existing Codex semantics without introducing
new normative fields or modifying foundation releases. Production trust, real
source access and A4 disclosure/publication/canon decisions remain separate.
Rollback removes the new helper exports; immutable records remain untouched.
