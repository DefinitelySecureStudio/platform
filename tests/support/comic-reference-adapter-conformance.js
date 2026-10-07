import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createComicReferenceResolver, planComicReferences } from '../../src/comic-manifest/index.js';

const manifest = JSON.parse(await readFile(new URL('../fixtures/comic-manifest-v1.json', import.meta.url)));
const builder = JSON.parse(await readFile(new URL('../fixtures/context-builder-v1.json', import.meta.url)));
const raw = JSON.stringify;
const at = '2026-09-15T12:00:00Z';
const until = '2026-09-15T13:00:00Z';
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

function sourceBytes(reference) {
  if (reference.kind === 'public') {
    return Buffer.from(manifest.dependency_bytes[reference.dependency.artifact.artifact_uri], 'utf8');
  }
  if (reference.kind === 'context-package') return Buffer.from(raw(builder.result.package), 'utf8');
  if (reference.kind === 'builder-result') return Buffer.from(raw(builder.result), 'utf8');
  if (reference.kind === 'protected') return Buffer.from('SYNTHETIC-PROTECTED-SENTINEL', 'utf8');
  assert.fail(`Unexpected synthetic reference kind: ${reference.kind}`);
}

function entriesFor(plan) {
  return plan.references.map(entry => {
    const reference = entry.reference;
    const bytes = sourceBytes(reference);
    const artifact = reference.kind === 'public'
      ? reference.dependency.artifact
      : reference.kind === 'protected'
        ? { media_type: reference.media_type, byte_size: bytes.byteLength, sha256: digest(bytes) }
        : { media_type: 'application/json', byte_size: bytes.byteLength, sha256: digest(bytes) };
    return { reference, classification: entry.classification, artifact, bytes };
  });
}

/**
 * Run the same offline reader contract against any test adapter with
 * createAdapter({ entries, mode }) -> { read(slot, { maxBytes, signal }), reads() }.
 * The slot is captured by each installed binding; reference URIs, filesystem
 * paths, and protected handles are not passed to the adapter callback.
 */
export function comicReferenceAdapterConformance(name, createAdapter) {
  test(`${name}: exact offline reads verify every pinned reference`, async () => {
    const h = harness(createAdapter, 'success');
    const result = await h.resolver.verify(raw(manifest.production));
    assert.equal(result.valid, true, raw(result.diagnostics));
    assert.equal(result.artifacts.length, h.entries.length);
    assert.equal(h.adapter.reads(), h.entries.length);
    assert.equal(h.readerRequests.length, h.entries.length);
    assert.ok(h.readerRequests.every(request => request.keys.join(',') === 'maxBytes,signal'));
    for (let i = 0; i < h.entries.length; i++) {
      assert.equal(result.artifacts[i].artifact.sha256, h.entries[i].artifact.sha256);
      assert.deepEqual(Buffer.from(result.artifacts[i].bytes), h.entries[i].bytes);
    }
    assert.equal(Object.hasOwn(result, 'public_projection'), false);
  });

  test(`${name}: a late denied authorization prevents every byte read`, async () => {
    const h = harness(createAdapter, 'success', { denyFinalPreflight: true });
    const result = await h.resolver.verify(raw(manifest.production));
    assert.equal(result.valid, false);
    assert.equal(result.diagnostics[0].code, 'ACCESS_DENIED');
    assert.equal(h.adapter.reads(), 0);
    assert.deepEqual(h.readerRequests, []);
  });

  test(`${name}: tampered bytes and raw adapter errors return fixed, value-free failures`, async () => {
    const tampered = harness(createAdapter, 'tamper-first');
    const badBytes = await tampered.resolver.verify(raw(manifest.production));
    assert.deepEqual(badBytes, { valid: false, diagnostics: [{ stage: 'reference', code: 'ARTIFACT_INTEGRITY' }] });

    const throwing = harness(createAdapter, 'throw-first');
    const failed = await throwing.resolver.verify(raw(manifest.production));
    assert.deepEqual(failed, { valid: false, diagnostics: [{ stage: 'reference', code: 'SOURCE_UNAVAILABLE' }] });
    assert.doesNotMatch(raw({ badBytes, failed }), /CONFORMANCE_SECRET|SYNTHETIC-PROTECTED-SENTINEL|https:\/\/|urn:uuid:/);
  });

  test(`${name}: repeated processing preserves identities and bytes`, async () => {
    const h = harness(createAdapter, 'success');
    const first = await h.resolver.verify(raw(manifest.production));
    const second = await h.resolver.verify(raw(manifest.production));
    assert.equal(first.valid, true);
    assert.equal(second.valid, true);
    assert.deepEqual(first.manifest_identity, second.manifest_identity);
    assert.deepEqual(first.artifacts.map(item => [item.artifact.sha256, Buffer.from(item.bytes).toString('hex')]),
      second.artifacts.map(item => [item.artifact.sha256, Buffer.from(item.bytes).toString('hex')]));
    assert.equal(h.adapter.reads(), 2 * h.entries.length);
  });
}

function harness(createAdapter, mode, { denyFinalPreflight = false } = {}) {
  const plan = planComicReferences(raw(manifest.production));
  assert.equal(plan.valid, true, raw(plan.diagnostics));
  const entries = entriesFor(plan);
  const adapter = createAdapter({ entries, mode });
  const readerRequests = [];
  const bindings = entries.map((entry, slot) => ({
    referenceSource: raw(entry.reference),
    artifactSource: raw({
      media_type: entry.artifact.media_type,
      byte_size: entry.artifact.byte_size,
      sha256: entry.artifact.sha256
    }),
    classification: entry.classification,
    read(options) {
      readerRequests.push({ keys: Object.keys(options).sort(), maxBytes: options.maxBytes });
      return adapter.read(slot, options);
    }
  }));
  let authorizationCalls = 0;
  const resolver = createComicReferenceResolver({
    bindings,
    requiredPublicReferences: plan.references
      .filter(entry => entry.uses.some(use => use.role === 'dependency'))
      .map(entry => raw(entry.reference)),
    authorize: ({ scope }) => {
      authorizationCalls++;
      const denied = denyFinalPreflight && authorizationCalls === entries.length;
      return raw({
        decision: denied ? 'deny' : 'allow',
        scope,
        not_before: at,
        expires_at: until,
        revocation: { status: 'active', checked_at: scope.at }
      });
    },
    getTime: () => at,
    callerId: 'urn:uuid:10000000-0000-4000-8000-000000000900',
    purpose: 'Synthetic offline adapter conformance.',
    maxClassification: 'internal'
  });
  return { adapter, entries, readerRequests, resolver };
}

/** A fixture-backed reference adapter: only the captured synthetic byte table is readable. */
export function createFixtureReferenceAdapter({ entries, mode }) {
  let reads = 0;
  return {
    reads: () => reads,
    read(slot, { maxBytes, signal }) {
      reads++;
      if (mode === 'throw-first' && slot === 0) throw new Error('CONFORMANCE_SECRET /private/provider');
      let bytes = Buffer.from(entries[slot].bytes);
      if (mode === 'tamper-first' && slot === 0 && bytes.length > 0) bytes[0] ^= 1;
      if (signal.aborted || bytes.byteLength > maxBytes) throw new Error('CONFORMANCE_SECRET');
      return (async function* () {
        for (let offset = 0; offset < bytes.length; offset += 23) {
          yield Uint8Array.from(bytes.subarray(offset, Math.min(offset + 23, bytes.length)));
        }
      })();
    }
  };
}

/** An independently implemented in-memory fake using copied byte arrays. */
export function createIndependentFakeReferenceAdapter({ entries, mode }) {
  let invocations = 0;
  const fixtureBytes = entries.map(entry => Array.from(entry.bytes));
  return {
    reads: () => invocations,
    read(slot, options) {
      invocations++;
      if (mode === 'throw-first' && slot === 0) throw new Error('CONFORMANCE_SECRET /private/fake-reader');
      const bytes = Uint8Array.from(fixtureBytes[slot]);
      if (mode === 'tamper-first' && slot === 0 && bytes.length > 0) bytes[bytes.length - 1] ^= 1;
      assert.equal(options.signal.aborted, false);
      assert.ok(bytes.byteLength <= options.maxBytes);
      return (async function* () { yield bytes; })();
    }
  };
}
