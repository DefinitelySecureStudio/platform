import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const PLATFORM_RELEASE_APPROVAL_FORMAT = 'DefinitelySecureStudio.PlatformComicManifestReleaseApproval/v1';
export const PLATFORM_RELEASE_OWNER = '@andrewperis';

const prefix = 'comic-manifest-v1.0.0';
const manifestFilename = prefix + '.manifest.json';
const assetFilenames = [
  prefix + '.source.tar.gz',
  prefix + '.package.tgz',
  prefix + '.package-lock.json',
  prefix + '.sdk-contract-lock.json',
  prefix + '.context-builder-contract-lock.json',
  prefix + '.contract-lock.json',
  prefix + '.api-v1.json'
];
const allFilenames = [...assetFilenames, manifestFilename];
const tag = 'comic-manifest/v1.0.0';
const codexCommit = '12e437e30328a3bb9cd2d15e6307a70b4b7e0e2a';
const downloadPrefix = 'https://github.com/DefinitelySecureStudio/platform/releases/download/' + encodeURIComponent(tag) + '/';
const hash = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const sorted = values => [...values].sort();
const exactKeys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) &&
  JSON.stringify(sorted(Object.keys(value))) === JSON.stringify(sorted(expected));

function parseJson(bytes, label) {
  try { return JSON.parse(bytes); }
  catch { throw Error(label + ' is not valid JSON.'); }
}

async function readRegularFile(directory, filename) {
  const path = join(directory, filename);
  let info;
  try { info = await lstat(path); }
  catch { throw Error('Missing release artifact: ' + filename + '.'); }
  if (!info.isFile() || info.isSymbolicLink()) throw Error('Release artifact must be a regular file: ' + filename + '.');
  return readFile(path);
}

async function inspectApprovalCandidate(directory) {
  let rootInfo;
  try { rootInfo = await lstat(directory); }
  catch { throw Error('Approval artifact directory is missing.'); }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw Error('Approval artifact path must be a regular directory.');
  const names = sorted(await readdir(directory));
  if (JSON.stringify(names) !== JSON.stringify(sorted(allFilenames))) {
    throw Error('Approval artifact directory must contain exactly the eight release files.');
  }

  const manifestBytes = await readRegularFile(directory, manifestFilename);
  const manifest = parseJson(manifestBytes, 'Release manifest');
  if (manifest?.repository !== 'DefinitelySecureStudio/platform' || manifest?.component !== 'comic-manifest' ||
      manifest?.version !== '1.0.0' || manifest?.package_version !== '1.2.0' || manifest?.tag !== tag ||
      !/^[a-f0-9]{40}$/.test(manifest?.commit ?? '') || !/^[a-f0-9]{40}$/.test(manifest?.tree ?? '') ||
      !exactKeys(manifest?.build_provenance, ['mode', 'owner_approval_status_at_build', 'publication_status_at_build']) ||
      manifest.build_provenance.mode !== 'release-approval-candidate' ||
      manifest.build_provenance.owner_approval_status_at_build !== 'not-approved' ||
      manifest.build_provenance.publication_status_at_build !== 'not-published' ||
      !exactKeys(manifest?.codex_adoption, ['ready', 'blockers']) || manifest.codex_adoption.ready !== true ||
      !Array.isArray(manifest.codex_adoption.blockers) || manifest.codex_adoption.blockers.length !== 0 ||
      manifest?.codex_contract?.status !== 'published' || manifest.codex_contract.repository !== 'DefinitelySecureStudio/codex' ||
      manifest.codex_contract.contract !== 'comic-manifest' || manifest.codex_contract.version !== '1.0.0' ||
      manifest.codex_contract.tag !== 'contract/comic-manifest/v1.0.0' || manifest.codex_contract.commit !== codexCommit ||
      manifest.codex_contract.publication?.immutable !== true || manifest.codex_contract.publication?.tag_target !== codexCommit) {
    throw Error('Release manifest does not identify the expected approval-candidate build and source.');
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== assetFilenames.length ||
      JSON.stringify(manifest.assets.map(asset => asset?.filename)) !== JSON.stringify(assetFilenames)) {
    throw Error('Release manifest must list the exact seven Platform assets in the fixed order.');
  }

  const artifacts = [];
  for (let index = 0; index < assetFilenames.length; index++) {
    const filename = assetFilenames[index];
    const asset = manifest.assets[index];
    const mediaType = filename.endsWith('.gz') || filename.endsWith('.tgz') ? 'application/gzip' : 'application/json';
    if (!exactKeys(asset, ['filename', 'media_type', 'byte_size', 'sha256', 'artifact_uri']) ||
        asset.media_type !== mediaType || asset.artifact_uri !== downloadPrefix + filename ||
        !Number.isSafeInteger(asset.byte_size) || asset.byte_size < 1 || !/^sha256:[a-f0-9]{64}$/.test(asset.sha256 ?? '')) {
      throw Error('Release manifest contains an invalid asset tuple: ' + filename + '.');
    }
    const bytes = await readRegularFile(directory, filename);
    if (bytes.length !== asset.byte_size || hash(bytes) !== asset.sha256) {
      throw Error('Release artifact differs from its manifest tuple: ' + filename + '.');
    }
    artifacts.push({ filename, byte_size: bytes.length, sha256: hash(bytes) });
  }

  artifacts.push({ filename: manifestFilename, byte_size: manifestBytes.length, sha256: hash(manifestBytes) });
  return {
    manifest,
    artifacts,
    release: {
      repository: manifest.repository,
      component: manifest.component,
      version: manifest.version,
      package_version: manifest.package_version,
      tag: manifest.tag,
      source_commit: manifest.commit,
      source_tree: manifest.tree
    }
  };
}

/** Build a detached, unapproved packet from the exact eight-file set. This function reads only. */
export async function createComicManifestApprovalPacket(directory) {
  const inspected = await inspectApprovalCandidate(directory);
  return {
    format: PLATFORM_RELEASE_APPROVAL_FORMAT,
    status: 'awaiting-owner-decision',
    release: inspected.release,
    artifacts: inspected.artifacts,
    owner_approval: null
  };
}

/** Verify a detached owner decision against the exact release directory. This function reads only. */
export async function verifyComicManifestApproval(directory, approvalPacketPath) {
  const packetInfo = await lstat(approvalPacketPath).catch(() => null);
  if (!packetInfo?.isFile() || packetInfo.isSymbolicLink()) throw Error('Detached approval packet must be a regular file.');
  const packet = parseJson(await readFile(approvalPacketPath), 'Detached approval packet');
  const inspected = await inspectApprovalCandidate(directory);

  if (!exactKeys(packet, ['format', 'status', 'release', 'artifacts', 'owner_approval']) ||
      packet.format !== PLATFORM_RELEASE_APPROVAL_FORMAT) {
    throw Error('Detached approval packet has an unsupported format.');
  }
  if (packet.status !== 'approved' || !packet.owner_approval) {
    throw Error('Detached approval packet has no explicit owner decision.');
  }
  if (
      !exactKeys(packet.release, ['repository', 'component', 'version', 'package_version', 'tag', 'source_commit', 'source_tree']) ||
      Object.keys(inspected.release).some(key => packet.release[key] !== inspected.release[key]) || !Array.isArray(packet.artifacts) ||
      packet.artifacts.length !== inspected.artifacts.length) {
    throw Error('Detached approval does not bind the exact source commit, tree, tag, and eight release artifacts.');
  }
  for (let index = 0; index < inspected.artifacts.length; index++) {
    const artifact = packet.artifacts[index];
    const expected = inspected.artifacts[index];
    if (!exactKeys(artifact, ['filename', 'byte_size', 'sha256']) || artifact.filename !== expected.filename ||
        artifact.byte_size !== expected.byte_size || artifact.sha256 !== expected.sha256) {
      throw Error('Detached approval artifact tuple mismatch: ' + expected.filename + '.');
    }
  }

  const approval = packet.owner_approval;
  if (!exactKeys(approval, ['decision', 'owner', 'approved_at', 'decision_reference']) ||
      approval.decision !== 'approve' || approval.owner !== PLATFORM_RELEASE_OWNER ||
      typeof approval.approved_at !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(approval.approved_at) ||
      !Number.isFinite(Date.parse(approval.approved_at)) || typeof approval.decision_reference !== 'string' ||
      !approval.decision_reference.trim()) {
    throw Error('Detached approval must contain an explicit owner decision and reference.');
  }

  return {
    approved: true,
    repository: inspected.release.repository,
    component: inspected.release.component,
    version: inspected.release.version,
    package_version: inspected.release.package_version,
    tag: inspected.release.tag,
    commit: inspected.release.source_commit,
    tree: inspected.release.source_tree,
    artifacts: inspected.artifacts.length
  };
}
