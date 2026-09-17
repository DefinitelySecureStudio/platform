import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPreparationGate, createSyntheticPreparationVerifier } from '../../src/context-builder/index.js';
import { identity, digest } from '../../src/context-builder/request.js';

const fixture = JSON.parse(await readFile(new URL('../fixtures/context-builder-lexical-v1.json', import.meta.url)));
export const conformanceOwner = 'urn:uuid:00000000-0000-4000-8000-000000000080';
export function preparationDecision(request) {
  return { decision_id: conformanceOwner, decision: 'allow', owner_id: conformanceOwner,
    preparation_reference: request.preparation_reference, request_identity: identity(request), caller_id: request.caller_id,
    target: request.target, purpose: request.purpose, max_classification: request.max_classification,
    not_before: '2026-09-15T00:00:00Z', review_after: request.review_after, expires_at: request.expires_at };
}
export function syntheticVerifier(request) { return createSyntheticPreparationVerifier([preparationDecision(request)]); }
const reject = (fn, code) => assert.rejects(fn, error => {
  assert.equal(error.diagnostic.code, code); assert.doesNotMatch(JSON.stringify(error), /CONFORMANCE_SECRET|urn:uuid|sha256|path/); return true;
});

/** createBinding({source,artifact,bytes,t}) returns a fresh offline binding, with any required source-kind/reference adaptation. */
export function sourceBindingConformance(name, createBinding) {
  for (const mode of ['success', 'corrupt', 'denied', 'cancelled', 'revoked-during-read', 'reader-error']) {
    test(`${name}: common reader ${mode}`, async t => {
      const f = structuredClone(fixture), expected = Buffer.from(f.raw_sources[0].text), bytes = Buffer.from(expected);
      if (mode === 'corrupt') bytes[0] ^= 1;
      const artifact = { byte_size: expected.length, sha256: digest(expected), media_type: 'text/plain' };
      const binding = await createBinding({ source: f.request.sources[0], artifact, bytes, t });
      f.request.sources[0] = structuredClone(binding.source);
      const policy = syntheticVerifier(f.request); if (mode === 'denied') policy.revoke(conformanceOwner);
      let calls = 0;
      const wrapped = { ...binding, async read(options) {
        calls++; assert.deepEqual(Object.keys(options).sort(), ['maxBytes', 'signal']); assert.equal(options.maxBytes, expected.length);
        if (mode === 'reader-error') throw Error('CONFORMANCE_SECRET path');
        const result = await binding.read(options);
        if (mode === 'revoked-during-read') policy.revoke(conformanceOwner);
        return result;
      } };
      const gate = createPreparationGate({ mode: 'synthetic', verifier: policy.verifier, decisionOwners: [conformanceOwner],
        sourceBindings: [wrapped], getTime: () => f.request.evaluation_time });
      const input = { request: f.request, prompt: f.prompt, callerId: f.request.caller_id };
      if (mode === 'cancelled') input.signal = AbortSignal.abort();
      const run = () => gate.normalizeSources(input);
      if (mode === 'success') {
        const first = await run(), second = await run(); assert.deepEqual(first, second);
        assert.equal(first.normalizedSources[0].candidates[0].content, expected.toString());
        assert.equal(first.normalizedSources[0].candidates[0].sha256, artifact.sha256);
        assert.deepEqual(first.normalizedSources[0].source, binding.source); assert.equal(calls, 2);
      } else {
        await reject(run, mode === 'corrupt' ? 'SOURCE_INTEGRITY' : mode === 'reader-error' ? 'SOURCE_UNAVAILABLE'
          : mode === 'cancelled' ? 'CANCELLED' : 'PREPARATION_DENIED');
        assert.equal(calls, ['denied', 'cancelled'].includes(mode) ? 0 : 1);
      }
    });
  }
}

/** createVerifier(decision) -> {verifier,revoke()}; independent implementations must validate fixture records without production calls. */
export function preparationVerifierConformance(name, createVerifier) {
  for (const mode of ['allow', 'deny', 'owner', 'caller', 'target', 'request', 'purpose', 'ceiling', 'future', 'expired', 'revoked']) {
    test(`${name}: common preparation ${mode}`, async () => {
      const f = structuredClone(fixture), decision = preparationDecision(f.request);
      if (mode === 'deny') decision.decision = 'deny';
      if (mode === 'owner') decision.owner_id = 'urn:uuid:00000000-0000-4000-8000-000000000099';
      if (mode === 'caller') decision.caller_id = conformanceOwner;
      if (mode === 'target') decision.target = { ...decision.target, version: '2.0.0' };
      if (mode === 'request') decision.request_identity = identity({});
      if (mode === 'purpose') decision.purpose = 'CONFORMANCE_SECRET';
      if (mode === 'ceiling') decision.max_classification = 'restricted';
      if (mode === 'expired') decision.review_after = f.request.evaluation_time;
      if (mode === 'future') decision.not_before = '2026-09-15T13:00:00Z';
      const policy = await createVerifier(decision); if (mode === 'revoked') policy.revoke();
      let reads = 0;
      const bytes = Buffer.from(f.raw_sources[0].text);
      const gate = createPreparationGate({ mode: 'synthetic', verifier: policy.verifier, decisionOwners: [conformanceOwner],
        sourceBindings: [{ source: f.request.sources[0], artifact: { byte_size: bytes.length, sha256: digest(bytes), media_type: 'text/plain' },
          read() { reads++; return bytes; } }], getTime: () => f.request.evaluation_time });
      const input = { request: f.request, prompt: f.prompt, callerId: f.request.caller_id };
      if (mode === 'allow') { assert.equal((await gate.normalizeSources(input)).authority_mode, 'synthetic'); assert.equal(reads, 1); }
      else { await reject(() => gate.normalizeSources(input), ['expired', 'future'].includes(mode) ? 'STALE_AUTHORITY'
        : mode === 'owner' ? 'AUTHORITY_UNVERIFIABLE' : 'PREPARATION_DENIED'); assert.equal(reads, 0); }
    });
  }
}
