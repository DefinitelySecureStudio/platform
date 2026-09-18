import { createHash } from 'node:crypto';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import * as schema from './generated/schema-v1.js';
import { parseComicManifestJson } from './parse-json.js';
import { validateLocalSemantics } from './semantics.js';
const kinds = new Map([
  ['comic-production', schema.production], ['comic-build-result', schema.result],
  ['comic-public-release', schema.release], ['comic-approval-binding', schema.approval]
]);
const failure = (stage, code) => ({ valid: false, diagnostics: [{ stage, code }] });

/** Validate explicit raw JSON only. Success is record-local, never authorization. */
export function validateComicManifest(source) {
  const parsed = parseComicManifestJson(source);
  if (!parsed.valid) return parsed;
  const value = parsed.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return failure('schema', 'SCHEMA_INVALID');
  if (!Object.hasOwn(value, 'kind') || !Object.hasOwn(value, 'spec_version')) return failure('schema', 'SCHEMA_INVALID');
  if (!kinds.has(value.kind)) return failure('schema', 'UNSUPPORTED_KIND');
  if (value.spec_version !== '1.0.0') return failure('schema', 'UNSUPPORTED_VERSION');
  const validator = kinds.get(value.kind);
  try {
    if (!validator(value)) return failure('schema', 'SCHEMA_INVALID');
  } catch { return failure('schema', 'SCHEMA_INVALID'); }
  finally { validator.errors = null; } // Discard Ajv's potentially sensitive params/paths.
  const code = validateLocalSemantics(value);
  if (code) return failure('semantic', code);
  const canonical = canonicalJson(value);
  return {
    valid: true, value,
    identity: { canonicalization: 'studio-json-v1', byte_size: Buffer.byteLength(canonical), sha256: 'sha256:' + createHash('sha256').update(canonical).digest('hex') },
    diagnostics: []
  };
}
