import { diagnostic } from "./diagnostics.js";

function duplicateKeyDiagnostics(source) {
  let index = 0;
  const diagnostics = [];
  const whitespace = /\s/u;

  function skipWhitespace() {
    while (whitespace.test(source[index] ?? "")) index += 1;
  }

  function scanString() {
    const start = index;
    index += 1;
    while (index < source.length) {
      if (source[index] === "\\") index += 2;
      else if (source[index++] === "\"") break;
    }
    return JSON.parse(source.slice(start, index));
  }

  function scanValue(path) {
    skipWhitespace();
    if (source[index] === "{") return scanObject(path);
    if (source[index] === "[") return scanArray(path);
    if (source[index] === "\"") { scanString(); return; }
    while (index < source.length && !/[\s,\]}]/u.test(source[index])) index += 1;
  }

  function scanObject(path) {
    index += 1;
    skipWhitespace();
    const keys = new Set();
    while (source[index] !== "}") {
      const key = scanString();
      if (keys.has(key)) {
        diagnostics.push(diagnostic("error", "DUPLICATE_JSON_KEY", `Duplicate JSON object member: ${key}.`, [...path, key], { name: key }));
      }
      keys.add(key);
      skipWhitespace();
      index += 1;
      scanValue([...path, key]);
      skipWhitespace();
      if (source[index] === ",") { index += 1; skipWhitespace(); }
    }
    index += 1;
  }

  function scanArray(path) {
    index += 1;
    skipWhitespace();
    let item = 0;
    while (source[index] !== "]") {
      scanValue([...path, item]);
      item += 1;
      skipWhitespace();
      if (source[index] === ",") { index += 1; skipWhitespace(); }
    }
    index += 1;
  }

  scanValue([]);
  return diagnostics;
}

/** Parse raw JSON without losing duplicate-key evidence. Never includes source content in diagnostics. */
export function parseJsonDocument(source, { label = "JSON document" } = {}) {
  if (typeof source !== "string") {
    return { value: undefined, diagnostics: [diagnostic("error", "JSON_SOURCE_TYPE", `${label} source must be a string.`)] };
  }
  try {
    const value = JSON.parse(source);
    return { value, diagnostics: duplicateKeyDiagnostics(source) };
  } catch (error) {
    const position = /position (\d+)/u.exec(error.message)?.[1];
    return {
      value: undefined,
      diagnostics: [diagnostic("error", "JSON_SYNTAX", `${label} is not valid JSON.`, "", position === undefined ? {} : { position: Number(position) })]
    };
  }
}

export function parsePromptJson(source) {
  return parseJsonDocument(source, { label: "Prompt JSON" });
}
