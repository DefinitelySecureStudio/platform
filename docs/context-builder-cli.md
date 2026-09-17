# Context Builder CLI and authoring/review workflow

Studio #84 adds `node src/context-builder/cli.js`, an **unreleased offline synthetic
authoring CLI** over the Builder development API. It does not install a package bin
or change the released Prompt SDK CLI/export map. Production trust, secure-store
deployment and immutable publication remain separately reviewed work.

## Commands and explicit inputs

| Command | Reads and behavior |
| --- | --- |
| `validate` | Reads request/prompt or fixture JSON; validates canonical request/prompt binding. No authority or reader invocation. |
| `inspect` / `plan` | Same reads and validation; reports source/slot/candidate counts with `authority: not-checked`. No normalization, source adapter, audit, model call or file write. |
| `build` | Reads explicit fixture/source bytes and synthetic decision file, runs verified preparation/normalization/selection/assembly and required synthetic audit. Prints status only. |
| `verify` | Reads saved artifact and validates its closed envelope, result schema, result digest and published package schema/semantic identities. No authority lookup or source access. |
| `replay` | Reads artifact plus explicit build inputs/authority, performs a new audited build with no cache or source refresh, compares stable outputs, and reports match/mismatch. |

Use `--fixture FILE`, or separate `--request FILE --prompt FILE`. Build/replay with
separate files also require `--sources FILE`, a JSON array of `{ source_id, text }`
in request source order. The combined fixture contains `request`, `prompt` and
`raw_sources`; existing reviewed contract fixtures can be used directly. Other
golden fixture fields are not accepted as authority or reused as built output.

Every build/replay requires `--synthetic --authority FILE --at UTC`. The authority
file is exactly `{ mode: 'synthetic', decisionOwners, decisions }` using the existing
synthetic preparation verifier format. There is no fallback grant, inferred owner,
environment credential discovery or implicit current time. Missing/denied/stale
authority fails. Supplied `--at` is a fixture clock, **not proof of current permission**.
No production approval can be obtained by labeling a file or backdating this clock.

Supported fixture readers are synthetic/caller-supplied bytes and **fake** approved
private export streams. No private handle, artifact URI, repository path or remote
service is resolved. Do not supply real private exports to this synthetic workflow.
All checked-in examples use public synthetic data. See
[runnable examples and explicit authority files](../examples/context-builder-cli/README.md).

Plan reads the *entire bounded input document*: a combined fixture may contain raw
synthetic source text, even though no source reader is invoked. For a plan that does
not read source bodies, use separate request/prompt files. Plan rejects `--sources`,
`--authority` and `--at` rather than secretly reading them. A successful plan says
nothing about permission, source availability, budget fit or eventual build success.

## Output, integrity and stable exits

`--json` emits one machine-readable JSON report. Human output states status and
safe counts/codes without raw exceptions, source text, private paths or identifiers.
Successful build/replay reports that use authorization was **not issued**. Verify
reports authorization **not checked**. No provider invocation or publication command
exists. Unsupported/duplicate flags fail instead of being ignored.

| Exit | Meaning |
| --- | --- |
| 0 | Validation/plan/build/verify/replay succeeded |
| 2 | Invalid usage, malformed/missing/oversized input or request validation failure |
| 3 | Missing explicit synthetic authority, invalid runtime fixture configuration or build/policy failure |
| 4 | Artifact integrity failure or deterministic replay mismatch |
| 5 | Protected output consent/destination I/O policy failure after valid usage |

Missing output consent is a usage error (2); unsafe/unwritable output destinations
are 5. JSON diagnostics contain only stage/code/action. Build failure reports the
existing value-free Builder diagnostics; no partial artifact is written. CLI errors
use stable local codes such as `INPUT_FILE_INVALID`, `ARTIFACT_INVALID`,
`EXPLICIT_SYNTHETIC_AUTHORITY_REQUIRED`, `REPLAY_MISMATCH` and `OUTPUT_WRITE_FAILED`.
They are not additions to the Codex wire schema. Routine reports are safe projections,
not authenticated public receipts; #82's independently approved attestations remain
the publication mechanism.

The protected storage envelope is `studio-builder-cli-artifact-v1` with an audited
prepared result and canonical `result_identity`. It is not an execution/use grant.
Verify proves structural/internal integrity, **not authenticity, truth, ownership,
authority, current validity or relational source evidence**. An attacker able to
rewrite an entire artifact can recalculate its hashes; trusted audit resolution and
fresh authority are still required. Replay compares build/correlation/request
identity, complete package, lineage and omissions after a new authorized build.
It deliberately excludes independently assigned audit evidence references, which
must change between builds. A changed request/budget/source/policy is not silently
accepted as equivalent even when section text happens to match.

## Protected output destinations and resource limits

Bodies are discarded from routine stdout. To save them, both `--output FILE` and
`--allow-protected-output` are required. Output is available only for successful
build/replay. The immediate parent must be an existing real directory owned by the
current user with no group/other permission bits (typically mode 0700). Files are
created exclusively with mode 0600 and no-follow semantics. Existing files/symlink
destinations are never overwritten. Failed writes attempt to remove only the newly
created partial file. Directory creation, repository changes and publication are
never automatic. Use a private temporary/secure workspace outside source control.

Inputs must be explicit regular files, at most 2 MiB each, opened no-follow/nonblocking
with size and modification checks. The strict JSON parser rejects duplicate keys,
invalid Unicode, excessive depth/nodes/strings and malformed data. Output is also
capped at 2 MiB so it can be read back. Existing Builder byte/normalization and JSON
snapshot ceilings remain in effect; the CLI may reject larger inputs accepted by
lower-level APIs. No silent truncation. POSIX no-follow support is required; other
platforms fail closed. These pathname checks require host-controlled directory
ancestors: they are not a sandbox against hostile concurrent ancestor replacement.
Storage encryption, retention, backups and secure deletion remain host policy.

## Approved runtime injection and review handoff

The CLI intentionally has no arbitrary `--module`, token flag, dotenv discovery or
production-credential loading. For an approved deployment, a separately reviewed
trusted host must construct the public Builder API with its preparation verifier,
approved source readers, protected audit sink and independent use-authorization
provider. Inject authenticated clients from approved runtime secret management into
those adapters—not request JSON, fixtures, argv, logs or source control. Real private
reader/trust onboarding requires owner approval; this synthetic command is not a
shortcut around it.

Review the protected package content, source evidence, classification, exact
manifest identity, omissions, purpose and lifetime. Then obtain a separate grant
from the approved use authority for the exact instance/prompt/purpose/sections.
Use the [SDK handoff](context-builder-handoff.md), which rechecks it before execution.
This CLI neither manufactures that grant nor calls a provider, publishes evidence,
promotes Canon or assumes Manifest/Orchestrator authority.

## Lab → Codex/Platform authoring path and offline CI

1. Experiment in Lab with synthetic source plans, explicit fragment IDs and prompt
   slots; never commit real Lore or unrevealed material as a convenience fixture.
2. Propose stable policy/format changes in Codex through owner review. Pin reviewed
   schema versions and digests; never edit immutable released bytes in place.
3. Implement production behavior in Platform with focused tests, provenance,
   constitutional assessment and documented trust/retention boundaries.
4. Validate/plan locally, supply an explicitly reviewed synthetic decision, build
   into a protected destination, verify and replay, and review the exact package.
5. Obtain independent production trust/use approval only through approved services;
   immutable release/publication remains separate work, not a CLI subcommand.

`npm ci && npm test` is the offline-after-install CI path; existing Node 22/24 CI
already runs the new subprocess suite. No paid services, credentials, real private
access or artifact upload is required. Run `node --test tests/context-builder/cli.test.js`
for focused tests and `node scripts/check-sdk-release.mjs` for baseline preservation.
See [ADR 0016](adr/0016-context-builder-authoring-cli.md). Suite consolidation (#85)
and reviewed immutable release (#86) remain next tasks.
