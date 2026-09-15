import { createHash } from 'node:crypto';
import { canonicalJson, validatePromptDefinition } from '../prompt-sdk/index.js';
import validateSchema from './generated/request-v1.js';
import { fail, requireCondition as need } from './errors.js';

export const uuid = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const rank = value => ['public', 'internal', 'confidential', 'restricted'].indexOf(value);
export const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
export const identity = value => {
  const bytes = canonicalJson(value);
  return { canonicalization: 'studio-json-v1', byte_size: Buffer.byteLength(bytes), sha256: digest(bytes) };
};
export const equal = (a, b) => canonicalJson(a) === canonicalJson(b);
export function time(value, code = 'INVALID_REQUEST') {
  need(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value), code);
  const parsed = Date.parse(value);
  need(Number.isFinite(parsed) && new Date(parsed).toISOString() === value.replace('Z', '.000Z'), code);
  return parsed;
}

// Accept explicit data, not class instances, getters, toJSON, sparse arrays or cycles.
// Bounded descriptor traversal prevents invoking accessors while taking a snapshot.
export function snapshot(value, code = 'INVALID_REQUEST') {
  let nodes = 0, chars = 0;
  const ancestors = new Set();
  function copy(v, depth) {
    need(++nodes <= 100000 && depth <= 64, code);
    if (typeof v === 'string') { chars += v.length; need(chars <= 2_000_000 && v.isWellFormed(), code); return v; }
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') { need(Number.isFinite(v), code); return v; }
    need(v && typeof v === 'object' && !ancestors.has(v), code);
    const prototype = Object.getPrototypeOf(v);
    need(Array.isArray(v) ? prototype === Array.prototype : prototype === Object.prototype || prototype === null, code);
    need(Object.getOwnPropertySymbols(v).length === 0, code);
    const descriptors = Object.getOwnPropertyDescriptors(v);
    const names = Object.keys(descriptors);
    need(names.length <= 100000, code);
    for (const name of names) need(Object.hasOwn(descriptors[name], 'value'), code);
    ancestors.add(v);
    let out;
    if (Array.isArray(v)) {
      need(v.length <= 100000 && names.length === v.length + 1, code);
      out = [];
      for (let i = 0; i < v.length; i++) { need(Object.hasOwn(descriptors, i), code); out.push(copy(descriptors[i].value, depth + 1)); }
    } else {
      out = {};
      for (const name of names) {
        chars += name.length; need(chars <= 2_000_000 && name.isWellFormed() && descriptors[name].enumerable, code);
        Object.defineProperty(out, name, { value: copy(descriptors[name].value, depth + 1), enumerable: true });
      }
    }
    ancestors.delete(v); return Object.freeze(out);
  }
  try { return copy(value, 0); } catch { fail(code); }
}

const orderedUnique = values => values.every((x, i) => i === 0 || values[i - 1] < x);
const pointerParts = x => x === '' ? [] : x.slice(1).split('/').map(p => p.replaceAll('~1', '/').replaceAll('~0', '~'));

export function validateInputs(requestValue, promptValue, callerId) {
  const request = snapshot(requestValue), prompt = snapshot(promptValue);
  need(validateSchema(request));
  need(typeof callerId === 'string' && uuid.test(callerId));
  need(request.caller_id === callerId, 'PREPARATION_DENIED');
  try { need(validatePromptDefinition(prompt).valid); } catch { fail('INVALID_REQUEST'); }
  need(equal(request.target, { id: prompt.id, version: prompt.version, identity: identity(prompt) }));
  need(time(request.evaluation_time) < time(request.review_after) && time(request.review_after) <= time(request.expires_at));
  need(orderedUnique(request.sources.map(s => s.source_id)) && orderedUnique(request.authority_ids));
  const plans = new Map();
  for (const source of request.sources) {
    need(time(source.not_before) < time(source.review_after) && time(source.review_after) <= time(source.expires_at));
    need(orderedUnique(source.fragments.map(f => f.candidate_id)));
    if (source.reference.kind === 'public-artifact') need(source.reference.artifact.media_type === source.media_type);
    for (const f of source.fragments) {
      need(!plans.has(f.candidate_id)); plans.set(f.candidate_id, source.source_id);
      if (source.media_type === 'text/plain') {
        need(f.fragment.unit === 'utf8-byte-range' && f.fragment.start < f.fragment.end);
        if (source.reference.kind === 'public-artifact') need(f.fragment.end <= source.reference.artifact.byte_size);
      } else need(f.fragment.unit === 'json-pointer' && !pointerParts(f.fragment.pointer).includes('-'));
    }
    // Sort a copy by position; fragments themselves retain their canonical ID order.
    if (source.media_type === 'text/plain') {
      const ranges = source.fragments.map(f => f.fragment).sort((a, b) => a.start - b.start);
      need(ranges.every((f, i) => i === 0 || ranges[i - 1].end <= f.start));
    } else {
      const paths = source.fragments.map(f => pointerParts(f.fragment.pointer));
      const trie = new Map();
      for (const path of paths) {
        let node = trie;
        for (const part of path) {
          need(!node.has(null));
          if (!node.has(part)) node.set(part, new Map());
          node = node.get(part);
        }
        need(node.size === 0); node.set(null, true);
      }
    }
  }
  need(plans.size <= request.limits.max_candidates);
  need(request.slots.length === prompt.context_slots.length);
  const names = new Set();
  request.slots.forEach((slot, i) => {
    const declared = prompt.context_slots[i];
    need(!names.has(slot.name)); names.add(slot.name);
    need(slot.name === declared.name && slot.required === declared.required);
    need(equal(slot.accepted_classifications, declared.accepted_classifications));
    need(declared.accepted_media_types.includes(slot.media_type));
    need(declared.max_bytes === undefined || slot.max_bytes <= declared.max_bytes);
    need(slot.selection.mode === request.policy.selection);
    if (slot.selection.mode === 'lexical-v1') need(slot.media_type === 'text/plain');
    else {
      need(slot.media_type !== 'application/json' || slot.selection.candidates.length <= 1);
      for (const c of slot.selection.candidates) need(plans.get(c.candidate_id) === c.source_id);
    }
  });
  return { request, prompt, requestIdentity: snapshot(identity(request)) };
}
