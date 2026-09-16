import { canonicalJson } from '../prompt-sdk/index.js';
import { requireCondition as need } from './errors.js';
import { digest, equal, rank, time } from './request.js';

const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const tokens = text => new Set(Array.from(text.matchAll(/[A-Za-z0-9]+/g), m => m[0].toLowerCase()));

// Internal transformation of gate-owned normalized records, NOT an authorization API.
// Never accept caller-supplied normalized records through the preparation facade.
export function selectNormalizedSources(context, normalizedSources) {
  const { request: r, requestIdentity } = context;
  const documents = new Map(normalizedSources.map(d => [d.source.source_id, d]));
  need(documents.size === r.sources.length && normalizedSources.length === r.sources.length, 'INVALID_SOURCE');
  const eligible = new Map(), claims = new Map(), ids = new Set();
  const at = time(r.evaluation_time);
  for (const source of r.sources) {
    const document = documents.get(source.source_id);
    need(document && equal(document.source, source) && equal(document.request_identity, requestIdentity)
      && document.build_id === r.build_id && document.normalization === r.policy.normalization
      && document.candidates.length === source.fragments.length, 'INVALID_SOURCE');
    const allowed = r.authority_ids.includes(source.authority_id) && source.continuity_id === r.continuity_id
      && time(source.not_before) <= at && at < time(source.review_after) && at < time(source.expires_at)
      && rank(source.classification) <= rank(r.max_classification);
    for (const [i, candidate] of document.candidates.entries()) {
      const plan = source.fragments[i];
      need(candidate.candidate_id === plan.candidate_id && !ids.has(candidate.candidate_id)
        && equal(candidate.fragment, plan.fragment) && candidate.claim_id === plan.claim_id
        && candidate.classification === source.classification, 'INVALID_SOURCE');
      ids.add(candidate.candidate_id);
      const bytes = Buffer.from(source.media_type === 'text/plain' ? candidate.content : canonicalJson(candidate.content));
      need(bytes.length === candidate.byte_size && digest(bytes) === candidate.sha256, 'SOURCE_INTEGRITY');
      if (!allowed) continue;
      // Claims are checked across all globally eligible candidates, even zero-score or unselected ones.
      if (candidate.claim_id !== undefined) {
        const identity = { media_type: source.media_type, byte_size: candidate.byte_size, sha256: candidate.sha256 };
        need(!claims.has(candidate.claim_id) || equal(claims.get(candidate.claim_id), identity), 'CONFLICT');
        claims.set(candidate.claim_id, identity);
      }
      eligible.set(candidate.candidate_id, Object.freeze({ source, candidate }));
    }
  }
  const omissions = [], slots = [];
  for (const slot of r.slots) {
    const accepts = entry => entry && entry.source.media_type === slot.media_type
      && slot.accepted_classifications.includes(entry.candidate.classification);
    let candidates;
    if (slot.selection.mode === 'explicit-v1') {
      candidates = slot.selection.candidates.map(pair => {
        const entry = eligible.get(pair.candidate_id);
        need(accepts(entry) && entry.source.source_id === pair.source_id, 'INELIGIBLE');
        return Object.freeze({ ...entry, score: null });
      });
    } else {
      const query = tokens(slot.selection.query);
      candidates = [];
      if (query.size) for (const entry of eligible.values()) {
        if (!accepts(entry)) continue;
        // Retain only query matches: bounded by the query, not a source-sized token index.
        const matched = new Set();
        for (const match of entry.candidate.content.matchAll(/[A-Za-z0-9]+/g)) {
          const token = match[0].toLowerCase();
          if (query.has(token)) matched.add(token);
          if (matched.size === query.size) break;
        }
        if (matched.size) candidates.push(Object.freeze({ ...entry, score: matched.size }));
      }
      candidates.sort((a, b) => b.score - a.score || compare(a.source.source_id, b.source.source_id)
        || compare(a.candidate.candidate_id, b.candidate.candidate_id));
      candidates = candidates.slice(0, slot.selection.max_candidates);
    }
    const present = candidates.length > 0 && (slot.media_type !== 'text/plain' || candidates.some(c => c.candidate.byte_size > 0));
    need(present || !slot.required, 'REQUIRED_CONTEXT_MISSING');
    if (!present) omissions.push(Object.freeze({ slot: slot.name, code: 'OPTIONAL_EMPTY' }));
    slots.push(Object.freeze({ slot: slot.name, candidates: Object.freeze(candidates) }));
  }
  return Object.freeze({ build_id: r.build_id, request_identity: requestIdentity, policy: r.policy.selection,
    slots: Object.freeze(slots), omissions: Object.freeze(omissions) });
}
