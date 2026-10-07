import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { chmod, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeReferenceFixture } from '../../examples/comic-manifest-cli/reference-fixture.js';
import { comicManifestProposalOracle, makePublicOnlyComicScenario } from '../support/comic-manifest-golden-oracle.js';

const execFile = promisify(execFileCallback);
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const cli = join(root, 'src/comic-manifest/cli.js');
const fixturePath = join(root, 'tests/fixtures/comic-manifest-v1.json');
const goldenRoot = join(root, 'tests/fixtures/comic-manifest-goldens');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const builderFixture = JSON.parse(await readFile(join(root, 'tests/fixtures/context-builder-v1.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(goldenRoot, 'scenarios.json'), 'utf8'));
const lock = JSON.parse(await readFile(join(goldenRoot, 'review-lock.json'), 'utf8'));
const hash = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const gitBlob = bytes => createHash('sha1').update(`blob ${bytes.byteLength}\0`).update(bytes).digest('hex');
const loadGolden = async name => JSON.parse(await readFile(join(goldenRoot, name), 'utf8'));

test('Codex source pins and proposed goldens match the owner-review lock', async () => {
  assert.equal(catalog.status, 'proposed-owner-review');
  assert.equal(catalog.owner_approved, false);
  assert.equal(catalog.normative_contract_change, false);
  assert.equal(lock.status, 'proposed-owner-review');
  assert.equal(lock.owner_approved, false);
  assert.equal(lock.platform_base_commit, '94a538e9df7a003626ccaba5289bcb772bafe6ad');
  assert.equal(lock.oracle_path, 'tests/support/comic-manifest-golden-oracle.js');
  assert.equal(hash(await readFile(join(root, lock.oracle_path))), lock.oracle_sha256);
  for (const source of lock.source_artifacts) {
    const bytes = await readFile(join(root, source.platform_path));
    assert.equal(bytes.byteLength, source.byte_size, source.platform_path);
    assert.equal(hash(bytes), source.sha256, source.platform_path);
    assert.equal(gitBlob(bytes), source.codex_blob_sha1, source.platform_path);
  }
  for (const foundation of lock.foundation_locks_unchanged) {
    const bytes = await readFile(join(root, foundation.path));
    assert.equal(hash(bytes), foundation.sha256, foundation.path);
  }
  for (const golden of lock.golden_files) {
    const bytes = await readFile(join(goldenRoot, golden.path));
    assert.equal(hash(bytes), golden.sha256, golden.path);
  }
});

test('static proposal goldens equal an independent allowlist transform of the Codex fixture', async () => {
  assert.deepEqual(await loadGolden('v1/approved-fake-private-proposal.json'),
    comicManifestProposalOracle(fixture.release));
  const publicOnly = makePublicOnlyComicScenario(fixture);
  assert.deepEqual(await loadGolden('v1/public-only-complete-proposal.json'),
    comicManifestProposalOracle(publicOnly.release));
});

test('public-only complete flow matches its golden and keeps evidence public', async t => {
  const result = await verifiedScenario(t, {
    transform(value) {
      const publicOnly = makePublicOnlyComicScenario({
        production: value.production, result: value.result, release: value.release, approvals: value.approvals
      });
      Object.assign(value, publicOnly);
    },
    expectedEvidenceClassification: 'public',
    golden: 'v1/public-only-complete-proposal.json'
  });
  assert.deepEqual(result.proposal.release.private_context, { influenced: false });
});

test('approved fake-private flow matches its golden and redacts protected lineage', async t => {
  const result = await verifiedScenario(t, {
    expectedEvidenceClassification: 'internal',
    golden: 'v1/approved-fake-private-proposal.json'
  });
  assert.deepEqual(result.proposal.release.private_context, {
    influenced: true,
    attestation_reference: fixture.release.private_context.attestation_reference
  });
});

test('public correction diff matches a value-free revision golden', async t => {
  const directory = await privateDirectory(t);
  const previousPath = join(directory, 'previous.json');
  const candidatePath = join(directory, 'correction.json');
  const previous = structuredClone(fixture.release);
  const candidate = structuredClone(previous);
  candidate.revision = previous.revision + 1;
  candidate.release_id = 'urn:uuid:10000000-0000-4000-8000-000000000999';
  candidate.previous = {
    release_id: previous.release_id,
    episode_id: previous.episode_id,
    revision: previous.revision,
    identity: structuredClone(fixture.linkage.release_identity)
  };
  candidate.title = 'Synthetic Shapes correction';
  await writeJson(previousPath, previous);
  await writeJson(candidatePath, candidate);
  const run = await command(['diff', '--candidate', candidatePath, '--previous', previousPath, '--json']);
  assert.equal(run.code, 0);
  assert.equal(run.stderr, '');
  assert.deepEqual(JSON.parse(run.stdout), await loadGolden('v1/revision-correction-diff-report.json'));
  assert.doesNotMatch(run.stdout, /Synthetic Shapes correction|10000000-0000-4000-8000-000000000999|sha256:/);
});

for (const [status, goldenName, diagnostic] of [
  ['partial', 'incomplete-result-report.json', 'OUTPUT_MISSING'],
  ['failed', 'failed-result-report.json', 'VALIDATION_FAILED']
]) {
  test(`${status} output returns its fixed failure golden and writes no proposal`, async t => {
    const directory = await privateDirectory(t);
    const files = await writeReferenceFixture(directory);
    const resultRecord = JSON.parse(await readFile(files.result, 'utf8'));
    resultRecord.status = status;
    resultRecord.diagnostics = [diagnostic];
    await writeJson(files.result, resultRecord);
    const proposalPath = join(directory, 'must-not-exist-proposal.json');
    const evidencePath = join(directory, 'must-not-exist-evidence.json');
    const run = await command([...verifyArgs(files), '--proposal-out', proposalPath, '--allow-proposal-output',
      '--evidence-out', evidencePath, '--allow-protected-output', '--json']);
    assert.equal(run.code, 4, run.stdout);
    assert.equal(run.stderr, '');
    assert.deepEqual(JSON.parse(run.stdout), await loadGolden(`v1/${goldenName}`));
    assert.doesNotMatch(run.stdout, /SYNTHETIC_|sha256:|urn:uuid:|https?:\/\//);
    await assert.rejects(stat(proposalPath), { code: 'ENOENT' });
    await assert.rejects(stat(evidencePath), { code: 'ENOENT' });
  });
}

test('repeated fixed-fixture processing matches the deterministic golden byte for byte', async t => {
  const first = await verifiedScenario(t, {
    expectedEvidenceClassification: 'internal', golden: 'v1/deterministic-report.json'
  });
  const second = await verifiedScenario(t, {
    expectedEvidenceClassification: 'internal', golden: 'v1/deterministic-report.json'
  });
  assert.deepEqual(first.report, second.report);
  assert.deepEqual(first.proposalBytes, second.proposalBytes);
});

async function verifiedScenario(t, { transform = () => {}, expectedEvidenceClassification, golden }) {
  const directory = await privateDirectory(t);
  const files = await writeReferenceFixture(directory, { mutate: transform });
  const proposalPath = join(directory, 'proposal.json');
  const evidencePath = join(directory, 'protected-evidence.json');
  const run = await command([...verifyArgs(files), '--proposal-out', proposalPath, '--allow-proposal-output',
    '--evidence-out', evidencePath, '--allow-protected-output', '--json']);
  assert.equal(run.code, 0, run.stdout);
  assert.equal(run.stderr, '');
  const report = JSON.parse(run.stdout);
  assert.deepEqual(report, await loadGolden(golden.endsWith('proposal.json')
    ? 'v1/verified-report.json' : golden));
  assert.doesNotMatch(run.stdout, /PRIVATE_CANARY|sha256:|urn:uuid:|https?:\/\//);
  const proposalBytes = await readFile(proposalPath);
  const proposal = JSON.parse(proposalBytes.toString('utf8'));
  assert.deepEqual(proposal, await loadGolden(golden.endsWith('proposal.json') ? golden : 'v1/approved-fake-private-proposal.json'));
  assert.equal((await stat(proposalPath)).mode & 0o777, 0o600);
  assert.equal((await stat(evidencePath)).mode & 0o777, 0o600);
  const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
  assert.equal(evidence.classification, expectedEvidenceClassification);
  assertRedacted(proposal);
  return { proposal, proposalBytes, report };
}

function assertRedacted(proposal) {
  const serialized = JSON.stringify(proposal);
  const privateValues = [
    fixture.production.production_id,
    fixture.result.result_id,
    fixture.result.attempt_id,
    fixture.linkage.production.identity.sha256,
    fixture.linkage.result_identity.sha256,
    fixture.production.inputs.prompts[0].context.use_authorization_reference,
    fixture.production.inputs.prompts[0].context.manifest_identity.sha256,
    fixture.production.inputs.prompts[0].context.builder_result_identity.sha256,
    builderFixture.result.package.manifest_identity.sha256,
    builderFixture.result.evidence_reference,
    fixture.result.outputs[0].artifact.artifact_uri,
    ...fixture.approvals.slice(0, 3).map(item => item.actor),
    ...fixture.protected_sentinels
  ];
  for (const value of privateValues) assert.equal(serialized.includes(value), false);
}

function verifyArgs(files) {
  return ['verify', '--synthetic', '--production', files.production, '--result', files.result,
    '--candidate', files.candidate, '--assignment', files.assignment, '--approvals', files.approvals,
    '--artifact-map', files.artifactMap, '--synthetic-policy', files.policy, '--at', files.actionTime];
}

async function command(args) {
  try {
    const result = await execFile(process.execPath, [cli, ...args], {
      cwd: root, timeout: 20_000, maxBuffer: 12 * 1024 * 1024, encoding: 'utf8'
    });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: typeof error.code === 'number' ? error.code : 1 };
  }
}

async function privateDirectory(t) {
  const base = await realpath((await import('node:os')).tmpdir());
  const directory = await mkdtemp(join(base, 'comic-golden-98-'));
  await chmod(directory, 0o700);
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value)}\n`, { mode: 0o600 });
}
