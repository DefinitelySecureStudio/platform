import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parsePromptJson, validatePromptDefinition, renderPrompt, createExecutionRequest,
  executePrompt, MockTextAdapter, createFilesystemPromptRegistry, tryProcessStructuredOutput } from './index.js';
import { PromptRenderError, PromptRegistryError, ExecutionValidationError } from './index.js';

const commands = {
  inspect: ['registry', 'id', 'version'],
  render: ['inputs', 'allow-sensitive-output'],
  execute: ['inputs', 'execution-options', 'mock', 'adapter-module', 'allow-sensitive-output'],
  'validate-output': ['request', 'result', 'schema', 'processing-id', 'constraint-mode', 'allow-sensitive-output']
};
const flags = new Set(['mock', 'allow-sensitive-output']);
const help = `Usage: studio-prompt <command> [--format text|json]
  validate|lint <prompt.json|-> [...] [--warnings-as-errors]
  inspect <prompt.json>
  inspect --registry DIR --id ID --version EXACT_VERSION
  render <prompt.json> --inputs inputs.json
  execute <prompt.json> --inputs inputs.json --execution-options options.json
          (--mock | --adapter-module trusted-module.mjs)
  validate-output --request request.json --result result.json
          --processing-id ID --constraint-mode portable-only|adapter-emulated|provider-native [--schema schema.json]
Render, execute and validate-output require --allow-sensitive-output for non-public content.
Exit codes: 0 success, 1 validation/execution failure, 2 usage or I/O failure.
Adapter modules are trusted executable code; credentials belong in runtime configuration.`;
class CliError extends Error {
  constructor(code, message, exit = 2) { super(message); this.code = code; this.exit = exit; }
}
function parse(args) {
  const command = args[0];
  if (!commands[command]) throw new CliError('CLI_COMMAND', 'Choose inspect, render, execute, validate-output or validate; use --help.');
  const options = { format: 'text', files: [] };
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) { options.files.push(arg); continue; }
    const key = arg.slice(2);
    if (key !== 'format' && !commands[command].includes(key)) throw new CliError('CLI_OPTION', 'Unsupported option for this command; use --help.');
    if (Object.hasOwn(options, key) && key !== 'format') throw new CliError('CLI_OPTION', 'Options must not be repeated.');
    if (flags.has(key)) options[key] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new CliError('CLI_OPTION_VALUE', 'Option requires a value; use --help.');
      options[key] = value;
    }
  }
  if (!['text', 'json'].includes(options.format)) throw new CliError('CLI_FORMAT', 'Choose --format text or json.');
  const required = command === 'render' ? ['inputs'] : command === 'execute' ? ['inputs', 'execution-options'] : command === 'validate-output' ? ['request', 'result', 'processing-id', 'constraint-mode'] : options.registry ? ['id', 'version'] : [];
  for (const key of required) if (!options[key]) throw new CliError('CLI_REQUIRED_OPTION', 'Missing required --' + key + '; use --help.');
  const count = command === 'validate-output' || options.registry ? 0 : 1;
  if (options.files.length !== count) throw new CliError('CLI_SOURCE', count ? 'Provide exactly one prompt JSON file.' : 'This command uses named file options, not positional files.');
  if (command === 'inspect' && !options.registry && (options.id || options.version)) throw new CliError('CLI_REGISTRY', '--id and --version require --registry.');
  if (command === 'execute' && Boolean(options.mock) === Boolean(options['adapter-module'])) throw new CliError('CLI_ADAPTER', 'Select exactly one of --mock or --adapter-module.');
  if (command === 'validate-output' && !['portable-only', 'adapter-emulated', 'provider-native'].includes(options['constraint-mode'])) throw new CliError('CLI_CONSTRAINT_MODE', 'Choose a documented --constraint-mode.');
  return { command, options };
}
async function source(file) {
  try { return await readFile(file, 'utf8'); }
  catch { throw new CliError('SOURCE_READ', 'Cannot read an explicit input file; check its path and permissions.'); }
}
async function json(file) {
  const parsed = parsePromptJson(await source(file));
  if (parsed.value === undefined || parsed.diagnostics.some(entry => entry.severity === 'error')) throw new CliError('SOURCE_JSON', 'Input must be valid JSON without duplicate keys.', 1);
  return parsed.value;
}
function requirePublic(classification, options) {
  if (classification !== 'public' && !options['allow-sensitive-output']) throw new CliError('SENSITIVE_OUTPUT', 'Non-public output requires --allow-sensitive-output; use only a protected terminal or artifact destination.', 1);
}
function metadata(definition) {
  const { id, version, spec_version, name, lifecycle, owners, capabilities } = definition;
  return { id, version, spec_version, name, lifecycle, owners, capabilities };
}
async function run(command, options) {
  if (command === 'validate-output') {
    const request = await json(options.request), result = await json(options.result);
    requirePublic(request.rendered_prompt?.classification, options);
    requirePublic(result.output?.classification, options);
    const attempt = tryProcessStructuredOutput(request, result, {
      processing_id: options['processing-id'], rawRetention: 'identity-only',
      providerConstraintMode: options['constraint-mode'],
      ...(options.schema ? { schemaSource: await source(options.schema) } : {})
    });
    // Normalized output is intentional command output, never an error log.
    if (!attempt.ok) throw new CliError('STRUCTURED_OUTPUT_INVALID', 'Structured output validation failed; check execution identity, expected schema, raw JSON and constraint mode.', 1);
    return { valid: true, structured_output: attempt.result };
  }
  let definition, resolution;
  if (options.registry) {
    const registry = await createFilesystemPromptRegistry({ roots: [{ id: 'cli', path: options.registry }] });
    const found = registry.resolve(options.id, options.version);
    definition = found.definition;
    resolution = found.metadata;
  } else definition = await json(options.files[0]);
  const validation = validatePromptDefinition(definition);
  if (!validation.valid) return { valid: false, validation };
  if (command === 'inspect') return { valid: true, metadata: metadata(definition), ...(resolution ? { resolution } : {}), validation };
  const inputs = await json(options.inputs);
  const rendered = renderPrompt(definition, inputs);
  requirePublic(rendered.renderedPrompt.classification, options);
  if (command === 'render') return { valid: true, rendered };
  const request = createExecutionRequest(rendered, await json(options['execution-options']));
  let adapter;
  if (options.mock) adapter = new MockTextAdapter();
  else {
    try {
      const module = await import(pathToFileURL(resolve(options['adapter-module'])).href);
      adapter = await module.createAdapter();
      if (typeof adapter?.describe !== 'function' || typeof adapter?.execute !== 'function') throw new TypeError('Invalid adapter interface');
    } catch { throw new CliError('ADAPTER_LOAD', 'Trusted adapter module must export createAdapter(); check runtime credentials and configuration.'); }
  }
  const result = await executePrompt(request, { adapter });
  if (result.output) requirePublic(result.output.classification, options);
  return { valid: result.status === 'succeeded', request, result };
}
export async function runAuthoringCommand(args) {
  if (args.length === 0 || args[0] === '--help' || args[0] === 'help') { console.log(help); return args.length ? 0 : 2; }
  let format = args.includes('--format') && args[args.indexOf('--format') + 1] === 'json' ? 'json' : 'text';
  let output, exit;
  try {
    const parsed = parse(args);
    format = parsed.options.format;
    output = await run(parsed.command, parsed.options);
    exit = output.valid ? 0 : 1;
  } catch (error) {
    // Never print arbitrary module errors, stacks, provider credentials or input values.
    const known = error instanceof CliError;
    const sdk = error instanceof PromptRenderError || error instanceof PromptRegistryError || error instanceof ExecutionValidationError;
    const guidance = error instanceof PromptRenderError
      ? 'Check inputValues/contextValues against prompt declarations, required fields, types and classifications.'
      : error instanceof PromptRegistryError
        ? 'Check the approved registry directory, .prompt.json filenames, prompt id and exact version.'
        : error instanceof ExecutionValidationError
          ? 'Check the execution-options file against the Provider Execution contract, including target, delegation and expected_output.'
          : 'SDK command failed. Check prompt declarations, fixture types, exact version, execution options and adapter configuration.';
    output = { valid: false, error: { code: known || sdk ? error.code : 'SDK_COMMAND_FAILED', message: known ? error.message : guidance } };
    exit = known ? error.exit : 1;
  }
  if (format === 'json') console.log(JSON.stringify(output, null, 2));
  else {
    console.log(output.valid ? 'PASS' : 'FAIL');
    if (output.error) console.log(output.error.code + ': ' + output.error.message);
    else console.log(JSON.stringify(output, null, 2));
  }
  return exit;
}
