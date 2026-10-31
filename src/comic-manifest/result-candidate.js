import { createHash } from 'node:crypto';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { parseComicManifestJson } from './parse-json.js';
import { validateLocalSemantics } from './semantics.js';
import { buildOutputCompatibility } from './output-compatibility.js';
import { validateComicManifest } from './validate.js';
import { result as schema } from './generated/result-v1.1-candidate.js';
const failure = code => ({ valid: false, diagnostics: [{ stage: 'candidate', code }] });
const same = (a, b) => canonicalJson(a) === canonicalJson(b);

/** Explicit, unreleased local candidate. The stable v1 entry point never selects it. */
export function validateComicBuildResultCandidate(source, productionSource) {
  const parsed = parseComicManifestJson(source);
  if (!parsed.valid) return parsed;
  try {
    if (!schema(parsed.value)) return failure('SCHEMA_INVALID');
  } catch { return failure('SCHEMA_INVALID'); }
  finally { schema.errors = null; }
  const value = parsed.value;
  const noOutput = value.execution.transformations.some(t => t.output_digests.length === 0);
  const code = validateLocalSemantics(value, noOutput);
  if (code) return failure(code);
  const production = validateComicManifest(productionSource);
  if (!production.valid || production.value.kind !== 'comic-production') return failure('PRODUCTION_INVALID');
  const p = production.value;
  if (!same(value.production, { production_id: p.production_id, revision: p.revision, identity: production.identity })
    || !same(value.inputs, p.inputs)) return failure('PRODUCTION_LINK');
  if (['public', 'internal', 'confidential', 'restricted'].indexOf(value.classification)
    < ['public', 'internal', 'confidential', 'restricted'].indexOf(p.classification)) return failure('CLASSIFICATION');
  if (noOutput && !same(value.execution.transformations[0].input_digests,
    [p.inputs.canon.artifact.sha256, p.inputs.prompts[0].identity.sha256])) return failure('ACTUAL_INPUTS');
  const compatible = buildOutputCompatibility(production, { value });
  if (compatible) return compatible;
  const canonical = canonicalJson(value);
  return { valid: true, value, diagnostics: [], identity: { canonicalization: 'studio-json-v1',
    byte_size: Buffer.byteLength(canonical), sha256: 'sha256:' + createHash('sha256').update(canonical).digest('hex') } };
}
