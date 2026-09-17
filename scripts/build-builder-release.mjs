import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { builderReleaseReadiness } from './check-builder-release.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
export async function buildBuilderRelease(destination, { candidate = false } = {}) {
  if (!destination) throw Error('Provide a new external output directory.');
  const output = resolve(destination), rel = relative(root, output);
  if (!rel || (!rel.startsWith('../') && !isAbsolute(rel))) throw Error('Output must be outside checkout.');
  if (git('status', '--porcelain').length) throw Error('Build requires a clean committed checkout.');
  const readiness = await builderReleaseReadiness();
  if (!readiness.ready && !candidate) throw Error('Immutable contract adoption is not ready.');
  const commit = git('rev-parse', 'HEAD').toString().trim();
  const scratch = await mkdtemp(join(tmpdir(), 'builder-pack-'));
  try {
    const source = git('archive', '--format=tar.gz', '--prefix=platform/', commit);
    await writeFile(join(scratch, 'source.tar.gz'), source, { flag: 'wx' });
    execFileSync('tar', ['-xzf', join(scratch, 'source.tar.gz'), '-C', scratch]);
    const cwd = join(scratch, 'platform');
    const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch], { cwd, encoding: 'utf8' }));
    const archive = await readFile(join(scratch, packed[0].filename));
    const files = [
      ['context-builder-v1.0.0.source.tar.gz', source, 'application/gzip'],
      ['context-builder-v1.0.0.package.tgz', archive, 'application/gzip'],
      ['context-builder-v1.0.0.package-lock.json', git('show', commit + ':package-lock.json'), 'application/json'],
      ['context-builder-v1.0.0.sdk-contract-lock.json', git('show', commit + ':release/contract-lock.json'), 'application/json']
    ];
    if (readiness.ready) files.push(['context-builder-v1.0.0.contract-lock.json', git('show', commit + ':release/context-builder-contract-lock.json'), 'application/json']);
    const tag = 'context-builder/v1.0.0';
    const manifest = { repository: 'DefinitelySecureStudio/platform', component: 'context-builder', version: '1.0.0',
      package_version: '1.1.0', tag, commit, candidate, readiness,
      constitution_commit: 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564',
      assets: files.map(([filename, bytes, media_type]) => ({ filename, media_type, byte_size: bytes.length, sha256: sha(bytes),
        artifact_uri: 'https://github.com/DefinitelySecureStudio/platform/releases/download/' + encodeURIComponent(tag) + '/' + filename })) };
    await mkdir(output);
    for (const [filename, bytes] of files) await writeFile(join(output, filename), bytes, { flag: 'wx' });
    await writeFile(join(output, 'context-builder-v1.0.0.manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    return manifest;
  } finally { await rm(scratch, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.slice(3).some(arg => arg !== '--candidate')) throw Error('Unknown argument.');
  console.log(JSON.stringify(await buildBuilderRelease(process.argv[2], { candidate: process.argv.includes('--candidate') }), null, 2));
}
