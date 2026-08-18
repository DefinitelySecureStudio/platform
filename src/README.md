# Source

Production application and library code belongs here. `prompt-sdk/` contains
the dependency-free Node.js implementation of Prompt Definition v1 rendering.
Provider adapters must consume its canonical rendered-prompt result rather than
reinterpreting template parts.

The same package contains Prompt Definition v1 validation and linting. The
generated schema validator is reproducibly derived from the exact Codex schema;
semantic rules, JSON parsing, diagnostics, and the CLI remain reviewed source.

Source code must remain content-neutral. Creative inputs enter through versioned
contracts at runtime and must not be embedded in code, defaults, logs, fixtures,
or generated build output.
