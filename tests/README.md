# Tests

## Context Builder conformance

Run `node scripts/check-context-builder.mjs` for the reusable offline Builder suite,
pinned reference matrix, contract/SDK binding tests, genuine text/JSON mock execution,
CLI fake-private build and release-baseline check. See the
[positive/negative coverage map and factory interfaces](../docs/context-builder-conformance.md).
Goldens never update during tests; changes need explicit owner review. The dedicated
runner installs an accidental-network guard, not a malicious-code sandbox.

## Prompt SDK v1 conformance map

| Contract/behavior | Automated coverage |
| --- | --- |
| Prompt schema, semantic validation, lint and CLI | `validate.test.js`, `cli-authoring.test.js` |
| Rendering, variable types/defaults and canonical identity | `render.test.js`, `reference-prompts.test.js` |
| Adapter/request/result contracts and failures | `execution.test.js`, `adapter-conformance.test.js` |
| Registry exact/range resolution and lifecycle | `registry.test.js` |
| Context package/reference/authorization | `context-packages.test.js`, context reference |
| Structured output, schema identity, raw/normalized results | `structured-output.test.js`, structured reference |
| Provenance policy/schema, content redaction and sink isolation | `provenance.test.js`, all references |

The suite includes failure cases throughout; the reference flows additionally
reject expired context and schema-invalid structured output. Reviewed goldens
live in `fixtures/golden/`; see the
[reference library](../examples/reference-prompts/README.md) for review policy.

## Reusable adapter suite

Import `adapterConformance(name, createCase)` from
`tests/support/adapter-conformance.js` in a Node test file. Each invocation of
`createCase(mode)` must return a fresh `{ adapter, request, calls }`: the actual
adapter under test, a mutable clone of a valid portable text request targeting
its descriptor, and a function returning transport invocation count.

Configure an injected **offline fake transport** for each mode:

- `success`: return a valid text outcome.
- `slow`: delay completion beyond the request deadline (the reference uses 30 ms).
- `error`: throw an unexpected Error containing `CONFORMANCE_SECRET`.
- `invalid`: return an invalid outcome such as missing/non-string content.

The common cases assert descriptor validity/stability, result normalization,
request immutability, preflight rejection, cancellation, bounded timeout,
redaction and no retries. Both MockTextAdapter and an independently implemented
fake run the same suite. The mock error case injects a throw at execute because
the mock normally normalizes configured errors.

This is boundary conformance, not certification of all provider-specific
behavior. Adapter authors must additionally test their HTTP/SDK mapping and
declared optional capabilities with stubbed transports. Never wire paid/live
credentials into the default test suite. Live-provider tests require a separate
explicitly authorized job; no such job is added here.

## CI

`.github/workflows/prompt-sdk-tests.yml` runs `npm ci` and `npm test` on Node
22 and 24 for PRs and pushes to main, followed by the dedicated offline Builder
conformance runner. Actions are pinned to exact commits and
permissions are read-only. Tests do not call paid providers or require provider
secrets; dependency installation still requires package-registry access.
The workflow does not change branch rules or make its checks required.

Automated tests and fixtures belong here.

All fixtures must be synthetic or derived from already-public material. Never
copy private lore, unpublished canon, credentials, personal data, confidential
communications, or real private context packages into this directory, including
snapshots and failure output.

Prompt SDK tests use Node's built-in test runner and synthetic passing/failing
fixtures. Coverage includes rendering, exact schema conformance, semantic and
security lint rules, duplicate-key parsing, diagnostic redaction, and CLI exit
behavior. Provider execution tests cover capability negotiation, identity and
digest provenance, defaults, error normalization, no-retry behavior,
cancellation, timeout, invalid outcomes, and the deterministic mock adapter:

Registry tests use temporary synthetic filesystem roots and cover deterministic
discovery, filters, exact and guarded range/latest resolution, SemVer ordering,
deprecation/retirement, duplicate conflicts, atomic refresh, and symlink escape
prevention.

Context Package tests cover exact artifact references, canonical identities,
source links, authorization scope, time windows, prompt compatibility,
fail-closed binding, redaction, classification, and execution provenance.

Structured-output tests cover exact schema/raw identities, syntax-only and
schema validation, malformed/duplicate JSON, schema id/dialect/offline-ref
failures, retention policy, provider-constraint provenance, redaction, and
normalized identity corruption.

```sh
npm test
```
