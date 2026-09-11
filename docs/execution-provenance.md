# Execution provenance and observers

Issue #69 adds a metadata record suitable for linking execution/correlation ids
to later build manifests. Enable it with `executePrompt(request, { adapter,
observer: new LocalExecutionObserver() })`. No observer means no record storage.

Observers implement `async observe(record)`. The executor passes one frozen
record after any accepted execution finishes, including preflight failure,
cancellation and timeout. Observer rejection, mutation attempts and deadline
expiry add `OBSERVATION_DELIVERY_FAILED` to the result. Provider status is
preserved and no execution is retried. The default observer deadline is 1000 ms;
`observerTimeoutMs` accepts 1–60000 ms. Timeout bounds waiting, but cannot cancel
external work a custom sink already started. Sinks must manage their own I/O.

`LocalExecutionObserver({ capacity: 100 })` keeps the newest records in memory.
`snapshot()` returns copies; `clear()` erases the local buffer. It performs no
console/file/network output. Production sinks own retention and access control.

`createExecutionProvenance(request, result, options)` supports post-execution
construction and later structured-output evidence. Options are
`effectiveParameters`, `validation`, `structuredOutput`, and
`contentIdentities` (`public-only`, default, or `omit`). Effective parameters are
captured automatically by the executor after negotiation. Manual callers must
provide the resolved values or the record states `not-resolved`.

Pass prompt validation/lint evidence as `provenance: { validation: report }` to
the executor. Only outcome/counts survive; absent evidence is `not-run`.
After structured processing, construct another record with `structuredOutput`
and send it to the same observer. Processing status/id are retained only after
matching execution id, expectation and raw byte identity. Keep both record
revisions if an audit requires history; their canonical digests differ.

Records omit messages, input/output bodies, parsed values, URIs, authorization
details, provider request ids, idempotency keys, stop strings, extension objects,
and diagnostic/error/warning text. Numeric portable parameters and stop count
remain. Render/output hashes and context package/source versions are retained
only for public content; context identities are suppressed when the overall
rendered prompt is non-public. `omit` suppresses all content identities.
Body-capture permission never broadens this metadata projection.

Prompt, execution, correlation and provider/model ids must be approved opaque
identifiers. A secret disguised as an identifier cannot be detected by a schema.
Records are operational evidence, not an automatic public release artifact.

The closed Codex schema is pinned by the reproducible generator:
`node scripts/generate-provenance-schema-validator.mjs /path/to/execution-provenance.schema.json`.
The envelope identity covers Studio canonical JSON of `record`. Consumers use
`validateExecutionProvenance` to check schema and digest. Immutable contract
publication under issue #72 remains required before a production release.
