# Prompt registry

The Prompt SDK includes a portable, filesystem-backed v1 registry for approved
Prompt Definition locations. It discovers UTF-8, BOM-free `*.prompt.json` files recursively,
parses them without losing duplicate-key evidence, validates them against the
exact Codex contract and Platform semantic rules, and atomically publishes a
new in-memory snapshot only when every discovered definition is valid.

```js
import { createFilesystemPromptRegistry } from "@definitely-secure-studio/platform/prompt-sdk";

const registry = await createFilesystemPromptRegistry({
  roots: [{ id: "production-prompts", path: "/approved/prompts" }]
});

const exact = registry.resolve("prompt.reference.summarize-public-text", "1.2.3");
console.log(exact.definition, exact.metadata.source, exact.warnings);
```

Root paths are explicit runtime configuration. Each root also requires a safe,
stable `id`; public metadata and diagnostics use that id and the relative path,
not the host's absolute path. Symlinks are rejected so discovery cannot escape
or ambiguously traverse an approved boundary. The registry performs no network,
repository, environment, credential, provider, or hosted prompt-service access.
A checked-out repository is simply another explicitly approved filesystem root.

## Discovery and conflicts

`discover()` (also available as `list()`) returns deterministic metadata ordered by prompt id, descending
Semantic Version precedence, and exact version text. Filters support:

- `id_prefix`
- all requested `tags`
- any requested `owners`
- allowed `lifecycle` states
- case-insensitive `query` across reader-safe identity and descriptive metadata

Every entry includes the exact id/version, lifecycle, tags, owners, root id,
relative path, source byte size, and SHA-256 digest. Prompt bodies and runtime
values are not copied into discovery metadata. Safe, value-free validation
warnings remain available as `validation_warnings` and are also returned when
that definition resolves.

Two files with the same `id` and exact `version` are always an error, even when
their bytes match. This avoids path/order-dependent authority and identifies
both duplicate and conflicting definitions clearly. Parse, schema, semantic,
duplicate, and symlink failures abort refresh without replacing the last valid
snapshot.

## Resolution

An exact version string is the normal and reproducible selector:

```js
registry.resolve("prompt.example.summary", "2.1.0");
```

The registry never substitutes another version or follows a deprecation
replacement. Deprecated exact versions resolve with `PROMPT_DEPRECATED` and the
recorded replacement or no-replacement evidence. Retired versions fail for new
use; an explicitly authorized audit/reproduction caller may pass
`{ includeRetired: true }` and receives `PROMPT_RETIRED_AUDIT_ONLY`.

Range and latest selection are deliberately guarded because their answer can
change when the snapshot changes. They require both `allowNonExact: true` and an
explicit lifecycle allowlist:

```js
const selected = registry.resolve(
  "prompt.example.summary",
  { kind: "range", range: ">=2.0.0 <3.0.0", lifecycle: ["stable", "deprecated"] },
  { allowNonExact: true }
);

// Persist selected.definition.version and selected.metadata.source.sha256
// before any reproducible or published workflow uses it.
```

Supported ranges are full SemVer comparator sets joined by spaces, one caret
range, or one tilde range. Partial versions, wildcards, hyphen ranges, and `||`
are rejected instead of guessed. Prereleases match only when a comparator names
a prerelease with the same major/minor/patch tuple. Build metadata does not
change precedence; two highest matches with equal precedence fail as ambiguous
rather than being selected by path order.

Every non-exact result emits `NON_EXACT_PROMPT_RESOLUTION`. A caller must pin the
returned exact version and source identity before reproducible execution.

## Lifecycle and authority

Lifecycle metadata is exposed as contract data; the registry does not grant
release, production, private-context, or execution authority. The current
provisional Prompt Definition v1 validator still rejects `stable` until issue
#72 supplies the immutable released contract artifact. Registry refresh does not
watch the filesystem automatically; callers control when a new snapshot is
loaded by invoking `refresh()`.
