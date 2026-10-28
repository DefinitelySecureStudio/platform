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
import { renderOfflineComicPrompt } from './prompt.js';

const EXPECTED_PRODUCTION_ID = 'urn:uuid:10000000-0000-4000-8000-000000000001';
const EXPECTED_PRODUCTION_SHA256 = 'sha256:9250217ad23125b0356a9e7002f57a55dacf9d982f069caa403b89f8c6c234dc';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const MAX_TIMER_DELAY_MS = 2_147_483_647;
const RETRY_PROVIDER_CODE = 'RATE_LIMITED_BEFORE_ACCEPTANCE';

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
    if (!Number.isSafeInteger(retryAfter) || retryAfter < 1) {
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

function resultExecution(production, providerResult, outputDigest) {
  const prompt = production.inputs.prompts[0];
  return {
    tool: production.inputs.dependencies[0],
    workflow_id: 'synthetic-offline-orchestration-v1',
    run_uri: null,
    started_at: providerResult.timing.started_at,
    finished_at: providerResult.timing.completed_at,
    transformations: outputDigest ? [{
      step_id: 'mock-transcript',
      input_digests: [production.inputs.canon.artifact.sha256, prompt.identity.sha256],
      output_digests: [outputDigest],
      private_inputs_withheld: false,
      private_outputs_withheld: false
    }] : [],
    generation: [],
    reproducibility: 'exact',
    limitations: 'Synthetic offline prototype; no external generation or publication.'
  };
}

function buildComicResult({ production, productionReference, attemptId, resultId, providerResult,
  diagnostic, artifactUri, artifactBytes }) {
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
    spec_version: '1.0.0',
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
    execution: resultExecution(production, providerResult, artifactDigest),
    diagnostics: successful ? [] : [diagnostic]
  };
  return freezeDeep(result);
}

function eligibleRateLimit(providerResult) {
  return providerResult?.status === 'failed' && providerResult.error?.category === 'rate-limit'
    && providerResult.error.retryable === true
    && Number.isSafeInteger(providerResult.error.retry_after_ms)
    && providerResult.error.retry_after_ms >= 1
    && providerResult.error.provider?.code === RETRY_PROVIDER_CODE
    && providerResult.output === undefined;
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
  mockAdapterFactory = defaultMockFactory, onMockCall } = {}) {
  let openJob;
  let running = false;
  const usedIds = new Set();

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
    attempt.completedMonotonicMs = safeClock(runtime)?.now;
    job.attempts.push(attempt);
    job.state = 'attempt-terminal';
    const isEligibleRetry = job.attempts.length === 1 && job.retryOpen && eligibleRateLimit(attempt.providerResult);
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

    // Current Comic Manifest semantics require an internal transformation to
    // identify a verified output digest. A no-output failed/cancelled result
    // cannot satisfy that rule without inventing an output or changing the
    // released candidate validator, so preserve the host outcome only.
    if (!artifactBytes && job.production.value.classification !== 'public') {
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
      artifactBytes: artifact?.bytes
    });
    const resultSource = canonicalJson(result);
    const validation = validateComicManifest(resultSource);
    const compatible = validateComicOutputCompatibility(job.production.canonical, resultSource);
    if (!validation.valid || !compatible.valid) {
      return blockComicMapping('comic-result-validation-rejected');
    }

    attempt.resultId = resultId;
    attempt.providerCorrelationId = correlationId;
    job.retryOpen = eligibleRateLimit(providerResult);
    const terminal = persistResult(job, attempt, result, artifact);
    if (terminal.kind === 'terminal' && job.retryOpen && job.state === 'retry-eligible') {
      // Keep the exact original retry boundary in the job; no other attempt can start.
      job.retryNotBefore = checkedAdd(attempt.completedMonotonicMs ?? safeClock(runtime).now,
        providerResult.error.retry_after_ms);
    }
    return terminal;
  }

  async function performAttempt(job, { correlationId, mockOutcome, signal, retryOfAttemptId, preflight } = {}) {
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
        // The marker is durable in the prototype store before this sole mock call.
        const outcome = await mock.execute(effectiveRequest, { signal: sdkSignal ?? controller.signal });
        if (typeof outcome?.content === 'string') {
          assertAtMost(Buffer.byteLength(outcome.content, 'utf8'),
            OFFLINE_ORCHESTRATION_LIMITS.maxNormalizedOutputBytesPerCall, 'NORMALIZED_OUTPUT_LIMIT_EXCEEDED');
        }
        return outcome;
      }
    });

    const wallStart = runtime.wallNow();
    if (!Number.isSafeInteger(wallStart) || !Number.isFinite(new Date(wallStart).getTime())) {
      runtime.clearTimer(timer);
      if (cancelListener) cancellation.removeEventListener('abort', cancelListener);
      return markUnresolved(job, 'deadline-unverifiable');
    }
    let lastWallTime = wallStart;
    const executionWallClock = () => {
      const nextWallTime = runtime.wallNow();
      if (!Number.isSafeInteger(nextWallTime) || !Number.isFinite(new Date(nextWallTime).getTime())
        || nextWallTime < lastWallTime) {
        throw new OfflineOrchestrationError('WALL_CLOCK_UNVERIFIABLE');
      }
      lastWallTime = nextWallTime;
      return nextWallTime;
    };
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
      runtime.clearTimer(timer);
      if (cancelListener) cancellation.removeEventListener('abort', cancelListener);
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
    const { productionSource, correlation_id: correlationIdInput, signal, mockOutcome } = optionValues(
      options, new Set(['productionSource', 'correlation_id', 'signal', 'mockOutcome']), 'INVALID_SUBMIT_OPTIONS'
    );
    if (running) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    if (openJob && !openJob.closed) throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
    let storedJobIds;
    try { storedJobIds = store.readJobIds(); } catch { throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED'); }
    if (!Array.isArray(storedJobIds)) throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED');
    for (const jobId of storedJobIds) {
      let entries;
      try { entries = store.readEvents(jobId); } catch { throw new OfflineOrchestrationError('JOB_STATE_UNRESOLVED'); }
      if (entries === UNKNOWN_STORE_STATE || !Array.isArray(entries)
        || entries.filter(item => item.type === 'admitted').length !== 1
        || !entries.some(item => item.type === 'job-closed')) {
        throw new OfflineOrchestrationError('JOB_ALREADY_ACTIVE');
      }
    }
    running = true;
    try {
      const cancellation = cancellationSignal(signal);
      if (cancellation?.aborted) return freezeDeep({ kind: 'host-outcome', status: 'cancelled-before-admission' });
      const correlationId = safeCorrelationId(correlationIdInput);
      const production = readProduction(productionSource);
      const renderedPrompt = renderOfflineComicPrompt(production.value);
      assertAtMost(renderedPrompt.byteSize, OFFLINE_ORCHESTRATION_LIMITS.maxPromptBytesPerAttempt, 'PROMPT_LIMIT_EXCEEDED');
      const initialClock = safeClock(runtime);
      if (!initialClock) return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });
      const deadlineMonotonicMs = checkedAdd(initialClock.now, OFFLINE_ORCHESTRATION_LIMITS.jobBudgetMs);
      if (deadlineMonotonicMs === undefined) return freezeDeep({ kind: 'host-outcome', status: 'deadline-unverifiable' });

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

      const jobId = idFrom(idFactory, usedIds, 'resource');
      const job = {
        jobId,
        production,
        renderedPrompt,
        promptBytes,
        ledger,
        clockEpochId: initialClock.epochId,
        admittedMonotonicMs: initialClock.now,
        deadlineMonotonicMs,
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
        return markUnresolved(job);
      }
      const promptKey = `prompt:${jobId}`;
      if (!writeConfirmedOnce(store, promptKey, promptBytes)
        || !readBackBlob(promptKey, promptBytes, renderedPrompt.sha256)) {
        return markUnresolved(job);
      }
      const admitted = event(jobId, 'admitted', {
        production: production.reference,
        input_key: inputKey,
        input_byte_size: productionBytes.byteLength,
        input_sha256: production.identity.sha256,
        prompt_key: promptKey,
        prompt_byte_size: promptBytes.byteLength,
        prompt_sha256: renderedPrompt.sha256,
        admitted_monotonic_ms: initialClock.now,
        clock_epoch_id: initialClock.epochId,
        deadline_monotonic_ms: deadlineMonotonicMs,
        limits: OFFLINE_ORCHESTRATION_LIMITS,
        material: ledger.snapshot
      });
      if (!appendConfirmed(store, jobId, admitted)) return markUnresolved(job);
      job.state = 'admitted';
      // Reuse the exact preflighted MockTextAdapter instance and descriptor.
      return await performAttempt(job, { correlationId, mockOutcome, signal, preflight: { mock: preflightMock, descriptor } });
    } catch (error) {
      if (error instanceof OfflineOrchestrationError) throw error;
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
    running = true;
    try {
      // Identity is pinned in the job and cannot be replaced on retry.
      return await performAttempt(job, {
        correlationId: job.lastAttempt.providerCorrelationId,
        mockOutcome,
        signal,
        retryOfAttemptId: job.lastAttempt.attemptId
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

  function inspectRecovery(jobId) {
    if (typeof jobId !== 'string' || !jobId) throw new OfflineOrchestrationError('INVALID_JOB_ID');
    let entries;
    try { entries = store.readEvents(jobId); } catch {
      return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
    }
    if (entries === UNKNOWN_STORE_STATE || !Array.isArray(entries)) {
      return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
    }
    if (entries.length === 0) return freezeDeep({ kind: 'recovery-inspection', status: 'not-found', job_id: jobId, read_only: true });
    const admitted = entries.find(item => item.type === 'admitted');
    if (!admitted || entries.filter(item => item.type === 'admitted').length !== 1) {
      return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
    }
    const verifyBlob = (key, expectedSize, expectedSha) => {
      let bytes;
      try { bytes = store.readImmutable(key); } catch { return false; }
      return bytes !== UNKNOWN_STORE_STATE && Buffer.isBuffer(bytes)
        && bytes.byteLength === expectedSize && digest(bytes) === expectedSha;
    };
    if (!verifyBlob(admitted.input_key, admitted.input_byte_size, admitted.input_sha256)
      || !verifyBlob(admitted.prompt_key, admitted.prompt_byte_size, admitted.prompt_sha256)) {
      return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
    }
    for (const item of entries) {
      if (item.type === 'provider-outcome'
        && !verifyBlob(item.payload_key, item.byte_size, item.sha256)) {
        return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
      }
      if (item.type === 'persisting' || item.type === 'terminal') {
        let resultBytes;
        try { resultBytes = store.readImmutable(`result:${item.result_id}`); } catch {
          return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
        }
        if (resultBytes === UNKNOWN_STORE_STATE || !Buffer.isBuffer(resultBytes)
          || resultBytes.byteLength !== item.result_byte_size || digest(resultBytes) !== item.result_sha256) {
          return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
        }
        let result;
        try { result = JSON.parse(resultBytes.toString('utf8')); } catch {
          return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
        }
        for (const output of result.outputs ?? []) {
          const artifact = output.artifact;
          if (!artifact || !verifyBlob(`artifact:${artifact.artifact_uri}`, artifact.byte_size, artifact.sha256)) {
            return freezeDeep({ kind: 'recovery-inspection', status: 'reconciliation-required', job_id: jobId, read_only: true });
          }
        }
      }
    }
    const last = entries.at(-1);
    const terminal = entries.some(item => item.type === 'job-closed');
    const blocked = entries.some(item => item.type === 'contract-mapping-blocked');
    const dispatched = entries.some(item => item.type === 'dispatch-started');
    const outcomeRecorded = entries.some(item => item.type === 'provider-outcome');
    const budgetExhausted = entries.some(item => item.type === 'budget-exhausted');
    if (terminal) {
      return freezeDeep({ kind: 'recovery-inspection', status: 'terminal', last_lifecycle_event: last.type,
        job_id: jobId, read_only: true, writes_performed: 0, provider_calls_performed: 0 });
    }
    const clock = safeClock(runtime);
    const deadlineUnverifiable = !clock || clock.epochId !== admitted.clock_epoch_id
      || !Number.isSafeInteger(admitted.deadline_monotonic_ms);
    const deadlineExpired = !deadlineUnverifiable && clock.now >= admitted.deadline_monotonic_ms;
    return freezeDeep({ kind: 'recovery-inspection',
      status: blocked ? 'contract-mapping-blocked'
        : deadlineUnverifiable ? 'deadline-unverifiable'
          : budgetExhausted || deadlineExpired ? 'budget-exhausted'
            : dispatched && !outcomeRecorded ? 'execution-unresolved' : 'read-only-inspection-required',
      last_lifecycle_event: last.type,
      job_id: jobId,
      read_only: true,
      writes_performed: 0,
      provider_calls_performed: 0
    });
  }

  return Object.freeze({ submit, retry, closeJob, inspectRecovery });
}

export function createOfflineOrchestrationPrototype() {
  return createRunner();
}

/** Internal factory for deterministic tests; never exported from the package entry point. */
export function createOfflineOrchestrationPrototypeForTest(seams = {}) {
  return createRunner(seams);
}
