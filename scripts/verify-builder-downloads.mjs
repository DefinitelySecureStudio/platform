import { readFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
// Compare downloads against a separately trusted local build manifest, not a
// manifest obtained from the same untrusted download. Never extracts archives.
export async function verifyBuilderDownloads(manifestPath, directory) {
  const expectedBytes = await readFile(manifestPath), manifest = JSON.parse(expectedBytes);
  const required = ['source.tar.gz', 'package.tgz', 'package-lock.json', 'sdk-contract-lock.json', 'contract-lock.json']
    .map(suffix => 'context-builder-v1.0.0.' + suffix);
  if (manifest.repository !== 'DefinitelySecureStudio/platform' || manifest.component !== 'context-builder' ||
      manifest.version !== '1.0.0' || manifest.package_version !== '1.1.0' || manifest.tag !== 'context-builder/v1.0.0' ||
      !/^[a-f0-9]{40}$/.test(manifest.commit ?? '') || manifest.candidate !== false || manifest.readiness?.ready !== true ||
      !Array.isArray(manifest.assets) || manifest.assets.length !== required.length ||
      new Set(manifest.assets.map(a => a?.filename)).size !== required.length) throw Error('Not a release-ready trusted manifest.');
  async function bytes(filename) {
    const path = join(directory, filename), stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Download is not a regular file.');
    return readFile(path);
  }
  if (!(await bytes('context-builder-v1.0.0.manifest.json')).equals(expectedBytes)) throw Error('Downloaded manifest differs from trusted build.');
  for (const asset of manifest.assets) {
    if (!required.includes(asset.filename) || asset.artifact_uri !==
        'https://github.com/DefinitelySecureStudio/platform/releases/download/context-builder%2Fv1.0.0/' + asset.filename ||
        asset.media_type !== (asset.filename.endsWith('.json') ? 'application/json' : 'application/gzip')) throw Error('Unexpected asset.');
    const value = await bytes(asset.filename);
    if (value.length !== asset.byte_size || 'sha256:' + createHash('sha256').update(value).digest('hex') !== asset.sha256) throw Error('Downloaded asset identity mismatch.');
  }
  return { verified: true, commit: manifest.commit, assets: required.length + 1 };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw Error('Supply trusted build manifest and downloaded directory.');
  console.log(JSON.stringify(await verifyBuilderDownloads(process.argv[2], process.argv[3])));
}
