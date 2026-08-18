# Prompt validation and linting

The Prompt SDK validates Prompt Definition v1 documents before rendering or
execution. It combines the exact Codex JSON Schema with deterministic semantic,
compatibility, authoring, and prompt-layer security rules. It performs no model
or provider call and reads no implicit environment, secret, filesystem, network,
clock, or conversation state.

The compiled schema is derived from accepted Codex commit
[`bd31b6249e068d3317306afb857d68024f2929be`](https://github.com/DefinitelySecureStudio/codex/commit/bd31b6249e068d3317306afb857d68024f2929be).
Its provisional status and release replacement requirement are documented in
[ADR 0002](adr/0002-compiled-prompt-schema-validation.md).

## Library API

Parse raw JSON with `parsePromptJson(source)` before validation. This preserves
duplicate-object-member evidence that `JSON.parse` would otherwise discard and
returns a generic `JSON_SYNTAX` error without echoing source content.

```js
import {
  parsePromptJson,
  validatePromptDefinition,
  validatePromptDefinitions
} from "@definitely-secure-studio/platform/prompt-sdk";

const parsed = parsePromptJson(source);
if (parsed.diagnostics.length === 0) {
  const result = validatePromptDefinition(parsed.value);
  if (result.valid) {
    // Safe to pass to the renderer after any later boundary-specific checks.
  }
}
```

`validatePromptDefinitions(definitions, options)` validates a collection and
rejects a duplicate exact `id@version`. Reusing one stable ID across different
versions is valid by design.

Options declare consumer compatibility:

```js
{
  supportedCapabilities: ["text-generation", "structured-output"],
  supportedExtensions: ["example.reviewed-extension"]
}
```

The two core v1 capabilities are supported by default for validation purposes.
Unknown required capabilities/extensions are errors; unknown optional ones are
warnings. Declaring support means only that the calling consumer has an
implementation—it does not grant authority, data access, provider support, or
approval.

## Diagnostic contract

Every result contains:

```json
{
  "valid": false,
  "contract": {
    "spec_version": "1.0.0",
    "commit": "bd31b6249e068d3317306afb857d68024f2929be",
    "status": "provisional-unreleased"
  },
  "summary": { "errors": 1, "warnings": 0 },
  "diagnostics": [
    {
      "severity": "error",
      "code": "UNDECLARED_INPUT_REFERENCE",
      "message": "Template references undeclared input: missing_input.",
      "path": "/template/messages/0/parts/1/name",
      "details": { "name": "missing_input" }
    }
  ]
}
```

Errors make `valid` false. Warnings identify reviewable authoring or portability
concerns but do not make the library result invalid. Diagnostics use JSON Pointer
paths, deterministic ordering, stable codes, and value-free details. Input or
context payload values are never included.

## Rule set

Schema diagnostics use `SCHEMA_<KEYWORD>` codes and enforce the complete closed
Draft 2020-12 Prompt Definition v1 structure, formats, constants, patterns,
bounds, conditional fields, and unknown-field rejection.

Semantic errors cover:

- duplicate input/context declarations and cross-kind name collisions;
- undeclared template input/context references;
- constraints that do not apply to the declared type, contradictory bounds,
  invalid ECMA-262 patterns, and invalid or constraint-breaking defaults;
- invalid deprecation support windows;
- required/optional capability overlap, unsupported required capabilities, and
  missing `structured-output` declaration for JSON output;
- required extensions without `reject` fallback and unsupported required
  extensions;
- stable lifecycle use while the governing contract remains unreleased;
- secret-like placeholders; and
- template requests for implicit environment, secret-manager, or filesystem
  access.

Warnings cover:

- placeholder-looking literal text such as `${DISPLAY_NAME}` or
  `{{display_name}}`, because v1 performs no interpolation;
- declared inputs/context slots that no template part references;
- duplicate adjacent injection of one context slot;
- apparent policy, authority, Canon, or publication claims in an
  `assistant-example`; and
- unsupported optional capabilities or extensions.

The linter does not decide creative quality, truth, Canon, rights, privacy
approval, accessibility, publication readiness, or runtime authorization. Those
remain explicit human or downstream gates.

## CLI and CI

Install locked dependencies and validate one or more files:

```sh
npm ci
npm run validate:prompt -- --format text path/to/prompt.json
npm run validate:prompt -- --format json --warnings-as-errors path/to/prompts/*.json
```

Use `-` for explicitly supplied standard input. Repeat
`--supported-capability NAME` or `--supported-extension NAMESPACE` to declare
consumer support. Text output is human-readable; JSON output is stable for CI.

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | No errors; and no warnings when `--warnings-as-errors` is active |
| `1` | Validation/lint quality gate failed |
| `2` | CLI usage error |

Unreadable input files produce a structured `SOURCE_READ` error and exit `1`.

## Rebuilding the compiled schema

Only rebuild for an intentional reviewed contract update. Supply the schema
artifact explicitly; the current generator rejects any digest other than the
pinned accepted bytes:

```sh
npm run generate:prompt-schema -- /path/to/prompt-definition.schema.json
git diff -- src/prompt-sdk/generated/prompt-definition-v1-schema.js
```

When issue #72 releases Prompt Definition v1, update the generator to verify the
released artifact URI, media type, byte size, and digest rather than retaining
the provisional commit dependency.
