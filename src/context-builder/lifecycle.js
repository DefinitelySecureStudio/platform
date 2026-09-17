import { canonicalJson } from '../prompt-sdk/index.js';
import { identity, equal, snapshot, time } from './request.js';
import { fail, requireCondition as need } from './errors.js';

// Host-only protected storage, not a caller-facing API. No disk, implicit clock or timers.
export function createMemoryArtifactStore({ authorizeAccess, retentionSeconds, maxEntries = 32, maxBytes = 64 * 1024 * 1024 }) {
  need(typeof authorizeAccess === 'function' && Number.isSafeInteger(retentionSeconds) && retentionSeconds > 0
    && Number.isSafeInteger(maxEntries) && maxEntries > 0 && Number.isSafeInteger(maxBytes) && maxBytes > 0);
  const entries = new Map(); let size = 0;
  const remove = key => { const e = entries.get(key); if (e) { size -= e.bytes; entries.delete(key); } };
  async function access(operation, scope, at) {
    time(at); const safeScope = snapshot(scope);
    let allowed;
    try { allowed = await authorizeAccess(Object.freeze({ operation, scope: safeScope, at })); }
    catch { fail('AUTHORITY_UNVERIFIABLE'); }
    need(allowed === true, 'PREPARATION_DENIED');
    return canonicalJson(safeScope);
  }
  return Object.freeze({
    async get({ scope, at, history = false }) {
      const key = await access(history ? 'history' : 'reuse', scope, at), e = entries.get(key);
      if (!e) return undefined;
      need(time(at) >= e.createdAt, 'STALE_AUTHORITY');
      if (time(at) >= e.retainUntil) { remove(key); return undefined; }
      if (!history && time(at) >= time(e.reuseUntil)) return undefined;
      // Immutable strings cannot be changed by the adapter's consumer.
      return e.serialized;
    },
    async put({ scope, at, reuseUntil, serialized }) {
      const key = await access('retain', scope, at);
      need(typeof serialized === 'string' && time(at) < time(reuseUntil), 'STALE_AUTHORITY');
      const bytes = Buffer.byteLength(serialized);
      need(bytes <= maxBytes, 'BUDGET_EXCEEDED');
      const retainUntil = time(at) + retentionSeconds * 1000;
      need(Number.isSafeInteger(retainUntil), 'INVALID_REQUEST');
      // Same immutable key cannot be overwritten or have its retention/reuse lease renewed.
      const existing = entries.get(key);
      if (existing && time(at) < existing.retainUntil) {
        need(existing.serialized === serialized, 'SOURCE_INTEGRITY'); return;
      }
      remove(key);
      while (entries.size >= maxEntries || size + bytes > maxBytes) remove(entries.keys().next().value);
      entries.set(key, { serialized, bytes, reuseUntil, retainUntil, createdAt: time(at) }); size += bytes;
    },
    async evict({ scope, at }) { const key = await access('evict', scope, at); remove(key); },
    async cleanup({ at }) {
      await access('cleanup', null, at);
      for (const [key, e] of entries) if (time(at) >= e.retainUntil) remove(key);
    }
  });
}

// Local versioned envelope, not a Codex build result, grant or public receipt.
export function preparedArtifact(context, result) {
  const artifact = Object.freeze({ format: 'studio-prepared-artifact-v1', request_identity: context.requestIdentity,
    input_identity: Object.freeze(identity({ request: context.request, artifacts: context.selected.map(b => b.artifact) })),
    prepared: result });
  return Object.freeze({ artifact, artifact_identity: Object.freeze(identity(artifact)), serialized: canonicalJson(artifact) });
}

export function comparePreparedArtifacts(left, right) {
  for (const value of [left, right]) need(equal(identity(value.artifact), value.artifact_identity)
    && canonicalJson(value.artifact) === value.serialized, 'SOURCE_INTEGRITY');
  return Object.freeze({ identical: equal(left.artifact_identity, right.artifact_identity),
    same_inputs: equal(left.artifact.input_identity, right.artifact.input_identity),
    same_request: equal(left.artifact.request_identity, right.artifact.request_identity),
    same_package: equal(left.artifact.prepared.package.manifest_identity, right.artifact.prepared.package.manifest_identity) });
}
