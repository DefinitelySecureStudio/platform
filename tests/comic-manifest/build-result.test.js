import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createComicApprovalBoundary,
  createComicBuildResultBoundary,
  validateComicOutputCompatibility,
  validateComicManifest
} from '../../src/comic-manifest/index.js';

const read = async path => JSON.parse(await readFile(new URL('../fixtures/' + path, import.meta.url)));
const fixture = await read('comic-manifest-v1.json');
const raw = value => JSON.stringify(value);
const actionTime = '2026-09-15T12:05:00Z';
const producerActor = 'synthetic-producer';
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const clone = value => structuredClone(value);

function expectedDependencies(production) {
  const items = [
    ...production.inputs.dependencies,
    ...production.inputs.prompts.map(prompt => prompt.definition),
    ...production.inputs.assets.filter(asset => asset.reference.kind === 'public')
      .map(asset => asset.reference.dependency)
  ];
  const seen = new Set();
  return items.filter(item => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scenario() {
  return rebind({
    production: clone(fixture.production),
    result: clone(fixture.result),
    release: clone(fixture.release),
    approvals: clone(fixture.approvals.slice(1)),
    bytes: { transcript: Buffer.from(fixture.result.outputs[0].transcript) }
  });
}

function rebind(value) {
  const productionIdentity = validateComicManifest(raw(value.production)).identity;
  value.result.production = {
    production_id: value.production.production_id,
    revision: value.production.revision,
    identity: productionIdentity
  };
  value.result.inputs = clone(value.production.inputs);
  for (const output of value.result.outputs) {
    const bytes = value.bytes[output.rendition_id];
    assert.ok(bytes, `missing synthetic bytes for ${output.rendition_id}`);
    output.artifact.byte_size = bytes.byteLength;
    output.artifact.sha256 = digest(bytes);
  }
  const outputDigests = value.result.outputs.map(output => output.artifact.sha256);
  value.result.execution.transformations[0].output_digests = outputDigests;

  value.release.input_canon = clone(value.production.inputs.canon);
  value.release.dependencies = expectedDependencies(value.production);
  value.release.execution.tool = clone(value.result.execution.tool);
  for (const key of ['workflow_id', 'started_at', 'finished_at', 'reproducibility']) {
    value.release.execution[key] = value.result.execution[key];
  }
  value.release.execution.transformations[0].output_digests = [...outputDigests];
  for (const output of value.result.outputs) {
    const publicOutput = value.release.outputs.find(item => item.rendition_id === output.rendition_id);
    assert.ok(publicOutput, `missing public fixture output ${output.rendition_id}`);
    publicOutput.artifact.byte_size = output.artifact.byte_size;
    publicOutput.artifact.sha256 = output.artifact.sha256;
  }

  const productionId = validateComicManifest(raw(value.production)).identity;
  const candidateId = validateComicManifest(raw(value.release)).identity;
  for (const approval of value.approvals) {
    approval.subject = approval.role === 'production-reviewer' ? productionId : candidateId;
    approval.scope = clone(value.release.scope);
    approval.artifact_digests = approval.role === 'production-reviewer'
      ? [] : outputDigests.slice().sort();
  }
  return value;
}

function fullScenario() {
  const value = scenario();
  const pageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
  value.production.renditions.push({
    ...clone(value.production.renditions[0]),
    rendition_id: 'page',
    media_type: 'image/png',
    dimensions: { width: 1, height: 1 },
    alt_text: 'A synthetic one-pixel page.',
    profile: { profile_id: 'comic-page-image', profile_version: '1.0.0' },
    max_bytes: 50_000_000
  });
  const transcript = value.result.outputs[0];
  const page = {
    ...clone(transcript),
    rendition_id: 'page',
    artifact: { ...clone(transcript.artifact), artifact_uri: 'urn:uuid:10000000-0000-4000-8000-000000000011', media_type: 'image/png' },
    dimensions: { width: 1, height: 1 },
    alt_text: 'A synthetic one-pixel page.',
    profile: { profile_id: 'comic-page-image', profile_version: '1.0.0' },
    max_bytes: 50_000_000
  };
  value.result.outputs.push(page);
  value.release.outputs.push({ ...clone(page), artifact: { ...clone(page.artifact), artifact_uri: 'https://example.invalid/synthetic/page.png' } });
  value.bytes.page = pageBytes;
  return rebind(value);
}

function boundary(value, options = {}) {
  const calls = [];
  let revoked = false;
  const approvalBoundary = createComicApprovalBoundary({
    producerActor,
    getTime: () => actionTime,
    verifyCurrentApproval: async binding => {
      calls.push(['publication-approval', binding]);
      return !revoked;
    }
  });
  const verifier = createComicBuildResultBoundary({
    approvalBoundary,
    readArtifactBytes: request => {
      calls.push(['artifact', request]);
      return value.bytes[request.renditionId] ?? null;
    },
    verifyPrivateInfluence: request => {
      calls.push(['attestation', request]);
      return true;
    },
    verifyCurrentDisclosureApproval: request => {
      calls.push(['disclosure', request]);
      return true;
    },
    ...options
  });
  return {
    verifier,
    calls,
    revoke: () => { revoked = true; },
    request: () => ({
      productionSource: raw(value.production),
      resultSource: raw(value.result),
      candidateSource: raw(value.release),
      assignmentSource: raw({ production_id: value.production.production_id, episode_id: value.release.episode_id }),
      approvalSources: value.approvals.map(raw)
    })
  };
}

function code(result) { return result.diagnostics?.[0]?.code; }

test('complete result verifies every declared raw artifact and creates distinct protected evidence and allowlisted proposal', async () => {
  const value = fullScenario();
  const harness = boundary(value);
  const result = await harness.verifier.verify(harness.request());
  assert.equal(result.valid, true, JSON.stringify(result.diagnostics));
  assert.equal(result.proposal.kind, 'comic-public-release-proposal');
  assert.equal(result.protected_evidence.production.identity.sha256,
    validateComicManifest(raw(value.production)).identity.sha256);
  assert.equal(result.protected_evidence.result.identity.sha256,
    validateComicManifest(raw(value.result)).identity.sha256);
  assert.equal(result.protected_evidence.classification, value.result.classification);
  assert.equal(result.protected_evidence.candidate.identity.sha256,
    validateComicManifest(raw(value.release)).identity.sha256);
  assert.equal(result.protected_evidence.verified_artifacts.length, 2);
  assert.deepEqual(result.protected_evidence.verified_artifacts.map(item => item.observed_sha256),
    value.result.outputs.map(output => output.artifact.sha256));
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 2);
  assert.equal(harness.calls.filter(([kind]) => kind === 'attestation').length, 1);
  assert.equal(harness.calls.filter(([kind]) => kind === 'disclosure').length, 1);
  assert.equal(harness.calls.filter(([kind]) => kind === 'publication-approval').length, 3);

  const proposal = JSON.stringify(result.proposal);
  assert.equal(proposal.includes(value.production.production_id), false);
  assert.equal(proposal.includes(value.result.result_id), false);
  assert.equal(proposal.includes(value.result.outputs[0].artifact.artifact_uri), false);
  assert.equal(proposal.includes('approvers'), false);
  assert.equal(proposal.includes(value.approvals[0].decision_id), false);
  assert.equal(proposal.includes(value.approvals[0].actor), false);
  assert.equal(proposal.includes(value.production.inputs.prompts[0].context.use_authorization_reference), false);
  assert.equal(proposal.includes(result.protected_evidence.result.identity.sha256), false);
  assert.deepEqual(result.proposal.release.outputs.map(item => item.artifact.sha256),
    value.release.outputs.map(item => item.artifact.sha256));
  assert.ok(Object.isFrozen(result.proposal.release.outputs[0].artifact));
  assert.ok(Object.isFrozen(result.protected_evidence.result.record.execution.transformations[0]));
});

test('production identity, exact input tuple and C(n) cannot be substituted', async () => {
  const cases = [
    ['unrelated production', value => { value.result.production.production_id = 'urn:uuid:20000000-0000-4000-8000-000000000001'; }, 'PRODUCTION_LINK'],
    ['unrelated input references', value => { value.result.inputs.canon.version = '2.0.0'; }, 'INPUT_LINK'],
    ['later canon snapshot', value => { value.release.input_canon.version = '2.0.0'; }, 'CANON_INPUT']
  ];
  for (const [name, edit, expected] of cases) {
    const value = scenario();
    edit(value);
    const harness = boundary(value);
    const result = await harness.verifier.verify(harness.request());
    assert.equal(code(result), expected, name);
    assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0, name);
  }
});

test('cross-record classification downgrades fail at output compatibility before artifact reads', async () => {
  const value = scenario();
  value.production.classification = 'internal';
  value.production.inputs.prompts[0].context.classification = 'public';
  value.result.classification = 'public';
  rebind(value);

  assert.equal(validateComicManifest(raw(value.production)).valid, true);
  assert.equal(validateComicManifest(raw(value.result)).valid, true);
  assert.equal(validateComicOutputCompatibility(raw(value.production), raw(value.result)).diagnostics[0].code,
    'CLASSIFICATION');

  const harness = boundary(value);
  assert.equal(code(await harness.verifier.verify(harness.request())), 'CLASSIFICATION');
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);
});

test('protected evidence classification reflects the more restrictive build-result level', async () => {
  const value = scenario();
  value.production.classification = 'internal';
  value.production.inputs.prompts[0].context.classification = 'public';
  value.result.classification = 'confidential';
  rebind(value);
  const harness = boundary(value);
  const result = await harness.verifier.verify(harness.request());
  assert.equal(result.valid, true, JSON.stringify(result.diagnostics));
  assert.equal(result.protected_evidence.classification, 'confidential');
  assert.equal(result.protected_evidence.production.record.classification, 'internal');
  assert.equal(result.protected_evidence.result.record.classification, 'confidential');
});

test('declared dependency projection and execution lineage must match the exact build result', async () => {
  for (const edit of [
    value => { value.release.dependencies.pop(); },
    value => { value.release.execution.transformations[0].step_id = 'unrelated-step'; },
    value => { value.release.execution.workflow_id = 'unrelated-workflow'; },
    value => { value.release.gates[0].disposition = 'inconclusive'; },
    value => { value.result.gates[0].disposition = 'fail'; }
  ]) {
    const value = scenario();
    edit(value);
    const harness = boundary(value);
    const result = await harness.verifier.verify(harness.request());
    assert.ok(['PUBLIC_DEPENDENCIES', 'EXECUTION_LINK', 'GATE_BLOCKED'].includes(code(result)));
    assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);
  }
});

test('missing, empty, oversized, short and tampered artifacts fail closed', async () => {
  const cases = [
    ['missing', () => null, 'ARTIFACT_MISSING'],
    ['empty', () => Buffer.alloc(0), 'ARTIFACT_INCOMPLETE'],
    ['short', () => Buffer.from('x'), 'ARTIFACT_SIZE'],
    ['provider exception', () => { throw Error('PRIVATE_CANARY provider failure'); }, 'ARTIFACT_UNAVAILABLE'],
    ['tampered', value => Buffer.alloc(value.bytes.transcript.byteLength, 0x78), 'ARTIFACT_DIGEST']
  ];
  for (const [name, provider, expected] of cases) {
    const value = scenario();
    const harness = boundary(value, { readArtifactBytes: () => provider(value) });
    const result = await harness.verifier.verify(harness.request());
    assert.equal(code(result), expected, name);
    assert.equal(JSON.stringify(result).includes('PRIVATE_CANARY'), false, name);
  }
  const value = scenario();
  const harness = boundary(value, { maxTotalArtifactBytes: value.bytes.transcript.byteLength - 1 });
  const limited = await harness.verifier.verify(harness.request());
  assert.equal(code(limited), 'ARTIFACT_LIMIT');
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);
});

test('incomplete, unrelated and undeclared results fail before reading bytes', async () => {
  const partial = scenario();
  partial.result.status = 'partial';
  partial.result.diagnostics = ['OUTPUT_MISSING'];
  let harness = boundary(partial);
  assert.equal(code(await harness.verifier.verify(harness.request())), 'RESULT_NOT_COMPLETE');
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);


  const unrelated = scenario();
  unrelated.result.production.identity.sha256 = 'sha256:' + '0'.repeat(64);
  harness = boundary(unrelated);
  assert.equal(code(await harness.verifier.verify(harness.request())), 'PRODUCTION_LINK');
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);

  const undeclared = scenario();
  undeclared.result.outputs[0].rendition_id = 'unlisted';
  harness = boundary(undeclared);
  assert.equal(code(await harness.verifier.verify(harness.request())), 'UNEXPECTED_OUTPUT');
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);

  const omitted = fullScenario();
  omitted.result.outputs = omitted.result.outputs.filter(item => item.rendition_id !== 'page');
  omitted.release.outputs = omitted.release.outputs.filter(item => item.rendition_id !== 'page');
  delete omitted.bytes.page;
  rebind(omitted);
  harness = boundary(omitted);
  assert.equal(code(await harness.verifier.verify(harness.request())), 'REQUIRED_OUTPUT');
  assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);
});

test('current disclosure review and #95 approval are required after byte and attestation awaits', async () => {
  const value = scenario();
  const order = [];
  let current = true;
  const approvalBoundary = createComicApprovalBoundary({
    producerActor,
    getTime: () => actionTime,
    verifyCurrentApproval: async () => { order.push('approval'); return current; }
  });
  const verifier = createComicBuildResultBoundary({
    approvalBoundary,
    readArtifactBytes: async () => { order.push('bytes'); await Promise.resolve(); current = false; return value.bytes.transcript; },
    verifyPrivateInfluence: async () => { order.push('attestation'); await Promise.resolve(); return true; },
    verifyCurrentDisclosureApproval: async () => { order.push('disclosure'); await Promise.resolve(); return true; }
  });
  const request = {
    productionSource: raw(value.production), resultSource: raw(value.result), candidateSource: raw(value.release),
    assignmentSource: raw({ production_id: value.production.production_id, episode_id: value.release.episode_id }),
    approvalSources: value.approvals.map(raw)
  };
  const result = await verifier.verify(request);
  assert.equal(code(result), 'APPROVAL_DENIED');
  assert.deepEqual(order, ['bytes', 'attestation', 'disclosure', 'approval']);

  const deniedDisclosure = boundary(value, { verifyCurrentDisclosureApproval: async () => false });
  const disclosureResult = await deniedDisclosure.verifier.verify(deniedDisclosure.request());
  assert.equal(code(disclosureResult), 'DISCLOSURE_DENIED');
  assert.equal(deniedDisclosure.calls.filter(([kind]) => kind === 'publication-approval').length, 0);
});

test('attestation is external, opaque, immutable, and bound to exact production, result, candidate, artifacts and lineage', async () => {
  const value = scenario();
  let attestation;
  const harness = boundary(value, { verifyPrivateInfluence: async request => {
    attestation = request;
    assert.ok(Object.isFrozen(request));
    assert.ok(Object.isFrozen(request.lineage.production_inputs.prompts[0].context));
    assert.equal(request.productionIdentity.sha256, validateComicManifest(raw(value.production)).identity.sha256);
    assert.equal(request.resultIdentity.sha256, validateComicManifest(raw(value.result)).identity.sha256);
    assert.equal(request.candidateIdentity.sha256, validateComicManifest(raw(value.release)).identity.sha256);
    assert.deepEqual(request.artifacts.map(item => item.observed_sha256), value.result.outputs.map(item => item.artifact.sha256));
    assert.throws(() => { request.lineage.transformations[0].input_digests[0] = 'tampered'; }, TypeError);
    return true;
  } });
  const result = await harness.verifier.verify(harness.request());
  assert.equal(result.valid, true);
  assert.equal(attestation.attestationReference, value.release.private_context.attestation_reference);

  const denied = boundary(value, { verifyPrivateInfluence: async () => ({ status: 'verified' }) });
  assert.equal(code(await denied.verifier.verify(denied.request())), 'ATTESTATION_UNVERIFIED');
  assert.equal(denied.calls.filter(([kind]) => kind === 'publication-approval').length, 0);
});

test('byte buffers and raw inputs are snapshotted before later mutation', async () => {
  const value = scenario();
  let supplied;
  const source = Buffer.from(raw(value.production));
  const harness = boundary(value, {
    readArtifactBytes: async () => {
      supplied = Buffer.from(value.bytes.transcript);
      setTimeout(() => supplied.fill(0), 5);
      setTimeout(() => source.fill(0), 5);
      return supplied;
    },
    verifyCurrentDisclosureApproval: async () => {
      await new Promise(resolve => setTimeout(resolve, 15));
      return true;
    }
  });
  const request = harness.request();
  request.productionSource = source;
  const result = await harness.verifier.verify(request);
  assert.equal(result.valid, true);
  assert.equal(result.protected_evidence.production.identity.sha256,
    validateComicManifest(raw(value.production)).identity.sha256);
  assert.equal(result.protected_evidence.verified_artifacts[0].observed_sha256, digest(value.bytes.transcript));
});

test('async byte streams are copied per chunk before the provider can reuse its buffer', async () => {
  const value = scenario();
  const harness = boundary(value, {
    readArtifactBytes: async function* () {
      const reused = Buffer.from(value.bytes.transcript);
      yield reused;
      reused.fill(0);
    }
  });
  const result = await harness.verifier.verify(harness.request());
  assert.equal(result.valid, true);
  assert.equal(result.protected_evidence.verified_artifacts[0].observed_sha256, digest(value.bytes.transcript));
});

test('non-byte objects, shared memory, and provider chunks over the passed cap are rejected', async () => {
  const providers = [
    () => new DataView(Buffer.from('invalid').buffer),
    () => new Proxy(Buffer.from('invalid'), {}),
    () => new SharedArrayBuffer(1),
    request => Buffer.alloc(request.maxBytes + 1)
  ];
  for (let index = 0; index < providers.length; index++) {
    const value = scenario();
    const harness = boundary(value, { readArtifactBytes: request => providers[index](request) });
    const result = await harness.verifier.verify(harness.request());
    assert.equal(code(result), index === 3 ? 'ARTIFACT_LIMIT' : 'ARTIFACT_BYTES');
  }
});

test('async streams have a bounded chunk count, including empty chunks', async () => {
  const value = scenario();
  const harness = boundary(value, { readArtifactBytes: async function* () {
    for (let index = 0; index < 65_537; index++) yield Buffer.alloc(0);
  } });
  assert.equal(code(await harness.verifier.verify(harness.request())), 'ARTIFACT_LIMIT');
});

test('uninfluenced public inputs need no private attestation but still need disclosure and publication approval', async () => {
  const value = scenario();
  value.production.classification = 'public';
  value.result.classification = 'public';
  value.production.inputs.prompts[0].context = null;
  value.release.private_context = { influenced: false };
  value.release.approvers = value.release.approvers.filter(item => item.role !== 'disclosure-reviewer');
  value.approvals = value.approvals.filter(item => item.role !== 'disclosure-reviewer');
  rebind(value);
  const harness = boundary(value);
  const result = await harness.verifier.verify(harness.request());
  assert.equal(result.valid, true, JSON.stringify(result.diagnostics));
  assert.equal(harness.calls.filter(([kind]) => kind === 'attestation').length, 0);
  assert.equal(harness.calls.filter(([kind]) => kind === 'disclosure').length, 1);
  assert.equal(harness.calls.filter(([kind]) => kind === 'publication-approval').length, 2);
  assert.deepEqual(result.proposal.release.private_context, { influenced: false });
});

test('credential-bearing and secret-parameter URIs are rejected without provider access', async () => {
  const cases = [
    value => { value.result.outputs[0].artifact.artifact_uri = 'https://user:password@example.invalid/artifact'; },
    value => { value.release.scope.destination = 'https://example.invalid/release?access_token=synthetic-secret'; },
    value => { value.release.outputs[0].artifact.artifact_uri = 'https://example.invalid/file?X-Amz-Signature=synthetic-secret'; }
  ];
  for (const edit of cases) {
    const value = scenario();
    edit(value);
    const harness = boundary(value);
    assert.equal(code(await harness.verifier.verify(harness.request())), 'UNSAFE_URI');
    assert.equal(harness.calls.filter(([kind]) => kind === 'artifact').length, 0);
  }
});

test('private canaries in protected evidence never flow to proposal and public text or URLs require qualified disclosure approval', async () => {
  const value = scenario();
  value.production.intent = 'PRIVATE_CANARY prose with encoded %2F path marker';
  value.production.inputs.prompts[0].context.purpose = 'PRIVATE_CANARY private package context';
  value.release.scope.destination = 'https://example.invalid/PRIVATE_CANARY/%2F';
  value.release.gates[0].rationale = 'PRIVATE_CANARY nested gate evidence';
  value.release.execution.generation = [{
    provider: 'synthetic-provider', model: 'synthetic-model',
    parameters: [{ name: 'fixture', value: 'PRIVATE_CANARY parameter' }],
    evidence_state: 'recorded', limitations: 'PRIVATE_CANARY limitation'
  }];
  value.production.renditions[0].alt_text = 'PRIVATE_CANARY approved text sentinel';
  value.result.outputs[0].alt_text = value.production.renditions[0].alt_text;
  value.release.outputs[0].alt_text = value.production.renditions[0].alt_text;
  rebind(value);
  const harness = boundary(value, { verifyCurrentDisclosureApproval: async request => {
    assert.ok(JSON.stringify(request.publicProposal).includes('PRIVATE_CANARY'));
    return false;
  } });
  const result = await harness.verifier.verify(harness.request());
  assert.equal(code(result), 'DISCLOSURE_DENIED');

  const approved = boundary(value);
  const projected = await approved.verifier.verify(approved.request());
  assert.equal(projected.valid, true);
  const proposal = JSON.stringify(projected.proposal);
  assert.equal(proposal.includes('PRIVATE_CANARY'), true);
  assert.equal(proposal.includes('use_authorization_reference'), false);
  assert.equal(proposal.includes(value.production.production_id), false);
  assert.equal(proposal.includes(value.result.result_id), false);
});

test('configuration requires explicit byte, disclosure, attestation, and approval adapters', () => {
  const approvalBoundary = createComicApprovalBoundary({
    producerActor, getTime: () => actionTime, verifyCurrentApproval: () => true
  });
  assert.throws(() => createComicBuildResultBoundary({}), /Invalid Comic Manifest build-result boundary configuration/);
  assert.throws(() => createComicBuildResultBoundary({
    readArtifactBytes: () => Buffer.alloc(0),
    verifyCurrentDisclosureApproval: () => true,
    verifyPrivateInfluence: () => true,
    approvalBoundary,
    maxTotalArtifactBytes: Number.MAX_SAFE_INTEGER
  }), /Invalid Comic Manifest build-result boundary configuration/);
});
