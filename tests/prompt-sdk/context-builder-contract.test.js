import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  canonicalJson, validateContextDocument, validateContextBinding,
  renderPromptWithContextPackage, CONTEXT_PACKAGE_CONTRACT
} from '../../src/prompt-sdk/index.js';

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url)));
const lock = await read('../fixtures/context-builder-contract-lock.json');
const scenarios = await Promise.all(lock.artifacts.map(a => read('../' + a.path)));
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const identity = value => ({ canonicalization: 'studio-json-v1', byte_size: Buffer.byteLength(canonicalJson(value)), sha256: sha(canonicalJson(value)) });
const render = s => renderPromptWithContextPackage(s.prompt, {
  inputValues: { item: 'blue cube', attributes: {} },
  packageDocument: s.result.package, authorization: s.authorization, at: s.request.evaluation_time
});

test('Builder contract fixture artifacts are pinned development inputs, not a new production dependency', async () => {
  assert.equal(lock.status, 'unreleased-test-only');
  assert.match(lock.commit, /^[0-9a-f]{40}$/);
  assert.equal(CONTEXT_PACKAGE_CONTRACT.status, 'released');
  assert.equal(CONTEXT_PACKAGE_CONTRACT.version, '1.0.0');
  for (const artifact of lock.artifacts) {
    const bytes = await readFile(new URL('../' + artifact.path, import.meta.url));
    assert.equal(bytes.length, artifact.byte_size); assert.equal(sha(bytes), artifact.sha256);
    assert.equal(artifact.artifact_uri, `https://github.com/${lock.repository}/blob/${lock.commit}/${artifact.path}`);
  }
});

for (const s of scenarios) test(`released SDK consumes ${s.request.policy.selection} prepared output unchanged`, () => {
  assert.equal(s.result.status, 'prepared');
  assert.deepEqual(s.result.request_identity, identity(s.request));
  assert.deepEqual(s.request.target.identity, identity(s.prompt));
  assert.equal(validateContextDocument(s.result.package).valid, true);
  const validation = validateContextBinding(s.prompt, s.result.package, s.authorization, { at: s.request.evaluation_time });
  assert.equal(validation.valid, true, JSON.stringify(validation.diagnostics));
  const { renderedPrompt } = render(s);
  assert.match(renderedPrompt.messages[1].content, /Synthetic approved note\./);
  assert.equal(renderedPrompt.contexts.length, s.result.package.manifest.sections.length);
  if (s.request.policy.selection === 'explicit-v1') {
    assert.match(renderedPrompt.messages[1].content, /\{"count":1,"facts":\["synthetic"\]\}/);
    assert.equal(renderedPrompt.classification, 'internal');
  }
  const provenance = renderedPrompt.contexts.flatMap(c => c.package.sources);
  assert.deepEqual(new Set(provenance.map(s => s.source_id)), new Set(s.result.package.manifest.sources.map(s => s.source_id)));
  assert.equal(s.result.package.manifest.sources.filter(s => s.kind === 'approved-private').every(s => !Object.hasOwn(s, 'artifact')), true);
});

test('prepared evidence cannot replace separate use authorization', () => {
  const s = structuredClone(scenarios[0]);
  s.authorization = s.result;
  assert.equal(validateContextBinding(s.prompt, s.result.package, s.authorization, { at: s.request.evaluation_time }).valid, false);
  assert.throws(() => render(s));
});

test('SDK rejects mismatched authorization, required-slot loss, stale time and downgraded content', () => {
  for (const mutate of [
    s => s.authorization.prompt.version = '9.0.0',
    s => s.authorization.package.instance_id = 'another-instance',
    s => s.authorization.purpose = 'another-purpose',
    s => s.result.package.manifest.sections.shift(),
    s => s.request.evaluation_time = s.result.package.manifest.review_after,
    s => s.result.package.manifest.sections[1].classification = 'public'
  ]) {
    const s = structuredClone(scenarios[0]); mutate(s);
    // Keep integrity valid to exercise semantic rather than stale-digest rejection.
    s.result.package.manifest.total_content_bytes = s.result.package.manifest.sections.reduce((n, x) => n + x.byte_size, 0);
    s.result.package.manifest_identity = identity(s.result.package.manifest);
    assert.equal(validateContextBinding(s.prompt, s.result.package, s.authorization, { at: s.request.evaluation_time }).valid, false);
    assert.throws(() => render(s));
  }
});

test('synthetic public receipt contains no source, package, build or content identity', () => {
  for (const s of scenarios) {
    assert.deepEqual(Object.keys(s.receipt).sort(), ['attestation_reference', 'kind', 'spec_version']);
    assert.match(s.receipt.attestation_reference, /^urn:uuid:/);
    for (const value of [s.request.build_id, s.request.correlation_id, s.result.package.manifest_identity.sha256,
      ...s.request.sources.map(s => s.source_id)]) assert.equal(JSON.stringify(s.receipt).includes(value), false);
  }
});
