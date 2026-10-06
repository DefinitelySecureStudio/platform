import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  canonicalJson,
  validateContextDocument,
  validateContextBinding,
  validatePromptDefinition,
  renderPromptWithContextPackage,
  CONTEXT_PACKAGE_CONTRACT
} from '../../src/prompt-sdk/index.js';
import {
  createComicReferenceResolver,
  planComicReferences,
  validateComicManifest
} from '../../src/comic-manifest/index.js';
import { createBuildArtifact, verifyBuildArtifact } from '../../src/context-builder/index.js';

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url)));
const lock = await read('../fixtures/comic-manifest-contract-lock.json');
const schema = await read('../fixtures/comic-manifest-v1.schema.json');
const fixture = await read('../fixtures/comic-manifest-v1.json');
const foundation = await read('../fixtures/context-builder-v1.json');
const hash = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const identity = value => {
  const bytes = Buffer.from(canonicalJson(value), 'utf8');
  return { canonicalization: 'studio-json-v1', byte_size: bytes.byteLength, sha256: hash(bytes) };
};
const ajv = new Ajv({ strict: true, strictRequired: false, strictTypes: false, allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);
const approval = ajv.compile({ $ref: schema.$id + '#/$defs/approval' });

function bytesFor(reference) {
  if (reference.kind === 'public') {
    const content = fixture.dependency_bytes[reference.dependency.artifact.artifact_uri];
    assert.equal(typeof content, 'string', 'The public fixture bytes are explicitly supplied.');
    return Buffer.from(content, 'utf8');
  }
  if (reference.kind === 'context-package') return Buffer.from(canonicalJson(foundation.result.package), 'utf8');
  if (reference.kind === 'builder-result') return Buffer.from(canonicalJson(foundation.result), 'utf8');
  assert.fail(`Unexpected synthetic reference kind: ${reference.kind}`);
}

function transportFor(reference, bytes) {
  return reference.kind === 'public'
    ? {
        media_type: reference.dependency.artifact.media_type,
        byte_size: reference.dependency.artifact.byte_size,
        sha256: reference.dependency.artifact.sha256
      }
    : { media_type: 'application/json', byte_size: bytes.byteLength, sha256: hash(bytes) };
}

async function resolveComicReferences(source = fixture.production, { readDecision = 'allow' } = {}) {
  const sourceJson = canonicalJson(source);
  // The host's synthetic inventory is fixed from the reviewed fixture, not derived
  // from whatever Manifest a consumer later presents.
  const plan = planComicReferences(canonicalJson(fixture.production));
  assert.equal(plan.valid, true, JSON.stringify(plan.diagnostics));
  let reads = 0;
  const bindings = plan.references.map(({ reference, classification }) => {
    const bytes = bytesFor(reference);
    return {
      referenceSource: canonicalJson(reference),
      artifactSource: canonicalJson(transportFor(reference, bytes)),
      classification,
      async *read({ maxBytes, signal }) {
        assert.equal(signal.aborted, false);
        assert.ok(bytes.byteLength <= maxBytes);
        reads++;
        yield Uint8Array.from(bytes);
      }
    };
  });
  const firstPublic = plan.references.find(({ reference }) => reference.kind === 'public')?.reference;
  assert.ok(firstPublic, 'The test host installs the required public contract pin.');
  const resolver = createComicReferenceResolver({
    bindings,
    requiredPublicReferences: plan.references
      .filter(({ reference }) => reference.kind === 'public')
      .map(({ reference }) => canonicalJson(reference)),
    authorize: async ({ scope }) => canonicalJson({
      decision: readDecision,
      scope,
      not_before: scope.at,
      expires_at: '2026-09-15T23:00:00Z',
      revocation: { status: readDecision === 'allow' ? 'active' : 'revoked', checked_at: scope.at }
    }),
    getTime: () => fixture.at,
    callerId: foundation.request.caller_id,
    purpose: 'Offline Comic Manifest reference conformance.',
    maxClassification: 'restricted'
  });
  const verified = await resolver.verify(sourceJson);
  return { plan, reads, verified };
}

// This test-only consumer models a protected reference handoff. It only accepts
// bytes already verified by the installed reference resolver and uses the released
// SDK for current package authorization, binding, and rendering. It never executes
// a prompt or calls a model adapter.
async function comicPromptHandoff(source, verified, { authorizationProvider, authorization, at, inputValues, render = renderPromptWithContextPackage } = {}) {
  const manifestReport = validateComicManifest(canonicalJson(source));
  assert.equal(manifestReport.valid, true, JSON.stringify(manifestReport.diagnostics));
  const production = manifestReport.value;
  assert.equal(production.kind, 'comic-production');
  assert.ok(authorizationProvider && typeof authorizationProvider.authorize === 'function',
    'A trusted host authorization provider must reverify package use at this boundary.');
  assert.equal(typeof at, 'string', 'The package-use evaluation time is explicit.');
  assert.equal(verified?.valid, true, 'Only a successful exact reference verification can be handed off.');
  assert.equal(canonicalJson(verified.manifest_identity), canonicalJson(identity(production)));

  const promptBinding = production.inputs.prompts[0];
  assert.ok(promptBinding?.context, 'The bound prompt declares its package use.');
  const artifacts = new Map(verified.artifacts.map(artifact => [canonicalJson(artifact.reference), artifact]));
  const documentFor = reference => {
    const artifact = artifacts.get(canonicalJson(reference));
    assert.ok(artifact, 'The exact Manifest selector must resolve to verified bytes.');
    return JSON.parse(Buffer.from(artifact.bytes).toString('utf8'));
  };
  const definition = documentFor({ kind: 'public', dependency: promptBinding.definition });
  const packageReference = {
    kind: 'context-package',
    package: {
      id: promptBinding.context.package_id,
      version: promptBinding.context.package_version,
      instance_id: promptBinding.context.instance_id
    },
    manifest_identity: promptBinding.context.manifest_identity
  };
  const packageDocument = documentFor(packageReference);
  const builderResultDocument = documentFor({ kind: 'builder-result', identity: promptBinding.context.builder_result_identity });

  assert.equal(validatePromptDefinition(definition).valid, true);
  assert.equal(definition.id, promptBinding.prompt_id);
  assert.equal(definition.version, promptBinding.prompt_version);
  assert.equal(canonicalJson(identity(definition)), canonicalJson(promptBinding.identity));
  assert.equal(promptBinding.definition.version, promptBinding.prompt_version);
  assert.equal(promptBinding.definition.artifact.byte_size, promptBinding.identity.byte_size);
  assert.equal(promptBinding.definition.artifact.sha256, promptBinding.identity.sha256);

  assert.equal(validateContextDocument(packageDocument).valid, true);
  assert.equal(canonicalJson(identity(packageDocument.manifest)), canonicalJson(promptBinding.context.manifest_identity));
  assert.equal(canonicalJson(packageDocument.manifest.package), canonicalJson({
    id: promptBinding.context.package_id,
    version: promptBinding.context.package_version,
    instance_id: promptBinding.context.instance_id
  }));
  assert.equal(packageDocument.spec_version, promptBinding.context.contract_version);
  assert.equal(packageDocument.manifest.purpose, promptBinding.context.purpose);
  assert.equal(packageDocument.manifest.classification, promptBinding.context.classification);
  assert.deepEqual(promptBinding.context.sections, packageDocument.manifest.sections.map(section => section.slot));

  assert.equal(builderResultDocument.kind, 'context-build-result');
  assert.equal(builderResultDocument.spec_version, '1.0.0');
  assert.equal(builderResultDocument.status, 'prepared');
  assert.equal(canonicalJson(identity(builderResultDocument)), canonicalJson(promptBinding.context.builder_result_identity));
  const builderResult = verifyBuildArtifact(createBuildArtifact(builderResultDocument)).result;
  assert.deepEqual(builderResult.package, packageDocument, 'The Builder result and package reference the same immutable package.');
  assert.equal(builderResult.package.manifest.authority_reference, promptBinding.context.preparation_reference);
  assert.equal(typeof builderResult.evidence_reference, 'string');
  assert.ok(builderResult.evidence_reference.length > 0);

  // A saved authorization document is only historical data. Ask the trusted host
  // authority at the use boundary and require its current revocation check to bind
  // to this exact prompt/package/scope/time before giving the grant to the SDK.
  const authorizationRequest = {
    prompt: { id: definition.id, version: definition.version },
    package: packageDocument.manifest.package,
    sections: packageDocument.manifest.sections.map(section => section.slot),
    purpose: packageDocument.manifest.purpose,
    classification: packageDocument.manifest.classification,
    at
  };
  const verifiedUse = await authorizationProvider.authorize(authorizationRequest);
  assert.equal(verifiedUse?.status, 'verified', 'The host authority must explicitly reverify use.');
  assert.equal(verifiedUse?.revocation?.status, 'active', 'The host must confirm the grant is not revoked.');
  assert.equal(verifiedUse?.revocation?.checked_at, at, 'Revocation must be checked at the use evaluation time.');
  assert.equal(canonicalJson(verifiedUse?.request), canonicalJson(authorizationRequest),
    'The host verification must cover the exact use request.');
  authorization = verifiedUse.authorization;
  const binding = validateContextBinding(definition, packageDocument, authorization, { at });
  if (!binding.valid) throw new Error('CURRENT_USE_AUTHORIZATION_INVALID');
  const { renderedPrompt } = render(definition, {
    inputValues: inputValues ?? { item: 'blue cube', attributes: {} },
    packageDocument,
    authorization,
    at
  });
  return {
    renderedPrompt,
    handoff: {
      binding_id: promptBinding.binding_id,
      prompt_identity: promptBinding.identity,
      package_identity: packageDocument.manifest_identity,
      builder_result_identity: promptBinding.context.builder_result_identity,
      preparation_reference: promptBinding.context.preparation_reference,
      builder_evidence_reference: builderResult.evidence_reference,
      historical_use_authorization_reference: promptBinding.context.use_authorization_reference,
      current_use_authorization: {
        decision_id: authorization.decision_id,
        authority_reference: authorization.authority_reference
      }
    }
  };
}

function currentUseAuthorization({ decisionId = 'urn:uuid:00000000-0000-4000-8000-000000000073' } = {}) {
  const packageDocument = foundation.result.package;
  return {
    spec_version: '1.0.0',
    kind: 'context-authorization',
    decision_id: decisionId,
    decision: 'allow',
    package: structuredClone(packageDocument.manifest.package),
    prompt: { id: foundation.prompt.id, version: foundation.prompt.version },
    sections: packageDocument.manifest.sections.map(section => section.slot),
    max_classification: packageDocument.manifest.classification,
    purpose: packageDocument.manifest.purpose,
    decided_by: 'synthetic.test.authority',
    decided_at: '2026-09-15T12:05:00Z',
    expires_at: '2026-09-15T13:00:00Z',
    authority_reference: 'urn:uuid:00000000-0000-4000-8000-000000000074'
  };
}

// A small trusted-host stand-in: approvals are independently configured records,
// and authorize() rechecks current revocation for every exact use request. It never
// creates or renews an authorization document.
function syntheticUseAuthority({ approvals, revocationStatus = 'active' }) {
  let calls = 0;
  return {
    get calls() { return calls; },
    async authorize(request) {
      calls++;
      assert.equal(revocationStatus, 'active', 'The synthetic host authority denies revoked grants.');
      const authorization = approvals[0];
      assert.ok(authorization, 'The host authority needs an independently supplied approval record.');
      return {
        status: 'verified',
        request: structuredClone(request),
        authorization: structuredClone(authorization),
        revocation: { status: revocationStatus, checked_at: request.at }
      };
    }
  };
}

test('Comic candidate schema/fixtures are exact Codex source pins, not production locks', async () => {
  assert.equal(lock.status, 'unreleased-test-only');
  assert.match(lock.commit, /^[0-9a-f]{40}$/);
  assert.equal(CONTEXT_PACKAGE_CONTRACT.status, 'released');
  assert.equal(CONTEXT_PACKAGE_CONTRACT.version, '1.0.0');
  for (const artifact of lock.artifacts) {
    const bytes = await readFile(new URL('../../' + artifact.path, import.meta.url));
    assert.equal(bytes.length, artifact.byte_size);
    assert.equal(hash(bytes), artifact.sha256);
    assert.equal(artifact.artifact_uri, `https://github.com/${lock.repository}/blob/${lock.commit}/${artifact.source_path}`);
  }
});

test('Platform AJV accepts all three Codex records and detached evidence', () => {
  for (const kind of ['production', 'result', 'release']) assert.equal(validate(fixture[kind]), true, JSON.stringify(validate.errors));
  for (const item of fixture.approvals) assert.equal(approval(item), true, JSON.stringify(approval.errors));
});

test('exact Manifest prompt, prepared package and Builder evidence pass the offline SDK handoff', async () => {
  const { plan, reads, verified } = await resolveComicReferences();
  assert.equal(verified.valid, true, JSON.stringify(verified.diagnostics));
  assert.equal(reads, plan.references.length);
  const authorization = currentUseAuthorization();
  const authorizationProvider = syntheticUseAuthority({ approvals: [authorization] });
  const renderCalls = [];
  const result = await comicPromptHandoff(fixture.production, verified, {
    authorizationProvider,
    at: fixture.at,
    render(definition, options) {
      renderCalls.push({ definition, options });
      return renderPromptWithContextPackage(definition, options);
    }
  });
  assert.equal(renderCalls.length, 1);
  assert.equal(result.renderedPrompt.classification, 'internal');
  assert.match(result.renderedPrompt.messages[1].content, /Synthetic approved note\./);
  assert.match(result.renderedPrompt.messages[1].content, /"facts":\["synthetic"\]/);
  assert.equal(result.handoff.builder_evidence_reference, foundation.result.evidence_reference);
  assert.equal(result.handoff.preparation_reference, foundation.request.preparation_reference);
  assert.equal(result.handoff.historical_use_authorization_reference, fixture.production.inputs.prompts[0].context.use_authorization_reference);
  assert.equal(result.handoff.current_use_authorization.decision_id, authorization.decision_id);
  assert.equal(authorizationProvider.calls, 1, 'The host authority is consulted at the use boundary.');
});

test('Platform canonical identity agrees with every Codex linkage and approval subject', () => {
  assert.deepEqual(fixture.linkage.production.identity, identity(fixture.production));
  assert.deepEqual(fixture.linkage.result_identity, identity(fixture.result));
  assert.deepEqual(fixture.linkage.release_identity, identity(fixture.release));
  for (const item of fixture.approvals) assert.deepEqual(item.subject, identity(item.role === 'production-reviewer' ? fixture.production : fixture.release));
});

test('offline public verification needs only release data and published bytes', () => {
  const { release, output_bytes, dependency_bytes } = fixture;
  for (const output of release.outputs) {
    const bytes = Buffer.from(output_bytes[output.rendition_id]);
    assert.equal(bytes.length, output.artifact.byte_size);
    assert.equal(hash(bytes), output.artifact.sha256);
  }
  for (const dependency of [release.input_canon, ...release.dependencies]) {
    const bytes = Buffer.from(dependency_bytes[dependency.artifact.artifact_uri]);
    assert.equal(bytes.length, dependency.artifact.byte_size);
    assert.equal(hash(bytes), dependency.artifact.sha256);
  }
  // Integrity does not certify disclosure or publication authority.
  const publicText = JSON.stringify(release);
  for (const secret of [fixture.production.production_id, fixture.result.result_id, identity(fixture.production).sha256,
    identity(fixture.result).sha256, foundation.result.package.manifest_identity.sha256, ...fixture.protected_sentinels]) {
    assert.equal(publicText.includes(secret), false);
  }
});

test('unknown behavior and protected identifiers cannot enter the public schema', () => {
  for (const [key, value] of [['production_id', fixture.production.production_id], ['allow', true], ['spec_version', '1.1.0']]) {
    assert.equal(validate({ ...fixture.release, [key]: value }), false);
  }
  const bad = structuredClone(fixture.release);
  bad.private_context.package_id = foundation.result.package.manifest.package.id;
  assert.equal(validate(bad), false);
});

test('schema-valid Manifest cannot substitute the prompt, package, purpose, slots, classification or Builder evidence', async () => {
  const { verified } = await resolveComicReferences();
  const mutations = [
    manifest => { manifest.inputs.prompts[0].context.instance_id = manifest.production_id; },
    manifest => { manifest.inputs.prompts[0].prompt_version = '9.0.0'; },
    manifest => { manifest.inputs.prompts[0].context.manifest_identity.sha256 = 'sha256:' + '0'.repeat(64); },
    manifest => { manifest.inputs.prompts[0].context.builder_result_identity.sha256 = 'sha256:' + '0'.repeat(64); },
    manifest => { manifest.inputs.prompts[0].context.purpose = 'different-purpose'; },
    manifest => { manifest.inputs.prompts[0].context.sections = ['other']; },
    manifest => { manifest.inputs.prompts[0].context.classification = 'public'; }
  ];
  for (const mutate of mutations) {
    const production = structuredClone(fixture.production);
    mutate(production);
    assert.equal(validateComicManifest(canonicalJson(production)).valid, true);
    let renders = 0;
    await assert.rejects(() => comicPromptHandoff(production, verified, {
      authorizationProvider: syntheticUseAuthority({ approvals: [currentUseAuthorization()] }),
      at: fixture.at,
      render() { renders++; throw new Error('Rendering must not occur for an invalid link.'); }
    }));
    assert.equal(renders, 0);
  }
});

test('historical preparation/use evidence cannot replace a separate current package-use authorization', async () => {
  const { verified } = await resolveComicReferences();
  let renders = 0;
  assert.equal(foundation.authorization.decision_id,
    fixture.production.inputs.prompts[0].context.use_authorization_reference,
    'The regression fixture reproduces the historical authorization reference.');
  await assert.rejects(() => comicPromptHandoff(fixture.production, verified, {
    authorization: foundation.authorization,
    at: fixture.at,
    render() { renders++; throw new Error('A direct historical authorization must not render.'); }
  }), /trusted host authorization provider/);
  assert.equal(renders, 0);

  // Reverification is the freshness boundary. An authority can recheck and return
  // the same decision ID when that grant remains current; ID inequality is not the
  // freshness test.
  const sameDecisionIdProvider = syntheticUseAuthority({ approvals: [structuredClone(foundation.authorization)] });
  const result = await comicPromptHandoff(fixture.production, verified, {
    authorizationProvider: sameDecisionIdProvider,
    at: fixture.at
  });
  assert.equal(sameDecisionIdProvider.calls, 1);
  assert.equal(result.handoff.current_use_authorization.decision_id, foundation.authorization.decision_id);

  const revokedProvider = syntheticUseAuthority({ approvals: [foundation.authorization], revocationStatus: 'revoked' });
  await assert.rejects(() => comicPromptHandoff(fixture.production, verified, {
    authorizationProvider: revokedProvider,
    at: fixture.at,
    render() { renders++; throw new Error('A revoked authorization must not render.'); }
  }), /synthetic host authority denies revoked grants/);
  assert.equal(renders, 0);

  await assert.rejects(() => comicPromptHandoff(fixture.production, verified, {
    authorizationProvider: syntheticUseAuthority({ approvals: [foundation.result] }),
    at: fixture.at,
    render() { renders++; throw new Error('Builder evidence is not a use grant.'); }
  }), /CURRENT_USE_AUTHORIZATION_INVALID/);
  assert.equal(renders, 0);
});

test('wrong, denied, stale or revoked current authorization fails before rendering', async () => {
  const { verified } = await resolveComicReferences();
  const cases = [
    ['denied/revoked', authorization => { authorization.decision = 'deny'; }, fixture.at],
    ['wrong prompt', authorization => { authorization.prompt.version = '9.0.0'; }, fixture.at],
    ['wrong package', authorization => { authorization.package.instance_id = 'urn:uuid:00000000-0000-4000-8000-000000000099'; }, fixture.at],
    ['wrong purpose', authorization => { authorization.purpose = 'different-purpose'; }, fixture.at],
    ['wrong sections', authorization => { authorization.sections = []; }, fixture.at],
    ['insufficient classification', authorization => { authorization.max_classification = 'public'; }, fixture.at],
    ['expired grant', authorization => {}, '2026-09-15T13:00:00Z']
  ];
  for (const [name, mutate, at] of cases) {
    const authorization = currentUseAuthorization();
    mutate(authorization);
    let renders = 0;
    await assert.rejects(() => comicPromptHandoff(fixture.production, verified, {
      authorizationProvider: syntheticUseAuthority({ approvals: [authorization] }),
      at,
      render() { renders++; throw new Error(`Rendering must not occur after ${name}.`); }
    }), /CURRENT_USE_AUTHORIZATION_INVALID/);
    assert.equal(renders, 0, `${name} is rejected before rendering.`);
  }
});

test('a revoked reference-read grant stops before any synthetic reader runs', async () => {
  const { reads, verified } = await resolveComicReferences(fixture.production, { readDecision: 'deny' });
  assert.equal(verified.valid, false);
  assert.equal(verified.diagnostics[0].code, 'ACCESS_DENIED');
  assert.equal(reads, 0);
});
