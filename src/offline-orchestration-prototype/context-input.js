import { createHash } from 'node:crypto';
import { types } from 'node:util';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import {
  renderPromptWithContextPackage, validateContextBinding, validateContextDocument, validatePromptDefinition
} from '../prompt-sdk/index.js';
import { createBuildArtifact, verifyBuildArtifact } from '../context-builder/index.js';
import { planComicReferences, COMIC_REFERENCE_LIMITS } from '../comic-manifest/references.js';
import { parseComicManifestJson } from '../comic-manifest/parse-json.js';
import { SYNTHETIC_CONTEXT_READER_SLOTS } from './context-use-authority.js';

const MAX_CONTEXT_ARTIFACT_BYTES = 8 * 1024 * 1024;
const READ_TIMEOUT_MS = 1000;
const hash = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const identity = value => {
  const bytes = Buffer.from(canonicalJson(value), 'utf8');
  return { canonicalization: 'studio-json-v1', byte_size: bytes.byteLength, sha256: hash(bytes) };
};
const equal = (left, right) => canonicalJson(left) === canonicalJson(right);
const fail = () => { throw new Error('SYNTHETIC_CONTEXT_INPUT_INVALID'); };
const freezeDeep = (value, seen = new WeakSet()) => {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) freezeDeep(child, seen);
  return Object.freeze(value);
};

function referenceSlot(entry) {
  const ref = entry.reference;
  if (ref.kind === 'context-package') return 'context-package';
  if (ref.kind === 'builder-result') return 'builder-result';
  const roles = entry.uses;
  if (roles.length !== 1) return undefined;
  if (roles[0].role === 'canon') return 'canon';
  if (roles[0].role === 'dependency') return `dependency-${roles[0].index}`;
  if (roles[0].role === 'prompt' && roles[0].binding_id === 'description') return 'prompt-description';
  return undefined;
}

function expectedArtifact(entry) {
  return entry.reference.kind === 'public' ? entry.reference.dependency.artifact : undefined;
}

async function readBounded(reader, maxBytes, signal) {
  const controller = new AbortController();
  let timer;
  let relay;
  try {
    if (signal?.aborted) fail();
    relay = () => controller.abort();
    signal?.addEventListener('abort', relay, { once: true });
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('reader-timeout')); }, READ_TIMEOUT_MS);
      controller.signal.addEventListener('abort', () => reject(new Error('reader-aborted')), { once: true });
    });
    const value = await Promise.race([
      Promise.resolve().then(() => reader(Object.freeze({ maxBytes, signal: controller.signal }))), timeout
    ]);
    if (!value || types.isProxy(value) || !types.isUint8Array(value) || types.isSharedArrayBuffer(value.buffer)
      || value.byteLength > maxBytes) fail();
    const bytes = Buffer.alloc(value.byteLength);
    for (let index = 0; index < bytes.byteLength; index++) bytes[index] = value[index];
    return bytes;
  } catch { fail(); }
  finally {
    clearTimeout(timer);
    if (relay) signal?.removeEventListener('abort', relay);
    controller.abort();
  }
}

function parse(bytes) {
  try {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const parsed = parseComicManifestJson(source);
    if (!parsed.valid) fail();
    return parsed.value;
  } catch { fail(); }
}

/** Reads only the finite fixture slots after current dual authorization and reuses released validators. */
export async function loadSyntheticContextInput({ production, readers, authorize, signal }) {
  try {
    const plan = planComicReferences(production.canonical);
    if (!plan.valid || !equal(plan.manifest_identity, production.identity)) fail();
    const slots = new Map();
    for (const entry of plan.references) {
      const slot = referenceSlot(entry);
      if (!slot || slots.has(slot)) fail();
      slots.set(slot, entry);
    }
    if (!equal([...slots.keys()].sort(), [...SYNTHETIC_CONTEXT_READER_SLOTS].sort())) fail();

    const documents = new Map();
    let latestPermit;
    let totalBytes = 0;
    for (const slot of SYNTHETIC_CONTEXT_READER_SLOTS) {
      latestPermit = await authorize();
      const entry = slots.get(slot);
      const artifact = expectedArtifact(entry);
      const maxBytes = artifact?.byte_size ?? MAX_CONTEXT_ARTIFACT_BYTES;
      const bytes = await readBounded(readers[slot], maxBytes, signal);
      latestPermit = await authorize();
      totalBytes += bytes.byteLength;
      if (!Number.isSafeInteger(totalBytes) || totalBytes > COMIC_REFERENCE_LIMITS.maxTotalBytes) fail();
      if (artifact && (bytes.byteLength !== artifact.byte_size || hash(bytes) !== artifact.sha256)) fail();
      if (slot !== 'prompt-description' && slot !== 'context-package' && slot !== 'builder-result') continue;
      const document = parse(bytes);
      if (slot === 'prompt-description') {
        const binding = production.value.inputs.prompts[0];
        if (!validatePromptDefinition(document).valid || document.id !== binding.prompt_id
          || document.version !== binding.prompt_version || !equal(identity(document), binding.identity)
          || binding.definition.version !== binding.prompt_version
          || binding.definition.artifact.byte_size !== binding.identity.byte_size
          || binding.definition.artifact.sha256 !== binding.identity.sha256) fail();
      } else if (slot === 'context-package') {
        const binding = production.value.inputs.prompts[0].context;
        if (!validateContextDocument(document).valid || document.kind !== 'context-package'
          || !equal(identity(document.manifest), binding.manifest_identity)
          || !equal(document.manifest.package, {
            id: binding.package_id, version: binding.package_version, instance_id: binding.instance_id
          }) || document.spec_version !== binding.contract_version
          || document.manifest.purpose !== binding.purpose
          || document.manifest.classification !== binding.classification
          || !equal(document.manifest.sections.map(section => section.slot), binding.sections)) fail();
      } else if (slot === 'builder-result') {
        const binding = production.value.inputs.prompts[0].context;
        if (document?.kind !== 'context-build-result' || document.spec_version !== '1.0.0'
          || document.status !== 'prepared' || !equal(identity(document), binding.builder_result_identity)) fail();
        const verified = verifyBuildArtifact(createBuildArtifact(document));
        if (!equal(verified.result.package, documents.get('context-package'))
          || verified.result.package.manifest.authority_reference !== binding.preparation_reference
          || typeof verified.result.evidence_reference !== 'string' || !verified.result.evidence_reference) fail();
      }
      documents.set(slot, document);
    }

    latestPermit = await authorize();
    const definition = documents.get('prompt-description');
    const packageDocument = documents.get('context-package');
    const authorization = latestPermit.authorization;
    const binding = production.value.inputs.prompts[0];
    if (!equal(binding.context.builder_result_identity, identity(documents.get('builder-result')))
      || !validateContextBinding(definition, packageDocument, authorization, { at: latestPermit.at }).valid) fail();
    const renderedPrompt = renderPromptWithContextPackage(definition, {
      inputValues: { item: 'blue cube', attributes: {} }, packageDocument, authorization, at: latestPermit.at
    });
    return Object.freeze({ renderedPrompt, request: latestPermit.request });
  } catch (error) {
    const safeAuthorityCodes = new Set([
      'EXECUTION_AUTHORITY_DENIED', 'EXECUTION_AUTHORITY_UNAVAILABLE', 'EXECUTION_AUTHORITY_STALE',
      'EXECUTION_DEADLINE_EXPIRED', 'SYNTHETIC_CONTEXT_AUTHORITY_DENIED', 'SYNTHETIC_CONTEXT_AUTHORITY_UNAVAILABLE'
    ]);
    if (safeAuthorityCodes.has(error?.code)) throw new Error(error.code);
    throw new Error('SYNTHETIC_CONTEXT_INPUT_INVALID');
  }
}
