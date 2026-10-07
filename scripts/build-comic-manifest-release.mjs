import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { comicManifestReleaseReadiness } from './check-comic-manifest-release.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

export async function buildComicManifestRelease(destination, { candidate = false } = {}) {
  if (!destination) throw Error('Provide a new external output directory.');
  const output = resolve(destination), rel = relative(root, output);
  if (!rel || (!rel.startsWith('../') && !isAbsolute(rel))) throw Error('Output must be outside checkout.');
  if (git('status', '--porcelain').length) throw Error('Build requires a clean committed checkout.');
  const readiness = await comicManifestReleaseReadiness();
  if (!readiness.ready && !candidate) throw Error('Codex contract publication/adoption is not ready.');
  const commit = git('rev-parse', 'HEAD').toString().trim();
  const scratch = await mkdtemp(join(tmpdir(), 'comic-manifest-pack-'));
  try {
    const source = git('archive', '--format=tar.gz', '--prefix=platform/', commit);
    await writeFile(join(scratch, 'source.tar.gz'), source, { flag: 'wx' });
    execFileSync('tar', ['-xzf', join(scratch, 'source.tar.gz'), '-C', scratch]);
    const cwd = join(scratch, 'platform');
    const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--offline', '--cache', join(scratch, 'cache'),
      '--json', '--pack-destination', scratch], { cwd, encoding: 'utf8' }));
    if (packed.length !== 1) throw Error('Expected exactly one offline package archive.');
    const packageBytes = await readFile(join(scratch, packed[0].filename));
    const version = JSON.parse(git('show', commit + ':package.json')).version;
    const tag = 'comic-manifest/v1.0.0';
    const prefix = 'comic-manifest-v1.0.0';
    const files = [
      [prefix + '.source.tar.gz', source, 'application/gzip'],
      [prefix + '.package.tgz', packageBytes, 'application/gzip'],
      [prefix + '.package-lock.json', git('show', commit + ':package-lock.json'), 'application/json'],
      [prefix + '.sdk-contract-lock.json', git('show', commit + ':release/contract-lock.json'), 'application/json'],
      [prefix + '.context-builder-contract-lock.json', git('show', commit + ':release/context-builder-contract-lock.json'), 'application/json'],
      [prefix + '.contract-lock.json', git('show', commit + ':release/comic-manifest-contract-lock.json'), 'application/json'],
      [prefix + '.api-v1.json', git('show', commit + ':release/comic-manifest-api-v1.json'), 'application/json']
    ];
    const manifest = {
      repository: 'DefinitelySecureStudio/platform', component: 'comic-manifest', version: '1.0.0',
      package_version: version, tag, commit, candidate, readiness,
      constitution_commit: 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564',
      codex_contract: JSON.parse(git('show', commit + ':release/comic-manifest-contract-lock.json')),
      assets: files.map(([filename, bytes, media_type]) => ({ filename, media_type, byte_size: bytes.length, sha256: sha(bytes),
        artifact_uri: 'https://github.com/DefinitelySecureStudio/platform/releases/download/' + encodeURIComponent(tag) + '/' + filename }))
    };
    await mkdir(output);
    for (const [filename, bytes] of files) await writeFile(join(output, filename), bytes, { flag: 'wx' });
    await writeFile(join(output, prefix + '.manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    return manifest;
  } finally { await rm(scratch, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.slice(3).some(arg => arg !== '--candidate')) throw Error('Unknown argument.');
  console.log(JSON.stringify(await buildComicManifestRelease(process.argv[2], { candidate: process.argv.includes('--candidate') }), null, 2));
}
