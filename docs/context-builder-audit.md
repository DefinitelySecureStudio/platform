# Required audit and public attestation boundary

Studio #82 adds an unreleased `createAuditedContextBuilder` facade. Its
`build({ request, prompt, callerId, signal })` returns the reviewed Codex candidate
`context-build-result`, prepared or failed. It snapshots validated inputs before
awaiting an adapter. Invalid/unsupported input fails at the API boundary without
fabricating a request identity. No immutable Codex/Context Package/SDK changes or
new production package export are made.

```js
const builder = createAuditedContextBuilder({
  gate,                         // trusted createPreparationGate instance
  mode: 'synthetic',             // production requires production gate AND sink
  sink,                         // explicitly installed trusted protected sink
  getTime: approvedClock,        // explicit UTC timestamps; no hidden identity clock
  timeoutMs: 1000
});
const result = await builder.build(input);
```

The existing gate normalization, selection, assembly and artifact methods remain
development-stage building blocks, **not audited completed builds**. Full build
delivery must use this facade. It never accepts a caller-supplied package/result
as completed work or a prior audit acknowledgment as preparation permission.
Cached inputs and replay artifacts do not bypass these audit requirements.

## Protected evidence and delivery

The sink receives a local `studio-builder-audit-v1` record, distinct from the Codex
wire result and public receipt. The closed construction records:

- build/correlation IDs, exact request identity, builder/policy versions, target
  identity, preparation reference and purpose identity (not purpose text);
- requested source IDs, immutable versions/classifications and byte budgets;
- explicit start/observation timestamps and attempt/prepared/failed phase;
- on preparation, approved input-set/artifact/package identities, exact package
  instance, classification, used content bytes, preparation bounds, selected
  candidate lineage and optional empty/budget omissions;
- on failure, only value-free stage/code/action diagnostics.

Records exclude source bodies, JSON values, queries, private export handles, paths,
credentials and raw exceptions. **They are still protected**, because IDs, hashes,
classification and correlations can themselves disclose information. Never log
these records publicly. Retain them only under separately approved operational
access and retention controls; the synthetic memory sink is not a public logger.

An input-set identity binds the approved raw byte tuples (including private input
identities omitted from the public-shaped package). Detailed protected lineage and
request records let a trusted investigator relate that set to individual inputs;
an identity is not proof of source truth, approval or attestation authenticity.

`sink.deliver(record, { signal })` must durably accept the exact record before
resolving `{ evidence_reference, record_identity }`. The reference is a fresh opaque
UUID, not any protected identifier in the record. `record_identity` must equal the
canonical submitted record identity. Duplicate references within a build, extra
acknowledgment fields, malformed references and wrong identities fail closed.
Production sinks require a nonempty trusted `id` outside the `studio.synthetic.`
namespace; merely relabeling the supplied synthetic sink is rejected.
The host verifies/trusts the production sink independently; matching hashes alone
do not establish that an untrusted service durably retained evidence.

Delivery is bounded to 1 MiB per record and 1–60,000 ms per call (default 1,000 ms).
Timeout/abort signals propagate to cooperative sinks and late acknowledgments never
release a package. No hidden retry or public fallback occurs. A timeout cannot undo
an already committed sink write: production sinks must reconcile uncertain delivery
using the protected build/request/record identities. Uncooperative adapter code
requires host isolation; this boundary does not forcibly terminate foreign work.

The required flow is:

1. Deliver an `attempt` record before reading source bytes.
2. Run the gate's authorized preparation/assembly and deliver `prepared` evidence
   for that exact candidate package.
3. Recheck preparation after sink delivery. Expired, revoked or newly shortened
   authority fails instead of silently substituting a different audited package.
4. Return a schema-valid prepared result with that evidence reference, or a failed
   result without package, lineage, omissions or success evidence.

`prepared` is explicitly a candidate-preparation event, **not proof that the caller
received or used a package**. Denial/no-match/budget/expiry failures get a terminal
`failed` event when the sink is available. If a terminal write fails, the failed
result preserves the original diagnostic and adds `AUDIT_REQUIRED`. Attempt or
prepared-delivery failure returns `AUDIT_REQUIRED` and no package. Cancellation
returns no success and does not retry an aborted sink. During a total sink outage,
durable failure evidence cannot be promised: the returned value-free diagnostic is
the explicit failure signal, and no successful build is delivered.

`getTime` must be consistent with the preparation gate's injected clock and
nondecreasing within a build. Handoff compares the gate's `checked_at` with the
audit clock and the original package bounds. Observed timing and sink references
remain outside package identities and reproducible artifact identities.

## Public receipts require separate approval

`createSyntheticAuditSink({ makeReference, maxRecords = 128 })` is a bounded
memory-only test sink. Its `records()` accessor is trusted-host protected evidence
access, not a public endpoint. Its reference factory and record retention are
explicit; no production database or signing service is installed.

`createSyntheticAttestor({ approvedResultIdentities, makeReference,
authorizeResolve, maxReceipts = 128 })` is a **synthetic separate authority**:

- `issue(result)` requires an exact prepared-result identity in the independently
  supplied publication-approval allowlist. Empty/mismatched approvals fail. The
  Builder does not create this approval, call the attestor automatically or
  self-authorize publication.
- The fresh receipt contains only `spec_version`, `kind` and a newly assigned
  opaque `attestation_reference`. It contains no build/correlation/source IDs,
  hashes, package identity, classification, diagnostics or evidence reference.
- `verify(receipt)` accepts only the closed receipt schema and references issued
  by this synthetic registry. Schema validity alone is insufficient. This is a
  local verification demonstration, not cryptographic signature verification.
- `resolve(receipt, { callerId })` requires separate exact-true resolver access
  approval before returning the protected result identity/evidence reference.
  Resolver failures expose no raw exception or body.

Factories must issue independent, non-derivable references; deterministic counters
in tests are synthetic only. References cannot be copied from protected results or
reused. Real public issuance needs reviewed authority, unpredictable opaque IDs,
retention/revocation, signer/resolver trust and publication policy. There is no
production attestation fallback or automatic declassification in this task.

## Link to later use without granting it

The audit and prepared result bind the exact package instance/manifest identity,
target prompt, purpose identity, build/correlation IDs and preparation evidence.
An independent reviewer must supply the unchanged Context Package use authorization
for that instance, purpose and permitted sections. The released SDK validates it
at use time and carries its existing package identity/execution provenance forward.
The audit reference and public receipt are **not substitutes** for this grant.
No released execution provenance fields or meanings change. Tests demonstrate that
the resulting package binds with the independent fixture grant and fails without it.

## Verification and regeneration

Run `node --test tests/context-builder/audit.test.js`, `npm test` and
`node scripts/check-sdk-release.mjs`. The result/receipt validators are generated
from reviewed Codex candidate `291453e2a957fb83dedb0c209ed2cdd14ba90c0e`, checking
Builder schema SHA-256 `4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3`
and published Context Package schema SHA-256
`d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617`:

```sh
node scripts/generate-builder-audit-validator.mjs /absolute/context-builder.schema.json /absolute/context-package.schema.json
```

Synthetic tests cover protected success/failure linkage, public closed projections,
required delivery failures, timeout/cancellation, exact acknowledgments, final
revocation/expiry/narrowing, input mutation, independent publication approval and
resolver denial. No real private content or production signing is used. See
[ADR 0014](adr/0014-builder-audit-attestation.md); SDK/CLI integration and immutable
publication remain later tasks.
