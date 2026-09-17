import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { releaseReadiness as sdkReadiness } from './check-sdk-release.mjs';

export const builderSchema = Object.freeze({ byte_size: 20802,
  sha256: 'sha256:4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3' });
export function checkBuilderRelease({ pkg, lock, headers = [] }) {
  const blockers = [], tag = 'contract/context-builder/v1.0.0';
  const prefix = 'https://github.com/DefinitelySecureStudio/codex/releases/download/' + encodeURIComponent(tag) + '/';
  if (pkg?.version !== '1.1.0' || pkg?.private !== true ||
      pkg?.exports?.['./context-builder'] !== './src/context-builder/index.js' ||
      pkg?.bin?.['studio-context'] !== './src/context-builder/cli.js') blockers.push('Public API/package metadata differs from the reviewed candidate.');
  if (lock?.repository !== 'DefinitelySecureStudio/codex' || lock?.contract !== 'context-builder' ||
      lock?.version !== '1.0.0' || lock?.tag !== tag || !/^[a-f0-9]{40}$/.test(lock?.commit ?? '') ||
      lock?.schema_id !== 'urn:definitely-secure:contract:context-builder:1.0.0:context-builder' ||
      lock?.constitution_commit !== 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564' ||
      lock?.publication?.immutable !== true || !Number.isFinite(Date.parse(lock?.publication?.verified_at ?? '')) ||
      lock?.publication?.release_url !== 'https://github.com/DefinitelySecureStudio/codex/releases/tag/' + tag) {
    blockers.push('Missing verified immutable Builder contract publication.');
  }
  const assets = Array.isArray(lock?.assets) ? lock.assets : [];
  if (assets.length !== 2) blockers.push('Expected schema and source bundle assets.');
  for (const [suffix, type] of [['schema.json', 'application/schema+json'], ['bundle.json', 'application/json']]) {
    const filename = 'context-builder-v1.0.0.' + suffix, matches = assets.filter(a => a?.filename === filename), asset = matches[0];
    if (matches.length !== 1 || asset?.artifact_uri !== prefix + filename || asset?.media_type !== type ||
        !Number.isSafeInteger(asset?.byte_size) || asset.byte_size < 1 || !/^sha256:[a-f0-9]{64}$/.test(asset?.sha256 ?? '') ||
        (suffix === 'schema.json' && (asset?.byte_size !== builderSchema.byte_size || asset?.sha256 !== builderSchema.sha256))) {
      blockers.push('Invalid immutable Builder ' + suffix + ' reference.');
    }
  }
  if (headers.length !== 3 || headers.some(header => typeof header !== 'string' ||
      !header.startsWith('// Generated from Codex ' + lock?.commit + '; released immutable contract.\n') ||
      !header.includes(builderSchema.sha256.slice(7)) ||
      !header.includes('d81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617'))) {
    blockers.push('Regenerate all three validators from verified published schemas before release.');
  }
  return { ready: blockers.length === 0, blockers };
}
export async function builderReleaseReadiness() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  let lock;
  try { lock = JSON.parse(await readFile(new URL('../release/context-builder-contract-lock.json', import.meta.url))); } catch { /* pending publication fails closed */ }
  const headers = await Promise.all(['request', 'source', 'audit'].map(name => readFile(new URL('../src/context-builder/generated/' + name + '-v1.js', import.meta.url), 'utf8')));
  const result = checkBuilderRelease({ pkg, lock, headers }), sdk = await sdkReadiness();
  return { ready: result.ready && sdk.ready, blockers: [...result.blockers, ...sdk.blockers] };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await builderReleaseReadiness(); console.log(JSON.stringify(report, null, 2)); process.exitCode = report.ready ? 0 : 1;
}
