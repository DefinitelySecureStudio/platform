# Context Builder contract compatibility (Studio #76)

This change is a **test-only consumer of an unreleased Codex candidate**. It does
not implement or export Builder functions, verify preparation grants, read source
artifacts, publish receipts or change the released Prompt SDK contract lock.

The governing [Codex specification](https://github.com/DefinitelySecureStudio/codex/blob/291453e2a957fb83dedb0c209ed2cdd14ba90c0e/specs/context-builder/context-builder-v1.md)
and RFC 0006 define Context Builder 1.0.0 request, normalized-source, result and
public-receipt records. Codex remains authoritative; no local schema fork exists.
The candidate narrows the [implementation outline](context-builder-architecture.md):
explicit source fragment plans and opaque identities, exact prompt/request hashes,
ASCII/text-only lexical selection, whole-candidate assembly, byte budgets, distinct
required/optional failures and protected lineage. Token estimation is deferred.

## Evidence and compatibility

[Test fixture lock](../tests/fixtures/context-builder-contract-lock.json) pins
Codex commit `291453e2a957fb83dedb0c209ed2cdd14ba90c0e`, exact source paths,
byte sizes and SHA-256 digests. The two JSON files are verbatim synthetic test
artifacts from that revision, not normative schema copies or production releases.
All apparent private exports, IDs, authority and approval objects are synthetic.
Update them only through coordinated Codex review and exact-blob verification;
never hand-edit the copies or point at a floating branch. The digest test detects
drift, but does not establish source approval.

`npm test` runs [compatibility tests](../tests/prompt-sdk/context-builder-contract.test.js)
that validate and render explicit/lexical prepared fixtures using the existing
Prompt SDK public API. They cover text plus JSON, optional omission, private-source
opaque provenance, separate use authorization, required-slot loss, mismatched
scope, expired review and classification downgrade. A Builder result is not use
authorization. No provider or external source is invoked.

The runtime Prompt SDK remains v1.0.0, consuming Context Package 1.0.0. The output
needs **no migration**. Its original schemas, generated validators and immutable
release lock are unchanged. Codex's test-only relational oracle checks the new
producer relationships; this Platform test is specifically a downstream binding
proof, not evidence that the Builder runtime exists or enforces those relationships.

## Next steps and release gate

Merge the Codex contract PR before this consumer PR. Studio #77 implements trusted
preparation verification; #78–#82 implement source/selection/assembly/lifecycle/audit;
#83 connects the live Builder handoff; #84–#85 add CLI and consolidated conformance.
Tests accompany every implementation. Source byte limits, raw JSON hardening,
revocation checks, secure reader mappings and production trust need runtime tests
in those tasks; synthetic fixtures are not production capabilities.

Before production adoption, Studio #86 must publish an approved immutable
context-builder release and record the full verified release tuple. Do not add
these candidate test pins to the released Prompt SDK dependency lock or claim
that a source-commit URL is a release asset. Real source and signing/storage
onboarding remain separate authorized decisions. Rollback removes the test-only
consumer and leaves released SDK behavior intact.
