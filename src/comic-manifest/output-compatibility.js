import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateComicManifest } from './validate.js';
import { validateComicPublicationBinding } from './episode.js';

const failure = code => ({ valid: false, diagnostics: [{ stage: 'output', code }] });
const same = (a, b) => canonicalJson(a) === canonicalJson(b);
const classificationRank = Object.freeze(['public', 'internal', 'confidential', 'restricted']);

function record(source, kind) {
  const result = validateComicManifest(source);
  if (!result.valid) return result;
  return result.value.kind === kind ? result : failure('RECORD_KIND');
}

function buildOutputCompatibility(production, result) {
  const expectedProduction = {
    production_id: production.value.production_id,
    revision: production.value.revision,
    identity: production.identity
  };
  if (!same(result.value.production, expectedProduction)) return failure('PRODUCTION_LINK');
  if (classificationRank.indexOf(result.value.classification) <
      classificationRank.indexOf(production.value.classification)) return failure('CLASSIFICATION');
  if (!same(result.value.inputs, production.value.inputs)) return failure('INPUT_LINK');

  const requirements = new Map(production.value.renditions.map(requirement => [requirement.rendition_id, requirement]));
  for (const output of result.value.outputs) {
    const requirement = requirements.get(output.rendition_id);
    if (!requirement) return failure('UNEXPECTED_OUTPUT');
    if (output.artifact.media_type !== requirement.media_type) return failure('MEDIA');
    if (!same(output.dimensions, requirement.dimensions)) return failure('DIMENSIONS');
    if (!same(output.profile, requirement.profile) || output.max_bytes !== requirement.max_bytes ||
        !['alt_text', 'transcript', 'rights_notice'].every(key => output[key] === requirement[key])) {
      return failure('OUTPUT_REQUIREMENT');
    }
    if (output.artifact.byte_size > requirement.max_bytes) return failure('OUTPUT_LIMIT');
  }

  if (result.value.status === 'complete' &&
      !production.value.renditions.filter(requirement => requirement.required)
        .every(requirement => result.value.outputs.some(output => output.rendition_id === requirement.rendition_id))) {
    return failure('REQUIRED_OUTPUT');
  }
  return null;
}

function releaseOutputCompatibility(result, release) {
  if (result.value.status !== 'complete') return failure('RESULT_NOT_COMPLETE');
  if (release.value.outputs.length !== result.value.outputs.length ||
      release.value.outputs.some((output, index) => output.rendition_id !== result.value.outputs[index]?.rendition_id)) {
    return failure('RELEASE_OUTPUTS');
  }
  for (let index = 0; index < result.value.outputs.length; index++) {
    const built = result.value.outputs[index];
    const published = release.value.outputs[index];
    const { artifact: builtArtifact, ...builtMetadata } = built;
    const { artifact: publishedArtifact, ...publishedMetadata } = published;
    if (!same(builtMetadata, publishedMetadata)) return failure('RELEASE_OUTPUTS');
    const { artifact_uri: _builtUri, ...builtIdentity } = builtArtifact;
    const { artifact_uri: _publishedUri, ...publishedIdentity } = publishedArtifact;
    if (!same(builtIdentity, publishedIdentity)) return failure('RELEASE_OUTPUTS');
  }
  return null;
}

/**
 * Check selected outputs against their production declarations, and optionally
 * verify that a public candidate preserves those outputs and an explicit episode
 * assignment. This checks metadata relationships only; it does not inspect media.
 */
export function validateComicOutputCompatibility(productionSource, resultSource, releaseSource = null, assignmentSource = null) {
  const production = record(productionSource, 'comic-production');
  if (!production.valid) return production;
  const result = record(resultSource, 'comic-build-result');
  if (!result.valid) return result;

  const buildError = buildOutputCompatibility(production, result);
  if (buildError) return buildError;
  if (releaseSource === null) {
    if (assignmentSource !== null) return failure('ASSIGNMENT');
    return { valid: true, diagnostics: [] };
  }

  const release = record(releaseSource, 'comic-public-release');
  if (!release.valid) return release;
  if (assignmentSource === null || assignmentSource === undefined) return failure('ASSIGNMENT');
  const binding = validateComicPublicationBinding(productionSource, releaseSource, assignmentSource);
  if (!binding.valid) {
    const code = binding.diagnostics?.[0]?.code;
    return code === 'PUBLICATION_BINDING' ? failure('ASSIGNMENT') : binding;
  }
  const releaseError = releaseOutputCompatibility(result, release);
  if (releaseError) return releaseError;
  return { valid: true, diagnostics: [] };
}
