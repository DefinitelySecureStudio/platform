import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreparationGate, createMemorySourceBinding, createApprovedExportBinding, createPublicSnapshotBinding,
  createAuditedContextBuilder, createSyntheticAuditSink, createBuildArtifact, compareBuildArtifacts } from '../../src/context-builder/index.js';
import { validateContextDocument, validateContextBinding } from '../../src/prompt-sdk/index.js';
import { digest, identity } from '../../src/context-builder/request.js';
import { validateResult } from '../../src/context-builder/generated/audit-v1.js';
import { referenceNames, referenceScenario } from '../support/context-builder-reference-scenarios.js';
import { syntheticVerifier, conformanceOwner } from '../support/context-builder-conformance.js';

const goldenPath = new URL('../fixtures/context-builder-reference-golden.json', import.meta.url);
const goldenBytes = await readFile(goldenPath), golden = JSON.parse(goldenBytes);
const lock = JSON.parse(await readFile(new URL('../fixtures/context-builder-reference-lock.json', import.meta.url)));
test('reviewed Platform reference golden bytes remain pinned and use the accepted Codex baseline', () => {
  assert.equal(goldenBytes.length, lock.byte_size); assert.equal(digest(goldenBytes), lock.sha256);
  assert.equal(lock.codex_commit, '291453e2a957fb83dedb0c209ed2cdd14ba90c0e');
  assert.deepEqual(Object.keys(golden), referenceNames);
});

for (const name of referenceNames) test(`reference ${name}: exact golden, audit and authorized replay`, async t => {
  const { fixture: f, expected } = referenceScenario(name);
  assert.deepEqual(expected, golden[name]); // Oracle review and golden update are separate from running tests.
  const directory = await mkdtemp(join(tmpdir(), 'builder-reference-')); t.after(() => rm(directory, { recursive: true, force: true }));
  const bindings = await Promise.all(f.request.sources.map(async (source, i) => {
    const bytes = Buffer.from(f.raw_sources[i].text), artifact = { byte_size: bytes.length, sha256: digest(bytes), media_type: source.media_type };
    if (source.kind === 'public-canon') {
      await writeFile(join(directory, 'public.txt'), bytes);
      return createPublicSnapshotBinding({ source, artifact, root: directory, filename: 'public.txt' });
    }
    if (source.kind === 'approved-private') return createApprovedExportBinding({ source, artifact,
      readExport: async () => (async function* () { yield bytes; })() });
    return createMemorySourceBinding({ source, artifact, bytes });
  }));
  const policy = syntheticVerifier(f.request), getTime = () => f.request.evaluation_time;
  const gate = createPreparationGate({ mode: 'synthetic', verifier: policy.verifier, decisionOwners: [conformanceOwner],
    sourceBindings: [...bindings].reverse(), getTime });
  let ref = 900;
  const sink = createSyntheticAuditSink({ makeReference: () => `urn:uuid:00000000-0000-4000-8000-${String(ref++).padStart(12, '0')}` });
  const builder = createAuditedContextBuilder({ gate, mode: 'synthetic', sink, getTime });
  const input = { request: f.request, prompt: f.prompt, callerId: f.request.caller_id };
  const result = await builder.build(input); assert.equal(validateResult(result), true);
  assert.equal(result.status, expected.status); assert.deepEqual(result.request_identity, identity(f.request));
  if (result.status === 'prepared') {
    assert.equal(validateContextDocument(result.package).valid, true);
    assert.deepEqual(result.package, expected.package); assert.deepEqual(result.lineage, expected.lineage); assert.deepEqual(result.omissions, expected.omissions);
    assert.equal(validateContextBinding(f.prompt, result.package, f.authorization, { at: getTime() }).valid, true);
    const replay = await builder.build(input);
    assert.notEqual(replay.evidence_reference, result.evidence_reference);
    assert.equal(compareBuildArtifacts(createBuildArtifact(result), createBuildArtifact(replay)), true);
  } else {
    assert.equal(result.diagnostics[0].code, expected.code); assert.equal(result.package, undefined);
    assert.deepEqual(sink.records().map(x => x.record.phase), ['attempt', 'failed']);
  }
  assert.deepEqual(await readFile(goldenPath), goldenBytes); // Tests never refresh or rewrite expectations.
});
