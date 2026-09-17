import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPreparationGate, createMemorySourceBinding, createApprovedExportBinding,
  createAuditedContextBuilder, createSyntheticAuditSink, createSyntheticAttestor } from '../../src/context-builder/index.js';
import { digest, identity } from '../../src/context-builder/request.js';
import { validateResult, validateReceipt } from '../../src/context-builder/generated/audit-v1.js';
import { validateContextBinding } from '../../src/prompt-sdk/index.js';
const fixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json', import.meta.url)));
const id = n => `urn:uuid:00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function references(start = 900) { let n = start; return () => id(n++); }
function harness({ scenario = structuredClone(fixture), sink, timeoutMs = 100 } = {}) {
  const state = { at: scenario.request.evaluation_time, revoked: false, reads: 0, review: scenario.request.review_after };
  const bindings = scenario.request.sources.map((source, i) => {
    const bytes = Buffer.from(scenario.raw_sources[i].text), artifact = { byte_size: bytes.length, sha256: digest(bytes), media_type: source.media_type };
    const b = source.kind === 'approved-private'
      ? createApprovedExportBinding({ source, artifact, readExport: async () => (async function* () { yield bytes; })() })
      : createMemorySourceBinding({ source, artifact, bytes });
    return { ...b, read: o => { state.reads++; return b.read(o); } };
  });
  const verifier = { mode: 'synthetic', id: 'studio.synthetic.audit', async verify(x) {
    return { authority_mode: 'synthetic', verifier_id: verifier.id, decision_id: id(80), decision: 'allow', owner_id: id(80),
      preparation_reference: x.request.preparation_reference, request_identity: x.requestIdentity, caller_id: x.callerId,
      target: x.request.target, purpose: x.request.purpose, max_classification: x.request.max_classification,
      not_before: '2026-09-15T00:00:00Z', review_after: state.review, expires_at: x.request.expires_at,
      revocation: { status: state.revoked ? 'revoked' : 'active', checked_at: x.at } };
  } };
  const gate = createPreparationGate({ mode: 'synthetic', verifier, decisionOwners: [id(80)], sourceBindings: bindings, getTime: () => state.at });
  sink ??= createSyntheticAuditSink({ makeReference: references() });
  const builder = createAuditedContextBuilder({ gate, mode: 'synthetic', sink, timeoutMs, getTime: () => state.at });
  return { gate, builder, sink, state, input: { request: scenario.request, prompt: scenario.prompt, callerId: scenario.request.caller_id } };
}
function failed(result, code) {
  assert.equal(validateResult(result), true); assert.equal(result.status, 'failed');
  assert.ok(result.diagnostics.some(d => d.code === code));
  for (const key of ['package', 'lineage', 'omissions', 'evidence_reference']) assert.equal(result[key], undefined);
  assert.doesNotMatch(JSON.stringify(result.diagnostics), /urn:uuid|sha256|SECRET|synthetic/);
}

test('audited success binds exact golden package and protected body-free operational evidence', async () => {
  const h = harness(), result = await h.builder.build(h.input);
  assert.equal(validateResult(result), true); assert.deepEqual(result.package, fixture.result.package);
  assert.equal(result.build_id, fixture.request.build_id); assert.equal(result.correlation_id, fixture.request.correlation_id);
  const records = h.sink.records(); assert.deepEqual(records.map(x => x.record.phase), ['attempt', 'prepared']);
  assert.equal(result.evidence_reference, records[1].evidence_reference);
  const e = records[1].record;
  assert.deepEqual(e.package_identity, result.package.manifest_identity); assert.deepEqual(e.lineage, result.lineage);
  assert.equal(e.total_content_bytes, 57); assert.deepEqual(e.budgets.limits, fixture.request.limits);
  assert.deepEqual(e.builder, fixture.request.builder); assert.deepEqual(e.policy, fixture.request.policy);
  assert.deepEqual(e.target, fixture.request.target); assert.deepEqual(e.request_identity, identity(fixture.request));
  const serialized = JSON.stringify(records);
  for (const s of fixture.raw_sources) assert.ok(!serialized.includes(s.text));
  assert.ok(!serialized.includes(fixture.request.sources[1].reference.handle));
  assert.ok(!serialized.includes(fixture.request.purpose));
  assert.equal(validateContextBinding(fixture.prompt, result.package, fixture.authorization, { at: h.state.at }).valid, true);
  assert.equal(validateContextBinding(fixture.prompt, result.package, undefined, { at: h.state.at }).valid, false);
});

for (const [name, mutate, code] of [
  ['denial', h => { h.state.revoked = true; }, 'PREPARATION_DENIED'],
  ['no-match', h => { h.input.request.slots[0].selection.candidates = []; }, 'REQUIRED_CONTEXT_MISSING'],
  ['budget', h => { h.input.request.slots[0].max_bytes = 1; }, 'BUDGET_EXCEEDED'],
  ['expiry', h => { h.state.at = h.input.request.review_after; }, 'STALE_AUTHORITY']
]) test(`${name} is traceable without result bodies or diagnostic leakage`, async () => {
  const h = harness(); mutate(h); const result = await h.builder.build(h.input); failed(result, code);
  assert.deepEqual(h.sink.records().map(x => x.record.phase), ['attempt', 'failed']);
  assert.equal(h.sink.records()[1].record.diagnostics[0].code, code);
});

test('invalid requests fail before any audit or source access', async () => {
  const h = harness(); h.input.request.unrecognized = 'SECRET';
  await assert.rejects(() => h.builder.build(h.input), e => e.diagnostic.code === 'INVALID_REQUEST');
  assert.equal(h.state.reads, 0); assert.equal(h.sink.records().length, 0);
});

test('optional budget omissions remain explicit successful evidence', async () => {
  const scenario = structuredClone(fixture); scenario.prompt.context_slots[1].required = false;
  scenario.request.target.identity = identity(scenario.prompt); scenario.request.slots[1].required = false;
  scenario.request.slots[1].max_bytes = 1;
  const h = harness({ scenario }), result = await h.builder.build(h.input);
  assert.equal(result.status, 'prepared'); assert.equal(result.omissions[0].code, 'OPTIONAL_BUDGET');
  assert.deepEqual(h.sink.records()[1].record.omissions, result.omissions);
});

test('required attempt sink failure stops reads and masks raw exception', async () => {
  const h = harness({ sink: { mode: 'synthetic', deliver() { throw Error('SECRET credential'); } } });
  failed(await h.builder.build(h.input), 'AUDIT_REQUIRED'); assert.equal(h.state.reads, 0);
});

test('prepared sink failure cannot return a package; attempt remains traceable', async () => {
  const sink = createSyntheticAuditSink({ makeReference: references(), maxRecords: 1 });
  const h = harness({ sink }); failed(await h.builder.build(h.input), 'AUDIT_REQUIRED');
  assert.equal(sink.records().length, 1); assert.equal(h.state.reads, 2);
});

test('sink timeout is bounded and cooperative signal is aborted', async () => {
  let signal;
  const h = harness({ timeoutMs: 5, sink: { mode: 'synthetic', deliver(_, options) { signal = options.signal; return new Promise(() => {}); } } });
  failed(await h.builder.build(h.input), 'AUDIT_REQUIRED'); assert.equal(signal.aborted, true); assert.equal(h.state.reads, 0);
});

test('ack identity mismatch and reused private IDs fail closed', async () => {
  for (const ack of [r => ({ evidence_reference: id(900), record_identity: identity({}) }),
    r => ({ evidence_reference: r.build_id, record_identity: identity(r) })]) {
    const h = harness({ sink: { mode: 'synthetic', deliver: ack } }); failed(await h.builder.build(h.input), 'AUDIT_REQUIRED');
  }
});

for (const change of ['revoke', 'narrow', 'expire']) test(`${change} while auditing blocks exact-instance handoff`, async () => {
  const sink = createSyntheticAuditSink({ makeReference: references() }); let h;
  const wrapped = { mode: 'synthetic', async deliver(record, options) {
    const ack = await sink.deliver(record, options);
    if (record.phase === 'prepared') {
      if (change === 'revoke') h.state.revoked = true;
      if (change === 'narrow') h.state.review = '2026-09-15T18:00:00Z';
      if (change === 'expire') h.state.at = fixture.request.review_after;
    }
    return ack;
  } };
  h = harness({ sink: wrapped }); failed(await h.builder.build(h.input), change === 'revoke' ? 'PREPARATION_DENIED' : 'STALE_AUTHORITY');
  assert.deepEqual(sink.records().map(x => x.record.phase), ['attempt', 'prepared', 'failed']);
});

test('cancellation never returns success or ignores an aborted sink delivery', async () => {
  const h = harness(); failed(await h.builder.build({ ...h.input, signal: AbortSignal.abort() }), 'CANCELLED');
  assert.equal(h.state.reads, 0);
});

test('production wrapper rejects synthetic gate/sink configuration', () => {
  const h = harness(); assert.throws(() => createAuditedContextBuilder({ gate: h.gate, mode: 'production',
    sink: h.sink, getTime: () => h.state.at }), e => e.diagnostic.code === 'AUTHORITY_UNVERIFIABLE');
  assert.throws(() => createAuditedContextBuilder({ gate: { ...h.gate, authority_mode: 'production' }, mode: 'production',
    sink: { ...h.sink, mode: 'production' }, getTime: () => h.state.at }), e => e.diagnostic.code === 'AUTHORITY_UNVERIFIABLE');
});

test('public attestation needs exact independent approval and exposes only an opaque reference', async () => {
  const h = harness(), result = await h.builder.build(h.input);
  const denied = createSyntheticAttestor({ approvedResultIdentities: [], makeReference: references(990), authorizeResolve: () => true });
  assert.throws(() => denied.issue(result), e => e.diagnostic.code === 'PREPARATION_DENIED');
  const attestor = createSyntheticAttestor({ approvedResultIdentities: [identity(result)], makeReference: references(990),
    authorizeResolve: ({ callerId }) => callerId === 'approved-synthetic-reviewer' });
  const receipt = attestor.issue(result);
  assert.equal(validateReceipt(receipt), true); assert.equal(attestor.verify(receipt), true);
  assert.deepEqual(Object.keys(receipt).sort(), ['attestation_reference', 'kind', 'spec_version']);
  const json = JSON.stringify(receipt); assert.doesNotMatch(json, /sha256|SECRET|Synthetic|internal|path|commit|classification/);
  for (const value of [result.build_id, result.correlation_id, result.evidence_reference, result.package.manifest_identity.sha256]) assert.ok(!json.includes(value));
  for (const field of ['package', 'source_id', 'diagnostics', 'fingerprint', 'credential']) {
    const invalid = { ...receipt, [field]: 'SECRET' }; assert.equal(attestor.verify(invalid), false);
  }
  assert.equal(attestor.verify({ ...receipt, attestation_reference: id(999) }), false);
  await assert.rejects(() => attestor.resolve(receipt, { callerId: 'unapproved' }), e => e.diagnostic.code === 'PREPARATION_DENIED');
  const resolved = await attestor.resolve(receipt, { callerId: 'approved-synthetic-reviewer' });
  assert.deepEqual(resolved.result_identity, identity(result)); assert.equal(resolved.evidence_reference, result.evidence_reference);
  const altered = structuredClone(result); altered.evidence_reference = id(999);
  assert.throws(() => attestor.issue(altered), e => e.diagnostic.code === 'PREPARATION_DENIED');
});

test('attestation references cannot be copied from protected records or reused', async () => {
  const h = harness(), result = await h.builder.build(h.input);
  const make = ref => createSyntheticAttestor({ approvedResultIdentities: [identity(result)], makeReference: () => ref, authorizeResolve: () => false });
  assert.throws(() => make(result.build_id).issue(result), e => e.diagnostic.code === 'AUDIT_REQUIRED');
  const a = make(id(990)); a.issue(result); assert.throws(() => a.issue(result), e => e.diagnostic.code === 'AUDIT_REQUIRED');
});

test('terminal sink failure preserves the original denial with an additional audit diagnostic', async () => {
  const sink = createSyntheticAuditSink({ makeReference: references(), maxRecords: 1 });
  const h = harness({ sink }); h.state.revoked = true;
  const r = await h.builder.build(h.input); failed(r, 'PREPARATION_DENIED'); failed(r, 'AUDIT_REQUIRED');
});

test('reusing an acknowledgment reference across stages cannot produce success', async () => {
  const h = harness({ sink: { mode: 'synthetic', deliver: record => ({ evidence_reference: id(990), record_identity: identity(record) }) } });
  failed(await h.builder.build(h.input), 'AUDIT_REQUIRED');
});

test('mutating caller input while audit is pending cannot replace the approved request', async () => {
  const sink = createSyntheticAuditSink({ makeReference: references() }); let h;
  h = harness({ sink: { mode: 'synthetic', async deliver(record, options) {
    if (record.phase === 'attempt') h.input.request.purpose = 'SECRET replacement';
    return sink.deliver(record, options);
  } } });
  const result = await h.builder.build(h.input);
  assert.equal(result.status, 'prepared'); assert.equal(result.package.manifest.purpose, fixture.request.purpose);
});

test('audit clock cannot lag the gate handoff clock', async () => {
  const h = harness(); h.state.at = '2026-09-15T13:00:00Z';
  const builder = createAuditedContextBuilder({ gate: h.gate, mode: 'synthetic', sink: h.sink,
    getTime: () => fixture.request.evaluation_time });
  failed(await builder.build(h.input), 'STALE_AUTHORITY');
});

test('unverifiable initial clock binds failure to the valid request without fabricated timing', async () => {
  const h = harness();
  const builder = createAuditedContextBuilder({ gate: h.gate, mode: 'synthetic', sink: h.sink, getTime() { throw Error('SECRET clock'); } });
  const result = await builder.build(h.input); failed(result, 'AUTHORITY_UNVERIFIABLE'); failed(result, 'AUDIT_REQUIRED');
  assert.equal(h.sink.records().length, 0); assert.equal(h.state.reads, 0);
});
