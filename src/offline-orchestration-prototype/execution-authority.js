import { types } from 'node:util';

export const SYNTHETIC_EXECUTION_PURPOSE = 'Run one bounded synthetic offline Comic Manifest attempt.';
export const SYNTHETIC_EXECUTION_ACTIONS = Object.freeze(['execute', 'retry']);
export const SYNTHETIC_EXECUTION_AUTHORITY_ID = 'studio.synthetic.offline-execution';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const FIELDS = ['decision_id', 'decision', 'action', 'purpose', 'production', 'not_before',
  'review_after', 'expires_at', 'authority_reference'];

function clone(value, seen = new WeakSet(), depth = 0, budget = { nodes: 0, chars: 0 }) {
  if (++budget.nodes > 64 || depth > 8) throw new TypeError();
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    budget.chars += value.length;
    if (budget.chars > 4096 || !value.isWellFormed()) throw new TypeError();
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || types.isProxy(value) || seen.has(value)) throw new TypeError();
  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value) ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    throw new TypeError();
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.getOwnPropertySymbols(value).length || Object.keys(descriptors).length > 16) throw new TypeError();
  seen.add(value);
  let output;
  if (Array.isArray(value)) {
    if (value.length > 2 || Object.keys(descriptors).length !== value.length + 1) throw new TypeError();
    output = [];
    for (let index = 0; index < value.length; index++) {
      const descriptor = descriptors[index];
      if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) throw new TypeError();
      output.push(clone(descriptor.value, seen, depth + 1, budget));
    }
  } else {
    output = {};
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw new TypeError();
      budget.chars += key.length;
      if (budget.chars > 4096) throw new TypeError();
      Object.defineProperty(output, key, {
        value: clone(descriptor.value, seen, depth + 1, budget), enumerable: true
      });
    }
  }
  seen.delete(value);
  return Object.freeze(output);
}

function validTime(value) {
  return typeof value === 'string' && TIMESTAMP.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value.replace('Z', '.000Z');
}

function validRecord(record) {
  const keys = record && Object.keys(record).sort().join('|');
  if (!record || (keys !== [...FIELDS].sort().join('|')
      && keys !== [...FIELDS, 'revocation'].sort().join('|'))
    || !UUID.test(record.decision_id) || !['allow', 'deny'].includes(record.decision)
    || !SYNTHETIC_EXECUTION_ACTIONS.includes(record.action)
    || record.purpose !== SYNTHETIC_EXECUTION_PURPOSE
    || !validTime(record.not_before) || !validTime(record.review_after) || !validTime(record.expires_at)
    || !(Date.parse(record.not_before) < Date.parse(record.review_after)
      && Date.parse(record.review_after) <= Date.parse(record.expires_at))
    || typeof record.authority_reference !== 'string' || !/^https:\/\//.test(record.authority_reference)) return false;
  const p = record.production;
  return p && Object.keys(p).sort().join('|') === 'identity_sha256|production_id|revision'
    && p.production_id === 'urn:uuid:10000000-0000-4000-8000-000000000001'
    && p.revision === 1 && SHA256.test(p.identity_sha256);
}

function sameProduction(left, right) {
  return left?.production_id === right?.production_id && left?.revision === right?.revision
    && left?.identity_sha256 === right?.identity_sha256;
}

/** Explicit synthetic host fixture. It never creates grants and supports in-memory revocation. */
export function createSyntheticExecutionAuthorityVerifier(decisions) {
  let records;
  try { records = clone(decisions); } catch { throw new TypeError('Invalid synthetic execution authority fixture.'); }
  if (!Array.isArray(records) || records.length === 0 || !records.every(validRecord)
    || new Set(records.map(item => item.decision_id)).size !== records.length
    || new Set(records.map(item => item.action)).size !== records.length) {
    throw new TypeError('Invalid synthetic execution authority fixture.');
  }
  const revoked = new Set();
  const verifier = Object.freeze({
    id: SYNTHETIC_EXECUTION_AUTHORITY_ID,
    mode: 'synthetic',
    async verify({ action, purpose, production, at }) {
      const matches = records.filter(item => item.action === action && item.purpose === purpose
        && sameProduction(item.production, production));
      if (matches.length !== 1) return null;
      const item = matches[0];
      return Object.freeze({ ...item, revocation: Object.freeze({
        status: revoked.has(item.decision_id) ? 'revoked' : 'active', checked_at: at
      }) });
    }
  });
  return Object.freeze({ verifier, revoke(decisionId) { revoked.add(decisionId); } });
}

export function validateExecutionAuthorityEvidence(value, { action, purpose, production, at }) {
  try {
    const evidence = clone(value);
    if (!validRecord(evidence) || evidence.decision !== 'allow' || evidence.action !== action
      || evidence.purpose !== purpose || !sameProduction(evidence.production, production)
      || !(Date.parse(evidence.not_before) <= Date.parse(at)
        && Date.parse(at) < Date.parse(evidence.review_after)
        && Date.parse(at) < Date.parse(evidence.expires_at))
      || !evidence.revocation
      || Object.keys(evidence.revocation).sort().join('|') !== 'checked_at|status'
      || evidence.revocation.checked_at !== at
      || !['active', 'revoked'].includes(evidence.revocation.status)) return false;
    return evidence.revocation.status === 'active';
  } catch {
    return false;
  }
}
