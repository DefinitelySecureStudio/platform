import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assembleSelection } from '../../src/context-builder/assembly.js';
import { selectNormalizedSources } from '../../src/context-builder/selection.js';
import { identity, digest } from '../../src/context-builder/request.js';
import { canonicalJson, validateContextDocument, validateContextBinding } from '../../src/prompt-sdk/index.js';
import { createPreparationGate, createSyntheticPreparationVerifier, createMemorySourceBinding, createApprovedExportBinding } from '../../src/context-builder/index.js';
const fixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json', import.meta.url)));
const lexical = JSON.parse(await readFile(new URL('../fixtures/context-builder-lexical-v1.json', import.meta.url)));
const copy = x => structuredClone(x);
function run(s = copy(fixture), mutate = () => {}, bounds = s.preparation_bounds) {
  const c = { request: s.request, requestIdentity: identity(s.request) };
  s.normalized.forEach((d, i) => { d.request_identity = c.requestIdentity; d.source = copy(s.request.sources[i]); });
  const selection = selectNormalizedSources(c, s.normalized); mutate(selection);
  return assembleSelection(c, selection, bounds);
}
function error(code) { return e => { assert.equal(e.diagnostic.code, code); assert.doesNotMatch(JSON.stringify(e), /urn:uuid|sha256|synthetic/); return true; }; }
function harness(s = copy(fixture), changeDecision = x => x) {
  let checks = 0, reads = 0;
  const owner = 'urn:uuid:00000000-0000-4000-8000-000000000080';
  const synthetic = createSyntheticPreparationVerifier([{ decision_id: owner, decision: 'allow', owner_id: owner,
    preparation_reference: s.request.preparation_reference, request_identity: identity(s.request), caller_id: s.request.caller_id,
    target: s.request.target, purpose: s.request.purpose, max_classification: s.request.max_classification,
    not_before: '2026-09-15T00:00:00Z', review_after: s.request.review_after, expires_at: s.request.expires_at }]);
  const sourceBindings = s.request.sources.map((source, i) => {
    const bytes = Buffer.from(s.raw_sources[i].text), artifact = { media_type: source.media_type, byte_size: bytes.length, sha256: digest(bytes) };
    const b = source.kind === 'approved-private'
      ? createApprovedExportBinding({ source, artifact, readExport: async () => (async function* () { yield bytes; })() })
      : createMemorySourceBinding({ source, artifact, bytes });
    return { ...b, read: o => { reads++; return b.read(o); } };
  });
  const verifier = { ...synthetic.verifier, async verify(x) { return changeDecision(await synthetic.verifier.verify(x), ++checks); } };
  return { gate: createPreparationGate({ mode: 'synthetic', verifier, decisionOwners: [owner], sourceBindings, getTime: () => s.request.evaluation_time }),
    input: { request: s.request, prompt: s.prompt, callerId: s.request.caller_id }, reads: () => reads };
}

for (const [name, fixtureValue] of [['explicit', fixture], ['lexical', lexical]]) test(`${name} assembly matches Codex golden package and lineage exactly`, async () => {
  const s = copy(fixtureValue), result = run(s);
  for (const field of ['package', 'lineage', 'omissions']) assert.deepEqual(result[field], s.result[field]);
  assert.equal(validateContextDocument(result.package).valid, true);
  assert.equal(validateContextBinding(s.prompt, result.package, s.authorization, { at: s.request.evaluation_time }).valid, true);
  const h = harness(s), actual = await h.gate.assemblePackage(h.input);
  assert.deepEqual(actual.package, result.package); assert.deepEqual(await h.gate.assemblePackage(h.input), actual);
  assert.ok(Object.isFrozen(actual.package.manifest.sections[0])); assert.equal(actual.authorization, undefined);
});

for (const field of ['slot', 'total']) test(`required ${field} exact budget fits and one byte less fails`, () => {
  const s = copy(fixture);
  if (field === 'slot') s.request.slots[0].max_bytes = 24; else s.request.limits.total_content_bytes = 57;
  assert.equal(run(s).package.manifest.total_content_bytes, 57);
  if (field === 'slot') s.request.slots[0].max_bytes--; else s.request.limits.total_content_bytes--;
  assert.throws(() => run(s), e => error('BUDGET_EXCEEDED')(e) && e.diagnostic.stage === 'assembly');
});

test('multibyte text counts UTF-8 bytes without truncating characters', () => {
  const s = copy(lexical), c = s.normalized[0].candidates[0];
  c.content = 'note é🙂'; c.byte_size = Buffer.byteLength(c.content); c.sha256 = digest(c.content);
  s.request.slots[0].max_bytes = c.byte_size;
  assert.equal(run(s).package.manifest.sections[0].content, c.content);
  s.request.slots[0].max_bytes--; assert.throws(() => run(s), error('BUDGET_EXCEEDED'));
});

test('JSON canonical bytes, not input key order or character counts, determine budget', () => {
  for (const content of [{ z: 'é🙂', a: 1 }, null, false, [], {}]) {
    const s = copy(fixture), c = s.normalized[1].candidates[0]; c.content = content;
    c.byte_size = Buffer.byteLength(canonicalJson(content)); c.sha256 = digest(canonicalJson(content));
    s.request.slots[1].max_bytes = c.byte_size;
    assert.deepEqual(run(s).package.manifest.sections[1].content, content);
    s.request.slots[1].max_bytes--; assert.throws(() => run(s), error('BUDGET_EXCEEDED'));
  }
});

test('text joins count LF and deduplicate only source links, retaining candidate lineage', () => {
  const s = copy(fixture), d = s.normalized[0], c = copy(d.candidates[0]);
  c.candidate_id = 'urn:uuid:00000000-0000-4000-8000-000000000052';
  d.candidates.push(c); s.request.sources[0].fragments.push({ candidate_id: c.candidate_id, fragment: c.fragment });
  s.request.slots[0].selection.candidates.push({ source_id: d.source.source_id, candidate_id: c.candidate_id });
  s.request.slots[0].max_bytes = 49;
  const result = run(s), section = result.package.manifest.sections[0];
  assert.equal(section.byte_size, 49); assert.equal(section.content, `${c.content}\n${c.content}`);
  assert.equal(section.source_ids.length, 1); assert.equal(result.lineage[0].candidates.length, 2);
  s.request.slots[0].max_bytes = 48; assert.throws(() => run(s), error('BUDGET_EXCEEDED'));
});

for (const field of ['slot', 'total']) test(`optional ${field} overflow omits whole slot and noncontributing source`, () => {
  const s = copy(fixture); s.request.slots[1].required = false;
  if (field === 'slot') s.request.slots[1].max_bytes = 32; else s.request.limits.total_content_bytes = 24;
  const result = run(s);
  assert.equal(result.package.manifest.sections.length, 1); assert.equal(result.package.manifest.sources.length, 1);
  assert.equal(result.package.manifest.classification, 'public'); assert.equal(result.lineage.length, 1);
  assert.deepEqual(result.omissions.map(x => x.code), ['OPTIONAL_BUDGET', 'OPTIONAL_EMPTY']);
});

test('required slots reserve capacity ahead of earlier optional slots', () => {
  const s = copy(fixture); s.request.slots[0].required = false; s.request.limits.total_content_bytes = 33;
  const r = run(s); assert.deepEqual(r.package.manifest.sections.map(x => x.slot), ['context_facts']);
  assert.equal(r.omissions[0].code, 'OPTIONAL_BUDGET');
});

test('optional slots compete in declaration order, sections remain declaration ordered', () => {
  const s = copy(fixture); s.request.slots.forEach(x => { x.required = false; }); s.request.limits.total_content_bytes = 33;
  assert.deepEqual(run(s).package.manifest.sections.map(x => x.slot), ['approved_notes']);
  s.request.limits.total_content_bytes = 57;
  assert.deepEqual(run(s).package.manifest.sections.map(x => x.slot), ['approved_notes', 'context_facts']);
});

test('all omitted cannot produce an empty Context Package', () => {
  const s = copy(fixture); s.request.slots.forEach(x => { x.required = false; }); s.request.limits.total_content_bytes = 1;
  assert.throws(() => run(s), error('REQUIRED_CONTEXT_MISSING'));
});

test('zero capacity and unsupported token estimates fail request validation before reads', async () => {
  for (const mutate of [s => { s.request.limits.total_content_bytes = 0; }, s => { s.request.slots[0].max_bytes = 0; },
    s => { s.request.limits.max_tokens = 100; }]) {
    const s = copy(fixture); mutate(s); const h = harness(s);
    await assert.rejects(() => h.gate.assemblePackage(h.input), error('INVALID_REQUEST')); assert.equal(h.reads(), 0);
  }
});

test('preparation and even omitted source limits narrow lifetime; review caps at expiry', () => {
  const s = copy(fixture); s.request.slots[1].required = false; s.request.slots[1].max_bytes = 1;
  s.request.sources[1].expires_at = '2026-09-15T18:00:00Z';
  const r = run(s, undefined, { review_after: '2026-09-15T20:00:00Z', expires_at: '2026-09-15T19:00:00Z' });
  assert.equal(r.package.manifest.expires_at, '2026-09-15T18:00:00Z');
  assert.equal(r.package.manifest.review_after, '2026-09-15T18:00:00Z');
  assert.throws(() => run(copy(fixture), undefined, { review_after: fixture.request.evaluation_time, expires_at: fixture.request.expires_at }), error('STALE_AUTHORITY'));
});

test('final authority narrowing changes manifest identity and revocation prevents delivery', async () => {
  const h = harness(copy(fixture), (d, n) => n === 4 ? { ...d, review_after: '2026-09-15T18:00:00Z' } : d);
  const result = await h.gate.assemblePackage(h.input);
  assert.equal(result.package.manifest.review_after, '2026-09-15T18:00:00Z');
  assert.deepEqual(result.package.manifest_identity, identity(result.package.manifest));
  assert.notDeepEqual(result.package.manifest_identity, fixture.result.package.manifest_identity);
  const denied = harness(copy(fixture), (d, n) => n === 4 ? { ...d, decision: 'deny' } : d);
  await assert.rejects(() => denied.gate.assemblePackage(denied.input), error('PREPARATION_DENIED'));
});

test('private source artifact/handle omitted and classification/provenance never downgraded', () => {
  const r = run(); assert.equal(r.package.manifest.classification, 'internal');
  const source = r.package.manifest.sources[1]; assert.equal(source.artifact, undefined); assert.equal(source.reference, undefined);
  assert.equal(source.evidence_reference, fixture.request.sources[1].evidence_reference);
  assert.equal(r.package.manifest.authority_reference, fixture.request.preparation_reference);
});

test('overflow arithmetic is rejected before constructing joined content', () => {
  const s = copy(fixture), c = { request: s.request, requestIdentity: identity(s.request) };
  const selection = copy(selectNormalizedSources(c, s.normalized));
  const entry = selection.slots[0].candidates[0]; entry.candidate.byte_size = Number.MAX_SAFE_INTEGER;
  selection.slots[0].candidates.push(copy(entry));
  assert.throws(() => assembleSelection(c, selection, s.preparation_bounds), error('BUDGET_EXCEEDED'));
});

test('source enumeration does not change package bytes; cancellation delivers nothing', async () => {
  const s = copy(fixture), c = { request: s.request, requestIdentity: identity(s.request) };
  const result = assembleSelection(c, selectNormalizedSources(c, [...s.normalized].reverse()), s.preparation_bounds);
  assert.deepEqual(result, run());
  const h = harness(); const signal = AbortSignal.abort();
  await assert.rejects(() => h.gate.assemblePackage({ ...h.input, signal }), error('CANCELLED')); assert.equal(h.reads(), 0);
  assert.equal(validateContextBinding(s.prompt, result.package, undefined, { at: s.request.evaluation_time }).valid, false);
});
