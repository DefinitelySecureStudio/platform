# Comic Manifest authoring CLI and offline reference flow (#97)

The unreleased `studio-comic` CLI is a local authoring and review aid over the
existing Comic Manifest APIs. It performs no network access, reference retrieval,
provider invocation, credential discovery, scheduling, retry, publication, or
canon write. The CLI does not load adapter modules. Production trust integrations
must call the library APIs from a separately reviewed host that installs current
approval, disclosure, attestation, and byte readers.

The implementation is additive to the package bin map. In a source checkout:

```sh
npm ci
node src/comic-manifest/cli.js --help
```

The `studio-comic` executable is available when this private package is linked or
installed into a local workspace. No registry publication is part of this task.

## Commands

```sh
studio-comic validate --manifest FILE --json
studio-comic inspect --manifest FILE --json
studio-comic diff --candidate FILE --previous FILE --json
studio-comic verify --synthetic \
  --production production.json --result mock-result.json \
  --candidate release-candidate.json --assignment assignment.json \
  --approvals approvals.json --artifact-map artifact-map.json \
  --synthetic-policy synthetic-policy.json --at 2026-09-15T12:05:00Z --json
```

`validate` accepts any of the four supported record kinds and calls
`validateComicManifest`. It reports only `kind` and validity. It does not certify
cross-record integrity or current permission.

`inspect` calls the validator and returns an allowlisted structural summary. For
production records it also uses `describeComicEpisode` and
`planComicReferences`, but serializes only counts and a plan status. Those helper
results include protected IDs, text, references, and identities; the CLI never
serializes those objects. Other record summaries contain only schema enums and
counts. No titles, panel text, descriptions, speaker names, URIs, paths, IDs,
hashes, approval subjects, or evidence are included.

`diff` calls `diffComicRevision` for the explicit candidate/predecessor pair.
Public pairs return fixed change categories, never changed values. If either
record is non-public, the report says `change_status: "withheld"` and includes
no categories. The command never discovers history.

`verify` calls the #96 build-result boundary and requires the explicit
`--synthetic` mode. It accepts only local record files, an exact URI-to-path
artifact map, a fixture clock, and the non-normative synthetic policy envelope
described below. The local policy callback is a deterministic test harness, not
an authenticated approval, disclosure review, or private-influence attestation.
The report labels itself `offline-synthetic-only` and always says
`publication_authority: "not-issued"`. Never use this mode with private or
production inputs. A real deployment must install trusted adapters through
`createComicBuildResultBoundary` and `createComicApprovalBoundary`; there is no
CLI switch that enables real authority or ambient credentials.

The map is a JSON object whose keys are the exact build-result artifact URIs and
whose values are explicit local file paths. The set of keys must exactly match
the selected build-result outputs. Paths are read literally; the URI is never
used as a path or fetched. Each artifact is bounded to 8 MiB by the CLI, below
the #96 API's larger upper limit.

## Reports and exits

`--json` emits one JSON object on stdout. Errors use a fixed `stage`, `code`, and
`action: "review-inputs"`; raw exceptions, parser excerpts, filenames and input
values are never copied into diagnostics. Human output also contains only a
status and fixed code. Stderr remains empty for CLI outcomes.

Successful reports have stable statuses: `valid`, `inspected`, `diffed`, or
`verified`. A `verify` success reports only whether proposal/evidence files were
written. It never prints either payload by default. Failure exits are:

| Exit | Meaning |
| --- | --- |
| `0` | Validation, inspection, diff, or synthetic verification succeeded |
| `2` | Usage, missing input, malformed/oversized input, or local record validation failure |
| `3` | Synthetic approval, disclosure, attestation, expiry, or revocation check failed |
| `4` | Revision, cross-record linkage/classification, canon/input identity, or artifact verification mismatch |
| `5` | Protected-output consent or destination policy/I/O failure |

These are CLI outcomes, not new Codex schema diagnostics. Validation preserves
the API's fixed diagnostic codes; filesystem failures are normalized to fixed
CLI codes such as `INPUT_FILE_INVALID`, `INPUT_FILE_CHANGED`,
`OUTPUT_DIRECTORY_UNPROTECTED`, `OUTPUT_ALREADY_EXISTS`, and
`OUTPUT_WRITE_FAILED`.

Exit classification follows the operation context and boundary stage, not the
diagnostic code text alone. Local parse, schema, and semantic failures always
exit `2`, including a local `CLASSIFICATION` error. After local records and
assignment shape are checked, revision-diff failures exit `4`; #96
`approval`/`disclosure` failures exit `3`; and its `output`, `build-result`, and
`artifact` failures exit `4`. This keeps a cross-record classification failure
at exit `4` without turning a malformed local record into an integrity result.

## Protected and proposal outputs

By default the CLI emits no proposal, protected evidence, body, URI, or identity.
Writing the allowlisted proposal requires both `--proposal-out FILE` and
`--allow-proposal-output`. Writing the full protected evidence requires a
different pair: `--evidence-out FILE --allow-protected-output`. The destinations
must be different. There is no stdout output-file shortcut.

Each destination must be a new file inside an existing directory owned by the
current user with no group/other permission bits (normally mode `0700`). The CLI
does not create the directory. It creates each file exclusively with mode
`0600`; existing files and symlink destinations are never replaced. If a write
fails, the CLI truncates and removes only the newly created file when its file
and directory identities still match. When both outputs are requested, a later
failure also attempts to remove any earlier file created by that invocation.

Inputs are explicit regular files, at most 8 MiB each. The CLI rejects `..`
components, symlinked path components, hard-linked input files and non-regular
files. It opens no-follow/nonblocking, checks descriptor and pathname identities
before and after reading, and rejects a changed size or modification time. The
Comic Manifest parser enforces UTF-8, duplicate-key, depth, value-count and
string-length limits. The same bounded parser is used for the local map and
synthetic policy JSON. POSIX no-follow support is required; unsupported filesystems
fail closed. The CLI does not claim protection against another process running
as the same user with write access to the same private directory.

## Synthetic policy envelope

The offline policy file is local test data, not a Comic Manifest record or a
portable authorization format. Its exact top-level fields are:

```json
{
  "mode": "offline-synthetic-cli-v1",
  "evaluation_time": "2026-09-15T12:05:00Z",
  "producer_actor": "synthetic-producer",
  "approvals": [],
  "disclosure": {},
  "private_influence": {}
}
```

Each item in `approvals` binds one detached approval to its decision ID, role,
actor, subject digest, artifact digests, exact scope, intended action,
decision/expiry times, authority reference, fixture decision, revocation state,
and evaluation time. The separate `disclosure` object binds the exact candidate,
proposal digest, verified artifact-evidence digest, scope digest, and evaluation
time. `private_influence` separately binds the attestation reference, candidate,
production, result, verified artifact evidence, complete lineage digest, and
evaluation time. Only `decision: "allow"` with a current synthetic state and
exact binding succeeds. A changed/missing binding or a denied/revoked/stale
decision fails closed.

The policy structure and the `synthetic-policy.json` fixture generated by the
example are non-normative. Any actual new contract or authorization semantics
belong in Codex before a production implementation adopts them. The synthetic
example uses only the checked-in public test fixture and fake authority; it
introduces no private provider or credential.

## Offline production-to-proposal reference

Run the end-to-end example:

```sh
node examples/comic-manifest-cli/run-reference.mjs
```

It starts with the synthetic production manifest, binds an offline mock build
result to the exact production identity, reads the synthetic output bytes through
the explicit local artifact map, and runs #96 verification against separate
synthetic approval/disclosure fixtures. It writes the safe proposal and protected
evidence to separate consented files under a temporary owner-only directory,
prints statuses only, then removes the temporary directory. The proposal remains
a review artifact: publication authority is not issued and canon is not changed.

The approved-time boundary follows Codex pin
`8044643bf888067f5a6e0d212f843d72e8787f2b`: decision equality is inclusive,
expiry is exclusive at action and publication time, and malformed trusted action
times fail closed. The CLI fixture clock is explicit and synthetic; it does not
represent a current production clock.

Focused and consolidated coverage:

```sh
node --test tests/comic-manifest/cli.test.js
node examples/comic-manifest-cli/run-reference.mjs
npm test
node scripts/check-context-builder.mjs
node scripts/check-sdk-release.mjs
```
