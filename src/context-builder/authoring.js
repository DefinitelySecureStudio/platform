import { canonicalJson, validateContextDocument } from '../prompt-sdk/index.js';
import { validateInputs, identity, equal, digest, snapshot, time } from './request.js';
import { requireCondition as need } from './errors.js';
import { parseSourceJson } from './source-json.js';
import { validateResult } from './generated/audit-v1.js';
import { createPreparationGate } from './preparation.js';
import { createMemorySourceBinding, createApprovedExportBinding } from './source-readers.js';
import { createSyntheticPreparationVerifier } from './synthetic-verifier.js';
import { createAuditedContextBuilder, createSyntheticAuditSink } from './audit.js';
import { randomUUID } from 'node:crypto';

export const parseBuilderJson = text => snapshot(parseSourceJson(text));
export function inspectBuildRequest({ request, prompt }) {
  const c = validateInputs(request, prompt, request.caller_id);
  return Object.freeze({ valid: true, sources: c.request.sources.length, slots: c.request.slots.length,
    candidates: c.request.sources.reduce((n, s) => n + s.fragments.length, 0), authority: 'not-checked', reads: 'input-files-only' });
}
export function createSyntheticFixtureBuilder({ fixture, authority, at }) {
  const f = snapshot(fixture), a = snapshot(authority); time(at);
  need(a.mode === 'synthetic' && equal(Object.keys(a).sort(), ['decisionOwners', 'decisions', 'mode']));
  inspectBuildRequest(f); need(Array.isArray(f.raw_sources) && f.raw_sources.length === f.request.sources.length);
  const bindings = f.request.sources.map((source, i) => {
    const raw = f.raw_sources[i]; need(raw.source_id === source.source_id && typeof raw.text === 'string');
    const bytes = Buffer.from(raw.text), artifact = { media_type: source.media_type, byte_size: bytes.length, sha256: digest(bytes) };
    if (source.kind === 'approved-private') return createApprovedExportBinding({ source, artifact,
      readExport: async () => (async function* () { yield bytes; })() });
    return createMemorySourceBinding({ source, artifact, bytes });
  });
  const { verifier } = createSyntheticPreparationVerifier(a.decisions);
  const gate = createPreparationGate({ mode: 'synthetic', verifier, decisionOwners: a.decisionOwners,
    sourceBindings: bindings, getTime: () => at });
  const sink = createSyntheticAuditSink({ makeReference: () => `urn:uuid:${randomUUID()}` });
  const builder = createAuditedContextBuilder({ gate, mode: 'synthetic', sink, getTime: () => at });
  return Object.freeze({ build: () => builder.build({ request: f.request, prompt: f.prompt, callerId: f.request.caller_id }) });
}

export function createBuildArtifact(result) {
  need(validateResult(result) && result.status === 'prepared' && validateContextDocument(result.package).valid);
  return snapshot({ format: 'studio-builder-cli-artifact-v1', result, result_identity: identity(result) });
}
export function verifyBuildArtifact(value) {
  const a = snapshot(value);
  need(equal(Object.keys(a).sort(), ['format', 'result', 'result_identity']) && a.format === 'studio-builder-cli-artifact-v1'
    && validateResult(a.result) && a.result.status === 'prepared' && validateContextDocument(a.result.package).valid
    && equal(a.result_identity, identity(a.result)), 'SOURCE_INTEGRITY');
  return a;
}
export function compareBuildArtifacts(left, right) {
  const stable = value => {
    const r = verifyBuildArtifact(value).result;
    // Independently assigned audit evidence references must differ across real replays.
    return { build_id: r.build_id, correlation_id: r.correlation_id, request_identity: r.request_identity,
      package: r.package, lineage: r.lineage, omissions: r.omissions };
  };
  return equal(stable(left), stable(right));
}
export const serializeBuildArtifact = value => canonicalJson(verifyBuildArtifact(value));
