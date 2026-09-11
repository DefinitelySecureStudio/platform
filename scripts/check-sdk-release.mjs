import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { CONTRACT, EXECUTION_CONTRACT, CONTEXT_PACKAGE_CONTRACT, STRUCTURED_OUTPUT_CONTRACT } from '../src/prompt-sdk/index.js';
export async function releaseReadiness() {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  const blockers = [];
  if (pkg.version !== '1.0.0') blockers.push('SDK package is not version 1.0.0.');
  for (const [name, pin] of Object.entries({ 'prompt-definition': CONTRACT, 'provider-execution': EXECUTION_CONTRACT, 'context-package': CONTEXT_PACKAGE_CONTRACT, 'structured-output': STRUCTURED_OUTPUT_CONTRACT })) {
    if (pin.status !== 'released') blockers.push(name + ' remains provisional.');
  }
  let lock;
  try { lock = JSON.parse(await readFile(new URL('../release/contract-lock.json', import.meta.url))); }
  catch { blockers.push('A reviewed immutable contract lock is missing or unreadable.'); }
  const names = ['prompt-definition', 'provider-execution', 'context-package', 'structured-output', 'execution-provenance'];
  if (lock) {
    if (!Array.isArray(lock.contracts) || lock.contracts.length !== names.length) blockers.push('Contract lock must contain exactly five contracts.');
    for (const name of names) {
      const entries = Array.isArray(lock.contracts) ? lock.contracts.filter(entry => entry?.contract === name) : [];
      const entry = entries[0];
      const schema = Array.isArray(entry?.assets) ? entry.assets.find(asset => asset?.media_type === 'application/schema+json') : undefined;
      if (entries.length !== 1 || entry.repository !== 'DefinitelySecureStudio/codex' || entry.version !== '1.0.0' ||
          entry.tag !== 'contract/' + name + '/v1.0.0' || !/^[0-9a-f]{40}$/.test(entry.commit ?? '') ||
          entry.publication?.immutable !== true || !Number.isFinite(Date.parse(entry.publication?.verified_at)) ||
          !schema || !Number.isSafeInteger(schema.byte_size) || schema.byte_size < 1 ||
          !/^sha256:[0-9a-f]{64}$/.test(schema.sha256 ?? '') ||
          !schema.artifact_uri?.startsWith('https://github.com/DefinitelySecureStudio/codex/releases/download/' + encodeURIComponent(entry.tag) + '/')) {
        blockers.push(name + ' lacks a complete verified immutable reference.');
      }
      const pin = { 'prompt-definition': CONTRACT, 'provider-execution': EXECUTION_CONTRACT, 'context-package': CONTEXT_PACKAGE_CONTRACT, 'structured-output': STRUCTURED_OUTPUT_CONTRACT }[name];
      if (pin && (pin.commit !== entry?.commit || pin.schema_sha256 !== schema?.sha256 || pin.schema_byte_size !== schema?.byte_size)) blockers.push(name + ' runtime pin differs from the dependency lock.');
    }
  }
  // Offline readiness checks the reviewed evidence; it is not a substitute for
  // independently verifying GitHub publication and downloaded asset bytes.
  return { ready: blockers.length === 0, blockers };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await releaseReadiness();
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ready ? 0 : 1;
}
