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

## Dependency references

Every production input uses the stable reference tuple defined by the
[Studio dependency strategy](https://github.com/DefinitelySecureStudio/studio/blob/main/dependency-strategy/README.md):
logical version, immutable tag, exact source commit, artifact URI, media type,
byte size, and verified SHA-256 digest.

- Codex contracts arrive as immutable released bundles.
- Public canon arrives as an immutable Universe snapshot bundle.
- Private context arrives as a minimal encrypted object from an approved secure
  store, with an immutable object version and digest.
- Platform packages use their ecosystem lock and integrity data; container
  deployments use an OCI manifest digest rather than a floating tag.

Before Studio issue #72 publishes the first immutable Codex contract bundles,
non-release implementation work may pin an accepted contract by exact commit,
verified byte size, and SHA-256 digest. That provisional dependency must be
visible in runtime evidence and conformance records and is release-blocking
until replaced by the complete immutable artifact tuple.

Do not use cross-repository submodules, build-time clones, branch references, or
vendored canon, lore, or schemas. Version ranges may discover upgrades, but a
reviewed lock resolves one exact artifact.

## Release output

A production release records Platform version, immutable tag and commit,
package or OCI digest, exact Codex and canon inputs, build workflow identity,
output sizes and digests, and an artifact attestation when supported. If private
context influenced the build, public output contains only the opaque attestation
ID supplied by the restricted provenance process—never Lore paths, commits,
object locations, or hashes.

Platform builds against canon snapshot `C(n)` and proposes release `R` to
Universe. Universe may include `R` in `C(n+1)`; Platform must not claim that
downstream snapshot as an input to `R`.
