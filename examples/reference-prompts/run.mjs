import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { renderPrompt, renderPromptWithContextPackage, createExecutionRequest, executePrompt,
  MockTextAdapter, LocalExecutionObserver, validatePromptDefinition, processStructuredOutput,
  createExecutionProvenance } from '../../src/prompt-sdk/index.js';
const read = async file => JSON.parse(await readFile(new URL(file, import.meta.url)));
export async function runReference(name, { invalidOutput = false, expiredContext = false } = {}) {
  if (!['text', 'structured', 'context'].includes(name)) throw new Error('Unknown reference');
  const definition = await read(name + '.prompt.json');
  const validation = validatePromptDefinition(definition);
  if (!validation.valid) throw new Error('Invalid reference definition');
  const inputs = await read('../cli/inputs.json');
  const rendered = name === 'context'
    ? renderPromptWithContextPackage(definition, { ...inputs, packageDocument: await read('context-package.json'), authorization: await read('context-authorization.json'), at: expiredContext ? '2026-08-23T00:00:00Z' : '2026-08-20T12:00:00Z' })
    : renderPrompt(definition, inputs);
  const options = await read('../cli/execution-options.json');
  options.execution_id = 'exec_reference_' + name;
  options.idempotency_key = 'idem_reference_' + name;
  options.correlation_id = 'build_reference';
  let schemaSource;
  if (name === 'structured') {
    schemaSource = await readFile(new URL('../../tests/fixtures/structured-output/reference-facts.schema.json', import.meta.url), 'utf8');
    options.capabilities.required.push('structured-output');
    options.expected_output = { kind: 'json', media_type: 'application/json', validation: 'json-schema', schema: {
      schema_id: JSON.parse(schemaSource).$id, repository: 'DefinitelySecureStudio/codex', contract: 'reference-facts', version: '1.0.0',
      tag: 'contract/reference-facts/v1.0.0', commit: '2222222222222222222222222222222222222222',
      artifact_uri: 'https://example.invalid/reference-facts.json', media_type: 'application/schema+json',
      byte_size: Buffer.byteLength(schemaSource), sha256: 'sha256:' + createHash('sha256').update(schemaSource).digest('hex')
    } };
  }
  const request = createExecutionRequest(rendered, options);
  const observer = new LocalExecutionObserver();
  const result = await executePrompt(request, {
    adapter: new MockTextAdapter({ content: name === 'structured' ? (invalidOutput ? '{"facts":"invalid"}' : '{"facts":[{"field":"color","value":"blue"}],"unknown_fields":[]}') : 'A synthetic blue cube.' }),
    observer, clock: () => 0, provenance: { validation }
  });
  if (result.status !== 'succeeded') throw new Error('Reference execution failed');
  let structured;
  if (name === 'structured') {
    structured = processStructuredOutput(request, result, { processing_id: 'processing_reference', rawRetention: 'identity-only', providerConstraintMode: 'adapter-emulated', schemaSource });
    await observer.observe(createExecutionProvenance(request, result, { validation, structuredOutput: structured }));
  }
  return {
    prompt: { id: definition.id, version: definition.version },
    // Non-public rendered/output bodies never enter snapshots.
    ...(name === 'context' ? {} : { rendered }),
    ...(structured ? { structured } : {}),
    provenance: observer.snapshot()
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await runReference(process.argv[2] ?? 'text'), null, 2));
}
