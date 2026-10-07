import { createHash } from 'node:crypto';
import { types } from 'node:util';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateComicManifest } from './validate.js';
import { parseComicManifestJson } from './parse-json.js';
import { validateComicOutputCompatibility } from './output-compatibility.js';

const MAX_ARTIFACT_BYTES = 50_000_000;
const MAX_TOTAL_ARTIFACT_BYTES = 200_000_000;
const MAX_CONFIGURED_TOTAL_BYTES = 1_000_000_000;
const MAX_ARTIFACT_CHUNKS = 65_536;
const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
const byteLength = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'byteLength').get;
const backingBuffer = Object.getOwnPropertyDescriptor(typedArrayPrototype, 'buffer').get;
const failure = (stage, code) => ({ valid: false, diagnostics: [{ stage, code }] });
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const secretParameter = /(?:^|[-_.])(?:access[-_.]?token|api[-_.]?key|auth(?:orization)?|bearer|client[-_.]?secret|credential(?:s)?|password|passwd|secret|session|signature|sig|token)(?:$|[-_.])/i;
const embeddedSecret = /(?:bearer[ %2b]+[a-z0-9._~+/=-]+|sk_(?:live|test)_[a-z0-9]+|gh[pousr]_[a-z0-9]{20,}|xox[baprs]-[a-z0-9-]{20,})/i;

/** Per-artifact and cumulative byte ceilings applied by the offline verifier. */
export const COMIC_BUILD_RESULT_LIMITS = Object.freeze({
  maxArtifactBytes: MAX_ARTIFACT_BYTES,
  maxTotalArtifactBytes: MAX_TOTAL_ARTIFACT_BYTES,
  maxArtifactChunks: MAX_ARTIFACT_CHUNKS
});

function freezeTree(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freezeTree(child, seen);
  return Object.freeze(value);
}

function snapshot(source, expectedKind) {
  const parsed = parseComicManifestJson(source);
  if (!parsed.valid) return parsed;
  let stableSource;
  try { stableSource = canonicalJson(parsed.value); }
  catch { return failure('schema', 'SCHEMA_INVALID'); }
  const validated = validateComicManifest(stableSource);
  if (!validated.valid) return validated;
  if (expectedKind && validated.value.kind !== expectedKind) return failure('schema', 'RECORD_KIND');
  return { ...validated, source: stableSource };
}

function snapshotAuxiliary(source) {
  if (source === null || source === undefined) return { valid: true, source: null, value: null };
  const parsed = parseComicManifestJson(source);
  if (!parsed.valid) return parsed;
  return { valid: true, source: canonicalJson(parsed.value), value: parsed.value, diagnostics: [] };
}

function unsafeUri(uri) {
  let url;
  try { url = new URL(uri); } catch { return true; }
  if (url.protocol !== 'https:' || url.username || url.password) return true;
  for (const [key, value] of url.searchParams) {
    if (secretParameter.test(key) || embeddedSecret.test(value)) return true;
  }
  if (/(?:^|[/?#&=._-])(?:awsaccesskeyid|x-amz-credential|x-amz-signature)(?:$|[/?#&=._-])/i.test(uri)) return true;
  if (url.hash) {
    try { if (secretParameter.test(decodeURIComponent(url.hash))) return true; }
    catch { return true; }
  }
  return false;
}

function dependencyUris(dependency) {
  return [dependency.artifact.artifact_uri];
}

function inputUris(inputs) {
  return [
    ...dependencyUris(inputs.canon),
    ...inputs.dependencies.flatMap(dependencyUris),
    ...inputs.prompts.flatMap(prompt => dependencyUris(prompt.definition)),
    ...inputs.assets.flatMap(asset => asset.reference.kind === 'public' ? dependencyUris(asset.reference.dependency) : [])
  ];
}

function unsafeRecordUris(production, result, release) {
  const artifactUri = artifact => artifact.artifact_uri;
  const uris = [
    ...inputUris(production.inputs),
    ...inputUris(result.inputs),
    ...result.outputs.map(output => output.artifact.artifact_uri.startsWith('urn:uuid:')
      ? null : output.artifact.artifact_uri),
    ...dependencyUris(result.execution.tool),
    result.execution.run_uri,
    ...dependencyUris(release.input_canon),
    ...release.dependencies.flatMap(dependencyUris),
    ...release.outputs.map(output => artifactUri(output.artifact)),
    ...dependencyUris(release.execution.tool),
    release.execution.run_uri,
    release.scope.destination
  ].filter(uri => typeof uri === 'string');
  return uris.some(unsafeUri);
}

function publicDependencies(production) {
  const entries = [
    ...production.inputs.dependencies,
    ...production.inputs.prompts.map(prompt => prompt.definition),
    ...production.inputs.assets
      .filter(asset => asset.reference.kind === 'public')
      .map(asset => asset.reference.dependency)
  ];
  const seen = new Set();
  return entries.filter(entry => {
    const key = canonicalJson(entry);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasPrivateInfluence(production, result) {
  const classifiedPrivate = production.classification !== 'public' || result.classification !== 'public';
  const privateAssets = production.inputs.assets.some(asset =>
    asset.reference.kind === 'protected' || asset.classification !== 'public');
  const privatePromptContext = production.inputs.prompts.some(prompt =>
    prompt.context !== null && prompt.context.classification !== 'public');
  const privateTransform = result.execution.transformations.some(step =>
    step.private_inputs_withheld || step.private_outputs_withheld);
  return classifiedPrivate || privateAssets || privatePromptContext || privateTransform;
}

function publicDependency(dependency) {
  return {
    repository: dependency.repository,
    version: dependency.version,
    tag: dependency.tag,
    commit: dependency.commit,
    artifact: {
      artifact_uri: dependency.artifact.artifact_uri,
      media_type: dependency.artifact.media_type,
      byte_size: dependency.artifact.byte_size,
      sha256: dependency.artifact.sha256
    }
  };
}

function publicIdentity(identity) {
  return {
    canonicalization: identity.canonicalization,
    byte_size: identity.byte_size,
    sha256: identity.sha256
  };
}

function publicOutput(output) {
  return {
    rendition_id: output.rendition_id,
    artifact: {
      artifact_uri: output.artifact.artifact_uri,
      media_type: output.artifact.media_type,
      byte_size: output.artifact.byte_size,
      sha256: output.artifact.sha256
    },
    profile: { profile_id: output.profile.profile_id, profile_version: output.profile.profile_version },
    dimensions: output.dimensions === null ? null : { width: output.dimensions.width, height: output.dimensions.height },
    max_bytes: output.max_bytes,
    rights_notice: output.rights_notice,
    alt_text: output.alt_text,
    transcript: output.transcript
  };
}

function publicGate(gate) {
  return {
    gate: gate.gate,
    disposition: gate.disposition,
    evidence_reference: gate.evidence_reference,
    rationale: gate.rationale
  };
}

function publicExecution(execution) {
  return {
    tool: publicDependency(execution.tool),
    workflow_id: execution.workflow_id,
    run_uri: execution.run_uri,
    started_at: execution.started_at,
    finished_at: execution.finished_at,
    transformations: execution.transformations.map(step => ({
      step_id: step.step_id,
      input_digests: [...step.input_digests],
      output_digests: [...step.output_digests],
      private_inputs_withheld: step.private_inputs_withheld,
      private_outputs_withheld: step.private_outputs_withheld
    })),
    generation: execution.generation.map(item => ({
      provider: item.provider,
      model: item.model,
      parameters: item.parameters.map(parameter => ({ name: parameter.name, value: parameter.value })),
      evidence_state: item.evidence_state,
      limitations: item.limitations
    })),
    reproducibility: execution.reproducibility,
    limitations: execution.limitations
  };
}

function buildProposal(release) {
  const value = release.value;
  return freezeTree({
    kind: 'comic-public-release-proposal',
    proposal_version: '1.0.0',
    source_spec_version: value.spec_version,
    release: {
      release_id: value.release_id,
      episode_id: value.episode_id,
      revision: value.revision,
      previous: value.previous === null ? null : {
        release_id: value.previous.release_id,
        episode_id: value.previous.episode_id,
        revision: value.previous.revision,
        identity: publicIdentity(value.previous.identity)
      },
      classification: value.classification,
      title: value.title,
      production_credit: value.production_credit,
      canon_scope: value.canon_scope,
      scope: {
        destination: value.scope.destination,
        audience: value.scope.audience,
        purpose: value.scope.purpose,
        publication_time: value.scope.publication_time
      },
      input_canon: publicDependency(value.input_canon),
      dependencies: value.dependencies.map(publicDependency),
      outputs: value.outputs.map(publicOutput),
      gates: value.gates.map(publicGate),
      execution: publicExecution(value.execution),
      private_context: value.private_context.influenced
        ? { influenced: true, attestation_reference: value.private_context.attestation_reference }
        : { influenced: false }
    }
  });
}

function lineageFor(production, result, release) {
  return freezeTree({
    production: {
      production_id: production.value.production_id,
      revision: production.value.revision,
      identity: production.identity
    },
    result: {
      result_id: result.value.result_id,
      attempt_id: result.value.attempt_id,
      identity: result.identity
    },
    candidate: {
      release_id: release.value.release_id,
      episode_id: release.value.episode_id,
      revision: release.value.revision,
      identity: release.identity
    },
    input_canon: production.value.inputs.canon,
    production_inputs: production.value.inputs,
    result_inputs: result.value.inputs,
    transformations: result.value.execution.transformations
  });
}

function supportedByteChunk(chunk) {
  if (!chunk || typeof chunk !== 'object' || types.isProxy(chunk) || !types.isUint8Array(chunk)) return false;
  const prototype = Object.getPrototypeOf(chunk);
  return prototype === Uint8Array.prototype || prototype === Buffer.prototype;
}

function snapshotByteChunk(chunk, maxBytes) {
  if (!supportedByteChunk(chunk)) return { error: 'ARTIFACT_BYTES' };
  const size = byteLength.call(chunk);
  if (size > maxBytes) return { error: 'ARTIFACT_LIMIT' };
  if (types.isSharedArrayBuffer(backingBuffer.call(chunk))) return { error: 'ARTIFACT_BYTES' };
  const copy = Buffer.alloc(size);
  for (let index = 0; index < size; index++) copy[index] = chunk[index];
  return { copy };
}

async function hashProviderOutput(provider, request, perArtifactLimit, remainingTotal) {
  if (request.expectedByteSize === 0) return { error: 'ARTIFACT_INCOMPLETE' };
  if (request.expectedByteSize > perArtifactLimit || request.expectedByteSize > remainingTotal) {
    return { error: 'ARTIFACT_LIMIT' };
  }
  let supplied;
  try { supplied = await provider(request); }
  catch { return { error: 'ARTIFACT_UNAVAILABLE' }; }
  if (supplied === null || supplied === undefined) return { error: 'ARTIFACT_MISSING' };

  const hash = createHash('sha256');
  let byteSize = 0;
  const acceptChunk = chunk => {
    try {
      const allowedBytes = Math.min(perArtifactLimit - byteSize, remainingTotal - byteSize);
      const snapshot = snapshotByteChunk(chunk, allowedBytes);
      if (snapshot.error) return snapshot.error;
      byteSize += snapshot.copy.byteLength;
      hash.update(snapshot.copy);
      return null;
    } catch { return 'ARTIFACT_BYTES'; }
  };

  if (supportedByteChunk(supplied)) {
    const code = acceptChunk(supplied);
    if (code) return { error: code };
  } else {
    if (types.isProxy(supplied)) return { error: 'ARTIFACT_BYTES' };
    let iterator;
    try {
      const factory = supplied?.[Symbol.asyncIterator];
      if (typeof factory !== 'function') return { error: 'ARTIFACT_BYTES' };
      iterator = factory.call(supplied);
    }
    catch { return { error: 'ARTIFACT_BYTES' }; }
    let next;
    try {
      if (!iterator || types.isProxy(iterator)) return { error: 'ARTIFACT_BYTES' };
      next = iterator.next;
    } catch { return { error: 'ARTIFACT_BYTES' }; }
    if (typeof next !== 'function') return { error: 'ARTIFACT_BYTES' };
    let observed = false;
    let chunks = 0;
    try {
      while (true) {
        const item = await next.call(iterator);
        if (!item || typeof item !== 'object') return { error: 'ARTIFACT_BYTES' };
        if (item.done) break;
        observed = true;
        if (++chunks > MAX_ARTIFACT_CHUNKS) {
          try { if (typeof iterator.return === 'function') await iterator.return(); } catch { /* best effort close */ }
          return { error: 'ARTIFACT_LIMIT' };
        }
        const code = acceptChunk(item.value);
        if (code) {
          try { if (typeof iterator.return === 'function') await iterator.return(); } catch { /* best effort close */ }
          return { error: code };
        }
      }
    } catch { return { error: observed ? 'ARTIFACT_UNAVAILABLE' : 'ARTIFACT_MISSING' }; }
  }

  if (byteSize === 0) return { error: 'ARTIFACT_INCOMPLETE' };
  if (byteSize !== request.expectedByteSize) return { error: 'ARTIFACT_SIZE' };
  const sha256 = `sha256:${hash.digest('hex')}`;
  if (sha256 !== request.expectedSha256) return { error: 'ARTIFACT_DIGEST' };
  return { byteSize, sha256 };
}

function publicArtifacts(release) {
  return release.value.outputs.map(output => ({
    renditionId: output.rendition_id,
    artifactUri: output.artifact.artifact_uri,
    mediaType: output.artifact.media_type,
    byteSize: output.artifact.byte_size,
    sha256: output.artifact.sha256
  }));
}

/**
 * Install a proposal-only boundary around host-owned byte, disclosure,
 * private-influence, and #95 current-approval verifiers.
 */
export function createComicBuildResultBoundary({
  readArtifactBytes,
  verifyCurrentDisclosureApproval,
  verifyPrivateInfluence,
  approvalBoundary,
  maxTotalArtifactBytes = MAX_TOTAL_ARTIFACT_BYTES
} = {}) {
  if (typeof readArtifactBytes !== 'function' || typeof verifyCurrentDisclosureApproval !== 'function' ||
      typeof verifyPrivateInfluence !== 'function' || typeof approvalBoundary?.verify !== 'function' ||
      !Number.isSafeInteger(maxTotalArtifactBytes) || maxTotalArtifactBytes < 1 ||
      maxTotalArtifactBytes > MAX_CONFIGURED_TOTAL_BYTES) {
    throw new TypeError('Invalid Comic Manifest build-result boundary configuration.');
  }

  async function verify({
    productionSource,
    resultSource,
    candidateSource,
    previousSource = null,
    assignmentSource,
    approvalSources
  } = {}) {
    const production = snapshot(productionSource, 'comic-production');
    if (!production.valid) return production;
    const result = snapshot(resultSource, 'comic-build-result');
    if (!result.valid) return result;
    const candidate = snapshot(candidateSource, 'comic-public-release');
    if (!candidate.valid) return candidate;
    const previous = snapshotAuxiliary(previousSource);
    if (!previous.valid) return previous;
    const assignment = snapshotAuxiliary(assignmentSource);
    if (!assignment.valid || assignment.source === null) return failure('output', 'ASSIGNMENT');
    if (!Array.isArray(approvalSources) || approvalSources.length < 1 || approvalSources.length > 16) {
      return failure('approval', 'APPROVAL_SET');
    }
    const stableApprovals = [];
    for (const approvalSource of approvalSources) {
      const approval = snapshot(approvalSource, 'comic-approval-binding');
      if (!approval.valid) return failure('approval', 'APPROVAL_INVALID');
      stableApprovals.push(approval.source);
    }
    const stableApprovalSources = Object.freeze(stableApprovals);

    if (result.value.status !== 'complete' || result.value.outputs.length === 0 || result.value.diagnostics.length > 0) {
      return failure('build-result', 'RESULT_NOT_COMPLETE');
    }
    const compatibility = validateComicOutputCompatibility(
      production.source, result.source, candidate.source, assignment.source
    );
    if (!compatibility.valid) return compatibility;
    if (!same(candidate.value.input_canon, production.value.inputs.canon)) {
      return failure('build-result', 'CANON_INPUT');
    }
    if (!same(candidate.value.dependencies, publicDependencies(production.value))) {
      return failure('build-result', 'PUBLIC_DEPENDENCIES');
    }
    const resultExecution = result.value.execution, publicExecutionRecord = candidate.value.execution;
    if (!same(resultExecution.tool, publicExecutionRecord.tool) ||
        !['workflow_id', 'started_at', 'finished_at', 'reproducibility'].every(key =>
          resultExecution[key] === publicExecutionRecord[key]) ||
        !same(resultExecution.transformations.map(step => step.step_id),
          publicExecutionRecord.transformations.map(step => step.step_id))) {
      return failure('build-result', 'EXECUTION_LINK');
    }
    if ([...result.value.gates, ...candidate.value.gates]
      .some(gate => !['pass', 'not-applicable'].includes(gate.disposition))) {
      return failure('build-result', 'GATE_BLOCKED');
    }
    if (unsafeRecordUris(production.value, result.value, candidate.value)) {
      return failure('build-result', 'UNSAFE_URI');
    }

    const influenced = hasPrivateInfluence(production.value, result.value);
    if (candidate.value.private_context.influenced !== influenced) {
      return failure('disclosure', 'PRIVATE_CONTEXT');
    }
    const proposal = buildProposal(candidate);
    const lineage = lineageFor(production, result, candidate);
    const verifiedArtifacts = [];
    let totalByteSize = 0;
    for (let index = 0; index < result.value.outputs.length; index++) {
      const output = result.value.outputs[index];
      const artifact = output.artifact;
      const maxBytes = Math.min(output.max_bytes, MAX_ARTIFACT_BYTES);
      const request = freezeTree({
        productionIdentity: production.identity,
        resultIdentity: result.identity,
        renditionId: output.rendition_id,
        artifactUri: artifact.artifact_uri,
        mediaType: artifact.media_type,
        expectedByteSize: artifact.byte_size,
        expectedSha256: artifact.sha256,
        maxBytes
      });
      const observed = await hashProviderOutput(readArtifactBytes, request, maxBytes,
        maxTotalArtifactBytes - totalByteSize);
      if (observed.error) return failure('artifact', observed.error);
      totalByteSize += observed.byteSize;
      verifiedArtifacts.push(freezeTree({
        rendition_id: output.rendition_id,
        artifact_uri: artifact.artifact_uri,
        media_type: artifact.media_type,
        expected_byte_size: artifact.byte_size,
        observed_byte_size: observed.byteSize,
        expected_sha256: artifact.sha256,
        observed_sha256: observed.sha256
      }));
    }
    const artifactEvidence = freezeTree(verifiedArtifacts);
    const publicArtifactEvidence = freezeTree(publicArtifacts(candidate));
    const disclosureRequest = freezeTree({
      candidate: candidate.value,
      candidateIdentity: candidate.identity,
      scope: candidate.value.scope,
      publicProposal: proposal,
      publicArtifacts: publicArtifactEvidence,
      verifiedArtifactBytes: artifactEvidence
    });

    if (influenced) {
      const attestationRequest = freezeTree({
        attestationReference: candidate.value.private_context.attestation_reference,
        productionId: production.value.production_id,
        productionRevision: production.value.revision,
        productionIdentity: production.identity,
        resultId: result.value.result_id,
        attemptId: result.value.attempt_id,
        resultIdentity: result.identity,
        candidateReleaseId: candidate.value.release_id,
        candidateRevision: candidate.value.revision,
        candidateIdentity: candidate.identity,
        artifacts: artifactEvidence,
        publicArtifacts: publicArtifactEvidence,
        lineage
      });
      let attested;
      try { attested = await verifyPrivateInfluence(attestationRequest); }
      catch { return failure('disclosure', 'ATTESTATION_UNVERIFIED'); }
      if (attested !== true) return failure('disclosure', attested === false ? 'ATTESTATION_DENIED' : 'ATTESTATION_UNVERIFIED');
    }

    let disclosed;
    try { disclosed = await verifyCurrentDisclosureApproval(disclosureRequest); }
    catch { return failure('disclosure', 'DISCLOSURE_UNVERIFIED'); }
    if (disclosed !== true) return failure('disclosure', disclosed === false ? 'DISCLOSURE_DENIED' : 'DISCLOSURE_UNVERIFIED');

    // This final #95 evaluation runs after all byte and external disclosure/
    // attestation awaits so current revocation is checked at the proposal edge.
    let approval;
    try {
      approval = await approvalBoundary.verify({
        candidateSource: candidate.source,
        previousSource: previous.source,
        approvalSources: stableApprovalSources
      });
    } catch { return failure('approval', 'APPROVAL_UNVERIFIED'); }
    if (approval?.valid !== true || approval.intended_action !== 'publish-release') {
      const code = approval?.diagnostics?.[0]?.code;
      return failure('approval', typeof code === 'string' ? code : 'APPROVAL_UNVERIFIED');
    }

    const protectedEvidence = freezeTree({
      production: {
        production_id: production.value.production_id,
        revision: production.value.revision,
        identity: production.identity,
        record: production.value
      },
      result: {
        result_id: result.value.result_id,
        attempt_id: result.value.attempt_id,
        identity: result.identity,
        record: result.value
      },
      candidate: {
        release_id: candidate.value.release_id,
        episode_id: candidate.value.episode_id,
        revision: candidate.value.revision,
        identity: candidate.identity,
        record: candidate.value
      },
      previous: previous.value,
      detached_approvals: stableApprovalSources.map(source => JSON.parse(source)),
      input_canon: production.value.inputs.canon,
      lineage,
      verified_artifacts: artifactEvidence,
      authorization: {
        disclosure_approval: 'verified-current',
        publication_approval: 'verified-current',
        private_influence_attestation: influenced ? 'verified-external' : 'not-applicable'
      }
    });
    return { valid: true, proposal, protected_evidence: protectedEvidence, diagnostics: [] };
  }

  return Object.freeze({ verify });
}
