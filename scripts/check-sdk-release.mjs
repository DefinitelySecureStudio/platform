import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { RELEASE_CONTRACTS } from '../src/prompt-sdk/release-contracts.js';
const names = ['prompt-definition', 'provider-execution', 'context-package', 'structured-output', 'execution-provenance'];
export function checkReleaseInputs({ pkg, lock, pins = RELEASE_CONTRACTS }) {
  const blockers = [];
  if (!['1.0.0', '1.1.0'].includes(pkg?.version)) blockers.push('Platform package does not carry the reviewed SDK v1 implementation.');
  if (!Array.isArray(lock?.contracts) || lock.contracts.length !== names.length) blockers.push('Immutable contract lock must contain exactly five contracts.');
  for (const name of names) {
    const matches = Array.isArray(lock?.contracts) ? lock.contracts.filter(entry => entry?.contract === name) : [];
    const entry = matches[0], pin = pins?.[name];
    const assets = Array.isArray(entry?.assets) ? entry.assets.filter(asset => asset?.media_type === 'application/schema+json') : [];
    const schema = assets[0];
    const tag = 'contract/' + name + '/v1.0.0';
    const prefix = 'https://github.com/DefinitelySecureStudio/codex/releases/download/' + encodeURIComponent(tag) + '/';
    if (matches.length !== 1 || entry?.repository !== 'DefinitelySecureStudio/codex' || entry?.version !== '1.0.0' ||
        entry?.tag !== tag || !/^[0-9a-f]{40}$/.test(entry?.commit ?? '') ||
        entry?.publication?.immutable !== true || typeof entry?.publication?.verified_at !== 'string' ||
        !Number.isFinite(Date.parse(entry.publication.verified_at)) ||
        entry.publication.release_url !== 'https://github.com/DefinitelySecureStudio/codex/releases/tag/' + tag ||
        assets.length !== 1 || !Number.isSafeInteger(schema?.byte_size) || schema.byte_size < 1 ||
        !/^sha256:[0-9a-f]{64}$/.test(schema?.sha256 ?? '') ||
        typeof schema?.artifact_uri !== 'string' || schema.artifact_uri !== prefix + name + '-v1.0.0.schema.json') {
      blockers.push(name + ' lacks a complete verified immutable reference.');
    }
    if (pin?.status !== 'released') blockers.push(name + ' remains provisional.');
    if (!pin || pin.commit !== entry?.commit || pin.schema_sha256 !== schema?.sha256 || pin.schema_byte_size !== schema?.byte_size ||
        pin.artifact_uri !== schema?.artifact_uri || pin.media_type !== schema?.media_type || pin.tag !== tag || pin.version !== '1.0.0' ||
        pin.repository !== 'DefinitelySecureStudio/codex' || pin.contract !== name) blockers.push(name + ' runtime pin differs from the dependency lock.');
  }
  return { ready: blockers.length === 0, blockers };
}
export async function releaseReadiness() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  let lock;
  try { lock = JSON.parse(await readFile(new URL('../release/contract-lock.json', import.meta.url))); } catch { /* fail closed */ }
  return checkReleaseInputs({ pkg, lock });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await releaseReadiness();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ready ? 0 : 1;
}
