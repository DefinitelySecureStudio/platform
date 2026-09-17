import test from 'node:test';
import assert from 'node:assert/strict';
import { createExample } from '../../examples/context-builder-handoff.mjs';
import { createContextHandoff, createSyntheticUseAuthorizationProvider } from '../../src/context-builder/index.js';
import { identity } from '../../src/context-builder/request.js';
const clone = x => structuredClone(x);
function failed(result, adapter, code) {
  assert.equal(result.status, 'failed'); if (code) assert.equal(result.diagnostics[0].code, code);
  assert.equal(adapter.calls.length, 0); assert.equal(result.executionRequest, undefined); assert.equal(result.build, undefined);
  assert.doesNotMatch(JSON.stringify(result), /urn:uuid|sha256|SECRET|Synthetic approved|authority_reference/);
}
function changeProvider(e, mutate) {
  let calls = 0;
  const p = { ...e.config.authorizationProvider, async authorize(request) {
    calls++; const result = clone(await e.config.authorizationProvider.authorize(request)); return mutate(result, calls);
  } };
  return createContextHandoff({ ...e.config, authorizationProvider: p });
}

for (const structured of [false, true]) test(`genuinely built ${structured ? 'structured' : 'text'} package reaches mock execution with exact provenance`, async () => {
  const e = await createExample({ structured });
  const r = await e.handoff.execute(e.input, { adapter: e.adapter, structuredOutput: e.structuredOutput });
  assert.equal(r.status, 'succeeded'); assert.equal(e.adapter.calls.length, 1);
  assert.deepEqual(e.sink.records().map(x => x.record.phase), ['attempt', 'prepared']);
  assert.equal(r.execution.correlation_id, e.input.buildInput.request.correlation_id);
  assert.equal(r.handoff.build_id, r.build.build_id); assert.equal(r.handoff.evidence_reference, r.build.evidence_reference);
  assert.deepEqual(r.handoff.package_identity, r.build.package.manifest_identity);
  const context = r.executionRequest.rendered_prompt.contexts.find(x => x.slot === 'approved_notes');
  assert.equal(context.package.package.instance_id, r.handoff.package.instance_id);
  assert.equal(context.package.package.manifest_sha256, r.handoff.package_identity.sha256);
  assert.equal(context.package.authorization.decision_id, r.handoff.authorization.decision_id);
  assert.equal(r.provenance.record.correlation_id, r.handoff.correlation_id);
  if (structured) assert.deepEqual(r.structured.normalized.value, { facts: ['synthetic'] });
});

test('prepare returns protected downstream references without provider execution', async () => {
  const e = await createExample(), r = await e.handoff.prepare(e.input);
  assert.equal(r.status, 'prepared'); assert.equal(e.adapter.calls.length, 0);
  assert.ok(Object.isFrozen(r.handoff)); assert.ok(Object.isFrozen(r.executionRequest));
});

for (const [name, mutate] of Object.entries({
  deny: r => { r.authorization.decision = 'deny'; },
  instance: r => { r.authorization.package.instance_id = 'urn:uuid:00000000-0000-4000-8000-000000000999'; },
  prompt: r => { r.authorization.prompt.version = '2.0.0'; },
  purpose: r => { r.authorization.purpose = 'SECRET other purpose'; },
  sections: r => { r.authorization.sections = []; },
  expiry: r => { r.authorization.expires_at = '2026-09-15T12:00:00Z'; },
  classification: r => { r.authorization.max_classification = 'unclassified'; },
  identity: r => { r.package_identity = identity({}); },
  request: r => { r.request_identity = identity({}); },
  correlation: r => { r.correlation_id = 'urn:uuid:00000000-0000-4000-8000-000000000999'; }
})) test(`unauthorized ${name} never reaches provider execution`, async () => {
  const e = await createExample(), h = changeProvider(e, r => { mutate(r); return r; });
  failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter, 'USE_AUTHORIZATION_DENIED');
});

test('missing independent approval and duplicate ambiguous approvals fail closed', async () => {
  for (const duplicate of [false, true]) {
    const e = await createExample(), authorizationProvider = createSyntheticUseAuthorizationProvider({ approvals: duplicate ? [e.approval, e.approval] : [] });
    const h = createContextHandoff({ ...e.config, authorizationProvider });
    failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter, 'USE_AUTHORIZATION_DENIED');
  }
});

test('scope is rechecked after adapter description and before invocation', async () => {
  for (const mode of ['revoke', 'replace', 'expire']) {
    const e = await createExample(); let described = false;
    const original = e.adapter.describe.bind(e.adapter);
    e.adapter.describe = async () => { described = true; if (mode === 'expire') e.state.at = e.input.buildInput.request.review_after; return original(); };
    const h = changeProvider(e, r => {
      if (described && mode === 'revoke') r.authorization.decision = 'deny';
      if (described && mode === 'replace') r.authorization.decision_id = 'urn:uuid:00000000-0000-4000-8000-000000000999';
      return r;
    });
    failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter,
      mode === 'expire' ? 'HANDOFF_STALE' : mode === 'replace' ? 'USE_AUTHORIZATION_CHANGED' : 'USE_AUTHORIZATION_DENIED');
  }
});

for (const [name, mutate] of Object.entries({
  digest: r => { r.package.manifest_identity.sha256 = 'sha256:' + '0'.repeat(64); },
  instance: r => { r.package.manifest.package.instance_id = 'urn:uuid:00000000-0000-4000-8000-000000000999'; },
  slot: r => { r.package.manifest.sections[0].slot = 'undeclared'; },
  classification: r => { r.package.manifest.sources[0].classification = 'restricted'; },
  request: r => { r.request_identity = identity({}); }
})) test(`invalid package ${name} is rejected before obtaining a use grant`, async () => {
  const e = await createExample(); let reviews = 0;
  const builder = { ...e.config.builder, async build(input) {
    const r = clone(await e.config.builder.build(input)); mutate(r);
    if (name !== 'digest') r.package.manifest_identity = identity(r.package.manifest); return r;
  } };
  const h = createContextHandoff({ ...e.config, builder, authorizationProvider: { ...e.config.authorizationProvider,
    authorize() { reviews++; throw Error('must not run'); } } });
  failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter, 'HANDOFF_INVALID'); assert.equal(reviews, 0);
});

test('review delays crossing lifetime and cancellation prevent rendering handoff', async () => {
  const e = await createExample();
  const h = changeProvider(e, r => { e.state.at = e.input.buildInput.request.review_after; return r; });
  failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter, 'HANDOFF_STALE');
  const fresh = await createExample(); fresh.input.buildInput.signal = AbortSignal.abort();
  failed(await fresh.handoff.execute(fresh.input, { adapter: fresh.adapter }), fresh.adapter, 'CANCELLED');
});

test('unresponsive or throwing use authority is bounded and sanitized', async () => {
  for (const authorize of [() => new Promise(() => {}), () => { throw Error('SECRET credential'); }]) {
    const e = await createExample(), h = createContextHandoff({ ...e.config, timeoutMs: 5,
      authorizationProvider: { ...e.config.authorizationProvider, authorize } });
    failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter, 'USE_AUTHORIZATION_UNAVAILABLE');
  }
});

test('cross-build correlation and missing structured processing options fail before execution', async () => {
  const e = await createExample(); e.input.executionOptions.correlation_id = 'different-build';
  failed(await e.handoff.execute(e.input, { adapter: e.adapter }), e.adapter, 'HANDOFF_INVALID');
  const s = await createExample({ structured: true });
  failed(await s.handoff.execute(s.input, { adapter: s.adapter }), s.adapter, 'STRUCTURED_OUTPUT_OPTIONS_REQUIRED');
});

test('adapter and JSON validation failures disclose no raw output or exceptions', async () => {
  const e = await createExample(); e.adapter.execute = async () => { throw Error('SECRET adapter'); };
  const r = await e.handoff.execute(e.input, { adapter: e.adapter }); assert.equal(r.diagnostics[0].code, 'EXECUTION_FAILED');
  assert.doesNotMatch(JSON.stringify(r), /SECRET/);
  const s = await createExample({ structured: true }); s.adapter.configuration.content = '{SECRET malformed';
  const bad = await s.handoff.execute(s.input, { adapter: s.adapter, structuredOutput: s.structuredOutput });
  assert.equal(s.adapter.calls.length, 1); assert.equal(bad.diagnostics[0].code, 'STRUCTURED_OUTPUT_INVALID');
  assert.equal(bad.execution, undefined); assert.doesNotMatch(JSON.stringify(bad), /SECRET/);
});

test('synthetic authority cannot be relabeled as production', async () => {
  const e = await createExample(); assert.throws(() => createContextHandoff({ ...e.config, mode: 'production',
    builder: { ...e.config.builder, authority_mode: 'production' }, authorizationProvider: { ...e.config.authorizationProvider, mode: 'production' } }));
});

test('a valid but insufficient classification ceiling prevents private context execution', async () => {
  const e = await createExample({ privateContext: true });
  const h = changeProvider(e, r => { r.authorization.max_classification = 'public'; return r; });
  failed(await h.execute(e.input, { adapter: e.adapter }), e.adapter, 'USE_AUTHORIZATION_DENIED');
});

test('private SDK provenance stays redacted while protected handoff retains exact package linkage', async () => {
  const e = await createExample({ privateContext: true });
  const r = await e.handoff.execute(e.input, { adapter: e.adapter }); assert.equal(r.status, 'succeeded');
  assert.equal(r.execution.output.classification, 'internal'); assert.deepEqual(r.provenance.record.contexts, []);
  assert.ok(r.provenance.record.redacted_context_count > 0);
  assert.deepEqual(r.handoff.package_identity, r.build.package.manifest_identity);
});
