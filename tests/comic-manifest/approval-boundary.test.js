import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  createComicApprovalBoundary,
  diffComicRevision,
  validateComicManifest
} from '../../src/comic-manifest/index.js';
import { canonicalJson } from '../../src/prompt-sdk/canonical-json.js';

const read = async path => JSON.parse(await readFile(new URL('../fixtures/' + path, import.meta.url)));
const fixture = await read('comic-manifest-v1.json');
const timeCases = await read('comic-manifest-v1-approval-times.json');
const schema = await read('comic-manifest-v1.schema.json');
const timeAjv = new Ajv2020({ strict: true });
addFormats(timeAjv);
const schemaTime = timeAjv.compile(schema.$defs.time);
const raw = value => JSON.stringify(value);
const actionTime = '2026-09-15T12:05:00Z';
const producerActor = 'synthetic-producer';
const identity = value => validateComicManifest(raw(value)).identity;

function boundary({ now = actionTime, verify = () => true, producer = producerActor } = {}) {
  return createComicApprovalBoundary({ getTime: () => now, verifyCurrentApproval: verify, producerActor: producer });
}

function correctedRelease(previous = fixture.release) {
  const next = structuredClone(previous);
  next.revision = previous.revision + 1;
  next.release_id = 'urn:uuid:10000000-0000-4000-8000-000000000999';
  next.previous = {
    release_id: previous.release_id,
    episode_id: previous.episode_id,
    revision: previous.revision,
    identity: identity(previous)
  };
  next.title = 'Corrected synthetic title';
  return next;
}

function matrixInputs(entry) {
  const release = structuredClone(fixture.release);
  release.scope.publication_time = entry.publication_time;
  for (const approver of release.approvers) approver.decided_at = entry.decided_at;
  const validated = validateComicManifest(raw(release));
  if (!validated.valid) return { release, approvals: null };
  const approvals = fixture.approvals.slice(1).map(source => {
    const approval = structuredClone(source);
    approval.subject = validated.identity;
    approval.scope = structuredClone(release.scope);
    approval.decided_at = entry.decided_at;
    approval.expires_at = entry.expires_at;
    return approval;
  });
  return { release, approvals };
}

test('release approval boundary binds current decisions to exact release, outputs, scope, and action', async () => {
  const calls = [];
  const result = await boundary({ verify: input => { calls.push(input); return true; } }).verify({
    candidateSource: raw(fixture.release), approvalSources: fixture.approvals.slice(1).map(raw)
  });
  assert.deepEqual(result, { valid: true, intended_action: 'publish-release', diagnostics: [] });
  assert.deepEqual(calls.map(call => call.role).sort(), ['canon-editor', 'disclosure-reviewer', 'publisher']);
  for (const call of calls) {
    assert.equal(call.intendedAction, 'publish-release');
    assert.equal(canonicalJson(call.subject), canonicalJson(identity(fixture.release)));
    assert.deepEqual(call.artifactDigests, ['sha256:5aa128a0dd0945b00ba3d71a5f7b5916e06f40c53048c31d74432eb03f4e764d']);
    assert.equal(canonicalJson(call.scope), canonicalJson(fixture.release.scope));
    assert.equal(call.actionTime, actionTime);
    assert.equal(call.authorityReference, 'urn:uuid:10000000-0000-4000-8000-000000000400');
  }
});

test('production review is separately scoped and binds the exact production with no artifacts', async () => {
  const calls = [];
  const result = await boundary({ verify: input => { calls.push(input); return true; } }).verify({
    candidateSource: raw(fixture.production),
    approvalSources: [raw(fixture.approvals[0])],
    reviewScopeSource: raw(fixture.release.scope)
  });
  assert.equal(result.valid, true);
  assert.equal(result.intended_action, 'review-production');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].intendedAction, 'review-production');
  assert.equal(canonicalJson(calls[0].subject), canonicalJson(identity(fixture.production)));
  assert.deepEqual(calls[0].artifactDigests, []);
});

test('each call rechecks issuer/revocation and only literal true authorizes', async () => {
  let count = 0;
  const verify = boundary({ verify: () => { count++; return true; } });
  const request = { candidateSource: raw(fixture.release), approvalSources: fixture.approvals.slice(1).map(raw) };
  assert.equal((await verify.verify(request)).valid, true);
  assert.equal((await verify.verify(request)).valid, true);
  assert.equal(count, 6);
  for (const response of [false, undefined, 'approved', { status: 'approved' }]) {
    const result = await boundary({ verify: () => response }).verify(request);
    assert.equal(result.valid, false);
    assert.equal(result.diagnostics[0].code, response === false ? 'APPROVAL_DENIED' : 'APPROVAL_UNVERIFIED');
  }
  const thrown = await boundary({ verify: () => { throw Error('private verifier detail'); } }).verify(request);
  assert.deepEqual(thrown, { valid: false, diagnostics: [{ stage: 'approval', code: 'APPROVAL_UNVERIFIED' }] });
  assert.equal(JSON.stringify(thrown).includes('private verifier detail'), false);
});

test('reviewer role set, producer separation, exact subject, artifacts, metadata, and scope fail closed', async () => {
  const approvals = fixture.approvals.slice(1).map(a => structuredClone(a));
  const run = source => boundary().verify({ candidateSource: raw(fixture.release), approvalSources: source });
  assert.equal((await run(approvals.slice(0, 2).map(raw))).diagnostics[0].code, 'APPROVAL_ROLES');

  const cases = [
    ['subject', a => { a[0].subject.sha256 = 'sha256:' + '0'.repeat(64); }, 'APPROVAL_BINDING'],
    ['artifact list', a => { a[0].artifact_digests = []; }, 'APPROVAL_ARTIFACTS'],
    ['scope', a => { a[0].scope.audience = 'other synthetic audience'; }, 'APPROVAL_BINDING'],
    ['release approver metadata', a => { a[0].actor = 'other synthetic actor'; }, 'APPROVAL_BINDING'],
    ['duplicate role', a => { a[1].role = a[0].role; }, 'APPROVAL_ROLES']
  ];
  for (const [name, edit, code] of cases) {
    const changed = approvals.map(a => structuredClone(a)); edit(changed);
    const result = await run(changed.map(raw));
    assert.equal(result.diagnostics[0].code, code, name);
  }

  const self = approvals.map(a => structuredClone(a));
  self[0].actor = producerActor;
  const candidate = structuredClone(fixture.release);
  candidate.approvers.find(item => item.role === self[0].role).actor = producerActor;
  for (const approval of self) approval.subject = identity(candidate);
  const selfResult = await boundary().verify({ candidateSource: raw(candidate), approvalSources: self.map(raw) });
  assert.equal(selfResult.diagnostics[0].code, 'SELF_APPROVAL');

  const badScope = await boundary().verify({
    candidateSource: raw(fixture.production), approvalSources: [raw(fixture.approvals[0])],
    reviewScopeSource: raw({ ...fixture.release.scope, purpose: 'Different synthetic purpose.' })
  });
  assert.equal(badScope.diagnostics[0].code, 'APPROVAL_BINDING');
});

test('stale decisions cannot cross a correction or replace bytes within one revision', async () => {
  const corrected = correctedRelease();
  assert.equal(corrected.episode_id, fixture.release.episode_id);
  assert.equal(corrected.release_id === fixture.release.release_id, false);
  const result = await boundary().verify({
    candidateSource: raw(corrected), previousSource: raw(fixture.release),
    approvalSources: fixture.approvals.slice(1).map(raw)
  });
  assert.equal(result.diagnostics[0].code, 'APPROVAL_BINDING');

  const altered = structuredClone(fixture.release);
  altered.title = 'Changed with the old revision number';
  const rejected = await boundary().verify({ candidateSource: raw(altered), previousSource: raw(fixture.release), approvalSources: fixture.approvals.slice(1).map(raw) });
  assert.equal(rejected.diagnostics[0].code, 'IMMUTABLE_REVISION');
});

test('revision diffs are deterministic and withhold categories for non-public revisions', () => {
  const next = correctedRelease();
  assert.deepEqual(diffComicRevision(raw(next), raw(fixture.release)), {
    valid: true, changed: true,
    categories: ['creative-content', 'identity', 'revision'],
    details_withheld: false, diagnostics: []
  });
  const replay = diffComicRevision(raw(fixture.release), raw(fixture.release));
  assert.deepEqual(replay, { valid: true, changed: false, categories: [], details_withheld: false, diagnostics: [] });

  const privateNext = structuredClone(fixture.production);
  privateNext.revision = 2;
  privateNext.previous = {
    production_id: fixture.production.production_id, revision: 1, identity: identity(fixture.production)
  };
  privateNext.title = 'Protected synthetic sentinel';
  const hidden = diffComicRevision(raw(privateNext), raw(fixture.production));
  assert.deepEqual(hidden, { valid: true, details_withheld: true, diagnostics: [] });
  assert.equal(JSON.stringify(hidden).includes('Protected synthetic sentinel'), false);
});

for (const entry of timeCases) test(`Codex approval-time boundary: ${entry.name}`, async () => {
  if (entry.schema_valid_action_time !== undefined) assert.equal(schemaTime(entry.action_time), entry.schema_valid_action_time);
  const { release, approvals } = matrixInputs(entry);
  if (!approvals) {
    const result = await boundary({ now: entry.action_time }).verify({
      candidateSource: raw(release), approvalSources: fixture.approvals.slice(1).map(raw)
    });
    assert.equal(result.valid, false);
    return;
  }
  const result = await boundary({ now: entry.action_time }).verify({
    candidateSource: raw(release), approvalSources: approvals.map(raw)
  });
  assert.equal(result.valid, entry.valid, entry.name + ': ' + JSON.stringify(result.diagnostics));
});

test('unsupported actions, unknown roles, and non-exact review scopes cannot authorize', async () => {
  const releaseAsReview = await boundary().verify({
    candidateSource: raw(fixture.release), approvalSources: fixture.approvals.slice(1).map(raw),
    reviewScopeSource: raw(fixture.release.scope)
  });
  assert.equal(releaseAsReview.diagnostics[0].code, 'SCOPE_INVALID');

  const unscopedProduction = await boundary().verify({
    candidateSource: raw(fixture.production), approvalSources: [raw(fixture.approvals[0])]
  });
  assert.equal(unscopedProduction.diagnostics[0].code, 'SCOPE_INVALID');
});
