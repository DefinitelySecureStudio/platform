import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";

const CONTRACT_COMMIT = "8cf6297b5180ca201328f45681417c10771e4e1a";
const SCHEMA_SHA256 = "7c0aaa6698c782e54779a0099cf13f8e163aa9559ae4765df58d3061b22e6334";
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
