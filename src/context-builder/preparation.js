import { PreparationError, fail, requireCondition as need } from './errors.js';
import { digest, equal, rank, snapshot, time, uuid, validateInputs } from './request.js';
import { normalizeVerifiedSources } from './normalize.js';
import { selectNormalizedSources } from './selection.js';
import { assembleSelection } from './assembly.js';
import { MAX_ARTIFACT_BYTES, MAX_NORMALIZATION_BYTES } from './source-readers.js';

const decisionFields = ['authority_mode', 'verifier_id', 'decision_id', 'decision', 'owner_id',
  'preparation_reference', 'request_identity', 'caller_id', 'target', 'purpose',
  'max_classification', 'not_before', 'review_after', 'expires_at', 'revocation'];
const exactKeys = (value, fields) => equal(Object.keys(value).sort(), [...fields].sort());
const abort = signal => { if (signal?.aborted) fail('CANCELLED'); };

/** Development-only gate. Host configuration and installed adapters are trusted code. */
export function createPreparationGate({ mode, verifier, decisionOwners, sourceBindings, getTime }) {
  need(mode === 'production' || mode === 'synthetic', 'AUTHORITY_UNVERIFIABLE');
  need(verifier && verifier.mode === mode && typeof verifier.id === 'string' && typeof verifier.verify === 'function', 'AUTHORITY_UNVERIFIABLE');
  need(mode !== 'production' || !verifier.id.startsWith('studio.synthetic.'), 'AUTHORITY_UNVERIFIABLE');
  need(typeof getTime === 'function', 'AUTHORITY_UNVERIFIABLE');
  const verifierId = verifier.id, verify = verifier.verify.bind(verifier);
  const audit = Object.freeze({ stage: 'authorization', outcome: 'verified', authority_mode: mode });
  const owners = snapshot(decisionOwners, 'AUTHORITY_UNVERIFIABLE');
  need(Array.isArray(owners) && owners.length > 0 && owners.every(x => typeof x === 'string' && uuid.test(x)), 'AUTHORITY_UNVERIFIABLE');
  need(Array.isArray(sourceBindings), 'AUTHORITY_UNVERIFIABLE');
  const bindings = new Map();
  const references = new Map();
  for (const binding of sourceBindings) {
    const source = snapshot(binding.source, 'AUTHORITY_UNVERIFIABLE');
    const artifact = snapshot(binding.artifact, 'AUTHORITY_UNVERIFIABLE');
    need(typeof source.source_id === 'string' && uuid.test(source.source_id) && !bindings.has(source.source_id), 'AUTHORITY_UNVERIFIABLE');
    need(exactKeys(artifact, ['byte_size', 'sha256', 'media_type']) && Number.isSafeInteger(artifact.byte_size) && artifact.byte_size > 0
      && /^sha256:[0-9a-f]{64}$/.test(artifact.sha256) && artifact.media_type === source.media_type, 'AUTHORITY_UNVERIFIABLE');
    need(typeof binding.read === 'function', 'AUTHORITY_UNVERIFIABLE');
    const locator = source.reference?.kind === 'public-artifact' ? source.reference.artifact.artifact_uri : source.reference?.handle;
    need(typeof locator === 'string', 'AUTHORITY_UNVERIFIABLE');
    const immutable = { version: source.version, artifact, kind: source.kind, classification: source.classification,
      authority_id: source.authority_id, continuity_id: source.continuity_id };
    need(!references.has(locator) || equal(references.get(locator), immutable), 'SOURCE_INTEGRITY');
    references.set(locator, immutable);
    // Never forward caller URIs, file paths, handles or reader options to a reader.
    bindings.set(source.source_id, { source, artifact, read: binding.read.bind(binding) });
  }

  function prepare(input) {
    const context = validateInputs(input.request, input.prompt, input.callerId);
    let total = 0;
    const selected = context.request.sources.map(source => {
      const binding = bindings.get(source.source_id);
      need(binding && equal(binding.source, source), 'PREPARATION_DENIED');
      if (source.reference.kind === 'public-artifact') {
        const { byte_size, sha256, media_type } = source.reference.artifact;
        need(equal({ byte_size, sha256, media_type }, binding.artifact), 'SOURCE_INTEGRITY');
      }
      total += binding.artifact.byte_size;
      need(Number.isSafeInteger(total) && total <= context.request.limits.total_source_bytes, 'BUDGET_EXCEEDED');
      return binding;
    });
    return { ...context, selected };
  }

  async function authorize(context, signal) {
    abort(signal);
    async function sampleTime() {
      let value;
      try { value = await getTime(); time(value, 'AUTHORITY_UNVERIFIABLE'); } catch { fail('AUTHORITY_UNVERIFIABLE'); }
      abort(signal);
      need(context.lastTime === undefined || time(value) >= time(context.lastTime), 'STALE_AUTHORITY');
      context.lastTime = value;
      return value;
    }
    let at;
    at = await sampleTime();
    abort(signal);
    const r = context.request;
    need(time(r.evaluation_time) <= time(at) && time(at) < time(r.review_after) && time(at) < time(r.expires_at), 'STALE_AUTHORITY');
    for (const source of r.sources) {
      need(rank(source.classification) <= rank(r.max_classification), 'PREPARATION_DENIED');
      need(time(source.not_before) <= time(at) && time(at) < time(source.review_after) && time(at) < time(source.expires_at), 'STALE_AUTHORITY');
    }
    let decision;
    try {
      decision = snapshot(await verify(Object.freeze({ request: r, requestIdentity: context.requestIdentity,
        callerId: r.caller_id, at, signal })), 'AUTHORITY_UNVERIFIABLE');
    } catch { abort(signal); fail('AUTHORITY_UNVERIFIABLE'); }
    abort(signal);
    need(decision && exactKeys(decision, decisionFields), 'AUTHORITY_UNVERIFIABLE');
    need(decision.authority_mode === mode && decision.verifier_id === verifierId
      && typeof decision.decision_id === 'string' && uuid.test(decision.decision_id)
      && owners.includes(decision.owner_id), 'AUTHORITY_UNVERIFIABLE');
    need(decision.decision === 'allow' || decision.decision === 'deny', 'AUTHORITY_UNVERIFIABLE');
    need(decision.decision === 'allow', 'PREPARATION_DENIED');
    need(equal(decision.request_identity, context.requestIdentity)
      && equal(decision.target, r.target) && decision.caller_id === r.caller_id
      && decision.purpose === r.purpose && decision.preparation_reference === r.preparation_reference
      && decision.max_classification === r.max_classification, 'PREPARATION_DENIED');
    const start = time(decision.not_before, 'AUTHORITY_UNVERIFIABLE'), review = time(decision.review_after, 'AUTHORITY_UNVERIFIABLE'), end = time(decision.expires_at, 'AUTHORITY_UNVERIFIABLE');
    need(start < review && review <= end, 'AUTHORITY_UNVERIFIABLE');
    need(start <= time(at) && time(at) < review && time(at) < end, 'STALE_AUTHORITY');
    need(decision.revocation && exactKeys(decision.revocation, ['status', 'checked_at'])
      && decision.revocation.checked_at === at, 'AUTHORITY_UNVERIFIABLE');
    need(decision.revocation.status === 'active' || decision.revocation.status === 'revoked', 'AUTHORITY_UNVERIFIABLE');
    need(decision.revocation.status === 'active', 'PREPARATION_DENIED');
    // A slow verifier must not let a grant expire before the reader is invoked.
    const current = time(await sampleTime());
    need(current < review && current < end && current < time(r.review_after) && current < time(r.expires_at)
      && r.sources.every(s => current < time(s.review_after) && current < time(s.expires_at)), 'STALE_AUTHORITY');
    // These are protected lifecycle bounds, not a public receipt or reusable grant.
    return Object.freeze({ review_after: [r.review_after, decision.review_after, ...r.sources.map(s => s.review_after)].sort()[0],
      expires_at: [r.expires_at, decision.expires_at, ...r.sources.map(s => s.expires_at)].sort()[0] });
  }

  async function readApproved(context, signal) {
    abort(signal);
    const sources = [];
    let bounds;
    const narrow = next => {
      bounds = bounds ? Object.freeze({ review_after: [bounds.review_after, next.review_after].sort()[0],
        expires_at: [bounds.expires_at, next.expires_at].sort()[0] }) : next;
    };
    for (const binding of context.selected) {
      narrow(await authorize(context, signal));
      need(time(context.lastTime) < time(bounds.review_after) && time(context.lastTime) < time(bounds.expires_at), 'STALE_AUTHORITY');
      abort(signal);
      let result;
      try { result = await binding.read(Object.freeze({ maxBytes: binding.artifact.byte_size, signal })); }
      catch (error) {
        abort(signal);
        // Reconstruct known adapter failures; never forward arbitrary reader errors/evidence.
        if (error instanceof PreparationError && ['SOURCE_INTEGRITY', 'BUDGET_EXCEEDED', 'SOURCE_UNAVAILABLE', 'CANCELLED'].includes(error.diagnostic?.code)) fail(error.diagnostic.code);
        fail('SOURCE_UNAVAILABLE');
      }
      abort(signal);
      let bytes;
      try {
        need(result instanceof Uint8Array && result.byteLength === binding.artifact.byte_size, 'SOURCE_INTEGRITY');
        // Copy before further awaits so reader-owned mutable buffers cannot change delivered bytes.
        bytes = Buffer.from(result);
        need(digest(bytes) === binding.artifact.sha256, 'SOURCE_INTEGRITY');
      } catch { fail('SOURCE_INTEGRITY'); }
      sources.push(Object.freeze({ source_id: binding.source.source_id, bytes }));
    }
    // Covers revocation/expiry while the last reader was running; partial reads are never returned.
    narrow(await authorize(context, signal));
    need(time(context.lastTime) < time(bounds.review_after) && time(context.lastTime) < time(bounds.expires_at), 'STALE_AUTHORITY');
    abort(signal);
    return Object.freeze({ authority_mode: mode, preparation: bounds, sources: Object.freeze(sources), audit });
  }

  return Object.freeze({
    // Informational check only: readSources never accepts its result as authority.
    async check(input) {
      try {
        const bounds = await authorize(prepare(input), input.signal);
        return Object.freeze({ authorized: true, authority_mode: mode, preparation: bounds, audit });
      } catch (error) { if (error instanceof PreparationError) throw error; fail('AUTHORITY_UNVERIFIABLE'); }
    },
    readSources: async input => {
      try { return await readApproved(prepare(input), input.signal); }
      catch (error) { if (error instanceof PreparationError) throw error; fail('AUTHORITY_UNVERIFIABLE'); }
    },
    normalizeSources: input => normalizeOrSelect(input, false),
    selectSources: input => normalizeOrSelect(input, true),
    assemblePackage: input => normalizeOrSelect(input, 'assemble')
  });

  async function normalizeOrSelect(input, select) {
    try {
      // Snapshot and reject resource excess before any source read, not after parsing.
      const context = prepare(input), signal = input.signal;
      need(context.selected.every(b => b.artifact.byte_size <= MAX_ARTIFACT_BYTES)
        && context.selected.reduce((n, b) => n + b.artifact.byte_size, 0) <= MAX_NORMALIZATION_BYTES, 'BUDGET_EXCEEDED');
      const loaded = await readApproved(context, signal);
      abort(signal);
      const normalizedSources = normalizeVerifiedSources(context, loaded.sources);
      const selection = select ? selectNormalizedSources(context, normalizedSources) : undefined;
      // Complete assembly before the final authorization check. Rebuild with narrowed bounds below.
      const assembled = select === 'assemble' ? assembleSelection(context, selection, loaded.preparation) : undefined;
      const finalBounds = await authorize(context, signal);
      const preparation = Object.freeze({ review_after: [loaded.preparation.review_after, finalBounds.review_after].sort()[0],
        expires_at: [loaded.preparation.expires_at, finalBounds.expires_at].sort()[0] });
      need(time(context.lastTime) < time(preparation.review_after) && time(context.lastTime) < time(preparation.expires_at), 'STALE_AUTHORITY');
      abort(signal);
      return Object.freeze({ authority_mode: mode, preparation,
        ...(select === 'assemble' ? equal(preparation, loaded.preparation) ? assembled : assembleSelection(context, selection, preparation)
          : select ? { selection } : { normalizedSources }), audit });
    } catch (error) { if (error instanceof PreparationError) throw error; fail('INVALID_SOURCE'); }
  }
}
