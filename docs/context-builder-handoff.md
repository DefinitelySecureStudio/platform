# Context Builder → review → Prompt SDK handoff

Studio #83 provides the development-only `createContextHandoff` integration using
only public released Prompt SDK APIs. No SDK retrieval, orchestration, immutable
schema edits, new dependencies or production package export are added.

```js
const handoff = createContextHandoff({
  builder,                 // trusted createAuditedContextBuilder instance
  mode: 'synthetic',        // production requires production authority adapters
  authorizationProvider,   // independently configured package-use authority
  getTime,                 // explicit current UTC time for binding/revalidation
  executionClock,          // explicit synchronous epoch-ms clock for SDK timings
  timeoutMs: 1000          // use-authority call bound; 1–60,000 ms
});
const result = await handoff.execute({
  buildInput: { request, prompt, callerId, signal },
  inputValues,
  executionOptions         // explicit target, delegation, output and observability
}, { adapter, structuredOutput });
```

`prepare(input)` performs the same build/review/bind/render validation but returns a
protected prepared handoff and execution request without calling an adapter. It is
not a reusable grant. A downstream consumer holding it must obtain fresh use
authority before later execution; `execute` does that immediately before invocation.
Do not directly execute an old prepared request as if its historical grant were
still current. Future consumers may pass the package identity, audited evidence
reference and use decision linkage without implementing Comic Manifest/Orchestrator
epics or granting their release authority here.

## Separate authority and validation

The integration snapshots request, prompt, inputs and execution options before
awaits, calls the **audited** builder, and requires a prepared result matching the
exact request/build/correlation IDs. It validates the package with the released
schema/semantics and checks requested package/builder/purpose/preparation identities,
creation/lifetime limits and declared slots. A failed build or malformed result
never reaches rendering or execution. The builder is trusted host configuration,
not an untrusted arbitrary package supplier: source relational verification stays
inside its verified source/assembly pipeline.

The separately approved provider has `{ id, mode, authorize(request, { signal }) }`.
It receives protected build/request/package identities, exact package instance,
target prompt identity, purpose, sections, classification and audit evidence
reference—not source bodies or rendered inputs. The service must authenticate
reviewers, validate evidence and perform current revocation/access checks. It returns
exactly `{ authorization, build_id, correlation_id, request_identity, package_identity }`.
The envelope binds the unchanged Context Package use authorization to the exact
manifest, not just a reusable package id/version. Returning a caller-provided allow
boolean, unrelated grant or schema-valid mismatched identity cannot authorize use.

`validateContextBinding` and `renderPromptWithContextPackage` enforce exact instance,
prompt, purpose, sections, classification ceiling, required slots, template placement,
media types and current validity. Then `createExecutionRequest` validates explicit
execution options. Its correlation ID is bound to the build correlation ID; a
conflicting caller correlation or delegation purpose fails. Expected output kind
and media type must agree with the prompt. Execution delegation and trusted adapter
installation remain separate host responsibilities—this module grants neither.

Before the actual adapter `execute`, **after asynchronous descriptor loading**, the
provider is called again and SDK binding is revalidated at a fresh time. Revoked,
expired, shortened-invalid or changed grants prevent invocation. Even a different
valid decision requires rebuilding the rendered provenance rather than executing
under a stale decision ID. Clocks are host-injected, must be trustworthy/consistent,
and binding time cannot move backwards within a handoff.

Calls to the use authority have bounded timeout and cooperative cancellation;
timeout/exception responses fail closed without exposing raw adapter messages.
Production rejects providers in the `studio.synthetic.` namespace, including a
relabeled supplied synthetic provider. This is trust-adapter configuration, not
cryptographic approval verification or production authority onboarding.

`createSyntheticUseAuthorizationProvider({ approvals })` accepts only independently
supplied exact approval envelopes. No match or multiple matches fail. It does not
manufacture a grant from an arbitrary package, sign production approvals, retrieve
Lore, or promote Canon. The example uses an explicit fixture grant and expected
golden manifest identity; the package supplied to the SDK is genuinely built.

## Results, provenance and failure behavior

Prepared success contains `build`, immutable protected `handoff` metadata and
`executionRequest`. Executed success additionally contains `execution`, released
`provenance`, and (for JSON) `structured`. The handoff links build/correlation/request
identity, package instance/manifest identity, target, audit evidence, use-decision
ID/authority reference and execution ID. SDK context provenance carries unchanged
package/source/use-decision fields. The standard execution provenance preserves its
existing public-only identity/redaction policy; protected linkage remains separate
when SDK context identifiers are redacted. No fields are added to released schemas.

All successful results are protected: they can include package content, rendered
prompts, model output and fingerprints. They are not public receipts or safe log
payloads. For public evidence use #82's separately approved opaque attestation flow.

Failure returns only `{ status: 'failed', diagnostics: [{ stage: 'handoff', code,
action: 'review-handoff' }] }`, never partial output, raw SDK reports or exceptions.
Codes distinguish `BUILD_FAILED`, `HANDOFF_INVALID`, `HANDOFF_STALE`,
`USE_AUTHORIZATION_DENIED`, `USE_AUTHORIZATION_UNAVAILABLE`,
`USE_AUTHORIZATION_CHANGED`, `CANCELLED`, `EXECUTION_FAILED`,
`STRUCTURED_OUTPUT_OPTIONS_REQUIRED` and `STRUCTURED_OUTPUT_INVALID`.
These are local integration diagnostics, not new Codex Builder wire enums. Keep
the caller's protected request/audit correlation for investigating a build failure.

An invalid/unauthorized package fails before rendering/provider execution. A grant
that expires during adapter setup may have rendered earlier, but is never handed
to provider execution after the failed fresh check. Adapter/structured-output
failure may happen **after** provider invocation; no rollback or automatic retry
is implied. Abort propagation is cooperative and cannot undo completed side effects.
SDK descriptor adapters must themselves be bounded/trusted, as in the released SDK.

JSON execution requires explicit structured-processing options before any execution.
Successful raw output is independently processed by `processStructuredOutput` and
linked to provenance. Syntax-only and pinned-schema modes use existing contracts;
no coercion, repair, hosted schema fetch or summary is added. A schema-invalid or
malformed response returns a safe failure without raw content. Caller-specified
schema integrity and provider constraints retain the SDK's existing semantics.

The handoff uses existing bounded JSON snapshot limits (including two million
decoded string/key characters). Large inputs/results exceeding local defensive
limits fail; no silent truncation occurs. Production capacity/isolation and secure
retention remain host policies, not authorizations created by this flow.

## Offline examples and tests

Run `node examples/context-builder-handoff.mjs` for text and JSON examples. Both
read synthetic approved bytes, prepare/audit real packages, obtain independent
fixture use grants and invoke `MockTextAdapter`. Output logs only scenario/status,
never protected content or IDs. No network, credentials or paid model service.

Run `node --test tests/context-builder/handoff.test.js`, `npm test` and
`node scripts/check-sdk-release.mjs`. Tests assert exact package/build/execution
linkage and adapter non-invocation across invalid packages, foreign grants, missing
approval, expiry, cancellation and last-moment revocation. See
[ADR 0015](adr/0015-context-sdk-handoff.md). CLI and immutable release remain #84/#86.
