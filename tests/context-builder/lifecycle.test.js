import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canonicalJson } from '../../src/prompt-sdk/index.js';
import { createPreparationGate, createMemorySourceBinding, createApprovedExportBinding, createMemoryArtifactStore, comparePreparedArtifacts } from '../../src/context-builder/index.js';
import { digest, identity } from '../../src/context-builder/request.js';
const fixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-lexical-v1.json', import.meta.url)));
const owner = 'urn:uuid:00000000-0000-4000-8000-000000000080';
const clone = x => structuredClone(x);
const at = fixture.request.evaluation_time;
const later = '2026-09-15T13:00:00Z';
function memory(options = {}) { return createMemoryArtifactStore({ authorizeAccess: () => true, retentionSeconds: 86400 * 3, ...options }); }
function harness({ cache, scenario = clone(fixture), verifierId = 'studio.synthetic.lifecycle', artifactBytes } = {}) {
  const state = { reads: 0, checks: 0, now: at, revoked: false, review: scenario.request.review_after };
  const bytes = artifactBytes ?? Buffer.from(scenario.raw_sources[0].text);
  const source = scenario.request.sources[0];
  const artifact = { media_type: source.media_type, byte_size: bytes.length, sha256: digest(bytes) };
  const binding = source.kind === 'approved-private'
    ? createApprovedExportBinding({ source, artifact, readExport: async () => (async function* () { yield bytes; })() })
    : createMemorySourceBinding({ source, bytes, artifact });
  const verifier = { id: verifierId, mode: 'synthetic', async verify(x) {
    state.checks++;
    return { authority_mode: 'synthetic', verifier_id: verifierId, decision_id: owner, decision: 'allow', owner_id: owner,
      preparation_reference: x.request.preparation_reference, request_identity: x.requestIdentity, caller_id: x.callerId,
      target: x.request.target, purpose: x.request.purpose, max_classification: x.request.max_classification,
      not_before: '2026-09-15T00:00:00Z', review_after: state.review, expires_at: x.request.expires_at,
      revocation: { status: state.revoked ? 'revoked' : 'active', checked_at: x.at } };
  } };
  const gate = createPreparationGate({ mode: 'synthetic', verifier, decisionOwners: [owner], cache,
    sourceBindings: [{ ...binding, read: x => { state.reads++; return binding.read(x); } }], getTime: () => state.now });
  return { gate, state, input: { request: scenario.request, prompt: scenario.prompt, callerId: scenario.request.caller_id } };
}
const rejects = (fn, code) => assert.rejects(fn, e => { assert.equal(e.diagnostic.code, code); assert.doesNotMatch(JSON.stringify(e), /urn:uuid|sha256|Synthetic/); return true; });

test('default builds retain no shared cache; deterministic replay preserves immutable serialization', async () => {
  const h = harness(), first = await h.gate.prepareArtifact(h.input), replay = await h.gate.replay(h.input);
  assert.equal(h.state.reads, 2); assert.equal(first.serialized, canonicalJson(first.artifact));
  assert.deepEqual(first.artifact_identity, identity(first.artifact));
  assert.deepEqual(comparePreparedArtifacts(first, replay), { identical: true, same_inputs: true, same_request: true, same_package: true });
  assert.ok(Object.isFrozen(first.artifact.prepared.package));
  assert.ok(Object.isFrozen(first.artifact.input_identity));
});

test('cache hit avoids source access but reauthorizes and reproduces artifact identity', async () => {
  const h = harness({ cache: memory() }); const first = await h.gate.prepareArtifact(h.input), checks = h.state.checks;
  const second = await h.gate.prepareArtifact(h.input);
  assert.equal(h.state.reads, 1); assert.ok(h.state.checks > checks); assert.equal(comparePreparedArtifacts(first, second).identical, true);
  await h.gate.replay(h.input); assert.equal(h.state.reads, 2);
});

test('revocation prevents cache/history access and replay source reads', async () => {
  const store = memory(); let gets = 0;
  const cache = { ...store, get: x => { gets++; return store.get(x); } };
  const h = harness({ cache }); await h.gate.prepareArtifact(h.input); h.state.revoked = true; const before = gets;
  await rejects(() => h.gate.prepareArtifact(h.input), 'PREPARATION_DENIED');
  await rejects(() => h.gate.replay(h.input), 'PREPARATION_DENIED'); assert.equal(gets, before); assert.equal(h.state.reads, 1);
});

for (const [name, change] of Object.entries({
  caller: s => { s.request.caller_id = owner; }, purpose: s => { s.request.purpose += ' changed'; },
  classification: s => { s.request.max_classification = 'public'; }, budget: s => { s.request.slots[0].max_bytes--; },
  builder: s => { s.request.builder.version = '1.0.1'; }, query: s => { s.request.slots[0].selection.query = 'note'; },
  target: s => { s.prompt.description += ' changed'; s.request.target.identity = identity(s.prompt); },
  source: s => { s.request.sources[0].version = owner; }
})) test(`cache does not cross ${name} boundary and replay differences are traceable`, async () => {
  const cache = memory(), a = harness({ cache }), first = await a.gate.prepareArtifact(a.input);
  const s = clone(fixture); change(s); const b = harness({ cache, scenario: s }), next = await b.gate.prepareArtifact(b.input);
  assert.equal(b.state.reads, 1); assert.equal(comparePreparedArtifacts(first, next).same_inputs, false);
});

test('trust configuration separates cache namespaces', async () => {
  const cache = memory(), a = harness({ cache }); await a.gate.prepareArtifact(a.input);
  const b = harness({ cache, verifierId: 'studio.synthetic.other' }); await b.gate.prepareArtifact(b.input); assert.equal(b.state.reads, 1);
});

test('expiry fails before cache lookup and historical retention cannot renew authority', async () => {
  const cache = memory(), h = harness({ cache }); await h.gate.prepareArtifact(h.input);
  h.state.now = h.input.request.review_after;
  await rejects(() => h.gate.prepareArtifact(h.input), 'STALE_AUTHORITY'); assert.equal(h.state.reads, 1);
});

test('revocation while cache read is pending prevents delivery', async () => {
  const store = memory(); let h;
  const cache = { ...store, async get(x) { const v = await store.get(x); if (v) h.state.revoked = true; return v; } };
  h = harness({ cache }); await h.gate.prepareArtifact(h.input);
  await rejects(() => h.gate.prepareArtifact(h.input), 'PREPARATION_DENIED'); assert.equal(h.state.reads, 1);
});

test('stored bytes and scope are verified, adapter errors are sanitized without fallback', async () => {
  for (const mutate of [x => { x.scope = identity({}); }, x => { x.sources[0].base64 = Buffer.from('tampered').toString('base64'); }]) {
    const store = memory(), cache = { ...store, async get(x) { const s = await store.get(x); if (!s) return s; const v = JSON.parse(s); mutate(v); return canonicalJson(v); } };
    const h = harness({ cache }); await h.gate.prepareArtifact(h.input);
    await rejects(() => h.gate.prepareArtifact(h.input), 'SOURCE_INTEGRITY'); assert.equal(h.state.reads, 1);
  }
  const h = harness({ cache: { get() { throw Error('SECRET'); }, put() {} } });
  await rejects(() => h.gate.prepareArtifact(h.input), 'SOURCE_UNAVAILABLE'); assert.equal(h.state.reads, 0);
});

test('retention, reuse expiry, access checks, explicit eviction and cleanup are separate', async () => {
  let allowed = true; const calls = [], scope = identity({ caller: 'synthetic' });
  const store = memory({ retentionSeconds: 7200, authorizeAccess: x => { calls.push(x.operation); return allowed; } });
  await store.put({ scope, at, reuseUntil: later, serialized: 'protected-synthetic' });
  assert.equal(await store.get({ scope, at: later }), undefined);
  assert.equal(await store.get({ scope, at: later, history: true }), 'protected-synthetic');
  allowed = false; await rejects(() => store.get({ scope, at: later, history: true }), 'PREPARATION_DENIED');
  allowed = true; await store.cleanup({ at: '2026-09-15T14:00:00Z' });
  assert.equal(await store.get({ scope, at: '2026-09-15T14:00:00Z', history: true }), undefined);
  await store.put({ scope, at, reuseUntil: later, serialized: 'protected-synthetic' }); await store.evict({ scope, at });
  assert.equal(await store.get({ scope, at }), undefined); assert.ok(calls.includes('history') && calls.includes('cleanup'));
});

test('bounded FIFO eviction, immutable writes and no implicit lease extension', async () => {
  const store = memory({ maxEntries: 1, maxBytes: 10 }), a = identity({ a: 1 }), b = identity({ b: 1 });
  await store.put({ scope: a, at, reuseUntil: later, serialized: 'a' });
  await rejects(() => store.put({ scope: a, at, reuseUntil: later, serialized: 'b' }), 'SOURCE_INTEGRITY');
  await store.put({ scope: a, at, reuseUntil: fixture.request.expires_at, serialized: 'a' });
  assert.equal(await store.get({ scope: a, at: later }), undefined);
  await store.put({ scope: b, at, reuseUntil: later, serialized: 'b' }); assert.equal(await store.get({ scope: a, at }), undefined);
  await rejects(() => store.put({ scope: a, at, reuseUntil: later, serialized: 'too long content' }), 'BUDGET_EXCEEDED');
});

test('comparison rejects forged claimed identities', async () => {
  const h = harness(), a = await h.gate.prepareArtifact(h.input), b = clone(a); b.artifact.prepared.package.manifest.purpose = 'altered';
  assert.throws(() => comparePreparedArtifacts(a, b), e => e.diagnostic.code === 'SOURCE_INTEGRITY');
});

test('a cache adapter ignoring reuse expiry cannot renew a shorter historical grant', async () => {
  const store = memory(), cache = { ...store, get: x => store.get({ ...x, history: true }) };
  const h = harness({ cache }); h.state.review = later; await h.gate.prepareArtifact(h.input);
  h.state.review = fixture.request.review_after; h.state.now = later;
  await rejects(() => h.gate.prepareArtifact(h.input), 'STALE_AUTHORITY'); assert.equal(h.state.reads, 1);
});

test('shorter authority on a hit narrows output but does not mutate historical artifact', async () => {
  const h = harness({ cache: memory() }), first = await h.gate.prepareArtifact(h.input);
  h.state.review = later; const second = await h.gate.prepareArtifact(h.input);
  assert.equal(second.artifact.prepared.package.manifest.review_after, later);
  assert.equal(first.artifact.prepared.package.manifest.review_after, fixture.request.review_after);
  assert.deepEqual(comparePreparedArtifacts(first, second), { identical: false, same_inputs: true, same_request: true, same_package: false });
});

test('revocation during cache persistence blocks delivery; retention is not a returned grant', async () => {
  const store = memory(); let h;
  const cache = { ...store, async put(x) { await store.put(x); h.state.revoked = true; } };
  h = harness({ cache }); await rejects(() => h.gate.prepareArtifact(h.input), 'PREPARATION_DENIED');
});

test('storage access exceptions and clock rollback are sanitized', async () => {
  const scope = identity({}), store = memory();
  await store.put({ scope, at: later, reuseUntil: fixture.request.review_after, serialized: 'synthetic' });
  await rejects(() => store.get({ scope, at }), 'STALE_AUTHORITY');
  const denied = memory({ authorizeAccess: () => { throw Error('SECRET'); } });
  await rejects(() => denied.get({ scope, at }), 'AUTHORITY_UNVERIFIABLE');
});

test('private byte tuples separate cache entries even when opaque request metadata is identical', async () => {
  const scenario = clone(fixture), source = scenario.request.sources[0];
  source.kind = 'approved-private'; source.reference = { kind: 'opaque-artifact', handle: owner }; source.classification = 'internal';
  const cache = memory(), a = harness({ cache, scenario }), first = await a.gate.prepareArtifact(a.input);
  const b = harness({ cache, scenario, artifactBytes: Buffer.from('Synthetic approved NOTE.') });
  const second = await b.gate.prepareArtifact(b.input); assert.equal(b.state.reads, 1);
  const comparison = comparePreparedArtifacts(first, second);
  assert.equal(comparison.same_request, true); assert.equal(comparison.same_inputs, false); assert.equal(comparison.same_package, false);
});
