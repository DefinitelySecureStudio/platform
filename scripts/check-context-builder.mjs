import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const guard = new URL('../tests/support/context-builder-offline-guard.js', import.meta.url).href;
const env = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${guard}`.trim() };
const protectedFiles = ['tests/fixtures/context-builder-v1.json', 'tests/fixtures/context-builder-lexical-v1.json',
  'tests/fixtures/context-builder-contract-lock.json', 'tests/fixtures/context-builder-reference-golden.json',
  'tests/fixtures/context-builder-reference-lock.json'];
const before = await Promise.all(protectedFiles.map(path => readFile(new URL('../' + path, import.meta.url))));
const tests = (await readdir(new URL('../tests/context-builder/', import.meta.url)))
  .filter(name => name.endsWith('.test.js')).sort().map(name => 'tests/context-builder/' + name);
tests.push('tests/prompt-sdk/context-builder-contract.test.js', 'tests/prompt-sdk/context-packages.test.js');
const commands = [
  ['--test', ...tests],
  ['examples/context-builder-handoff.mjs'],
  ['src/context-builder/cli.js', 'build', '--fixture', 'tests/fixtures/context-builder-v1.json', '--synthetic',
    '--authority', 'examples/context-builder-cli/context-builder-v1-authority.json', '--at', '2026-09-15T12:00:00Z', '--json'],
  ['scripts/check-sdk-release.mjs']
];
let failed = false;
for (const args of commands) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit', timeout: 120000 });
  if (result.status !== 0 || result.error) { failed = true; break; }
}
for (const [i, path] of protectedFiles.entries()) {
  const after = await readFile(new URL('../' + path, import.meta.url));
  if (!before[i].equals(after)) { failed = true; console.error('Conformance fixture changed during tests.'); }
}
console.log(JSON.stringify({ suite: 'context-builder', status: failed ? 'failed' : 'passed', network: 'guarded', golden_updates: false }));
process.exitCode = failed ? 1 : 0;
