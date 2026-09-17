# Budgeted Context Package assembly

Studio #80 adds development-only `gate.assemblePackage({ request, prompt, callerId,
signal })`. It runs the existing preparation, verified-source normalization and
[selection](context-builder-selection.md) stages; callers cannot supply a selection
or cached authorization to bypass them. No package export or immutable release is
added. Codex Context Builder candidate `291453e2a957fb83dedb0c209ed2cdd14ba90c0e`
and the released Context Package v1 contract remain unchanged.

## Whole candidates and budgets

`whole-candidate-v1` joins selected text with one LF between candidates, including
those separators in UTF-8 byte counts. JSON slots contain exactly one selected JSON
value, without wrapping, coercion, trimming or summary. Null, false and empty JSON
containers are real values. The builder never splits a UTF-8 character or selected
fact to make it fit. Canonical JSON byte counts include escaping and encoded Unicode,
not the original source whitespace or object-key ordering.

1. Precompute section sizes from verified candidate sizes, rejecting unsafe integer
   arithmetic before allocating joined content.
2. Reserve the sum of **all required** sections first. Any required per-slot or
   total overflow fails `BUDGET_EXCEEDED`, stage `assembly`, action `increase-budget`.
3. Consider optional sections in declaration order against their per-slot limit
   and remaining total capacity. Omit the whole section with `OPTIONAL_BUDGET` if
   it cannot fit; do not drop individual candidates or try smaller substitutes.
4. Materialize included sections and lineage in declaration order, recheck actual
   byte sizes, and compute exact SHA-256 identities. Empty optional slots retain
   `OPTIONAL_EMPTY`. No included sections fails `REQUIRED_CONTEXT_MISSING`.

Limits must be positive safe integers: zero request capacity is `INVALID_REQUEST`
before any read. Zero *remaining* capacity after required reservation is valid and
causes subsequent nonempty optional sections to be omitted. Existing read and
normalization ceilings apply; hosts must bound total output workload/concurrency.
Omitted section content is not joined or encoded during assembly.

Token estimation is explicitly absent from the accepted v1 contract. Unknown token
budget/estimator fields are rejected, not ignored. These are exact UTF-8 **bytes**,
not exact or estimated model tokens. Supporting estimates requires a separately
reviewed versioned estimator/tokenizer contract; provider token limits remain separate.

## Package identity, lifecycle and authority

The package uses the unchanged inline `context-package` 1.0.0 format and is checked
with the released SDK's public `validateContextDocument` API (schema and semantics).
Sources contain only contributors, sorted by source ID; each section has sorted
unique source IDs. Candidate lineage retains selection order, including distinct
candidates from the same source. Public source artifacts retain their pinned tuple;
private records omit artifact identities and opaque handles.

Section classification is the maximum contributor classification. Package
classification is the maximum across all included sources/sections. Omitting an
entire private optional section may leave a public-only package; no included content
is declassified. Source IDs, kinds, versions and evidence references are preserved.
Purpose, builder, package identity and preparation reference are copied exactly from
the request. `created_at` is its explicit evaluation time, not an implicit clock.

Review and expiry are the earliest request, requested-source and verified preparation
bounds, including constraints from requested sources that did not contribute.
Review is capped at expiry, and creation must be strictly before review. The gate
rechecks authority after initial assembly; it rebuilds the manifest/identity using
the strictest handoff bounds. Revocation, expiry or cancellation prevents delivery.
No preparation grant can extend a previously observed shorter bound.

Success is `{ authority_mode, preparation, package, lineage, omissions, audit }`.
Nested package values are frozen. The manifest identity uses Studio JSON v1; content,
section identities, total bytes and source links are verified together. These are
protected outputs, not public receipts: do not log private content or hashes.
Failures expose only existing value-free diagnostics, not SDK validation details.

This method does **not** issue use authorization, publish material, establish Canon,
or create a final audited Codex build-result/evidence reference. A preparation
reference describes preparation only. Consumers still require independently
obtained package-use permission. Persistent lifecycle, audit, SDK/CLI integration
and release remain #81–#86; see [ADR 0012](adr/0012-budgeted-context-assembly.md).

## Verification

`node --test tests/context-builder/assembly.test.js` covers exact explicit/lexical
Codex golden packages, published schema/semantic checks, separate use permission,
UTF-8/JSON boundaries, LF separators, required reservation, optional omission,
zero capacity, overflow, determinism, classification, private metadata, cancellation,
revocation and narrowed lifetimes. All inputs are synthetic, including fake private
exports. Run `npm test` and `node scripts/check-sdk-release.mjs` for regressions.
