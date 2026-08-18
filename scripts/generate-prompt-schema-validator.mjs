import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import standaloneCode from "ajv/dist/standalone/index.js";

const CONTRACT_COMMIT = "bd31b6249e068d3317306afb857d68024f2929be";
const SCHEMA_SHA256 = "6ac345956582d25c2db9c81b85cab9c73b2cbcfc79b8aac7a43d847c07173cb9";
const sourcePath = process.argv[2];
const outputPath = process.argv[3] ?? new URL("../src/prompt-sdk/generated/prompt-definition-v1-schema.js", import.meta.url);

if (!sourcePath) {
  console.error("Usage: node scripts/generate-prompt-schema-validator.mjs <prompt-definition.schema.json> [output]");
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
  const header = `// Generated from DefinitelySecureStudio/codex@${CONTRACT_COMMIT}\n// Source SHA-256: ${SCHEMA_SHA256}\n// Rebuild with scripts/generate-prompt-schema-validator.mjs; do not edit manually.\nimport { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\n`;
  await writeFile(outputPath, `${header}${standaloneCode(ajv, validate)}`, "utf8");
}
