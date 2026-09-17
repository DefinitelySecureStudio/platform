import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMemorySourceBinding, createPublicSnapshotBinding, createApprovedExportBinding,
  createSyntheticPreparationVerifier } from '../../src/context-builder/index.js';
import { sourceBindingConformance, preparationVerifierConformance, conformanceOwner } from '../support/context-builder-conformance.js';

sourceBindingConformance('Memory reader', ({ source, artifact, bytes }) => createMemorySourceBinding({ source, artifact, bytes }));
sourceBindingConformance('Public snapshot reader', async ({ source, artifact, bytes, t }) => {
  const root = await mkdtemp(join(tmpdir(), 'builder-common-')); t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'source.txt'), bytes);
  return createPublicSnapshotBinding({ source: { ...source, kind: 'public-canon' }, artifact, root, filename: 'source.txt' });
});
sourceBindingConformance('Approved fake-private export', ({ source, artifact, bytes }) => createApprovedExportBinding({
  source: { ...source, kind: 'approved-private', classification: 'internal', reference: { kind: 'opaque-artifact', handle: conformanceOwner } },
  artifact, readExport: async () => (async function* () { yield bytes.subarray(0, 2); yield bytes.subarray(2); })()
}));
sourceBindingConformance('Independent fake binding', ({ source, artifact, bytes }) => ({
  source, artifact, async read() { return Buffer.from(bytes); }
}));

preparationVerifierConformance('Synthetic fixture verifier', decision => {
  const p = createSyntheticPreparationVerifier([decision]); return { verifier: p.verifier, revoke: () => p.revoke(decision.decision_id) };
});
preparationVerifierConformance('Independent fake policy service', decision => {
  let revoked = false;
  return { revoke() { revoked = true; }, verifier: { mode: 'synthetic', id: 'studio.synthetic.independent-policy', async verify({ at }) {
    return { ...structuredClone(decision), authority_mode: 'synthetic', verifier_id: 'studio.synthetic.independent-policy',
      revocation: { status: revoked ? 'revoked' : 'active', checked_at: at } };
  } } };
});
