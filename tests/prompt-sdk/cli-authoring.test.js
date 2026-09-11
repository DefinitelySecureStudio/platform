import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../../', import.meta.url));
const cli = 'src/prompt-sdk/cli.js';
const prompt = 'examples/cli/prompt.json', inputs = 'examples/cli/inputs.json', executionOptions = 'examples/cli/execution-options.json';
function run(args, json = true) {
  const result = spawnSync(process.execPath, [cli, ...args, ...(json ? ['--format', 'json'] : [])], { cwd, encoding: 'utf8' });
  assert.equal(result.signal, null);
  return { code: result.status, output: json ? JSON.parse(result.stdout) : result.stdout, stderr: result.stderr };
}
test('CLI supports help, inspect, lint, deterministic rendering and human output', () => {
  assert.match(run(['--help'], false).output, /validate-output/);
  const inspected = run(['inspect', prompt]);
  assert.equal(inspected.code, 0);
  assert.equal(inspected.output.metadata.version, '1.0.0');
  assert.equal(inspected.output.definition, undefined);
  assert.equal(run(['lint', prompt]).code, 0);
  const rendered = run(['render', prompt, '--inputs', inputs]);
  assert.equal(rendered.code, 0);
  assert.deepEqual(rendered, run(['render', prompt, '--inputs', inputs]));
  assert.match(run(['inspect', prompt], false).output, /PASS/);
});
test('CLI reports machine-readable usage, missing files, malformed inputs and adapter selection', () => {
  for (const args of [
    ['render', prompt], ['render', prompt, '--inputs'], ['inspect', prompt, '--mock'],
    ['execute', prompt, '--inputs', inputs, '--execution-options', executionOptions],
    ['execute', prompt, '--inputs', inputs, '--execution-options', executionOptions, '--mock', '--adapter-module', 'anything'],
    ['validate', '--unknown']
  ]) {
    const result = run(args);
    assert.equal(result.code, 2);
    assert.equal(result.output.valid, false);
  }
  assert.equal(run(['inspect', '/nonexistent/cli-prompt.json']).output.error.code, 'SOURCE_READ');
});
test('CLI executes explicitly selected mock and trusted module adapters', () => {
  const args = ['execute', prompt, '--inputs', inputs, '--execution-options', executionOptions];
  for (const adapter of [['--mock'], ['--adapter-module', 'examples/cli/mock-adapter.mjs']]) {
    const result = run([...args, ...adapter]);
    assert.equal(result.code, 0);
    assert.equal(result.output.result.status, 'succeeded');
    assert.equal(result.output.request.execution_id, 'exec_cli_example');
  }
  assert.equal(run([...args, '--adapter-module', '/missing/adapter.mjs']).output.error.code, 'ADAPTER_LOAD');
});
test('CLI protects non-public bodies, rejects duplicate JSON, and never echoes module errors', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'studio-cli-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const definition = JSON.parse(await readFile(join(cwd, prompt), 'utf8'));
  definition.inputs[0].classification = 'restricted';
  const privatePrompt = join(dir, 'prompt.json');
  await writeFile(privatePrompt, JSON.stringify(definition));
  assert.equal(run(['render', privatePrompt, '--inputs', inputs]).output.error.code, 'SENSITIVE_OUTPUT');
  assert.equal(run(['render', privatePrompt, '--inputs', inputs, '--allow-sensitive-output']).code, 0);
  const duplicate = join(dir, 'duplicate.json');
  await writeFile(duplicate, '{"id":1,"id":2}');
  assert.equal(run(['inspect', duplicate]).output.error.code, 'SOURCE_JSON');
  const module = join(dir, 'adapter.mjs');
  await writeFile(module, 'throw new Error("SECRET_RUNTIME_CREDENTIAL");');
  const result = run(['execute', prompt, '--inputs', inputs, '--execution-options', executionOptions, '--adapter-module', module]);
  assert.equal(result.code, 2);
  assert.doesNotMatch(JSON.stringify(result), /SECRET_RUNTIME_CREDENTIAL/);
});
test('CLI resolves exact registry versions and validates structured execution output', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'studio-cli-registry-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const definition = JSON.parse(await readFile(join(cwd, prompt), 'utf8'));
  const registryPrompt = join(dir, 'example.prompt.json');
  await writeFile(registryPrompt, JSON.stringify(definition));
  const inspect = run(['inspect', '--registry', dir, '--id', definition.id, '--version', definition.version]);
  assert.equal(inspect.code, 0);
  assert.equal(inspect.output.metadata.version, definition.version);
  assert.equal(run(['inspect', '--registry', dir, '--id', definition.id, '--version', '9.0.0']).code, 1);
  definition.output.kind = 'json'; definition.output.media_type = 'application/json';
  definition.capabilities.required.push('structured-output');
  await writeFile(registryPrompt, JSON.stringify(definition));
  const options = JSON.parse(await readFile(join(cwd, executionOptions), 'utf8'));
  options.capabilities.required.push('structured-output');
  options.expected_output = { kind: 'json', media_type: 'application/json', validation: 'json-syntax' };
  const optionsFile = join(dir, 'options.json');
  await writeFile(optionsFile, JSON.stringify(options));
  const executed = run(['execute', registryPrompt, '--inputs', inputs, '--execution-options', optionsFile, '--adapter-module', 'examples/cli/mock-adapter.mjs']);
  assert.equal(executed.code, 0);
  const requestFile = join(dir, 'request.json'), resultFile = join(dir, 'result.json');
  await writeFile(requestFile, JSON.stringify(executed.output.request));
  await writeFile(resultFile, JSON.stringify(executed.output.result));
  const args = ['validate-output', '--request', requestFile, '--result', resultFile, '--processing-id', 'processing_cli', '--constraint-mode', 'adapter-emulated'];
  assert.equal(run(args).code, 0);
  executed.output.result.output.content = '{broken';
  await writeFile(resultFile, JSON.stringify(executed.output.result));
  assert.equal(run(args).code, 1);
});
