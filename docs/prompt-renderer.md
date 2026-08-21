# Prompt renderer v1

The Prompt SDK renders a validated Prompt Definition v1 into a deterministic,
provider-neutral intermediate representation. It implements the typed template
semantics accepted at Codex commit
[`bd31b6249e068d3317306afb857d68024f2929be`](https://github.com/DefinitelySecureStudio/codex/commit/bd31b6249e068d3317306afb857d68024f2929be).
That exact commit is a provisional pre-release dependency allowed by the Studio
dependency policy. It must be replaced by the immutable released contract
artifact from Studio issue #72 before a Platform release.

## Boundary

`renderPrompt(definition, { inputValues, contextValues })` is pure with respect
to caller-visible state. Values come only from the two explicit maps or literal
optional defaults in the definition. The renderer never reads environment
variables, secrets, files, the network, a clock, randomness, conversation
history, provider output, or undeclared context. Literal text has no placeholder
or escape syntax: `${HOME}`, `{{secret}}`, and similar text remains unchanged.

The renderer performs the checks needed to resolve and format parts safely. It
does not replace the [structural and semantic validator](prompt-validation.md).
A production caller must validate a definition first. Low-level callers may use
the explicit context-value shape below. Prepared context should use
[`renderPromptWithContextPackage`](context-packages.md), which verifies package
identity, authorization, integrity, expiry, review, and provenance first.

```js
const contextValues = {
  approved_context: {
    value: "Explicit prepared content",
    classification: "public",
    media_type: "text/plain",
    reference: "context:optional-reader-safe-reference"
  }
};
```

## Template semantics

- `text` parts append their `text` exactly and do not interpolate it.
- `input` parts resolve only declared inputs. Missing required and unknown
  supplied inputs fail. Optional inputs use only their literal declared default;
  an omitted optional input contributes an empty string when referenced.
- `context` parts resolve only declared slots. Missing required and unknown
  supplied contexts fail. An omitted optional context contributes an empty
  string when referenced.
- `format: "text"` accepts strings, finite numbers/integers, and booleans.
- `format: "json"` accepts JSON values and uses Studio canonical JSON v1.
- Message and part order is preserved. Adjacent parts concatenate without an
  implicit separator.

Context classification, media type, and UTF-8 byte size are checked before
rendering. The output classification is the highest classification among all
resolved input declarations and context values. Input and context provenance is
recorded outside message bytes; raw values are not copied into provenance or
errors.

## Canonical rendered prompt

The returned `renderedPrompt` has format `studio-rendered-messages-v1` and
contains definition identity, renderer/contract identity, effective
classification, ordered `{ role, content }` messages, and value-free input and
context provenance. Provider adapters consume this value; they do not reinterpret
the original template.

`canonical` is Studio canonical JSON v1:

- object keys sort by ECMAScript UTF-16 code-unit order;
- array order is preserved;
- strings use JSON escaping;
- finite JSON numbers use ECMAScript JSON number serialization, with negative
  zero represented as `0`; and
- cycles, sparse arrays, accessors, symbol properties, non-finite numbers,
  bigint values, and non-plain objects fail.

This is a narrow Studio algorithm, not a claim of RFC 8785 conformance. The
result also includes canonical UTF-8 `byteSize` and a lowercase `sha256:` digest.
It contains no timestamp, random identifier, or host-specific value.

## Errors

Rendering failures throw `PromptRenderError` with stable `code`, `message`,
array `path`, and value-free `details`. `tryRenderPrompt` returns the same error
as serializable data:

```js
const result = tryRenderPrompt(definition, { inputValues: {} });
// { ok: false, error: { name, code, message, path, details } }
```

Codes distinguish unsupported versions/formats, invalid definitions, duplicate
declarations, unknown or missing values, type/constraint/default failures,
context classification/media/size failures, undeclared references, unsupported
part formatting, and non-JSON values. Errors identify symbols and paths but do
not echo supplied content.

## Use and verification

See [`examples/prompt-renderer.mjs`](../examples/prompt-renderer.mjs). Run:

```sh
npm test
node examples/prompt-renderer.mjs
```
