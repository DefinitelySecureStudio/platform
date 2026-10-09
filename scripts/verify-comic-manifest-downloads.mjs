import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const tag = 'comic-manifest/v1.0.0';
const prefix = 'comic-manifest-v1.0.0';
const expected = [
  prefix + '.source.tar.gz',
  prefix + '.package.tgz',
  prefix + '.package-lock.json',
  prefix + '.sdk-contract-lock.json',
  prefix + '.context-builder-contract-lock.json',
  prefix + '.contract-lock.json',
  prefix + '.api-v1.json'
];

// Compare freshly downloaded files with a separately trusted local build
// manifest. Never extracts a downloaded archive or follows asset symlinks.
export async function verifyComicManifestDownloads(trustedManifestPath, directory) {
  const expectedBytes = await readFile(trustedManifestPath);
  const manifest = JSON.parse(expectedBytes);
  const rootStat = await lstat(directory);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw Error('Download directory must be a regular directory.');
  const expectedFiles = [...expected, prefix + '.manifest.json'].sort();
  const downloadedFiles = (await readdir(directory)).sort();
  if (manifest.repository !== 'DefinitelySecureStudio/platform' || manifest.component !== 'comic-manifest' ||
      manifest.version !== '1.0.0' || manifest.package_version !== '1.2.0' || manifest.tag !== tag ||
      !/^[a-f0-9]{40}$/.test(manifest.commit ?? '') || !/^[a-f0-9]{40}$/.test(manifest.tree ?? '') ||
      manifest.build_provenance?.mode !== 'release-approval-candidate' ||
      manifest.build_provenance?.owner_approval_status_at_build !== 'not-approved' ||
      manifest.build_provenance?.publication_status_at_build !== 'not-published' || manifest.codex_adoption?.ready !== true ||
      JSON.stringify(downloadedFiles) !== JSON.stringify(expectedFiles) ||
      !Array.isArray(manifest.assets) || manifest.assets.length !== expected.length ||
      new Set(manifest.assets.map(asset => asset?.filename)).size !== expected.length) {
    throw Error('Not a complete trusted approval-candidate manifest and asset set.');
  }

  async function bytes(filename) {
    if (typeof filename !== 'string' || filename.includes('/') || filename.includes('\\') || filename === '.' || filename === '..') {
      throw Error('Unsafe download filename.');
    }
    const path = join(directory, filename), stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Download is not a regular file.');
    return readFile(path);
  }

  if (!(await bytes(prefix + '.manifest.json')).equals(expectedBytes)) throw Error('Downloaded manifest differs from trusted build.');
  for (const asset of manifest.assets) {
    const mediaType = asset.filename.endsWith('.json') ? 'application/json' : 'application/gzip';
    if (!expected.includes(asset.filename) || asset.artifact_uri !==
        'https://github.com/DefinitelySecureStudio/platform/releases/download/' + encodeURIComponent(tag) + '/' + asset.filename ||
        asset.media_type !== mediaType || !Number.isSafeInteger(asset.byte_size) || asset.byte_size < 1 ||
        !/^sha256:[a-f0-9]{64}$/.test(asset.sha256 ?? '')) throw Error('Unexpected or incomplete release asset identity.');
    const value = await bytes(asset.filename);
    if (value.length !== asset.byte_size || 'sha256:' + createHash('sha256').update(value).digest('hex') !== asset.sha256) {
      throw Error('Downloaded asset identity mismatch.');
    }
  }
  if (expected.some(filename => !manifest.assets.some(asset => asset.filename === filename))) throw Error('Trusted manifest omits an expected release asset.');
  return { verified: true, commit: manifest.commit, assets: expected.length + 1 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw Error('Supply trusted build manifest and downloaded directory.');
  console.log(JSON.stringify(await verifyComicManifestDownloads(process.argv[2], process.argv[3])));
}
