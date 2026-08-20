import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createFilesystemPromptRegistry, PromptRegistryError } from "../../src/prompt-sdk/index.js";

const fixture = JSON.parse(await readFile(new URL("../fixtures/validation/valid.prompt.json", import.meta.url), "utf8"));

function definition(version, status = "experimental", id = "prompt.registry.synthetic-note") {
  const value = structuredClone(fixture);
  value.id = id;
  value.version = version;
  value.name = `Synthetic registry prompt ${version}`;
  value.description = `Synthetic registry fixture at ${version}.`;
  value.lifecycle = { status };
  value.tags = ["registry", status];
  value.governance.evidence = ["https://github.com/DefinitelySecureStudio/studio/issues/66"];
  if (status === "deprecated" || status === "retired") {
    value.lifecycle.deprecation = {
      deprecated_at: "2026-08-20T00:00:00Z",
      reason: "Synthetic lifecycle exercise.",
      support_until: "2026-12-31T00:00:00Z",
      replacement: { id, version: "1.1.0" }
    };
  }
  return value;
}

async function root(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "studio-registry-test-"));
  t.after(() => import("node:fs/promises").then(({ rm }) => rm(directory, { recursive: true, force: true })));
  return directory;
}

async function put(directory, filename, value) {
  await writeFile(path.join(directory, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function expectRegistryCode(code, operation) {
  return assert.rejects(operation, (error) => {
    assert.ok(error instanceof PromptRegistryError);
    assert.equal(error.code, code);
    assert.doesNotMatch(JSON.stringify(error), /private-token-value/u);
    return true;
  });
}

test("discovers approved files deterministically and exposes value-free source identity", async (t) => {
  const directory = await root(t);
  await mkdir(path.join(directory, "nested"));
  await put(directory, "z.prompt.json", definition("1.0.0", "draft"));
  await put(path.join(directory, "nested"), "a.prompt.json", definition("1.1.0"));
  await writeFile(path.join(directory, "ignored.json"), "{}\n");

  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved-prompts", path: directory }] });
  const found = registry.discover();
  assert.deepEqual(found.map(({ version }) => version), ["1.1.0", "1.0.0"]);
  assert.deepEqual(found.map(({ source }) => source.relative_path), ["nested/a.prompt.json", "z.prompt.json"]);
  assert.ok(found.every(({ source }) => source.root_id === "approved-prompts" && /^sha256:[0-9a-f]{64}$/u.test(source.sha256)));
  assert.doesNotMatch(JSON.stringify(found), new RegExp(directory.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")));
});

test("resolves an exact identity/version without silently changing lifecycle", async (t) => {
  const directory = await root(t);
  await put(directory, "current.prompt.json", definition("1.1.0"));
  await put(directory, "deprecated.prompt.json", definition("1.2.0", "deprecated"));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });

  const exact = registry.resolve("prompt.registry.synthetic-note", "1.1.0");
  assert.equal(exact.definition.version, "1.1.0");
  assert.deepEqual(exact.warnings, []);
  const deprecated = registry.resolve("prompt.registry.synthetic-note", "1.2.0");
  assert.equal(deprecated.definition.version, "1.2.0");
  assert.equal(deprecated.warnings[0].code, "PROMPT_DEPRECATED");
  assert.equal(deprecated.warnings[0].details.replacement.version, "1.1.0");
});

test("requires explicit authorization and lifecycle policy for range/latest resolution", async (t) => {
  const directory = await root(t);
  await put(directory, "one.prompt.json", definition("1.0.0", "draft"));
  await put(directory, "two.prompt.json", definition("1.1.0", "experimental"));
  await put(directory, "three.prompt.json", definition("1.2.0", "deprecated"));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });

  await expectRegistryCode("NON_EXACT_RESOLUTION_DISABLED", async () => registry.resolve("prompt.registry.synthetic-note", { kind: "latest", lifecycle: ["experimental", "deprecated"] }));
  await expectRegistryCode("NON_EXACT_LIFECYCLE_REQUIRED", async () => registry.resolve("prompt.registry.synthetic-note", { kind: "latest" }, { allowNonExact: true }));
  const latest = registry.resolve("prompt.registry.synthetic-note", { kind: "latest", lifecycle: ["experimental", "deprecated"] }, { allowNonExact: true });
  assert.equal(latest.definition.version, "1.2.0");
  assert.deepEqual(latest.warnings.map(({ code }) => code), ["NON_EXACT_PROMPT_RESOLUTION", "PROMPT_DEPRECATED"]);
  const range = registry.resolve("prompt.registry.synthetic-note", { kind: "range", range: ">=1.0.0 <1.2.0", lifecycle: ["draft", "experimental"] }, { allowNonExact: true });
  assert.equal(range.definition.version, "1.1.0");
});

test("implements strict caret, tilde, comparator, prerelease, and large-version behavior", async (t) => {
  const directory = await root(t);
  for (const version of ["0.2.1", "0.2.9", "0.3.0", "1.2.0-alpha.1", "1.2.0", "1.2.8", "1.3.0", "999999999999999999.0.0"]) await put(directory, `${version}.prompt.json`, definition(version));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });
  const resolve = (range) => registry.resolve("prompt.registry.synthetic-note", { kind: "range", range, lifecycle: ["experimental"] }, { allowNonExact: true }).definition.version;
  assert.equal(resolve("^0.2.1"), "0.2.9");
  assert.equal(resolve("~1.2.0"), "1.2.8");
  assert.equal(resolve(">=1.2.0-alpha.1 <1.2.0"), "1.2.0-alpha.1");
  assert.equal(resolve(">=1.2.0 <1.3.0"), "1.2.8");
  assert.equal(registry.resolve("prompt.registry.synthetic-note", { kind: "latest", lifecycle: ["experimental"] }, { allowNonExact: true }).definition.version, "999999999999999999.0.0");
});

test("filters discovery metadata for tooling", async (t) => {
  const directory = await root(t);
  await put(directory, "one.prompt.json", definition("1.0.0", "draft"));
  await put(directory, "two.prompt.json", definition("1.1.0", "experimental", "prompt.registry.other-note"));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });
  assert.equal(registry.discover({ lifecycle: ["draft"] }).length, 1);
  assert.equal(registry.discover({ tags: ["registry", "experimental"] })[0].id, "prompt.registry.other-note");
  assert.equal(registry.discover({ owners: ["@andrewperis"], query: "other-note" }).length, 1);
  assert.equal(registry.discover({ id_prefix: "prompt.registry.synthetic" }).length, 1);
  assert.deepEqual(registry.list({ lifecycle: ["draft"] }), registry.discover({ lifecycle: ["draft"] }));
  assert.throws(() => registry.discover({ lifecycle: "draft" }), (error) => error instanceof PromptRegistryError && error.code === "INVALID_DISCOVERY_FILTERS");
});

test("rejects duplicate and conflicting identity/version definitions across roots", async (t) => {
  const first = await root(t);
  const second = await root(t);
  await put(first, "first.prompt.json", definition("1.0.0"));
  await put(second, "second.prompt.json", definition("1.0.0"));
  await expectRegistryCode("DUPLICATE_PROMPT_VERSION", () => createFilesystemPromptRegistry({ roots: [{ id: "one", path: first }, { id: "two", path: second }] }));

  const changed = definition("1.0.0");
  changed.description = "Conflicting synthetic definition.";
  await put(second, "second.prompt.json", changed);
  await expectRegistryCode("DUPLICATE_PROMPT_VERSION", () => createFilesystemPromptRegistry({ roots: [{ id: "one", path: first }, { id: "two", path: second }] }));
});

test("fails invalid files safely and preserves the prior snapshot on refresh failure", async (t) => {
  const directory = await root(t);
  await put(directory, "valid.prompt.json", definition("1.0.0"));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });
  await writeFile(path.join(directory, "invalid.prompt.json"), "{\"private-token-value\":", "utf8");
  await expectRegistryCode("INVALID_PROMPT_DEFINITION", () => registry.refresh());
  assert.equal(registry.resolve("prompt.registry.synthetic-note", "1.0.0").definition.version, "1.0.0");
});

test("rejects invalid UTF-8 and byte-order marks before JSON parsing", async (t) => {
  const directory = await root(t);
  const filename = path.join(directory, "encoding.prompt.json");
  await writeFile(filename, Buffer.from([0xc3, 0x28]));
  await expectRegistryCode("INVALID_PROMPT_ENCODING", () => createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] }));
  const valid = Buffer.from(`${JSON.stringify(definition("1.0.0"))}\n`, "utf8");
  await writeFile(filename, Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), valid]));
  await expectRegistryCode("PROMPT_BOM_NOT_ALLOWED", () => createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] }));
});

test("blocks symlinks rather than escaping or ambiguously traversing approved roots", async (t) => {
  const directory = await root(t);
  const outside = await root(t);
  await put(outside, "outside.prompt.json", definition("1.0.0"));
  await symlink(path.join(outside, "outside.prompt.json"), path.join(directory, "linked.prompt.json"));
  await expectRegistryCode("REGISTRY_SYMLINK_NOT_ALLOWED", () => createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] }));
});

test("retired prompts require explicit audit/reproduction access", async (t) => {
  const directory = await root(t);
  await put(directory, "retired.prompt.json", definition("2.0.0", "retired"));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });
  await expectRegistryCode("PROMPT_RETIRED", async () => registry.resolve("prompt.registry.synthetic-note", "2.0.0"));
  const result = registry.resolve("prompt.registry.synthetic-note", "2.0.0", { includeRetired: true });
  assert.equal(result.warnings[0].code, "PROMPT_RETIRED_AUDIT_ONLY");
});

test("rejects missing versions, invalid ranges, and equal-precedence ambiguity", async (t) => {
  const directory = await root(t);
  await put(directory, "a.prompt.json", definition("1.0.0+build-a"));
  await put(directory, "b.prompt.json", definition("1.0.0+build-b"));
  const registry = await createFilesystemPromptRegistry({ roots: [{ id: "approved", path: directory }] });
  await expectRegistryCode("PROMPT_NOT_FOUND", async () => registry.resolve("prompt.registry.synthetic-note", "9.9.9"));
  await expectRegistryCode("INVALID_PROMPT_SELECTOR", async () => registry.resolve("prompt.registry.synthetic-note", { kind: "range", range: "1.x", lifecycle: ["experimental"] }, { allowNonExact: true }));
  await expectRegistryCode("AMBIGUOUS_VERSION_PRECEDENCE", async () => registry.resolve("prompt.registry.synthetic-note", { kind: "latest", lifecycle: ["experimental"] }, { allowNonExact: true }));
});
