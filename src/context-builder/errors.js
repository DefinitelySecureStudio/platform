const codes = Object.freeze({
  INVALID_REQUEST: ['request', 'repair-request'],
  PREPARATION_DENIED: ['authorization', 'obtain-authorization'],
  AUTHORITY_UNVERIFIABLE: ['authorization', 'obtain-authorization'],
  STALE_AUTHORITY: ['authorization', 'rebuild'],
  SOURCE_UNAVAILABLE: ['source', 'repair-source'],
  SOURCE_INTEGRITY: ['source', 'repair-source'],
  INVALID_SOURCE: ['normalization', 'repair-source'],
  BUDGET_EXCEEDED: ['source', 'increase-budget'],
  CANCELLED: ['authorization', 'none']
});

export class PreparationError extends Error {
  constructor(code, stageOverride) {
    super('Context preparation failed.');
    this.name = 'PreparationError';
    const [defaultStage, action] = codes[code];
    const stage = code === 'BUDGET_EXCEEDED' && stageOverride === 'normalization' ? stageOverride : defaultStage;
    this.diagnostic = Object.freeze({ stage, code, action });
  }
  toJSON() { return { diagnostic: this.diagnostic }; }
  toAudit() { return { stage: this.diagnostic.stage, outcome: 'failed', code: this.diagnostic.code }; }
}
export function fail(code) { throw new PreparationError(code); }
export function requireCondition(value, code = 'INVALID_REQUEST') { if (!value) fail(code); }
