import { canonicalJson } from '../prompt-sdk/index.js';
import { fail, requireCondition as need } from './errors.js';
import { digest } from './request.js';
import { parseSourceJson } from './source-json.js';
import { validateNormalized } from './generated/source-v1.js';

function decode(bytes) {
  // Preserve an embedded U+FEFF, including when it begins a fragment; reject source BOM separately.
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { fail('INVALID_SOURCE'); }
}
function pointed(value, pointer) {
  if (pointer === '') return value;
  for (const key of pointer.slice(1).split('/').map(k => k.replaceAll('~1', '/').replaceAll('~0', '~'))) {
    need(value !== null && typeof value === 'object' && Object.hasOwn(value, key), 'INVALID_SOURCE');
    if (Array.isArray(value)) need(/^(0|[1-9][0-9]*)$/.test(key) && Number.isSafeInteger(Number(key)), 'INVALID_SOURCE');
    value = value[key];
  }
  return value;
}

// Internal pure transformation of the gate's private snapshots, never an authorization API.
export function normalizeVerifiedSources(context, loaded) {
  return Object.freeze(context.request.sources.map((source, index) => {
    const entry = loaded[index], artifact = context.selected[index].artifact;
    need(entry?.source_id === source.source_id && entry.bytes.length === artifact.byte_size
      && digest(entry.bytes) === artifact.sha256, 'SOURCE_INTEGRITY');
    const bytes = entry.bytes;
    need(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), 'INVALID_SOURCE');
    const text = decode(bytes); // Validate the entire artifact, even unselected fragments.
    const json = source.media_type === 'application/json' ? parseSourceJson(text) : undefined;
    const candidates = source.fragments.map(plan => {
      let content;
      if (source.media_type === 'text/plain') {
        const { start, end } = plan.fragment;
        need(start < end && end <= bytes.length, 'INVALID_SOURCE');
        // UTF-8 continuation bytes cannot start/end a complete code point.
        need((bytes[start] & 0xc0) !== 0x80 && (end === bytes.length || (bytes[end] & 0xc0) !== 0x80), 'INVALID_SOURCE');
        content = decode(bytes.subarray(start, end));
      } else content = pointed(json, plan.fragment.pointer);
      const representation = Buffer.from(source.media_type === 'text/plain' ? content : canonicalJson(content));
      return Object.freeze({ ...plan, classification: source.classification, content,
        byte_size: representation.length, sha256: digest(representation) });
    });
    const normalized = Object.freeze({ spec_version: '1.0.0', kind: 'context-normalized-source',
      build_id: context.request.build_id, request_identity: context.requestIdentity, source,
      normalization: context.request.policy.normalization, candidates: Object.freeze(candidates) });
    need(validateNormalized(normalized), 'INVALID_SOURCE');
    return normalized;
  }));
}
