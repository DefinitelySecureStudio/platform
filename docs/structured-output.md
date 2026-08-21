# Structured Output v1 processing

The Prompt SDK turns a successful JSON Provider Execution result into either a
typed, independently validated result or an explicit failure. It implements the
Codex contract pinned by `STRUCTURED_OUTPUT_CONTRACT`.

```js
const result = await executePrompt(request, { adapter });
const structured = processStructuredOutput(request, result, {
  processing_id: "structured_example_0001",
  rawRetention: "identity-only",
  providerConstraintMode: "adapter-emulated",
  schemaSource
});

console.log(structured.normalized.value);
```

`request.expected_output` must declare JSON with `json-syntax` or `json-schema`
validation and the request must declare the `structured-output` capability. For
schema validation, `schemaSource` is the exact UTF-8 string or byte array named
by the immutable schema reference. The SDK verifies byte size, SHA-256, Draft
2020-12, and `$id` before compiling it with remote loading disabled. The SDK
never fetches `artifact_uri`.

## Raw and normalized representations

Raw provenance always retains media type, classification, exact byte size, and
digest. `rawRetention` is explicit:

- `identity-only` retains no body or location and is the safe baseline;
- `inline` retains exact response text; and
- `reference` retains a supplied artifact reference with matching identity.

Inline/reference retention requires `capture_output: true` with
`restricted-content` retention in the execution request. Unauthorized or
mismatched retention fails and falls back to identity-only in the failure
document.

The normalized value is parsed once without coercion, repair, defaults, or
property removal. Its size/digest cover Studio canonical JSON v1 bytes. Raw and
normalized identities can legitimately differ because raw whitespace and member
order remain audit evidence.

## Failure API

`tryProcessStructuredOutput` returns `{ ok: true, result }` or an explicit
contract-shaped `{ ok: false, failure, report }`. Failures name the stage and
contain value-free JSON-Pointer diagnostics; they never contain a normalized
value. Preflight misuse returns `{ ok: false, error }`.

`processStructuredOutput` returns the validated result or throws
`StructuredOutputError`. Its serializable form redacts any retained raw body or
reference. Catching the error does not authorize repair or retry.

Failure stages cover preflight, raw/schema integrity, schema loading, parsing,
schema validation, normalization, and internal contract failure. Duplicate JSON
members fail rather than using last-key-wins behavior. Schema errors identify
keywords and instance paths without copying values or schema contents.

## Provider neutrality

`providerConstraintMode` records `portable-only`, `provider-native`, or
`adapter-emulated`. Native/emulated modes record the adapter id, but every mode
is independently parsed and validated by the core SDK. Provider JSON modes and
typed SDK objects never replace validation or cross this boundary.
Native/emulated modes require `structured-output` in the request's required
capabilities, and emulation claims must agree with execution warnings.

Run the synthetic example and tests:

```sh
node examples/structured-output.mjs
npm test
npm run generate:structured-output-schema -- /path/to/structured-output.schema.json
```

The exact provisional Codex commit pin is release-blocking until Studio issue
#72 publishes immutable contract artifacts.
