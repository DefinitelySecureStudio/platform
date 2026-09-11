# Prompt CLI and authoring workflow

Run `npm ci` with Node.js 22+ in Platform, then
`node src/prompt-sdk/cli.js --help`. The package bin is `studio-prompt` when
installed/linked. Nothing is published or promoted by this CLI.

## Offline authoring

```sh
node src/prompt-sdk/cli.js validate examples/cli/prompt.json
node src/prompt-sdk/cli.js lint examples/cli/prompt.json --format json
node src/prompt-sdk/cli.js inspect examples/cli/prompt.json
node src/prompt-sdk/cli.js render examples/cli/prompt.json --inputs examples/cli/inputs.json --format json
```

Validate includes schema checks and authoring lint; lint is an alias. Existing
multiple-file and single-stdin validation remain supported, including
`--supported-capability`, `--supported-extension` and `--warnings-as-errors`.
Other commands accept explicit files only. JSON files reject duplicate keys.
Inputs contain explicit `inputValues` and optional `contextValues` matching the
SDK render options. No environment interpolation or implicit context lookup occurs.

Inspect emits selected metadata, not the template. Resolve a registry version
with `inspect --registry DIR --id PROMPT_ID --version 1.0.0`. Registry files must
end in `.prompt.json`; symlinks are rejected by the SDK. CLI resolution requires
an exact version; it does not silently select latest.

## Test execution

```sh
node src/prompt-sdk/cli.js execute examples/cli/prompt.json --inputs examples/cli/inputs.json --execution-options examples/cli/execution-options.json --mock --format json
node src/prompt-sdk/cli.js execute examples/cli/prompt.json --inputs examples/cli/inputs.json --execution-options examples/cli/execution-options.json --adapter-module examples/cli/mock-adapter.mjs --format json
```

Choose exactly one adapter mode; there is no default provider. The execution
options are non-secret Provider Execution request settings, including caller
authority, target and timeout. The CLI makes one SDK execution attempt and does
not retry. Update execution/idempotency ids for distinct real runs.

A trusted local ESM module exports `createAdapter()`, optionally async, returning
the existing describe/execute adapter interface. This is arbitrary local code,
not a sandbox or an import named by a prompt. Only select reviewed modules.
Provider modules obtain credentials from approved environment injection or a
secret manager at runtime; never store credentials in prompts, input fixtures,
execution options, command-line arguments or committed modules. Modules must
keep stdout clear for CLI JSON and redact their own logs/normalized errors.
Loading errors are reported without printing exception text or stacks.
Real adapters can incur provider cost; validation, inspection and rendering
never load an adapter or call a model.

Execute emits `{ valid, request, result }`. For structured processing, save
`request` and `result` as separate JSON files using your artifact tooling:

```sh
node src/prompt-sdk/cli.js validate-output --request request.json --result result.json --processing-id processing_example --constraint-mode adapter-emulated --format json
```

Use a JSON-output prompt and matching execution options. Select the actual
constraint mode from portable-only, adapter-emulated or provider-native; mock
structured execution uses adapter-emulated. For json-schema expectations,
provide `--schema exact-schema.json`; the SDK verifies its pinned identity and
compiles offline. The command validates the raw output, does not repair it,
and emits normalized structured evidence using identity-only raw retention.

## Output and CI

All commands support `--format text|json` (text default). JSON writes one document
to stdout; usage/I/O errors in JSON mode also produce a JSON error envelope.
Exit 0 means success, 1 means validation/rendering/execution/processing failure,
and 2 means usage or file/module-load failure. Validate keeps its existing report
shape; other commands use a `valid` envelope and command-specific payload.

Render/execute intentionally emit bodies, and structured validation can emit
normalized values. Non-public render/execution/structured output requires
`--allow-sensitive-output`. This is explicit local output permission, not
declassification or approval to publish. Use protected destinations and avoid
shared CI logs. Even public-classified fixtures must contain only synthetic or
approved public data; classification labels cannot detect mislabeled secrets.
Inspect and validation diagnostics are also operational output, not automatic
public release artifacts. No CLI command writes an output file implicitly.

Example CI steps (after checkout and Node.js setup):

```sh
npm ci
npm test
node src/prompt-sdk/cli.js validate examples/cli/prompt.json --format json
node src/prompt-sdk/cli.js render examples/cli/prompt.json --inputs examples/cli/inputs.json --format json
node src/prompt-sdk/cli.js execute examples/cli/prompt.json --inputs examples/cli/inputs.json --execution-options examples/cli/execution-options.json --mock --format json
```

For a curated warning-free authoring set, add `--warnings-as-errors`; example
fixtures may intentionally retain draft/unused-declaration warnings. Preserve
the command exit status when redirecting output or using CI report tooling.

## Experimentation and promotion

1. Experiment in lab with synthetic inputs, explicit versions and mock execution.
   Validate and render before enabling an approved real adapter.
2. Review input/context classification, authority, output expectations and
   provenance with the accountable human owner. Keep private evidence private.
3. Propose reusable contract changes through a Codex RFC/specification review,
   with compatible versioning and conformance fixtures. Do not promote a prompt
   by copying production implementation into Codex.
4. Implement accepted runtime behavior in Platform, rerun CLI and SDK tests, and
   pin exact contract versions/commits. Immutable contract publication remains
   gated by Studio #72; local tests do not make provisional contracts stable.
5. Review prompt lifecycle/version changes and downstream registry adoption
   explicitly. The CLI neither changes lifecycle nor publishes to a registry,
   merges PRs, grants authority or establishes creative canon.
