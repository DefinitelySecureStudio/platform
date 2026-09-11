# Prompt SDK v1 release guide

The five Codex v1.0.0 contracts are published immutably at commit
`62e78b606986988518b9dc502c25ae1cd189684a`; their verified manifests are in
[contract-lock.json](../release/contract-lock.json). This adoption candidate
updates package/renderer/processor to 1.0.0 and permits stable prompt lifecycle.
The Platform artifact itself remains pending owner merge and publication:
Studio #72 and Epic #4 stay open until that final release is verified.

## Quick start

Use Node.js 22 or 24 and the committed npm lock:

```sh
npm ci
npm test
node src/prompt-sdk/cli.js validate examples/cli/prompt.json --format json
node src/prompt-sdk/cli.js render examples/cli/prompt.json --inputs examples/cli/inputs.json --format json
node examples/reference-prompts/run.mjs structured
```

All examples are synthetic and mock-based. No API keys or model network calls
are required. For execution and protected output handling, follow the
[CLI/authoring guide](prompt-cli.md); for integrated flows use the
[reference library](../examples/reference-prompts/README.md).

## Public API surface

Import the supported entry point `@definitely-secure-studio/platform/prompt-sdk`.
The exact exported-name inventory is [api-v1.json](../release/api-v1.json),
checked by automated tests. Internal paths and generated validators are not
public APIs. Most validators return `{ valid, diagnostics, ... }`; provenance
validation returns a boolean. Throwing and nonthrowing variants are distinct.

| API | Inputs and result | Reference |
| --- | --- | --- |
| `canonicalJson(value)` | Explicit JSON data to deterministic string; rejects non-JSON data/accessors | [Rendering](prompt-renderer.md) |
| `parsePromptJson(source)` | Raw JSON to value plus diagnostics, retaining duplicate-key evidence | [Validation](prompt-validation.md) |
| `validatePromptDefinition(definition, options)`, `validatePromptDefinitions(definitions, options)` | Schema/semantic/lint reports; no rendering or execution | [Validation](prompt-validation.md) |
| `renderPrompt(definition, options)`, `tryRenderPrompt(definition, options)` | Explicit inputValues/contextValues to rendered messages, canonical bytes and identity; throwing or result variant | [Rendering](prompt-renderer.md) |
| `FilesystemPromptRegistry.open(options)`, `createFilesystemPromptRegistry(options)` | Async approved filesystem roots to registry; discover/list, resolve and refresh methods | [Registry](prompt-registry.md) |
| `createExecutionRequest(renderResult, options)` | Validated portable execution request with explicit identity, target, authority and output contract | [Execution](provider-execution.md) |
| `validateExecutionDocument(document)`, `validateExecutionCompatibility(request, descriptor)`, `validateExecutionResult(result, options)` | Contract validation and capability/default negotiation; result relation checks need request and descriptor | [Execution](provider-execution.md) |
| `executePrompt(request, options)` | Async single adapter execution; options include adapter, signal, clock and optional observer configuration | [Execution](provider-execution.md) |
| `MockTextAdapter`, `mockTextAdapterDescriptor()` | Configurable offline adapter and independent descriptor copy | [Conformance](../tests/README.md) |
| `parseContextPackageJson(source)`, `validateContextDocument(document)`, `validateContextBinding(...)` | Explicit package/authorization validation; no retrieval | [Context](context-packages.md) |
| `bindContextPackage(...)`, `renderPromptWithContextPackage(...)` | Authorized declared-slot bindings and rendering at an explicit time | [Context](context-packages.md) |
| `createMockContextPackage()`, `createMockContextAuthorization(options)` | Synthetic deterministic fixtures, not production authority | [Context](context-packages.md) |
| `processStructuredOutput(request, result, options)`, `tryProcessStructuredOutput(...)`, `validateStructuredOutputDocument(document)` | Parse once, verify raw/schema bytes, return normalized result or failure; no repair or remote schema fetch | [Structured output](structured-output.md) |
| `createExecutionProvenance(request, result, options)`, `validateExecutionProvenance(document)` | Frozen metadata-only evidence and schema/digest validation | [Provenance](execution-provenance.md) |
| `LocalExecutionObserver`, `deliverExecutionProvenance(observer, document, timeoutMs)` | Bounded local buffer/snapshot/clear and deadline-bounded delivery boolean | [Provenance](execution-provenance.md) |

Error classes are public for catch/type checks: PromptRenderError,
PromptRegistryError, ExecutionValidationError, AdapterExecutionError,
ContextPackageError and StructuredOutputError. Do not treat arbitrary caught
provider exception text as safe logging output. Each guide documents its error
reports and failure behavior.

Public metadata constants CONTRACT/PROMPT_DEFINITION_CONTRACT,
EXECUTION_CONTRACT, CONTEXT_PACKAGE_CONTRACT and STRUCTURED_OUTPUT_CONTRACT
identify the implementation's exact contract pins. They do not authorize release.

## Adapter implementers

Implement `async describe()` and `async execute(request, { signal })` behind the
Studio-owned adapter boundary. Return the portable descriptor/outcome; keep
provider SDK types, credentials and raw errors inside the adapter. Capability
implementation (native/emulated), parameters, defaults and optional extensions
must be explicit. Honor cancellation where possible; core deadlines do not
cancel a non-cooperating provider's already-started work or billing.

Follow [provider execution](provider-execution.md) and run the
[reusable offline conformance suite](../tests/README.md). Add stubbed transport
tests for provider mapping, security/retention/region policy and declared optional
capabilities. Provider neutrality is demonstrated by the mock and independent
fake; no real provider is approved by v1 release.

## Compatibility and deprecation

SDK and individual Codex contracts version independently using SemVer. The
initial SDK release is `prompt-sdk/v1.0.0`; each Codex family uses
`contract/<name>/v1.0.0`. Consumers pin exact releases and digests.
Unknown fields/capabilities are handled according to each closed contract, not
silently ignored. Do not assume generic major-version compatibility replaces
explicit capability negotiation or exact schema support.

Patch: compatible fixes; minor: backward-compatible API additions and announced
deprecations; major: removals or incompatible behavior/identity/security changes.
Deprecations require owner approval, migration guidance, affected-consumer
inventory and a dated support window; nothing is silently removed within v1.
Security fixes may require a reviewed migration and new major when semantics
change. Keep old tags/artifacts intact. A rollback selects a previously verified
release; it never mutates old versions or downgrades classification rules.

## Known v1 limitations

Synchronous text generation and JSON output only. No streaming, asynchronous
jobs, image/audio/multimodal execution, tool protocols, model routing/retries,
retrieval, orchestration or distributed registry. No vendor SDK ships here.
Structured validation is not truth/quality validation or output approval.
Observers are best-effort and sink deadlines do not stop external I/O.
No automatic canon, prompt lifecycle, authority or publication approval.

## Release checklist

1. Owner approves Codex release preparation; publish and verify all five immutable
   contract releases per its release checklist. Capture complete manifests.
2. Review Platform's dependency lock containing exact repository, contract,
   version/tag, source commit, asset URI/type/size/digest. Replace provisional
   runtime pins and regenerate validators from downloaded verified assets.
3. Only then change runtime status to released and enable stable prompt lifecycle.
   Bump package, lock, renderer and structured processor versions to 1.0.0
   together; review every intentional golden identity change.
4. Confirm exported API inventory, all tests and both CI versions. Run dependency
   audit and resolve findings or obtain a documented owner exception.
5. Record Constitution v1.0.0 alignment, owner approval, licenses/notices,
   dependency tuples, test evidence, exact Platform source commit and build
   workflow identity. No private inputs are used in these release artifacts.
6. Build the source/package artifact, inspect its file list and secret safety,
   record byte size/digest, upload to an owner-reviewed draft GitHub release
   at `prompt-sdk/v1.0.0`, then publish once and verify immutability/downloads.
7. Close #72 and Epic #4 only after actual release verification.

The package remains private. GitHub artifacts are sufficient; this work does
not publish to npm or change package/repository visibility.
