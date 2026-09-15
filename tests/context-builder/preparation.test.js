import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPreparationGate, createSyntheticPreparationVerifier, PreparationError } from '../../src/context-builder/index.js';
import { identity, digest } from '../../src/context-builder/request.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json', import.meta.url)));
const owner = 'urn:uuid:00000000-0000-4000-8000-000000000080';
const decisionId = 'urn:uuid:00000000-0000-4000-8000-000000000081';
const sentinel = 'SYNTHETIC-PROTECTED-PATH-token-value';
function harness(options = {}) {
  const s = structuredClone(fixture);
  const request = s.request;
  const decision = {
    decision_id: decisionId, decision: 'allow', owner_id: owner,
    preparation_reference: request.preparation_reference, request_identity: identity(request),
    caller_id: request.caller_id, target: request.target, purpose: request.purpose,
    max_classification: request.max_classification, not_before: '2026-09-15T00:00:00Z',
    review_after: request.review_after, expires_at: request.expires_at
  };
  options.mutateDecision?.(decision);
  const synthetic = createSyntheticPreparationVerifier(options.decisions ?? [decision]);
  const reads = [];
  const bindings = request.sources.map((source, i) => {
    const bytes = Buffer.from(s.raw_sources[i].text);
    return { source, artifact: { byte_size: bytes.length, sha256: digest(bytes), media_type: source.media_type },
      async read(input) {
        reads.push(i); assert.deepEqual(Object.keys(input).sort(), ['maxBytes', 'signal']);
        assert.equal(input.maxBytes, bytes.length);
        return options.read ? options.read({ i, input, bytes, synthetic }) : bytes;
      } };
  });
  const gate = createPreparationGate({ mode: options.mode ?? 'synthetic', verifier: options.verifier ?? synthetic.verifier,
    decisionOwners: [owner], sourceBindings: options.bindings ?? bindings,
    getTime: options.getTime ?? (() => fixture.request.evaluation_time) });
  return { gate, reads, synthetic, decision, input: { request, prompt: s.prompt, callerId: request.caller_id } };
}
async function rejectsSafe(operation, code) {
  await assert.rejects(operation, error => {
    assert.ok(error instanceof PreparationError); if (code) assert.equal(error.diagnostic.code, code);
    assert.deepEqual(Object.keys(error.toJSON()), ['diagnostic']);
    assert.deepEqual(Object.keys(error.diagnostic).sort(), ['action', 'code', 'stage']);
    assert.doesNotMatch(JSON.stringify(error), /SYNTHETIC-PROTECTED|sha256:|urn:uuid:|\/private\//);
    assert.equal(error.cause, undefined); return true;
  });
}

test('verified exact request reads only registered sources and returns bounded protected data', async () => {
  const h = harness(); const result = await h.gate.readSources(h.input);
  assert.deepEqual(h.reads, [0, 1]); assert.equal(result.authority_mode, 'synthetic');
  assert.deepEqual(result.sources.map(s => s.bytes.toString()), fixture.raw_sources.map(s => s.text));
  assert.deepEqual(result.preparation, fixture.preparation_bounds);
  assert.equal(result.authorization, undefined); assert.equal(result.package, undefined);
});

test('success and failure audit projections carry no source, caller or policy evidence', async () => {
  const h = harness(); const result = await h.gate.readSources(h.input);
  assert.deepEqual(result.audit, { stage: 'authorization', outcome: 'verified', authority_mode: 'synthetic' });
  const denied = harness({ mutateDecision: d => d.decision = 'deny' });
  try { await denied.gate.readSources(denied.input); assert.fail('expected rejection'); }
  catch (error) {
    assert.ok(error instanceof PreparationError);
    assert.deepEqual(error.toAudit(), { stage: 'authorization', outcome: 'failed', code: 'PREPARATION_DENIED' });
    assert.doesNotMatch(JSON.stringify(error.toAudit()), /urn:uuid:|sha256:|private|token/);
  }
});

for (const [name, mutate] of [
  ['deny', d => d.decision = 'deny'], ['malformed allow value', d => d.decision = true],
  ['wrong owner', d => d.owner_id = fixture.request.caller_id], ['unknown field', d => d.evidence = sentinel],
  ['missing owner', d => delete d.owner_id], ['caller mismatch', d => d.caller_id = owner],
  ['purpose mismatch', d => d.purpose = sentinel], ['source/request scope mismatch', d => d.request_identity.sha256 = 'sha256:' + '0'.repeat(64)],
  ['target mismatch', d => d.target = { ...d.target, version: '9.0.0' }],
  ['preparation reference mismatch', d => d.preparation_reference = owner],
  ['classification ceiling mismatch', d => d.max_classification = 'public'],
  ['not yet valid', d => d.not_before = '2026-09-15T13:00:00Z'],
  ['expired decision', d => { d.review_after = '2026-09-15T10:00:00Z'; d.expires_at = '2026-09-15T11:00:00Z'; }],
  ['review required', d => d.review_after = fixture.request.evaluation_time],
  ['invalid time', d => d.review_after = '2026-02-30T00:00:00Z']
]) test(`${name} fails before any read`, async () => {
  const h = harness({ mutateDecision: mutate }); await rejectsSafe(() => h.gate.readSources(h.input)); assert.deepEqual(h.reads, []);
});

test('missing and revoked decisions fail before read', async () => {
  const missing = harness({ decisions: [] }); await rejectsSafe(() => missing.gate.readSources(missing.input)); assert.deepEqual(missing.reads, []);
  const revoked = harness(); revoked.synthetic.revoke(decisionId);
  await rejectsSafe(() => revoked.gate.readSources(revoked.input), 'PREPARATION_DENIED'); assert.deepEqual(revoked.reads, []);
});

test('production mode cannot accept the synthetic verifier, even when its descriptor is relabeled', async () => {
  assert.throws(() => harness({ mode: 'production' }), PreparationError);
  const s = harness();
  const wrapped = { id: 'studio.reviewed.authority', mode: 'production', verify: s.synthetic.verifier.verify };
  const h = harness({ mode: 'production', verifier: wrapped });
  await rejectsSafe(() => h.gate.readSources(h.input), 'AUTHORITY_UNVERIFIABLE'); assert.deepEqual(h.reads, []);
});

for (const response of [null, 'allow', { allow: true }, { decision: 'allow' }]) test(`unverified caller allow response ${JSON.stringify(response)} is not authority`, async () => {
  const h = harness({ verifier: { id: 'studio.test.verifier', mode: 'synthetic', async verify() { return response; } } });
  await rejectsSafe(() => h.gate.readSources(h.input)); assert.deepEqual(h.reads, []);
});

for (const [name, change] of [
  ['authenticated caller differs', h => h.input.callerId = owner],
  ['purpose changed', h => h.input.request.purpose = sentinel],
  ['correlation changed', h => h.input.request.correlation_id = owner],
  ['builder changed', h => h.input.request.builder.version = '2.0.0'],
  ['resource budget expanded', h => h.input.request.limits.total_source_bytes++],
  ['source scope expanded', h => h.input.request.sources.push({ ...h.input.request.sources[1], source_id: owner })],
  ['weakened required slot', h => h.input.request.slots[0].required = false],
  ['wrong prompt identity', h => h.input.prompt.description = sentinel],
  ['downgraded source', h => h.input.request.sources[1].classification = 'public'],
  ['widened classification ceiling', h => h.input.request.max_classification = 'restricted'],
  ['changed fragment', h => h.input.request.sources[0].fragments[0].fragment.end--],
  ['policy changed', h => h.input.request.policy.audit = 'optional'],
  ['unknown request field', h => h.input.request.allow = true],
  ['dangling explicit candidate', h => h.input.request.slots[0].selection.candidates[0].candidate_id = owner],
  ['unsafe source byte budget', h => h.input.request.limits.total_source_bytes = Number.MAX_SAFE_INTEGER + 1]
]) test(`${name} cannot reuse approval or read bytes`, async () => {
  const h = harness(); change(h); await rejectsSafe(() => h.gate.readSources(h.input)); assert.deepEqual(h.reads, []);
});

for (const uri of ['../../private/secret', 'file:///private/secret', 'https://example.invalid/%2e%2e/secret', 'https://user:password@example.invalid/secret']) {
  test('caller-controlled location never reaches a reader: ' + uri.split(':')[0], async () => {
    const h = harness(); h.input.request.sources[0].reference.artifact.artifact_uri = uri;
    await rejectsSafe(() => h.gate.readSources(h.input)); assert.deepEqual(h.reads, []);
  });
}

test('source binding is independently checked even if verifier would approve downgraded metadata', async () => {
  const h = harness(); h.input.request.sources[1].classification = 'confidential';
  h.input.request.max_classification = 'restricted';
  await rejectsSafe(() => h.gate.readSources(h.input), 'PREPARATION_DENIED'); assert.deepEqual(h.reads, []);
});

test('there is no reusable check token or cross-caller authorization cache', async () => {
  const h = harness(); const check = await h.gate.check(h.input); assert.equal(check.authorized, true); assert.deepEqual(h.reads, []);
  h.synthetic.revoke(decisionId);
  await rejectsSafe(() => h.gate.readSources({ ...h.input, authorization: check }), 'PREPARATION_DENIED'); assert.deepEqual(h.reads, []);
});

test('revocation between sources blocks the next reader', async () => {
  const h = harness({ read({ bytes, synthetic }) { synthetic.revoke(decisionId); return bytes; } });
  await rejectsSafe(() => h.gate.readSources(h.input), 'PREPARATION_DENIED'); assert.deepEqual(h.reads, [0]);
});

test('revocation during the final read withholds all bytes', async () => {
  const h = harness({ read({ i, bytes, synthetic }) { if (i === 1) synthetic.revoke(decisionId); return bytes; } });
  await rejectsSafe(() => h.gate.readSources(h.input), 'PREPARATION_DENIED'); assert.deepEqual(h.reads, [0, 1]);
});

test('expiry during verifier execution fails before reader invocation', async () => {
  let calls = 0;
  const h = harness({ getTime: () => ++calls === 1 ? fixture.request.evaluation_time : fixture.request.review_after });
  await rejectsSafe(() => h.gate.readSources(h.input), 'STALE_AUTHORITY'); assert.deepEqual(h.reads, []);
});

test('expiry during source loading and backwards time both fail closed', async () => {
  for (const later of [fixture.request.review_after, '2026-09-15T11:59:59Z']) {
    let now = fixture.request.evaluation_time;
    const h = harness({ getTime: () => now, read({ bytes }) { now = later; return bytes; } });
    await rejectsSafe(() => h.gate.readSources(h.input), 'STALE_AUTHORITY'); assert.deepEqual(h.reads, [0]);
  }
});

test('unknown/stale revocation state and thrown verifier details are redacted', async () => {
  const seed = harness();
  for (const verify of [
    async () => { throw new Error(sentinel); },
    async ({ at }) => ({ ...seed.decision, authority_mode: 'synthetic', verifier_id: 'studio.test.authority', revocation: { status: 'unknown', checked_at: at } }),
    async () => ({ ...seed.decision, authority_mode: 'synthetic', verifier_id: 'studio.test.authority', revocation: { status: 'active', checked_at: '2026-09-15T00:00:00Z' } })
  ]) {
    const h = harness({ verifier: { id: 'studio.test.authority', mode: 'synthetic', verify } });
    await rejectsSafe(() => h.gate.readSources(h.input), 'AUTHORITY_UNVERIFIABLE'); assert.deepEqual(h.reads, []);
  }
});

test('source integrity mismatch, oversized bytes and read exceptions return no partial data', async () => {
  for (const read of [() => Buffer.from('wrong'), () => Buffer.alloc(10000), () => { throw new Error(sentinel); }]) {
    const h = harness({ read }); await rejectsSafe(() => h.gate.readSources(h.input)); assert.deepEqual(h.reads, [0]);
  }
});

test('trusted inventory exceeding request budget is rejected before reads', async () => {
  const h = harness(); h.input.request.limits.total_source_bytes = 1;
  await rejectsSafe(() => h.gate.readSources(h.input), 'BUDGET_EXCEEDED'); assert.deepEqual(h.reads, []);
});

test('request accessors cannot run; snapshots resist caller mutation during verification', async () => {
  const h = harness(); let invoked = false;
  Object.defineProperty(h.input.request, 'purpose', { get() { invoked = true; return sentinel; }, enumerable: true });
  await rejectsSafe(() => h.gate.readSources(h.input), 'INVALID_REQUEST'); assert.equal(invoked, false); assert.deepEqual(h.reads, []);
  const seed = harness(); let release;
  const pending = new Promise(resolve => release = resolve);
  const second = harness({ verifier: { ...seed.synthetic.verifier, async verify(input) { await pending; return seed.synthetic.verifier.verify(input); } } });
  const result = second.gate.readSources(second.input); second.input.request.sources[0].reference.artifact.artifact_uri = sentinel;
  release(); assert.equal((await result).sources.length, 2);
});

test('cancellation before and during loading fails without partial delivery', async () => {
  const pre = new AbortController(); pre.abort(sentinel); const h = harness();
  await rejectsSafe(() => h.gate.readSources({ ...h.input, signal: pre.signal }), 'CANCELLED'); assert.deepEqual(h.reads, []);
  const during = new AbortController();
  const second = harness({ read({ bytes }) { during.abort(sentinel); return bytes; } });
  await rejectsSafe(() => second.gate.readSources({ ...second.input, signal: during.signal }), 'CANCELLED'); assert.deepEqual(second.reads, [0]);
});

test('explicitly installed verifier is rechecked for every read and final delivery, without cached grants', async () => {
  const seed = harness(); let calls = 0;
  // Host-installed fake emulates the production interface; no real signing/trust is claimed.
  const verifier = { id: 'studio.test.reviewed-policy', mode: 'production', async verify({ at }) {
    calls++;
    return { ...seed.decision, authority_mode: 'production', verifier_id: this.id,
      review_after: calls === 1 ? '2026-09-15T13:00:00Z' : seed.decision.review_after,
      revocation: { status: 'active', checked_at: at } };
  } };
  const h = harness({ mode: 'production', verifier });
  const result = await h.gate.readSources(h.input);
  assert.equal(calls, 3); assert.equal(result.preparation.review_after, '2026-09-15T13:00:00Z');
  await h.gate.readSources(h.input); assert.equal(calls, 6);
});

test('malformed explicit data, Unicode, cycles and unknown versions are rejected without reading', async () => {
  for (const mutate of [
    r => r.purpose = '\ud800', r => r.self = r, r => r.spec_version = '1.1.0',
    r => r.sources = new (class extends Array {})(...r.sources),
    r => r.sources[0].fragments.push({ ...r.sources[0].fragments[0], candidate_id: owner }),
    r => r.evaluation_time = '2026-02-30T00:00:00Z'
  ]) {
    const h = harness(); mutate(h.input.request);
    await rejectsSafe(() => h.gate.readSources(h.input), 'INVALID_REQUEST'); assert.deepEqual(h.reads, []);
  }
});

test('source review, request time, and ceiling failures precede reads even with valid decision evidence', async () => {
  const stale = harness({ getTime: () => fixture.request.sources[0].review_after });
  await rejectsSafe(() => stale.gate.readSources(stale.input), 'STALE_AUTHORITY'); assert.deepEqual(stale.reads, []);
  const oldClock = harness({ getTime: () => '2026-09-15T11:00:00Z' });
  await rejectsSafe(() => oldClock.gate.readSources(oldClock.input), 'STALE_AUTHORITY'); assert.deepEqual(oldClock.reads, []);
  const lower = harness(); lower.input.request.max_classification = 'public';
  await rejectsSafe(() => lower.gate.readSources(lower.input), 'PREPARATION_DENIED'); assert.deepEqual(lower.reads, []);
});
