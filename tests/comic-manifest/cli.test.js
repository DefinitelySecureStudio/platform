import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdtemp, rm, stat, chmod, symlink, link, lstat, mkdir, rename, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeReferenceFixture } from '../../examples/comic-manifest-cli/reference-fixture.js';
import { validateComicManifest } from '../../src/comic-manifest/index.js';

const exec = promisify(execFile);
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const cli = join(root, 'src/comic-manifest/cli.js');
const fixture = join(root, 'tests/fixtures/comic-manifest-v1.json');
const CANARY = 'PRIVATE_CANARY_97:do-not-print';
let nextScenario = 0;

async function run(args, options = {}) {
  try {
    const result = await exec(process.execPath, [cli, ...args], {
      cwd: root, timeout: 20_000, maxBuffer: 12 * 1024 * 1024, encoding: 'utf8', ...options
    });
    return { ...result, code: 0 };
  } catch (error) {
    return { stdout: error.stdout ?? '', stderr: error.stderr ?? '', code: error.code };
  }
}

async function json(args, code = 0) {
  const result = await run([...args, '--json']);
  assert.equal(result.code, code, result.stdout);
  assert.equal(result.stderr, '');
  assert.doesNotMatch(result.stdout, new RegExp(`${CANARY}|sha256:|urn:uuid:|https?://|/(Users|private)/`));
  return JSON.parse(result.stdout);
}

async function dir(t) {
  const canonicalTmp = await import('node:fs/promises').then(fs => fs.realpath(tmpdir()));
  const value = await mkdtemp(join(canonicalTmp, 'comic-cli-97-'));
  await chmod(value, 0o700);
  t.after(() => rm(value, { recursive: true, force: true }));
  return value;
}

async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value) + '\n', { mode: 0o600 });
}

async function verifyFiles(directory, options = {}) {
  const scenarioDirectory = join(directory, `scenario-${nextScenario++}`);
  await mkdir(scenarioDirectory, { mode: 0o700 });
  const files = await writeReferenceFixture(scenarioDirectory, options);
  const args = [
    'verify', '--synthetic', '--production', files.production, '--result', files.result,
    '--candidate', files.candidate, '--assignment', files.assignment, '--approvals', files.approvals,
    '--artifact-map', files.artifactMap, '--synthetic-policy', files.policy, '--at', files.actionTime
  ];
  return { files, args };
}

test('help, validate, inspect, diff and verify expose only stable safe reports', async t => {
  const help = await run(['--help']);
  assert.equal(help.code, 0);
  assert.equal(help.stderr, '');
  assert.match(help.stdout, /verify\s+--synthetic/);

  const directory = await dir(t);
  const { files, args } = await verifyFiles(directory, {
    mutate(value) { value.production.panels[0].text[0].text = CANARY; }
  });
  assert.equal((await json(['validate', '--manifest', files.production])).status, 'valid');
  const inspected = await json(['inspect', '--manifest', files.production]);
  assert.equal(inspected.status, 'inspected');
  assert.equal(inspected.structure.panel_count, 2);
  assert.equal(inspected.structure.text_segment_count, 2);
  assert.equal(inspected.structure.reference_plan_status, 'available');
  const diff = await json(['diff', '--candidate', files.candidate, '--previous', files.candidate]);
  assert.equal(diff.status, 'diffed');
  assert.equal(diff.change_status, 'unchanged');
  assert.deepEqual(diff.categories, []);
  const verified = await json(args);
  assert.equal(verified.status, 'verified');
  assert.equal(verified.mode, 'offline-synthetic-only');
  assert.equal(verified.publication_authority, 'not-issued');
  assert.equal(verified.proposal_written, false);
  assert.equal(verified.protected_evidence_written, false);
  assert.equal((await readdir(dirname(files.production))).some(name => /proposal|evidence/.test(name)), false);
});

test('diff reports only fixed public categories and withholds protected revision details', async t => {
  const directory = await dir(t);
  const original = JSON.parse(await readFile(fixture, 'utf8'));
  const previous = original.release;
  const previousIdentity = validateComicManifest(JSON.stringify(previous)).identity;
  const candidate = structuredClone(previous);
  candidate.revision = 2;
  candidate.release_id = 'urn:uuid:10000000-0000-4000-8000-000000000999';
  candidate.previous = {
    release_id: previous.release_id, episode_id: previous.episode_id,
    revision: previous.revision, identity: previousIdentity
  };
  candidate.title = 'Synthetic Shapes revision';
  const previousPath = join(directory, 'previous-public.json'), candidatePath = join(directory, 'candidate-public.json');
  await writeJson(previousPath, previous); await writeJson(candidatePath, candidate);
  const publicDiff = await json(['diff', '--candidate', candidatePath, '--previous', previousPath]);
  assert.equal(publicDiff.change_status, 'changed');
  assert.ok(publicDiff.categories.includes('creative-content'));
  assert.ok(publicDiff.categories.includes('revision'));

  const protectedPrevious = original.production;
  const protectedIdentity = validateComicManifest(JSON.stringify(protectedPrevious)).identity;
  const protectedCandidate = structuredClone(protectedPrevious);
  protectedCandidate.revision = 2;
  protectedCandidate.previous = {
    production_id: protectedPrevious.production_id, revision: protectedPrevious.revision, identity: protectedIdentity
  };
  protectedCandidate.title = 'PRIVATE_CANARY_97:withheld';
  const protectedPreviousPath = join(directory, 'previous-internal.json');
  const protectedCandidatePath = join(directory, 'candidate-internal.json');
  await writeJson(protectedPreviousPath, protectedPrevious); await writeJson(protectedCandidatePath, protectedCandidate);
  const withheld = await json(['diff', '--candidate', protectedCandidatePath, '--previous', protectedPreviousPath]);
  assert.equal(withheld.change_status, 'withheld');
  assert.equal(withheld.details_withheld, true);
  assert.equal(Object.hasOwn(withheld, 'categories'), false);
});

test('malformed, duplicate-key, invalid UTF-8, oversized, too-deep and missing inputs fail safely', async t => {
  const directory = await dir(t);
  const samples = [
    Buffer.from('{bad'), Buffer.from('{"kind":"a","kind":"b"}'), Buffer.from([0xff, 0xfe]),
    Buffer.from(' '.repeat(8 * 1024 * 1024 + 1)), Buffer.from('['.repeat(34) + '0' + ']'.repeat(34))
  ];
  for (const [index, bytes] of samples.entries()) {
    const path = join(directory, `bad-${index}.json`);
    await writeFile(path, bytes);
    const report = await json(['validate', '--manifest', path], 2);
    assert.equal(report.status, 'failed');
    assert.equal(typeof report.diagnostics[0].code, 'string');
  }
  await json(['validate', '--manifest', join(directory, `${CANARY}-missing.json`)], 2);
  const bad = await run(['validate', '--manifest', join(directory, `${CANARY}-missing.json`)]);
  assert.equal(bad.code, 2);
  assert.equal(bad.stderr, '');
  assert.doesNotMatch(bad.stdout, new RegExp(CANARY));
});

test('option errors and missing consent have documented usage exits', async t => {
  const directory = await dir(t);
  const { files, args } = await verifyFiles(directory);
  const validArgs = args.slice(1);
  await json(['unknown', '--manifest', files.production], 2);
  await json(['validate', '--manifest', files.production, '--manifest', files.production], 2);
  await json(['verify', ...args.slice(2)], 2);
  const missingAt = args.filter((token, index) => token !== '--at' && args[index - 1] !== '--at');
  await json(missingAt, 2);
  await json([...args, '--proposal-out', join(directory, 'proposal.json')], 2);
  await json([...args, '--allow-proposal-output'], 2);
  await json([...args, '--evidence-out', join(directory, 'evidence.json')], 2);
  await json([...args, '--proposal-out', join(directory, 'same'), '--allow-proposal-output',
    '--evidence-out', join(directory, 'same'), '--allow-protected-output'], 5);
});

test('explicit proposal and evidence writes are separate, exclusive, owner-only files', async t => {
  const directory = await dir(t);
  const { args } = await verifyFiles(directory);
  const proposal = join(directory, 'proposal.json'), evidence = join(directory, 'protected.json');
  const report = await json([...args, '--proposal-out', proposal, '--allow-proposal-output'], 0);
  assert.equal(report.proposal_written, true);
  assert.equal(report.protected_evidence_written, false);
  const proposalBytes = await readFile(proposal, 'utf8');
  assert.equal((await stat(proposal)).mode & 0o777, 0o600);
  assert.match(proposalBytes, /comic-public-release/);
  assert.doesNotMatch(JSON.stringify(report), /sha256:|urn:uuid:/);

  const protectedReport = await json([...args, '--evidence-out', evidence, '--allow-protected-output'], 0);
  assert.equal(protectedReport.proposal_written, false);
  assert.equal(protectedReport.protected_evidence_written, true);
  assert.equal((await stat(evidence)).mode & 0o777, 0o600);
  const protectedValue = JSON.parse(await readFile(evidence, 'utf8'));
  assert.equal(protectedValue.classification, 'internal');
  assert.ok(protectedValue.verified_artifacts.length > 0);
  await json([...args, '--proposal-out', proposal, '--allow-proposal-output'], 5);
  assert.equal(await readFile(proposal, 'utf8'), proposalBytes);
});

test('protected outputs reject pre-existing files, symlinks, unsafe directories and traversal', async t => {
  const directory = await dir(t);
  const { args } = await verifyFiles(directory);
  const victim = join(directory, 'victim'); await writeFile(victim, 'leave this alone');
  const linkPath = join(directory, 'link'); await symlink(victim, linkPath);
  const targetDirectory = join(directory, 'actual-output'); await mkdir(targetDirectory, { mode: 0o700 });
  const parentLink = join(directory, 'output-parent-link'); await symlink(targetDirectory, parentLink);
  await json([...args, '--proposal-out', victim, '--allow-proposal-output'], 5);
  await json([...args, '--proposal-out', linkPath, '--allow-proposal-output'], 5);
  await json([...args, '--proposal-out', join(parentLink, 'proposal'), '--allow-proposal-output'], 5);
  await assert.rejects(lstat(join(targetDirectory, 'proposal')), { code: 'ENOENT' });
  assert.equal(await readFile(victim, 'utf8'), 'leave this alone');
  await json([...args, '--proposal-out', `${directory}/../unsafe`, '--allow-proposal-output'], 5);

  const permissive = join(directory, 'permissive'); await mkdir(permissive, { mode: 0o700 }); await chmod(permissive, 0o755);
  await json([...args, '--proposal-out', join(permissive, 'proposal'), '--allow-proposal-output'], 5);
});

test('input symlinks, parent symlinks, directories and hard links are rejected', async t => {
  const directory = await dir(t);
  const actual = join(directory, 'actual'); await mkdir(actual, { mode: 0o700 });
  const input = join(actual, 'manifest.json'); await writeFile(input, await readFile(fixture));
  const finalLink = join(directory, 'final-link'); await symlink(input, finalLink);
  const parentLink = join(directory, 'parent-link'); await symlink(actual, parentLink);
  const hard = join(actual, 'hardlink'); await link(input, hard);
  await json(['validate', '--manifest', finalLink], 2);
  await json(['validate', '--manifest', join(parentLink, 'manifest.json')], 2);
  await json(['validate', '--manifest', actual], 2);
  await json(['validate', '--manifest', hard], 2);
});

test('nonregular inputs and concurrent path replacement fail safely without leaking content', async t => {
  const directory = await dir(t);
  if (process.platform !== 'win32') {
    const fifo = join(directory, 'named-pipe');
    execFileSync('mkfifo', [fifo]);
    const pipeReport = await json(['validate', '--manifest', fifo], 2);
    assert.equal(pipeReport.status, 'failed');
  }

  const value = JSON.parse(await readFile(fixture, 'utf8'));
  value.title = CANARY;
  const base = Buffer.from(JSON.stringify(value) + '\n');
  const bytes = Buffer.concat([base, Buffer.alloc(7 * 1024 * 1024, 0x20)]);
  const input = join(directory, 'race-manifest.json'), replacement = join(directory, 'replacement.json');
  await writeFile(input, bytes, { mode: 0o600 });
  await writeFile(replacement, bytes, { mode: 0o600 });
  const command = run(['validate', '--manifest', input, '--json']);
  await rename(replacement, input);
  const result = await command;
  assert.ok([0, 2].includes(result.code), result.stdout);
  assert.equal(result.stderr, '');
  assert.doesNotMatch(result.stdout, new RegExp(CANARY));
  const report = JSON.parse(result.stdout);
  assert.ok(report.status === 'valid' || (report.status === 'failed'
    && typeof report.diagnostics?.[0]?.code === 'string' && report.diagnostics[0].action === 'review-inputs'));
});

test('denied, stale and mismatched synthetic authority fails closed', async t => {
  const directory = await dir(t);
  const { files, args } = await verifyFiles(directory);
  const policy = JSON.parse(await readFile(files.policy, 'utf8'));

  policy.approvals[0].decision = 'deny'; await writeJson(files.policy, policy);
  const denied = await json(args, 3);
  assert.equal(denied.diagnostics[0].code, 'APPROVAL_DENIED');

  const { files: malformedFiles, args: malformedArgs } = await verifyFiles(directory);
  const malformedApprovals = JSON.parse(await readFile(malformedFiles.approvals, 'utf8'));
  delete malformedApprovals[0].decision_id;
  await writeJson(malformedFiles.approvals, malformedApprovals);
  const malformed = await json(malformedArgs, 2);
  assert.equal(malformed.diagnostics[0].stage, 'schema');

  const expiryTime = '2026-09-16T00:00:00Z';
  const { files: staleFiles, args: staleArgs } = await verifyFiles(directory);
  const stalePolicy = JSON.parse(await readFile(staleFiles.policy, 'utf8'));
  stalePolicy.evaluation_time = expiryTime;
  for (const approval of stalePolicy.approvals) {
    approval.action_time = expiryTime;
    approval.checked_at = expiryTime;
  }
  stalePolicy.disclosure.checked_at = expiryTime;
  stalePolicy.private_influence.checked_at = expiryTime;
  await writeJson(staleFiles.policy, stalePolicy);
  staleArgs[staleArgs.indexOf('--at') + 1] = expiryTime;
  const stale = await json(staleArgs, 3);
  assert.equal(stale.diagnostics[0].code, 'APPROVAL_TIME');

  const { files: mismatchFiles, args: mismatchArgs } = await verifyFiles(directory);
  const mismatchPolicy = JSON.parse(await readFile(mismatchFiles.policy, 'utf8'));
  mismatchPolicy.approvals[0].subject_sha256 = `sha256:${'0'.repeat(64)}`;
  await writeJson(mismatchFiles.policy, mismatchPolicy);
  const mismatch = await json(mismatchArgs, 3);
  assert.equal(mismatch.diagnostics[0].code, 'APPROVAL_DENIED');

  const invalidTime = 'not-a-trusted-time';
  const { files: clockFiles, args: clockArgs } = await verifyFiles(directory);
  const clockPolicy = JSON.parse(await readFile(clockFiles.policy, 'utf8'));
  clockPolicy.evaluation_time = invalidTime;
  for (const approval of clockPolicy.approvals) {
    approval.action_time = invalidTime;
    approval.checked_at = invalidTime;
  }
  clockPolicy.disclosure.checked_at = invalidTime;
  clockPolicy.private_influence.checked_at = invalidTime;
  await writeJson(clockFiles.policy, clockPolicy);
  clockArgs[clockArgs.indexOf('--at') + 1] = invalidTime;
  const badClock = await json(clockArgs, 3);
  assert.equal(badClock.diagnostics[0].stage, 'approval');
  assert.equal(badClock.diagnostics[0].code, 'ACTION_TIME_INVALID');
});

test('cross-record classification is integrity exit while local classification stays input exit', async t => {
  const directory = await dir(t);
  const local = JSON.parse(await readFile(fixture, 'utf8')).production;
  local.classification = 'public';
  const localPath = join(directory, 'locally-invalid-production.json');
  await writeJson(localPath, local);
  const localFailure = await json(['validate', '--manifest', localPath], 2);
  assert.equal(localFailure.diagnostics[0].stage, 'semantic');
  assert.equal(localFailure.diagnostics[0].code, 'CLASSIFICATION');

  const { files, args } = await verifyFiles(directory);
  const production = JSON.parse(await readFile(files.production, 'utf8'));
  const result = JSON.parse(await readFile(files.result, 'utf8'));
  production.inputs.prompts[0].context.classification = 'public';
  const productionIdentity = validateComicManifest(JSON.stringify(production)).identity;
  result.production.identity = productionIdentity;
  result.inputs = structuredClone(production.inputs);
  result.classification = 'public';
  assert.equal(validateComicManifest(JSON.stringify(production)).valid, true);
  assert.equal(validateComicManifest(JSON.stringify(result)).valid, true);
  await writeJson(files.production, production);
  await writeJson(files.result, result);

  const boundaryFailure = await json(args, 4);
  assert.equal(boundaryFailure.diagnostics[0].stage, 'output');
  assert.equal(boundaryFailure.diagnostics[0].code, 'CLASSIFICATION');

  const { files: titleFiles, args: titleArgs } = await verifyFiles(directory);
  const candidate = JSON.parse(await readFile(titleFiles.candidate, 'utf8'));
  candidate.title = 'A different but locally valid title';
  await writeJson(titleFiles.candidate, candidate);
  const titleMismatch = await json(titleArgs, 4);
  assert.equal(titleMismatch.diagnostics[0].stage, 'episode');
  assert.equal(titleMismatch.diagnostics[0].code, 'EPISODE_TITLE');
});

test('tampered artifact bytes, canon drift and production identity mismatch use integrity exit', async t => {
  const directory = await dir(t);
  const { files, args } = await verifyFiles(directory);
  const map = JSON.parse(await readFile(files.artifactMap, 'utf8'));
  const artifact = Object.values(map)[0];
  const bytes = await readFile(artifact); await writeFile(artifact, Buffer.alloc(bytes.byteLength, 0x78));
  const tampered = await json(args, 4);
  assert.equal(tampered.diagnostics[0].code, 'ARTIFACT_DIGEST');

  const { files: canonFiles, args: canonArgs } = await verifyFiles(directory);
  const candidate = JSON.parse(await readFile(canonFiles.candidate, 'utf8'));
  candidate.input_canon.version = '9.9.9'; await writeJson(canonFiles.candidate, candidate);
  const canon = await json(canonArgs, 4);
  assert.equal(canon.diagnostics[0].code, 'CANON_INPUT');

  const { files: linkFiles, args: linkArgs } = await verifyFiles(directory);
  const result = JSON.parse(await readFile(linkFiles.result, 'utf8'));
  result.production.identity.sha256 = `sha256:${'0'.repeat(64)}`; await writeJson(linkFiles.result, result);
  const productionLink = await json(linkArgs, 4);
  assert.equal(productionLink.diagnostics[0].code, 'PRODUCTION_LINK');
});

test('compound output failure removes its partial proposal and preserves existing evidence', async t => {
  const directory = await dir(t);
  const { args } = await verifyFiles(directory);
  const proposal = join(directory, 'proposal-partial.json'), evidence = join(directory, 'evidence-existing.json');
  await writeFile(evidence, 'sentinel-evidence', { mode: 0o600 });
  const report = await json([...args, '--proposal-out', proposal, '--allow-proposal-output',
    '--evidence-out', evidence, '--allow-protected-output'], 5);
  assert.equal(report.diagnostics[0].code, 'OUTPUT_ALREADY_EXISTS');
  await assert.rejects(lstat(proposal), { code: 'ENOENT' });
  assert.equal(await readFile(evidence, 'utf8'), 'sentinel-evidence');
});

test('concurrent writes to one protected path produce exactly one complete owner-only file', async t => {
  const directory = await dir(t);
  const { args } = await verifyFiles(directory);
  const proposal = join(directory, 'race-proposal.json');
  const runArgs = [...args, '--proposal-out', proposal, '--allow-proposal-output', '--json'];
  const results = await Promise.all([run(runArgs), run(runArgs)]);
  assert.deepEqual(results.map(result => result.code).sort(), [0, 5]);
  for (const result of results) {
    assert.equal(result.stderr, '');
    assert.doesNotMatch(result.stdout, /sha256:|urn:uuid:|https?:\/\//);
    assert.equal(JSON.parse(result.stdout).status, result.code === 0 ? 'verified' : 'failed');
  }
  assert.equal((await stat(proposal)).mode & 0o777, 0o600);
  assert.equal(JSON.parse(await readFile(proposal, 'utf8')).kind, 'comic-public-release-proposal');
});
