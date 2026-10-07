import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateComicManifest,
  validateComicOutputCompatibility
} from '../../src/comic-manifest/index.js';

const read = async path => JSON.parse(await readFile(new URL('../fixtures/' + path, import.meta.url)));
const fixture = await read('comic-manifest-v1.json');
const cases = await read('comic-manifest-v1-cases.json');
const raw = value => JSON.stringify(value);
const assignment = raw(fixture.trust.assignment);
const compatibility = (scenario, includeRelease = false) => validateComicOutputCompatibility(
  raw(scenario.production), raw(scenario.result),
  includeRelease ? raw(scenario.release) : null,
  includeRelease ? raw(scenario.trust.assignment) : null
);

function applyEdits(scenario, testCase) {
  for (const edit of testCase.edits) {
    const parent = edit.path.slice(0, -1).reduce((value, key) => value[key], scenario);
    if (edit.remove) delete parent[edit.path.at(-1)];
    else parent[edit.path.at(-1)] = edit.value;
  }
}

function rebindResultToProduction(scenario) {
  const production = validateComicManifest(raw(scenario.production));
  if (!production.valid) return;
  scenario.result.production = {
    production_id: production.value.production_id,
    revision: production.value.revision,
    identity: production.identity
  };
  scenario.result.inputs = scenario.production.inputs;
}

function addSelectedPageOutput(scenario) {
  const requirement = {
    ...scenario.production.renditions[0],
    rendition_id: 'page',
    required: true,
    media_type: 'image/png',
    dimensions: { width: 1, height: 1 },
    alt_text: 'A small synthetic blue square.',
    profile: { profile_id: 'comic-page-image', profile_version: '1.0.0' },
    max_bytes: 50_000_000
  };
  const digest = 'sha256:' + 'a'.repeat(64);
  const buildOutput = {
    rendition_id: requirement.rendition_id,
    artifact: {
      artifact_uri: 'urn:uuid:10000000-0000-4000-8000-000000000011',
      media_type: requirement.media_type,
      byte_size: 1,
      sha256: digest
    },
    dimensions: requirement.dimensions,
    rights_notice: requirement.rights_notice,
    alt_text: requirement.alt_text,
    transcript: requirement.transcript,
    profile: requirement.profile,
    max_bytes: requirement.max_bytes
  };
  const publicOutput = structuredClone(buildOutput);
  publicOutput.artifact.artifact_uri = 'https://example.invalid/synthetic/page.png';
  scenario.production.renditions.push(requirement);
  scenario.result.outputs.unshift(buildOutput);
  scenario.release.outputs.unshift(publicOutput);
  scenario.result.execution.transformations[0].output_digests.push(digest);
  scenario.release.execution.transformations[0].output_digests.push(digest);
  rebindResultToProduction(scenario);
}

test('selected build outputs match declared profiles and the public release preserves them', () => {
  assert.deepEqual(compatibility(fixture), { valid: true, diagnostics: [] });
  assert.deepEqual(compatibility(fixture, true), { valid: true, diagnostics: [] });
});

test('build-result classification cannot be lower than production; equal and higher levels remain valid', () => {
  const controls = [
    ['public', 'public'],
    ['internal', 'internal'],
    ['internal', 'confidential'],
    ['confidential', 'confidential'],
    ['confidential', 'restricted'],
    ['restricted', 'restricted']
  ];
  for (const [productionClass, resultClass] of controls) {
    const scenario = structuredClone(fixture);
    scenario.production.classification = productionClass;
    for (const prompt of scenario.production.inputs.prompts) {
      if (prompt.context !== null) prompt.context.classification = 'public';
    }
    scenario.result.classification = resultClass;
    rebindResultToProduction(scenario);
    assert.equal(validateComicManifest(raw(scenario.production)).valid, true, `${productionClass} production`);
    assert.equal(validateComicManifest(raw(scenario.result)).valid, true, `${resultClass} result`);
    assert.equal(compatibility(scenario).valid, true, `${productionClass} → ${resultClass}`);
  }

  const downgrade = structuredClone(fixture);
  downgrade.production.classification = 'internal';
  for (const prompt of downgrade.production.inputs.prompts) {
    if (prompt.context !== null) prompt.context.classification = 'public';
  }
  downgrade.result.classification = 'public';
  rebindResultToProduction(downgrade);
  assert.equal(validateComicManifest(raw(downgrade.production)).valid, true);
  assert.equal(validateComicManifest(raw(downgrade.result)).valid, true);
  assert.equal(compatibility(downgrade).diagnostics[0].code, 'CLASSIFICATION');
});

test('release output location may change while selected metadata and artifact identity stay exact', () => {
  const scenario = structuredClone(fixture);
  assert.notEqual(scenario.result.outputs[0].artifact.artifact_uri, scenario.release.outputs[0].artifact.artifact_uri);
  assert.equal(compatibility(scenario, true).valid, true);
  const changedDigest = 'sha256:' + '0'.repeat(64);
  scenario.release.outputs[0].artifact.sha256 = changedDigest;
  scenario.release.execution.transformations[0].output_digests = [changedDigest];
  assert.equal(compatibility(scenario, true).diagnostics[0].code, 'RELEASE_OUTPUTS');
});

test('public release preserves the selected output order across multiple profiles', () => {
  const scenario = structuredClone(fixture);
  addSelectedPageOutput(scenario);
  assert.equal(compatibility(scenario, true).valid, true);
  scenario.release.outputs.reverse();
  assert.equal(compatibility(scenario, true).diagnostics[0].code, 'RELEASE_OUTPUTS');
});

test('required outputs cannot be omitted from a complete build and optional outputs may be omitted', () => {
  const missing = structuredClone(fixture);
  missing.production.renditions.push({
    ...missing.production.renditions[0],
    rendition_id: 'page',
    media_type: 'image/png',
    dimensions: { width: 1, height: 1 },
    profile: { profile_id: 'comic-page-image', profile_version: '1.0.0' },
    max_bytes: 50_000_000
  });
  rebindResultToProduction(missing);
  assert.equal(compatibility(missing).diagnostics[0].code, 'REQUIRED_OUTPUT');

  const optional = structuredClone(fixture);
  optional.production.renditions.push({
    ...optional.production.renditions[0],
    rendition_id: 'page',
    required: false,
    media_type: 'image/png',
    dimensions: { width: 1, height: 1 },
    profile: { profile_id: 'comic-page-image', profile_version: '1.0.0' },
    max_bytes: 50_000_000
  });
  rebindResultToProduction(optional);
  assert.equal(compatibility(optional, true).valid, true);
});

test('raster profile accepts inclusive side and pixel limits and rejects overages', () => {
  const production = structuredClone(fixture.production);
  production.renditions[0] = {
    ...production.renditions[0],
    media_type: 'image/webp',
    dimensions: { width: 8_192, height: 4_096 },
    profile: { profile_id: 'comic-page-image', profile_version: '1.0.0' },
    max_bytes: 50_000_000
  };
  assert.equal(validateComicManifest(raw(production)).valid, true);

  for (const dimensions of [{ width: 8_193, height: 1 }, { width: 8_192, height: 8_192 }]) {
    const over = structuredClone(production);
    over.renditions[0].dimensions = dimensions;
    assert.equal(validateComicManifest(raw(over)).diagnostics[0].code, 'RENDITION_DIMENSIONS');
  }
  const transcriptOver = structuredClone(fixture.production);
  transcriptOver.renditions[0].max_bytes++;
  assert.equal(validateComicManifest(raw(transcriptOver)).diagnostics[0].code, 'RENDITION_LIMIT');
});

test('output artifact byte-size declaration cannot exceed the selected cap', () => {
  const atLimit = structuredClone(fixture.result);
  atLimit.outputs[0].artifact.byte_size = atLimit.outputs[0].max_bytes;
  assert.equal(validateComicManifest(raw(atLimit)).valid, true);
  atLimit.outputs[0].artifact.byte_size++;
  assert.equal(validateComicManifest(raw(atLimit)).diagnostics[0].code, 'OUTPUT_LIMIT');
});

test('profile, requirement, release and episode overlays reject incompatible declarations', () => {
  const selectedNames = new Set([
    'no required rendition',
    'unexpected output',
    'wrong output media',
    'allowed profile alternative still must equal selected media type',
    'public release preserves selected PNG despite profile allowing WebP',
    'wrong output rights',
    'transcript profile rejects another media type',
    'raster profile rejects dimensions over pixel limit',
    'transcript profile cap cannot be raised',
    'result cannot raise the declared output cap',
    'result accessibility description must match',
    'public output tampering',
    'unassigned episode'
  ]);
  const relational = cases.filter(testCase => testCase.layer === 'relational' && selectedNames.has(testCase.name));
  assert.equal(relational.length, selectedNames.size);

  for (const testCase of relational) {
    const scenario = structuredClone(fixture);
    applyEdits(scenario, testCase);
    rebindResultToProduction(scenario);

    let result;
    if (testCase.name === 'no required rendition' || testCase.name === 'transcript profile rejects another media type' ||
        testCase.name === 'raster profile rejects dimensions over pixel limit' || testCase.name === 'transcript profile cap cannot be raised') {
      result = validateComicManifest(raw(scenario.production));
    } else {
      const includeRelease = testCase.edits.some(edit => edit.path[0] === 'release') || testCase.name === 'unassigned episode';
      result = compatibility(scenario, includeRelease);
    }
    assert.equal(result.valid, false, `expected ${testCase.name} to fail`);
    assert.equal(result.diagnostics.length, 1);
  }
});

test('unassigned episode identity fails while the explicit matching assignment succeeds', () => {
  assert.equal(validateComicOutputCompatibility(raw(fixture.production), raw(fixture.result), raw(fixture.release)).diagnostics[0].code, 'ASSIGNMENT');
  const wrong = structuredClone(fixture);
  wrong.release.episode_id = 'DS-0002';
  assert.equal(validateComicOutputCompatibility(raw(wrong.production), raw(wrong.result), raw(wrong.release), assignment).diagnostics[0].code, 'ASSIGNMENT');

  const mismatchedTitle = structuredClone(fixture);
  mismatchedTitle.release.title = 'Another synthetic title';
  const result = validateComicOutputCompatibility(raw(mismatchedTitle.production), raw(mismatchedTitle.result), raw(mismatchedTitle.release), assignment);
  assert.equal(result.diagnostics[0].code, 'EPISODE_TITLE');
});

test('blank accessibility and rights declarations fail closed', () => {
  const production = structuredClone(fixture.production);
  production.renditions[0].alt_text = '   ';
  assert.equal(validateComicManifest(raw(production)).diagnostics[0].code, 'RENDITION_METADATA');
});
