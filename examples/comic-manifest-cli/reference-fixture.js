import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  createComicApprovalBoundary,
  createComicBuildResultBoundary,
  validateComicManifest
} from '../../src/comic-manifest/index.js';
import { canonicalJson } from '../../src/prompt-sdk/canonical-json.js';

export const SYNTHETIC_ACTION_TIME = '2026-09-15T12:05:00Z';
const PRODUCER = 'synthetic-producer';
const raw = value => JSON.stringify(value);
const clone = value => structuredClone(value);
const digest = value => `sha256:${createHash('sha256').update(value).digest('hex')}`;

function dependencies(production) {
  const entries = [
    ...production.inputs.dependencies,
    ...production.inputs.prompts.map(prompt => prompt.definition),
    ...production.inputs.assets.filter(asset => asset.reference.kind === 'public')
      .map(asset => asset.reference.dependency)
  ];
  const seen = new Set();
  return entries.filter(item => {
    const key = canonicalJson(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function bindScenario(value) {
  const productionIdentity = validateComicManifest(raw(value.production)).identity;
  value.result.production = {
    production_id: value.production.production_id,
    revision: value.production.revision,
    identity: productionIdentity
  };
  value.result.inputs = clone(value.production.inputs);
  for (const output of value.result.outputs) {
    const bytes = value.bytes[output.rendition_id];
    if (!bytes) throw new Error('Synthetic reference fixture is incomplete.');
    output.artifact.byte_size = bytes.byteLength;
    output.artifact.sha256 = digest(bytes);
  }
  const outputDigests = value.result.outputs.map(output => output.artifact.sha256);
  value.result.execution.transformations[0].output_digests = outputDigests;

  value.release.input_canon = clone(value.production.inputs.canon);
  value.release.dependencies = dependencies(value.production);
  value.release.execution.tool = clone(value.result.execution.tool);
  for (const key of ['workflow_id', 'started_at', 'finished_at', 'reproducibility']) {
    value.release.execution[key] = value.result.execution[key];
  }
  value.release.execution.transformations[0].output_digests = [...outputDigests];
  for (const output of value.result.outputs) {
    const projected = value.release.outputs.find(item => item.rendition_id === output.rendition_id);
    if (!projected) throw new Error('Synthetic reference fixture is incomplete.');
    projected.artifact.byte_size = output.artifact.byte_size;
    projected.artifact.sha256 = output.artifact.sha256;
  }
  const productionId = validateComicManifest(raw(value.production)).identity;
  const candidateId = validateComicManifest(raw(value.release)).identity;
  for (const approval of value.approvals) {
    approval.subject = approval.role === 'production-reviewer' ? productionId : candidateId;
    approval.scope = clone(value.release.scope);
    approval.artifact_digests = approval.role === 'production-reviewer' ? [] : outputDigests.slice().sort();
  }
  return value;
}

async function buildPolicy(value, artifactMap, at) {
  const captured = { approvals: [], disclosure: null, privateInfluence: null };
  const approvalBoundary = createComicApprovalBoundary({
    producerActor: PRODUCER,
    getTime: () => at,
    verifyCurrentApproval: binding => { captured.approvals.push(binding); return true; }
  });
  const verifier = createComicBuildResultBoundary({
    approvalBoundary,
    readArtifactBytes: request => artifactMap.get(request.artifactUri) ?? null,
    verifyPrivateInfluence: request => { captured.privateInfluence = request; return true; },
    verifyCurrentDisclosureApproval: request => { captured.disclosure = request; return true; }
  });
  const result = await verifier.verify({
    productionSource: raw(value.production),
    resultSource: raw(value.result),
    candidateSource: raw(value.release),
    assignmentSource: raw(value.assignment),
    approvalSources: value.approvals.map(raw)
  });
  if (result.valid !== true || captured.disclosure === null) {
    throw new Error('Synthetic reference fixture could not be bound.');
  }
  const approvals = captured.approvals.map(binding => ({
    decision_id: binding.decisionId,
    role: binding.role,
    actor: binding.actor,
    subject_sha256: binding.subject.sha256,
    artifact_digests: binding.artifactDigests,
    scope: binding.scope,
    intended_action: binding.intendedAction,
    action_time: binding.actionTime,
    decided_at: binding.decidedAt,
    expires_at: binding.expiresAt,
    authority_reference: binding.authorityReference,
    decision: 'allow',
    revocation_status: 'active',
    checked_at: at
  }));
  const evidenceDigest = records => digest(canonicalJson(records));
  // The CLI's non-normative synthetic policy envelope has a fixed shape. When
  // the fixture has no private influence, keep its unused private decision an
  // explicit denial so this file cannot stand in for an attestation.
  const privateInfluence = captured.privateInfluence === null
    ? {
        decision: 'deny',
        attestation_reference: 'synthetic-not-applicable',
        candidate_sha256: `sha256:${'0'.repeat(64)}`,
        production_sha256: `sha256:${'0'.repeat(64)}`,
        result_sha256: `sha256:${'0'.repeat(64)}`,
        artifact_evidence_sha256: `sha256:${'0'.repeat(64)}`,
        lineage_sha256: `sha256:${'0'.repeat(64)}`,
        checked_at: at
      }
    : {
        decision: 'allow',
        attestation_reference: captured.privateInfluence.attestationReference,
        candidate_sha256: captured.privateInfluence.candidateIdentity.sha256,
        production_sha256: captured.privateInfluence.productionIdentity.sha256,
        result_sha256: captured.privateInfluence.resultIdentity.sha256,
        artifact_evidence_sha256: evidenceDigest(captured.privateInfluence.artifacts),
        lineage_sha256: digest(canonicalJson(captured.privateInfluence.lineage)),
        checked_at: at
      };
  return {
    mode: 'offline-synthetic-cli-v1',
    evaluation_time: at,
    producer_actor: PRODUCER,
    approvals,
    disclosure: {
      decision: 'allow',
      candidate_sha256: captured.disclosure.candidateIdentity.sha256,
      proposal_sha256: digest(canonicalJson(result.proposal)),
      artifact_evidence_sha256: evidenceDigest(captured.disclosure.verifiedArtifactBytes),
      scope_sha256: digest(canonicalJson(captured.disclosure.scope)),
      checked_at: at
    },
    private_influence: privateInfluence
  };
}

/** Create only fictional, offline files under the caller's explicit private directory. */
export async function writeReferenceFixture(directory, { actionTime = SYNTHETIC_ACTION_TIME, mutate = () => {} } = {}) {
  const fixture = JSON.parse(await readFile(new URL('../../tests/fixtures/comic-manifest-v1.json', import.meta.url), 'utf8'));
  const value = {
    production: clone(fixture.production),
    result: clone(fixture.result),
    release: clone(fixture.release),
    assignment: { production_id: fixture.production.production_id, episode_id: fixture.release.episode_id },
    approvals: clone(fixture.approvals.slice(1)),
    bytes: Object.fromEntries(fixture.result.outputs.map(output => {
      const explicitBytes = fixture.output_bytes[output.rendition_id];
      if (typeof explicitBytes !== 'string') throw new Error('Synthetic reference fixture is incomplete.');
      return [output.rendition_id, Buffer.from(explicitBytes, 'utf8')];
    }))
  };
  mutate(value);
  bindScenario(value);
  const artifactMap = new Map(value.result.outputs.map(output => [output.artifact.artifact_uri, value.bytes[output.rendition_id]]));
  const paths = {
    production: join(directory, 'production.json'),
    result: join(directory, 'mock-result.json'),
    candidate: join(directory, 'release-candidate.json'),
    assignment: join(directory, 'assignment.json'),
    approvals: join(directory, 'approvals.json'),
    artifactMap: join(directory, 'artifact-map.json'),
    policy: join(directory, 'synthetic-policy.json')
  };
  const mapDocument = Object.create(null);
  for (const [index, output] of value.result.outputs.entries()) {
    const artifactPath = join(directory, `artifact-${index + 1}.bin`);
    await writeFile(artifactPath, value.bytes[output.rendition_id], { mode: 0o600, flag: 'wx' });
    mapDocument[output.artifact.artifact_uri] = artifactPath;
  }
  const policy = await buildPolicy(value, artifactMap, actionTime);
  const documents = [
    [paths.production, value.production], [paths.result, value.result], [paths.candidate, value.release],
    [paths.assignment, value.assignment], [paths.approvals, value.approvals], [paths.artifactMap, mapDocument],
    [paths.policy, policy]
  ];
  for (const [path, document] of documents) {
    await writeFile(path, JSON.stringify(document) + '\n', { mode: 0o600, flag: 'wx' });
  }
  return { ...paths, actionTime, outputCount: value.result.outputs.length };
}
