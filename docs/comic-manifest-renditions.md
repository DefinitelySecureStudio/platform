# Comic Manifest rendition and publication outputs (#94)

The unreleased `./comic-manifest` validator adopts the exact schema and synthetic
fixtures from Codex merge `dba54695996200c100299555bc665914765ebf87`. It enforces
the owner-approved rendition profile catalog, declared output limits and
production/result/release metadata relationships. It does not retrieve, render,
decode or distribute media, grant publication permission, decide rights, or promote
canon.

## Versioned rendition profiles

Every production rendition declares one exact profile ID/version, a selected media
type permitted by that profile, exact target dimensions (or `null`) and a positive
`max_bytes` within the profile ceiling. Unknown profile pairs and alternate/default
selection are rejected.

| Profile | Media type(s) | Dimensions | Maximum `max_bytes` |
| --- | --- | --- | ---: |
| `comic-page-image@1.0.0` | `image/png`, `image/jpeg`, `image/webp` | Required positive width and height; each ≤ 8,192 and product ≤ 33,554,432 pixels | 50,000,000 |
| `comic-portable-document@1.0.0` | `application/pdf` | `null` | 50,000,000 |
| `comic-accessible-transcript@1.0.0` | `text/plain` | `null` | 131,072 |

Build-result and public-release outputs repeat the selected profile, exact media
type, dimensions, byte cap, alternative text, transcript and rights notice. A
complete build result must include every required output once; optional outputs
may be absent and undeclared or duplicate IDs fail. Recorded artifact sizes cannot
exceed their selected caps. A public release preserves the complete selected output
list in the same order, including the recorded media type, byte size and digest; its
public artifact URI may differ from the build-result URI.

## Cross-record validation

```js
import { validateComicOutputCompatibility } from
  '@definitely-secure-studio/platform/comic-manifest';

const outputs = validateComicOutputCompatibility(
  productionJson,
  buildResultJson,
  publicReleaseJson,
  JSON.stringify({ production_id: productionId, episode_id: episodeId })
);
```

The first two arguments are required bounded raw JSON records. The optional release
and assignment arguments must be supplied together. The helper checks the result's
production identity and exact input tuple, each selected output against its
production declaration, required output presence for complete results, and the
release's output order and recorded content identity. When a release is supplied,
the assignment's opaque production ID and `DS-NNNN` episode ID must match the
records and the final titles must agree. The assignment is a consistency input, not
a signed grant, numbering allocator or proof of Universe authority.

Failures return one value-free `{stage:'output',code}` diagnostic, including
`PRODUCTION_LINK`, `INPUT_LINK`, `UNEXPECTED_OUTPUT`, `MEDIA`, `DIMENSIONS`,
`OUTPUT_REQUIREMENT`, `OUTPUT_LIMIT`, `REQUIRED_OUTPUT`, `RESULT_NOT_COMPLETE`,
`RELEASE_OUTPUTS`, `ASSIGNMENT` or `EPISODE_TITLE`. Wrong record kinds return
`RECORD_KIND`; raw parsing/schema/profile failures retain the existing fixed
diagnostic shape.

## Accessibility, credit and rights declarations

Alternative text, transcript and rights notice are required nonblank declarations
on every rendition and are preserved through build result and release. The
transcript is intended to preserve the episode's ordered dialogue and captions.
Public candidates require the exact standard credit `A Definitely Secure Studio
production.` and publication metadata including final title, `DS-NNNN` episode
identity, revision/predecessor, canon scope, destination, audience, purpose and
publication time.

These fields are declarations and review inputs. Their presence, matching values or
profile conformance does not establish rights ownership or permission, descriptive
accuracy, accessibility quality, visible credit, creative quality, media validity
or rendering correctness. The validator does not inspect artifact bytes or their
actual dimensions, visit an artifact URI, perform disclosure review, authenticate
the assignment, approve publication or canonize an episode. Those checks require
separately authorized tools and qualified reviewers.

## Conformance

The platform fixtures are byte-pinned to Codex merge
`dba54695996200c100299555bc665914765ebf87`. They use synthetic image/document
placeholders and fake identities only. Run:

```sh
npm run generate:comic-schema -- tests/fixtures/comic-manifest-v1.schema.json
node --test tests/comic-manifest/*.test.js
npm test
```

Focused tests cover supported profiles, inclusive raster/byte limits, incompatible
media, omitted/undeclared outputs, exact result/release preservation and episode
assignment mismatches. Passing these tests does not establish publication or rights
authority.
