import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateContextDocument } from '../prompt-sdk/context-packages.js';

export const SYNTHETIC_CONTEXT_USE_AUTHORITY_ID = 'studio.synthetic.comic-context-use';
export const SYNTHETIC_CONTEXT_USE_PURPOSE = 'Use the pinned synthetic Context Builder package in the offline Comic Manifest fixture.';
export const SYNTHETIC_CONTEXT_READER_SLOTS = Object.freeze([
  'canon', 'dependency-0', 'dependency-1', 'prompt-description', 'context-package', 'builder-result'
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URN_UUID = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const CLASSIFICATIONS = ['public', 'internal', 'confidential', 'restricted'];
const PACKAGE_REVIEW_AFTER = '2026-09-16T00:00:00Z';
const PACKAGE_EXPIRES_AT = '2026-09-17T00:00:00Z';
const REQUEST_FIELDS = ['action', 'production', 'prompt', 'package', 'builder_result_identity', 'purpose', 'sections',
  'classification', 'preparation_reference', 'historical_use_authorization_reference'];
const RECORD_FIELDS = ['decision_id', 'decision', 'request', 'authorization', 'not_before', 'review_after', 'expires_at', 'authority_reference'];
const same = (a, b) => canonicalJson(a) === canonicalJson(b);
const stamp = value => typeof value === 'string' && STAMP.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value.replace('Z', '.000Z');
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && same(Object.keys(value).sort(), [...keys].sort());
const freezeDeep = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freezeDeep(child, seen);
  return Object.freeze(value);
};

function validRequest(request) {
  return exactKeys(request, REQUEST_FIELDS)
    && ['execute', 'retry'].includes(request.action)
    && exactKeys(request.production, ['production_id', 'revision', 'identity_sha256'])
    && request.production.production_id === 'urn:uuid:10000000-0000-4000-8000-000000000001'
    && request.production.revision === 1 && typeof request.production.identity_sha256 === 'string'
    && SHA256.test(request.production.identity_sha256)
    && exactKeys(request.prompt, ['id', 'version', 'identity'])
    && typeof request.prompt.id === 'string' && typeof request.prompt.version === 'string'
    && exactKeys(request.prompt.identity, ['canonicalization', 'byte_size', 'sha256'])
    && request.prompt.identity.canonicalization === 'studio-json-v1'
    && Number.isSafeInteger(request.prompt.identity.byte_size) && request.prompt.identity.byte_size > 0
    && typeof request.prompt.identity.sha256 === 'string' && SHA256.test(request.prompt.identity.sha256)
    && exactKeys(request.package, ['id', 'version', 'instance_id', 'manifest_identity'])
    && typeof request.package.id === 'string' && typeof request.package.version === 'string'
    && typeof request.package.instance_id === 'string' && URN_UUID.test(request.package.instance_id)
    && exactKeys(request.package.manifest_identity, ['canonicalization', 'byte_size', 'sha256'])
    && request.package.manifest_identity.canonicalization === 'studio-json-v1'
    && Number.isSafeInteger(request.package.manifest_identity.byte_size) && request.package.manifest_identity.byte_size > 0
    && typeof request.package.manifest_identity.sha256 === 'string' && SHA256.test(request.package.manifest_identity.sha256)
    && exactKeys(request.builder_result_identity, ['canonicalization', 'byte_size', 'sha256'])
    && request.builder_result_identity.canonicalization === 'studio-json-v1'
    && Number.isSafeInteger(request.builder_result_identity.byte_size) && request.builder_result_identity.byte_size > 0
    && typeof request.builder_result_identity.sha256 === 'string' && SHA256.test(request.builder_result_identity.sha256)
    && typeof request.purpose === 'string' && request.purpose.length > 0
    && Array.isArray(request.sections) && request.sections.length > 0
    && request.sections.every(section => typeof section === 'string' && section.length > 0)
    && new Set(request.sections).size === request.sections.length
    && CLASSIFICATIONS.includes(request.classification)
    && typeof request.preparation_reference === 'string' && URN_UUID.test(request.preparation_reference)
    && typeof request.historical_use_authorization_reference === 'string'
    && URN_UUID.test(request.historical_use_authorization_reference);
}

function validAuthorization(authorization, request) {
  if (!authorization || !validateContextDocument(authorization).valid
    || authorization.kind !== 'context-authorization' || authorization.spec_version !== '1.0.0'
    || authorization.decision !== 'allow' || typeof authorization.decision_id !== 'string' || !URN_UUID.test(authorization.decision_id)
    || !same(authorization.package, {
      id: request.package.id, version: request.package.version, instance_id: request.package.instance_id
    }) || !same(authorization.prompt, { id: request.prompt.id, version: request.prompt.version })
    || authorization.purpose !== request.purpose || !same(authorization.sections, request.sections)
    || CLASSIFICATIONS.indexOf(request.classification) > CLASSIFICATIONS.indexOf(authorization.max_classification)
    || !stamp(authorization.decided_at) || !stamp(authorization.expires_at)
    || typeof authorization.authority_reference !== 'string' || !authorization.authority_reference) return false;
  return true;
}

function validRecord(record) {
  if (!exactKeys(record, RECORD_FIELDS) || typeof record.decision_id !== 'string' || !UUID.test(record.decision_id)
    || !['allow', 'deny'].includes(record.decision) || !validRequest(record.request)
    || !validAuthorization(record.authorization, record.request)
    || !stamp(record.not_before) || !stamp(record.review_after) || !stamp(record.expires_at)
    || !(Date.parse(record.not_before) < Date.parse(record.review_after)
      && Date.parse(record.review_after) <= Date.parse(record.expires_at))
    || typeof record.authority_reference !== 'string' || !/^https:\/\//.test(record.authority_reference)) return false;
  const packageExpiry = Date.parse(record.expires_at);
  return Date.parse(record.review_after) <= Date.parse(PACKAGE_REVIEW_AFTER)
    && packageExpiry <= Date.parse(PACKAGE_EXPIRES_AT)
    && Date.parse(record.not_before) <= Date.parse(record.authorization.decided_at)
    && packageExpiry <= Date.parse(record.authorization.expires_at);
}

/** Finite synthetic decisions with current in-memory revocation; never grants from request data. */
export function createSyntheticContextUseVerifier(decisions) {
  let records;
  try { records = JSON.parse(canonicalJson(decisions)); } catch { throw new TypeError('Invalid synthetic Context Use authority fixture.'); }
  if (!Array.isArray(records) || records.length === 0 || !records.every(validRecord)
    || new Set(records.map(item => item.decision_id)).size !== records.length
    || new Set(records.map(item => item.request.action)).size !== records.length) {
    throw new TypeError('Invalid synthetic Context Use authority fixture.');
  }
  const revoked = new Set();
  const verifier = Object.freeze({
    id: SYNTHETIC_CONTEXT_USE_AUTHORITY_ID,
    mode: 'synthetic',
    async verify({ request, at }) {
      const matches = records.filter(item => same(item.request, request));
      if (matches.length !== 1) return null;
      const item = matches[0];
      return freezeDeep({ ...item, revocation: { status: revoked.has(item.decision_id) ? 'revoked' : 'active', checked_at: at } });
    },
    isCurrent({ decision_id, request }) {
      const matches = records.filter(item => item.decision_id === decision_id && same(item.request, request));
      return matches.length === 1 && matches[0].decision === 'allow' && !revoked.has(decision_id);
    }
  });
  return Object.freeze({ verifier, revoke(decisionId) { revoked.add(decisionId); } });
}

export function validateSyntheticContextUseEvidence(value, { request, at }) {
  try {
    const evidence = JSON.parse(canonicalJson(value));
    if (!exactKeys(evidence, [...RECORD_FIELDS, 'revocation']) || !validRecord(Object.fromEntries(
      RECORD_FIELDS.map(key => [key, evidence[key]])
    )) || evidence.decision !== 'allow' || !same(evidence.request, request)
      || !stamp(at) || !(Date.parse(evidence.not_before) <= Date.parse(at)
        && Date.parse(at) < Date.parse(evidence.review_after)
        && Date.parse(at) < Date.parse(evidence.expires_at))
      || Date.parse(at) < Date.parse(evidence.authorization.decided_at)
      || Date.parse(at) >= Date.parse(evidence.authorization.expires_at)
      || !exactKeys(evidence.revocation, ['status', 'checked_at'])
      || evidence.revocation.status !== 'active' || evidence.revocation.checked_at !== at) return false;
    return true;
  } catch { return false; }
}

export function contextUseRequest(production, action) {
  const binding = production?.value?.inputs?.prompts?.[0];
  const context = binding?.context;
  if (!context || production.value.inputs.prompts.length !== 1 || binding.binding_id !== 'description') return undefined;
  const request = freezeDeep({
    action,
    production: {
      production_id: production.value.production_id,
      revision: production.value.revision,
      identity_sha256: production.identity.sha256
    },
    prompt: { id: binding.prompt_id, version: binding.prompt_version, identity: binding.identity },
    package: {
      id: context.package_id, version: context.package_version, instance_id: context.instance_id,
      manifest_identity: context.manifest_identity
    },
    builder_result_identity: context.builder_result_identity,
    purpose: context.purpose,
    sections: context.sections,
    classification: context.classification,
    preparation_reference: context.preparation_reference,
    historical_use_authorization_reference: context.use_authorization_reference
  });
  return validRequest(request) ? request : undefined;
}

export function validateContextUseProvider(provider) {
  return provider?.mode === 'synthetic' && provider.id === SYNTHETIC_CONTEXT_USE_AUTHORITY_ID
    && typeof provider.verify === 'function' && typeof provider.isCurrent === 'function';
}

export function validateSyntheticContextReaders(provider) {
  if (provider?.mode !== 'synthetic' || provider.id !== 'studio.synthetic.comic-context-readers'
    || !provider.readers || typeof provider.readers !== 'object') return false;
  const keys = Object.keys(provider.readers).sort();
  return same(keys, [...SYNTHETIC_CONTEXT_READER_SLOTS].sort())
    && SYNTHETIC_CONTEXT_READER_SLOTS.every(slot => typeof provider.readers[slot] === 'function');
}
