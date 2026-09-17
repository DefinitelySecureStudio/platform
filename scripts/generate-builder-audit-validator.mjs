import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
const pins = ['4adebedcef5a26e009e1d53ec9c480d372a31b73211fec1c53d6509ebc7929a3',
  'd81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617'];
if (!process.argv[2] || !process.argv[3]) throw Error('Supply pinned Builder and Context Package schemas.');
const schemas = await Promise.all(process.argv.slice(2, 4).map(async (path, i) => {
  const bytes = await readFile(path);
  if (createHash('sha256').update(bytes).digest('hex') !== pins[i]) throw Error('Schema digest mismatch.');
  return JSON.parse(bytes);
}));
const ajv = new Ajv2020({ strict: true, strictRequired: false, strictTypes: false,
  allErrors: false, code: { source: true, esm: true, lines: true } });
addFormats(ajv); schemas.forEach(s => ajv.addSchema(s));
const id = schemas[0].$id;
const code = standaloneCode(ajv, { validateResult: id + '#/$defs/result', validateReceipt: id + '#/$defs/receipt' });
await writeFile(process.argv[4] ?? new URL('../src/context-builder/generated/audit-v1.js', import.meta.url),
  `// Generated from Codex 2301597014f6fefe8a3cf772e2e02527cda6a254; released immutable contract.\n// SHA-256: ${pins.join(', ')}\n// Rebuild with scripts/generate-builder-audit-validator.mjs; do not edit.\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n` + code);
