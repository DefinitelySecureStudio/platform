#!/usr/bin/env node
import { constants } from 'node:fs';
import { createHash as hashFactory } from 'node:crypto';
import { open, lstat, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, parse as parsePath, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  COMIC_MANIFEST_LIMITS,
  createComicApprovalBoundary,
  createComicBuildResultBoundary,
  describeComicEpisode,
  diffComicRevision,
  parseComicManifestJson,
  planComicReferences,
  validateComicManifest
} from './index.js';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';

const MAX_FILE_BYTES = COMIC_MANIFEST_LIMITS.maxBytes;
const MAX_SUMMARY_OUTPUT_BYTES = 8 * 1024 * 1024;
const OUTPUT_FILE_MODE = 0o600;
const PRIVATE_DIRECTORY_MASK = 0o077;
const DIGEST = /^sha256:[0-9a-f]{64}$/;

class CliError extends Error {
  constructor(code, exit = 2, stage = 'cli') {
    super(code);
    this.code = code;
    this.exit = exit;
    this.stage = stage;
  }
}

const reject = (code, exit = 2, stage = 'cli') => { throw new CliError(code, exit, stage); };
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const same = (left, right) => canonicalJson(left) === canonicalJson(right);
const sha256 = value => `sha256:${hashFactory('sha256').update(value).digest('hex')}`;

const help = `Comic Manifest authoring CLI (offline; no providers or authority discovery)
Commands:
  validate --manifest FILE [--json]
  inspect  --manifest FILE [--json]
  diff     --candidate FILE --previous FILE [--json]
  verify   --synthetic --production FILE --result FILE --candidate FILE
           --assignment FILE --approvals FILE --artifact-map FILE
           --synthetic-policy FILE --at UTC [--previous FILE] [--json]
           [--proposal-out FILE --allow-proposal-output]
           [--evidence-out FILE --allow-protected-output]

Exit codes: 0 success; 2 usage/input; 3 synthetic authorization denied or stale;
4 record, linkage, byte-integrity or revision mismatch; 5 protected output I/O.
Routine reports omit record bodies, identities, URIs, paths, proposal and evidence.
`;

function pathFor(rawPath, stage = 'input') {
  if (typeof rawPath !== 'string' || rawPath.length < 1 || rawPath.length > 4096 || rawPath.includes('\0')) {
    reject(stage === 'output' ? 'OUTPUT_PATH_INVALID' : 'INPUT_PATH_INVALID', stage === 'output' ? 5 : 2, stage);
  }
  if (rawPath.split(sep).includes('..')) {
    reject(stage === 'output' ? 'OUTPUT_PATH_UNSAFE' : 'INPUT_PATH_UNSAFE', stage === 'output' ? 5 : 2, stage);
  }
  return resolve(rawPath);
}

function stableStat(left, right) {
  return ['dev', 'ino', 'mode', 'uid', 'size', 'mtimeNs', 'ctimeNs', 'nlink']
    .every(key => left[key] === right[key]);
}

async function captureDirectories(target, stage) {
  const absolute = pathFor(target, stage);
  const root = parsePath(absolute).root;
  const pieces = absolute.slice(root.length).split(sep).filter(Boolean);
  const directories = [];
  let cursor = root;
  for (const piece of pieces.slice(0, -1)) {
    cursor = resolve(cursor, piece);
    let info;
    try { info = await lstat(cursor, { bigint: true }); }
    catch { reject(stage === 'output' ? 'OUTPUT_DIRECTORY_INVALID' : 'INPUT_PATH_INVALID', stage === 'output' ? 5 : 2, stage); }
    if (!info.isDirectory() || info.isSymbolicLink()) {
      reject(stage === 'output' ? 'OUTPUT_PATH_UNSAFE' : 'INPUT_PATH_UNSAFE', stage === 'output' ? 5 : 2, stage);
    }
    directories.push({ path: cursor, dev: info.dev, ino: info.ino });
  }
  return { absolute, directories };
}

async function recheckDirectories(snapshot, stage) {
  for (const before of snapshot.directories) {
    let after;
    try { after = await lstat(before.path, { bigint: true }); }
    catch { reject(stage === 'output' ? 'OUTPUT_PATH_CHANGED' : 'INPUT_FILE_CHANGED', stage === 'output' ? 5 : 2, stage); }
    if (!after.isDirectory() || after.isSymbolicLink() || after.dev !== before.dev || after.ino !== before.ino) {
      reject(stage === 'output' ? 'OUTPUT_PATH_CHANGED' : 'INPUT_FILE_CHANGED', stage === 'output' ? 5 : 2, stage);
    }
  }
}

async function readStableFile(rawPath, maxBytes = MAX_FILE_BYTES) {
  const path = pathFor(rawPath);
  const snapshot = await captureDirectories(path, 'input');
  if (typeof constants.O_NOFOLLOW !== 'number' || typeof constants.O_NONBLOCK !== 'number') {
    reject('UNSUPPORTED_FILESYSTEM', 2, 'input');
  }
  let handle;
  try {
    await recheckDirectories(snapshot, 'input');
    let pathBefore;
    try { pathBefore = await lstat(path, { bigint: true }); }
    catch { reject('INPUT_FILE_INVALID', 2, 'input'); }
    if (!pathBefore.isFile() || pathBefore.isSymbolicLink() || pathBefore.nlink !== 1n || pathBefore.size > BigInt(maxBytes)) {
      reject('INPUT_FILE_INVALID', 2, 'input');
    }
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await handle.stat({ bigint: true });
    if (!before.isFile() || before.nlink !== 1n || !stableStat(pathBefore, before) || before.size > BigInt(maxBytes)) {
      reject('INPUT_FILE_CHANGED', 2, 'input');
    }
    const buffer = Buffer.alloc(Number(before.size) + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    const after = await handle.stat({ bigint: true });
    let pathAfter;
    try { pathAfter = await lstat(path, { bigint: true }); }
    catch { reject('INPUT_FILE_CHANGED', 2, 'input'); }
    await recheckDirectories(snapshot, 'input');
    if (!stableStat(before, after) || !stableStat(after, pathAfter) || !pathAfter.isFile() || pathAfter.isSymbolicLink()
      || length !== Number(before.size) || length > maxBytes) {
      reject('INPUT_FILE_CHANGED', 2, 'input');
    }
    return Buffer.from(buffer.subarray(0, length));
  } catch (error) {
    if (error instanceof CliError) throw error;
    reject('INPUT_FILE_INVALID', 2, 'input');
  } finally { await handle?.close().catch(() => {}); }
}

function strictJson(bytes, stage = 'input') {
  const parsed = parseComicManifestJson(bytes);
  if (!parsed.valid) {
    const diagnostic = parsed.diagnostics?.[0];
    reject(diagnostic?.code ?? 'JSON_INVALID', 2, diagnostic?.stage ?? stage);
  }
  return parsed.value;
}

async function checkPrivateOutputDirectory(path) {
  const snapshot = await captureDirectories(path, 'output');
  const parent = dirname(snapshot.absolute);
  let info;
  try { info = await lstat(parent, { bigint: true }); }
  catch { reject('OUTPUT_DIRECTORY_INVALID', 5, 'output'); }
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== BigInt(process.getuid?.() ?? -1)
      || (Number(info.mode & 0o777n) & PRIVATE_DIRECTORY_MASK) !== 0) {
    reject('OUTPUT_DIRECTORY_UNPROTECTED', 5, 'output');
  }
  await recheckDirectories(snapshot, 'output');
  let existing;
  try { existing = await lstat(snapshot.absolute, { bigint: true }); }
  catch (error) { if (error?.code !== 'ENOENT') reject('OUTPUT_PATH_INVALID', 5, 'output'); }
  if (existing) reject('OUTPUT_ALREADY_EXISTS', 5, 'output');
  return snapshot;
}

async function removeCreatedFile(path, identity, directories) {
  try {
    await recheckDirectories({ directories }, 'output');
    const current = await lstat(path, { bigint: true });
    if (current.isFile() && !current.isSymbolicLink() && current.dev === identity.dev && current.ino === identity.ino) {
      await unlink(path);
    }
  } catch { /* Preserve the original failure; never delete a path that changed. */ }
}

async function writeExclusiveFile(rawPath, value) {
  const path = pathFor(rawPath, 'output');
  const snapshot = await checkPrivateOutputDirectory(path);
  const serialized = JSON.stringify(value) + '\n';
  if (Buffer.byteLength(serialized) > MAX_SUMMARY_OUTPUT_BYTES) reject('OUTPUT_TOO_LARGE', 5, 'output');
  if (typeof constants.O_NOFOLLOW !== 'number') reject('UNSUPPORTED_FILESYSTEM', 5, 'output');
  let handle, createdIdentity;
  try {
    await recheckDirectories(snapshot, 'output');
    handle = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, OUTPUT_FILE_MODE);
    createdIdentity = await handle.stat({ bigint: true });
    if (!createdIdentity.isFile() || createdIdentity.nlink !== 1n || createdIdentity.uid !== BigInt(process.getuid?.() ?? -1)) {
      reject('OUTPUT_WRITE_FAILED', 5, 'output');
    }
    await handle.chmod(OUTPUT_FILE_MODE);
    await handle.writeFile(serialized, 'utf8');
    await handle.sync();
    const after = await handle.stat({ bigint: true });
    await recheckDirectories(snapshot, 'output');
    const pathAfter = await lstat(path, { bigint: true });
    if (after.dev !== createdIdentity.dev || after.ino !== createdIdentity.ino || after.uid !== BigInt(process.getuid?.() ?? -1)
      || after.nlink !== 1n || (Number(after.mode & 0o777n) & 0o077) !== 0 || after.size !== BigInt(Buffer.byteLength(serialized))
      || !pathAfter.isFile() || pathAfter.isSymbolicLink() || pathAfter.dev !== after.dev || pathAfter.ino !== after.ino
      || pathAfter.uid !== BigInt(process.getuid?.() ?? -1) || (Number(pathAfter.mode & 0o777n) & 0o077) !== 0) {
      reject('OUTPUT_PATH_CHANGED', 5, 'output');
    }
    await handle.close();
    handle = undefined;
    return { path, identity: after, directories: snapshot.directories };
  } catch (error) {
    if (error?.code === 'EEXIST') reject('OUTPUT_ALREADY_EXISTS', 5, 'output');
    if (createdIdentity && handle) {
      try { await handle.truncate(0); await handle.sync(); } catch { /* The path may have changed; keep cleanup fail-closed. */ }
    }
    await handle?.close().catch(() => {});
    if (createdIdentity) await removeCreatedFile(path, createdIdentity, snapshot.directories);
    if (error instanceof CliError) throw error;
    reject('OUTPUT_WRITE_FAILED', 5, 'output');
  }
}

function parseOptions(command, rest) {
  const commonFlags = new Set(['json']);
  const perCommand = {
    validate: { values: ['manifest'], flags: ['json'] },
    inspect: { values: ['manifest'], flags: ['json'] },
    diff: { values: ['candidate', 'previous'], flags: ['json'] },
    verify: { values: ['production', 'result', 'candidate', 'previous', 'assignment', 'approvals', 'artifact-map',
      'synthetic-policy', 'at', 'proposal-out', 'evidence-out'],
      flags: ['json', 'synthetic', 'allow-proposal-output', 'allow-protected-output'] }
  };
  const spec = perCommand[command];
  if (!spec) reject('USAGE');
  const values = Object.create(null);
  const flags = new Set(spec.flags);
  const names = new Set([...spec.values, ...spec.flags]);
  for (let index = 0; index < rest.length; index++) {
    const token = rest[index];
    if (!token?.startsWith('--') || !names.has(token.slice(2))) reject('USAGE');
    const key = token.slice(2);
    if (Object.hasOwn(values, key)) reject('OPTION_REPEATED');
    if (flags.has(key)) { values[key] = true; continue; }
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) reject('OPTION_VALUE_REQUIRED');
    values[key] = value;
    index++;
  }
  if (Object.hasOwn(values, 'json') && !commonFlags.has('json')) reject('USAGE');
  for (const required of ({
    validate: ['manifest'], inspect: ['manifest'], diff: ['candidate', 'previous'],
    verify: ['production', 'result', 'candidate', 'assignment', 'approvals', 'artifact-map', 'synthetic-policy', 'at']
  })[command]) if (!values[required]) reject('OPTION_REQUIRED');
  if (command === 'verify' && !values.synthetic) reject('SYNTHETIC_MODE_REQUIRED');
  if (command !== 'verify' && (values.synthetic || values['allow-proposal-output'] || values['allow-protected-output'])) reject('USAGE');
  if (command === 'verify') {
    if (!!values['proposal-out'] !== !!values['allow-proposal-output']) reject('PROPOSAL_CONSENT_REQUIRED');
    if (!!values['evidence-out'] !== !!values['allow-protected-output']) reject('PROTECTED_OUTPUT_CONSENT_REQUIRED');
    if (values['proposal-out'] && values['evidence-out'] && pathFor(values['proposal-out'], 'output') === pathFor(values['evidence-out'], 'output')) {
      reject('OUTPUT_PATH_CONFLICT', 5, 'output');
    }
  }
  return values;
}

function invalidResult(result, defaultStage = 'schema') {
  if (result?.valid === true) return null;
  const diagnostic = result?.diagnostics?.[0];
  const code = typeof diagnostic?.code === 'string' ? diagnostic.code : 'INPUT_INVALID';
  const stage = typeof diagnostic?.stage === 'string' ? diagnostic.stage : defaultStage;
  const auth = /APPROVAL|DISCLOSURE|ATTESTATION|AUTHORITY|SELF_APPROVAL|PRIVATE_CONTEXT/.test(code);
  const integrity = /REVISION|PRODUCTION_LINK|INPUT_LINK|CANON_INPUT|OUTPUT_|EXECUTION_LINK|GATE_|ARTIFACT|RESULT_|UNEXPECTED_OUTPUT|REQUIRED_OUTPUT|PUBLIC_DEPENDENCIES|UNSAFE_URI/.test(code);
  return new CliError(code, auth ? 3 : integrity ? 4 : 2, stage);
}

function safeDiagnostic(error) {
  return { stage: error.stage ?? 'cli', code: error.code ?? 'INPUT_INVALID', action: 'review-inputs' };
}

function structureSummary(value, source) {
  const summary = { kind: value.kind };
  if (value.kind === 'comic-production') {
    const described = describeComicEpisode(source);
    const error = invalidResult(described, 'episode');
    if (error) throw error;
    const episode = described.episode;
    const plan = planComicReferences(source);
    const panels = episode.panels;
    summary.structure = {
      panel_count: panels.length,
      text_segment_count: panels.reduce((count, panel) => count + panel.text.length, 0),
      asset_use_count: panels.reduce((count, panel) => count + panel.asset_ids.length, 0),
      prompt_binding_count: panels.reduce((count, panel) => count + panel.prompt_bindings.length, 0),
      input_dependency_count: value.inputs.dependencies.length,
      prompt_count: value.inputs.prompts.length,
      asset_count: value.inputs.assets.length,
      reference_plan_status: plan.valid ? 'available' : 'unavailable',
      ...(plan.valid ? { reference_count: plan.references.length } : {})
    };
  } else if (value.kind === 'comic-build-result') {
    summary.structure = {
      status: value.status,
      output_count: value.outputs.length,
      gate_count: value.gates.length,
      transformation_count: value.execution.transformations.length,
      diagnostic_count: value.diagnostics.length
    };
  } else if (value.kind === 'comic-public-release') {
    summary.structure = {
      output_count: value.outputs.length,
      dependency_count: value.dependencies.length,
      gate_count: value.gates.length,
      approval_role_count: value.approvers.length,
      has_predecessor: value.previous !== null
    };
  } else if (value.kind === 'comic-approval-binding') {
    summary.structure = { role: value.role, artifact_digest_count: value.artifact_digests.length };
  }
  return summary;
}

const SYNTHETIC_POLICY_KEYS = ['mode', 'evaluation_time', 'producer_actor', 'approvals', 'disclosure', 'private_influence'];
const SYNTHETIC_APPROVAL_KEYS = ['decision_id', 'role', 'actor', 'subject_sha256', 'artifact_digests', 'scope',
  'intended_action', 'action_time', 'decided_at', 'expires_at', 'authority_reference', 'decision', 'revocation_status', 'checked_at'];
const SYNTHETIC_DISCLOSURE_KEYS = ['decision', 'candidate_sha256', 'proposal_sha256', 'artifact_evidence_sha256', 'scope_sha256', 'checked_at'];
const SYNTHETIC_ATTESTATION_KEYS = ['decision', 'attestation_reference', 'candidate_sha256', 'production_sha256', 'result_sha256',
  'artifact_evidence_sha256', 'lineage_sha256', 'checked_at'];

function validateSyntheticPolicy(policy, at) {
  if (!exactKeys(policy, SYNTHETIC_POLICY_KEYS) || policy.mode !== 'offline-synthetic-cli-v1'
    || policy.evaluation_time !== at || typeof policy.producer_actor !== 'string'
    || !Array.isArray(policy.approvals) || policy.approvals.length < 1 || policy.approvals.length > 16
    || !exactKeys(policy.disclosure, SYNTHETIC_DISCLOSURE_KEYS)
    || !exactKeys(policy.private_influence, SYNTHETIC_ATTESTATION_KEYS)) {
    reject('SYNTHETIC_POLICY_INVALID', 2, 'policy');
  }
  if (!policy.approvals.every(item => exactKeys(item, SYNTHETIC_APPROVAL_KEYS)
    && ['allow', 'deny'].includes(item.decision) && ['active', 'revoked', 'unknown'].includes(item.revocation_status)
    && DIGEST.test(item.subject_sha256) && Array.isArray(item.artifact_digests) && item.artifact_digests.every(x => DIGEST.test(x)))) {
    reject('SYNTHETIC_POLICY_INVALID', 2, 'policy');
  }
  if (!['allow', 'deny'].includes(policy.disclosure.decision) || !DIGEST.test(policy.disclosure.candidate_sha256)
    || !DIGEST.test(policy.disclosure.proposal_sha256) || !DIGEST.test(policy.disclosure.artifact_evidence_sha256)
    || !DIGEST.test(policy.disclosure.scope_sha256) || policy.disclosure.checked_at !== at
    || !['allow', 'deny'].includes(policy.private_influence.decision)
    || !DIGEST.test(policy.private_influence.candidate_sha256) || !DIGEST.test(policy.private_influence.production_sha256)
    || !DIGEST.test(policy.private_influence.result_sha256) || !DIGEST.test(policy.private_influence.artifact_evidence_sha256)
    || !DIGEST.test(policy.private_influence.lineage_sha256) || policy.private_influence.checked_at !== at) {
    reject('SYNTHETIC_POLICY_INVALID', 2, 'policy');
  }
}

function artifactEvidenceDigest(records) { return sha256(canonicalJson(records)); }

async function verifyCommand(options) {
  const [productionSource, resultSource, candidateSource, assignmentSource, approvalsSource, artifactMapSource,
    policySource, previousSource] = await Promise.all([
    readStableFile(options.production), readStableFile(options.result), readStableFile(options.candidate),
    readStableFile(options.assignment), readStableFile(options.approvals), readStableFile(options['artifact-map']),
    readStableFile(options['synthetic-policy']), options.previous ? readStableFile(options.previous) : Promise.resolve(null)
  ]);
  const approvalsValue = strictJson(approvalsSource, 'approval');
  const artifactMap = strictJson(artifactMapSource, 'artifact-map');
  const policy = strictJson(policySource, 'policy');
  validateSyntheticPolicy(policy, options.at);
  if (!Array.isArray(approvalsValue) || approvalsValue.length < 1 || approvalsValue.length > 16
      || !artifactMap || typeof artifactMap !== 'object' || Array.isArray(artifactMap) || Object.keys(artifactMap).length > 64
      || !Object.values(artifactMap).every(path => typeof path === 'string' && path.length > 0)) {
    reject('INPUT_SHAPE', 2, 'input');
  }

  const resultRecord = validateComicManifest(resultSource);
  const error = invalidResult(resultRecord, 'schema');
  if (error) throw error;
  if (resultRecord.value.kind !== 'comic-build-result' || !exactKeys(artifactMap, resultRecord.value.outputs.map(output => output.artifact.artifact_uri))) {
    reject('ARTIFACT_MAP_MISMATCH', 2, 'artifact-map');
  }
  const seenArtifacts = new Set();
  const at = options.at;
  const approvalBoundary = createComicApprovalBoundary({
    producerActor: policy.producer_actor,
    getTime: () => at,
    verifyCurrentApproval: binding => {
      const record = policy.approvals.find(item => item.decision_id === binding.decisionId);
      if (!record) return false;
      return record.decision === 'allow' && record.revocation_status === 'active'
        && record.checked_at === binding.actionTime && policy.evaluation_time === binding.actionTime
        && record.role === binding.role && record.actor === binding.actor
        && record.subject_sha256 === binding.subject.sha256
        && same(record.artifact_digests, binding.artifactDigests)
        && same(record.scope, binding.scope)
        && record.intended_action === binding.intendedAction
        && record.action_time === binding.actionTime
        && record.decided_at === binding.decidedAt
        && record.expires_at === binding.expiresAt
        && record.authority_reference === binding.authorityReference;
    }
  });
  const verifier = createComicBuildResultBoundary({
    approvalBoundary,
    readArtifactBytes: async request => {
      if (!Object.hasOwn(artifactMap, request.artifactUri)) return null;
      const bytes = await readStableFile(artifactMap[request.artifactUri], Math.min(MAX_FILE_BYTES, request.maxBytes));
      seenArtifacts.add(request.artifactUri);
      return bytes;
    },
    verifyPrivateInfluence: request => {
      const decision = policy.private_influence;
      const evidenceDigest = artifactEvidenceDigest(request.artifacts);
      const lineageDigest = sha256(canonicalJson(request.lineage));
      return decision.decision === 'allow' && decision.checked_at === at
        && decision.attestation_reference === request.attestationReference
        && decision.candidate_sha256 === request.candidateIdentity.sha256
        && decision.production_sha256 === request.productionIdentity.sha256
        && decision.result_sha256 === request.resultIdentity.sha256
        && decision.artifact_evidence_sha256 === evidenceDigest
        && decision.lineage_sha256 === lineageDigest;
    },
    verifyCurrentDisclosureApproval: request => {
      const decision = policy.disclosure;
      return decision.decision === 'allow' && decision.checked_at === at
        && decision.candidate_sha256 === request.candidateIdentity.sha256
        && decision.proposal_sha256 === sha256(canonicalJson(request.publicProposal))
        && decision.artifact_evidence_sha256 === artifactEvidenceDigest(request.verifiedArtifactBytes)
        && decision.scope_sha256 === sha256(canonicalJson(request.scope));
    }
  });
  const result = await verifier.verify({
    productionSource, resultSource, candidateSource, previousSource, assignmentSource,
    approvalSources: approvalsValue.map(value => canonicalJson(value))
  });
  const invalid = invalidResult(result, 'build-result');
  if (invalid) throw invalid;
  if (seenArtifacts.size !== Object.keys(artifactMap).length) reject('ARTIFACT_MAP_MISMATCH', 4, 'artifact');

  const created = [];
  try {
    if (options['proposal-out']) created.push(await writeExclusiveFile(options['proposal-out'], result.proposal));
    if (options['evidence-out']) created.push(await writeExclusiveFile(options['evidence-out'], result.protected_evidence));
  } catch (writeError) {
    for (const file of created.reverse()) await removeCreatedFile(file.path, file.identity, file.directories);
    throw writeError;
  }
  return {
    status: 'verified',
    valid: true,
    mode: 'offline-synthetic-only',
    publication_authority: 'not-issued',
    proposal_written: !!options['proposal-out'],
    protected_evidence_written: !!options['evidence-out']
  };
}

async function main(args) {
  if (args.length === 0 || args[0] === '--help' || args[0] === 'help') return { status: 'help', usage: help };
  const [command, ...rest] = args;
  if (command === '--help' || command === 'help') return { status: 'help', usage: help };
  const options = parseOptions(command, rest);
  if (command === 'validate' || command === 'inspect') {
    const source = await readStableFile(options.manifest);
    const result = validateComicManifest(source);
    const invalid = invalidResult(result, 'schema');
    if (invalid) throw invalid;
    if (command === 'validate') return { status: 'valid', valid: true, kind: result.value.kind };
    return { status: 'inspected', valid: true, ...structureSummary(result.value, source) };
  }
  if (command === 'diff') {
    const [candidate, previous] = await Promise.all([readStableFile(options.candidate), readStableFile(options.previous)]);
    const result = diffComicRevision(candidate, previous);
    const invalid = invalidResult(result, 'revision-diff');
    if (invalid) throw invalid;
    if (result.details_withheld) return { status: 'diffed', valid: true, change_status: 'withheld', details_withheld: true };
    return { status: 'diffed', valid: true, change_status: result.changed ? 'changed' : 'unchanged',
      details_withheld: false, categories: [...result.categories] };
  }
  const result = await verifyCommand(options);
  return result;
}

const args = process.argv.slice(2);
const wantsJson = args.includes('--json');
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = await main(args);
    if (report) {
      const { exit = 0, ...body } = report;
      process.exitCode = exit;
      process.stdout.write(wantsJson ? JSON.stringify(body) + '\n'
        : body.status === 'help' ? body.usage
          : `Comic Manifest: ${body.status}.${body.change_status ? ` Change: ${body.change_status}.` : ''}${body.publication_authority ? ` Publication authority ${body.publication_authority}.` : ''}\n`);
    }
  } catch (error) {
    const failure = error instanceof CliError ? error : new CliError('INPUT_INVALID');
    process.exitCode = failure.exit;
    const report = { status: 'failed', valid: false, diagnostics: [safeDiagnostic(failure)] };
    process.stdout.write(wantsJson ? JSON.stringify(report) + '\n'
      : `Comic Manifest failed: ${failure.code}. Review explicit inputs and permissions.\n`);
  }
}
