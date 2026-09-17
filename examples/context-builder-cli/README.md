# Offline Context Builder authoring examples

These authority records are **synthetic preparation decisions**, not production
credentials or package-use approvals. They explicitly match the immutable request
identities of the reviewed public fixtures. Editing a request requires an explicit
new synthetic decision for its new identity; the CLI never writes approvals.

- `context-builder-lexical-v1-authority.json` matches the public synthetic text
  scenario in `tests/fixtures/context-builder-lexical-v1.json`.
- `context-builder-v1-authority.json` matches the text plus fake private JSON export
  in `tests/fixtures/context-builder-v1.json`. The fake private export contains only
  public synthetic facts; its opaque handle is never dereferenced.

From the repository root:

```sh
node src/context-builder/cli.js validate --fixture tests/fixtures/context-builder-v1.json --json
node src/context-builder/cli.js plan --fixture tests/fixtures/context-builder-v1.json
node src/context-builder/cli.js build --fixture tests/fixtures/context-builder-v1.json --synthetic --authority examples/context-builder-cli/context-builder-v1-authority.json --at 2026-09-15T12:00:00Z --json
```

This builds and audits a real package in memory without writing any body or
invoking a provider. For public-only text, replace both fixture and authority file
names with their lexical counterparts. Dates are explicit fixture evaluation times,
not assertions of current production validity.

For protected review output, choose a private temporary directory:

```sh
builder_output_dir=$(mktemp -d)
node src/context-builder/cli.js build --fixture tests/fixtures/context-builder-v1.json --synthetic --authority examples/context-builder-cli/context-builder-v1-authority.json --at 2026-09-15T12:00:00Z --output "$builder_output_dir/prepared.json" --allow-protected-output --json
node src/context-builder/cli.js verify --artifact "$builder_output_dir/prepared.json" --json
node src/context-builder/cli.js replay --fixture tests/fixtures/context-builder-v1.json --synthetic --authority examples/context-builder-cli/context-builder-v1-authority.json --at 2026-09-15T12:00:00Z --artifact "$builder_output_dir/prepared.json" --json
```

Do not upload the review output to CI artifacts, paste its body/digests into public
issues, or commit generated artifacts. Apply your approved retention/cleanup policy
to the temporary file. Verification does not authorize use, and replay requires
fresh explicit fixture authority. See the [CLI guide](../../docs/context-builder-cli.md)
for exact reads, exits, filesystem limits and authoring/review workflow.
