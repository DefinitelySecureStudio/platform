import { validateComicBuildResultCandidate } from '../comic-manifest/result-candidate.js';
import { randomUUID, createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { types } from 'node:util';
import {
  AdapterExecutionError,
  MockTextAdapter,
  createExecutionRequest,
  executePrompt,
  validateExecutionCompatibility,
  validateExecutionDocument
} from '../prompt-sdk/index.js';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { validateComicManifest, validateComicOutputCompatibility } from '../comic-manifest/index.js';
import {
  assertAtMost,
  checkedAdd,
  MaterialLedger,
  NORMALIZED_OUTCOME_ENVELOPE_RESERVE_BYTES,
  OFFLINE_ORCHESTRATION_LIMITS
} from './limits.js';
import { InMemoryPrototypeStore, UNKNOWN_STORE_STATE } from './memory-store.js';
import { LocalFilePrototypeStore } from './local-file-store.js';
import { renderOfflineComicPrompt } from './prompt.js';
import {
  SYNTHETIC_EXECUTION_PURPOSE, validateExecutionAuthorityEvidence
} from './execution-authority.js';
import { loadSyntheticContextInput } from './context-input.js';
import {
  contextUseRequest, validateContextUseProvider, validateSyntheticContextReaders,
  validateSyntheticContextUseEvidence, SYNTHETIC_CONTEXT_READER_SLOTS
} from './context-use-authority.js';

const EXPECTED_PRODUCTION_ID = 'urn:uuid:10000000-0000-4000-8000-000000000001';
const EXPECTED_PRODUCTION_SHA256 = 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const MAX_TIMER_DELAY_MS = 2_147_483_647;
// Provider Execution v1 executionError.retry_after_ms schema maximum.
const MAX_PROVIDER_RETRY_AFTER_MS = 86_400_000;
const RETRY_PROVIDER_CODE = 'RATE_LIMITED_BEFORE_ACCEPTANCE';
const AUTHORITY_CHECK_TIMEOUT_MS = 1000;
const SYNTHETIC_RESUME_TIME_AUTHORITY_ID = 'studio.synthetic.resume-time-v1';
const EXPECTED_EXECUTION_SCOPE = Object.freeze({
  production_id: EXPECTED_PRODUCTION_ID,
  revision: 1,
  identity_sha256: EXPECTED_PRODUCTION_SHA256
});
const RECOVERY_EVENT_TYPES = new Set([
  'admitted', 'authorization-blocked', 'budget-exhausted', 'cancelled-before-dispatch',
  'closed-without-retry', 'contract-mapping-blocked', 'dispatch-started', 'job-closed',
  'persisting', 'prepared', 'provider-outcome', 'result-prepared', 'resume-window', 'terminal'
]);
const RECOVERY_DIAGNOSTIC_STATES = Object.freeze({
  'not-found': Object.freeze({ stage: 'lookup', code: 'RECORD_NOT_FOUND' }),
  'reconciliation-required': Object.freeze({ stage: 'integrity', code: 'RECONCILIATION_REQUIRED' }),
  terminal: Object.freeze({ stage: 'terminal', code: 'TERMINAL_RESULT_VERIFIED' }),
  'resume-candidate': Object.freeze({ stage: 'resume', code: 'RESUME_CANDIDATE' }),
  'resume-window-empty': Object.freeze({ stage: 'resume', code: 'RESUME_WINDOW_EMPTY' }),
  'retry-delay-not-elapsed': Object.freeze({ stage: 'resume', code: 'RETRY_DELAY_NOT_ELAPSED' }),
  'resume-not-eligible': Object.freeze({ stage: 'resume', code: 'RESUME_NOT_ELIGIBLE' }),
  'deadline-unverifiable': Object.freeze({ stage: 'time', code: 'DEADLINE_UNVERIFIABLE' }),
  'budget-exhausted': Object.freeze({ stage: 'limits', code: 'BUDGET_EXHAUSTED' }),
  'contract-mapping-blocked': Object.freeze({ stage: 'mapping', code: 'CONTRACT_MAPPING_BLOCKED' }),
  'execution-unresolved': Object.freeze({ stage: 'execution', code: 'EXECUTION_UNRESOLVED' }),
  'read-only-inspection-required': Object.freeze({ stage: 'inspection', code: 'INSPECTION_REQUIRED' }),
  'closed-without-result': Object.freeze({ stage: 'terminal', code: 'JOB_CLOSED_WITHOUT_RESULT' })
});

const defaultRuntime = Object.freeze({
  now: () => Math.floor(performance.now()),
  epochId: 'offline-process-monotonic-v1',
  wallNow: () => Date.now(),
  setTimer: (callback, delay) => setTimeout(callback, delay),
  clearTimer: timer => clearTimeout(timer)
});

export class OfflineOrchestrationError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'OfflineOrchestrationError';
    this.code = code;
  }
}

function freezeDeep(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freezeDeep(child, seen);
  return Object.freeze(value);
}

function recoveryDiagnostic(status) {
  const safeStatus = Object.prototype.hasOwnProperty.call(RECOVERY_DIAGNOSTIC_STATES, status)
    ? status : 'reconciliation-required';
  const { stage, code } = RECOVERY_DIAGNOSTIC_STATES[safeStatus];
  return freezeDeep({
    status: safeStatus,
    stage,
    code,
    read_only: true,
    no_writes: true,
    no_provider_calls: true,
    authority_check_required: safeStatus === 'resume-candidate'
  });
}

function digest(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function safeClock(runtime) {
  let now;
  let epochId;
  try {
    now = runtime.now();
    epochId = runtime.epochId;
  } catch {
    return undefined;
  }
  if (!Number.isSafeInteger(now) || now < 0 || typeof epochId !== 'string' || !epochId) return undefined;
  return { now, epochId };
}

function safeCorrelationId(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !SAFE_ID.test(value)) {
    throw new OfflineOrchestrationError('INVALID_CORRELATION_ID');
  }
  return value;
}

function readProduction(source) {
  const report = validateComicManifest(source);
  if (!report.valid || report.value.kind !== 'comic-production') {
    throw new OfflineOrchestrationError('INVALID_SYNTHETIC_PRODUCTION');
  }
  if (report.value.production_id !== EXPECTED_PRODUCTION_ID || report.value.revision !== 1
    || report.identity.sha256 !== EXPECTED_PRODUCTION_SHA256) {
    throw new OfflineOrchestrationError('UNSUPPORTED_PRODUCTION_REVISION');
  }
  if (report.value.renditions.length !== 1 || report.value.renditions[0].rendition_id !== 'transcript'
    || report.value.renditions[0].media_type !== 'text/plain') {
    throw new OfflineOrchestrationError('UNSUPPORTED_SYNTHETIC_RENDITION');
  }
  return {
    value: report.value,
    identity: report.identity,
    canonical: canonicalJson(report.value),
    reference: freezeDeep({
      production_id: report.value.production_id,
      revision: report.value.revision,
      identity: report.identity
    })
  };
}

function mockConfiguration(outcome, rendition) {
  const selected = outcome === undefined ? { kind: 'success' }
    : optionValues(outcome, new Set(['kind', 'retry_after_ms', 'delay_ms']), 'INVALID_MOCK_OUTCOME');
  const delay = selected.delay_ms ?? 0;
  if (!Number.isSafeInteger(delay) || delay < 0 || delay > OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs) {
    throw new OfflineOrchestrationError('INVALID_MOCK_OUTCOME');
  }
  if (selected.kind === undefined || selected.kind === 'success') {
    return { content: rendition.transcript, delay_ms: delay };
  }
  if (selected.kind === 'rate-limit') {
    const retryAfter = selected.retry_after_ms;
    if (!Number.isSafeInteger(retryAfter) || retryAfter < 1 || retryAfter > MAX_PROVIDER_RETRY_AFTER_MS) {
      throw new OfflineOrchestrationError('INVALID_MOCK_OUTCOME');
    }
    return {
      delay_ms: delay,
      error: new AdapterExecutionError({
        category: 'rate-limit', code: 'MOCK_RATE_LIMITED',
        message: 'Synthetic mock request was rate limited before acceptance.',
        retryable: true, retry_after_ms: retryAfter, stage: 'provider',
        provider: { code: RETRY_PROVIDER_CODE }
      })
    };
  }
  if (selected.kind === 'timeout') {
    return {
      delay_ms: delay,
      error: new AdapterExecutionError({
        category: 'timeout', code: 'MOCK_TIMEOUT',
        message: 'Synthetic mock call timed out.', retryable: false, stage: 'adapter'
      })
    };
  }
  if (selected.kind === 'output-validation') {
    return {
      delay_ms: delay,
      error: new AdapterExecutionError({
        category: 'output-validation', code: 'MOCK_OUTPUT_INVALID',
        message: 'Synthetic mock output failed validation.', retryable: false, stage: 'output-validation'
      })
    };
  }
  throw new OfflineOrchestrationError('INVALID_MOCK_OUTCOME');
}

function createRequest(rendered, { executionId, idempotencyKey, correlationId }) {
  return createExecutionRequest(rendered, {
    execution_id: executionId,
    ...(correlationId === undefined ? {} : { correlation_id: correlationId }),
    idempotency_key: idempotencyKey,
    target: { adapter_id: 'studio.mock.text', provider_id: 'studio-mock', model_id: 'mock-text-v1' },
    capabilities: { required: ['text-generation'], optional: [] },
    parameters: { max_output_tokens: 256 },
    expected_output: { kind: 'text', media_type: 'text/plain', validation: 'none' },
    delegation: {
      caller_id: 'offline.orchestration.prototype',
      human_owner: 'andrewperis',
      purpose: 'Run one bounded synthetic offline Comic Manifest attempt.',
      authority_reference: 'https://github.com/DefinitelySecureStudio/platform'
    },
    observability: { retention: 'metadata-only', capture_prompt: false, capture_output: false }
  });
}

function resultExecution(production, providerResult, outputDigest, noOutput = false) {
  const prompt = production.inputs.prompts[0];
  return {
    tool: production.inputs.dependencies[0],
    workflow_id: 'synthetic-offline-orchestration-v1',
    run_uri: null,
    started_at: providerResult.timing.started_at,
    finished_at: providerResult.timing.completed_at,
    transformations: outputDigest || noOutput ? [{
      step_id: 'mock-transcript',
      input_digests: [production.inputs.canon.artifact.sha256, prompt.identity.sha256],
      output_digests: outputDigest ? [outputDigest] : [],
      private_inputs_withheld: false,
      private_outputs_withheld: false
    }] : [],
    generation: [],
    reproducibility: 'exact',
    limitations: 'Synthetic offline prototype; no external generation or publication.'
  };
}

function buildComicResult({ production, productionReference, attemptId, resultId, providerResult,
  diagnostic, artifactUri, artifactBytes, noOutput = false }) {
  const requirement = production.renditions[0];
  const successful = providerResult.status === 'succeeded' && artifactBytes !== undefined;
  const artifactDigest = successful ? digest(artifactBytes) : undefined;
  const outputs = successful ? [{
    rendition_id: requirement.rendition_id,
    artifact: {
      artifact_uri: artifactUri,
      media_type: requirement.media_type,
      byte_size: artifactBytes.byteLength,
      sha256: artifactDigest
    },
    dimensions: requirement.dimensions,
    rights_notice: requirement.rights_notice,
    alt_text: requirement.alt_text,
    transcript: requirement.transcript,
    profile: requirement.profile,
    max_bytes: requirement.max_bytes
  }] : [];
  const result = {
    kind: 'comic-build-result',
    spec_version: noOutput ? '1.1.0' : '1.0.0',
    result_id: resultId,
    attempt_id: attemptId,
    production: productionReference,
    classification: production.classification,
    inputs: production.inputs,
    status: successful ? 'complete' : 'failed',
    outputs,
    gates: successful ? [{
      gate: 'integrity', disposition: 'pass', evidence_reference: artifactUri,
      rationale: 'Synthetic artifact bytes were read back and matched their recorded identity.'
    }] : [],
    execution: resultExecution(production, providerResult, artifactDigest, noOutput),
    diagnostics: successful ? [] : [diagnostic]
  };
  return freezeDeep(result);
}

function eligibleRateLimit(providerResult) {
  return providerResult?.status === 'failed' && providerResult.error?.category === 'rate-limit'
    && providerResult.error.retryable === true
    && Number.isSafeInteger(providerResult.error.retry_after_ms)
    && providerResult.error.retry_after_ms >= 1
    && providerResult.error.retry_after_ms <= MAX_PROVIDER_RETRY_AFTER_MS
    && providerResult.error.provider?.code === RETRY_PROVIDER_CODE
    && providerResult.output === undefined;
}

function isEligiblePersistedProviderOutcome(providerResult, executionId) {
  if (!providerResult || providerResult.kind !== 'execution-result') return false;
  try {
    return validateExecutionDocument(providerResult).valid
      && providerResult.execution_id === executionId
      && eligibleRateLimit(providerResult);
  } catch {
    return false;
  }
}

function sameBytes(actual, expected, expectedSha256) {
  return Buffer.isBuffer(actual) && actual.byteLength === expected.byteLength
    && digest(actual) === expectedSha256 && actual.equals(expected);
}

function appendConfirmed(store, jobId, event) {
  let appendFailed = false;
  try { store.append(event); } catch { appendFailed = true; }
  let events;
  try { events = store.readEvents(jobId); } catch { return false; }
  if (events === UNKNOWN_STORE_STATE || !Array.isArray(events)) return false;
  const matching = events.filter(item => canonicalJson(item) === canonicalJson(event));
  if (matching.length !== 1) return false;
  if (!appendFailed && matching.length === 1) return true;
  // A readback that proves the exact append occurred resolves the ambiguous response.
  return true;
}

function writeConfirmedOnce(store, key, bytes) {
  let writeFailed = false;
  try { store.writeImmutable(key, bytes); } catch { writeFailed = true; }
  let actual;
  try { actual = store.readImmutable(key); } catch { return false; }
  if (actual === UNKNOWN_STORE_STATE || actual?.state === 'absent') return false;
  if (!sameBytes(actual, bytes, digest(bytes))) return false;
  return !writeFailed || actual.byteLength === bytes.byteLength;
}

function storedJobPresence(store, jobId) {
  try {
    const jobIds = store.readJobIds();
    return Array.isArray(jobIds) ? jobIds.includes(jobId) : undefined;
  } catch {
    return undefined;
  }
}

function event(jobId, type, fields = {}) {
  return freezeDeep({ job_id: jobId, type, ...fields });
}

function idFrom(idFactory, usedIds, kind) {
  let id;
  try { id = idFactory(); } catch { throw new OfflineOrchestrationError('ID_ALLOCATION_FAILED'); }
  if (typeof id !== 'string' || !UUID.test(id) || usedIds.has(id)) throw new OfflineOrchestrationError('ID_ALLOCATION_FAILED');
  usedIds.add(id);
  return kind === 'execution' ? `exec-offline-${id}` : `urn:uuid:${id}`;
}

function cancellationSignal(signal) {
  if (signal === undefined || signal === null) return undefined;
  try {
    if (typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function'
      || typeof signal.removeEventListener !== 'function') throw new TypeError();
  } catch {
    throw new OfflineOrchestrationError('INVALID_CANCELLATION_SIGNAL');
  }
  return signal;
}

function optionValues(options, allowed, errorCode) {
  if (options === undefined) return Object.freeze({});
  if (options === null || typeof options !== 'object' || Array.isArray(options) || types.isProxy(options)) {
    throw new OfflineOrchestrationError(errorCode);
  }
  let descriptors;
  try {
    const prototype = Object.getPrototypeOf(options);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError();
    descriptors = Object.getOwnPropertyDescriptors(options);
  } catch {
    throw new OfflineOrchestrationError(errorCode);
  }
  const values = {};
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string' || !allowed.has(key) || !Object.hasOwn(descriptors[key], 'value')) {
      throw new OfflineOrchestrationError(errorCode);
    }
    values[key] = descriptors[key].value;
  }
  return values;
}

function defaultMockFactory(configuration) {
  return new MockTextAdapter(configuration);
}

function createRunner({ runtime = defaultRuntime, store = new InMemoryPrototypeStore(), idFactory = randomUUID,
  mockAdapterFactory = defaultMockFactory, onMockCall, executionAuthorityProvider,
  syntheticContextReaders, contextUseAuthorityProvider, resumeTimeAuthority } = {}) {
  if (!executionAuthorityProvider || executionAuthorityProvider.mode !== 'synthetic'
    || typeof executionAuthorityProvider.id !== 'string'
    || typeof executionAuthorityProvider.verify !== 'function'
    || typeof executionAuthorityProvider.isCurrent !== 'function') {
    throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_UNAVAILABLE');
  }
  if ((syntheticContextReaders === undefined) !== (contextUseAuthorityProvider === undefined)
    || (syntheticContextReaders !== undefined && (!validateSyntheticContextReaders(syntheticContextReaders)
      || !validateContextUseProvider(contextUseAuthorityProvider)))) {
    throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE');
  }
  let installedResumeTimeAuthority;
  if (resumeTimeAuthority !== undefined) {
    let configured;
    try {
      configured = optionValues(resumeTimeAuthority,
        new Set(['id', 'mode', 'domain_id', 'epoch_id', 'now']), 'RESUME_TIME_AUTHORITY_UNAVAILABLE');
    } catch { throw new OfflineOrchestrationError('RESUME_TIME_AUTHORITY_UNAVAILABLE'); }
    if (configured.id !== SYNTHETIC_RESUME_TIME_AUTHORITY_ID || configured.mode !== 'synthetic'
      || typeof configured.domain_id !== 'string' || !SAFE_ID.test(configured.domain_id)
      || typeof configured.epoch_id !== 'string' || !SAFE_ID.test(configured.epoch_id)
      || typeof configured.now !== 'function') {
      throw new OfflineOrchestrationError('RESUME_TIME_AUTHORITY_UNAVAILABLE');
    }
    installedResumeTimeAuthority = Object.freeze({ id: configured.id, mode: configured.mode,
      domain_id: configured.domain_id, epoch_id: configured.epoch_id, now: configured.now.bind(resumeTimeAuthority) });
    if (!(store instanceof LocalFilePrototypeStore)) {
      throw new OfflineOrchestrationError('RESUME_STORE_UNAVAILABLE');
    }
  }
  const verifyExecutionAuthority = executionAuthorityProvider.verify.bind(executionAuthorityProvider);
  const checkExecutionAuthorityCurrent = executionAuthorityProvider.isCurrent.bind(executionAuthorityProvider);
  const verifyContextUse = contextUseAuthorityProvider?.verify.bind(contextUseAuthorityProvider);
  const checkContextUseCurrent = contextUseAuthorityProvider?.isCurrent.bind(contextUseAuthorityProvider);
  const installedContextReaders = syntheticContextReaders && Object.freeze(Object.fromEntries(
    SYNTHETIC_CONTEXT_READER_SLOTS.map(slot => [slot, syntheticContextReaders.readers[slot].bind(syntheticContextReaders.readers)])
  ));
  let openJob;
  let running = false;
  const usedIds = new Set();
  const resumeTimeState = { lastMs: undefined };

  function sampleResumeTime(state) {
    if (!installedResumeTimeAuthority) return undefined;
    let now;
    try { now = installedResumeTimeAuthority.now(); } catch { return undefined; }
    if (!Number.isSafeInteger(now) || now < 0 || !Number.isFinite(new Date(now).getTime())
      || (state.lastMs !== undefined && now < state.lastMs)) return undefined;
    state.lastMs = now;
    return now;
  }

  function authorityClock(state, errorCode = 'EXECUTION_AUTHORITY_UNAVAILABLE') {
    let now;
    try { now = runtime.wallNow(); } catch { throw new OfflineOrchestrationError(errorCode); }
    if (!Number.isSafeInteger(now) || !Number.isFinite(new Date(now).getTime())
      || (state.lastMs !== undefined && now < state.lastMs)) {
      throw new OfflineOrchestrationError(errorCode);
    }
    state.lastMs = now;
    return now;
  }

  async function requireExecutionAuthority(action, signal, state) {
    if (signal?.aborted) throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_DENIED');
    const before = authorityClock(state);
    const at = new Date(Math.floor(before / 1000) * 1000).toISOString().replace('.000Z', 'Z');
    let evidence;
    let timeout;
    try {
      const unavailable = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('authority-timeout')), AUTHORITY_CHECK_TIMEOUT_MS);
      });
      evidence = await Promise.race([Promise.resolve().then(() => verifyExecutionAuthority(Object.freeze({
        action, purpose: SYNTHETIC_EXECUTION_PURPOSE, production: EXPECTED_EXECUTION_SCOPE, at
      }))), unavailable]);
    } catch {
      throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_UNAVAILABLE');
    } finally {
      clearTimeout(timeout);
    }
    if (signal?.aborted) throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_DENIED');
    const after = authorityClock(state);
    if (!validateExecutionAuthorityEvidence(evidence, {
      action, purpose: SYNTHETIC_EXECUTION_PURPOSE, production: EXPECTED_EXECUTION_SCOPE, at
    })) throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_DENIED');
    if (after >= Date.parse(evidence.review_after) || after >= Date.parse(evidence.expires_at)) {
      throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_STALE');
    }
    return evidence;
  }

  function currentAuthorityFailure(evidence, action, signal, state) {
    let active;
    try {
      active = checkExecutionAuthorityCurrent(Object.freeze({
        decision_id: evidence.decision_id,
        action,
        purpose: SYNTHETIC_EXECUTION_PURPOSE,
        production: EXPECTED_EXECUTION_SCOPE
      })) === true;
    } catch {
      return 'EXECUTION_AUTHORITY_UNAVAILABLE';
    }
    if (!active) return 'EXECUTION_AUTHORITY_DENIED';
    let now;
    try { now = authorityClock(state); } catch { return 'EXECUTION_AUTHORITY_UNAVAILABLE'; }
    if (now >= Date.parse(evidence.review_after) || now >= Date.parse(evidence.expires_at)) {
      return 'EXECUTION_AUTHORITY_STALE';
    }
    if (signal?.aborted) return 'EXECUTION_AUTHORITY_DENIED';
    return undefined;
  }

  async function requireContextUseAuthority(request, signal, state) {
    if (!verifyContextUse || signal?.aborted) {
      throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    }
    const before = authorityClock(state, 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE');
    const at = new Date(Math.floor(before / 1000) * 1000).toISOString().replace('.000Z', 'Z');
    let evidence;
    let timeout;
    try {
      const unavailable = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('context-use-timeout')), AUTHORITY_CHECK_TIMEOUT_MS);
      });
      evidence = await Promise.race([Promise.resolve().then(() => verifyContextUse(Object.freeze({ request, at, signal }))), unavailable]);
    } catch {
      throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE');
    } finally { clearTimeout(timeout); }
    if (signal?.aborted) throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    const after = authorityClock(state, 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE');
    if (!validateSyntheticContextUseEvidence(evidence, { request, at })
      || after >= Date.parse(evidence.review_after) || after >= Date.parse(evidence.expires_at)
      || after >= Date.parse(evidence.authorization.expires_at)) {
      throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    }
    evidence = freezeDeep(JSON.parse(canonicalJson(evidence)));
    let current;
    try { current = checkContextUseCurrent({ decision_id: evidence.decision_id, request }) === true; }
    catch { throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE'); }
    if (!current) throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_DENIED');
    return evidence;
  }

  function currentContextUseFailure(evidence, request, signal, state) {
    if (!evidence || !request || signal?.aborted) return 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED';
    if (!validateSyntheticContextUseEvidence(evidence, { request, at: evidence.revocation?.checked_at })) {
      return 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED';
    }
    let active;
    try { active = checkContextUseCurrent({ decision_id: evidence.decision_id, request }) === true; }
    catch { return 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE'; }
    if (!active || evidence.decision !== 'allow') return 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED';
    let now;
    try { now = authorityClock(state, 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE'); }
    catch { return 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE'; }
    if (now >= Date.parse(evidence.review_after) || now >= Date.parse(evidence.expires_at)
      || now >= Date.parse(evidence.authorization.expires_at)) return 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED';
    return undefined;
  }

  function hostBoundaryFailure(signal, epochId, deadlineMonotonicMs) {
    if (signal?.aborted) return 'EXECUTION_AUTHORITY_DENIED';
    const clock = safeClock(runtime);
    if (!clock || clock.epochId !== epochId) return 'EXECUTION_AUTHORITY_UNAVAILABLE';
    if (deadlineMonotonicMs !== undefined && clock.now >= deadlineMonotonicMs) return 'EXECUTION_DEADLINE_EXPIRED';
    return undefined;
  }

  function currentPermitTimeFailure(executionEvidence, contextEvidence, state) {
    let now;
    try { now = authorityClock(state); } catch { return 'EXECUTION_AUTHORITY_UNAVAILABLE'; }
    if (!executionEvidence || now >= Date.parse(executionEvidence.review_after)
      || now >= Date.parse(executionEvidence.expires_at)) return 'EXECUTION_AUTHORITY_STALE';
    if (contextEvidence && (now >= Date.parse(contextEvidence.review_after)
      || now >= Date.parse(contextEvidence.expires_at)
      || now >= Date.parse(contextEvidence.authorization.expires_at))) {
      return 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED';
    }
    return undefined;
  }

  function assertContextBoundaryCurrent(action, request, executionEvidence, contextEvidence,
    signal, state, epochId, deadlineMonotonicMs) {
    const failure = currentAuthorityFailure(executionEvidence, action, signal, state)
      ?? currentContextUseFailure(contextEvidence, request, signal, state)
      ?? currentPermitTimeFailure(executionEvidence, contextEvidence, state)
      ?? hostBoundaryFailure(signal, epochId, deadlineMonotonicMs);
    if (failure) throw new OfflineOrchestrationError(failure);
  }

  async function requireContextBoundary(action, request, signal, state, epochId, deadlineMonotonicMs) {
    let failure = hostBoundaryFailure(signal, epochId, deadlineMonotonicMs);
    if (failure) throw new OfflineOrchestrationError(failure);
    const executionEvidence = await requireExecutionAuthority(action, signal, state);
    failure = currentAuthorityFailure(executionEvidence, action, signal, state)
      ?? hostBoundaryFailure(signal, epochId, deadlineMonotonicMs);
    if (failure) throw new OfflineOrchestrationError(failure);
    const contextEvidence = await requireContextUseAuthority(request, signal, state);
    assertContextBoundaryCurrent(action, request, executionEvidence, contextEvidence,
      signal, state, epochId, deadlineMonotonicMs);
    return { executionEvidence, contextEvidence };
  }

  function dispatchBoundaryFailure(evidence, action, signal, job, deadlineExpired, contextEvidence) {
    const before = safeClock(runtime);
    if (!before || before.epochId !== job.clockEpochId) return 'clock-unverifiable';
    if (deadlineExpired || before.now >= job.deadlineMonotonicMs) return 'time';
    if (signal?.aborted) return 'cancelled';
    const authorityFailure = currentAuthorityFailure(evidence, action, signal, job.authorityClock);
    if (authorityFailure) return 'authority';
    if (job.contextUseRequest) {
      const contextFailure = currentContextUseFailure(
        contextEvidence, job.contextUseRequest, signal, job.authorityClock
      );
      if (contextFailure) return 'authority';
    }
    if (currentPermitTimeFailure(evidence, contextEvidence, job.authorityClock)) return 'authority';
    if (job.resumeTimeBounds) {
      const resumeNow = sampleResumeTime(job.resumeTimeState);
      if (resumeNow === undefined) return 'resume-time-unverifiable';
      if (resumeNow < job.resumeTimeBounds.retryNotBeforeAtMs) return 'resume-delay';
      if (resumeNow >= job.resumeTimeBounds.deadlineAtMs) return 'resume-deadline';
    }
    const after = safeClock(runtime);
    if (!after || after.epochId !== job.clockEpochId) return 'clock-unverifiable';
    if (deadlineExpired || after.now >= job.deadlineMonotonicMs) return 'time';
    if (signal?.aborted) return 'cancelled';
    return undefined;
  }

  function markUnresolved(job, reason = 'reconciliation-required') {
    job.state = 'reconciliation-required';
    job.unresolvedReason = reason;
    job.closed = false;
    openJob = job;
    return freezeDeep({ kind: 'host-outcome', status: reason, job_id: job.jobId,
      ...(job.lastAttempt ? { attempt_id: job.lastAttempt.attemptId, execution_id: job.lastAttempt.executionId } : {}) });
  }

  function closeIfTerminal(job, reason = 'terminal') {
    const closed = event(job.jobId, 'job-closed', { reason });
    if (!appendConfirmed(store, job.jobId, closed)) return false;
    job.closed = true;
    job.state = 'terminal';
    if (openJob === job) openJob = undefined;
    return true;
  }

  function hostBudgetStop(job, reason, fields = {}) {
    const record = event(job.jobId, 'budget-exhausted', { reason, ...fields });
    if (!appendConfirmed(store, job.jobId, record)) return markUnresolved(job);
    if (!closeIfTerminal(job, `budget-${reason}`)) return markUnresolved(job);
    return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason, job_id: job.jobId });
  }

  function hostCancelStop(job, attemptId, reason = 'caller-cancelled') {
    const stopped = event(job.jobId, 'cancelled-before-dispatch', {
      ...(attemptId ? { attempt_id: attemptId } : {}), reason
    });
    if (!appendConfirmed(store, job.jobId, stopped)) return markUnresolved(job);
    if (!closeIfTerminal(job, 'cancelled-before-dispatch')) return markUnresolved(job);
    return freezeDeep({ kind: 'host-outcome', status: 'cancelled-before-dispatch', job_id: job.jobId });
  }

  function stableResult(result) {
    const source = canonicalJson(result);
    return { source, bytes: Buffer.from(source, 'utf8'), sha256: digest(Buffer.from(source, 'utf8')) };
  }

  function readBackBlob(key, bytes, expectedDigest) {
    let stored;
    try { stored = store.readImmutable(key); } catch { return false; }
    return stored !== UNKNOWN_STORE_STATE && sameBytes(stored, bytes, expectedDigest);
  }

  function persistResult(job, attempt, result, artifact) {
    const stable = stableResult(result);
    if (!job.ledger.charge(`result:${stable.sha256}`, stable.bytes.byteLength)) {
      return markUnresolved(job, 'budget-exhausted');
    }

    const resultPrepared = event(job.jobId, 'result-prepared', {
      attempt_id: attempt.attemptId,
      execution_id: attempt.executionId,
      result_id: result.result_id,
      status: result.status,
      result_byte_size: stable.bytes.byteLength,
      result_sha256: stable.sha256
    });
    if (!appendConfirmed(store, job.jobId, resultPrepared)) return markUnresolved(job);

    if (artifact && !writeConfirmedOnce(store, artifact.key, artifact.bytes)) {
      return markUnresolved(job, 'reconciliation-required');
    }
    if (artifact && !readBackBlob(artifact.key, artifact.bytes, artifact.sha256)) {
      return markUnresolved(job, 'reconciliation-required');
    }

    const persistEvent = event(job.jobId, 'persisting', {
      attempt_id: attempt.attemptId,
      execution_id: attempt.executionId,
      result_id: result.result_id,
      result_byte_size: stable.bytes.byteLength,
      result_sha256: stable.sha256
    });
    if (!appendConfirmed(store, job.jobId, persistEvent)) return markUnresolved(job);

    const resultKey = `result:${result.result_id}`;
    if (!writeConfirmedOnce(store, resultKey, stable.bytes)) return markUnresolved(job);
    if (!readBackBlob(resultKey, stable.bytes, stable.sha256)) return markUnresolved(job);

    const terminalEvent = event(job.jobId, 'terminal', {
      attempt_id: attempt.attemptId,
      execution_id: attempt.executionId,
      result_id: result.result_id,
      result_byte_size: stable.bytes.byteLength,
      result_sha256: stable.sha256
    });
    if (!appendConfirmed(store, job.jobId, terminalEvent)) return markUnresolved(job);

    attempt.terminalResult = result;
    const terminalClock = safeClock(runtime);
    attempt.completedMonotonicMs = terminalClock?.now;
    job.attempts.push(attempt);
    job.state = 'attempt-terminal';
    const isEligibleRetry = job.attempts.length === 1 && job.retryOpen && eligibleRateLimit(attempt.providerResult)
      && terminalClock?.epochId === job.clockEpochId && terminalClock.now < job.deadlineMonotonicMs;
    if (isEligibleRetry && installedResumeTimeAuthority && !job.contextEnabled
      && Number.isSafeInteger(job.resumeDeadlineAtMs)) {
      const checkedAt = sampleResumeTime(job.resumeTimeState);
      if (checkedAt !== undefined) {
        const retryNotBeforeAtMs = checkedAdd(checkedAt, attempt.providerResult.error.retry_after_ms);
        if (retryNotBeforeAtMs !== undefined) {
          const resumeWindow = event(job.jobId, 'resume-window', {
            attempt_id: attempt.attemptId,
            execution_id: attempt.executionId,
            terminal_result_id: result.result_id,
            checked_at_ms: checkedAt,
            retry_not_before_at_ms: retryNotBeforeAtMs,
            deadline_at_ms: job.resumeDeadlineAtMs
          });
          if (!appendConfirmed(store, job.jobId, resumeWindow)) return markUnresolved(job);
          job.resumeRetryNotBeforeAtMs = retryNotBeforeAtMs;
          job.resumeTimeBounds = {
            retryNotBeforeAtMs,
            deadlineAtMs: job.resumeDeadlineAtMs
          };
        }
      }
    }
    if (!isEligibleRetry || job.attempts.length >= OFFLINE_ORCHESTRATION_LIMITS.maxAttemptsPerJob) {
      if (!closeIfTerminal(job, isEligibleRetry ? 'attempt-limit-reached' : 'no-eligible-retry')) return markUnresolved(job);
    }
    else {
      job.state = 'retry-eligible';
      job.lastAttempt = attempt;
      openJob = job;
    }
    return freezeDeep({ kind: 'terminal', status: 'terminal', job_id: job.jobId,
      attempt_id: attempt.attemptId, execution_id: attempt.executionId,
      result, retry_eligible: isEligibleRetry });
  }

  function mapProviderResult(job, attempt, providerResult, correlationId) {
    attempt.providerResult = freezeDeep(JSON.parse(canonicalJson(providerResult)));
    const outcomeSource = canonicalJson(attempt.providerResult);
    const outcomeBytes = Buffer.from(outcomeSource, 'utf8');
    const outcomeSha = digest(outcomeBytes);
    const contentBytes = providerResult.output?.content === undefined
      ? undefined : Buffer.from(providerResult.output.content, 'utf8');
    const outcomeReservation = `outcome-reservation:${attempt.executionId}`;
    const outcomeIdentity = `provider-outcome:${outcomeSha}`;
    if (!job.ledger.commitReservation(outcomeReservation, outcomeIdentity, outcomeBytes.byteLength)) {
      return markUnresolved(job, 'budget-exhausted');
    }

    const outcomeKey = `provider-outcome:${attempt.executionId}`;
    if (!writeConfirmedOnce(store, outcomeKey, outcomeBytes)) return markUnresolved(job);
    const outcomeRecord = event(job.jobId, 'provider-outcome', {
      attempt_id: attempt.attemptId,
      execution_id: attempt.executionId,
      payload_key: outcomeKey,
      byte_size: outcomeBytes.byteLength,
      sha256: outcomeSha,
      status: providerResult.status
    });
    if (!appendConfirmed(store, job.jobId, outcomeRecord)) return markUnresolved(job);
    if (!readBackBlob(outcomeKey, outcomeBytes, outcomeSha)) return markUnresolved(job);

    if (job.clockUnverifiable) {
      const blocked = event(job.jobId, 'contract-mapping-blocked', {
        attempt_id: attempt.attemptId,
        execution_id: attempt.executionId,
        reason: 'deadline-unverifiable',
        provider_outcome_sha256: outcomeSha
      });
      if (!appendConfirmed(store, job.jobId, blocked)) return markUnresolved(job);
      job.attempts.push(attempt);
      return markUnresolved(job, 'deadline-unverifiable');
    }

    const blockComicMapping = reason => {
      const blocked = event(job.jobId, 'contract-mapping-blocked', {
        attempt_id: attempt.attemptId,
        execution_id: attempt.executionId,
        reason,
        provider_outcome_sha256: outcomeSha
      });
      if (!appendConfirmed(store, job.jobId, blocked)) return markUnresolved(job);
      job.attempts.push(attempt);
      job.state = 'contract-mapping-blocked';
      // A consumed retry with a confirmed outcome can exhaust the host job
      // without inventing a Comic result. Unconfirmed writes still reconcile.
      if (attempt.retryOfAttemptId && ['failed', 'cancelled', 'succeeded'].includes(providerResult.status)) {
        if (!closeIfTerminal(job, 'retry-contract-mapping-blocked')) return markUnresolved(job);
        return freezeDeep({ kind: 'host-outcome', status: 'contract-mapping-blocked',
          job_id: job.jobId, attempt_id: attempt.attemptId, execution_id: attempt.executionId,
          job_closed: true });
      }
      return markUnresolved(job, 'contract-mapping-blocked');
    };

    if (providerResult.status === 'timed-out') {
      const blocked = event(job.jobId, 'contract-mapping-blocked', {
        attempt_id: attempt.attemptId,
        execution_id: attempt.executionId,
        reason: 'provider-timeout-mapping-deferred',
        provider_outcome_sha256: outcomeSha
      });
      if (!appendConfirmed(store, job.jobId, blocked)) return markUnresolved(job);
      job.state = 'contract-mapping-blocked';
      job.attempts.push(attempt);
      return markUnresolved(job, 'contract-mapping-blocked');
    }

    let diagnostic;
    let artifactBytes;
    let artifact;
    if (providerResult.status === 'succeeded') {
      const output = providerResult.output;
      if (typeof output?.content !== 'string' || !contentBytes) {
        return markUnresolved(job, 'contract-mapping-blocked');
      }
      if (output.content !== job.production.value.renditions[0].transcript) {
        diagnostic = 'VALIDATION_FAILED';
      } else {
        artifactBytes = contentBytes;
        const requirement = job.production.value.renditions[0];
        if (artifactBytes.byteLength > requirement.max_bytes
          || artifactBytes.byteLength > OFFLINE_ORCHESTRATION_LIMITS.maxGeneratedArtifactBytesPerJob) {
          diagnostic = 'VALIDATION_FAILED';
          artifactBytes = undefined;
        }
      }
    } else if (providerResult.status === 'cancelled') {
      diagnostic = 'CANCELLED';
    } else if (providerResult.status === 'failed' && providerResult.error?.category === 'output-validation') {
      diagnostic = 'VALIDATION_FAILED';
    } else if (providerResult.status === 'failed' && providerResult.error?.category === 'rate-limit') {
      diagnostic = 'OUTPUT_MISSING';
    } else {
      return blockComicMapping('unsupported-normalized-result-mapping');
    }

    // Only explicit candidate support plus protected no-action rate-limit proof
    // permits the truthful no-output form. Stable v1 and other outcomes stay blocked.
    const noOutput = job.noOutputResultVersion === '1.1.0' && eligibleRateLimit(providerResult);
    if (!artifactBytes && !noOutput && job.production.value.classification !== 'public') {
      return blockComicMapping('no-output-result-not-representable-under-current-validator');
    }

    if (artifactBytes) {
      const artifactDigest = digest(artifactBytes);
      const artifactReservation = `artifact-reservation:${attempt.executionId}`;
      if (!job.ledger.commitReservation(artifactReservation, `artifact:${artifactDigest}`, artifactBytes.byteLength, { artifact: true })) {
        return markUnresolved(job, 'budget-exhausted');
      }
      const artifactId = idFrom(idFactory, usedIds, 'resource');
      artifact = { key: `artifact:${artifactId}`, bytes: artifactBytes, sha256: artifactDigest, uri: artifactId };
      attempt.artifact = artifact;
    } else {
      job.ledger.release(`artifact-reservation:${attempt.executionId}`, { artifact: true });
    }

    const resultId = idFrom(idFactory, usedIds, 'resource');
    const result = buildComicResult({
      production: job.production.value,
      productionReference: job.production.reference,
      attemptId: attempt.attemptId,
      resultId,
      providerResult,
      diagnostic,
      artifactUri: artifact?.uri,
      artifactBytes: artifact?.bytes,
      noOutput
    });
    const resultSource = canonicalJson(result);
    const validation = noOutput
      ? validateComicBuildResultCandidate(resultSource, job.production.canonical) : validateComicManifest(resultSource);
    const compatible = noOutput ? validation : validateComicOutputCompatibility(job.production.canonical, resultSource);
    if (!validation.valid || !compatible.valid) {
      return blockComicMapping('comic-result-validation-rejected');
    }

    attempt.resultId = resultId;
    attempt.providerCorrelationId = correlationId;
    job.retryOpen = eligibleRateLimit(providerResult);
    const terminal = persistResult(job, attempt, result, artifact);
    if (terminal.kind === 'terminal' && job.retryOpen && job.state === 'retry-eligible') {
      // Keep the exact original retry boundary in the job; no other attempt can start.
      job.retryNotBefore = checkedAdd(attempt.completedMonotonicMs,
        providerResult.error.retry_after_ms);
    }
    return terminal;
  }

  function verifyRetryEvidence(job, prior) {
    if (!prior?.terminalResult || !eligibleRateLimit(prior.providerResult)) return false;
    const result = stableResult(prior.terminalResult);
    const outcome = stableResult(prior.providerResult);
    const readPinned = (key, bytes, sha) => {
      try {
        job.resumeBoundary?.();
        const valid = readBackBlob(key, bytes, sha);
        job.resumeBoundary?.();
        return valid;
      } catch { return false; }
    };
    if (!validateComicBuildResultCandidate(result.source, job.production.canonical).valid
      || !readPinned(`input:${job.jobId}`, Buffer.from(job.production.canonical), job.production.identity.sha256)
      || !readPinned(`prompt:${job.jobId}`, job.promptBytes, job.renderedPrompt.sha256)
      || !readPinned(`result:${prior.resultId}`, result.bytes, result.sha256)
      || !readPinned(`provider-outcome:${prior.executionId}`, outcome.bytes, outcome.sha256)) return false;
    let entries;
    try { entries = store.readEvents(job.jobId); } catch { return false; }
    if (!Array.isArray(entries) || entries.some(e => ['job-closed', 'contract-mapping-blocked'].includes(e.type))) return false;
    const terminals = entries.filter(e => e.type === 'terminal' && e.attempt_id === prior.attemptId);
    const outcomes = entries.filter(e => e.type === 'provider-outcome' && e.attempt_id === prior.attemptId);
    return terminals.length === 1 && outcomes.length === 1
      && terminals[0].execution_id === prior.executionId && terminals[0].result_id === prior.resultId
      && terminals[0].result_sha256 === result.sha256 && terminals[0].result_byte_size === result.bytes.length
      && outcomes[0].execution_id === prior.executionId && outcomes[0].sha256 === outcome.sha256
      && outcomes[0].byte_size === outcome.bytes.length
      && outcomes[0].payload_key === `provider-outcome:${prior.executionId}`;
  }

  async function performAttempt(job, { correlationId, mockOutcome, signal, retryOfAttemptId, preflight,
    authorizationAction = 'execute' } = {}) {
    const priorAttempt = retryOfAttemptId ? job.lastAttempt : undefined;
    const useRequest = job.contextEnabled ? contextUseRequest(job.production, authorizationAction) : undefined;
    let contextEvidence = job.contextUseEvidence;
    if (useRequest) job.contextUseRequest = useRequest;
    const cancellation = cancellationSignal(signal);
    const now = safeClock(runtime);
    if (!now || now.epochId !== job.clockEpochId) return markUnresolved(job, 'deadline-unverifiable');
    if (now.now >= job.deadlineMonotonicMs) {
      return hostBudgetStop(job, 'time', {
        deadline_monotonic_ms: job.deadlineMonotonicMs,
        ...(job.lastAttempt ? { attempt_id: job.lastAttempt.attemptId } : {})
      });
    }
    if (cancellation?.aborted) {
      return hostCancelStop(job, job.lastAttempt?.attemptId);
    }

    let mock = preflight?.mock;
    let descriptor = preflight?.descriptor;
    try {
      if (!mock) {
        const configuration = mockConfiguration(mockOutcome, job.production.value.renditions[0]);
        mock = mockAdapterFactory(configuration);
        if (!(mock instanceof MockTextAdapter)) throw new TypeError();
        descriptor = await mock.describe();
      }
    } catch (error) {
      if (error instanceof OfflineOrchestrationError) throw error;
      throw new OfflineOrchestrationError('INVALID_MOCK_ADAPTER');
    }
    if (!(mock instanceof MockTextAdapter) || !validateExecutionDocument(descriptor).valid) {
      throw new OfflineOrchestrationError('MOCK_ADAPTER_REQUIRED');
    }
    const normalizedCorrelationId = safeCorrelationId(correlationId);
    const preflightRequest = createRequest(job.renderedPrompt, {
      executionId: 'exec-offline-preflight',
      idempotencyKey: 'idem-offline-preflight',
      correlationId: normalizedCorrelationId
    });
    if (!validateExecutionCompatibility(preflightRequest, descriptor).valid) {
      throw new OfflineOrchestrationError('MOCK_COMPATIBILITY_FAILED');
    }
    const capability = descriptor.capabilities.find(item => item.name === 'text-generation');
    const descriptorInputLimit = capability?.limits?.max_input_bytes;
    const promptLimit = Math.min(OFFLINE_ORCHESTRATION_LIMITS.maxPromptBytesPerAttempt,
      Number.isSafeInteger(descriptorInputLimit) ? descriptorInputLimit : Number.MAX_SAFE_INTEGER);
    if (job.renderedPrompt.byteSize > promptLimit) {
      return hostBudgetStop(job, 'prompt');
    }

    const attemptId = idFrom(idFactory, usedIds, 'resource');
    const executionId = idFrom(idFactory, usedIds, 'execution');
    const request = createRequest(job.renderedPrompt, {
      executionId,
      idempotencyKey: `idem-${executionId}`,
      correlationId: normalizedCorrelationId
    });
    if (!validateExecutionDocument(request).valid) throw new OfflineOrchestrationError('INVALID_EXECUTION_REQUEST');

    const outcomeReservation = `outcome-reservation:${executionId}`;
    const artifactReservation = `artifact-reservation:${executionId}`;
    const outputReserve = OFFLINE_ORCHESTRATION_LIMITS.maxNormalizedOutputBytesPerCall
      + NORMALIZED_OUTCOME_ENVELOPE_RESERVE_BYTES;
    const declaredArtifactReserve = job.production.value.renditions.reduce((sum, rendition) => {
      const next = checkedAdd(sum, rendition.max_bytes);
      return next ?? Number.MAX_SAFE_INTEGER;
    }, 0);
    if (declaredArtifactReserve > OFFLINE_ORCHESTRATION_LIMITS.maxGeneratedArtifactBytesPerJob
      || !job.ledger.reserve(outcomeReservation, outputReserve)) {
      return hostBudgetStop(job, 'material');
    }
    if (!job.ledger.reserve(artifactReservation, declaredArtifactReserve, { artifact: true })) {
      job.ledger.release(outcomeReservation);
      return hostBudgetStop(job, 'material');
    }

    const prepared = event(job.jobId, 'prepared', {
      attempt_id: attemptId,
      execution_id: executionId,
      retry_of_attempt_id: retryOfAttemptId ?? null,
      production: job.production.reference,
      reservation: {
        prompt_bytes: job.promptBytes.byteLength,
        normalized_output_bytes: outputReserve,
        artifact_bytes: declaredArtifactReserve
      }
    });
    if (!appendConfirmed(store, job.jobId, prepared)) return markUnresolved(job);

    const attempt = { attemptId, executionId, retryOfAttemptId, state: 'prepared' };
    job.lastAttempt = attempt;
    job.state = 'prepared';
    if (onMockCall) onMockCall({ phase: 'created', attemptId, executionId, mock });

    const controller = new AbortController();
    let timer;
    let dispatchBlocked = false;
    let dispatchBlockReason;
    let dispatchConfirmed = false;
    let cancelListener;
    let deadlineExpired = false;
    if (cancellation) {
      cancelListener = () => controller.abort(cancellation.reason);
      cancellation.addEventListener('abort', cancelListener, { once: true });
      if (cancellation.aborted) controller.abort(cancellation.reason);
    }
    const preCallClock = safeClock(runtime);
    if (!preCallClock || preCallClock.epochId !== job.clockEpochId) {
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      if (cancelListener) cancellation.removeEventListener('abort', cancelListener);
      return markUnresolved(job, 'deadline-unverifiable');
    }
    if (preCallClock.now >= job.deadlineMonotonicMs) {
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      if (cancelListener) cancellation.removeEventListener('abort', cancelListener);
      return hostBudgetStop(job, 'time', {
        attempt_id: attemptId, execution_id: executionId, deadline_monotonic_ms: job.deadlineMonotonicMs
      });
    }
    if (cancellation?.aborted) {
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      if (cancelListener) cancellation.removeEventListener('abort', cancelListener);
      return hostCancelStop(job, attemptId);
    }
    const remainingMs = Math.max(1, job.deadlineMonotonicMs - (preCallClock?.now ?? job.deadlineMonotonicMs));
    try {
      timer = runtime.setTimer(() => {
        deadlineExpired = true;
        controller.abort(new Error('host-deadline'));
      }, Math.min(remainingMs, MAX_TIMER_DELAY_MS));
    } catch {
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      if (cancelListener) cancellation.removeEventListener('abort', cancelListener);
      return markUnresolved(job, 'deadline-unverifiable');
    }

    const adapter = Object.freeze({
      describe: async () => descriptor,
      execute: async (effectiveRequest, { signal: sdkSignal } = {}) => {
        const current = safeClock(runtime);
        if (!current || current.epochId !== job.clockEpochId) {
          dispatchBlocked = true;
          dispatchBlockReason = 'clock-unverifiable';
          throw new AdapterExecutionError({ category: 'internal', code: 'OFFLINE_CLOCK_UNAVAILABLE',
            message: 'The offline host clock is unavailable.', retryable: false, stage: 'preflight' });
        }
        if (current.now >= job.deadlineMonotonicMs) {
          dispatchBlocked = true;
          dispatchBlockReason = 'time';
          throw new AdapterExecutionError({ category: 'cancelled', code: 'EXECUTION_CANCELLED',
            message: 'The offline attempt deadline expired before dispatch.', retryable: false, stage: 'preflight' });
        }
        if (cancellation?.aborted) {
          dispatchBlocked = true;
          dispatchBlockReason = 'cancelled';
          throw new AdapterExecutionError({ category: 'cancelled', code: 'EXECUTION_CANCELLED',
            message: 'The offline attempt was cancelled before dispatch.', retryable: false, stage: 'preflight' });
        }
        let authorityEvidence;
        try {
          if (useRequest) {
            const current = await requireContextBoundary(authorizationAction, useRequest, controller.signal,
              job.authorityClock, job.clockEpochId, job.deadlineMonotonicMs);
            authorityEvidence = current.executionEvidence;
            contextEvidence = current.contextEvidence;
          } else {
            authorityEvidence = await requireExecutionAuthority(
              authorizationAction, controller.signal, job.authorityClock
            );
          }
        } catch {
          dispatchBlocked = true;
          const afterAuthority = safeClock(runtime);
          dispatchBlockReason = !afterAuthority || afterAuthority.epochId !== job.clockEpochId
            ? 'clock-unverifiable'
            : deadlineExpired || afterAuthority.now >= job.deadlineMonotonicMs ? 'time'
              : controller.signal.aborted ? 'cancelled' : 'authority';
          throw new AdapterExecutionError({ category: 'internal', code: 'EXECUTION_AUTHORITY_DENIED',
            message: 'Current synthetic execution authority could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        const authorityBoundary = dispatchBoundaryFailure(
          authorityEvidence, authorizationAction, controller.signal, job, deadlineExpired, contextEvidence
        );
        if (authorityBoundary) {
          dispatchBlocked = true;
          dispatchBlockReason = authorityBoundary;
          throw new AdapterExecutionError({ category: 'internal', code: 'EXECUTION_AUTHORITY_DENIED',
            message: 'Current synthetic execution authority could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        if (priorAttempt && !verifyRetryEvidence(job, priorAttempt)) {
          dispatchBlocked = true;
          dispatchBlockReason = 'retry-evidence-unconfirmed';
          throw new AdapterExecutionError({ category: 'internal', code: 'RETRY_EVIDENCE_UNCONFIRMED',
            message: 'Prior immutable retry evidence could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        const dispatch = event(job.jobId, 'dispatch-started', {
          attempt_id: attemptId, execution_id: executionId, call_number: 1
        });
        if (!appendConfirmed(store, job.jobId, dispatch)) {
          dispatchBlocked = true;
          dispatchBlockReason = 'dispatch-marker-unconfirmed';
          throw new AdapterExecutionError({ category: 'internal', code: 'DISPATCH_MARKER_UNCONFIRMED',
            message: 'The offline dispatch marker could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        dispatchConfirmed = true;
        attempt.state = 'dispatch-started';
        if (onMockCall) onMockCall({ phase: 'dispatch-confirmed', attemptId, executionId, mock });
        // Test observers and store implementations are synchronous extension
        // points; recheck after them so the final awaited check precedes call.
        let finalAuthorityEvidence;
        try {
          if (useRequest) {
            const current = await requireContextBoundary(authorizationAction, useRequest, controller.signal,
              job.authorityClock, job.clockEpochId, job.deadlineMonotonicMs);
            finalAuthorityEvidence = current.executionEvidence;
            contextEvidence = current.contextEvidence;
          } else {
            finalAuthorityEvidence = await requireExecutionAuthority(
              authorizationAction, controller.signal, job.authorityClock
            );
          }
        } catch {
          dispatchBlocked = true;
          const afterAuthority = safeClock(runtime);
          dispatchBlockReason = !afterAuthority || afterAuthority.epochId !== job.clockEpochId
            ? 'clock-unverifiable'
            : deadlineExpired || afterAuthority.now >= job.deadlineMonotonicMs ? 'time'
              : controller.signal.aborted ? 'cancelled' : 'authority';
          throw new AdapterExecutionError({ category: 'internal', code: 'EXECUTION_AUTHORITY_DENIED',
            message: 'Current synthetic execution authority could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        const finalAuthorityBoundary = dispatchBoundaryFailure(
          finalAuthorityEvidence, authorizationAction, controller.signal, job, deadlineExpired, contextEvidence
        );
        if (finalAuthorityBoundary) {
          dispatchBlocked = true;
          dispatchBlockReason = finalAuthorityBoundary;
          throw new AdapterExecutionError({ category: 'internal', code: 'EXECUTION_AUTHORITY_DENIED',
            message: 'Current synthetic execution authority could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        // The final authority await may have made immutable retry evidence
        // ambiguous. Revalidate the same pinned evidence once more at the
        // boundary, then perform only synchronous checks before mock.execute.
        if (priorAttempt && !verifyRetryEvidence(job, priorAttempt)) {
          dispatchBlocked = true;
          dispatchBlockReason = 'retry-evidence-unconfirmed';
          throw new AdapterExecutionError({ category: 'internal', code: 'RETRY_EVIDENCE_UNCONFIRMED',
            message: 'Prior immutable retry evidence could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        const finalSynchronousBoundary = dispatchBoundaryFailure(
          finalAuthorityEvidence, authorizationAction, controller.signal, job, deadlineExpired, contextEvidence
        );
        if (finalSynchronousBoundary) {
          dispatchBlocked = true;
          dispatchBlockReason = finalSynchronousBoundary;
          throw new AdapterExecutionError({ category: 'internal', code: 'EXECUTION_AUTHORITY_DENIED',
            message: 'Current synthetic execution authority could not be confirmed.', retryable: false, stage: 'preflight' });
        }
        // The marker is durable in the prototype store before this sole mock call.
        const outcome = await mock.execute(effectiveRequest, { signal: sdkSignal ?? controller.signal });
        if (typeof outcome?.content === 'string') {
          assertAtMost(Buffer.byteLength(outcome.content, 'utf8'),
            OFFLINE_ORCHESTRATION_LIMITS.maxNormalizedOutputBytesPerCall, 'NORMALIZED_OUTPUT_LIMIT_EXCEEDED');
        }
        return outcome;
      }
    });

    const cleanupExecutionWatchers = () => {
      try { runtime.clearTimer(timer); } catch { /* best-effort cleanup must not skip listener removal */ }
      if (cancelListener) {
        try { cancellation.removeEventListener('abort', cancelListener); } catch { /* fail closed below */ }
      }
    };
    let wallStart;
    try {
      wallStart = authorityClock(job.authorityClock, 'WALL_CLOCK_UNVERIFIABLE');
    } catch {
      cleanupExecutionWatchers();
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      return markUnresolved(job, 'deadline-unverifiable');
    }
    if (!Number.isSafeInteger(wallStart) || !Number.isFinite(new Date(wallStart).getTime())) {
      cleanupExecutionWatchers();
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      return markUnresolved(job, 'deadline-unverifiable');
    }
    const executionWallClock = () => authorityClock(job.authorityClock, 'WALL_CLOCK_UNVERIFIABLE');
    let providerResult;
    try {
      providerResult = await executePrompt(request, {
        adapter,
        signal: controller.signal,
        // Provider Execution's own timeout_ms remains independent and is omitted here.
        clock: executionWallClock
      });
    } catch {
      return markUnresolved(job, dispatchBlocked ? 'reconciliation-required' : 'contract-mapping-blocked');
    } finally {
      cleanupExecutionWatchers();
    }

    if (dispatchBlocked) {
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      if (dispatchBlockReason === 'time') {
        return hostBudgetStop(job, 'time', {
          attempt_id: attemptId, execution_id: executionId, deadline_monotonic_ms: job.deadlineMonotonicMs
        });
      }
      if (dispatchBlockReason === 'cancelled') return hostCancelStop(job, attemptId);
      if (dispatchBlockReason === 'clock-unverifiable') return markUnresolved(job, 'deadline-unverifiable');
      if (dispatchBlockReason === 'authority') {
        const denied = event(job.jobId, 'authorization-blocked', {
          attempt_id: attemptId, execution_id: executionId, action: authorizationAction
        });
        if (!appendConfirmed(store, job.jobId, denied) || !closeIfTerminal(job, 'execution-authority-denied')) {
          return markUnresolved(job);
        }
        return freezeDeep({ kind: 'host-outcome', status: 'authorization-denied', job_id: job.jobId });
      }
      return markUnresolved(job);
    }
    if (!dispatchConfirmed && providerResult.status === 'cancelled') {
      job.ledger.release(outcomeReservation);
      job.ledger.release(artifactReservation, { artifact: true });
      const clockAtStop = safeClock(runtime);
      const timedOutBeforeDispatch = deadlineExpired || !clockAtStop
        || clockAtStop.epochId !== job.clockEpochId || clockAtStop.now >= job.deadlineMonotonicMs;
      const stopped = event(job.jobId, timedOutBeforeDispatch ? 'budget-exhausted' : 'cancelled-before-dispatch', {
        reason: timedOutBeforeDispatch ? 'time' : 'caller-cancelled', deadline_monotonic_ms: job.deadlineMonotonicMs
      });
      if (!appendConfirmed(store, job.jobId, stopped)) return markUnresolved(job);
      if (!closeIfTerminal(job, timedOutBeforeDispatch ? 'time-budget-exhausted-before-dispatch' : 'cancelled-before-dispatch')) {
        return markUnresolved(job);
      }
      return freezeDeep({ kind: 'host-outcome',
        status: timedOutBeforeDispatch ? 'budget-exhausted' : 'cancelled-before-dispatch',
        job_id: job.jobId });
    }
    if (!dispatchConfirmed) return markUnresolved(job, 'reconciliation-required');

    attempt.state = 'outcome-returned';
    const settledClock = safeClock(runtime);
    if (!settledClock || settledClock.epochId !== job.clockEpochId) job.clockUnverifiable = true;
    if (deadlineExpired || (settledClock && settledClock.now >= job.deadlineMonotonicMs)) {
      const budgetEvent = event(job.jobId, 'budget-exhausted', {
        reason: 'time', attempt_id: attemptId, execution_id: executionId,
        deadline_monotonic_ms: job.deadlineMonotonicMs
      });
      if (!appendConfirmed(store, job.jobId, budgetEvent)) return markUnresolved(job);
      job.state = 'budget-exhausted';
    }
    return mapProviderResult(job, attempt, providerResult, normalizedCorrelationId);
  }

  async function submit(options = {}) {
    const { productionSource, correlation_id: correlationIdInput, signal, mockOutcome, noOutputResultVersion,
      syntheticContext } = optionValues(
      options, new Set(['productionSource', 'correlation_id', 'signal', 'mockOutcome', 'noOutputResultVersion', 'syntheticContext']), 'INVALID_SUBMIT_OPTIONS'
    );
    if (syntheticContext !== undefined && typeof syntheticContext !== 'boolean') {
      throw new OfflineOrchestrationError('INVALID_SUBMIT_OPTIONS');
    }
    if (syntheticContext === true && !syntheticContextReaders) {
      throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE');
    }
    if (noOutputResultVersion !== undefined && noOutputResultVersion !== '1.1.0') {
      throw new OfflineOrchestrationError('UNSUPPORTED_RESULT_VERSION');
    }
    if (running) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    if (openJob && !openJob.closed) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    let storedJobIds;
    try { storedJobIds = store.readJobIds(); } catch { throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED'); }
    if (!Array.isArray(storedJobIds)) throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED');
    let lifetimeSlotConsumed = false;
    for (const jobId of storedJobIds) {
      let entries;
      try { entries = store.readEvents(jobId); } catch { throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED'); }
      if (entries === UNKNOWN_STORE_STATE || !Array.isArray(entries)) {
        throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED');
      }
      if (entries.length === 0) {
        // Material from an interrupted admission cannot be safely reclaimed.
        throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED');
      }
      const admittedCount = entries.filter(item => item.type === 'admitted').length;
      if (admittedCount !== 1 || !entries.some(item => item.type === 'job-closed')) {
        throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
      }
      lifetimeSlotConsumed = true;
    }
    if (lifetimeSlotConsumed) throw new OfflineOrchestrationError('JOB_STORE_LIFETIME_LIMIT');
    running = true;
    let slotToken;
    let jobId;
    let job;
    try {
      const cancellation = cancellationSignal(signal);
      if (cancellation?.aborted) return freezeDeep({ kind: 'host-outcome', status: 'cancelled-before-admission' });
      const correlationId = safeCorrelationId(correlationIdInput);
      const authorityClockState = { lastMs: undefined };
      const initialAuthority = await requireExecutionAuthority('execute', cancellation, authorityClockState);
      const initialAuthorityFailure = currentAuthorityFailure(
        initialAuthority, 'execute', cancellation, authorityClockState
      );
      if (initialAuthorityFailure) throw new OfflineOrchestrationError(initialAuthorityFailure);
      if (cancellation?.aborted) return freezeDeep({ kind: 'host-outcome', status: 'cancelled-before-admission' });
      const production = readProduction(productionSource);
      let initialClock;
      let deadlineMonotonicMs;
      let resumeTimeStartedAtMs;
      let resumeDeadlineAtMs;
      let contextInput;
      let contextRequest;
      if (syntheticContext === true) {
        initialClock = safeClock(runtime);
        if (!initialClock) return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
        deadlineMonotonicMs = checkedAdd(initialClock.now, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
        if (deadlineMonotonicMs === undefined) return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
        contextRequest = contextUseRequest(production, 'execute');
        if (!contextRequest) throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_INPUT_INVALID');
        contextInput = await loadSyntheticContextInput({
          production,
          readers: installedContextReaders,
          signal: cancellation,
          authorize: async () => {
            const current = await requireContextBoundary('execute', contextRequest, cancellation,
              authorityClockState, initialClock.epochId, deadlineMonotonicMs);
            const assertCurrent = () => {
              assertContextBoundaryCurrent('execute', contextRequest, current.executionEvidence,
                current.contextEvidence, cancellation, authorityClockState, initialClock.epochId, deadlineMonotonicMs);
            };
            return { request: contextRequest, evidence: current.contextEvidence,
              authorization: current.contextEvidence.authorization,
              at: current.contextEvidence.revocation.checked_at, assertCurrent };
          }
        });
        contextInput.assertCurrent();
      }
      const renderedPrompt = contextInput?.renderedPrompt ?? renderOfflineComicPrompt(production.value);
      assertAtMost(renderedPrompt.byteSize, OFFLINE_ORCHESTRATION_LIMITS.maxPromptBytesPerAttempt, 'PROMPT_LIMIT_EXCEEDED');
      initialClock ??= safeClock(runtime);
      if (!initialClock) return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
      deadlineMonotonicMs ??= checkedAdd(initialClock.now, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
      if (deadlineMonotonicMs === undefined) return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
      if (installedResumeTimeAuthority) {
        resumeTimeStartedAtMs = sampleResumeTime(resumeTimeState);
        resumeDeadlineAtMs = resumeTimeStartedAtMs === undefined ? undefined
          : checkedAdd(resumeTimeStartedAtMs, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
        if (resumeDeadlineAtMs === undefined) {
          return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
        }
      }

      const ledger = new MaterialLedger();
      const productionBytes = Buffer.from(production.canonical, 'utf8');
      const promptBytes = Buffer.from(renderedPrompt.canonical, 'utf8');
      if (!ledger.charge(`input:${production.identity.sha256}`, productionBytes.byteLength)
        || !ledger.charge(`prompt:${renderedPrompt.sha256}`, promptBytes.byteLength)) {
        return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason: 'material' });
      }
      // Validate a representative request and the mock descriptor before allocating host IDs.
      const preflightRequest = createRequest(renderedPrompt, {
        executionId: 'exec-offline-preflight', idempotencyKey: 'idem-offline-preflight', correlationId
      });
      if (!validateExecutionDocument(preflightRequest).valid) throw new OfflineOrchestrationError('INVALID_EXECUTION_REQUEST');
      const preflightMock = mockAdapterFactory(mockConfiguration(mockOutcome, production.value.renditions[0]));
      if (!(preflightMock instanceof MockTextAdapter)) throw new OfflineOrchestrationError('MOCK_ADAPTER_REQUIRED');
      const descriptor = await preflightMock.describe();
      if (!validateExecutionDocument(descriptor).valid) throw new OfflineOrchestrationError('INVALID_MOCK_DESCRIPTOR');
      const preflightCompatibility = validateExecutionCompatibility(preflightRequest, descriptor);
      if (!preflightCompatibility.valid) throw new OfflineOrchestrationError('MOCK_COMPATIBILITY_FAILED');
      const textCapability = descriptor.capabilities.find(item => item.name === 'text-generation');
      const descriptorInputLimit = textCapability?.limits?.max_input_bytes;
      const promptLimit = Math.min(OFFLINE_ORCHESTRATION_LIMITS.maxPromptBytesPerAttempt,
        Number.isSafeInteger(descriptorInputLimit) ? descriptorInputLimit : Number.MAX_SAFE_INTEGER);
      if (renderedPrompt.byteSize > promptLimit) {
        return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason: 'prompt' });
      }

      // Preflight may await adapter description. Recheck host controls before
      // allocating a job or writing any lifecycle/material records.
      if (cancellation?.aborted) {
        return freezeDeep({ kind: 'host-outcome', status: 'cancelled-before-admission' });
      }
      const postPreflightClock = safeClock(runtime);
      if (!postPreflightClock || postPreflightClock.epochId !== initialClock.epochId) {
        return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
      }
      if (postPreflightClock.now >= deadlineMonotonicMs) {
        return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason: 'time-before-admission' });
      }
      let postPreflightAuthority;
      let contextUseEvidence;
      if (contextRequest) {
        const current = await requireContextBoundary('execute', contextRequest, cancellation, authorityClockState,
          initialClock.epochId, deadlineMonotonicMs);
        postPreflightAuthority = current.executionEvidence;
        contextUseEvidence = current.contextEvidence;
        assertContextBoundaryCurrent('execute', contextRequest, postPreflightAuthority, contextUseEvidence,
          cancellation, authorityClockState, initialClock.epochId, deadlineMonotonicMs);
      } else {
        postPreflightAuthority = await requireExecutionAuthority('execute', cancellation, authorityClockState);
        const postPreflightAuthorityFailure = currentAuthorityFailure(
          postPreflightAuthority, 'execute', cancellation, authorityClockState
        );
        if (postPreflightAuthorityFailure) throw new OfflineOrchestrationError(postPreflightAuthorityFailure);
      }
      if (cancellation?.aborted) return freezeDeep({ kind: 'host-outcome', status: 'cancelled-before-admission' });
      const postAuthorityClock = safeClock(runtime);
      if (!postAuthorityClock || postAuthorityClock.epochId !== initialClock.epochId) {
        return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
      }
      if (postAuthorityClock.now >= deadlineMonotonicMs) {
        return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason: 'time-before-admission' });
      }
      if (installedResumeTimeAuthority) {
        const postPreflightResumeTime = sampleResumeTime(resumeTimeState);
        if (postPreflightResumeTime === undefined) {
          return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
        }
        if (postPreflightResumeTime >= resumeDeadlineAtMs) {
          return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason: 'time-before-admission' });
        }
      }

      const slotReservation = store.reserveJobSlot();
      if (slotReservation === 'reserved') throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
      if (slotReservation === 'consumed') throw new OfflineOrchestrationError('JOB_STORE_LIFETIME_LIMIT');
      if (!slotReservation || slotReservation.status !== 'acquired') {
        throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED');
      }
      slotToken = slotReservation.token;

      jobId = idFrom(idFactory, usedIds, 'resource');
      job = {
        jobId,
        production,
        noOutputResultVersion,
        contextEnabled: contextRequest !== undefined,
        contextUseRequest: contextRequest,
        contextUseEvidence,
        renderedPrompt,
        promptBytes,
        ledger,
        clockEpochId: initialClock.epochId,
        admittedMonotonicMs: initialClock.now,
        deadlineMonotonicMs,
        authorityClock: authorityClockState,
        resumeTimeState,
        resumeTimeStartedAtMs,
        resumeDeadlineAtMs,
        attempts: [],
        retryOpen: false,
        retryNotBefore: undefined,
        state: 'admitting',
        closed: false
      };
      openJob = job;

      const inputKey = `input:${jobId}`;
      if (!writeConfirmedOnce(store, inputKey, productionBytes)
        || !readBackBlob(inputKey, productionBytes, production.identity.sha256)) {
        const present = storedJobPresence(store, jobId);
        if (present === false) throw new OfflineOrchestrationError('ADMISSION_FAILED');
        if (present === true && store.commitJobSlot(slotToken)) slotToken = undefined;
        else if (present === undefined) slotToken = undefined;
        return markUnresolved(job);
      }
      if (!store.commitJobSlot(slotToken)) return markUnresolved(job);
      slotToken = undefined;
      const promptKey = `prompt:${jobId}`;
      if (!writeConfirmedOnce(store, promptKey, promptBytes)
        || !readBackBlob(promptKey, promptBytes, renderedPrompt.sha256)) {
        return markUnresolved(job);
      }
      const admitted = event(jobId, 'admitted', {
        production: production.reference,
        no_output_result_version: noOutputResultVersion ?? null,
        input_key: inputKey,
        input_byte_size: productionBytes.byteLength,
        input_sha256: production.identity.sha256,
        prompt_key: promptKey,
        prompt_byte_size: promptBytes.byteLength,
        prompt_sha256: renderedPrompt.sha256,
        admitted_monotonic_ms: initialClock.now,
        clock_epoch_id: initialClock.epochId,
        deadline_monotonic_ms: deadlineMonotonicMs,
        ...(installedResumeTimeAuthority ? { resume_time: {
          authority_id: installedResumeTimeAuthority.id,
          domain_id: installedResumeTimeAuthority.domain_id,
          epoch_id: installedResumeTimeAuthority.epoch_id,
          started_at_ms: resumeTimeStartedAtMs,
          deadline_at_ms: resumeDeadlineAtMs,
          context_enabled: job.contextEnabled
        } } : {}),
        limits: OFFLINE_ORCHESTRATION_LIMITS,
        material: ledger.snapshot
      });
      if (!appendConfirmed(store, jobId, admitted)) return markUnresolved(job);
      job.state = 'admitted';
      // Reuse the exact preflighted MockTextAdapter instance and descriptor.
      return await performAttempt(job, { correlationId, mockOutcome, signal, preflight: { mock: preflightMock, descriptor } });
    } catch (error) {
      if (slotToken) {
        const present = jobId === undefined ? false : storedJobPresence(store, jobId);
        if (present === false) {
          store.releaseUnusedJobSlot(slotToken);
          if (job && openJob === job) openJob = undefined;
        } else {
          if (present === true) store.commitJobSlot(slotToken);
          if (job && openJob === job) return markUnresolved(job);
        }
      }
      if (error instanceof OfflineOrchestrationError) throw error;
      const safeContextErrors = new Set([
        'SYNTHETIC_CONTEXT_INPUT_INVALID', 'EXECUTION_AUTHORITY_DENIED', 'EXECUTION_AUTHORITY_UNAVAILABLE',
        'EXECUTION_AUTHORITY_STALE', 'EXECUTION_DEADLINE_EXPIRED', 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED',
        'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE'
      ]);
      if (safeContextErrors.has(error?.message)) throw new OfflineOrchestrationError(error.message);
      throw new OfflineOrchestrationError('OFFLINE_ORCHESTRATION_FAILED');
    } finally {
      running = false;
    }
  }

  async function retry(options = {}) {
    const { authorizeRetry, signal, mockOutcome } = optionValues(
      options, new Set(['authorizeRetry', 'signal', 'mockOutcome']), 'INVALID_RETRY_OPTIONS'
    );
    if (running) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    const job = openJob;
    if (!job || job.closed || job.state !== 'retry-eligible') {
      throw new OfflineOrchestrationError('RETRY_NOT_AVAILABLE');
    }
    if (authorizeRetry !== true) throw new OfflineOrchestrationError('EXPLICIT_RETRY_AUTHORIZATION_REQUIRED');
    const cancellation = cancellationSignal(signal);
    if (cancellation?.aborted) throw new OfflineOrchestrationError('RETRY_CANCELLED');
    running = true;
    try {
      const retryAuthority = await requireExecutionAuthority('retry', cancellation, job.authorityClock);
      const retryAuthorityFailure = currentAuthorityFailure(
        retryAuthority, 'retry', cancellation, job.authorityClock
      );
      if (retryAuthorityFailure) throw new OfflineOrchestrationError(retryAuthorityFailure);
      if (cancellation?.aborted) throw new OfflineOrchestrationError('RETRY_CANCELLED');
      const clock = safeClock(runtime);
      if (!clock || clock.epochId !== job.clockEpochId) return markUnresolved(job, 'deadline-unverifiable');
      if (clock.now >= job.deadlineMonotonicMs || job.attempts.length >= OFFLINE_ORCHESTRATION_LIMITS.maxAttemptsPerJob) {
        const exhausted = event(job.jobId, 'budget-exhausted', {
          reason: clock.now >= job.deadlineMonotonicMs ? 'time' : 'attempts',
          deadline_monotonic_ms: job.deadlineMonotonicMs
        });
        if (!appendConfirmed(store, job.jobId, exhausted)) return markUnresolved(job);
        if (!closeIfTerminal(job, 'retry-budget-exhausted')) return markUnresolved(job);
        return freezeDeep({ kind: 'host-outcome', status: 'budget-exhausted', reason: 'time-or-attempts', job_id: job.jobId });
      }
      if (!job.retryOpen || !eligibleRateLimit(job.lastAttempt?.providerResult)) {
        throw new OfflineOrchestrationError('RETRY_INELIGIBLE');
      }
      if (!Number.isSafeInteger(job.retryNotBefore) || clock.now < job.retryNotBefore) {
        throw new OfflineOrchestrationError('RETRY_DELAY_NOT_ELAPSED');
      }
      if (job.contextEnabled) {
        const request = contextUseRequest(job.production, 'retry');
        if (!request) throw new OfflineOrchestrationError('SYNTHETIC_CONTEXT_INPUT_INVALID');
        const current = await requireContextBoundary('retry', request, cancellation, job.authorityClock,
          job.clockEpochId, job.deadlineMonotonicMs);
        assertContextBoundaryCurrent('retry', request, current.executionEvidence, current.contextEvidence,
          cancellation, job.authorityClock, job.clockEpochId, job.deadlineMonotonicMs);
        job.contextUseRequest = request;
        job.contextUseEvidence = current.contextEvidence;
      }
      if (typeof store.claimResume === 'function') {
        let claim;
        try { claim = store.claimResume(job.jobId); } catch { claim = { status: 'unknown' }; }
        if (claim?.status === 'held') throw new OfflineOrchestrationError('RETRY_CLAIM_HELD');
        if (claim?.status !== 'acquired' || !UUID.test(claim.claim_id ?? '')) {
          throw new OfflineOrchestrationError('RETRY_CLAIM_UNCERTAIN');
        }
        const durableRetryBoundary = () => {
          const failure = currentAuthorityFailure(retryAuthority, 'retry', cancellation, job.authorityClock)
            ?? (job.contextEnabled
              ? currentContextUseFailure(job.contextUseEvidence, job.contextUseRequest, cancellation, job.authorityClock)
              : undefined)
            ?? currentPermitTimeFailure(retryAuthority, job.contextUseEvidence, job.authorityClock)
            ?? hostBoundaryFailure(cancellation, job.clockEpochId, job.deadlineMonotonicMs);
          if (failure) throw new OfflineOrchestrationError(failure);
          if (job.resumeTimeBounds) {
            const time = resumeTimeStatus(job.resumeTimeBounds, job.resumeTimeState);
            if (time.status !== 'eligible') throw new OfflineOrchestrationError(time.status);
          }
        };
        job.resumeBoundary = durableRetryBoundary;
        durableRetryBoundary();
      }
      if (!verifyRetryEvidence(job, job.lastAttempt)) return markUnresolved(job);
      // Identity is pinned in the job and cannot be replaced on retry.
      return await performAttempt(job, {
        correlationId: job.lastAttempt.providerCorrelationId,
        mockOutcome,
        signal,
        retryOfAttemptId: job.lastAttempt.attemptId,
        authorizationAction: 'retry'
      });
    } finally {
      running = false;
    }
  }

  function readResumeRoutingMetadata(jobId) {
    let entries;
    try { entries = store.readEvents(jobId); } catch {
      return { status: 'reconciliation-required' };
    }
    const expectedTypes = ['admitted', 'prepared', 'dispatch-started', 'provider-outcome',
      'result-prepared', 'persisting', 'terminal', 'resume-window'];
    if (entries === UNKNOWN_STORE_STATE || !Array.isArray(entries)) {
      return { status: 'reconciliation-required' };
    }
    if (entries.length !== expectedTypes.length || entries.some((item, index) => item.type !== expectedTypes[index])) {
      return { status: 'resume-not-eligible' };
    }
    const [admitted, prepared, dispatch, outcome, resultPrepared, persisting, terminal, resumeWindow] = entries;
    const timeRecord = admitted.resume_time;
    const timeKeys = 'authority_id|context_enabled|deadline_at_ms|domain_id|epoch_id|started_at_ms';
    const attemptId = prepared.attempt_id;
    const executionId = prepared.execution_id;
    const isResourceId = value => typeof value === 'string' && value.startsWith('urn:uuid:')
      && UUID.test(value.slice('urn:uuid:'.length));
    const isExecutionId = value => typeof value === 'string' && value.startsWith('exec-offline-')
      && UUID.test(value.slice('exec-offline-'.length));
    if (!timeRecord || Object.keys(timeRecord).sort().join('|') !== timeKeys
      || timeRecord.authority_id !== installedResumeTimeAuthority?.id
      || timeRecord.domain_id !== installedResumeTimeAuthority?.domain_id
      || timeRecord.epoch_id !== installedResumeTimeAuthority?.epoch_id
      || timeRecord.context_enabled !== false
      || !Number.isSafeInteger(timeRecord.started_at_ms)
      || !Number.isSafeInteger(timeRecord.deadline_at_ms)
      || timeRecord.deadline_at_ms !== checkedAdd(timeRecord.started_at_ms, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs)
      || admitted.production?.production_id !== EXPECTED_PRODUCTION_ID
      || admitted.production?.revision !== 1
      || admitted.production?.identity?.sha256 !== EXPECTED_PRODUCTION_SHA256
      || admitted.no_output_result_version !== '1.1.0'
      || prepared.retry_of_attempt_id !== null || !isResourceId(attemptId) || !isExecutionId(executionId)
      || dispatch.attempt_id !== attemptId || dispatch.execution_id !== executionId || dispatch.call_number !== 1
      || outcome.attempt_id !== attemptId || outcome.execution_id !== executionId || outcome.status !== 'failed'
      || outcome.payload_key !== `provider-outcome:${executionId}`
      || resultPrepared.attempt_id !== attemptId || resultPrepared.execution_id !== executionId
      || resultPrepared.status !== 'failed'
      || persisting.attempt_id !== attemptId || persisting.execution_id !== executionId
      || terminal.attempt_id !== attemptId || terminal.execution_id !== executionId
      || !isResourceId(terminal.result_id)
      || resumeWindow.attempt_id !== attemptId || resumeWindow.execution_id !== executionId
      || resumeWindow.terminal_result_id !== terminal.result_id
      || resumeWindow.deadline_at_ms !== timeRecord.deadline_at_ms
      || !Number.isSafeInteger(resumeWindow.checked_at_ms) || resumeWindow.checked_at_ms < timeRecord.started_at_ms
      || !Number.isSafeInteger(resumeWindow.retry_not_before_at_ms)
      || resumeWindow.retry_not_before_at_ms < 0
      || resumeWindow.checked_at_ms >= timeRecord.deadline_at_ms) {
      return { status: 'resume-not-eligible' };
    }
    if (resumeWindow.retry_not_before_at_ms >= timeRecord.deadline_at_ms) {
      return { status: 'resume-window-empty' };
    }
    return { status: 'metadata-candidate', entries, admitted, prepared, dispatch, outcome,
      resultPrepared, persisting, terminal, resumeWindow, timeRecord };
  }

  function resumeTimeStatus(bounds, state) {
    const now = sampleResumeTime(state);
    if (now === undefined) return { status: 'deadline-unverifiable' };
    if (now < bounds.retryNotBeforeAtMs) return { status: 'retry-delay-not-elapsed' };
    if (now >= bounds.deadlineAtMs) return { status: 'budget-exhausted' };
    return { status: 'eligible', now };
  }

  async function resume(options = {}) {
    const { jobId, authorizeResume, signal, mockOutcome } = optionValues(
      options, new Set(['jobId', 'authorizeResume', 'signal', 'mockOutcome']), 'INVALID_RESUME_OPTIONS'
    );
    if (typeof jobId !== 'string' || !jobId) throw new OfflineOrchestrationError('INVALID_JOB_ID');
    if (authorizeResume !== true) throw new OfflineOrchestrationError('EXPLICIT_RESUME_AUTHORIZATION_REQUIRED');
    if (!installedResumeTimeAuthority || typeof store.claimResume !== 'function') {
      throw new OfflineOrchestrationError('RESUME_AUTHORITY_OR_CLAIM_UNAVAILABLE');
    }
    if (running || (openJob && !openJob.closed)) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    const cancellation = cancellationSignal(signal);
    if (cancellation?.aborted) return freezeDeep({ kind: 'resume-outcome', status: 'resume-cancelled', job_id: jobId });
    let configuration;
    try { mockConfiguration(mockOutcome, { transcript: '' }); }
    catch { throw new OfflineOrchestrationError('INVALID_MOCK_OUTCOME'); }

    running = true;
    const authorityState = { lastMs: undefined };
    const timeBounds = { retryNotBeforeAtMs: undefined, deadlineAtMs: undefined };
    let authorityEvidence;
    let monotonic;
    try {
      const routing = readResumeRoutingMetadata(jobId);
      if (routing.status !== 'metadata-candidate') {
        return freezeDeep({ kind: 'resume-outcome', status: routing.status, job_id: jobId });
      }
      timeBounds.retryNotBeforeAtMs = routing.resumeWindow.retry_not_before_at_ms;
      timeBounds.deadlineAtMs = routing.timeRecord.deadline_at_ms;
      const firstTime = resumeTimeStatus(timeBounds, resumeTimeState);
      if (firstTime.status !== 'eligible') {
        return freezeDeep({ kind: 'resume-outcome', status: firstTime.status, job_id: jobId });
      }
      monotonic = safeClock(runtime);
      if (!monotonic) return freezeDeep({ kind: 'resume-outcome', status: 'deadline-unverifiable', job_id: jobId });

      try { authorityEvidence = await requireExecutionAuthority('retry', cancellation, authorityState); }
      catch { return freezeDeep({ kind: 'resume-outcome', status: 'execution-authority-denied', job_id: jobId }); }
      let failure = currentAuthorityFailure(authorityEvidence, 'retry', cancellation, authorityState);
      if (failure) return freezeDeep({ kind: 'resume-outcome', status: 'execution-authority-denied', job_id: jobId });
      const afterAuthorityTime = resumeTimeStatus(timeBounds, resumeTimeState);
      if (afterAuthorityTime.status !== 'eligible') {
        return freezeDeep({ kind: 'resume-outcome', status: afterAuthorityTime.status, job_id: jobId });
      }

      let claim;
      try { claim = store.claimResume(jobId); } catch { claim = { status: 'unknown' }; }
      if (claim?.status === 'held') {
        return freezeDeep({ kind: 'resume-outcome', status: 'resume-claim-held', job_id: jobId });
      }
      if (claim?.status !== 'acquired' || !UUID.test(claim.claim_id ?? '')) {
        return freezeDeep({ kind: 'resume-outcome', status: 'reconciliation-required', job_id: jobId });
      }

      try { authorityEvidence = await requireExecutionAuthority('retry', cancellation, authorityState); }
      catch { return freezeDeep({ kind: 'resume-outcome', status: 'execution-authority-denied', job_id: jobId }); }
      failure = currentAuthorityFailure(authorityEvidence, 'retry', cancellation, authorityState);
      if (failure) return freezeDeep({ kind: 'resume-outcome', status: 'execution-authority-denied', job_id: jobId });
      const postClaimTime = resumeTimeStatus(timeBounds, resumeTimeState);
      if (postClaimTime.status !== 'eligible') {
        return freezeDeep({ kind: 'resume-outcome', status: postClaimTime.status, job_id: jobId });
      }
      const postClaimMonotonic = safeClock(runtime);
      if (!postClaimMonotonic || postClaimMonotonic.epochId !== monotonic.epochId) {
        return freezeDeep({ kind: 'resume-outcome', status: 'deadline-unverifiable', job_id: jobId });
      }

      const currentResumeBoundary = () => {
        const authorityFailure = currentAuthorityFailure(authorityEvidence, 'retry', cancellation, authorityState);
        if (authorityFailure) throw new OfflineOrchestrationError('EXECUTION_AUTHORITY_DENIED');
        const currentTime = resumeTimeStatus(timeBounds, resumeTimeState);
        if (currentTime.status !== 'eligible') throw new OfflineOrchestrationError(currentTime.status);
        const clock = safeClock(runtime);
        const currentDeadline = checkedAdd(postClaimMonotonic.now, timeBounds.deadlineAtMs - postClaimTime.now);
        if (!clock || clock.epochId !== monotonic.epochId || currentDeadline === undefined
          || clock.now >= currentDeadline) {
          throw new OfflineOrchestrationError('EXECUTION_DEADLINE_EXPIRED');
        }
      };
      let candidate;
      let inspection;
      try {
        inspection = inspectRecoveryCore(jobId, {
          beforeProtectedRead: currentResumeBoundary,
          onCandidate: value => { candidate = value; }
        });
        currentResumeBoundary();
      } catch {
        return freezeDeep({ kind: 'resume-outcome', status: 'reconciliation-required', job_id: jobId });
      }
      if (inspection.status === 'reconciliation-required') {
        return freezeDeep({ kind: 'resume-outcome', status: 'reconciliation-required', job_id: jobId });
      }
      if (inspection.status !== 'resume-candidate' || !candidate) {
        return freezeDeep({ kind: 'resume-outcome', status: 'resume-not-eligible', job_id: jobId });
      }

      const remainingMs = timeBounds.deadlineAtMs - postClaimTime.now;
      const deadlineMonotonicMs = checkedAdd(postClaimMonotonic.now, remainingMs);
      if (deadlineMonotonicMs === undefined) {
        return freezeDeep({ kind: 'resume-outcome', status: 'deadline-unverifiable', job_id: jobId });
      }
      const ledger = new MaterialLedger();
      if (!ledger.charge(`input:${candidate.production.identity.sha256}`, candidate.productionBytes.byteLength)
        || !ledger.charge(`prompt:${candidate.renderedPrompt.sha256}`, candidate.promptBytes.byteLength)
        || !ledger.charge(`provider-outcome:${digest(candidate.outcomeBytes)}`, candidate.outcomeBytes.byteLength)
        || !ledger.charge(`result:${digest(candidate.resultBytes)}`, candidate.resultBytes.byteLength)) {
        return freezeDeep({ kind: 'resume-outcome', status: 'budget-exhausted', job_id: jobId });
      }

      let mock;
      let descriptor;
      try {
        configuration = mockConfiguration(mockOutcome, candidate.production.value.renditions[0]);
        mock = mockAdapterFactory(configuration);
        if (!(mock instanceof MockTextAdapter)) throw new TypeError();
        descriptor = await mock.describe();
      } catch {
        return freezeDeep({ kind: 'resume-outcome', status: 'mock-preflight-failed', job_id: jobId });
      }
      if (!validateExecutionDocument(descriptor).valid) {
        return freezeDeep({ kind: 'resume-outcome', status: 'mock-preflight-failed', job_id: jobId });
      }
      try { authorityEvidence = await requireExecutionAuthority('retry', cancellation, authorityState); }
      catch { return freezeDeep({ kind: 'resume-outcome', status: 'execution-authority-denied', job_id: jobId }); }
      failure = currentAuthorityFailure(authorityEvidence, 'retry', cancellation, authorityState);
      if (failure) return freezeDeep({ kind: 'resume-outcome', status: 'execution-authority-denied', job_id: jobId });
      const postPreflightTime = resumeTimeStatus(timeBounds, resumeTimeState);
      if (postPreflightTime.status !== 'eligible') {
        return freezeDeep({ kind: 'resume-outcome', status: postPreflightTime.status, job_id: jobId });
      }

      const priorAttempt = {
        attemptId: candidate.attemptId,
        executionId: candidate.executionId,
        resultId: candidate.terminal.result_id,
        terminalResult: candidate.result,
        providerResult: candidate.providerResult,
        providerCorrelationId: candidate.providerResult.correlation_id,
        completedMonotonicMs: undefined,
        state: 'terminal'
      };
      for (const value of [jobId, candidate.attemptId, candidate.executionId, priorAttempt.resultId]) {
        const token = value.startsWith('urn:uuid:') ? value.slice(9)
          : value.startsWith('exec-offline-') ? value.slice(13) : value;
        if (UUID.test(token)) usedIds.add(token);
      }
      const job = {
        jobId, production: candidate.production, noOutputResultVersion: '1.1.0',
        contextEnabled: false, contextUseRequest: undefined, contextUseEvidence: undefined,
        renderedPrompt: candidate.renderedPrompt, promptBytes: candidate.promptBytes,
        ledger, attempts: [priorAttempt], lastAttempt: priorAttempt, retryOpen: true,
        retryNotBefore: undefined, state: 'retry-eligible', closed: false,
        clockEpochId: postClaimMonotonic.epochId, admittedMonotonicMs: postClaimMonotonic.now,
        deadlineMonotonicMs, authorityClock: authorityState,
        resumeTimeState, resumeTimeBounds: timeBounds,
        resumeAuthorityEvidence: authorityEvidence
      };
      job.resumeBoundary = currentResumeBoundary;
      openJob = job;
      return await performAttempt(job, {
        correlationId: priorAttempt.providerCorrelationId,
        mockOutcome, signal: cancellation, retryOfAttemptId: priorAttempt.attemptId,
        preflight: { mock, descriptor }, authorizationAction: 'retry'
      });
    } finally {
      running = false;
    }
  }

  function closeJob() {
    if (running) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    const job = openJob;
    if (!job || job.closed) throw new OfflineOrchestrationError('NO_OPEN_JOB');
    if (job.state !== 'retry-eligible') throw new OfflineOrchestrationError('JOB_NOT_CLOSABLE');
    const closed = event(job.jobId, 'closed-without-retry', {
      attempt_id: job.lastAttempt.attemptId,
      result_id: job.lastAttempt.resultId,
      reason: 'caller-declined-eligible-retry'
    });
    if (!appendConfirmed(store, job.jobId, closed)) return markUnresolved(job);
    if (!closeIfTerminal(job, 'caller-declined-eligible-retry')) return markUnresolved(job);
    return freezeDeep({ kind: 'host-outcome', status: 'closed-without-retry', job_id: job.jobId });
  }

  function classifyResumeCandidate(jobId, entries, admitted, verifiedBlobs) {
    if (!installedResumeTimeAuthority) return undefined;
    const timeRecord = admitted.resume_time;
    const timeKeys = 'authority_id|context_enabled|deadline_at_ms|domain_id|epoch_id|started_at_ms';
    if (!timeRecord || Object.keys(timeRecord).sort().join('|') !== timeKeys
      || timeRecord.authority_id !== installedResumeTimeAuthority.id
      || timeRecord.domain_id !== installedResumeTimeAuthority.domain_id
      || timeRecord.epoch_id !== installedResumeTimeAuthority.epoch_id
      || timeRecord.context_enabled !== false
      || !Number.isSafeInteger(timeRecord.started_at_ms) || !Number.isFinite(new Date(timeRecord.started_at_ms).getTime())
      || !Number.isSafeInteger(timeRecord.deadline_at_ms)
      || timeRecord.deadline_at_ms !== checkedAdd(timeRecord.started_at_ms, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs)) {
      return undefined;
    }

    const prepared = entries.filter(item => item.type === 'prepared');
    const dispatches = entries.filter(item => item.type === 'dispatch-started');
    const outcomes = entries.filter(item => item.type === 'provider-outcome');
    const resultPrepared = entries.filter(item => item.type === 'result-prepared');
    const persisting = entries.filter(item => item.type === 'persisting');
    const terminals = entries.filter(item => item.type === 'terminal');
    const resumeWindows = entries.filter(item => item.type === 'resume-window');
    const expectedTypes = ['admitted', 'prepared', 'dispatch-started', 'provider-outcome',
      'result-prepared', 'persisting', 'terminal', 'resume-window'];
    if (entries.length !== expectedTypes.length
      || entries.some((item, index) => item.type !== expectedTypes[index])
      || prepared.length !== 1 || dispatches.length !== 1
      || outcomes.length !== 1 || resultPrepared.length !== 1 || persisting.length !== 1 || terminals.length !== 1
      || resumeWindows.length !== 1
      || entries.some(item => ['job-closed', 'contract-mapping-blocked', 'budget-exhausted', 'authorization-blocked'].includes(item.type))) {
      return undefined;
    }
    const first = prepared[0];
    const dispatch = dispatches[0];
    const outcomeRecord = outcomes[0];
    const terminal = terminals[0];
    const resumeWindow = resumeWindows[0];
    const attemptId = first.attempt_id;
    const executionId = first.execution_id;
    const isResourceId = value => typeof value === 'string' && value.startsWith('urn:uuid:')
      && UUID.test(value.slice('urn:uuid:'.length));
    const isExecutionId = value => typeof value === 'string' && value.startsWith('exec-offline-')
      && UUID.test(value.slice('exec-offline-'.length));
    if (first.retry_of_attempt_id !== null || !isResourceId(attemptId)
      || !isExecutionId(executionId)
      || dispatch.attempt_id !== attemptId || dispatch.execution_id !== executionId || dispatch.call_number !== 1
      || outcomeRecord.attempt_id !== attemptId || outcomeRecord.execution_id !== executionId
      || resultPrepared[0].attempt_id !== attemptId || persisting[0].attempt_id !== attemptId
      || resultPrepared[0].execution_id !== executionId || persisting[0].execution_id !== executionId
      || terminal.attempt_id !== attemptId || terminal.execution_id !== executionId
      || !isResourceId(terminal.result_id) || resultPrepared[0].status !== 'failed'
      || resumeWindow.attempt_id !== attemptId || resumeWindow.execution_id !== executionId
      || resumeWindow.terminal_result_id !== terminal.result_id
      || !Number.isSafeInteger(resumeWindow.checked_at_ms) || resumeWindow.checked_at_ms < 0
      || !Number.isSafeInteger(resumeWindow.retry_not_before_at_ms) || resumeWindow.retry_not_before_at_ms < 0
      || resumeWindow.deadline_at_ms !== timeRecord.deadline_at_ms) return undefined;
    const eventIndices = [entries.indexOf(admitted), entries.indexOf(first), entries.indexOf(dispatch),
      entries.indexOf(outcomeRecord), entries.indexOf(resultPrepared[0]), entries.indexOf(persisting[0]),
      entries.indexOf(terminal), entries.indexOf(resumeWindow)];
    if (eventIndices.some((value, index) => index > 0 && value <= eventIndices[index - 1])) return undefined;
    if (entries.some(item => item.attempt_id !== undefined && item.attempt_id !== attemptId)) return undefined;

    const productionBytes = verifiedBlobs.get(admitted.input_key);
    const promptBytes = verifiedBlobs.get(admitted.prompt_key);
    const outcomeBytes = verifiedBlobs.get(outcomeRecord.payload_key);
    const resultBytes = verifiedBlobs.get(`result:${terminal.result_id}`);
    if (!Buffer.isBuffer(productionBytes) || !Buffer.isBuffer(promptBytes)
      || !Buffer.isBuffer(outcomeBytes) || !Buffer.isBuffer(resultBytes)) return undefined;
    let production;
    let providerResult;
    let result;
    let admittedProduction;
    let preparedProduction;
    try {
      production = readProduction(productionBytes.toString('utf8'));
      providerResult = JSON.parse(outcomeBytes.toString('utf8'));
      result = JSON.parse(resultBytes.toString('utf8'));
      admittedProduction = canonicalJson(admitted.production);
      preparedProduction = canonicalJson(first.production);
    } catch { return undefined; }
    const renderedPrompt = renderOfflineComicPrompt(production.value);
    if (!productionBytes.equals(Buffer.from(production.canonical, 'utf8'))
      || production.identity.sha256 !== EXPECTED_PRODUCTION_SHA256
      || admittedProduction !== canonicalJson(production.reference)
      || preparedProduction !== admittedProduction
      || admitted.input_key !== `input:${jobId}` || admitted.prompt_key !== `prompt:${jobId}`
      || !promptBytes.equals(Buffer.from(renderedPrompt.canonical, 'utf8'))
      || admitted.prompt_sha256 !== renderedPrompt.sha256
      || admitted.no_output_result_version !== '1.1.0'
      || !isEligiblePersistedProviderOutcome(providerResult, executionId)
      || outcomeRecord.status !== 'failed'
      || outcomeRecord.payload_key !== `provider-outcome:${executionId}`
      || terminal.result_sha256 !== digest(resultBytes) || terminal.result_byte_size !== resultBytes.byteLength
      || resumeWindow.checked_at_ms >= timeRecord.deadline_at_ms
      || resultPrepared[0].result_id !== terminal.result_id || persisting[0].result_id !== terminal.result_id
      || resultPrepared[0].result_sha256 !== terminal.result_sha256
      || persisting[0].result_sha256 !== terminal.result_sha256
      || resultPrepared[0].result_byte_size !== terminal.result_byte_size
      || persisting[0].result_byte_size !== terminal.result_byte_size
      || !validateComicBuildResultCandidate(canonicalJson(result), production.canonical).valid
      || result.attempt_id !== attemptId || result.result_id !== terminal.result_id || result.status !== 'failed'
      || (result.outputs?.length ?? 0) !== 0
      || resumeWindow.retry_not_before_at_ms !== checkedAdd(resumeWindow.checked_at_ms,
        providerResult.error.retry_after_ms)
      || resumeWindow.checked_at_ms < timeRecord.started_at_ms) return undefined;

    const now = sampleResumeTime(resumeTimeState);
    if (now === undefined || now < resumeWindow.checked_at_ms) return { status: 'deadline-unverifiable' };
    if (resumeWindow.retry_not_before_at_ms >= timeRecord.deadline_at_ms) return { status: 'resume-window-empty' };
    if (now >= timeRecord.deadline_at_ms) return { status: 'budget-exhausted' };
    if (now < resumeWindow.retry_not_before_at_ms) return { status: 'retry-delay-not-elapsed' };
    return {
      status: 'resume-candidate',
      candidate: {
        admitted, first, outcomeRecord, terminal, resumeWindow,
        production, renderedPrompt, providerResult, result,
        productionBytes, promptBytes, outcomeBytes, resultBytes,
        attemptId, executionId
      }
    };
  }

  function inspectRecoveryCore(jobId, { beforeProtectedRead, onCandidate } = {}) {
    if (typeof jobId !== 'string' || !jobId) throw new OfflineOrchestrationError('INVALID_JOB_ID');
    const reconciliationRequired = () => recoveryDiagnostic('reconciliation-required');
    let entries;
    try { entries = store.readEvents(jobId); } catch {
      return reconciliationRequired();
    }
    if (entries === UNKNOWN_STORE_STATE || !Array.isArray(entries)) {
      return reconciliationRequired();
    }
    if (entries.length === 0) return recoveryDiagnostic('not-found');
    const admittedEvents = entries.filter(item => item?.type === 'admitted');
    const admitted = admittedEvents[0];
    if (!admitted || admittedEvents.length !== 1
      || entries.some(item => !item || typeof item !== 'object' || Array.isArray(item)
        || item.job_id !== jobId || typeof item.type !== 'string' || !RECOVERY_EVENT_TYPES.has(item.type))) {
      return reconciliationRequired();
    }
    const verifiedBlobs = new Map();
    const readVerifiedBlob = (key, expectedSize, expectedSha) => {
      beforeProtectedRead?.();
      let bytes;
      let readFailed = false;
      try { bytes = store.readImmutable(key); } catch { readFailed = true; }
      beforeProtectedRead?.();
      if (readFailed) return false;
      if (bytes === UNKNOWN_STORE_STATE || !Buffer.isBuffer(bytes)
        || bytes.byteLength !== expectedSize || digest(bytes) !== expectedSha) return false;
      verifiedBlobs.set(key, bytes);
      return bytes;
    };
    const verifyBlob = (key, expectedSize, expectedSha) => readVerifiedBlob(key, expectedSize, expectedSha) !== false;
    if (!verifyBlob(admitted.input_key, admitted.input_byte_size, admitted.input_sha256)
      || !verifyBlob(admitted.prompt_key, admitted.prompt_byte_size, admitted.prompt_sha256)) {
      return reconciliationRequired();
    }
    for (const item of entries) {
      if (item.type === 'provider-outcome'
        && !verifyBlob(item.payload_key, item.byte_size, item.sha256)) {
        return reconciliationRequired();
      }
      if (item.type === 'persisting' || item.type === 'terminal') {
        const resultBytes = readVerifiedBlob(`result:${item.result_id}`, item.result_byte_size, item.result_sha256);
        if (resultBytes === false) return reconciliationRequired();
        let result;
        try { result = JSON.parse(resultBytes.toString('utf8')); } catch {
          return reconciliationRequired();
        }
        if (!result || typeof result !== 'object' || Array.isArray(result) || !Array.isArray(result.outputs)) {
          return reconciliationRequired();
        }
        for (const output of result.outputs) {
          if (!output || typeof output !== 'object' || Array.isArray(output)) return reconciliationRequired();
          const artifact = output.artifact;
          if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)
            || !verifyBlob(`artifact:${artifact.artifact_uri}`, artifact.byte_size, artifact.sha256)) {
            return reconciliationRequired();
          }
        }
      }
    }

    const resultPrepared = entries.filter(item => item.type === 'result-prepared');
    const persisting = entries.filter(item => item.type === 'persisting');
    const terminals = entries.filter(item => item.type === 'terminal');
    if (resultPrepared.length !== persisting.length || resultPrepared.length !== terminals.length) {
      return reconciliationRequired();
    }
    let trailingNoResultAttempt = false;
    const jobScopedBudgetStops = entries.filter(item => item.type === 'budget-exhausted'
      && item.attempt_id === undefined);
    if (resultPrepared.length > 0) {
      const productionBytes = verifiedBlobs.get(admitted.input_key);
      let production;
      if (!admitted.production || typeof admitted.production !== 'object' || Array.isArray(admitted.production)) {
        return reconciliationRequired();
      }
      try {
        production = readProduction(productionBytes.toString('utf8'));
        if (!productionBytes.equals(Buffer.from(production.canonical, 'utf8'))
          || canonicalJson(admitted.production) !== canonicalJson(production.reference)) {
          return reconciliationRequired();
        }
      } catch {
        return reconciliationRequired();
      }

      const seenAttempts = new Set();
      const seenExecutions = new Set();
      const seenResults = new Set();
      let priorChain;
      const matching = (type, attemptId) => entries.filter(item => item.type === type && item.attempt_id === attemptId);
      const isResourceId = value => typeof value === 'string' && value.startsWith('urn:uuid:')
        && UUID.test(value.slice('urn:uuid:'.length));
      const isExecutionId = value => typeof value === 'string' && value.startsWith('exec-offline-')
        && UUID.test(value.slice('exec-offline-'.length));
      const isDigest = value => typeof value === 'string' && /^sha256:[0-9a-f]{64}$/.test(value);
      for (const preparedResult of resultPrepared) {
        const { attempt_id: attemptId, execution_id: executionId, result_id: resultId,
          result_byte_size: byteSize, result_sha256: sha256, status } = preparedResult;
        if (!isResourceId(attemptId) || !isExecutionId(executionId) || !isResourceId(resultId)
          || !Number.isSafeInteger(byteSize) || byteSize < 0 || !isDigest(sha256)
          || !['complete', 'failed'].includes(status)
          || seenAttempts.size >= OFFLINE_ORCHESTRATION_LIMITS.maxAttemptsPerJob
          || seenAttempts.has(attemptId) || seenExecutions.has(executionId) || seenResults.has(resultId)) {
          return reconciliationRequired();
        }
        seenAttempts.add(attemptId);
        seenExecutions.add(executionId);
        seenResults.add(resultId);

        const preparedAttempts = matching('prepared', attemptId);
        const dispatches = matching('dispatch-started', attemptId);
        const outcomes = matching('provider-outcome', attemptId);
        const persistingMatches = matching('persisting', attemptId);
        const terminalMatches = matching('terminal', attemptId);
        if (preparedAttempts.length !== 1 || dispatches.length !== 1 || outcomes.length !== 1
          || persistingMatches.length !== 1 || terminalMatches.length !== 1) return reconciliationRequired();
        const [prepared] = preparedAttempts;
        const [dispatch] = dispatches;
        const [outcome] = outcomes;
        const [persistingRecord] = persistingMatches;
        const [terminal] = terminalMatches;
        const attemptCancellationStops = matching('cancelled-before-dispatch', attemptId);
        const attemptMappingStops = matching('contract-mapping-blocked', attemptId);
        const attemptBudgetStops = matching('budget-exhausted', attemptId);
        if (attemptCancellationStops.length !== 0 || attemptMappingStops.length !== 0
          || attemptBudgetStops.length > 1) return reconciliationRequired();
        if (attemptBudgetStops.length === 1) {
          const [stop] = attemptBudgetStops;
          const stopKeys = ['attempt_id', 'deadline_monotonic_ms', 'execution_id', 'job_id', 'reason', 'type'];
          if (Object.keys(stop).sort().join('|') !== stopKeys.join('|')
            || stop.job_id !== jobId || stop.reason !== 'time'
            || stop.execution_id !== executionId
            || !Number.isSafeInteger(admitted.deadline_monotonic_ms)
            || stop.deadline_monotonic_ms !== admitted.deadline_monotonic_ms
            || entries.indexOf(stop) <= entries.indexOf(dispatch)
            || entries.indexOf(stop) >= entries.indexOf(outcome)
            || entries.indexOf(outcome) >= entries.indexOf(preparedResult)) return reconciliationRequired();
        }
        if (priorChain) {
          const priorWindows = matching('resume-window', priorChain.attemptId);
          if (priorWindows.length > 1) return reconciliationRequired();
          if (admitted.resume_time !== undefined) {
            if (priorWindows.length !== 1) return reconciliationRequired();
            const priorWindow = priorWindows[0];
            const timeRecord = admitted.resume_time;
            const windowKeys = ['authority_id', 'context_enabled', 'deadline_at_ms', 'domain_id', 'epoch_id', 'started_at_ms'];
            const validTimeRecord = timeRecord && typeof timeRecord === 'object' && !Array.isArray(timeRecord)
              && Object.keys(timeRecord).sort().join('|') === windowKeys.join('|')
              && timeRecord.authority_id === SYNTHETIC_RESUME_TIME_AUTHORITY_ID
              && typeof timeRecord.domain_id === 'string' && typeof timeRecord.epoch_id === 'string'
              && timeRecord.context_enabled === false
              && Number.isSafeInteger(timeRecord.started_at_ms) && Number.isSafeInteger(timeRecord.deadline_at_ms)
              && timeRecord.deadline_at_ms === checkedAdd(timeRecord.started_at_ms, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
            const priorWindowIndex = entries.indexOf(priorWindow);
            if (!validTimeRecord || priorWindow.attempt_id !== priorChain.attemptId
              || priorWindow.execution_id !== priorChain.executionId
              || priorWindow.terminal_result_id !== priorChain.resultId
              || !Number.isSafeInteger(priorWindow.checked_at_ms)
              || priorWindow.checked_at_ms < timeRecord.started_at_ms
              || priorWindow.checked_at_ms >= timeRecord.deadline_at_ms
              || priorWindow.retry_not_before_at_ms !== checkedAdd(priorWindow.checked_at_ms,
                priorChain.providerResult.error.retry_after_ms)
              || priorWindow.deadline_at_ms !== timeRecord.deadline_at_ms
              || priorWindowIndex <= priorChain.terminalIndex
              || entries.indexOf(prepared) <= priorWindowIndex) return reconciliationRequired();
          } else if (priorWindows.length !== 0 || entries.indexOf(prepared) <= priorChain.terminalIndex) {
            return reconciliationRequired();
          }
        } else if (prepared.retry_of_attempt_id !== null) return reconciliationRequired();
        const ordered = [prepared, dispatch, outcome, preparedResult, persistingRecord, terminal]
          .map(item => entries.indexOf(item));
        if (ordered.some((index, position) => index < 0
          || (position > 0 && index <= ordered[position - 1]))) return reconciliationRequired();

        if (prepared.execution_id !== executionId || dispatch.execution_id !== executionId
          || outcome.execution_id !== executionId || persistingRecord.execution_id !== executionId
          || terminal.execution_id !== executionId || persistingRecord.result_id !== resultId
          || terminal.result_id !== resultId || persistingRecord.result_byte_size !== byteSize
          || terminal.result_byte_size !== byteSize || persistingRecord.result_sha256 !== sha256
          || terminal.result_sha256 !== sha256 || persistingRecord.attempt_id !== attemptId
          || terminal.attempt_id !== attemptId || preparedResult.job_id !== jobId
          || outcome.payload_key !== `provider-outcome:${executionId}` || !isDigest(outcome.sha256)
          || !Number.isSafeInteger(outcome.byte_size) || outcome.byte_size < 0
          || !Number.isSafeInteger(dispatch.call_number) || dispatch.call_number < 1
          || !admitted.production || typeof admitted.production !== 'object' || Array.isArray(admitted.production)
          || !prepared.production || typeof prepared.production !== 'object' || Array.isArray(prepared.production)
          || canonicalJson(prepared.production) !== canonicalJson(admitted.production)) {
          return reconciliationRequired();
        }

        const outcomeBytes = verifiedBlobs.get(outcome.payload_key);
        const resultBytes = verifiedBlobs.get(`result:${resultId}`);
        if (!Buffer.isBuffer(outcomeBytes) || !Buffer.isBuffer(resultBytes)) return reconciliationRequired();
        let providerResult;
        let result;
        try {
          const outcomeSource = outcomeBytes.toString('utf8');
          const resultSource = resultBytes.toString('utf8');
          providerResult = JSON.parse(outcomeSource);
          result = JSON.parse(resultSource);
          if (!outcomeBytes.equals(Buffer.from(canonicalJson(providerResult), 'utf8'))
            || !resultBytes.equals(Buffer.from(canonicalJson(result), 'utf8'))) return reconciliationRequired();
        } catch {
          return reconciliationRequired();
        }
        if (!providerResult || typeof providerResult !== 'object' || Array.isArray(providerResult)
          || !result || typeof result !== 'object' || Array.isArray(result)) {
          return reconciliationRequired();
        }
        if ((!priorChain && prepared.retry_of_attempt_id !== null)
          || (priorChain && (prepared.retry_of_attempt_id !== priorChain.attemptId
            || priorChain.result.status !== 'failed' || priorChain.result.outputs.length !== 0
            || !eligibleRateLimit(priorChain.providerResult)))) return reconciliationRequired();
        let resultValidation;
        try {
          const resultSource = canonicalJson(result);
          resultValidation = result.spec_version === '1.1.0'
            ? validateComicBuildResultCandidate(resultSource, production.canonical)
            : result.spec_version === '1.0.0' ? validateComicManifest(resultSource) : { valid: false };
          const compatibility = result.spec_version === '1.1.0' ? resultValidation
            : result.spec_version === '1.0.0'
              ? validateComicOutputCompatibility(production.canonical, resultSource) : { valid: false };
          if (!validateExecutionDocument(providerResult).valid
            || providerResult.execution_id !== executionId || providerResult.status !== outcome.status
            || result.result_id !== resultId || result.attempt_id !== attemptId || result.status !== status
            || canonicalJson(prepared.production) !== canonicalJson(admitted.production)
            || canonicalJson(result.production) !== canonicalJson(admitted.production)
            || !resultValidation.valid || !compatibility.valid) return reconciliationRequired();
          if (result.spec_version === '1.1.0'
            && (admitted.no_output_result_version !== '1.1.0' || result.status !== 'failed'
              || providerResult.status !== 'failed' || !eligibleRateLimit(providerResult)
              || result.outputs.length !== 0)) return reconciliationRequired();
          if (result.spec_version === '1.0.0' && result.status === 'failed') {
            const supportedFailure = providerResult.status === 'cancelled'
              || (providerResult.status === 'failed'
                && ['output-validation', 'rate-limit'].includes(providerResult.error?.category))
              || (providerResult.status === 'succeeded' && typeof providerResult.output?.content === 'string');
            if (!supportedFailure) return reconciliationRequired();
          }
          if (result.status === 'complete') {
            if (result.spec_version !== '1.0.0' || providerResult.status !== 'succeeded'
              || typeof providerResult.output?.content !== 'string' || result.outputs.length !== 1) {
              return reconciliationRequired();
            }
            const outputBytes = Buffer.from(providerResult.output.content, 'utf8');
            const artifact = result.outputs[0].artifact;
            const storedArtifact = verifiedBlobs.get(`artifact:${artifact.artifact_uri}`);
            if (!Buffer.isBuffer(storedArtifact) || !storedArtifact.equals(outputBytes)
              || artifact.byte_size !== outputBytes.byteLength || artifact.sha256 !== digest(outputBytes)) {
              return reconciliationRequired();
            }
          } else if (result.outputs.length !== 0) return reconciliationRequired();
        } catch {
          return reconciliationRequired();
        }
        const ownWindows = matching('resume-window', attemptId);
        if (ownWindows.length > 1) return reconciliationRequired();
        let resumeWindowIndex;
        if (ownWindows.length === 1) {
          const resumeWindow = ownWindows[0];
          const timeRecord = admitted.resume_time;
          const timeKeys = 'authority_id|context_enabled|deadline_at_ms|domain_id|epoch_id|started_at_ms';
          if (!timeRecord || Object.keys(timeRecord).sort().join('|') !== timeKeys
            || timeRecord.authority_id !== SYNTHETIC_RESUME_TIME_AUTHORITY_ID
            || typeof timeRecord.domain_id !== 'string' || typeof timeRecord.epoch_id !== 'string'
            || timeRecord.context_enabled !== false
            || !Number.isSafeInteger(timeRecord.started_at_ms)
            || !Number.isSafeInteger(timeRecord.deadline_at_ms)
            || timeRecord.deadline_at_ms !== checkedAdd(timeRecord.started_at_ms,
              OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs)
            || resumeWindow.attempt_id !== attemptId || resumeWindow.execution_id !== executionId
            || resumeWindow.terminal_result_id !== resultId
            || result.status !== 'failed' || result.outputs.length !== 0
            || !eligibleRateLimit(providerResult)
            || !Number.isSafeInteger(resumeWindow.checked_at_ms)
            || resumeWindow.checked_at_ms < timeRecord.started_at_ms
            || resumeWindow.checked_at_ms >= timeRecord.deadline_at_ms
            || resumeWindow.retry_not_before_at_ms !== checkedAdd(resumeWindow.checked_at_ms,
              providerResult.error.retry_after_ms)
            || resumeWindow.deadline_at_ms !== timeRecord.deadline_at_ms
            || entries.indexOf(resumeWindow) <= entries.indexOf(terminal)) return reconciliationRequired();
          resumeWindowIndex = entries.indexOf(resumeWindow);
        }
        priorChain = { attemptId, executionId, resultId, terminalIndex: entries.indexOf(terminal),
          resumeWindowIndex, providerResult, result };
      }

      // All result-bearing attempt records must belong to a verified chain. The
      // only allowed trailing attempt is an explicitly stopped retry with no result.
      const resultAttemptEventTypes = new Set(['prepared', 'dispatch-started', 'provider-outcome',
        'result-prepared', 'persisting', 'terminal', 'resume-window',
        'contract-mapping-blocked', 'budget-exhausted', 'cancelled-before-dispatch']);
      if (jobScopedBudgetStops.length > 1
        || entries.some(item => resultAttemptEventTypes.has(item.type) && item.attempt_id === undefined
          && item.type !== 'budget-exhausted')) {
        return reconciliationRequired();
      }
      const allowedAttemptIdTypes = new Set([...resultAttemptEventTypes, 'closed-without-retry']);
      if (entries.some(item => item.attempt_id !== undefined && !allowedAttemptIdTypes.has(item.type))) {
        return reconciliationRequired();
      }
      const orphanAttemptRecords = entries.filter(item => item.attempt_id !== undefined
        && !seenAttempts.has(item.attempt_id));
      if (orphanAttemptRecords.some(item => !resultAttemptEventTypes.has(item.type))) return reconciliationRequired();
      const orphanIds = new Set(orphanAttemptRecords.map(item => item.attempt_id));
      if (orphanIds.size > 0) {
        if (orphanIds.size !== 1 || !priorChain
          || (admitted.resume_time !== undefined && priorChain.resumeWindowIndex === undefined)) {
          return reconciliationRequired();
        }
        const [orphanId] = orphanIds;
        const orphanEvents = entries.filter(item => resultAttemptEventTypes.has(item.type)
          && item.attempt_id === orphanId);
        const ofType = type => orphanEvents.filter(item => item.type === type);
        const orphanPrepared = ofType('prepared');
        const orphanDispatches = ofType('dispatch-started');
        const orphanOutcomes = ofType('provider-outcome');
        const orphanStops = orphanEvents.filter(item => ['contract-mapping-blocked',
          'budget-exhausted', 'cancelled-before-dispatch'].includes(item.type));
        const orphanResults = orphanEvents.filter(item => ['result-prepared', 'persisting',
          'terminal', 'resume-window'].includes(item.type));
        const stopCounts = new Map();
        for (const item of orphanStops) stopCounts.set(item.type, (stopCounts.get(item.type) ?? 0) + 1);
        if (orphanPrepared.length !== 1 || orphanDispatches.length > 1 || orphanOutcomes.length > 1
          || orphanStops.length < 1 || [...stopCounts.values()].some(count => count > 1) || orphanResults.length !== 0
          || orphanPrepared[0].retry_of_attempt_id !== priorChain.attemptId
          || !isResourceId(orphanId) || !isExecutionId(orphanPrepared[0].execution_id)
          || entries.indexOf(orphanPrepared[0]) <= (priorChain.resumeWindowIndex ?? priorChain.terminalIndex)) {
          return reconciliationRequired();
        }
        const orphanExecutionId = orphanPrepared[0].execution_id;
        const orphanDispatch = orphanDispatches[0];
        const orphanOutcome = orphanOutcomes[0];
        if ((orphanDispatch && (orphanDispatch.execution_id !== orphanExecutionId
            || orphanDispatch.call_number !== 1
            || entries.indexOf(orphanDispatch) <= entries.indexOf(orphanPrepared[0])))
          || (orphanOutcome && (!orphanDispatch || orphanOutcome.execution_id !== orphanExecutionId
            || orphanOutcome.payload_key !== `provider-outcome:${orphanExecutionId}`
            || !isDigest(orphanOutcome.sha256) || !Number.isSafeInteger(orphanOutcome.byte_size)
            || entries.indexOf(orphanOutcome) <= entries.indexOf(orphanDispatch)))) {
          return reconciliationRequired();
        }
        let orphanProviderResult;
        if (orphanOutcome) {
          const orphanOutcomeBytes = verifiedBlobs.get(orphanOutcome.payload_key);
          try { orphanProviderResult = JSON.parse(orphanOutcomeBytes.toString('utf8')); } catch {
            return reconciliationRequired();
          }
          if (!orphanProviderResult || !validateExecutionDocument(orphanProviderResult).valid
            || orphanProviderResult.execution_id !== orphanExecutionId
            || orphanProviderResult.status !== orphanOutcome.status) return reconciliationRequired();
        }
        const orphanBudgetStops = orphanStops.filter(item => item.type === 'budget-exhausted');
        const orphanCancellationStops = orphanStops.filter(item => item.type === 'cancelled-before-dispatch');
        const orphanMappingStops = orphanStops.filter(item => item.type === 'contract-mapping-blocked');
        const stopIndices = orphanStops.map(item => entries.indexOf(item));
        const closedEvents = entries.filter(item => item.type === 'job-closed');
        if (orphanStops.some(item => item.execution_id !== undefined
            && item.execution_id !== orphanExecutionId)) return reconciliationRequired();
        if (orphanCancellationStops.length === 1) {
          const [stop] = orphanCancellationStops;
          const stopKeys = ['attempt_id', 'job_id', 'reason', 'type'];
          if (orphanDispatch || orphanOutcome || orphanBudgetStops.length !== 0 || orphanMappingStops.length !== 0
            || Object.keys(stop).sort().join('|') !== stopKeys.join('|')
            || stop.job_id !== jobId || stop.attempt_id !== orphanId || stop.reason !== 'caller-cancelled'
            || entries.indexOf(stop) <= entries.indexOf(orphanPrepared[0])) return reconciliationRequired();
        }
        if (orphanBudgetStops.length === 1) {
          const [stop] = orphanBudgetStops;
          const stopKeys = ['attempt_id', 'deadline_monotonic_ms', 'execution_id', 'job_id', 'reason', 'type'];
          const previousAttemptEvent = orphanDispatch ?? orphanPrepared[0];
          if (Object.keys(stop).sort().join('|') !== stopKeys.join('|')
            || stop.job_id !== jobId || stop.attempt_id !== orphanId || stop.execution_id !== orphanExecutionId
            || stop.reason !== 'time' || !Number.isSafeInteger(admitted.deadline_monotonic_ms)
            || stop.deadline_monotonic_ms !== admitted.deadline_monotonic_ms
            || entries.indexOf(stop) <= entries.indexOf(previousAttemptEvent)
            || (orphanOutcome && entries.indexOf(stop) >= entries.indexOf(orphanOutcome))) {
            return reconciliationRequired();
          }
        }
        if (orphanMappingStops.length === 1) {
          const [mapping] = orphanMappingStops;
          const mappingKeys = ['attempt_id', 'execution_id', 'job_id', 'provider_outcome_sha256', 'reason', 'type'];
          const allowedReasons = new Set(['comic-result-validation-rejected', 'deadline-unverifiable',
            'no-output-result-not-representable-under-current-validator', 'provider-timeout-mapping-deferred',
            'unsupported-normalized-result-mapping']);
          if (!orphanOutcome || Object.keys(mapping).sort().join('|') !== mappingKeys.join('|')
            || mapping.job_id !== jobId || mapping.attempt_id !== orphanId
            || mapping.execution_id !== orphanExecutionId
            || !allowedReasons.has(mapping.reason) || mapping.provider_outcome_sha256 !== orphanOutcome.sha256
            || entries.indexOf(mapping) <= entries.indexOf(orphanOutcome)) return reconciliationRequired();
        }
        if (orphanCancellationStops.length > 1 || orphanBudgetStops.length > 1 || orphanMappingStops.length > 1
          || (orphanOutcome && orphanMappingStops.length !== 1)
          || (!orphanOutcome && orphanMappingStops.length !== 0)
          || (closedEvents.length === 1 && (entries.at(-1) !== closedEvents[0]
            || entries.indexOf(closedEvents[0]) <= Math.max(...stopIndices)))
          || (closedEvents.length === 0 && (orphanCancellationStops.length !== 0
            || orphanBudgetStops.length !== 0 || orphanMappingStops.length !== 1
            || (orphanMappingStops[0].reason !== 'deadline-unverifiable'
              && orphanProviderResult.status !== 'timed-out')))
          || (closedEvents.length === 1 && orphanCancellationStops.length === 1
            && closedEvents[0].reason !== 'cancelled-before-dispatch')
          || (closedEvents.length === 1 && orphanBudgetStops.length === 1
            && orphanMappingStops.length === 0 && closedEvents[0].reason !== 'budget-time')
          || (closedEvents.length === 1 && orphanMappingStops.length === 1
            && (!orphanOutcome || !['failed', 'cancelled', 'succeeded'].includes(orphanProviderResult.status)
              || closedEvents[0].reason !== 'retry-contract-mapping-blocked'))
          || (closedEvents.length === 1 && orphanCancellationStops.length === 0
            && orphanBudgetStops.length === 0 && orphanMappingStops.length === 0)) {
          return reconciliationRequired();
        }
      }
      const closedWithoutRetry = entries.filter(item => item.type === 'closed-without-retry');
      const jobClosedForRetry = entries.find(item => item.type === 'job-closed');
      if (jobScopedBudgetStops.length === 1) {
        const [stop] = jobScopedBudgetStops;
        const stopKeys = ['deadline_monotonic_ms', 'job_id', 'reason', 'type'];
        const afterResultIndex = priorChain?.resumeWindowIndex ?? priorChain?.terminalIndex;
        if (!priorChain || orphanIds.size !== 0 || closedWithoutRetry.length !== 0
          || priorChain.result.status !== 'failed' || priorChain.result.outputs.length !== 0
          || !eligibleRateLimit(priorChain.providerResult)
          || Object.keys(stop).sort().join('|') !== stopKeys.join('|')
          || stop.job_id !== jobId || stop.type !== 'budget-exhausted'
          || !['time', 'attempts'].includes(stop.reason)
          || !Number.isSafeInteger(admitted.deadline_monotonic_ms)
          || stop.deadline_monotonic_ms !== admitted.deadline_monotonic_ms
          || (stop.reason === 'attempts'
            && resultPrepared.length < OFFLINE_ORCHESTRATION_LIMITS.maxAttemptsPerJob)
          || entries.indexOf(stop) <= afterResultIndex
          || !jobClosedForRetry || jobClosedForRetry.reason !== 'retry-budget-exhausted'
          || entries.indexOf(stop) >= entries.indexOf(jobClosedForRetry)) {
          return reconciliationRequired();
        }
      }
      if (closedWithoutRetry.length > 1 || (closedWithoutRetry.length === 1
        && (!priorChain || (admitted.resume_time !== undefined && priorChain.resumeWindowIndex === undefined)
          || !jobClosedForRetry
          || closedWithoutRetry[0].attempt_id !== priorChain.attemptId
          || closedWithoutRetry[0].result_id !== priorChain.resultId
          || entries.indexOf(closedWithoutRetry[0]) <= (priorChain.resumeWindowIndex ?? priorChain.terminalIndex)
          || (jobClosedForRetry && entries.indexOf(closedWithoutRetry[0]) >= entries.indexOf(jobClosedForRetry))))) {
        return reconciliationRequired();
      }
      trailingNoResultAttempt = orphanIds.size > 0;
    } else {
      // A job with no verified result chain can expose only a consistent,
      // single-attempt early-stop or unresolved path. A close marker alone is
      // never evidence that a result was persisted.
      const noResultLifecycleTypes = new Set(['result-prepared', 'persisting', 'terminal', 'resume-window']);
      if (entries.some(item => noResultLifecycleTypes.has(item.type))) return reconciliationRequired();
      const noResultAttemptTypes = new Set(['prepared', 'dispatch-started', 'provider-outcome',
        'contract-mapping-blocked', 'budget-exhausted', 'cancelled-before-dispatch']);
      const noResultAttemptRecords = entries.filter(item => item.attempt_id !== undefined);
      if (noResultAttemptRecords.some(item => !noResultAttemptTypes.has(item.type))) return reconciliationRequired();
      const attemptIds = new Set(noResultAttemptRecords.map(item => item.attempt_id));
      if (attemptIds.size > 1) return reconciliationRequired();
      const noResultStops = entries.filter(item => ['contract-mapping-blocked',
        'budget-exhausted', 'cancelled-before-dispatch'].includes(item.type));
      const noResultStopCounts = new Map();
      for (const item of noResultStops) noResultStopCounts.set(item.type, (noResultStopCounts.get(item.type) ?? 0) + 1);
      if ([...noResultStopCounts.values()].some(count => count > 1)) return reconciliationRequired();
      const jobScopedBudgetStopsWithoutResult = noResultStops.filter(item =>
        item.type === 'budget-exhausted' && item.attempt_id === undefined);
      if (jobScopedBudgetStopsWithoutResult.length > 1) return reconciliationRequired();
      if (jobScopedBudgetStopsWithoutResult.length === 1) {
        const [stop] = jobScopedBudgetStopsWithoutResult;
        const closed = entries.filter(item => item.type === 'job-closed');
        const timeStopKeys = ['deadline_monotonic_ms', 'job_id', 'reason', 'type'];
        const materialStopKeys = ['job_id', 'reason', 'type'];
        const expectedKeys = stop.reason === 'time' ? timeStopKeys
          : ['prompt', 'material'].includes(stop.reason) ? materialStopKeys : [];
        if (attemptIds.size !== 0 || expectedKeys.length === 0
          || Object.keys(stop).sort().join('|') !== [...expectedKeys].sort().join('|')
          || stop.job_id !== jobId || stop.type !== 'budget-exhausted'
          || (stop.reason === 'time' && (!Number.isSafeInteger(admitted.deadline_monotonic_ms)
            || stop.deadline_monotonic_ms !== admitted.deadline_monotonic_ms))
          || closed.length !== 1 || closed[0].reason !== `budget-${stop.reason}`
          || entries.indexOf(stop) >= entries.indexOf(closed[0])
          || entries.at(-1) !== closed[0]) return reconciliationRequired();
      }
      if (attemptIds.size === 1) {
        const [attemptId] = attemptIds;
        const attemptRecords = noResultAttemptRecords.filter(item => item.attempt_id === attemptId);
        const preparedAttempts = attemptRecords.filter(item => item.type === 'prepared');
        const dispatches = attemptRecords.filter(item => item.type === 'dispatch-started');
        const outcomes = attemptRecords.filter(item => item.type === 'provider-outcome');
        const stops = attemptRecords.filter(item => ['contract-mapping-blocked',
          'budget-exhausted', 'cancelled-before-dispatch'].includes(item.type));
        const prepared = preparedAttempts[0];
        const resourceId = value => typeof value === 'string' && value.startsWith('urn:uuid:')
          && UUID.test(value.slice('urn:uuid:'.length));
        const executionIdValid = value => typeof value === 'string' && value.startsWith('exec-offline-')
          && UUID.test(value.slice('exec-offline-'.length));
        if (!resourceId(attemptId) || preparedAttempts.length !== 1 || dispatches.length > 1
          || outcomes.length > 1 || stops.length > 2
          || new Set(stops.map(item => item.type)).size !== stops.length
          || !executionIdValid(prepared.execution_id) || prepared.retry_of_attempt_id !== null
          || attemptRecords.some(item => item.execution_id !== undefined
            && item.execution_id !== prepared.execution_id)
          || !admitted.production || typeof admitted.production !== 'object' || Array.isArray(admitted.production)
          || !prepared.production || typeof prepared.production !== 'object' || Array.isArray(prepared.production)) {
          return reconciliationRequired();
        }
        const productionBytes = verifiedBlobs.get(admitted.input_key);
        try {
          const production = readProduction(productionBytes.toString('utf8'));
          if (!productionBytes.equals(Buffer.from(production.canonical, 'utf8'))
            || canonicalJson(admitted.production) !== canonicalJson(production.reference)
            || canonicalJson(prepared.production) !== canonicalJson(admitted.production)) {
            return reconciliationRequired();
          }
        } catch { return reconciliationRequired(); }
        const dispatch = dispatches[0];
        const outcome = outcomes[0];
        if ((dispatch && (dispatch.call_number !== 1
            || entries.indexOf(dispatch) <= entries.indexOf(prepared)))
          || (outcome && (!dispatch || outcome.payload_key !== `provider-outcome:${prepared.execution_id}`
            || !Number.isSafeInteger(outcome.byte_size) || outcome.byte_size < 0
            || typeof outcome.sha256 !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(outcome.sha256)
            || entries.indexOf(outcome) <= entries.indexOf(dispatch)))) return reconciliationRequired();
        let providerResult;
        if (outcome) {
          const outcomeBytes = verifiedBlobs.get(outcome.payload_key);
          try { providerResult = JSON.parse(outcomeBytes.toString('utf8')); } catch {
            return reconciliationRequired();
          }
          if (!providerResult || !validateExecutionDocument(providerResult).valid
            || providerResult.execution_id !== prepared.execution_id
            || providerResult.status !== outcome.status) return reconciliationRequired();
        }
        const budgetStops = stops.filter(item => item.type === 'budget-exhausted');
        const cancellationStops = stops.filter(item => item.type === 'cancelled-before-dispatch');
        const mappingStops = stops.filter(item => item.type === 'contract-mapping-blocked');
        const preparedIndex = entries.indexOf(prepared);
        const closedEventsForAttempt = entries.filter(item => item.type === 'job-closed');
        if (cancellationStops.length === 1) {
          const [stop] = cancellationStops;
          const stopKeys = ['attempt_id', 'job_id', 'reason', 'type'];
          if (dispatch || outcome || budgetStops.length !== 0 || mappingStops.length !== 0
            || Object.keys(stop).sort().join('|') !== stopKeys.join('|')
            || stop.job_id !== jobId || stop.attempt_id !== attemptId || stop.reason !== 'caller-cancelled'
            || entries.indexOf(stop) <= preparedIndex) return reconciliationRequired();
        }
        if (budgetStops.length === 1) {
          const [stop] = budgetStops;
          const stopKeys = ['attempt_id', 'deadline_monotonic_ms', 'execution_id', 'job_id', 'reason', 'type'];
          const previousAttemptEvent = dispatch ?? prepared;
          if (Object.keys(stop).sort().join('|') !== stopKeys.join('|')
            || stop.job_id !== jobId || stop.attempt_id !== attemptId
            || stop.execution_id !== prepared.execution_id || stop.reason !== 'time'
            || !Number.isSafeInteger(admitted.deadline_monotonic_ms)
            || stop.deadline_monotonic_ms !== admitted.deadline_monotonic_ms
            || entries.indexOf(stop) <= entries.indexOf(previousAttemptEvent)
            || (outcome && entries.indexOf(stop) >= entries.indexOf(outcome))) return reconciliationRequired();
        }
        if (mappingStops.length === 1) {
          const [mapping] = mappingStops;
          const mappingKeys = ['attempt_id', 'execution_id', 'job_id', 'provider_outcome_sha256', 'reason', 'type'];
          const allowedReasons = new Set(['comic-result-validation-rejected', 'deadline-unverifiable',
            'no-output-result-not-representable-under-current-validator', 'provider-timeout-mapping-deferred',
            'unsupported-normalized-result-mapping']);
          if (!outcome || Object.keys(mapping).sort().join('|') !== mappingKeys.join('|')
            || mapping.job_id !== jobId || mapping.attempt_id !== attemptId
            || mapping.execution_id !== prepared.execution_id
            || !allowedReasons.has(mapping.reason) || mapping.provider_outcome_sha256 !== outcome.sha256
            || entries.indexOf(mapping) <= entries.indexOf(outcome)) return reconciliationRequired();
        }
        if (cancellationStops.length > 1 || budgetStops.length > 1 || mappingStops.length > 1
          || (outcome && mappingStops.length !== 1)
          || (!outcome && mappingStops.length !== 0)) return reconciliationRequired();
        const stopIndices = stops.map(item => entries.indexOf(item));
        if (closedEventsForAttempt.length > 1
          || (closedEventsForAttempt.length === 1 && (entries.at(-1) !== closedEventsForAttempt[0]
            || stopIndices.length === 0 || entries.indexOf(closedEventsForAttempt[0]) <= Math.max(...stopIndices)))
          || (closedEventsForAttempt.length === 1 && cancellationStops.length === 1
            && closedEventsForAttempt[0].reason !== 'cancelled-before-dispatch')
          || (closedEventsForAttempt.length === 1 && budgetStops.length === 1
            && mappingStops.length === 0 && closedEventsForAttempt[0].reason !== 'budget-time')
          || (closedEventsForAttempt.length === 1 && mappingStops.length !== 0)
          || (closedEventsForAttempt.length === 1 && cancellationStops.length === 0
            && budgetStops.length === 0 && mappingStops.length === 0)
          || (closedEventsForAttempt.length === 0
            && (cancellationStops.length !== 0 || (budgetStops.length !== 0 && mappingStops.length === 0)
              || mappingStops.length !== 1))) return reconciliationRequired();
      }
      if (entries.some(item => ['prepared', 'dispatch-started', 'provider-outcome',
          'contract-mapping-blocked'].includes(item.type) && item.attempt_id === undefined)) {
        return reconciliationRequired();
      }
      const closedEventsForJob = entries.filter(item => item.type === 'job-closed');
      const closingStops = noResultStops.filter(item =>
        item.type === 'budget-exhausted' || item.type === 'cancelled-before-dispatch');
      if (closedEventsForJob.length === 1 && (entries.at(-1) !== closedEventsForJob[0]
          || closingStops.length === 0
          || entries.indexOf(closedEventsForJob[0]) <= Math.max(...closingStops.map(item => entries.indexOf(item))))) {
        return reconciliationRequired();
      }
    }

    const closedEvents = entries.filter(item => item.type === 'job-closed');
    if (closedEvents.length > 1 || (closedEvents.length === 1 && entries.at(-1) !== closedEvents[0])) {
      return reconciliationRequired();
    }
    const terminal = closedEvents.length === 1;
    const blocked = entries.some(item => item.type === 'contract-mapping-blocked');
    const dispatched = entries.some(item => item.type === 'dispatch-started');
    const outcomeRecorded = entries.some(item => item.type === 'provider-outcome');
    const budgetExhausted = entries.some(item => item.type === 'budget-exhausted');
    if (terminal) return recoveryDiagnostic(trailingNoResultAttempt
      ? blocked ? 'contract-mapping-blocked'
        : budgetExhausted ? 'budget-exhausted' : 'closed-without-result'
      : jobScopedBudgetStops?.length > 0 ? 'budget-exhausted'
        : resultPrepared.length > 0 ? 'terminal'
          : blocked ? 'contract-mapping-blocked'
          : budgetExhausted ? 'budget-exhausted' : 'closed-without-result');

    const resumeClassification = classifyResumeCandidate(jobId, entries, admitted, verifiedBlobs);
    if (resumeClassification) {
      if (resumeClassification.candidate) onCandidate?.(resumeClassification.candidate);
      return recoveryDiagnostic(resumeClassification.status);
    }
    const clock = safeClock(runtime);
    const deadlineUnverifiable = !clock || clock.epochId !== admitted.clock_epoch_id
      || !Number.isSafeInteger(admitted.deadline_monotonic_ms);
    const deadlineExpired = !deadlineUnverifiable && clock.now >= admitted.deadline_monotonic_ms;
    return recoveryDiagnostic(blocked ? 'contract-mapping-blocked'
      : deadlineUnverifiable ? 'deadline-unverifiable'
        : budgetExhausted || deadlineExpired ? 'budget-exhausted'
          : dispatched && !outcomeRecorded ? 'execution-unresolved' : 'read-only-inspection-required');
  }
  function inspectRecovery(jobId) {
    return inspectRecoveryCore(jobId);
  }

  return Object.freeze({ submit, retry, resume, closeJob, inspectRecovery });
}

export function createOfflineOrchestrationPrototype({ executionAuthorityProvider, syntheticContextReaders,
  contextUseAuthorityProvider, resumeTimeAuthority, store } = {}) {
  if ((store !== undefined && !(store instanceof LocalFilePrototypeStore))
    || (resumeTimeAuthority !== undefined && !(store instanceof LocalFilePrototypeStore))) {
    throw new OfflineOrchestrationError('RESUME_STORE_UNAVAILABLE');
  }
  return createRunner({ executionAuthorityProvider, syntheticContextReaders, contextUseAuthorityProvider,
    resumeTimeAuthority, store });
}

/** Internal factory for deterministic tests; never exported from the package entry point. */
export function createOfflineOrchestrationPrototypeForTest(seams = {}) {
  return createRunner(seams);
}
