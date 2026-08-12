# Architecture boundary

The platform implements production capabilities; it does not own the contracts
or creative inputs it consumes.

```text
codex contracts ────────┐
public universe input ──┼──> platform runtime ──> proposed release artifacts
approved lore export ───┘
```

- `codex` owns stable IDs, schemas, prompt contracts, manifest specifications,
  and context-package specifications.
- `universe` owns reader-safe canon and accepts public release records.
- `lore` owns unrevealed material and may provide a minimal approved runtime
  export through a secure channel.
- `platform` validates versioned inputs, executes production behavior, and emits
  artifacts with source and contract provenance.

The platform must not require a checkout of `studio`, `universe`, or `lore` to
build its software. Private inputs are runtime data, never source dependencies.
The exact version-pinning and distribution mechanism will follow
[studio issue #33](https://github.com/DefinitelySecureStudio/studio/issues/33).
