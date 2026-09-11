import { createHash } from 'node:crypto';
import { canonicalJson } from './canonical-json.js';
import validateSchema from './generated/provenance-v1-schema.js';
import { validateExecutionDocument } from './validate-execution.js';
import { validateStructuredOutputDocument } from './structured-output.js';

const pick = (value, keys) => Object.fromEntries(keys.filter(key => value?.[key] !== undefined).map(key => [key, structuredClone(value[key])]));
function identity(value) {
  const text = canonicalJson(value);
  return { byte_size: Buffer.byteLength(text), sha256: `sha256:${createHash('sha256').update(text).digest('hex')}` };
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function summary(validation) {
  if (validation === undefined) return { status: 'not-run', errors: 0, warnings: 0 };
  if (typeof validation?.valid !== 'boolean' || !Array.isArray(validation.diagnostics)) throw new Error('Invalid validation evidence');
  const errors = validation.diagnostics.filter(x => x.severity === 'error').length;
  const warnings = validation.diagnostics.filter(x => x.severity === 'warning').length;
  if (validation.valid !== (errors === 0)) throw new Error('Inconsistent validation evidence');
  return { status: validation.valid ? 'passed' : 'failed', errors, warnings };
}
export function validateExecutionProvenance(document) {
  try {
    canonicalJson(document);
    if (!validateSchema(document)) return false;
    return canonicalJson(identity(document.record)) === canonicalJson(document.identity);
  } catch { return false; }
}

export function createExecutionProvenance(request, result, { effectiveParameters, validation, structuredOutput, contentIdentities = 'public-only' } = {}) {
  if (!validateExecutionDocument(request).valid || request.kind !== 'execution-request' || !validateExecutionDocument(result).valid || result.kind !== 'execution-result') throw new Error('Invalid execution provenance inputs');
  if (request.execution_id !== result.execution_id || request.correlation_id !== result.correlation_id) throw new Error('Execution provenance correlation mismatch');
  if (!['public-only', 'omit'].includes(contentIdentities)) throw new Error('Invalid provenance identity policy');
  let structured = { status: 'not-run' };
  if (structuredOutput !== undefined) {
    if (!validateStructuredOutputDocument(structuredOutput).valid || structuredOutput.execution_id !== result.execution_id || canonicalJson(structuredOutput.expectation) !== canonicalJson(request.expected_output) || !result.output || structuredOutput.raw.sha256 !== result.output.sha256 || structuredOutput.raw.byte_size !== result.output.byte_size) throw new Error('Structured output provenance mismatch');
    structured = { status: structuredOutput.status, processing_id: structuredOutput.processing_id };
  }
  const publicIdentities = contentIdentities === 'public-only';
  const contexts = [];
  for (const context of request.rendered_prompt.contexts) {
    if (!publicIdentities || request.rendered_prompt.classification !== 'public' || context.classification !== 'public') continue;
    const safe = pick(context, ['slot', 'classification']);
    if (context.package) {
      safe.package = pick(context.package.package, ['id', 'version', 'instance_id', 'manifest_sha256']);
      safe.sources = context.package.sources.map(source => pick(source, ['source_id', 'version', 'kind', 'classification']));
    }
    contexts.push(safe);
  }
  const parameters = effectiveParameters ?? request.parameters;
  const record = {
    ...pick(request, ['execution_id', 'correlation_id']),
    prompt: pick(request.rendered_prompt.definition, ['id', 'version', 'spec_version']),
    contexts, redacted_context_count: request.rendered_prompt.contexts.length - contexts.length,
    target: pick(request.target, ['adapter_id', 'provider_id', 'model_id']),
    identity: pick(result.identity, ['adapter_id', 'adapter_version', 'provider_id', 'model_id', 'model_revision']),
    parameters: pick(parameters, ['max_output_tokens', 'temperature', 'top_p', 'seed']),
    parameters_status: effectiveParameters === undefined ? 'not-resolved' : 'resolved',
    stop_sequence_count: parameters.stop_sequences?.length ?? 0,
    timing: pick(result.timing, ['started_at', 'completed_at', 'duration_ms']),
    status: result.status, finish_reason: result.finish_reason,
    validation: summary(validation), structured_output: structured,
    policy: { content_identities: contentIdentities, bodies: 'omitted' }
  };
  if (result.usage) record.usage = pick(result.usage, ['provider_reported', 'input_tokens', 'output_tokens', 'total_tokens']);
  if (publicIdentities && request.rendered_prompt.classification === 'public') record.rendered = pick(request.rendered_prompt, ['byte_size', 'sha256']);
  if (publicIdentities && result.output?.classification === 'public') record.output = pick(result.output, ['byte_size', 'sha256']);
  const document = { spec_version: '1.0.0', kind: 'execution-provenance', record, identity: identity(record) };
  if (!validateExecutionProvenance(document)) throw new Error('Invalid execution provenance record');
  return freeze(document);
}

export class LocalExecutionObserver {
  #records = [];
  #capacity;
  constructor({ capacity = 100 } = {}) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) throw new TypeError('Observer capacity must be positive');
    this.#capacity = capacity;
  }
  async observe(record) {
    if (!validateExecutionProvenance(record)) throw new Error('Invalid observer record');
    this.#records.push(structuredClone(record));
    if (this.#records.length > this.#capacity) this.#records.shift();
  }
  snapshot() { return structuredClone(this.#records); }
  clear() { this.#records = []; }
}

export async function deliverExecutionProvenance(observer, document, timeoutMs = 1000) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) return false;
  let timer;
  try {
    await Promise.race([
      Promise.resolve().then(() => observer.observe(document)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Observer timeout')), timeoutMs); })
    ]);
    return true;
  } catch { return false; }
  finally { clearTimeout(timer); }
}
