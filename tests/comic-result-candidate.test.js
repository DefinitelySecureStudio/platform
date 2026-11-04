import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateComicBuildResultCandidate } from '../src/comic-manifest/result-candidate.js';
import { validateComicManifest } from '../src/comic-manifest/index.js';
const read = async name => JSON.parse(await readFile(new URL(`fixtures/${name}`, import.meta.url)));
const base = await read('comic-build-result-v1.1-candidate.json');
const production = JSON.stringify(base.production);
test('explicit candidate validates actual no-output inputs, stable validator rejects the new exact version', () => {
  assert.equal(validateComicBuildResultCandidate(JSON.stringify(base.result), production).valid, true);
  assert.equal(validateComicManifest(JSON.stringify(base.result)).valid, false);
});
for (const c of await read('comic-build-result-v1.1-candidate-cases.json')) test(`candidate rejects ${c.name}`, () => {
  const r = structuredClone(base.result);
  c.path.slice(0, -1).reduce((x, k) => x[k], r)[c.path.at(-1)] = c.value;
  assert.equal(validateComicBuildResultCandidate(JSON.stringify(r), production).valid, false);
});
for (const kind of ['changed-production', 'fabricated-input', 'changed-tool', 'withheld-input', 'invalid-time']) test(`candidate semantics rejects ${kind}`, () => {
  const r = structuredClone(base.result);
  if (kind === 'changed-production') r.production.revision++;
  if (kind === 'fabricated-input') r.execution.transformations[0].input_digests[0] = 'sha256:' + 'a'.repeat(64);
  if (kind === 'changed-tool') r.execution.tool.tag = 'wrong';
  if (kind === 'withheld-input') r.execution.transformations[0].private_inputs_withheld = true;
  if (kind === 'invalid-time') r.execution.finished_at = '2000-01-01T00:00:00Z';
  assert.equal(validateComicBuildResultCandidate(JSON.stringify(r), production).valid, false);
});

for (const promptCount of [0, 2]) test(`no-output candidate diagnoses ${promptCount} prompt bindings without throwing`, () => {
  const p = structuredClone(base.production);
  p.inputs.prompts = promptCount === 0 ? [] : [p.inputs.prompts[0], { ...p.inputs.prompts[0], binding_id: 'second' }];
  if (promptCount === 0) for (const panel of p.panels) panel.prompt_bindings = [];
  const source = JSON.stringify(p);
  const validated = validateComicManifest(source);
  assert.equal(validated.valid, true);
  const r = structuredClone(base.result);
  r.inputs = p.inputs;
  r.production.identity = validated.identity;
  r.execution.transformations[0].input_digests = [p.inputs.canon.artifact.sha256,
    ...(promptCount ? [p.inputs.prompts[0].identity.sha256] : [])];
  const report = validateComicBuildResultCandidate(JSON.stringify(r), source);
  assert.equal(report.valid, false);
  assert.equal(report.diagnostics[0].code, 'ACTUAL_INPUTS');
});
