import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { COMIC_MANIFEST_CONTRACT } from '../src/comic-manifest/contract.js';

const tag = 'comic-manifest/v1.0.0';
const codexPrefix = 'https://github.com/DefinitelySecureStudio/codex/releases/download/' + encodeURIComponent('contract/comic-manifest/v1.0.0') + '/';
const expectedAssets = [
  ['comic-manifest-v1.0.0.schema.json', 'application/schema+json', codexPrefix],
  ['comic-manifest-v1.0.0.bundle.json', 'application/json', codexPrefix],
  ['comic-manifest-v1.0.0.manifest.json', 'application/json', codexPrefix]
];

export function checkComicManifestRelease({ pkg, lock, pin = COMIC_MANIFEST_CONTRACT }) {
  const blockers = [];
  if (pkg?.version !== '1.2.0' || pkg?.private !== true ||
      pkg?.exports?.['./comic-manifest'] !== './src/comic-manifest/index.js' ||
      pkg?.bin?.['studio-comic'] !== './src/comic-manifest/cli.js') {
    blockers.push('Public package metadata differs from the reviewed Comic Manifest candidate.');
  }

  const publication = lock?.publication;
  if (lock?.repository !== 'DefinitelySecureStudio/codex' || lock?.contract !== 'comic-manifest' ||
      lock?.version !== '1.0.0' || lock?.tag !== 'contract/comic-manifest/v1.0.0' ||
      !/^[a-f0-9]{40}$/.test(lock?.commit ?? '') ||
      lock?.constitution_commit !== 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564' ||
      lock?.schema_id !== 'urn:definitely-secure:contract:comic-manifest:1.0.0:comic-manifest') {
    blockers.push('Comic Manifest lock lacks the exact contract and source identity.');
  }

  const assets = Array.isArray(lock?.assets) ? lock.assets : [];
  if (assets.length !== expectedAssets.length) blockers.push('Comic Manifest lock must contain schema, bundle, and release-manifest assets.');
  for (const [filename, mediaType, prefix] of expectedAssets) {
    const matches = assets.filter(asset => asset?.filename === filename), asset = matches[0];
    if (matches.length !== 1 || asset?.media_type !== mediaType || asset?.artifact_uri !== prefix + filename ||
        !Number.isSafeInteger(asset?.byte_size) || asset.byte_size < 1 ||
        !/^sha256:[a-f0-9]{64}$/.test(asset?.sha256 ?? '')) {
      blockers.push('Invalid or missing Comic Manifest asset identity: ' + filename + '.');
    }
  }
  if (lock?.status !== 'published' || publication?.status !== 'published' || publication?.immutable !== true ||
      !Number.isFinite(Date.parse(publication?.verified_at ?? '')) ||
      publication?.release_url !== 'https://github.com/DefinitelySecureStudio/codex/releases/tag/contract/comic-manifest/v1.0.0') {
    blockers.push('Codex contract publication and independent immutable-download verification are not recorded.');
  }
  const schema = assets.find(asset => asset?.filename === 'comic-manifest-v1.0.0.schema.json');
  if (pin?.status !== 'released' || pin?.repository !== 'DefinitelySecureStudio/codex' ||
      pin?.version !== '1.0.0' || pin?.tag !== 'contract/comic-manifest/v1.0.0' || pin?.commit !== lock?.commit ||
      pin?.schema_id !== lock?.schema_id || pin?.artifact_uri !== schema?.artifact_uri ||
      pin?.media_type !== schema?.media_type || pin?.byte_size !== schema?.byte_size || pin?.sha256 !== schema?.sha256) {
    blockers.push('Runtime validator pin has not adopted the exact published contract tuple.');
  }
  return { ready: blockers.length === 0, blockers };
}

export async function comicManifestReleaseReadiness() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  let lock;
  try { lock = JSON.parse(await readFile(new URL('../release/comic-manifest-contract-lock.json', import.meta.url))); } catch { /* absent evidence blocks readiness */ }
  return checkComicManifestRelease({ pkg, lock });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await comicManifestReleaseReadiness();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ready ? 0 : 1;
}
