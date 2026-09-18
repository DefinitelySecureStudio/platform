import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateComicManifest } from './validate.js';
import { parseComicManifestJson } from './parse-json.js';
const failure = code => ({ valid: false, diagnostics: [{ stage: 'episode', code }] });
const equal = (a, b) => canonicalJson(a) === canonicalJson(b);
const productionRef = r => ({ production_id: r.value.production_id, revision: r.value.revision, identity: r.identity });
const releaseRef = r => ({ release_id: r.value.release_id, episode_id: r.value.episode_id, revision: r.value.revision, identity: r.identity });
function record(source, kinds) {
  const r = validateComicManifest(source);
  return !r.valid || kinds.includes(r.value.kind) ? r : failure('RECORD_KIND');
}
function fields(source, names) {
  const parsed = parseComicManifestJson(source);
  if (!parsed.valid) return parsed;
  const v = parsed.value;
  if (!v || typeof v !== 'object' || Array.isArray(v) || !equal(Object.keys(v).sort(), [...names].sort()) || names.some(n => typeof v[n] !== 'string')) return failure('METADATA_SHAPE');
  return parsed;
}
function metadata(r) {
  const number = '#' + r.episode_id.slice(3);
  return Object.freeze({ episode_id: r.episode_id, number, title: r.title,
    display_title: `Definitely Secure ${number} — ${r.title}`, production_credit: r.production_credit });
}

/** Protected structural view only; no publication number allocation or rendering. */
export function describeComicEpisode(source) {
  const r = record(source, ['comic-production']);
  if (!r.valid) return r;
  const p = r.value;
  return { valid: true, identity: r.identity, episode: Object.freeze({
    production_id: p.production_id, revision: p.revision, title: p.title,
    panels: Object.freeze(p.panels.map((panel, index) => Object.freeze({
      panel_id: panel.panel_id, position: index + 1, description: panel.description,
      text: Object.freeze(panel.text.map((text, i) => Object.freeze({ ...text, position: i + 1 }))),
      asset_ids: panel.asset_ids, prompt_bindings: panel.prompt_bindings
    })))
  }), diagnostics: [] };
}

/** Verify an explicit adjacent revision or exact replay; never reads history. */
export function validateComicRevision(candidateSource, previousSource = null) {
  const candidate = record(candidateSource, ['comic-production', 'comic-public-release']);
  if (!candidate.valid) return candidate;
  const c = candidate.value;
  if (previousSource === null) {
    if (c.revision !== 1) return failure('PREDECESSOR_REQUIRED');
    return { ...candidate, relation: 'initial' };
  }
  const previous = record(previousSource, [c.kind]);
  if (!previous.valid) return previous;
  const p = previous.value;
  const key = c.kind === 'comic-production' ? 'production_id' : 'episode_id';
  if (c[key] !== p[key]) return failure('EPISODE_IDENTITY');
  if (c.revision === p.revision) {
    return equal(candidate.identity, previous.identity) ? { ...candidate, relation: 'unchanged' } : failure('IMMUTABLE_REVISION');
  }
  if (c.revision !== p.revision + 1) return failure('REVISION_ORDER');
  const expected = c.kind === 'comic-production' ? productionRef(previous) : releaseRef(previous);
  if (!equal(c.previous, expected)) return failure('PREDECESSOR_IDENTITY');
  if (c.kind === 'comic-public-release' && c.release_id === p.release_id) return failure('IMMUTABLE_RELEASE');
  return { ...candidate, relation: 'successor' };
}

/** Verify a supplied assignment's consistency, not its issuer or editorial authority. */
export function validateComicPublicationBinding(productionSource, releaseSource, assignmentSource) {
  const production = record(productionSource, ['comic-production']);
  if (!production.valid) return production;
  const release = record(releaseSource, ['comic-public-release']);
  if (!release.valid) return release;
  const assignment = fields(assignmentSource, ['production_id', 'episode_id']);
  if (!assignment.valid) return assignment;
  if (assignment.value.production_id !== production.value.production_id || assignment.value.episode_id !== release.value.episode_id) return failure('PUBLICATION_BINDING');
  if (production.value.title !== release.value.title) return failure('EPISODE_TITLE');
  // Returning protected identities separately never inserts them into public metadata.
  return { valid: true, production_identity: production.identity, release_identity: release.identity,
    metadata: metadata(release.value), diagnostics: [] };
}

/** Check consumer-facing metadata against an exact validated release candidate. */
export function validateComicEpisodeMetadata(releaseSource, metadataSource) {
  const release = record(releaseSource, ['comic-public-release']);
  if (!release.valid) return release;
  const provided = fields(metadataSource, ['episode_id', 'number', 'title', 'display_title', 'production_credit']);
  if (!provided.valid) return provided;
  const expected = metadata(release.value);
  return equal(provided.value, expected) ? { valid: true, metadata: expected, diagnostics: [] } : failure('EPISODE_METADATA');
}
