import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { parseComicManifestJson } from './parse-json.js';
import { validateComicManifest } from './validate.js';
import { validateComicRevision } from './episode.js';
import { compareComicApprovalTimes } from './approval-time.js';

const failure = code => ({ valid: false, diagnostics: [{ stage: 'approval', code }] });
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const rolesFor = record => record.kind === 'comic-production'
  ? ['production-reviewer']
  : ['publisher', 'canon-editor', ...(record.private_context.influenced ? ['disclosure-reviewer'] : [])];
const scopeKeys = ['audience', 'destination', 'publication_time', 'purpose'];

function scopeValue(source) {
  const result = parseComicManifestJson(source);
  if (!result.valid) return null;
  const scope = result.value;
  if (!scope || typeof scope !== 'object' || Array.isArray(scope) || !same(Object.keys(scope).sort(), scopeKeys)) return null;
  if (typeof scope.destination !== 'string' || typeof scope.audience !== 'string' || typeof scope.purpose !== 'string' ||
      compareComicApprovalTimes(scope.publication_time, scope.publication_time) !== 0) return null;
  return scope;
}

function expectedRoles(record, bindings) {
  const required = rolesFor(record);
  if (bindings.length !== required.length) return null;
  const byRole = new Map();
  for (const binding of bindings) {
    if (!required.includes(binding.role) || byRole.has(binding.role)) return null;
    byRole.set(binding.role, binding);
  }
  if (!required.every(role => byRole.has(role))) return null;
  return required.map(role => byRole.get(role));
}

/** Install the offline approval boundary around host-owned current-issuer verification. */
export function createComicApprovalBoundary({ getTime, verifyCurrentApproval, producerActor } = {}) {
  if (typeof getTime !== 'function' || typeof verifyCurrentApproval !== 'function' ||
      typeof producerActor !== 'string' || producerActor.length < 1 || producerActor.length > 200 || !producerActor.isWellFormed()) {
    throw new TypeError('Invalid Comic Manifest approval boundary configuration.');
  }

  async function verify({ candidateSource, previousSource = null, approvalSources, reviewScopeSource = null } = {}) {
    const revision = validateComicRevision(candidateSource, previousSource);
    if (!revision.valid) return failure(revision.diagnostics?.[0]?.code ?? 'REVISION_INVALID');
    const candidate = revision.value;
    if (!['comic-production', 'comic-public-release'].includes(candidate.kind)) return failure('ACTION_UNSUPPORTED');

    let scope;
    if (candidate.kind === 'comic-public-release') {
      if (reviewScopeSource !== null) return failure('SCOPE_INVALID');
      scope = candidate.scope;
    } else {
      scope = scopeValue(reviewScopeSource);
      if (!scope) return failure('SCOPE_INVALID');
    }

    if (!Array.isArray(approvalSources) || approvalSources.length > 16) return failure('APPROVAL_SET');
    const bindings = [];
    for (const source of approvalSources) {
      const result = validateComicManifest(source);
      if (!result.valid) return failure(result.diagnostics?.[0]?.code ?? 'APPROVAL_INVALID');
      if (result.value.kind !== 'comic-approval-binding') return failure('APPROVAL_INVALID');
      bindings.push(result.value);
    }
    const approvals = expectedRoles(candidate, bindings);
    if (!approvals) return failure('APPROVAL_ROLES');
    if (candidate.kind === 'comic-public-release') {
      const required = rolesFor(candidate), embeddedRoles = candidate.approvers.map(item => item.role);
      if (embeddedRoles.length !== required.length || new Set(embeddedRoles).size !== embeddedRoles.length ||
          !required.every(role => embeddedRoles.includes(role))) return failure('APPROVAL_ROLES');
    }

    const artifactDigests = candidate.kind === 'comic-production' ? [] :
      candidate.outputs.map(output => output.artifact.sha256).sort();
    const action = candidate.kind === 'comic-production' ? 'review-production' : 'publish-release';
    let currentTime;
    try { currentTime = await getTime(); }
    catch { return failure('ACTION_TIME_INVALID'); }
    if (compareComicApprovalTimes(currentTime, currentTime) !== 0) return failure('ACTION_TIME_INVALID');

    const embedded = candidate.kind === 'comic-public-release' ? candidate.approvers : null;
    for (const approval of approvals) {
      const metadata = embedded?.find(item => item.role === approval.role);
      if (embedded && (!metadata || metadata.decision_id !== approval.decision_id || metadata.role !== approval.role ||
          metadata.actor !== approval.actor || metadata.decided_at !== approval.decided_at)) return failure('APPROVAL_BINDING');
      if (!same(approval.subject, revision.identity) || !same(approval.artifact_digests, artifactDigests) || !same(approval.scope, scope)) {
        return failure('APPROVAL_BINDING');
      }
      if (approval.actor === producerActor) return failure('SELF_APPROVAL');
      const decided = compareComicApprovalTimes(approval.decided_at, currentTime);
      const actionExpires = compareComicApprovalTimes(currentTime, approval.expires_at);
      const publicationExpires = compareComicApprovalTimes(scope.publication_time, approval.expires_at);
      if (decided === null || actionExpires === null || publicationExpires === null || decided > 0 || actionExpires >= 0 || publicationExpires >= 0) {
        return failure('APPROVAL_TIME');
      }

      let verified;
      try {
        verified = await verifyCurrentApproval(Object.freeze({
          decisionId: approval.decision_id,
          role: approval.role,
          actor: approval.actor,
          subject: approval.subject,
          artifactDigests: approval.artifact_digests,
          scope: approval.scope,
          intendedAction: action,
          actionTime: currentTime,
          decidedAt: approval.decided_at,
          expiresAt: approval.expires_at,
          authorityReference: approval.authority_reference
        }));
      } catch {
        return failure('APPROVAL_UNVERIFIED');
      }
      if (verified !== true) return failure(verified === false ? 'APPROVAL_DENIED' : 'APPROVAL_UNVERIFIED');
    }
    return { valid: true, intended_action: action, diagnostics: [] };
  }

  return Object.freeze({ verify });
}
