import { snapshot } from './request.js';

/** Offline fixture verifier; never install in a production-mode gate. No automatic grants. */
export function createSyntheticPreparationVerifier(decisions) {
  const records = snapshot(decisions);
  const revoked = new Set();
  const verifier = Object.freeze({
    id: 'studio.synthetic.preparation', mode: 'synthetic',
    async verify({ request, at }) {
      const found = records.filter(d => d.preparation_reference === request.preparation_reference);
      if (found.length !== 1) return null;
      return { ...found[0], authority_mode: 'synthetic', verifier_id: 'studio.synthetic.preparation',
        revocation: { status: revoked.has(found[0].decision_id) ? 'revoked' : 'active', checked_at: at } };
    }
  });
  return Object.freeze({ verifier, revoke(decisionId) { revoked.add(decisionId); } });
}
