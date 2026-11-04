import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { COMIC_BUILD_RESULT_CANDIDATE as pin } from '../src/comic-manifest/candidate-contract.js';
const require = createRequire(import.meta.url);
const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url)));
for (const [name, version] of Object.entries({ ajv: '8.20.0', 'ajv-formats': '3.0.1' })) {
  if (require(`${name}/package.json`).version !== version || lock.packages[`node_modules/${name}`].version !== version) throw new Error('Validator dependency mismatch');
}
const bytes = await readFile(process.argv[2]);
if (bytes.length !== pin.byte_size || 'sha256:' + createHash('sha256').update(bytes).digest('hex') !== pin.sha256) throw new Error('Candidate schema identity mismatch');
const schema = JSON.parse(bytes);
if (schema.$id !== pin.schema_id) throw new Error('Candidate schema ID mismatch');
const ajv = new Ajv2020({ strict: true, strictRequired: false, strictTypes: false, ownProperties: true, code: { source: true, esm: true, lines: true } });
addFormats(ajv);
ajv.addSchema(schema);
await writeFile(new URL('../src/comic-manifest/generated/result-v1.1-candidate.js', import.meta.url),
  `// Generated from local ${pin.repository}@${pin.commit}; ${pin.source_path}; ${pin.sha256}; ${pin.byte_size} bytes.\n// Unreleased candidate; rebuild with scripts/generate-comic-result-candidate.mjs.\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n` + standaloneCode(ajv, { result: schema.$id }));
