#!/usr/bin/env node
import { open, lstat, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseBuilderJson, inspectBuildRequest, createSyntheticFixtureBuilder, createBuildArtifact,
  verifyBuildArtifact, compareBuildArtifacts, serializeBuildArtifact } from './index.js';

class CliError extends Error { constructor(code, exit) { super(code); this.code = code; this.exit = exit; } }
const reject = (code, exit = 2) => { throw new CliError(code, exit); };
const args = process.argv.slice(2), json = args.includes('--json');
const help = 'Context Builder (development, offline synthetic only)\nCommands: validate, inspect, plan, build, verify, replay\nInputs: --fixture FILE OR --request FILE --prompt FILE [--sources FILE]\nBuild/replay: --synthetic --authority FILE --at UTC\nVerify/replay: --artifact FILE\nOutput: --json [--output FILE --allow-protected-output]\nExit codes: 0 success; 2 usage/input; 3 authority/build failure; 4 integrity/replay mismatch; 5 output I/O.\n';
async function read(path) {
  let h;
  try {
    if (!constants.O_NOFOLLOW) reject('UNSUPPORTED_FILESYSTEM');
    h = await open(resolve(path), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await h.stat(); if (!before.isFile() || before.size > 2 * 1024 * 1024) reject('INPUT_FILE_INVALID');
    const bytes = Buffer.alloc(before.size + 1); let length = 0;
    while (length < bytes.length) { const { bytesRead } = await h.read(bytes, length, bytes.length - length, null); if (!bytesRead) break; length += bytesRead; }
    const after = await h.stat(); if (length !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs) reject('INPUT_FILE_CHANGED');
    return parseBuilderJson(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length)));
  } catch (e) { if (e instanceof CliError) throw e; reject('INPUT_FILE_INVALID'); }
  finally { await h?.close(); }
}
async function write(path, artifact) {
  const target = resolve(path); let h, created = false;
  try {
    if (!constants.O_NOFOLLOW) reject('UNSUPPORTED_FILESYSTEM', 5);
    const parent = await lstat(dirname(target));
    if (!parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077) !== 0
      || (process.getuid && parent.uid !== process.getuid())) reject('OUTPUT_DIRECTORY_UNPROTECTED', 5);
    const serialized = serializeBuildArtifact(artifact);
    // Keep all CLI artifacts readable within the same bounded ingress limit.
    if (Buffer.byteLength(serialized) > 2 * 1024 * 1024) reject('OUTPUT_TOO_LARGE', 5);
    h = await open(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); created = true;
    await h.writeFile(serialized, 'utf8'); await h.sync();
  } catch (e) {
    if (created) { await h?.close(); h = undefined; await unlink(target).catch(() => {}); }
    if (e instanceof CliError) throw e; reject('OUTPUT_WRITE_FAILED', 5);
  } finally { await h?.close(); }
}
async function main() {
  if (!args.length || args[0] === '--help' || args[0] === 'help') {
    if (json) return { status: 'help', usage: help };
    process.stdout.write(help); return;
  }
  const [command, ...rest] = args;
  if (!['validate', 'inspect', 'plan', 'build', 'verify', 'replay'].includes(command)) reject('USAGE');
  const values = {}, flags = new Set(['json', 'synthetic', 'allow-protected-output']);
  const names = new Set(['fixture', 'request', 'prompt', 'sources', 'authority', 'at', 'artifact', 'output', ...flags]);
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].slice(2);
    if (!rest[i].startsWith('--') || !names.has(key) || Object.hasOwn(values, key)) reject('USAGE');
    if (flags.has(key)) values[key] = true;
    else { if (!rest[i + 1] || rest[i + 1].startsWith('--')) reject('USAGE'); values[key] = rest[++i]; }
  }
  const builds = ['build', 'replay'].includes(command);
  if (!!values.output !== !!values['allow-protected-output'] || (values.output && !builds)) reject('PROTECTED_OUTPUT_CONSENT_REQUIRED');
  if ((command === 'verify' || command === 'replay') !== !!values.artifact) reject('USAGE');
  if (!builds && (values.synthetic || values.authority || values.at || values.sources)) reject('USAGE');
  let baseline;
  if (values.artifact) { try { baseline = verifyBuildArtifact(await read(values.artifact)); } catch (e) { if (e instanceof CliError) throw e; reject('ARTIFACT_INVALID', 4); } }
  if (command === 'verify') {
    if (values.fixture || values.request || values.prompt) reject('USAGE');
    return { status: 'verified', authorization: 'not-checked' };
  }
  let fixture;
  if (values.fixture) {
    if (values.request || values.prompt || values.sources) reject('USAGE'); fixture = await read(values.fixture);
  } else {
    if (!values.request || !values.prompt) reject('USAGE');
    fixture = { request: await read(values.request), prompt: await read(values.prompt) };
    if (builds) { if (!values.sources) reject('USAGE'); fixture.raw_sources = await read(values.sources); }
  }
  const plan = inspectBuildRequest(fixture);
  if (!builds) return { status: command === 'validate' ? 'valid' : 'planned', ...plan };
  if (!values.synthetic || !values.authority || !values.at) reject('EXPLICIT_SYNTHETIC_AUTHORITY_REQUIRED', 3);
  const authority = await read(values.authority);
  let result;
  try { result = await createSyntheticFixtureBuilder({ fixture, authority, at: values.at }).build(); }
  catch { reject('BUILD_CONFIGURATION_INVALID', 3); }
  if (result.status !== 'prepared') return { status: 'failed', diagnostics: result.diagnostics, exit: 3 };
  const artifact = createBuildArtifact(result);
  if (command === 'replay' && !compareBuildArtifacts(baseline, artifact)) reject('REPLAY_MISMATCH', 4);
  if (values.output) await write(values.output, artifact);
  return { status: command === 'replay' ? 'matched' : 'built', protected_output_written: !!values.output, use_authorization: 'not-issued' };
}
try {
  const result = await main();
  if (result) {
    const { exit = 0, ...report } = result; process.exitCode = exit;
    const note = report.authority === 'not-checked' || report.authorization === 'not-checked' ? 'Authority not checked.'
      : report.use_authorization === 'not-issued' ? 'Use authorization not issued.' : '';
    const counts = report.sources === undefined ? '' : `${report.sources} sources, ${report.slots} slots, ${report.candidates} candidates.`;
    process.stdout.write(json ? JSON.stringify(report) + '\n' : `Context Builder: ${report.status}. ${counts} ${note} ${report.diagnostics?.map(d => d.code).join(', ') ?? ''}\n`);
  }
} catch (e) {
  process.exitCode = e instanceof CliError ? e.exit : 2;
  const code = e instanceof CliError ? e.code : 'INPUT_INVALID';
  const report = { status: 'failed', diagnostics: [{ stage: 'cli', code, action: 'review-inputs' }] };
  process.stdout.write(json ? JSON.stringify(report) + '\n' : `Context Builder failed: ${code}. Review explicit inputs and permissions.\n`);
}
