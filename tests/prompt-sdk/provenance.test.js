import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { canonicalJson, createMockContextPackage, createMockContextAuthorization, renderPromptWithContextPackage, validateExecutionDocument } from '../../src/prompt-sdk/index.js';
import { createExecutionRequest, renderPrompt, executePrompt, MockTextAdapter, LocalExecutionObserver, createExecutionProvenance, validateExecutionProvenance, processStructuredOutput } from '../../src/prompt-sdk/index.js';
const definition = JSON.parse(await readFile(new URL('../fixtures/prompt-definition.json', import.meta.url)));
test('public context package/source versions survive; non-public packages are counted only', async () => {
  for (const classification of ['public', 'internal']) {
    const prompt = structuredClone(definition);
    prompt.template.messages[0].parts[0].text = 'Describe the item using supplied context.';
    prompt.context_slots.push({ name: 'context_facts', description: 'Facts', required: true, accepted_classifications: [classification], accepted_media_types: ['application/json'], max_bytes: 100 });
    prompt.template.messages[1].parts.push({ type: 'context', slot: 'context_facts', format: 'json' });
    const packageDocument = createMockContextPackage();
    packageDocument.manifest.classification = classification;
    packageDocument.manifest.sources.forEach(source => { source.classification = classification; });
    packageDocument.manifest.sections.forEach(section => { section.classification = classification; });
    prompt.context_slots[0].accepted_classifications = [classification];
    const bytes = canonicalJson(packageDocument.manifest);
    packageDocument.manifest_identity = { canonicalization: 'studio-json-v1', byte_size: Buffer.byteLength(bytes), sha256: 'sha256:' + createHash('sha256').update(bytes).digest('hex') };
    const rendered = renderPromptWithContextPackage(prompt, { inputValues: { item: 'synthetic', attributes: {} }, packageDocument, authorization: createMockContextAuthorization({ promptId: prompt.id, promptVersion: prompt.version }), at: '2026-08-20T12:00:00Z' });
    const input = createExecutionRequest(rendered, request());
    const observer = new LocalExecutionObserver();
    await executePrompt(input, { adapter: new MockTextAdapter(), observer });
    const record = observer.snapshot()[0].record;
    assert.equal(record.contexts.length, classification === 'public' ? 2 : 0);
    assert.equal(record.redacted_context_count, classification === 'public' ? 0 : 2);
    if (classification === 'public') {
      assert.equal(record.contexts[0].package.version, '1.0.0');
      assert.equal(record.contexts[0].sources[0].version, '1.0.0');
    }
    assert.doesNotMatch(JSON.stringify(record), /evidence_reference|authority_reference|Synthetic approved note/);
  }
});
function request(overrides = {}, classification = 'public') {
  const prompt = structuredClone(definition);
  prompt.inputs[0].classification = classification;
  return createExecutionRequest(renderPrompt(prompt, { inputValues: { item: 'SECRET_INPUT', attributes: {} } }), {
    execution_id: 'exec_observer', correlation_id: 'build_observer', idempotency_key: 'SECRET_KEY',
    target: { adapter_id: 'studio.mock.text', provider_id: 'studio-mock', model_id: 'mock-text-v1' },
    capabilities: { required: ['text-generation'], optional: [] }, parameters: { stop_sequences: ['SECRET_STOP'] },
    expected_output: { kind: 'text', media_type: 'text/plain', validation: 'none' },
    delegation: { caller_id: 'test', human_owner: 'owner', purpose: 'SECRET_PURPOSE', authority_reference: 'https://example.invalid/SECRET_AUTH' },
    observability: { retention: 'metadata-only', capture_prompt: false, capture_output: false }, ...overrides
  });
}
test('observer captures effective defaults, versions, timing and usage without strings or bodies', async () => {
  const input = request();
  const observer = new LocalExecutionObserver();
  const adapter = new MockTextAdapter({ content: 'SECRET_OUTPUT', provider_request_id: 'SECRET_PROVIDER', warnings: [{ code: 'PROVIDER_WARNING', message: 'SECRET_WARNING', details: { secret: 'SECRET_DETAILS' } }] });
  const result = await executePrompt(input, { adapter, observer, clock: () => 0, provenance: { validation: { valid: true, diagnostics: [{ severity: 'warning', message: 'SECRET_LINT', path: '/SECRET_PATH' }] } } });
  assert.equal(result.status, 'succeeded');
  const [envelope] = observer.snapshot();
  assert.ok(validateExecutionProvenance(envelope));
  const record = envelope.record;
  assert.equal(record.prompt.version, definition.version);
  assert.equal(record.prompt.spec_version, '1.0.0');
  assert.equal(record.correlation_id, 'build_observer');
  assert.equal(record.parameters.max_output_tokens, 256);
  assert.equal(record.parameters_status, 'resolved');
  assert.equal(record.stop_sequence_count, 1);
  assert.equal(record.usage.total_tokens, 22);
  assert.equal(record.validation.warnings, 1);
  assert.doesNotMatch(JSON.stringify(envelope), /SECRET_/);
  assert.deepEqual(createExecutionProvenance(input, result), createExecutionProvenance(input, result));
  envelope.record.status = 'failed';
  assert.equal(validateExecutionProvenance(envelope), false);
  assert.equal(observer.snapshot()[0].record.status, 'succeeded');
});
test('non-public and omit policies suppress content hashes', async () => {
  const input = request({}, 'restricted');
  const observer = new LocalExecutionObserver();
  const result = await executePrompt(input, { adapter: new MockTextAdapter(), observer });
  const record = observer.snapshot()[0].record;
  assert.equal(record.rendered, undefined);
  assert.equal(record.output, undefined);
  const publicInput = request();
  const publicResult = await executePrompt(publicInput, { adapter: new MockTextAdapter() });
  assert.equal(createExecutionProvenance(publicInput, publicResult, { contentIdentities: 'omit' }).record.rendered, undefined);
  assert.equal(createExecutionProvenance(input, result).record.validation.status, 'not-run');
});
test('manual provenance rejects unrelated target identities despite matching correlation ids', async () => {
  const input = request();
  const result = await executePrompt(input, { adapter: new MockTextAdapter() });
  for (const field of ['adapter_id', 'provider_id', 'model_id']) {
    const unrelated = structuredClone(result);
    unrelated.identity[field] = 'studio.unrelated.target';
    assert.equal(validateExecutionDocument(unrelated).valid, true);
    assert.throws(() => createExecutionProvenance(input, unrelated), /target mismatch/);
  }
});
test('manual provenance rejects classification downgrades and mismatched output contracts', async () => {
  const classifications = ['public', 'internal', 'confidential', 'restricted'];
  for (const classification of classifications) {
    const input = request({}, classification);
    const result = await executePrompt(input, { adapter: new MockTextAdapter() });
    for (const outputClassification of classifications) {
      const candidate = structuredClone(result);
      candidate.output.classification = outputClassification;
      assert.equal(validateExecutionDocument(candidate).valid, true);
      if (classifications.indexOf(outputClassification) < classifications.indexOf(classification)) {
        assert.throws(() => createExecutionProvenance(input, candidate), /classification downgrade/);
      } else {
        const record = createExecutionProvenance(input, candidate).record;
        assert.equal(record.output !== undefined, outputClassification === 'public');
      }
    }
    const candidate = structuredClone(result);
    Object.assign(candidate.output, { kind: 'json', media_type: 'application/json' });
    assert.equal(validateExecutionDocument(candidate).valid, true);
    assert.throws(() => createExecutionProvenance(input, candidate), /output contract mismatch/);
  }
});
test('target-mismatch preflight preserves failure and warns instead of recording unrelated identity', async () => {
  const input = request({ target: { adapter_id: 'studio.other.adapter', provider_id: 'studio-mock', model_id: 'mock-text-v1' } });
  const adapter = new MockTextAdapter();
  const observer = new LocalExecutionObserver();
  const result = await executePrompt(input, { adapter, observer });
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'EXECUTION_PREFLIGHT_REJECTED');
  assert.equal(adapter.calls.length, 0);
  assert.deepEqual(observer.snapshot(), []);
  assert.ok(result.warnings.some(warning => warning.code === 'OBSERVATION_DELIVERY_FAILED'));
  assert.throws(() => createExecutionProvenance(input, result), /target mismatch/);
});
test('observer records preflight, cancellation, timeout, and provider failures once', async () => {
  const cancelled = new AbortController(); cancelled.abort();
  const scenarios = [
    [request({ capabilities: { required: ['text-generation', 'unsupported'], optional: [] } }), {}, 'failed'],
    [request(), { signal: cancelled.signal }, 'cancelled'],
    [request({ timeout_ms: 1 }), { adapter: new MockTextAdapter({ delay_ms: 30 }) }, 'timed-out'],
    [request(), { adapter: new MockTextAdapter({ error: { category: 'internal', code: 'FAIL', message: 'SECRET_FAILURE', stage: 'adapter' } }) }, 'failed']
  ];
  for (const [input, options, status] of scenarios) {
    const observer = new LocalExecutionObserver();
    const result = await executePrompt(input, { adapter: new MockTextAdapter(), ...options, observer });
    assert.equal(result.status, status);
    assert.equal(observer.snapshot().length, 1);
    assert.equal(observer.snapshot()[0].record.status, status);
    assert.doesNotMatch(JSON.stringify(observer.snapshot()), /SECRET_/);
  }
});
test('sink rejection, mutation and timeout do not obscure success or retry provider', async () => {
  for (const observer of [{ observe() { throw new Error('SECRET_SINK'); } }, { observe() { return new Promise(() => {}); } }, { observe(record) { record.record.status = 'failed'; } }]) {
    const adapter = new MockTextAdapter();
    const result = await executePrompt(request(), { adapter, observer, observerTimeoutMs: 5 });
    assert.equal(result.status, 'succeeded');
    assert.equal(adapter.calls.length, 1);
    assert.ok(result.warnings.some(x => x.code === 'OBSERVATION_DELIVERY_FAILED'));
    assert.doesNotMatch(JSON.stringify(result.warnings), /SECRET_SINK/);
  }
});
test('local observer is bounded, isolated, and clearable', async () => {
  const observer = new LocalExecutionObserver({ capacity: 1 });
  await executePrompt(request(), { adapter: new MockTextAdapter(), observer });
  await executePrompt(request({ execution_id: 'exec_second' }), { adapter: new MockTextAdapter(), observer });
  assert.equal(observer.snapshot().length, 1);
  assert.equal(observer.snapshot()[0].record.execution_id, 'exec_second');
  observer.clear(); assert.deepEqual(observer.snapshot(), []);
});
test('structured-output success/failure revisions retain only matched outcome evidence', async () => {
  for (const content of ['{"secret":"SECRET_PARSED"}', '{bad']) {
    const input = request({ capabilities: { required: ['text-generation', 'structured-output'], optional: [] }, expected_output: { kind: 'json', media_type: 'application/json', validation: 'json-syntax' } });
    const result = await executePrompt(input, { adapter: new MockTextAdapter({ content }) });
    let structuredOutput;
    try { structuredOutput = processStructuredOutput(input, result, { processing_id: 'processing_test', rawRetention: 'identity-only', providerConstraintMode: 'adapter-emulated' }); }
    catch (error) { structuredOutput = error.failure; }
    const envelope = createExecutionProvenance(input, result, { structuredOutput });
    assert.equal(envelope.record.structured_output.status, content === '{bad' ? 'failed' : 'validated');
    assert.doesNotMatch(JSON.stringify(envelope), /SECRET_/);
    assert.throws(() => createExecutionProvenance(input, result, { structuredOutput: { ...structuredOutput, execution_id: 'other' } }), /mismatch/);
  }
});
