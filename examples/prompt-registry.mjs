#!/usr/bin/env node
import { createFilesystemPromptRegistry } from "../src/prompt-sdk/index.js";

const directory = process.argv[2];
if (!directory) {
  console.error("Usage: node examples/prompt-registry.mjs <approved-prompt-directory>");
  process.exitCode = 2;
} else {
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "example", path: directory }] });
  process.stdout.write(`${JSON.stringify(registry.discover(), null, 2)}\n`);
}
