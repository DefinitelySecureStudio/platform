import { performance } from 'node:perf_hooks';
import {
  canonicalJson, executePrompt, ExecutionValidationError, validateExecutionDocument
} from '../prompt-sdk/index.js';

const MAX_TIMER_DELAY_MS = 2_147_483_647;
const OPTION_NAMES = new Set(['adapter', 'preflightTimeoutMs', 'signal', 'clock', 'observer', 'observerTimeoutMs', 'provenance']);
const EXECUTION_REQUEST_KIND = 'execution-request';
const ADAPTER_DESCRIPTOR_KIND = 'provider-adapter-descriptor';

function requestKindValidation(validation) {
  const diagnostic = {
    severity: 'error',
    code: 'EXPECTED_EXECUTION_REQUEST',
    message: `Execution request must have kind "${EXECUTION_REQUEST_KIND}".`,
    path: '/kind',
    details: { expected: EXECUTION_REQUEST_KIND }
  };
  const diagnostics = [...validation.diagnostics, diagnostic].sort((left, right) =>
    (left.severity === 'error' ? 0 : 1) - (right.severity === 'error' ? 0 : 1)
    || left.path.localeCompare(right.path)
    || left.code.localeCompare(right.code)
    || left.message.localeCompare(right.message));
  return {
    ...validation,
    valid: false,
    summary: { errors: validation.summary.errors + 1, warnings: validation.summary.warnings },
    diagnostics
  };
}

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

function snapshotRequest(request) {
  const validation = validateExecutionDocument(request);
  if (!validation.valid) {
    throw new ExecutionValidationError('Execution request does not satisfy the provider-neutral contract.', validation);
  }
  if (request.kind !== EXECUTION_REQUEST_KIND) {
    throw new ExecutionValidationError(
      'Execution request does not satisfy the provider-neutral contract.',
      requestKindValidation(validation)
    );
  }
  try {
    return freezeDeep(JSON.parse(canonicalJson(request)));
  } catch {
    const currentValidation = validateExecutionDocument(request);
    if (!currentValidation.valid) {
      throw new ExecutionValidationError('Execution request does not satisfy the provider-neutral contract.', currentValidation);
    }
    throw new TypeError('Execution request could not be snapshotted as JSON.');
  }
}

function validateOptions(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object.');
  }

  let descriptors;
  try {
    descriptors = Object.getOwnPropertyDescriptors(options);
  } catch {
    throw new TypeError('options must be a plain data object.');
  }
  try {
    if (Object.getPrototypeOf(options) !== Object.prototype && Object.getPrototypeOf(options) !== null) {
      throw new TypeError();
    }
  } catch {
    throw new TypeError('options must be a plain data object.');
  }
  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string' || !OPTION_NAMES.has(key) || !Object.hasOwn(descriptors[key], 'value')) {
      throw new TypeError('options contain an unsupported or accessor property.');
    }
  }

  const value = key => descriptors[key]?.value;
  const adapter = value('adapter');
  if ((typeof adapter !== 'object' && typeof adapter !== 'function') || adapter === null) {
    throw new TypeError('adapter must implement describe() and execute().');
  }

  let describe;
  let execute;
  try {
    describe = adapter.describe;
    execute = adapter.execute;
  } catch {
    throw new TypeError('adapter must implement describe() and execute().');
  }
  if (typeof describe !== 'function' || typeof execute !== 'function') {
    throw new TypeError('adapter must implement describe() and execute().');
  }

  const preflightTimeoutMs = value('preflightTimeoutMs');
  if (!Number.isSafeInteger(preflightTimeoutMs) || preflightTimeoutMs < 1 || preflightTimeoutMs > MAX_TIMER_DELAY_MS) {
    throw new TypeError(`preflightTimeoutMs must be an integer from 1 to ${MAX_TIMER_DELAY_MS}.`);
  }

  const signal = value('signal');
  if (signal !== undefined && signal !== null) {
    try {
      if (typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function'
        || typeof signal.removeEventListener !== 'function') throw new TypeError();
    } catch {
      throw new TypeError('signal must be an AbortSignal.');
    }
  }

  const clock = value('clock');
  if (clock !== undefined && typeof clock !== 'function') throw new TypeError('clock must be a function.');

  const observer = value('observer');
  const suppliedObserverTimeout = value('observerTimeoutMs');
  const observerTimeoutMs = suppliedObserverTimeout === undefined ? 1000 : suppliedObserverTimeout;
  const provenance = value('provenance');
  if (suppliedObserverTimeout !== undefined
    && (!Number.isSafeInteger(observerTimeoutMs) || observerTimeoutMs < 1 || observerTimeoutMs > 60000)) {
    throw new TypeError('Invalid observer or observer timeout.');
  }
  if (observer !== undefined) {
    if (typeof observer?.observe !== 'function') throw new TypeError('Invalid observer or observer timeout.');
    if (!Number.isSafeInteger(observerTimeoutMs) || observerTimeoutMs < 1 || observerTimeoutMs > 60000) {
      throw new TypeError('Invalid observer or observer timeout.');
    }
  }
  const provenanceSnapshot = observer === undefined ? undefined : snapshotProvenance(provenance);

  return {
    adapter, describe, execute: Function.prototype.bind.call(execute, adapter), preflightTimeoutMs,
    ...(signal === undefined ? {} : { signal }), ...(clock === undefined ? {} : { clock }),
    ...(observer === undefined ? {} : { observer, observerTimeoutMs, provenance: provenanceSnapshot })
  };
}

function snapshotDescriptor(descriptor) {
  try {
    const validation = validateExecutionDocument(descriptor);
    if (!validation.valid || descriptor?.kind !== ADAPTER_DESCRIPTOR_KIND) return undefined;
    return freezeDeep(JSON.parse(canonicalJson(descriptor)));
  } catch {
    // The SDK will classify this as an invalid descriptor through the facade.
    return undefined;
  }
}

function snapshotProvenance(provenance) {
  if (provenance === undefined) return {};
  if (provenance === null || typeof provenance !== 'object' || Array.isArray(provenance)) {
    throw new TypeError('provenance must be a JSON object.');
  }
  try {
    return freezeDeep(JSON.parse(canonicalJson(provenance)));
  } catch {
    throw new TypeError('provenance must be a JSON object.');
  }
}

function resultTiming(runtime, startedAt, startedMono) {
  const completedMono = runtime.now();
  const completedAt = Math.max(startedAt, runtime.wallNow());
  return {
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date(completedAt).toISOString(),
    duration_ms: Math.max(0, Math.round(completedMono - startedMono))
  };
}

function hostStop(status, timing) {
  return Object.freeze({ kind: 'preflight-stop', status, preflight_timing: timing });
}

function stoppedStatus({ now, deadline, timedOut, signal, cancelled }) {
  if (timedOut || now() >= deadline) return 'timed-out';
  if (cancelled || signal?.aborted) return 'cancelled';
  return undefined;
}

const defaultRuntime = Object.freeze({
  now: () => performance.now(),
  wallNow: () => Date.now(),
  setTimer: (callback, delay) => setTimeout(callback, delay),
  clearTimer: timer => clearTimeout(timer)
});

/** Internal dependency-injected form used to test deadline and tie behavior deterministically. */
export async function executePromptWithPreflightUsing(request, options, runtime = defaultRuntime) {
  // Validation must see the original value before snapshotting so malformed input
  // keeps the Prompt SDK's normal validation error and diagnostics.
  const requestSnapshot = snapshotRequest(request);
  const invocation = validateOptions(options);
  const { adapter, describe, execute, preflightTimeoutMs, signal } = invocation;

  const startedAt = runtime.wallNow();
  const startedMono = runtime.now();
  if (signal?.aborted) return hostStop('cancelled', resultTiming(runtime, startedAt, startedMono));

  const deadline = startedMono + preflightTimeoutMs;
  let timer;
  let listener;
  let timedOut = false;
  let cancelled = false;
  let resolveStop;
  const stop = new Promise(resolve => { resolveStop = resolve; });
  const clear = () => {
    if (timer !== undefined) runtime.clearTimer(timer);
    if (listener) signal?.removeEventListener('abort', listener);
    timer = undefined;
    listener = undefined;
  };
  const status = () => stoppedStatus({ now: runtime.now, deadline, timedOut, signal, cancelled });

  try {
    timer = runtime.setTimer(() => {
      timedOut = true;
      resolveStop({ kind: 'stop' });
    }, preflightTimeoutMs);
    if (signal) {
      listener = () => {
        cancelled = true;
        resolveStop({ kind: 'stop' });
      };
      signal.addEventListener('abort', listener, { once: true });
    }

    if (signal?.aborted) {
      cancelled = true;
      resolveStop({ kind: 'stop' });
    }

    const descriptorOutcome = Promise.resolve()
      .then(() => Reflect.apply(describe, adapter, []))
      .then(value => ({ kind: 'descriptor', value }), error => ({ kind: 'description-error', error }));
    const settled = await Promise.race([descriptorOutcome, stop]);

    let stopped = status();
    if (stopped) return hostStop(stopped, resultTiming(runtime, startedAt, startedMono));

    const descriptorSnapshot = settled.kind === 'descriptor' ? snapshotDescriptor(settled.value) : undefined;
    stopped = status();
    if (stopped) return hostStop(stopped, resultTiming(runtime, startedAt, startedMono));

    const facade = Object.freeze({
      describe() {
        if (settled.kind === 'description-error') throw settled.error;
        return descriptorSnapshot;
      },
      execute
    });
    const sdkOptions = {
      adapter: facade,
      ...(invocation.signal === undefined ? {} : { signal: invocation.signal }),
      ...(invocation.clock === undefined ? {} : { clock: invocation.clock }),
      ...(invocation.observer === undefined ? {} : {
        observer: invocation.observer,
        observerTimeoutMs: invocation.observerTimeoutMs,
        provenance: invocation.provenance
      })
    };

    // Clear resources before handoff, then make the final deadline/signal check
    // immediately before calling the SDK. The SDK call is synchronous up to its
    // first await, and the caller signal remains in its invocation options.
    clear();
    const preflightTiming = resultTiming(runtime, startedAt, startedMono);
    stopped = status();
    if (stopped) return hostStop(stopped, resultTiming(runtime, startedAt, startedMono));
    const result = await executePrompt(requestSnapshot, sdkOptions);
    return Object.freeze({ kind: 'execution', result, preflight_timing: preflightTiming });
  } finally {
    clear();
  }
}

/**
 * Bound host-side descriptor acquisition without changing Provider Execution
 * v1's request timeout or execution result.
 */
export async function executePromptWithPreflight(request, options) {
  return executePromptWithPreflightUsing(request, options);
}
