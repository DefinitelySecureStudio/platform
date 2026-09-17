import { renderPromptWithContextPackage, validateContextDocument, validateContextBinding,
  createExecutionRequest, executePrompt, createExecutionProvenance, processStructuredOutput } from '../prompt-sdk/index.js';
import { validateResult } from './generated/audit-v1.js';
import { equal, snapshot, time, validateInputs } from './request.js';

class HandoffError extends Error { constructor(code) { super('Context handoff failed.'); this.code = code; } }
const need = (value, code = 'HANDOFF_INVALID') => { if (!value) throw new HandoffError(code); };
const abort = signal => need(!signal?.aborted, 'CANCELLED');
const failure = error => Object.freeze({ status: 'failed', diagnostics: Object.freeze([
  Object.freeze({ stage: 'handoff', code: error instanceof HandoffError ? error.code : 'HANDOFF_INVALID', action: 'review-handoff' })]) });

async function obtain(provider, request, timeoutMs, signal) {
  abort(signal); const controller = new AbortController(); let timer, listener;
  try {
    const stop = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new HandoffError('USE_AUTHORIZATION_UNAVAILABLE')); }, timeoutMs);
      listener = () => { controller.abort(); reject(new HandoffError('CANCELLED')); };
      signal?.addEventListener('abort', listener, { once: true });
    });
    const response = await Promise.race([stop, Promise.resolve().then(() => provider(request, { signal: controller.signal }))]);
    abort(signal); return snapshot(response);
  } catch (e) { if (e instanceof HandoffError) throw e; throw new HandoffError('USE_AUTHORIZATION_UNAVAILABLE'); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', listener); }
}

/** Development-only integration. Builder and authority provider are trusted host configuration. */
export function createContextHandoff({ builder, mode, authorizationProvider, getTime, executionClock, timeoutMs = 1000 }) {
  need(['synthetic', 'production'].includes(mode) && builder?.authority_mode === mode
    && authorizationProvider?.mode === mode && typeof authorizationProvider.id === 'string'
    && authorizationProvider.id.length > 0 && typeof authorizationProvider.authorize === 'function'
    && typeof getTime === 'function' && Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60000);
  need(mode !== 'production' || !authorizationProvider.id.startsWith('studio.synthetic.'));
  const authorize = authorizationProvider.authorize.bind(authorizationProvider);

  async function prepare(input) {
    const { buildInput } = input, context = validateInputs(buildInput.request, buildInput.prompt, buildInput.callerId);
    const signal = buildInput.signal, values = snapshot(input.inputValues ?? {}), options = snapshot(input.executionOptions);
    const r = context.request; abort(signal);
    need(options.correlation_id === undefined || options.correlation_id === r.correlation_id);
    need(options.delegation?.purpose === r.purpose);
    need(options.expected_output?.kind === context.prompt.output.kind && options.expected_output?.media_type === context.prompt.output.media_type);
    const built = snapshot(await builder.build({ request: r, prompt: context.prompt, callerId: r.caller_id, signal }));
    abort(signal); need(validateResult(built));
    if (built.status !== 'prepared') throw new HandoffError('BUILD_FAILED');
    need(built.build_id === r.build_id && built.correlation_id === r.correlation_id && equal(built.request_identity, context.requestIdentity));
    const p = built.package, m = p.manifest;
    need(validateContextDocument(p).valid && equal(m.package, r.package) && equal(m.builder, r.builder)
      && m.purpose === r.purpose && m.authority_reference === r.preparation_reference && m.created_at === r.evaluation_time
      && time(m.review_after) <= time(r.review_after) && time(m.expires_at) <= time(r.expires_at)
      && m.sections.every(s => r.slots.some(slot => slot.name === s.slot)));
    const approvalRequest = snapshot({ build_id: r.build_id, correlation_id: r.correlation_id, caller_id: r.caller_id,
      request_identity: context.requestIdentity, package_identity: p.manifest_identity, package: m.package,
      target: r.target, purpose: r.purpose, sections: m.sections.map(s => s.slot), classification: m.classification,
      evidence_reference: built.evidence_reference });
    let last;
    const clock = async () => { const at = await getTime(); time(at); need(last === undefined || time(at) >= time(last), 'HANDOFF_STALE'); last = at; return at; };
    async function review(expected, useSignal = signal) {
      abort(useSignal); const response = await obtain(authorize, approvalRequest, timeoutMs, useSignal);
      need(equal(Object.keys(response).sort(), ['authorization', 'build_id', 'correlation_id', 'package_identity', 'request_identity'])
        && response.build_id === r.build_id && response.correlation_id === r.correlation_id
        && equal(response.request_identity, context.requestIdentity) && equal(response.package_identity, p.manifest_identity), 'USE_AUTHORIZATION_DENIED');
      const at = await clock(); abort(useSignal);
      need(time(at) < time(m.review_after) && time(at) < time(m.expires_at), 'HANDOFF_STALE');
      need(validateContextBinding(context.prompt, p, response.authorization, { at }).valid, 'USE_AUTHORIZATION_DENIED');
      need(expected === undefined || equal(response.authorization, expected), 'USE_AUTHORIZATION_CHANGED');
      return { authorization: response.authorization, at };
    }
    const approved = await review();
    const rendered = renderPromptWithContextPackage(context.prompt, { inputValues: values, packageDocument: p,
      authorization: approved.authorization, at: approved.at });
    const executionRequest = snapshot(createExecutionRequest(rendered, { ...options, correlation_id: r.correlation_id }));
    const handoff = snapshot({ build_id: r.build_id, correlation_id: r.correlation_id, request_identity: context.requestIdentity,
      package: m.package, package_identity: p.manifest_identity, target: r.target,
      evidence_reference: built.evidence_reference, authorization: { decision_id: approved.authorization.decision_id,
        authority_reference: approved.authorization.authority_reference }, execution_id: executionRequest.execution_id });
    return { built, handoff, executionRequest, review: useSignal => review(approved.authorization, useSignal), signal };
  }
  return Object.freeze({
    async prepare(input) {
      try { const p = await prepare(input); return Object.freeze({ status: 'prepared', build: p.built, handoff: p.handoff, executionRequest: p.executionRequest }); }
      catch (e) { return failure(e); }
    },
    async execute(input, { adapter, structuredOutput } = {}) {
      try {
        const processing = structuredOutput === undefined ? undefined : snapshot(structuredOutput);
        need(typeof executionClock === 'function');
        need(input.executionOptions?.expected_output?.kind !== 'json' || processing !== undefined, 'STRUCTURED_OUTPUT_OPTIONS_REQUIRED');
        const p = await prepare(input); let guardError;
        const guarded = { describe: () => adapter.describe(), async execute(request, options) {
          try { await p.review(options.signal); abort(options.signal); }
          catch (e) { guardError = e; throw e; }
          return adapter.execute(request, options);
        } };
        const result = await executePrompt(p.executionRequest, { adapter: guarded, signal: p.signal, clock: executionClock });
        if (guardError) throw guardError;
        need(result.status === 'succeeded', result.status === 'cancelled' ? 'CANCELLED' : 'EXECUTION_FAILED');
        let structured;
        if (p.executionRequest.expected_output.kind === 'json') {
          try { structured = processStructuredOutput(p.executionRequest, result, processing); }
          catch { throw new HandoffError('STRUCTURED_OUTPUT_INVALID'); }
        }
        const provenance = createExecutionProvenance(p.executionRequest, result, { structuredOutput: structured });
        return Object.freeze({ status: 'succeeded', handoff: p.handoff, build: p.built, executionRequest: p.executionRequest,
          execution: result, provenance, ...(structured ? { structured } : {}) });
      } catch (e) { return failure(e); }
    }
  });
}

// Explicit independently supplied synthetic approvals; never manufactures a matching grant.
export function createSyntheticUseAuthorizationProvider({ approvals }) {
  const records = snapshot(approvals); need(Array.isArray(records));
  return Object.freeze({ id: 'studio.synthetic.context-use', mode: 'synthetic', async authorize(request) {
    const matches = records.filter(x => x.build_id === request.build_id && x.correlation_id === request.correlation_id
      && equal(x.request_identity, request.request_identity) && equal(x.package_identity, request.package_identity));
    need(matches.length === 1, 'USE_AUTHORIZATION_DENIED'); return matches[0];
  } });
}
