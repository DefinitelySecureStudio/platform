import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';

const commit = '2301597014f6fefe8a3cf772e2e02527cda6a254';
const pins = [
  '4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3',
  'd81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617'
];
if (!process.argv[2] || !process.argv[3]) throw new Error('Supply pinned Builder and Context Package schema files.');
const schemas = await Promise.all(process.argv.slice(2, 4).map(async (path, i) => {
  const bytes = await readFile(path);
  if (createHash('sha256').update(bytes).digest('hex') !== pins[i]) throw new Error('Schema digest mismatch.');
  return JSON.parse(bytes);
}));
const ajv = new Ajv2020({ strict: true, strictRequired: false, strictTypes: false,
  allErrors: false, code: { source: true, esm: true, lines: true } });
addFormats(ajv);
for (const schema of schemas) ajv.addSchema(schema);
const validate = ajv.getSchema(schemas[0].$id + '#/$defs/request');
const output = process.argv[4] ?? new URL('../src/context-builder/generated/request-v1.js', import.meta.url);
await mkdir(new URL('../src/context-builder/generated/', import.meta.url), { recursive: true });
await writeFile(output, `// Generated from Codex ${commit}; released immutable contract.\n// Schema SHA-256: ${pins.join(', ')}\n// Rebuild with scripts/generate-builder-request-validator.mjs; do not edit.\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n` + standaloneCode(ajv, validate));
