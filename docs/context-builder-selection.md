# Deterministic context selection

Studio #79 adds `gate.selectSources({ request, prompt, callerId, signal })` to the
[preparation gate](context-builder-preparation.md). This is a development-only
interface under `src/context-builder/`, not a package export, released API or
finished Context Package. [ADR 0011](adr/0011-deterministic-context-selection.md)
records the decision. It implements the reviewed Codex Context Builder v1 candidate
at `291453e2a957fb83dedb0c209ed2cdd14ba90c0e`; no normative contract changes.

## Boundary and protected result

The gate validates/snapshots the request and prompt, checks exact registered source
versions and preparation authority, reads verified bytes and normalizes explicit
fragments using the [existing source pipeline](context-builder-sources.md). The
internal selector accepts only those gate-owned records, checks their request,
build, source, plan and content identities, and selects whole candidates. It is
not an authorization API and cannot authenticate caller-fabricated normalized
records. The facade never accepts such records or an earlier successful check as
authority. A fresh policy check after selection prevents revoked/expired results
from being delivered and retains the strictest preparation bounds across reads.

Success returns `{ authority_mode, preparation, selection, audit }`:

- `selection` contains `build_id`, `request_identity`, the versioned `policy` name,
  `slots` in prompt/request order and `omissions` in that order.
- Each slot has `{ slot, candidates }`. Every selected entry contains the exact
  frozen `source`, normalized `candidate` and `score` (null for explicit selection).
  IDs, source version, evidence reference, authority/continuity/classification,
  claim ID if supplied, byte range/JSON pointer, content and digest remain intact.
- Empty optional slots have no candidates and `{ slot, code: 'OPTIONAL_EMPTY' }`.
  Ineligible records and scores are not returned. No partial results on failure.

This local intermediate shape is **not** a Codex build-result wire record, public
receipt, authorization grant or assembly output. It contains protected source
content, private opaque handles and identities. Do not log, publish or use it as
publication evidence. Only the existing value-free audit/error projections are
suitable for unprotected diagnostics. Preparation, later package-use permission
and human publication/Canon approval remain separate.

## Eligibility, conflicts and identity

Before ranking, sources must match the requested immutable version and inventory.
Candidates must belong to the explicit authority set, exact continuity scope,
source validity window at `evaluation_time`, and global classification ceiling.
Each slot then requires its chosen media type and accepted classification.
Authority IDs are a set, not priority. Public/private/source kind carries no score
or preference; there is no continuity fallback or implicit canon promotion.

The gate's stronger runtime controls remain in force: any requested source above
the global classification ceiling or outside its current validity window fails
before reads, rather than fetching it to filter later. The pure selector also
checks evaluation-time eligibility. A source may be current at acquisition yet
not have been eligible at the explicit evaluation time.

All globally eligible candidates sharing a `claim_id` must have the same media
type and canonical content identity. Contradictions fail `CONFLICT` before slot
ranking, zero-score exclusion or top-k, including unselected explicit candidates.
Ineligible claims do not participate. Matching claims on distinct candidate IDs
remain distinct evidence; equal text does not justify erasing provenance. Duplicate
source/candidate IDs or repeated explicit pairs are rejected, not silently merged.
Without an explicit shared claim ID, the builder cannot infer semantic contradiction.

There is no automatic newest-version or supersession rule. Versions are opaque and
exactly pinned. Resolve a conflict by obtaining an explicitly approved revised
request/inventory; never silently choose the latest, the private source, or the
highest scoring claim. Selection cannot change source authority or classification.

## Versioned retrieval baseline

`explicit-v1` resolves each declared `(source_id, candidate_id)` pair in caller
order. Absent plans fail `INVALID_REQUEST` before reads; planned but ineligible
pairs fail `INELIGIBLE`, with no substitute. Empty selection means no match.

`lexical-v1` is text-only. Query and candidate tokens are ASCII `[A-Za-z0-9]+`,
lowercased, with duplicates ignored. The score is the count of distinct query
tokens present in the candidate, not occurrence count. Zero scores are excluded.
Sort by descending score, then ascending ASCII `source_id`, then `candidate_id`;
take the first `max_candidates`. Empty/no-token queries produce no match. There is
no locale collation, Unicode normalization, stemming, fuzzy/reference inference,
embedding service, model, network index or paid retrieval. Memory stores only
matched query tokens, not a persistent source token index.

Repeated calls with identical policy/input and unchanged authority return identical
ordered selections. Reordering reader registration or normalized record enumeration
does not affect results. Request source arrays must still use the contract's
canonical sorted order; changing explicit pair order deliberately changes selection.
Source instructions are inert data, not retrieval or authorization policy.

Excerpts are exactly the approved normalized UTF-8 byte ranges or JSON pointers.
No extra chunking, truncation, invented facts, summaries or content rewrites occur.
Request and source/normalization resource ceilings continue to apply. Selection
scans eligible text for each nonempty query; hosts must bound concurrency and
request workload. No cross-request index/cache is introduced.

## No match and next boundaries

Required no-match fails `REQUIRED_CONTEXT_MISSING` with `repair-request`. Its stage
remains `assembly` as specified by Codex, even though this implementation detects
the inevitable failure during selection. Optional no-match produces `OPTIONAL_EMPTY`.
Empty text does not satisfy a required slot; JSON null, false and empty containers
are real selected values, not absence. Failure messages carry no slot, query,
source, content or digest; the protected request is needed to repair them.

Slot byte budgets, joined sections, total package budgets and lineage assembly are
#80. Selection returns whole candidates even when they exceed a slot byte budget;
that is **not** a successful assembled build. Lifecycle persistence, durable audit,
SDK/CLI handoff and release remain #81–#86. No public package or use authorization
is produced here. Embeddings, semantic scoring, LLM summaries, remote indexes and
automatic supersession would need separate owner review, versioned policy/contracts,
determinism and safety evidence before integration—not an option on these v1 modes.

## Verification

Run `node --test tests/context-builder/selection.test.js`, `npm test`, and
`node scripts/check-sdk-release.mjs`. Tests use public synthetic fixtures only,
including fake private exports. They cover exact and lexical baselines, relevance,
ties, permutations, authority/continuity/time/classification/media exclusions,
contradictions before ranking, deduplication rules, no-match diagnostics, preserved
fragments, forged lineage/identity rejection, source instructions and final revocation.
