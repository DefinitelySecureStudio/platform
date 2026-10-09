import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { COMIC_MANIFEST_CONTRACT } from '../src/comic-manifest/contract.js';

const tag = 'comic-manifest/v1.0.0';
const codexTag = 'contract/comic-manifest/v1.0.0';
const codexCommit = '12e437e30328a3bb9cd2d15e6307a70b4b7e0e2a';
const releaseUrl = 'https://github.com/DefinitelySecureStudio/codex/releases/tag/' + codexTag;
const codexPrefix = 'https://github.com/DefinitelySecureStudio/codex/releases/download/' + encodeURIComponent(codexTag) + '/';
const expectedAssets = [
  ['comic-manifest-v1.0.0.schema.json', 'application/schema+json', 30860, 'sha256:7bd3c5392ae0db0c5baba553c233142d3d4427471f5850123eef7b87d4c8eaa4'],
  ['comic-manifest-v1.0.0.bundle.json', 'application/json', 865650, 'sha256:bb131a7dbb96692172b4e44b56a272d041309e53b136433cc71a24c8d1b934de'],
  ['comic-manifest-v1.0.0.manifest.json', 'application/json', 1152, 'sha256:56bba6d990c429384e16d8aa49af99b3a25ca8733efa96b5681be5932dcba878']
];
const expectedTransport = expectedAssets.map(([filename]) => ({
  filename, github_release_asset_content_type: 'application/json',
  public_download_http_status: 200, public_download_content_type: 'application/octet-stream'
}));

export function checkComicManifestRelease({ pkg, lock, pin = COMIC_MANIFEST_CONTRACT }) {
  const blockers = [];
  if (pkg?.version !== '1.2.0' || pkg?.private !== true ||
      pkg?.exports?.['./comic-manifest'] !== './src/comic-manifest/index.js' ||
      pkg?.bin?.['studio-comic'] !== './src/comic-manifest/cli.js') {
    blockers.push('Public package metadata differs from the reviewed Comic Manifest candidate.');
  }

  const publication = lock?.publication;
  if (lock?.repository !== 'DefinitelySecureStudio/codex' || lock?.contract !== 'comic-manifest' ||
      lock?.version !== '1.0.0' || lock?.tag !== codexTag || lock?.commit !== codexCommit ||
      lock?.constitution_commit !== 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564' ||
      lock?.schema_id !== 'urn:definitely-secure:contract:comic-manifest:1.0.0:comic-manifest') {
    blockers.push('Comic Manifest lock does not match the exact published Codex contract identity.');
  }

  const assets = Array.isArray(lock?.assets) ? lock.assets : [];
  if (assets.length !== expectedAssets.length) blockers.push('Comic Manifest lock must contain exactly the three published contract assets.');
  for (const [filename, mediaType, byteSize, digest] of expectedAssets) {
    const matches = assets.filter(asset => asset?.filename === filename), asset = matches[0];
    if (matches.length !== 1 || asset?.artifact_uri !== codexPrefix + filename || asset?.media_type !== mediaType ||
        asset?.byte_size !== byteSize || asset?.sha256 !== digest) {
      blockers.push('Comic Manifest asset tuple differs from the published Codex release: ' + filename + '.');
    }
  }
  if (lock?.status !== 'published' || publication?.status !== 'published' || publication?.draft !== false ||
      publication?.prerelease !== false || publication?.immutable !== true || publication?.tag_target !== codexCommit ||
      !Number.isFinite(Date.parse(publication?.verified_at ?? '')) ||
      publication?.release_url !== releaseUrl || JSON.stringify(publication?.transport) !== JSON.stringify(expectedTransport)) {
    blockers.push('Codex immutable publication, exact tag target, and separate transport verification are not recorded.');
  }
  const schema = assets.find(asset => asset?.filename === 'comic-manifest-v1.0.0.schema.json');
  if (pin?.status !== 'released' || pin?.repository !== 'DefinitelySecureStudio/codex' ||
      pin?.version !== '1.0.0' || pin?.tag !== codexTag || pin?.commit !== codexCommit ||
      pin?.schema_id !== lock?.schema_id || pin?.artifact_uri !== schema?.artifact_uri ||
      pin?.media_type !== schema?.media_type || pin?.byte_size !== schema?.byte_size || pin?.sha256 !== schema?.sha256) {
    blockers.push('Runtime validator pin has not adopted the exact published schema tuple.');
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
