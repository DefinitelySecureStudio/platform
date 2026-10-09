import { pathToFileURL } from 'node:url';
import { verifyComicManifestApproval } from './comic-manifest-approval.mjs';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 4) throw Error('Supply the exact artifact directory and detached owner approval JSON.');
  const result = await verifyComicManifestApproval(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(result, null, 2));
}
