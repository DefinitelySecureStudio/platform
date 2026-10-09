import { pathToFileURL } from 'node:url';
import { createComicManifestApprovalPacket } from './comic-manifest-approval.mjs';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3) throw Error('Supply the exact external Platform artifact directory.');
  const packet = await createComicManifestApprovalPacket(process.argv[2]);
  console.log(JSON.stringify(packet, null, 2));
}
