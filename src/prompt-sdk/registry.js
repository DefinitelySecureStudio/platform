import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, opendir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { parsePromptJson } from "./parse-json.js";
import { PromptRegistryError, registryFail } from "./registry-errors.js";
import { compareSemver, parseSemver, parseSemverRange, satisfiesSemverRange } from "./semver.js";
import { validatePromptDefinition } from "./validate.js";

const LIFECYCLES = new Set(["draft", "experimental", "stable", "deprecated", "retired"]);
const ROOT_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/u;
const PROMPT_ID = /^prompt\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+$/u;

function clone(value) { return structuredClone(value); }
function compareText(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
function freezeEntry(entry) { return Object.freeze({ ...entry, definition: Object.freeze(clone(entry.definition)), source: Object.freeze({ ...entry.source }), validationWarnings: Object.freeze(clone(entry.validationWarnings)) }); }

async function discoverFiles(root) {
  const files = [];
  async function visit(directory, relative = "") {
    const entries = [];
    let handle;
    try { handle = await opendir(directory); } catch {
      registryFail("REGISTRY_DIRECTORY_UNREADABLE", "A registry directory could not be read.", { root_id: root.id, relative_path: relative || "." });
    }
    try { for await (const entry of handle) entries.push(entry); } catch {
      registryFail("REGISTRY_DIRECTORY_UNREADABLE", "A registry directory could not be read.", { root_id: root.id, relative_path: relative || "." });
    }
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const relativePath = path.posix.join(relative, entry.name);
      const absolutePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) registryFail("REGISTRY_SYMLINK_NOT_ALLOWED", "Registry roots must not contain symbolic links.", { root_id: root.id, relative_path: relativePath });
      if (entry.isDirectory()) await visit(absolutePath, relativePath);
      else if (entry.isFile() && entry.name.endsWith(".prompt.json")) files.push({ absolutePath, relativePath });
    }
  }
  await visit(root.realPath);
  return files;
}

async function readPromptFile(root, file) {
  let handle;
  try {
    handle = await open(file.absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const details = await handle.stat();
    if (!details.isFile()) registryFail("REGISTRY_ENTRY_NOT_FILE", "A discovered prompt entry is not a regular file.", { root_id: root.id, relative_path: file.relativePath });
    return await handle.readFile();
  } catch (error) {
    if (error instanceof PromptRegistryError) throw error;
    registryFail("REGISTRY_FILE_UNREADABLE", "A discovered prompt file could not be read without following links.", { root_id: root.id, relative_path: file.relativePath });
  } finally {
    await handle?.close().catch(() => {});
  }
}

function decodePromptFile(bytes, root, file) {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) registryFail("PROMPT_BOM_NOT_ALLOWED", "Prompt JSON must not contain a byte-order mark.", { root_id: root.id, relative_path: file.relativePath });
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch {
    registryFail("INVALID_PROMPT_ENCODING", "Prompt JSON must be valid UTF-8.", { root_id: root.id, relative_path: file.relativePath });
  }
}

function lifecycleWarnings(definition, { includeRetired }) {
  const status = definition.lifecycle.status;
  if (status === "retired" && !includeRetired) registryFail("PROMPT_RETIRED", "The exact prompt version is retired and unavailable for new execution.", { id: definition.id, version: definition.version });
  if (status !== "deprecated" && status !== "retired") return [];
  const deprecation = definition.lifecycle.deprecation;
  return [{
    code: status === "retired" ? "PROMPT_RETIRED_AUDIT_ONLY" : "PROMPT_DEPRECATED",
    message: status === "retired" ? "The resolved prompt is retired and may be used only for authorized audit or reproduction." : "The resolved prompt version is deprecated; no replacement was selected automatically.",
    details: {
      id: definition.id, version: definition.version,
      deprecated_at: deprecation.deprecated_at, support_until: deprecation.support_until,
      ...(deprecation.replacement === undefined ? {} : { replacement: clone(deprecation.replacement) }),
      ...(deprecation.no_replacement_reason === undefined ? {} : { no_replacement_reason: deprecation.no_replacement_reason })
    }
  }];
}

function selectorDetails(selector) {
  if (typeof selector === "string") return { kind: "exact", version: selector };
  if (!selector || typeof selector !== "object" || Array.isArray(selector)) registryFail("INVALID_PROMPT_SELECTOR", "A selector must be an exact version string or an explicit selector object.");
  const keys = Object.keys(selector).sort();
  const allowedKeys = selector.kind === "exact" ? ["kind", "version"] : selector.kind === "range" ? ["kind", "lifecycle", "range"] : selector.kind === "latest" ? ["kind", "lifecycle"] : [];
  if (allowedKeys.length === 0 || keys.some((key) => !allowedKeys.includes(key))) registryFail("INVALID_PROMPT_SELECTOR", "Selector contains unsupported fields.");
  const allowed = selector.lifecycle;
  if (selector.kind === "exact" && typeof selector.version === "string") return { kind: "exact", version: selector.version };
  if ((selector.kind === "range" || selector.kind === "latest") && (!Array.isArray(allowed) || allowed.length === 0 || allowed.some((status) => !LIFECYCLES.has(status)))) {
    registryFail("NON_EXACT_LIFECYCLE_REQUIRED", "Range/latest selectors require an explicit non-empty lifecycle allowlist.");
  }
  if (selector.kind === "range" && typeof selector.range === "string" && parseSemverRange(selector.range)) return { kind: "range", range: selector.range, lifecycle: [...new Set(allowed)] };
  if (selector.kind === "latest") return { kind: "latest", lifecycle: [...new Set(allowed)] };
  registryFail("INVALID_PROMPT_SELECTOR", "Selector shape or Semantic Version range is invalid.");
}

function metadata(entry) {
  const { definition, source } = entry;
  return {
    id: definition.id, version: definition.version, name: definition.name,
    description: definition.description, purpose: definition.purpose,
    owners: clone(definition.owners), tags: clone(definition.tags ?? []),
    lifecycle: clone(definition.lifecycle), source: { ...source },
    validation_warnings: clone(entry.validationWarnings)
  };
}

function filtersDetails(filters) {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) registryFail("INVALID_DISCOVERY_FILTERS", "Discovery filters must be an object.");
  const supported = new Set(["id_prefix", "tags", "owners", "lifecycle", "query"]);
  if (Object.keys(filters).some((key) => !supported.has(key))) registryFail("INVALID_DISCOVERY_FILTERS", "Discovery filters contain an unsupported field.");
  for (const key of ["tags", "owners", "lifecycle"]) if (filters[key] !== undefined && (!Array.isArray(filters[key]) || filters[key].some((value) => typeof value !== "string"))) registryFail("INVALID_DISCOVERY_FILTERS", `${key} must be an array of strings.`);
  if (filters.lifecycle?.some((status) => !LIFECYCLES.has(status))) registryFail("INVALID_DISCOVERY_FILTERS", "lifecycle contains an unsupported status.");
  for (const key of ["id_prefix", "query"]) if (filters[key] !== undefined && typeof filters[key] !== "string") registryFail("INVALID_DISCOVERY_FILTERS", `${key} must be a string.`);
  return filters;
}

export class FilesystemPromptRegistry {
  #roots;
  #entries = Object.freeze([]);
  #identity = new Map();
  #validationOptions;

  constructor(token, roots, validationOptions) {
    if (token !== FilesystemPromptRegistry) throw new TypeError("Use FilesystemPromptRegistry.open().");
    this.#roots = roots;
    this.#validationOptions = validationOptions;
  }

  static async open({ roots, validation = {} } = {}) {
    if (!Array.isArray(roots) || roots.length === 0) registryFail("REGISTRY_ROOTS_REQUIRED", "At least one explicit approved registry root is required.");
    const ids = new Set();
    const approved = [];
    for (const [index, root] of roots.entries()) {
      if (!root || typeof root.path !== "string" || !ROOT_ID.test(root.id ?? "")) registryFail("INVALID_REGISTRY_ROOT", "Each registry root requires a path and safe stable id.", { index });
      if (ids.has(root.id)) registryFail("DUPLICATE_REGISTRY_ROOT_ID", "Registry root ids must be unique.", { root_id: root.id });
      ids.add(root.id);
      const resolved = await realpath(path.resolve(root.path)).catch(() => registryFail("REGISTRY_ROOT_UNAVAILABLE", "An approved registry root is unavailable.", { root_id: root.id }));
      const rootStat = await stat(resolved).catch(() => registryFail("REGISTRY_ROOT_UNAVAILABLE", "An approved registry root is unavailable.", { root_id: root.id }));
      if (!rootStat.isDirectory()) registryFail("REGISTRY_ROOT_NOT_DIRECTORY", "An approved registry root is not a directory.", { root_id: root.id });
      approved.push({ id: root.id, realPath: resolved });
    }
    const registry = new FilesystemPromptRegistry(FilesystemPromptRegistry, approved, { ...validation });
    await registry.refresh();
    return registry;
  }

  async refresh() {
    const loaded = [];
    const identities = new Map();
    for (const root of this.#roots) {
      for (const file of await discoverFiles(root)) {
        const bytes = await readPromptFile(root, file);
        const parsed = parsePromptJson(decodePromptFile(bytes, root, file));
        const validation = parsed.value === undefined ? undefined : validatePromptDefinition(parsed.value, this.#validationOptions);
        const diagnostics = [...parsed.diagnostics, ...(validation?.diagnostics ?? [])];
        if (diagnostics.some(({ severity }) => severity === "error")) {
          throw new PromptRegistryError("INVALID_PROMPT_DEFINITION", "A discovered prompt definition is invalid.", { details: { root_id: root.id, relative_path: file.relativePath }, diagnostics });
        }
        const definition = parsed.value;
        const identity = `${definition.id}@${definition.version}`;
        if (identities.has(identity)) {
          const first = identities.get(identity);
          registryFail("DUPLICATE_PROMPT_VERSION", "Multiple files define the same prompt identity and version.", { id: definition.id, version: definition.version, first_source: first.source, conflicting_source: { root_id: root.id, relative_path: file.relativePath } });
        }
        const entry = freezeEntry({
          definition,
          validationWarnings: diagnostics.filter(({ severity }) => severity === "warning"),
          source: { root_id: root.id, relative_path: file.relativePath, byte_size: bytes.byteLength, sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}` }
        });
        identities.set(identity, entry);
        loaded.push(entry);
      }
    }
    loaded.sort((left, right) => compareText(left.definition.id, right.definition.id) || compareSemver(right.definition.version, left.definition.version) || compareText(right.definition.version, left.definition.version));
    this.#entries = Object.freeze(loaded);
    this.#identity = identities;
    return this.discover();
  }

  discover(filters = {}) {
    filters = filtersDetails(filters);
    const tags = new Set(filters.tags ?? []);
    const owners = new Set(filters.owners ?? []);
    const lifecycle = new Set(filters.lifecycle ?? []);
    const query = typeof filters.query === "string" ? filters.query.toLowerCase() : undefined;
    return this.#entries.filter(({ definition }) => {
      if (filters.id_prefix && !definition.id.startsWith(filters.id_prefix)) return false;
      if (tags.size && ![...tags].every((tag) => definition.tags?.includes(tag))) return false;
      if (owners.size && ![...owners].some((owner) => definition.owners.includes(owner))) return false;
      if (lifecycle.size && !lifecycle.has(definition.lifecycle.status)) return false;
      if (query && ![definition.id, definition.name, definition.description, definition.purpose, ...(definition.tags ?? [])].join("\n").toLowerCase().includes(query)) return false;
      return true;
    }).map(metadata);
  }

  list(filters = {}) { return this.discover(filters); }

  resolve(id, selector, options = {}) {
    if (typeof id !== "string" || !PROMPT_ID.test(id)) registryFail("INVALID_PROMPT_ID", "Prompt id is invalid.");
    if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => key !== "allowNonExact" && key !== "includeRetired")) registryFail("INVALID_RESOLUTION_OPTIONS", "Resolution options contain an unsupported field.", { id });
    const { allowNonExact = false, includeRetired = false } = options;
    if (typeof allowNonExact !== "boolean" || typeof includeRetired !== "boolean") registryFail("INVALID_RESOLUTION_OPTIONS", "Resolution options must be explicit booleans.", { id });
    const parsedSelector = selectorDetails(selector);
    let entry;
    if (parsedSelector.kind === "exact") {
      if (!parseSemver(parsedSelector.version)) registryFail("INVALID_PROMPT_VERSION", "Exact selector requires a full Semantic Version.", { id });
      entry = this.#identity.get(`${id}@${parsedSelector.version}`);
    } else {
      if (!allowNonExact) registryFail("NON_EXACT_RESOLUTION_DISABLED", "Range/latest resolution requires explicit allowNonExact authorization.", { id, selector: parsedSelector.kind });
      let candidates = this.#entries.filter((candidate) => candidate.definition.id === id && parsedSelector.lifecycle.includes(candidate.definition.lifecycle.status));
      if (!includeRetired) candidates = candidates.filter((candidate) => candidate.definition.lifecycle.status !== "retired");
      if (parsedSelector.kind === "range") candidates = candidates.filter((candidate) => satisfiesSemverRange(candidate.definition.version, parsedSelector.range));
      entry = candidates[0];
      if (entry) {
        const ambiguous = candidates.find((candidate, index) => index > 0 && compareSemver(candidate.definition.version, entry.definition.version) === 0);
        if (ambiguous) registryFail("AMBIGUOUS_VERSION_PRECEDENCE", "Multiple matching versions have equal Semantic Version precedence.", { id, versions: [entry.definition.version, ambiguous.definition.version].sort() });
      }
    }
    if (!entry) registryFail("PROMPT_NOT_FOUND", "No prompt matched the requested identity and selector.", { id, selector: parsedSelector });
    const warnings = [...entry.validationWarnings, ...lifecycleWarnings(entry.definition, { includeRetired })];
    if (parsedSelector.kind !== "exact") warnings.unshift({ code: "NON_EXACT_PROMPT_RESOLUTION", message: "A non-exact selector resolved against the current registry snapshot; pin the returned exact version for reproducible use.", details: { id, selector: parsedSelector, resolved_version: entry.definition.version } });
    return Object.freeze({ definition: Object.freeze(clone(entry.definition)), metadata: Object.freeze(metadata(entry)), warnings: Object.freeze(warnings.map((item) => Object.freeze(item))) });
  }
}

export async function createFilesystemPromptRegistry(options) { return FilesystemPromptRegistry.open(options); }
