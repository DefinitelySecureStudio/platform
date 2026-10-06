# Comic Manifest revision diffs and approval boundary (#95)

The unreleased `./comic-manifest` module adds `diffComicRevision` and
`createComicApprovalBoundary`. Both operate on explicit bounded raw JSON. They
do not read revision history, persist decisions, publish a release or promote
canon. Trust is injected by host code for each evaluation; no production trust
provider is installed here.

## Current approval evaluation

```js
import { createComicApprovalBoundary } from
  '@definitely-secure-studio/platform/comic-manifest';

const approvals = createComicApprovalBoundary({
  producerActor: hostProducerActor,
  getTime: () => hostPolicyClock(),
  verifyCurrentApproval: async exactBinding => {
    // Host code authenticates the issuer/actor, current role permission, and
    // revocation state for this exact tuple as of exactBinding.actionTime.
    return hostVerifyAndCheckRevocation(exactBinding) === true;
  }
});

const decision = await approvals.verify({
  candidateSource: releaseJson,
  previousSource: previousReleaseJson,
  approvalSources: detachedApprovalJson
});
```

The host installs `getTime`, `verifyCurrentApproval` and the producer identity
as trusted configuration. Candidate, predecessor, detached approval and review
scope data are raw JSON strings; payloads cannot install or replace an adapter.
`getTime()` is called once per evaluation. The verifier is called for every
required approval on every evaluation; results are never cached or reused.
Only the literal boolean `true` from the verifier accepts. `false`, unknown
values, thrown errors, missing bindings and unverifiable evidence fail closed
with fixed value-free diagnostics. A status label such as `"approved"` does not
grant authority.

The action is derived from the record kind and is passed to the trusted verifier:

| Candidate | Action | Required detached role(s) | Subject | Artifact digests | Scope |
| --- | --- | --- | --- | --- | --- |
| `comic-production` | `review-production` | `production-reviewer` | Complete production identity | Empty | Exact host-supplied `reviewScopeSource` |
| `comic-public-release` | `publish-release` | `publisher`, `canon-editor`, plus `disclosure-reviewer` when `private_context.influenced` | Complete release identity | Sorted output artifact SHA-256 digests | Exact release `scope` |

Production review callers must supply `reviewScopeSource` as a raw JSON object
with exactly `destination`, `audience`, `purpose` and `publication_time`. It is
compared as a whole against the detached approval scope. Release callers may not
override the record's scope. Detached release decisions must match the public
`approvers` entry for the same role, decision ID, actor and decision time, with
no duplicate or extra roles. Any producer self-approval is rejected using the
host-configured producer identity. Approval envelope subject, selected output
digests and scope must all match the current candidate exactly.

`validateComicRevision` checks the explicit predecessor pair before approval
evaluation. Revision 1 may be evaluated without a predecessor. A later revision
requires its immediately preceding record, including the exact complete identity.
Changed bytes under a supplied existing revision, skipped revisions, changed
episode identity and release-ID reuse fail. A corrected release keeps its
`episode_id`, advances by one and uses a new `release_id`. Approvals for the old
candidate cannot transfer because their subject identity no longer matches.
The module does not discover missing history, enforce global uniqueness or decide
what consequences an expired approval has for an already published record.

The decision-time relation is exact: `decided_at <= action_time < expires_at`.
The exact scope's `publication_time` must also be strictly earlier than
`expires_at`. Decision-time equality is valid; expiry equality at action or
publication time is expired. A later decision is not yet valid. No separate
ordering is imposed between `decided_at` and `scope.publication_time`. Timestamp
comparisons preserve schema precision and equivalent accepted separators without
Date rounding. Invalid calendar/clock fields and second `60` fail closed for
approval-time use, even where the candidate schema format accepts the shape.
Execution timestamps retain their separate record-local ordering behavior.

This API checks exact local bindings and currentness only through the required
host verifier. A production verifier must authenticate the issuer and reviewer,
verify role permission and intended action, validate its trusted time, and check
current revocation state. It must not treat schema validity, caller status text,
or an old cached decision as an authorization grant. This integration seam uses
synthetic offline tests only; it is not a signed-grant format, production trust
root, human review, publisher, disclosure approval or canon decision.

## Disclosure-safe revision diff

```js
import { diffComicRevision } from
  '@definitely-secure-studio/platform/comic-manifest';

const diff = diffComicRevision(nextRevisionJson, previousRevisionJson);
```

The helper accepts only an exact unchanged or adjacent revision pair. For two
records declared public, it returns a stable sorted set of fixed categories such
as `creative-content`, `inputs`, `outputs`, `publication`, `approvals` and
`revision`; it never returns field values, IDs, hashes, paths, free text or raw
diagnostics. If either revision is non-public, it returns only
`{valid:true,details_withheld:true,diagnostics:[]}`. Declared classification is
still only metadata and does not prove that a payload is safe to disclose.

```sh
node --test tests/comic-manifest/approval-boundary.test.js
```

The focused suite consumes Codex's exact synthetic approval-time matrix and also
checks role/action separation, current verifier behavior, producer separation,
exact scope/subject/output binding, revision invalidation, correction identity,
and value-free diffs. Tests use fake host decisions only.
