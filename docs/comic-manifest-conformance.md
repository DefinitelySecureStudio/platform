# Comic Manifest conformance and security reference suite (#98)

This suite composes the existing Comic Manifest tests with the Prompt SDK and
Context Builder handoff checks. It documents positive and negative controls for
the implemented v1 boundaries; it does not add schema rules, approval meaning,
or a production trust adapter.

## Positive and negative coverage map

| Boundary | Positive controls | Negative controls | Coverage |
| --- | --- | --- | --- |
| Strict JSON and generated schema | Valid UTF-8/JSON grammar, accepted number forms, exact pinned schema and deterministic validator generation | Malformed/duplicate keys, invalid UTF-8, BOM/surrogates, oversized/deep documents, unsafe object inputs, invalid fields and semantics | `parse-json.test.js`, `generated.test.js`, `validation.test.js`, `comic-manifest-contract.test.js` |
| Episode structure and identity | Ordered panels/text, exact replay, adjacent successor, public correction retaining `DS-0001`, formatting-independent canonical identity | Duplicate IDs, dangling bindings, skipped/backwards revisions, wrong predecessor, changed bytes under an existing revision, hostile text never treated as executable instructions | `episode.test.js`, `approval-boundary.test.js`, golden correction case |
| Immutable references and authorization | Exact public/context/Builder fixture references resolve; repeated reads retain the exact bytes and identities | Floating refs, substitution, URI traversal/redirects, missing bindings, classification ceiling, malformed/denied/revoked/stale authorization, tampered/oversized chunks, thrown readers and cancellation fail before delivery | `references.test.js`, `adapter-conformance.test.js`, `comic-manifest-contract.test.js` |
| Reusable reference adapter boundary | Fixture-backed reference reader and independent in-memory fake both pass the same success contract | Both reject late denial before any read, byte tampering, and raw provider errors without returning partial bytes or details | `tests/support/comic-reference-adapter-conformance.js`, `adapter-conformance.test.js` |
| Prompt SDK and Context Builder integration | The pinned prompt, prepared Context Package, Builder evidence and current-use authorization pass the explicit offline handoff | Substituted package/purpose/slot/classification, revoked or expired authorization, adapter failures and raw-output leakage are rejected | `tests/prompt-sdk/comic-manifest-contract.test.js`, `tests/context-builder/handoff.test.js` |
| Output compatibility and build result | Exact production/result/release linkage, declared output profiles, equal-or-higher classification, verified fixed synthetic bytes, public-only and approved fake-private proposals | Missing/incomplete/failed or unrelated results, undeclared/missing outputs, C(n) drift, classification downgrade, byte mismatch, stale/revoked approvals, false attestation/disclosure and canary/credential URL disclosure | `output-compatibility.test.js`, `build-result.test.js`, `golden-conformance.test.js` |
| Approval and revision boundary | Exact current publisher/editor bindings, inclusive decision-time equality, supported timestamp forms, unchanged replay and public fixed-category diff | Self-approval, wrong role/subject/scope/artifact/action, producer overlap, stale or revoked decisions, expiry/future decisions, malformed trusted times, and protected revision detail | `approval-boundary.test.js`, Codex `comic-manifest-v1-approval-times.json`, `golden-conformance.test.js` |
| CLI inputs and output handling | Safe validate/inspect/diff/verify reports; separately consented proposal/evidence writes with mode `0600` | Malformed data, hostile diagnostic text, traversal, symlink/hardlink and replacement races, pre-existing outputs, unsafe directories, missing consent, stale authorization and tampered artifacts | `cli.test.js` |

Existing test bodies also cover important cases within each row, including
unauthorized reads, stale/revoked approvals, secret redaction, directory/file
identity changes and async mutation. The table maps each boundary to both a
positive control and its rejecting controls so future changes can identify a
specific gap instead of treating the suite as a single pass/fail block.

## Proposed golden scenarios and review path

The proposed outputs live in `tests/fixtures/comic-manifest-goldens/`. Scenario
definitions, expected classification/redaction, source pins, golden digests, and
the unchanged foundation lock digests are in `scenarios.json` and
`review-lock.json`. The source fixture, schema, and approval-time oracle are
pinned to Codex commit `8044643bf888067f5a6e0d212f843d72e8787f2b`; their Git blob
IDs and SHA-256 values are checked against the local files. The independent
proposal oracle's SHA-256 is also recorded and verified in `review-lock.json`.
The public proposal expectations are derived by the test-only allowlist in
`tests/support/comic-manifest-golden-oracle.js`, which imports no Platform
runtime code. Tests compare the checked-in proposals to that oracle and to the
actual offline CLI outputs. No test or CI command writes a golden or lock.

The scenarios cover a public-only complete flow, an approved synthetic
fake-private flow, a public correction, incomplete and failed outputs, and
repeated processing of the same fixed bytes. In both successful flows the
protected evidence is written only to a temporary owner-only directory and
removed after checking its classification. Expected public output is compared
as parsed JSON with structural equality to a reviewed proposal fixture;
protected evidence is never stored as a golden. The repeated-run test also
compares serialized proposal buffers byte-for-byte across the two runs; it does
not compare a runtime proposal buffer byte-for-byte with a golden file.

All golden/catalog/oracle/lock changes are explicit owner-review paths in
`.github/CODEOWNERS`. The owner approved the proposed goldens, scenario catalog,
and independent oracle as they stood at source head
`97dcd990e87bd0368ddcbecf66d1a6718bc7629e` in chat at `2026-10-07T19:15:38Z`.
This acceptance came through chat; it was not a submitted GitHub review. The
lock records the source head, time, channel, and GitHub-review status. The
scenario catalog remains byte-identical to the reviewed proposal catalog, whose
status fields describe its original review packet. The approval applies only to
the pinned bytes at that source head; subsequent edits require separate review.
A green test, exact-head CI, draft PR, or merge does not itself constitute owner
approval. Branch rules determine whether a GitHub review is enforced; this
change does not modify branch protections or workflow permissions.

## Offline execution and deterministic scope

Run the dedicated suite with:

```sh
npm run test:comic-manifest-conformance
```

The runner executes Comic Manifest tests plus the Prompt SDK/Builder handoff
tests, then the synthetic CLI reference flow. It preloads
`tests/support/offline-network-tripwire.mjs` into the test and CLI subprocesses;
an attempted fetch, DNS lookup, direct `net.Socket.prototype.connect`, socket,
HTTP(S), WebSocket or HTTP/2 operation fails the run. Subprocess regressions
prove that caught and uncaught calls through `Socket.prototype.connect`,
`dns.Resolver`, and `dns.promises.Resolver` still fail the child process.
Before and after execution, the runner hashes every file under
`tests/fixtures/`, including the source fixtures, goldens and locks. A changed,
added or removed fixture fails the run. Temporary scenario files are created
outside that tree and removed.

The supported package baseline is Node.js `>=22`. Pull request CI runs on Node
22 and 24 with `npm ci`, `npm test`, and this offline runner. The repeatability
claim covers deterministic processing of the same checked-in synthetic text
and byte fixtures with the same explicit fixture clock. It does not claim that
uncontrolled generated art is bit-for-bit reproducible.

This remains synthetic conformance only: no paid provider, real/private
content, production trust backend, credential, publication action, or canon
write is included.
