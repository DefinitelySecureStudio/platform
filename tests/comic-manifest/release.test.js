import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as comicApi from '../../src/comic-manifest/index.js';
import { buildComicManifestRelease, resolveExternalOutput, verifySourceIdentity } from '../../scripts/build-comic-manifest-release.mjs';
import { checkComicManifestRelease, comicManifestReleaseReadiness } from '../../scripts/check-comic-manifest-release.mjs';
import {
  createComicManifestApprovalPacket, PLATFORM_RELEASE_APPROVAL_FORMAT, verifyComicManifestApproval
} from '../../scripts/comic-manifest-approval.mjs';
import { verifyComicManifestDownloads } from '../../scripts/verify-comic-manifest-downloads.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const apiInventory = JSON.parse(await readFile(new URL('../../release/comic-manifest-api-v1.json', import.meta.url)));
const lock = JSON.parse(await readFile(new URL('../../release/comic-manifest-contract-lock.json', import.meta.url)));
const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url)));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');

test('Comic Manifest inventory matches the public package API and additive package metadata', async () => {
  assert.deepEqual(Object.keys(comicApi).sort(), [...apiInventory.exports].sort());
  assert.equal(apiInventory.tag, 'comic-manifest/v1.0.0');
  assert.equal(apiInventory.package_version, '1.2.0');
  assert.deepEqual(apiInventory.codex_contract, {
    repository: 'DefinitelySecureStudio/codex', contract: 'comic-manifest', version: '1.0.0',
    tag: 'contract/comic-manifest/v1.0.0'
  });
  assert.equal(packageJson.version, '1.2.0');
  assert.equal(packageJson.private, true);
  const npmLock = JSON.parse(await readFile(new URL('../../package-lock.json', import.meta.url)));
  assert.equal(npmLock.version, packageJson.version);
  assert.equal(npmLock.packages[''].version, packageJson.version);
  assert.equal(packageJson.exports['./comic-manifest'], './src/comic-manifest/index.js');
  assert.equal(packageJson.bin['studio-comic'], './src/comic-manifest/cli.js');
});

test('published Codex lock adopts exact immutable tuples while Platform remains unpublished', async () => {
  assert.equal(lock.commit, '12e437e30328a3bb9cd2d15e6307a70b4b7e0e2a');
  assert.equal(lock.status, 'published');
  assert.equal(lock.tag, 'contract/comic-manifest/v1.0.0');
  assert.equal(lock.publication.status, 'published');
  assert.equal(lock.publication.draft, false);
  assert.equal(lock.publication.prerelease, false);
  assert.equal(lock.publication.immutable, true);
  assert.equal(lock.publication.tag_target, lock.commit);
  assert.deepEqual(lock.assets.map(({ filename, media_type, byte_size, sha256 }) => ({ filename, media_type, byte_size, sha256 })), [
    { filename: 'comic-manifest-v1.0.0.schema.json', media_type: 'application/schema+json', byte_size: 30860, sha256: 'sha256:7bd3c5392ae0db0c5baba553c233142d3d4427471f5850123eef7b87d4c8eaa4' },
    { filename: 'comic-manifest-v1.0.0.bundle.json', media_type: 'application/json', byte_size: 865650, sha256: 'sha256:bb131a7dbb96692172b4e44b56a272d041309e53b136433cc71a24c8d1b934de' },
    { filename: 'comic-manifest-v1.0.0.manifest.json', media_type: 'application/json', byte_size: 1152, sha256: 'sha256:56bba6d990c429384e16d8aa49af99b3a25ca8733efa96b5681be5932dcba878' }
  ]);
  assert.deepEqual(lock.publication.transport.map(({ filename, github_release_asset_content_type, public_download_http_status, public_download_content_type }) => ({ filename, github_release_asset_content_type, public_download_http_status, public_download_content_type })), [
    { filename: 'comic-manifest-v1.0.0.schema.json', github_release_asset_content_type: 'application/json', public_download_http_status: 200, public_download_content_type: 'application/octet-stream' },
    { filename: 'comic-manifest-v1.0.0.bundle.json', github_release_asset_content_type: 'application/json', public_download_http_status: 200, public_download_content_type: 'application/octet-stream' },
    { filename: 'comic-manifest-v1.0.0.manifest.json', github_release_asset_content_type: 'application/json', public_download_http_status: 200, public_download_content_type: 'application/octet-stream' }
  ]);
  assert.equal(apiInventory.upstream_contract_status, 'published');
  assert.equal(apiInventory.publication_status, 'candidate-unpublished');
  assert.equal(packageJson.private, true);
  assert.deepEqual(await comicManifestReleaseReadiness(), { ready: true, blockers: [] });

  for (const mutate of [
    candidate => { candidate.commit = '028d5638e20d9283a2955aacbd38e1bfc6dca259'; },
    candidate => { candidate.publication.immutable = false; },
    candidate => { candidate.assets[0].sha256 = 'sha256:' + '0'.repeat(64); },
    candidate => { candidate.publication.transport[0].public_download_content_type = 'application/schema+json'; }
  ]) {
    const candidate = structuredClone(lock);
    mutate(candidate);
    assert.equal(checkComicManifestRelease({ pkg: packageJson, lock: candidate }).ready, false);
  }
});

test('release output path resolution rejects symlinked parents into the checkout and returns physical external paths', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-output-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const alias = join(temp, 'checkout-alias');
  await symlink(root, alias, 'dir');
  await assert.rejects(resolveExternalOutput(join(alias, 'release-output')), /outside checkout/);
  const externalAlias = join(temp, 'external-alias'), externalTarget = join(temp, 'physical-output-parent');
  await mkdir(externalTarget);
  await symlink(externalTarget, externalAlias, 'dir');
  assert.equal(await resolveExternalOutput(join(externalAlias, 'release-output')), join(await realpath(externalTarget), 'release-output'));
});

test('Platform artifact provenance accepts a source commit only for the exact local Git tree', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-source-identity-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' }).trim();
  const manifest = await buildComicManifestRelease(join(temp, 'matching'), {
    sourceIdentity: { commit: sourceCommit, tree }
  });
  assert.equal(manifest.commit, sourceCommit);
  assert.equal(manifest.tree, tree);

  await assert.rejects(buildComicManifestRelease(join(temp, 'missing'), {
    sourceIdentity: { commit: 'a'.repeat(40), tree }
  }), /not present as a verified local Git commit object/);

  await assert.rejects(buildComicManifestRelease(join(temp, 'non-commit-object'), {
    sourceIdentity: { commit: tree, tree }
  }), /not present as a verified local Git commit object/);

  await assert.rejects(buildComicManifestRelease(join(temp, 'mismatch'), {
    sourceIdentity: { commit: sourceCommit, tree: 'b'.repeat(40) }
  }), /exact matching local Git tree/);
});

test('Platform source provenance ignores Git replacement refs in an isolated repository', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-replace-ref-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const isolated = join(temp, 'repo');
  execFileSync('git', ['clone', '--local', '--no-hardlinks', root, isolated], { stdio: 'ignore' });
  const git = (...args) => execFileSync('git', args, { cwd: isolated, encoding: 'utf8' }).trim();
  const sourceCommit = git('rev-parse', 'HEAD');
  const tree = git('rev-parse', 'HEAD^{tree}');
  const emptyTree = execFileSync('git', ['mktree'], { cwd: isolated, encoding: 'utf8', input: '' }).trim();
  const replacementCommit = execFileSync('git', [
    '-c', 'user.name=Release Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit-tree', emptyTree, '-p', sourceCommit, '-m', 'replacement-ref provenance fixture'
  ], { cwd: isolated, encoding: 'utf8' }).trim();

  git('replace', sourceCommit, replacementCommit);
  assert.equal(verifySourceIdentity({ commit: sourceCommit, tree }, tree, isolated), true,
    'a replacement ref cannot change the verified tree of a valid source commit');
  git('replace', '-d', sourceCommit);
  git('replace', replacementCommit, sourceCommit);
  assert.throws(() => verifySourceIdentity({ commit: replacementCommit, tree }, tree, isolated), /exact matching local Git tree/,
    'a replacement ref cannot make a wrong commit appear to contain the checkout tree');
});

test('approval-candidate artifacts build reproducibly from a clean exact source identity', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-release-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const outputA = join(temp, 'a'), outputB = join(temp, 'b');
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const sourceTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' }).trim();
  const sourceIdentity = { commit: sourceCommit, tree: sourceTree };
  const manifestA = await buildComicManifestRelease(outputA, { sourceIdentity });
  const manifestB = await buildComicManifestRelease(outputB, { sourceIdentity });
  assert.deepEqual(manifestA.build_provenance, {
    mode: 'release-approval-candidate', owner_approval_status_at_build: 'not-approved', publication_status_at_build: 'not-published'
  });
  assert.deepEqual(manifestA.codex_adoption, { ready: true, blockers: manifestB.codex_adoption.blockers });
  assert.equal(manifestA.component, 'comic-manifest');
  assert.equal(manifestA.version, '1.0.0');
  assert.equal(manifestA.package_version, '1.2.0');
  assert.equal(manifestA.tag, 'comic-manifest/v1.0.0');
  assert.deepEqual(manifestA.codex_contract, lock);
  assert.deepEqual(manifestA.assets.map(asset => asset.filename).sort(), [
    'comic-manifest-v1.0.0.source.tar.gz', 'comic-manifest-v1.0.0.package.tgz',
    'comic-manifest-v1.0.0.package-lock.json', 'comic-manifest-v1.0.0.sdk-contract-lock.json',
    'comic-manifest-v1.0.0.context-builder-contract-lock.json', 'comic-manifest-v1.0.0.contract-lock.json',
    'comic-manifest-v1.0.0.api-v1.json'
  ].sort());
  for (const asset of manifestA.assets) {
    const bytes = await readFile(join(outputA, asset.filename));
    assert.equal(bytes.length, asset.byte_size);
    assert.equal(digest(bytes), asset.sha256);
    assert.match(asset.artifact_uri, /releases\/download\/comic-manifest%2Fv1\.0\.0\//);
    if (asset.filename.endsWith('.tar.gz') || asset.filename.endsWith('.tgz')) assert.equal(asset.media_type, 'application/gzip');
    else assert.equal(asset.media_type, 'application/json');
  }
  assert.equal(manifestA.assets.find(asset => asset.filename.endsWith('.source.tar.gz')).media_type, 'application/gzip');
  assert.equal(manifestA.assets.find(asset => asset.filename.endsWith('.package.tgz')).media_type, 'application/gzip');
  const manifestPath = 'comic-manifest-v1.0.0.manifest.json';
  const manifestBytesA = await readFile(join(outputA, manifestPath));
  const manifestBytesB = await readFile(join(outputB, manifestPath));
  assert.deepEqual(manifestBytesA, manifestBytesB);
  assert.deepEqual((await readdir(outputA)).sort(), (await readdir(outputB)).sort());
  for (const name of await readdir(outputA)) assert.deepEqual(await readFile(join(outputA, name)), await readFile(join(outputB, name)), name);

  const extracted = join(temp, 'extracted'); await mkdir(extracted);
  const packageEntries = execFileSync('tar', ['-tzf', join(outputA, 'comic-manifest-v1.0.0.package.tgz')], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  assert.ok(packageEntries.includes('package/src/comic-manifest/cli.js'));
  assert.ok(packageEntries.includes('package/LICENSE'));
  assert.equal(packageEntries.some(name => /(^|\/)(tests|fixtures|examples)(\/|$)/.test(name)), false);
  execFileSync('tar', ['-xzf', join(outputA, 'comic-manifest-v1.0.0.package.tgz'), '-C', extracted]);
  const packageRoot = join(extracted, 'package');
  assert.equal((await readdir(packageRoot)).includes('node_modules'), false);
  const suppliedLock = JSON.parse(await readFile(join(outputA, 'comic-manifest-v1.0.0.package-lock.json'), 'utf8'));
  assert.deepEqual(suppliedLock.packages[''].dependencies, packageJson.dependencies);
  const consumer = join(temp, 'offline-consumer'); await mkdir(consumer);
  const localArchive = '../a/comic-manifest-v1.0.0.package.tgz';
  const vendor = join(temp, 'offline-vendor'), cache = join(temp, 'offline-npm-cache');
  await mkdir(vendor);
  const localDependencies = ['ajv', 'ajv-formats', 'fast-deep-equal', 'fast-uri', 'json-schema-traverse', 'require-from-string'];
  const consumerDependencies = { '@definitely-secure-studio/platform': 'file:' + localArchive };
  for (const name of localDependencies) {
    const lockEntry = suppliedLock.packages['node_modules/' + name];
    const installed = JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'));
    assert.equal(installed.version, lockEntry.version, 'local smoke dependency must match the supplied lock: ' + name);
    const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--offline', '--cache', cache,
      '--json', '--pack-destination', vendor, join(root, 'node_modules', name)], { cwd: consumer, encoding: 'utf8' }));
    assert.equal(packed.length, 1);
    consumerDependencies[name] = 'file:../offline-vendor/' + packed[0].filename;
  }
  await writeFile(join(consumer, 'package.json'), JSON.stringify({
    name: 'comic-manifest-offline-consumer', version: '1.0.0', private: true, type: 'module',
    dependencies: consumerDependencies
  }, null, 2) + '\n');
  execFileSync('npm', ['install', '--package-lock-only', '--offline', '--ignore-scripts', '--cache', cache], { cwd: consumer, stdio: 'pipe' });
  execFileSync('npm', ['ci', '--offline', '--ignore-scripts', '--cache', cache], { cwd: consumer, stdio: 'pipe' });
  const installedApi = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    "import * as api from '@definitely-secure-studio/platform/comic-manifest'; console.log(JSON.stringify(Object.keys(api).sort()))"],
  { cwd: consumer, encoding: 'utf8' }));
  assert.deepEqual(installedApi, [...apiInventory.exports].sort());
  const consumerModules = await lstat(join(consumer, 'node_modules'));
  assert.equal(consumerModules.isSymbolicLink(), false);
  const installedPackage = await realpath(join(consumer, 'node_modules/@definitely-secure-studio/platform'));
  assert.ok(installedPackage.startsWith(join(await realpath(consumer), 'node_modules') + '/'));
  const fixture = JSON.parse(await readFile(join(root, 'tests/fixtures/comic-manifest-v1.json'), 'utf8'));
  const publicManifest = join(await realpath(temp), 'synthetic-public-release.json');
  await writeFile(publicManifest, JSON.stringify(fixture.release) + '\n');
  const bin = join(consumer, 'node_modules/.bin/studio-comic');
  const result = execFileSync(bin, ['validate', '--manifest', publicManifest, '--json'], { cwd: consumer, encoding: 'utf8' });
  assert.equal(JSON.parse(result).status, 'valid');

  const packed = join(temp, 'packed-source'); await mkdir(packed);
  execFileSync('tar', ['-xzf', join(outputA, 'comic-manifest-v1.0.0.source.tar.gz'), '-C', packed]);
  const sourceRoot = join(packed, 'platform');
  assert.deepEqual(JSON.parse(await readFile(join(sourceRoot, 'release/comic-manifest-contract-lock.json'), 'utf8')), lock);
  assert.equal(JSON.parse(await readFile(join(sourceRoot, 'release/comic-manifest-api-v1.json'), 'utf8')).tag, 'comic-manifest/v1.0.0');
});

test('detached owner approval binds the exact eight-file set and verification never mutates it', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-approval-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const artifacts = join(temp, 'artifacts'), packetPath = join(temp, 'approval.json');
  await buildComicManifestRelease(artifacts);

  const snapshot = async directory => {
    const names = (await readdir(directory)).sort();
    return Promise.all(names.map(async name => [name, await readFile(join(directory, name))]));
  };
  const beforeGeneration = await snapshot(artifacts);
  const packet = await createComicManifestApprovalPacket(artifacts);
  assert.equal(packet.format, PLATFORM_RELEASE_APPROVAL_FORMAT);
  assert.equal(packet.status, 'awaiting-owner-decision');
  assert.equal(packet.owner_approval, null);
  assert.equal(packet.release.tag, 'comic-manifest/v1.0.0');
  assert.match(packet.release.source_commit, /^[a-f0-9]{40}$/);
  assert.match(packet.release.source_tree, /^[a-f0-9]{40}$/);
  assert.equal(packet.artifacts.length, 8);
  assert.equal(packet.artifacts.at(-1).filename, 'comic-manifest-v1.0.0.manifest.json');
  assert.deepEqual(await snapshot(artifacts), beforeGeneration, 'packet generation is read-only');
  const packetFromCli = JSON.parse(execFileSync(process.execPath, [
    join(root, 'scripts/create-comic-manifest-approval-packet.mjs'), artifacts
  ], { encoding: 'utf8' }));
  assert.deepEqual(packetFromCli, packet);
  await writeFile(packetPath, JSON.stringify(packet, null, 2) + '\n');
  const beforeMissingApproval = await snapshot(artifacts);
  await assert.rejects(verifyComicManifestApproval(artifacts, packetPath), /explicit owner decision/);
  assert.deepEqual(await snapshot(artifacts), beforeMissingApproval, 'rejected verification does not mutate assets');

  const approved = structuredClone(packet);
  approved.status = 'approved';
  approved.owner_approval = {
    decision: 'approve', owner: '@andrewperis', approved_at: '2026-10-10T00:00:00Z',
    decision_reference: 'synthetic-test-approval'
  };
  await writeFile(packetPath, JSON.stringify(approved, null, 2) + '\n');
  const beforeVerification = await snapshot(artifacts), approvalBytes = await readFile(packetPath);
  const report = await verifyComicManifestApproval(artifacts, packetPath);
  assert.deepEqual(report, {
    approved: true, repository: 'DefinitelySecureStudio/platform', component: 'comic-manifest',
    version: '1.0.0', package_version: '1.2.0', tag: 'comic-manifest/v1.0.0',
    commit: packet.release.source_commit, tree: packet.release.source_tree, artifacts: 8
  });
  assert.deepEqual(await snapshot(artifacts), beforeVerification, 'successful verification does not mutate assets');
  assert.deepEqual(await readFile(packetPath), approvalBytes, 'successful verification does not rewrite the approval');
  assert.deepEqual(JSON.parse(execFileSync(process.execPath, [
    join(root, 'scripts/verify-comic-manifest-approval.mjs'), artifacts, packetPath
  ], { encoding: 'utf8' })), report);

  const changedPackets = [
    record => { record.release.source_commit = '0'.repeat(40); },
    record => { record.release.source_tree = '0'.repeat(40); },
    record => { record.release.tag = 'comic-manifest/v2.0.0'; },
    record => { record.artifacts[0].byte_size += 1; },
    record => { record.artifacts[0].sha256 = 'sha256:' + '0'.repeat(64); },
    record => { record.artifacts.pop(); },
    record => { record.artifacts.push(structuredClone(record.artifacts[0])); },
    record => { record.owner_approval = null; },
    record => { record.owner_approval.owner = '@someone-else'; },
    record => { record.owner_approval.decision = 'deny'; },
    record => { record.owner_approval.approved_at = 'invalid'; },
    record => { record.owner_approval.decision_reference = ''; }
  ];
  for (const mutate of changedPackets) {
    const changed = structuredClone(approved);
    mutate(changed);
    await writeFile(packetPath, JSON.stringify(changed, null, 2) + '\n');
    const filesBefore = await snapshot(artifacts), packetBefore = await readFile(packetPath);
    await assert.rejects(verifyComicManifestApproval(artifacts, packetPath));
    assert.deepEqual(await snapshot(artifacts), filesBefore, 'rejected verification does not alter artifacts');
    assert.deepEqual(await readFile(packetPath), packetBefore, 'rejected verification does not alter the packet');
  }

  await writeFile(packetPath, JSON.stringify(approved, null, 2) + '\n');
  const changedAsset = join(artifacts, packet.artifacts[0].filename);
  const originalAsset = await readFile(changedAsset);
  await writeFile(changedAsset, Buffer.concat([originalAsset, Buffer.from('x')]));
  const tamperedBefore = await snapshot(artifacts);
  await assert.rejects(verifyComicManifestApproval(artifacts, packetPath), /differs from its manifest tuple/);
  assert.deepEqual(await snapshot(artifacts), tamperedBefore, 'tamper rejection leaves the changed file untouched');
  await writeFile(changedAsset, originalAsset);

  const manifestFile = join(artifacts, 'comic-manifest-v1.0.0.manifest.json');
  const originalManifest = await readFile(manifestFile);
  await writeFile(manifestFile, Buffer.concat([originalManifest, Buffer.from('\n')]));
  const changedManifestBefore = await snapshot(artifacts);
  await assert.rejects(verifyComicManifestApproval(artifacts, packetPath), /artifact tuple mismatch/);
  assert.deepEqual(await snapshot(artifacts), changedManifestBefore, 'manifest mismatch is rejected without rewriting it');
  await writeFile(manifestFile, originalManifest);

  const extraFile = join(artifacts, 'unexpected.txt');
  await writeFile(extraFile, 'extra');
  const extraBefore = await snapshot(artifacts);
  await assert.rejects(verifyComicManifestApproval(artifacts, packetPath), /exactly the eight release files/);
  assert.deepEqual(await snapshot(artifacts), extraBefore, 'extra-file rejection is read-only');
  await rm(extraFile);

  const missingFile = join(artifacts, packet.artifacts[0].filename);
  await rm(missingFile);
  const missingBefore = await snapshot(artifacts);
  await assert.rejects(verifyComicManifestApproval(artifacts, packetPath), /exactly the eight release files/);
  assert.deepEqual(await snapshot(artifacts), missingBefore, 'missing-file rejection does not restore or rewrite files');
});

test('fresh-download verifier checks trusted manifest bytes, exact allowlist, regular files, size and SHA-256', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-download-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const source = join(temp, 'source'), downloads = join(temp, 'downloads');
  await mkdir(downloads);
  const built = await buildComicManifestRelease(source);
  const downloadedManifest = 'comic-manifest-v1.0.0.manifest.json';
  const trustedBytes = await readFile(join(source, downloadedManifest));
  const trusted = JSON.parse(trustedBytes);
  assert.deepEqual(trusted, built);
  const trustedPath = join(temp, 'trusted-build-manifest.json');
  await writeFile(trustedPath, trustedBytes);
  for (const asset of trusted.assets) await writeFile(join(downloads, asset.filename), await readFile(join(source, asset.filename)));
  await writeFile(join(downloads, downloadedManifest), trustedBytes);
  assert.deepEqual(await verifyComicManifestDownloads(trustedPath, downloads), {
    verified: true, commit: trusted.commit, assets: trusted.assets.length + 1
  });
  await writeFile(join(downloads, 'unexpected.txt'), 'extra');
  await assert.rejects(verifyComicManifestDownloads(trustedPath, downloads), /complete trusted approval-candidate/);
  await rm(join(downloads, 'unexpected.txt'));

  const tampered = join(temp, 'tampered'); await mkdir(tampered);
  for (const asset of trusted.assets) await writeFile(join(tampered, asset.filename), await readFile(join(source, asset.filename)));
  await writeFile(join(tampered, downloadedManifest), trustedBytes);
  const first = trusted.assets[0];
  const originalAsset = await readFile(join(tampered, first.filename));
  await writeFile(join(tampered, first.filename), Buffer.concat([originalAsset, Buffer.from('x')]));
  await assert.rejects(verifyComicManifestDownloads(trustedPath, tampered), /identity mismatch/);

  const symlinked = join(temp, 'symlinked'); await mkdir(symlinked);
  for (const asset of trusted.assets.slice(1)) await writeFile(join(symlinked, asset.filename), await readFile(join(source, asset.filename)));
  await symlink(join(source, first.filename), join(symlinked, first.filename));
  await writeFile(join(symlinked, downloadedManifest), trustedBytes);
  await assert.rejects(verifyComicManifestDownloads(trustedPath, symlinked), /regular file/);

  const linkedDirectory = join(temp, 'linked-downloads');
  await symlink(downloads, linkedDirectory, 'dir');
  await assert.rejects(verifyComicManifestDownloads(trustedPath, linkedDirectory), /regular directory/);

  const invalidTrusted = structuredClone(trusted);
  invalidTrusted.assets[0].filename = '../outside';
  const invalidPath = join(temp, 'invalid-trusted-manifest.json');
  const invalidBytes = Buffer.from(JSON.stringify(invalidTrusted, null, 2) + '\n');
  await writeFile(invalidPath, invalidBytes);
  await writeFile(join(downloads, downloadedManifest), invalidBytes);
  await assert.rejects(verifyComicManifestDownloads(invalidPath, downloads), /Unexpected or incomplete/);
  await writeFile(join(downloads, downloadedManifest), trustedBytes);

  const manifestMismatch = join(temp, 'manifest-mismatch'); await mkdir(manifestMismatch);
  for (const asset of trusted.assets) await writeFile(join(manifestMismatch, asset.filename), await readFile(join(source, asset.filename)));
  await writeFile(join(manifestMismatch, downloadedManifest), Buffer.from('different manifest bytes'));
  await assert.rejects(verifyComicManifestDownloads(trustedPath, manifestMismatch), /differs from trusted build/);
});
