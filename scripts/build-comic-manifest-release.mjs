import { execFileSync } from 'node:child_process';
import { lstat, mkdtemp, mkdir, readFile, realpath, stat, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, relative, isAbsolute, sep, dirname, basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { comicManifestReleaseReadiness } from './check-comic-manifest-release.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const gitAt = cwd => (...args) => execFileSync('git', args, {
  cwd, env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' }, maxBuffer: 32 * 1024 * 1024
});
const git = gitAt(root);
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

export function verifySourceIdentity(sourceIdentity, localTree, checkoutRoot = root) {
  const hasSourceIdentity = sourceIdentity?.commit !== undefined || sourceIdentity?.tree !== undefined;
  if (!hasSourceIdentity) return false;
  if (!/^[a-f0-9]{40}$/.test(sourceIdentity.commit ?? '') || !/^[a-f0-9]{40}$/.test(sourceIdentity.tree ?? '')) {
    throw Error('Supplied source identity must use full Git commit and tree IDs.');
  }
  const checkoutGit = gitAt(checkoutRoot);
  let verifiedTree;
  try {
    if (checkoutGit('cat-file', '-t', sourceIdentity.commit).toString().trim() !== 'commit') throw Error('not a commit object');
    verifiedTree = checkoutGit('rev-parse', sourceIdentity.commit + '^{tree}').toString().trim();
  } catch {
    throw Error('Supplied source commit is not present as a verified local Git commit object.');
  }
  if (verifiedTree !== sourceIdentity.tree || verifiedTree !== localTree) {
    throw Error('Supplied source commit must resolve to the exact matching local Git tree.');
  }
  return true;
}

export async function resolveExternalOutput(destination, checkoutRoot = root) {
  if (!destination) throw Error('Provide a new external output directory.');
  const requested = resolve(destination), missing = [];
  let ancestor = requested;
  while (true) {
    try { await lstat(ancestor); break; }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.unshift(basename(ancestor));
      ancestor = parent;
    }
  }
  if (!missing.length) throw Error('Output directory must be new.');
  const physicalAncestor = await realpath(ancestor);
  if (!(await stat(physicalAncestor)).isDirectory()) throw Error('Output path must descend from an existing directory.');
  const output = resolve(physicalAncestor, ...missing);
  const checkout = await realpath(checkoutRoot);
  const rel = relative(checkout, output);
  if (!rel || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel))) {
    throw Error('Output must be outside checkout.');
  }
  return output;
}

export async function buildComicManifestRelease(destination, { candidate = false, sourceIdentity = {} } = {}) {
  const output = await resolveExternalOutput(destination);
  if (git('status', '--porcelain').length) throw Error('Build requires a clean committed checkout.');
  const readiness = await comicManifestReleaseReadiness();
  if (!readiness.ready && !candidate) throw Error('Codex contract publication/adoption is not ready.');
  const localCommit = git('rev-parse', 'HEAD').toString().trim();
  const tree = git('rev-parse', localCommit + '^{tree}').toString().trim();
  const hasSourceIdentity = verifySourceIdentity(sourceIdentity, tree);
  const commit = hasSourceIdentity ? sourceIdentity.commit : localCommit;
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
      package_version: version, tag, commit, tree, candidate, readiness,
      constitution_commit: 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564',
      codex_contract: JSON.parse(git('show', commit + ':release/comic-manifest-contract-lock.json')),
      assets: files.map(([filename, bytes, media_type]) => ({ filename, media_type, byte_size: bytes.length, sha256: sha(bytes),
        artifact_uri: 'https://github.com/DefinitelySecureStudio/platform/releases/download/' + encodeURIComponent(tag) + '/' + filename }))
    };
    await mkdir(output, { recursive: true });
    for (const [filename, bytes] of files) await writeFile(join(output, filename), bytes, { flag: 'wx' });
    await writeFile(join(output, prefix + '.manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    return manifest;
  } finally { await rm(scratch, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(3), candidate = args.includes('--candidate'), sourceIdentity = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (key === '--candidate') continue;
    const value = args[++index];
    if (!['--source-commit', '--source-tree'].includes(key) || !value || value.startsWith('--')) throw Error('Unknown or incomplete argument.');
    sourceIdentity[key === '--source-commit' ? 'commit' : 'tree'] = value;
  }
  console.log(JSON.stringify(await buildComicManifestRelease(process.argv[2], { candidate, sourceIdentity }), null, 2));
}
