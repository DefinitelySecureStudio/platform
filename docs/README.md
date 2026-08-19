# Platform documentation

This directory contains architecture decisions, public interfaces, operational
guides, and deployment documentation for the production platform.

Repository-local ADRs belong under `docs/adr/`. Decisions that change ownership
or dependencies across Studio repositories belong in the public `studio`
repository first.

Documentation must remain content-neutral. Use synthetic or already-public
examples and redact credentials, personal data, private production context,
proprietary lore, and unpublished canon.

- [`architecture.md`](architecture.md) defines repository and dependency boundaries.
- [`adr/0001-node-esm-runtime.md`](adr/0001-node-esm-runtime.md) selects the initial runtime.
- [`adr/0002-compiled-prompt-schema-validation.md`](adr/0002-compiled-prompt-schema-validation.md) records reproducible schema compilation.
- [`adr/0003-provider-neutral-execution-boundary.md`](adr/0003-provider-neutral-execution-boundary.md) records the synchronous adapter boundary.
- [`prompt-validation.md`](prompt-validation.md) documents validation, lint rules, diagnostics, and CI use.
- [`prompt-renderer.md`](prompt-renderer.md) documents rendering, canonicalization, and errors.
- [`provider-execution.md`](provider-execution.md) documents execution contracts, adapters, negotiation, and failures.
