# Context Package v1 integration

The Prompt SDK consumes already-prepared Context Package v1 artifacts from the
contract pinned by `CONTEXT_PACKAGE_CONTRACT`. It validates package structure,
canonical manifest and section identities, source links, classification, size,
time bounds, and a separate authorization decision before binding any content.

This boundary does not discover, search, retrieve, rank, select, summarize, or
assemble context. A Context Builder or other approved producer performs that
work and supplies an explicit package, authorization, prompt, and evaluation
time. Missing required context fails; there is no implicit lookup or fallback.

```js
import { createMockContextAuthorization, createMockContextPackage,
  renderPromptWithContextPackage } from "@definitely-secure-studio/platform/prompt-sdk";

const result = renderPromptWithContextPackage(definition, {
  inputValues,
  packageDocument: createMockContextPackage(),
  authorization: createMockContextAuthorization({
    promptId: definition.id, promptVersion: definition.version
  }),
  at: "2026-08-20T12:00:00Z"
});
```

`parseContextPackageJson` accepts UTF-8 strings or byte arrays and can verify a
detached `context-package-reference` against the exact serialized artifact.
`validateContextDocument` and `validateContextBinding` return value-free,
machine-readable reports. `bindContextPackage` and
`renderPromptWithContextPackage` throw `ContextPackageError` on failure.

Authorization must explicitly allow the exact package instance, prompt version,
purpose, section set, classification ceiling, and evaluation time. Every
package section must map to a declared and explicitly placed prompt context
slot with compatible media type, format, classification, and byte limit.

Rendered provenance retains the package id/version/instance and manifest
digest, section digest and source ids, source kind/version/classification, and
authorization evidence. Raw values never enter diagnostics or provenance. The
effective classification rises to the highest bound input or context.

The deterministic mocks are synthetic test utilities, not production approval
or package construction. The provisional exact Codex commit pin must be
replaced by the immutable issue #72 contract artifact before release.

Regenerate the compiled validator only from the pinned schema bytes:

```sh
npm run generate:context-schema -- /path/to/context-package.schema.json
```
