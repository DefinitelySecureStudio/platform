# Source

Production application and library code belongs here. `prompt-sdk/` contains
the dependency-free Node.js implementation of Prompt Definition v1 rendering.
Provider adapters must consume its canonical rendered-prompt result rather than
reinterpreting template parts.

The same package contains Prompt Definition v1 validation and linting. The
generated schema validator is reproducibly derived from the exact Codex schema;
semantic rules, JSON parsing, diagnostics, and the CLI remain reviewed source.

Provider Execution v1 validation, preflight negotiation, synchronous execution,
normalized results/errors, and the provider-free mock adapter also live in the
Prompt SDK. Vendor SDK integrations remain outside this core boundary.

The Prompt SDK registry discovers contract-valid `*.prompt.json` files from
explicit approved roots and resolves versions independently of rendering or
execution. Storage adapters must not redefine Codex identity or lifecycle rules.

Context Package v1 parsing, integrity and authorization validation, prompt-slot
binding, and provenance propagation also live in the SDK. Context discovery,
retrieval, selection, assembly, and approval remain outside it.

Structured Output v1 processing verifies raw response and schema artifact
identity, parses JSON once, validates independently, and preserves distinct raw
and normalized provenance. Schema registries and provider-native SDK features
remain outside the core implementation.

Source code must remain content-neutral. Creative inputs enter through versioned
contracts at runtime and must not be embedded in code, defaults, logs, fixtures,
or generated build output.
