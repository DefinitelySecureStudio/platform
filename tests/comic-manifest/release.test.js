import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as comicApi from '../../src/comic-manifest/index.js';
import { buildComicManifestRelease } from '../../scripts/build-comic-manifest-release.mjs';
import { checkComicManifestRelease, comicManifestReleaseReadiness } from '../../scripts/check-comic-manifest-release.mjs';

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
  published.assets[1].sha256 = 'not-a-digest';
  assert.equal(checkComicManifestRelease({ pkg: packageJson, lock: published, pin }).ready, false);
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
  await symlink(join(root, 'node_modules'), join(packageRoot, 'node_modules'), 'dir');
  const extractedApi = await import(pathToFileURL(join(packageRoot, 'src/comic-manifest/index.js')).href);
  assert.deepEqual(Object.keys(extractedApi).sort(), [...apiInventory.exports].sort());
  const fixture = JSON.parse(await readFile(join(root, 'tests/fixtures/comic-manifest-v1.json'), 'utf8'));
  const publicManifest = join(await realpath(temp), 'synthetic-public-release.json');
  await writeFile(publicManifest, JSON.stringify(fixture.release) + '\n');
  const cli = await realpath(join(packageRoot, 'src/comic-manifest/cli.js'));
  const result = execFileSync(process.execPath, [cli, 'validate', '--manifest', publicManifest, '--json'], { encoding: 'utf8' });
  assert.equal(JSON.parse(result).status, 'valid');

  const packed = join(temp, 'packed-source'); await mkdir(packed);
  execFileSync('tar', ['-xzf', join(outputA, 'comic-manifest-v1.0.0.source.tar.gz'), '-C', packed]);
  const sourceRoot = join(packed, 'platform');
  assert.deepEqual(JSON.parse(await readFile(join(sourceRoot, 'release/comic-manifest-contract-lock.json'), 'utf8')), lock);
  assert.equal(JSON.parse(await readFile(join(sourceRoot, 'release/comic-manifest-api-v1.json'), 'utf8')).tag, 'comic-manifest/v1.0.0');
});
