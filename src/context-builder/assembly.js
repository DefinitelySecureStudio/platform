import { canonicalJson, validateContextDocument } from '../prompt-sdk/index.js';
import { PreparationError, requireCondition as need } from './errors.js';
import { digest, equal, identity, rank, time } from './request.js';

const budget = value => { if (!value) throw new PreparationError('BUDGET_EXCEEDED', 'assembly'); };
const maximum = values => values.reduce((a, b) => rank(a) >= rank(b) ? a : b, 'public');
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

// Only gate-owned validated request/selection records enter this internal stage.
export function assembleSelection(context, selection, preparation) {
  const r = context.request;
  need(equal(selection.request_identity, context.requestIdentity) && selection.build_id === r.build_id
    && selection.policy === r.policy.selection && selection.slots.length === r.slots.length, 'INVALID_REQUEST');
  const planned = r.slots.map((slot, i) => {
    const selected = selection.slots[i];
    need(selected.slot === slot.name, 'INVALID_REQUEST');
    const entries = selected.candidates;
    need(slot.media_type !== 'application/json' || entries.length <= 1, 'INVALID_REQUEST');
    if (!entries.length) { need(!slot.required, 'REQUIRED_CONTEXT_MISSING'); return { slot, entries }; }
    // Normalization verified these byte counts. Check arithmetic before joined-content allocation.
    let byte_size = slot.media_type === 'text/plain' ? entries.length - 1 : 0;
    for (const entry of entries) { byte_size += entry.candidate.byte_size; budget(Number.isSafeInteger(byte_size)); }
    if (!byte_size) { need(!slot.required, 'REQUIRED_CONTEXT_MISSING'); return { slot, entries: [] }; }
    const section = { slot: slot.name, classification: maximum(entries.map(e => e.candidate.classification)),
      media_type: slot.media_type, byte_size,
      source_ids: [...new Set(entries.map(e => e.source.source_id))].sort() };
    return { slot, entries, section };
  });
  let total = 0;
  for (const { slot, section } of planned) if (slot.required) {
    budget(section.byte_size <= slot.max_bytes);
    total += section.byte_size; budget(Number.isSafeInteger(total) && total <= r.limits.total_content_bytes);
  }
  const sections = [], lineage = [], omissions = [], sources = new Map();
  for (const { slot, entries, section } of planned) {
    if (!section) { omissions.push({ slot: slot.name, code: 'OPTIONAL_EMPTY' }); continue; }
    if (!slot.required) {
      const next = total + section.byte_size;
      if (section.byte_size > slot.max_bytes || !Number.isSafeInteger(next) || next > r.limits.total_content_bytes) {
        omissions.push({ slot: slot.name, code: 'OPTIONAL_BUDGET' }); continue;
      }
      total = next;
    }
    const content = slot.media_type === 'text/plain'
      ? entries.map(e => e.candidate.content).join('\n') : entries[0].candidate.content;
    const bytes = Buffer.from(slot.media_type === 'text/plain' ? content : canonicalJson(content));
    need(bytes.length === section.byte_size, 'SOURCE_INTEGRITY');
    sections.push({ ...section, content, sha256: digest(bytes) });
    lineage.push({ slot: slot.name, candidates: entries.map(e => ({ source_id: e.source.source_id, candidate_id: e.candidate.candidate_id })) });
    for (const { source } of entries) sources.set(source.source_id, source);
  }
  need(sections.length > 0, 'REQUIRED_CONTEXT_MISSING');
  const contributing = [...sources.values()].sort((a, b) => a.source_id < b.source_id ? -1 : 1);
  const expires_at = [r.expires_at, preparation.expires_at, ...r.sources.map(s => s.expires_at)].sort()[0];
  const review_after = [expires_at, r.review_after, preparation.review_after, ...r.sources.map(s => s.review_after)].sort()[0];
  need(time(r.evaluation_time) < time(review_after) && time(review_after) <= time(expires_at), 'STALE_AUTHORITY');
  const manifest = { package: r.package, builder: r.builder, created_at: r.evaluation_time, review_after, expires_at,
    purpose: r.purpose, authority_reference: r.preparation_reference,
    classification: maximum([...contributing, ...sections].map(s => s.classification)), total_content_bytes: total,
    sources: contributing.map(s => ({ source_id: s.source_id, kind: s.kind, version: s.version,
      classification: s.classification, evidence_reference: s.evidence_reference,
      ...(s.reference.kind === 'public-artifact' ? { artifact: s.reference.artifact } : {}) })), sections };
  const packageDocument = { spec_version: '1.0.0', kind: 'context-package', manifest, manifest_identity: identity(manifest) };
  need(validateContextDocument(packageDocument).valid, 'INVALID_SOURCE');
  return freeze({ package: packageDocument, lineage, omissions });
}
