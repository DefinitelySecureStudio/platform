#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { stdin } from "node:process";
import { CONTRACT } from "./diagnostics.js";
import { parsePromptJson } from "./parse-json.js";
import { validatePromptDefinitions } from "./validate.js";

function usage() {
  console.error("Usage: studio-prompt validate [--format json|text] [--warnings-as-errors] [--supported-capability NAME] [--supported-extension NAME] <file.json|-> [...]");
}

async function readSource(path) {
  if (path !== "-") return readFile(path, "utf8");
  let source = "";
  stdin.setEncoding("utf8");
  for await (const chunk of stdin) source += chunk;
  return source;
}

function parseArguments(arguments_) {
  const options = { format: "text", warningsAsErrors: false, supportedCapabilities: ["text-generation", "structured-output"], supportedExtensions: [], files: [] };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--warnings-as-errors") options.warningsAsErrors = true;
    else if (argument === "--format") options.format = arguments_[++index];
    else if (argument === "--supported-capability") options.supportedCapabilities.push(arguments_[++index]);
    else if (argument === "--supported-extension") options.supportedExtensions.push(arguments_[++index]);
    else if (argument.startsWith("-") && argument !== "-") throw new Error(`Unknown option: ${argument}`);
    else options.files.push(argument);
  }
  if (!new Set(["json", "text"]).has(options.format)) throw new Error("--format must be json or text");
  if (options.supportedCapabilities.some((name) => typeof name !== "string" || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/u.test(name))) throw new Error("Supported capability names must use the Prompt Definition capability syntax");
  if (options.supportedExtensions.some((name) => typeof name !== "string" || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/u.test(name))) throw new Error("Supported extension names must use a namespaced Prompt Definition extension syntax");
  if (options.files.length === 0) throw new Error("At least one prompt JSON file is required");
  if (options.files.filter((file) => file === "-").length > 1) throw new Error("Standard input can be read only once");
  return options;
}

function stripDocumentIndex(path) {
  return path.replace(/^\/\d+/u, "");
}

async function main() {
  if (process.argv[2] !== "validate") { usage(); return 2; }
  let options;
  try { options = parseArguments(process.argv.slice(3)); }
  catch (error) { console.error(error.message); usage(); return 2; }

  const documents = [];
  const parsedDefinitions = [];
  const sourceByDefinition = [];
  for (const sourceName of options.files) {
    let source;
    try { source = await readSource(sourceName); }
    catch { documents.push({ source: sourceName, diagnostics: [{ severity: "error", code: "SOURCE_READ", message: "Prompt source could not be read.", path: "", details: {} }] }); continue; }
    const parsed = parsePromptJson(source);
    documents.push({ source: sourceName, diagnostics: [...parsed.diagnostics] });
    if (parsed.value !== undefined) {
      sourceByDefinition.push(documents.length - 1);
      parsedDefinitions.push(parsed.value);
    }
  }

  const validated = validatePromptDefinitions(parsedDefinitions, options);
  for (const entry of validated.diagnostics) {
    const match = /^\/(\d+)/u.exec(entry.path);
    const definitionIndex = match ? Number(match[1]) : 0;
    const documentIndex = sourceByDefinition[definitionIndex];
    if (documentIndex !== undefined) documents[documentIndex].diagnostics.push({ ...entry, path: stripDocumentIndex(entry.path) });
  }
  const diagnostics = documents.flatMap((document) => document.diagnostics.map((entry) => ({ source: document.source, ...entry })))
    .sort((left, right) => left.source.localeCompare(right.source) || left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
  const errors = diagnostics.filter(({ severity }) => severity === "error").length;
  const warnings = diagnostics.length - errors;
  const valid = errors === 0 && (!options.warningsAsErrors || warnings === 0);
  const output = { valid, contract: CONTRACT, summary: { errors, warnings, warnings_as_errors: options.warningsAsErrors }, diagnostics };

  if (options.format === "json") console.log(JSON.stringify(output, null, 2));
  else {
    for (const entry of diagnostics) console.log(`${entry.source}:${entry.severity}:${entry.code}:${entry.path || "/"} ${entry.message}`);
    console.log(`${valid ? "PASS" : "FAIL"}: ${errors} error(s), ${warnings} warning(s)`);
  }
  return valid ? 0 : 1;
}

process.exitCode = await main();
