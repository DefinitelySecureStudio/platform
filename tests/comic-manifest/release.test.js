import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as comicApi from '../../src/comic-manifest/index.js';
import { buildComicManifestRelease, resolveExternalOutput } from '../../scripts/build-comic-manifest-release.mjs';
import { checkComicManifestRelease, comicManifestReleaseReadiness } from '../../scripts/check-comic-manifest-release.mjs';
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

test('candidate lock pins exact Codex bytes while readiness remains blocked until publication and adoption', async () => {
  assert.equal(lock.commit, 'edef7684d07f7b1f53ca7b077b521077a0a164d4');
  assert.equal(lock.status, 'candidate-unpublished');
  assert.equal(lock.assets.length, 3);
  const report = await comicManifestReleaseReadiness();
  assert.equal(report.ready, false);
  assert.ok(report.blockers.some(blocker => /publication/.test(blocker)));
  assert.ok(report.blockers.some(blocker => /Runtime validator pin/.test(blocker)));

  const published = structuredClone(lock);
  published.status = 'published';
  published.publication = {
    status: 'published', immutable: true, verified_at: '2026-10-07T20:00:00Z',
    release_url: 'https://github.com/DefinitelySecureStudio/codex/releases/tag/contract/comic-manifest/v1.0.0'
  };
  const schema = published.assets.find(asset => asset.filename.endsWith('.schema.json'));
  const pin = {
    status: 'released', repository: published.repository, version: published.version,
    tag: published.tag, commit: published.commit, schema_id: published.schema_id,
    artifact_uri: schema.artifact_uri, media_type: schema.media_type,
    byte_size: schema.byte_size, sha256: schema.sha256
  };
  assert.deepEqual(checkComicManifestRelease({ pkg: packageJson, lock: published, pin }), { ready: true, blockers: [] });
  published.publication.status = 'pending';
  const contradictoryPublication = checkComicManifestRelease({ pkg: packageJson, lock: published, pin });
  assert.equal(contradictoryPublication.ready, false, 'top-level published status cannot override pending publication evidence');
  assert.ok(contradictoryPublication.blockers.some(blocker => /publication/.test(blocker)));
  published.publication.status = 'published';
  published.assets[1].sha256 = 'not-a-digest';
  assert.equal(checkComicManifestRelease({ pkg: packageJson, lock: published, pin }).ready, false);
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
  const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' }).trim();
  const sourceCommit = 'a'.repeat(40);
  const manifest = await buildComicManifestRelease(join(temp, 'matching'), {
    candidate: true, sourceIdentity: { commit: sourceCommit, tree }
  });
  assert.equal(manifest.commit, sourceCommit);
  assert.equal(manifest.tree, tree);
  await assert.rejects(buildComicManifestRelease(join(temp, 'mismatch'), {
    candidate: true, sourceIdentity: { commit: sourceCommit, tree: 'b'.repeat(40) }
  }), /exact matching Git tree/);
});

test('candidate artifacts build reproducibly with an exact manifest and declared media types', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-release-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const outputA = join(temp, 'a'), outputB = join(temp, 'b');
  await assert.rejects(buildComicManifestRelease(outputA), /not ready/);
  const manifestA = await buildComicManifestRelease(outputA, { candidate: true });
  const manifestB = await buildComicManifestRelease(outputB, { candidate: true });
  assert.equal(manifestA.candidate, true);
  assert.deepEqual(manifestA.readiness, { ready: false, blockers: manifestB.readiness.blockers });
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

test('fresh-download verifier checks trusted manifest bytes, exact allowlist, regular files, size and SHA-256', async t => {
  const temp = await mkdtemp(join(tmpdir(), 'comic-manifest-download-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const source = join(temp, 'source'), downloads = join(temp, 'downloads');
  await mkdir(downloads);
  const manifest = await buildComicManifestRelease(source, { candidate: true });
  const trusted = structuredClone(manifest);
  trusted.candidate = false; trusted.readiness = { ready: true, blockers: [] };
  const trustedBytes = Buffer.from(JSON.stringify(trusted, null, 2) + '\n');
  const trustedPath = join(temp, 'trusted-build-manifest.json');
  await writeFile(trustedPath, trustedBytes);
  for (const asset of trusted.assets) await writeFile(join(downloads, asset.filename), await readFile(join(source, asset.filename)));
  const downloadedManifest = 'comic-manifest-v1.0.0.manifest.json';
  await writeFile(join(downloads, downloadedManifest), trustedBytes);
  assert.deepEqual(await verifyComicManifestDownloads(trustedPath, downloads), {
    verified: true, commit: trusted.commit, assets: trusted.assets.length + 1
  });

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
