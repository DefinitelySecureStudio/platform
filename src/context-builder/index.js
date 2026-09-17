// Context Builder v1 API candidate. Publication/adoption remains gated by #86.
export { createPreparationGate } from './preparation.js';
export { createSyntheticPreparationVerifier } from './synthetic-verifier.js';
export { PreparationError } from './errors.js';
export { createMemorySourceBinding, createPublicSnapshotBinding, createApprovedExportBinding } from './source-readers.js';
export { createMemoryArtifactStore, comparePreparedArtifacts } from './lifecycle.js';
export { createAuditedContextBuilder, createSyntheticAuditSink, createSyntheticAttestor } from './audit.js';
export { createContextHandoff, createSyntheticUseAuthorizationProvider } from './handoff.js';
export { parseBuilderJson, inspectBuildRequest, createSyntheticFixtureBuilder, createBuildArtifact,
  verifyBuildArtifact, compareBuildArtifacts, serializeBuildArtifact } from './authoring.js';
