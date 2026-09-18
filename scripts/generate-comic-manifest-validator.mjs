import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { COMIC_MANIFEST_CONTRACT as pin } from '../src/comic-manifest/contract.js';
const require = createRequire(import.meta.url);
const expected = { ajv: '8.20.0', 'ajv-formats': '3.0.1' };
const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url)));
for (const [name, version] of Object.entries(expected)) {
  if (require(`${name}/package.json`).version !== version || lock.packages[`node_modules/${name}`].version !== version) {
    throw new Error('Validator dependency version mismatch.');
  }
}
const source = process.argv[2];
if (!source) throw new Error('Supply the exact reviewed Comic Manifest schema file.');
const bytes = await readFile(source);
if (bytes.length !== pin.byte_size || 'sha256:' + createHash('sha256').update(bytes).digest('hex') !== pin.sha256) {
  throw new Error('Schema identity mismatch.');
}
const schema = JSON.parse(bytes);
const ajv = new Ajv2020({ strict: true, strictRequired: false, strictTypes: false,
  allErrors: false, ownProperties: true, code: { source: true, esm: true, lines: true } });
addFormats(ajv);
ajv.addSchema(schema);
const exports = Object.fromEntries(['production', 'result', 'release', 'approval'].map(name => [name, `${schema.$id}#/$defs/${name}`]));
const header = `// Generated from ${pin.repository}@${pin.commit}; unreleased reviewed candidate.\n// Source ${pin.sha256}; ${pin.byte_size} bytes.\n// Rebuild with scripts/generate-comic-manifest-validator.mjs; do not edit.\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n`;
const output = process.argv[3] ?? new URL('../src/comic-manifest/generated/schema-v1.js', import.meta.url);
await writeFile(output, header + standaloneCode(ajv, exports));
