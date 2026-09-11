# Prompt SDK v1 reference library

All prompts, inputs, outputs and context are synthetic and publishable. The
internal classification in the context example exercises policy; it is not
private production material. No real credentials or remote providers are used.

```sh
npm ci
node examples/reference-prompts/run.mjs text
node examples/reference-prompts/run.mjs structured
node examples/reference-prompts/run.mjs context
npm test
```

- `text.prompt.json`: typed inputs, explicit defaults, optional context, text
  execution, validation evidence and public provenance.
- `structured.prompt.json`: independent json-schema validation against the
  existing synthetic reference-facts schema, raw/normalized identities and
  a second provenance revision for processing evidence.
- `context.prompt.json`: prepared package and explicit authorization, required
  text/JSON context slots, classification propagation and metadata redaction.

The runner uses shared synthetic inputs and request settings from
`../cli/`. The context clock is explicitly 2026-08-20; execution uses a fixed
epoch clock. This keeps historical fixtures reproducible without weakening
expiry enforcement (a separate negative test uses an expired timestamp).

The reference-facts artifact URI, release tag and all-2 commit are deliberately
synthetic identity metadata, not a claim of an immutable published contract.
The runner supplies verified schema bytes locally; it never downloads that URI.
Actual immutable contract release remains gated on Studio #72.

Prompt SDK v1 supports text messages and JSON output here. It has no supported
image/multimodal execution contract; these fixtures do not pretend otherwise.

## Golden review

`tests/fixtures/golden/` stores the complete public render result, structured
result when applicable, and observer records. Non-public context render/output
bodies are omitted. Golden comparisons do not mask hashes, ids, defaults or
timestamps. Every observer/structured document is independently validated too.

To inspect a proposed change, run the corresponding runner and compare its JSON
with the committed golden. Update a golden only after reviewing the contract,
canonicalization, redaction and intended behavior change; do not regenerate
snapshots just to make a failing test pass. The test command never writes goldens.
Check fixture safety before committing any updated content.
