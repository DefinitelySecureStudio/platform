import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdtemp, rm, stat, chmod, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { identity } from '../../src/context-builder/request.js';
const exec = promisify(execFile), root = resolve(new URL('../..', import.meta.url).pathname);
const cli = join(root, 'src/context-builder/cli.js');
const fixture = join(root, 'tests/fixtures/context-builder-v1.json');
const authority = join(root, 'examples/context-builder-cli/context-builder-v1-authority.json');
const at = '2026-09-15T12:00:00Z';
const buildArgs = ['--fixture', fixture, '--synthetic', '--authority', authority, '--at', at];
async function run(args) {
  try { const r = await exec(process.execPath, [cli, ...args], { cwd: root, timeout: 5000 }); return { ...r, code: 0 }; }
  catch (e) { return { stdout: e.stdout, stderr: e.stderr, code: e.code }; }
}
async function json(args, code = 0) {
  const r = await run([...args, '--json']); assert.equal(r.code, code, r.stdout); assert.equal(r.stderr, '');
  assert.doesNotMatch(r.stdout, /sha256:|urn:uuid:|Synthetic approved|SECRET|\/(Users|private)\//);
  return JSON.parse(r.stdout);
}
async function dir(t) { const d = await mkdtemp(join(tmpdir(), 'builder-cli-')); t.after(() => rm(d, { recursive: true, force: true })); return d; }

test('CLI help, validation, inspect and plan are safe offline operations', async () => {
  const h = await run(['--help']); assert.equal(h.code, 0); assert.match(h.stdout, /Exit codes/);
  for (const command of ['validate', 'inspect', 'plan']) {
    const r = await json([command, '--fixture', fixture]); assert.equal(r.authority, 'not-checked'); assert.equal(r.reads, 'input-files-only');
  }
  const human = await run(['validate', '--fixture', fixture]); assert.match(human.stdout, /Context Builder: valid/);
});

test('public and fake-private exports build without output, providers or production authority', async () => {
  const r = await json(['build', ...buildArgs]); assert.equal(r.status, 'built'); assert.equal(r.protected_output_written, false);
  const lexical = join(root, 'tests/fixtures/context-builder-lexical-v1.json');
  const grant = join(root, 'examples/context-builder-cli/context-builder-lexical-v1-authority.json');
  assert.equal((await json(['build', '--fixture', lexical, '--synthetic', '--authority', grant, '--at', at])).status, 'built');
});

test('missing authority and implicit synthetic mode fail without an automatic grant', async () => {
  await json(['build', '--fixture', fixture], 3);
  await json(['build', '--fixture', fixture, '--authority', authority, '--at', at], 3);
});

test('malformed, duplicate-key, invalid UTF-8, oversized and missing input files have safe exits', async t => {
  const d = await dir(t);
  for (const [i, data] of ['{SECRET', '{"request":{},"request":{}}', Buffer.from([0xff]), ' '.repeat(2 * 1024 * 1024 + 1)].entries()) {
    const path = join(d, String(i)); await writeFile(path, data); await json(['validate', '--fixture', path], 2);
  }
  await json(['validate', '--fixture', join(d, 'SECRET-absent')], 2);
  await json(['validate', '--fixture', d], 2);
  const link = join(d, 'link'); await symlink(fixture, link); await json(['validate', '--fixture', link], 2);
});

test('unknown/duplicate options and output without consent are usage errors', async () => {
  await json(['publish', '--fixture', fixture], 2);
  await json(['validate', '--fixture', fixture, '--fixture', fixture], 2);
  await json(['build', ...buildArgs, '--output', '/SECRET'], 2);
  await json(['plan', '--fixture', fixture, '--authority', '/SECRET'], 2);
  await json(['plan', '--fixture', fixture, '--sources', '/SECRET'], 2);
});

test('explicit protected file is exclusive mode 0600; verify and replay do not imply use authority', async t => {
  const d = await dir(t), out = join(d, 'artifact.json');
  await json(['build', ...buildArgs, '--output', out, '--allow-protected-output']);
  assert.equal((await stat(out)).mode & 0o777, 0o600);
  const saved = await readFile(out, 'utf8'); assert.match(saved, /context-build-result/); assert.match(saved, /Synthetic approved note/);
  const verified = await json(['verify', '--artifact', out]); assert.equal(verified.authorization, 'not-checked');
  assert.equal((await json(['replay', ...buildArgs, '--artifact', out])).status, 'matched');
  await json(['build', ...buildArgs, '--output', out, '--allow-protected-output'], 5);
  assert.equal(await readFile(out, 'utf8'), saved);
});

test('protected output rejects permissive directories and symlink destinations', async t => {
  const d = await dir(t), target = join(d, 'existing'); await writeFile(target, 'do not overwrite');
  const link = join(d, 'link'); await symlink(target, link);
  await json(['build', ...buildArgs, '--output', link, '--allow-protected-output'], 5);
  assert.equal(await readFile(target, 'utf8'), 'do not overwrite');
  await chmod(d, 0o755); await json(['build', ...buildArgs, '--output', join(d, 'new'), '--allow-protected-output'], 5);
});

test('tampered artifact fails verification and changed approved request fails replay', async t => {
  const d = await dir(t), out = join(d, 'artifact');
  await json(['build', ...buildArgs, '--output', out, '--allow-protected-output']);
  const original = await readFile(out, 'utf8'), a = JSON.parse(original); a.result.package.manifest.sections[0].content += 'SECRET';
  await writeFile(out, JSON.stringify(a)); await json(['verify', '--artifact', out], 4); await writeFile(out, original);
  const f = JSON.parse(await readFile(fixture, 'utf8')), auth = JSON.parse(await readFile(authority, 'utf8'));
  f.request.slots[0].max_bytes--; auth.decisions[0].request_identity = identity(f.request);
  const fpath = join(d, 'fixture'), apath = join(d, 'authority'); await writeFile(fpath, JSON.stringify(f)); await writeFile(apath, JSON.stringify(auth));
  await json(['replay', '--fixture', fpath, '--synthetic', '--authority', apath, '--at', at, '--artifact', out], 4);
});

test('denial, stale authority and budget failure return value-free diagnostics and no output', async t => {
  const d = await dir(t), apath = join(d, 'authority'), fpath = join(d, 'fixture'), out = join(d, 'out');
  const a = JSON.parse(await readFile(authority, 'utf8')); a.decisions[0].decision = 'deny'; await writeFile(apath, JSON.stringify(a));
  const denied = await json(['build', '--fixture', fixture, '--synthetic', '--authority', apath, '--at', at, '--output', out, '--allow-protected-output'], 3);
  assert.equal(denied.diagnostics[0].code, 'PREPARATION_DENIED'); await assert.rejects(stat(out));
  const stale = await json(['build', '--fixture', fixture, '--synthetic', '--authority', authority, '--at', '2026-09-18T00:00:00Z'], 3);
  assert.equal(stale.diagnostics[0].code, 'STALE_AUTHORITY');
  const f = JSON.parse(await readFile(fixture, 'utf8')); f.request.slots[0].max_bytes = 1;
  a.decisions[0].decision = 'allow'; a.decisions[0].request_identity = identity(f.request);
  await writeFile(fpath, JSON.stringify(f)); await writeFile(apath, JSON.stringify(a));
  const budget = await json(['build', '--fixture', fpath, '--synthetic', '--authority', apath, '--at', at], 3);
  assert.equal(budget.diagnostics[0].code, 'BUDGET_EXCEEDED');
});

test('separate request/prompt/source files support the same offline workflow', async t => {
  const d = await dir(t), f = JSON.parse(await readFile(fixture, 'utf8'));
  for (const [name, value] of Object.entries({ request: f.request, prompt: f.prompt, sources: f.raw_sources })) await writeFile(join(d, name), JSON.stringify(value));
  const files = ['--request', join(d, 'request'), '--prompt', join(d, 'prompt')];
  await json(['plan', ...files]);
  await json(['build', ...files, '--sources', join(d, 'sources'), '--synthetic', '--authority', authority, '--at', at]);
});
