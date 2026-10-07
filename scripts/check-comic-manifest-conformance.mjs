#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tripwire = fileURLToPath(new URL('../tests/support/offline-network-tripwire.mjs', import.meta.url));
const testPaths = [
  'tests/comic-manifest',
  'tests/prompt-sdk/comic-manifest-contract.test.js',
  'tests/context-builder/handoff.test.js'
];
const nodeMajor = Number(process.versions.node.split('.')[0]);
assert.ok(nodeMajor >= 22, `Comic Manifest conformance requires a supported Node.js runtime (>=22); got ${process.versions.node}.`);

const before = await fixtureSnapshot();
const nodeOptions = [process.env.NODE_OPTIONS, `--import=${tripwire}`].filter(Boolean).join(' ');
const env = { ...process.env, NODE_OPTIONS: nodeOptions };
let exitCode = 0;

const tests = spawnSync(process.execPath, ['--import', tripwire, '--test', ...testPaths], {
  cwd: root, env, stdio: 'inherit'
});
if (tests.error) {
  process.stderr.write(`Comic Manifest test runner could not start (${tests.error.code ?? 'unknown'}).\n`);
  exitCode = 1;
} else if (tests.status !== 0) {
  exitCode = tests.status ?? 1;
}

if (exitCode === 0) {
  const reference = spawnSync(process.execPath, ['examples/comic-manifest-cli/run-reference.mjs'], {
    cwd: root, env, stdio: 'inherit'
  });
  if (reference.error) {
    process.stderr.write(`Comic Manifest reference flow could not start (${reference.error.code ?? 'unknown'}).\n`);
    exitCode = 1;
  } else if (reference.status !== 0) {
    exitCode = reference.status ?? 1;
  }
}

const after = await fixtureSnapshot();
try {
  assert.deepEqual(after, before, 'Checked-in fixtures, goldens, and locks changed during the offline run.');
} catch {
  process.stderr.write('Comic Manifest offline suite modified or removed a checked-in fixture, golden, or lock.\n');
  exitCode = 1;
}

if (exitCode === 0) {
  process.stdout.write(`Comic Manifest offline suite passed with its network tripwire active; ${before.length} fixture files were byte-identical before and after.\n`);
}
process.exitCode = exitCode;

async function fixtureSnapshot() {
  const directory = join(root, 'tests/fixtures');
  const files = [];
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile()) files.push(child);
    }
  }
  await walk(directory);
  files.sort((left, right) => relative(directory, left).localeCompare(relative(directory, right)));
  return Promise.all(files.map(async path => ({
    path: relative(root, path).split(sep).join('/'),
    sha256: createHash('sha256').update(await readFile(path)).digest('hex')
  })));
}
