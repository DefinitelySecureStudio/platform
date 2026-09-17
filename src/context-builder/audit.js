import { canonicalJson } from '../prompt-sdk/index.js';
import { identity, equal, snapshot, time, uuid, validateInputs } from './request.js';
import { PreparationError, fail, requireCondition as need } from './errors.js';
import { validateResult, validateReceipt } from './generated/audit-v1.js';

async function boundedDeliver(deliver, record, timeoutMs, signal) {
  need(Buffer.byteLength(canonicalJson(record)) <= 1024 * 1024, 'AUDIT_REQUIRED');
  if (signal?.aborted) fail('CANCELLED');
  const controller = new AbortController(); let timer, listener;
  try {
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new PreparationError('AUDIT_REQUIRED')); }, timeoutMs);
      listener = () => { controller.abort(); reject(new PreparationError('CANCELLED')); };
      signal?.addEventListener('abort', listener, { once: true });
    });
    const ack = snapshot(await Promise.race([deadline, Promise.resolve().then(() => deliver(record, { signal: controller.signal }))]), 'AUDIT_REQUIRED');
    need(ack && equal(Object.keys(ack).sort(), ['evidence_reference', 'record_identity'])
      && uuid.test(ack.evidence_reference) && equal(ack.record_identity, identity(record))
      && !canonicalJson(record).includes(ack.evidence_reference), 'AUDIT_REQUIRED');
    return ack;
  } catch (error) {
    if (error instanceof PreparationError && error.diagnostic.code === 'CANCELLED') throw error;
    fail('AUDIT_REQUIRED');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', listener); }
}

export function createAuditedContextBuilder({ gate, mode, sink, getTime, timeoutMs = 1000 }) {
  need(['synthetic', 'production'].includes(mode) && gate?.authority_mode === mode
    && sink?.mode === mode && typeof sink.deliver === 'function' && typeof getTime === 'function'
    && Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000, 'AUTHORITY_UNVERIFIABLE');
  need(mode !== 'production' || (typeof sink.id === 'string' && sink.id.length > 0
    && !sink.id.startsWith('studio.synthetic.')), 'AUTHORITY_UNVERIFIABLE');
  const deliver = sink.deliver.bind(sink);
  return Object.freeze({ async build(input) {
    // Invalid transport/request data cannot be assigned fabricated build evidence.
    const context = validateInputs(input.request, input.prompt, input.callerId), r = context.request;
    const safeInput = Object.freeze({ request: r, prompt: context.prompt, callerId: r.caller_id, signal: input.signal });
    let last;
    async function now() {
      let value; try { value = await getTime(); time(value); } catch { fail('AUTHORITY_UNVERIFIABLE'); }
      need(last === undefined || time(value) >= time(last), 'STALE_AUTHORITY'); last = value; return value;
    }
    const base = { spec_version: '1.0.0', kind: 'context-build-result', build_id: r.build_id,
      correlation_id: r.correlation_id, request_identity: context.requestIdentity };
    let started_at;
    try { started_at = await now(); }
    catch {
      return Object.freeze({ ...base, status: 'failed', diagnostics: Object.freeze([
        new PreparationError('AUTHORITY_UNVERIFIABLE').diagnostic, new PreparationError('AUDIT_REQUIRED').diagnostic]) });
    }
    const common = { format: 'studio-builder-audit-v1', authority_mode: mode, build_id: r.build_id,
      correlation_id: r.correlation_id, request_identity: context.requestIdentity,
      builder: r.builder, policy: r.policy, target: r.target, preparation_reference: r.preparation_reference,
      purpose_identity: identity(r.purpose), sources: r.sources.map(s => ({ source_id: s.source_id,
        version: s.version, classification: s.classification })), budgets: { limits: r.limits,
        slots: r.slots.map(s => ({ slot: s.name, required: s.required, max_bytes: s.max_bytes })) }, started_at };
    const references = new Set();
    const send = async (phase, details = {}) => {
      const ack = await boundedDeliver(deliver,
        snapshot({ ...common, phase, observed_at: await now(), ...details }, 'AUDIT_REQUIRED'), timeoutMs, safeInput.signal);
      need(!references.has(ack.evidence_reference), 'AUDIT_REQUIRED'); references.add(ack.evidence_reference);
      return ack;
    };
    try {
      await send('attempt');
      const prepared = await gate.prepareArtifact(safeInput), p = prepared.artifact.prepared;
      need(p.authority_mode === mode, 'AUTHORITY_UNVERIFIABLE');
      const ack = await send('prepared', { input_identity: prepared.artifact.input_identity,
        artifact_identity: prepared.artifact_identity, package_identity: p.package.manifest_identity,
        package: p.package.manifest.package, classification: p.package.manifest.classification,
        total_content_bytes: p.package.manifest.total_content_bytes, preparation: p.preparation,
        lineage: p.lineage, omissions: p.omissions });
      // The audit describes an exact package. Do not silently replace it if policy narrows during delivery.
      const checked = await gate.check(safeInput), at = await now();
      need(time(at) >= time(checked.checked_at) && time(at) < time(p.preparation.review_after) && time(at) < time(p.preparation.expires_at)
        && time(checked.preparation.review_after) >= time(p.preparation.review_after)
        && time(checked.preparation.expires_at) >= time(p.preparation.expires_at), 'STALE_AUTHORITY');
      if (safeInput.signal?.aborted) fail('CANCELLED');
      const result = Object.freeze({ ...base, status: 'prepared', diagnostics: Object.freeze([]),
        package: p.package, lineage: p.lineage, omissions: p.omissions, evidence_reference: ack.evidence_reference });
      need(validateResult(result), 'AUDIT_REQUIRED'); return result;
    } catch (error) {
      const diagnostic = error instanceof PreparationError ? error.diagnostic : new PreparationError('AUTHORITY_UNVERIFIABLE').diagnostic;
      const diagnostics = [diagnostic];
      if (!['AUDIT_REQUIRED', 'CANCELLED'].includes(diagnostic.code)) {
        try { await send('failed', { diagnostics }); }
        catch { diagnostics.push(new PreparationError('AUDIT_REQUIRED').diagnostic); }
      }
      const result = Object.freeze({ ...base, status: 'failed', diagnostics: Object.freeze(diagnostics) });
      need(validateResult(result), 'AUDIT_REQUIRED'); return result;
    }
  } });
}

// Synthetic host-only sink. Records are protected and bounded, never public logs.
export function createSyntheticAuditSink({ makeReference, maxRecords = 128 }) {
  need(typeof makeReference === 'function' && Number.isSafeInteger(maxRecords) && maxRecords > 0);
  const records = [], seen = new Set();
  return Object.freeze({ id: 'studio.synthetic.audit', mode: 'synthetic', records: () => Object.freeze([...records]), async deliver(record, { signal }) {
    if (signal?.aborted) fail('CANCELLED');
    need(records.length < maxRecords, 'AUDIT_REQUIRED');
    const safe = snapshot(record), reference = makeReference();
    need(Buffer.byteLength(canonicalJson(safe)) <= 1024 * 1024, 'AUDIT_REQUIRED');
    need(typeof reference === 'string' && uuid.test(reference) && !seen.has(reference)
      && !canonicalJson(safe).includes(reference), 'AUDIT_REQUIRED');
    seen.add(reference); records.push(Object.freeze({ evidence_reference: reference, record: safe }));
    return Object.freeze({ evidence_reference: reference, record_identity: identity(safe) });
  } });
}

// Synthetic allowlist is separately supplied publication approval, not Builder authority.
export function createSyntheticAttestor({ approvedResultIdentities, makeReference, authorizeResolve, maxReceipts = 128 }) {
  const approved = snapshot(approvedResultIdentities);
  need(Array.isArray(approved) && typeof makeReference === 'function' && typeof authorizeResolve === 'function'
    && Number.isSafeInteger(maxReceipts) && maxReceipts > 0);
  const registry = new Map();
  return Object.freeze({
    mode: 'synthetic',
    issue(result) {
      need(validateResult(result) && result.status === 'prepared'
        && approved.some(x => equal(x, identity(result))), 'PREPARATION_DENIED');
      need(registry.size < maxReceipts, 'AUDIT_REQUIRED');
      const reference = makeReference();
      need(typeof reference === 'string' && uuid.test(reference) && !registry.has(reference)
        && !canonicalJson(result).includes(reference), 'AUDIT_REQUIRED');
      const receipt = Object.freeze({ spec_version: '1.0.0', kind: 'context-build-public-receipt', attestation_reference: reference });
      need(validateReceipt(receipt), 'AUDIT_REQUIRED');
      registry.set(reference, Object.freeze({ result_identity: Object.freeze(identity(result)), evidence_reference: result.evidence_reference }));
      return receipt;
    },
    verify(receipt) { return validateReceipt(receipt) && registry.has(receipt.attestation_reference); },
    async resolve(receipt, { callerId }) {
      need(validateReceipt(receipt) && registry.has(receipt.attestation_reference), 'PREPARATION_DENIED');
      let allowed;
      try { allowed = await authorizeResolve(Object.freeze({ callerId, attestation_reference: receipt.attestation_reference })); }
      catch { fail('AUTHORITY_UNVERIFIABLE'); }
      need(allowed === true, 'PREPARATION_DENIED'); return registry.get(receipt.attestation_reference);
    }
  });
}
