/*
 * Independent, test-only projection oracle for the reviewed Codex v1 fixture.
 * This file intentionally imports no Platform runtime code. Its field list is
 * transcribed from the #96 public-proposal allowlist and is checked against
 * owner-reviewed, immutable output JSON under tests/fixtures/comic-manifest-goldens/.
 */

const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

function identity(value) {
  return {
    canonicalization: value.canonicalization,
    byte_size: value.byte_size,
    sha256: value.sha256
  };
}

function dependency(value) {
  return {
    repository: value.repository,
    version: value.version,
    tag: value.tag,
    commit: value.commit,
    artifact: {
      artifact_uri: value.artifact.artifact_uri,
      media_type: value.artifact.media_type,
      byte_size: value.artifact.byte_size,
      sha256: value.artifact.sha256
    }
  };
}

function output(value) {
  return {
    rendition_id: value.rendition_id,
    artifact: {
      artifact_uri: value.artifact.artifact_uri,
      media_type: value.artifact.media_type,
      byte_size: value.artifact.byte_size,
      sha256: value.artifact.sha256
    },
    profile: { profile_id: value.profile.profile_id, profile_version: value.profile.profile_version },
    dimensions: value.dimensions === null ? null : clone(value.dimensions),
    max_bytes: value.max_bytes,
    rights_notice: value.rights_notice,
    alt_text: value.alt_text,
    transcript: value.transcript
  };
}

function execution(value) {
  return {
    tool: dependency(value.tool),
    workflow_id: value.workflow_id,
    run_uri: value.run_uri,
    started_at: value.started_at,
    finished_at: value.finished_at,
    transformations: value.transformations.map(step => ({
      step_id: step.step_id,
      input_digests: clone(step.input_digests),
      output_digests: clone(step.output_digests),
      private_inputs_withheld: step.private_inputs_withheld,
      private_outputs_withheld: step.private_outputs_withheld
    })),
    generation: value.generation.map(item => ({
      provider: item.provider,
      model: item.model,
      parameters: item.parameters.map(parameter => ({ name: parameter.name, value: parameter.value })),
      evidence_state: item.evidence_state,
      limitations: item.limitations
    })),
    reproducibility: value.reproducibility,
    limitations: value.limitations
  };
}

/** Derive the expected public proposal from a reviewed synthetic release record. */
export function comicManifestProposalOracle(value) {
  return {
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
        identity: identity(value.previous.identity)
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
      input_canon: dependency(value.input_canon),
      dependencies: value.dependencies.map(dependency),
      outputs: value.outputs.map(output),
      gates: value.gates.map(item => ({
        gate: item.gate,
        disposition: item.disposition,
        evidence_reference: item.evidence_reference,
        rationale: item.rationale
      })),
      execution: execution(value.execution),
      private_context: value.private_context.influenced
        ? { influenced: true, attestation_reference: value.private_context.attestation_reference }
        : { influenced: false }
    }
  };
}

/** The explicit test transform for the public-only golden; it reads no output from Platform. */
export function makePublicOnlyComicScenario(source) {
  const value = clone(source);
  const privatePromptTuples = new Set(value.production.inputs.prompts.map(prompt => JSON.stringify(prompt.definition)));
  const canonDigest = value.production.inputs.canon.artifact.sha256;
  value.production.classification = 'public';
  value.production.inputs.prompts = [];
  for (const panel of value.production.panels) panel.prompt_bindings = [];
  value.result.classification = 'public';
  value.result.inputs = clone(value.production.inputs);
  for (const step of value.result.execution.transformations) {
    step.input_digests = [canonDigest];
    step.private_inputs_withheld = false;
    step.private_outputs_withheld = false;
  }
  for (const step of value.release.execution.transformations) {
    step.input_digests = [canonDigest];
    step.private_inputs_withheld = false;
    step.private_outputs_withheld = false;
  }
  value.release.dependencies = value.release.dependencies.filter(item => !privatePromptTuples.has(JSON.stringify(item)));
  value.release.execution.tool = clone(value.result.execution.tool);
  value.release.private_context = { influenced: false };
  value.release.approvers = value.release.approvers.filter(item => item.role !== 'disclosure-reviewer');
  value.approvals = value.approvals.filter(item => item.role !== 'disclosure-reviewer');
  return value;
}
