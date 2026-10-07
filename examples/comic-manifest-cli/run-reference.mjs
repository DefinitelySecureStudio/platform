#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { writeReferenceFixture } from './reference-fixture.js';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../..', import.meta.url));
const cli = join(root, 'src/comic-manifest/cli.js');

async function command(args) {
  try {
    const result = await exec(process.execPath, [cli, ...args, '--json'], { cwd: root, timeout: 20_000, encoding: 'utf8' });
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error('Synthetic reference command failed.');
  }
}

const directory = await mkdtemp(join(await realpath(tmpdir()), 'comic-manifest-reference-'));
try {
  const files = await writeReferenceFixture(directory);
  const options = [
    '--synthetic', '--production', files.production, '--result', files.result,
    '--candidate', files.candidate, '--assignment', files.assignment, '--approvals', files.approvals,
    '--artifact-map', files.artifactMap, '--synthetic-policy', files.policy, '--at', files.actionTime
  ];
  const reports = [
    await command(['validate', '--manifest', files.production]),
    await command(['inspect', '--manifest', files.production]),
    await command(['diff', '--candidate', files.candidate, '--previous', files.candidate]),
    await command(['verify', ...options, '--proposal-out', join(directory, 'proposal.json'), '--allow-proposal-output']),
    await command(['verify', ...options, '--evidence-out', join(directory, 'protected-evidence.json'), '--allow-protected-output'])
  ];
  if (reports.some(report => report.valid !== true)) throw new Error('Synthetic reference command failed.');
  process.stdout.write(JSON.stringify({
    status: 'passed',
    mode: 'offline-synthetic-only',
    stages: reports.map(report => ({ status: report.status, ...(report.change_status ? { change_status: report.change_status } : {}) })),
    proposal_and_protected_evidence: 'separate consented files in a temporary owner-only directory',
    publication_authority: 'not-issued'
  }, null, 2) + '\n');
} catch {
  process.stdout.write(JSON.stringify({ status: 'failed', stage: 'synthetic-reference' }) + '\n');
  process.exitCode = 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
