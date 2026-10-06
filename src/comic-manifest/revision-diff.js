import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateComicManifest } from './validate.js';
import { validateComicRevision } from './episode.js';

const failure = code => ({ valid: false, diagnostics: [{ stage: 'revision-diff', code }] });
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const categories = Object.freeze({
  production_id: 'identity', episode_id: 'identity', release_id: 'identity',
  revision: 'revision', previous: 'revision', classification: 'classification',
  title: 'creative-content', panels: 'creative-content',
  inputs: 'inputs', input_canon: 'inputs', dependencies: 'inputs',
  renditions: 'outputs', outputs: 'outputs', gates: 'gates', execution: 'execution',
  scope: 'publication', canon_scope: 'publication', production_credit: 'publication',
  approvers: 'approvals', private_context: 'disclosure-context', kind: 'contract', spec_version: 'contract'
});

/** Compare an exact supplied adjacent revision pair without returning payload values. */
export function diffComicRevision(candidateSource, previousSource) {
  if (previousSource === null || previousSource === undefined) return failure('PREDECESSOR_REQUIRED');
  const relation = validateComicRevision(candidateSource, previousSource);
  if (!relation.valid) return failure(relation.diagnostics?.[0]?.code ?? 'REVISION_INVALID');
  const previous = validateComicManifest(previousSource);
  if (!previous.valid) return failure(previous.diagnostics?.[0]?.code ?? 'REVISION_INVALID');

  if (relation.value.classification !== 'public' || previous.value.classification !== 'public') {
    return { valid: true, details_withheld: true, diagnostics: [] };
  }
  const fields = new Set([...Object.keys(relation.value), ...Object.keys(previous.value)]);
  const changed = [...fields].filter(key => !same(relation.value[key], previous.value[key]));
  const summary = [...new Set(changed.map(key => categories[key] ?? 'other'))].sort();
  return { valid: true, changed: changed.length > 0, categories: Object.freeze(summary), details_withheld: false, diagnostics: [] };
}
