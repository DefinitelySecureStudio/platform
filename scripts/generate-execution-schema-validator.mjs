import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";

const CONTRACT_COMMIT = "dfd31a693674dc03dec4784dcdd1345f647cff1e";
const SCHEMA_SHA256 = "4366665b89d7633974c4be15cac74f754e722b41031f708ca2f825ead892cb8b";
const sourcePath = process.argv[2];
const outputPath = process.argv[3] ?? new URL("../src/prompt-sdk/generated/provider-execution-v1-schema.js", import.meta.url);

if (!sourcePath) {
  console.error("Usage: node scripts/generate-execution-schema-validator.mjs <provider-execution.schema.json> [output]");
  process.exitCode = 2;
} else {
  const bytes = await readFile(sourcePath);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== SCHEMA_SHA256) {
    throw new Error(`Schema digest mismatch: expected ${SCHEMA_SHA256}, received ${digest}`);
  }

  const schema = JSON.parse(bytes.toString("utf8"));
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    strictTypes: false,
    allowUnionTypes: true,
    code: { source: true, esm: true, lines: true }
  });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const header = `// Generated from DefinitelySecureStudio/codex@${CONTRACT_COMMIT}\n// Source SHA-256: ${SCHEMA_SHA256}\n// Rebuild with scripts/generate-execution-schema-validator.mjs; do not edit manually.\nimport { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\n`;
  await writeFile(outputPath, `${header}${standaloneCode(ajv, validate)}`, "utf8");
}
