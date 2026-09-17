import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import * as builder from '@definitely-secure-studio/platform/context-builder';
import { builderSchema, checkBuilderRelease, builderReleaseReadiness } from '../../scripts/check-builder-release.mjs';
import { verifyBuilderDownloads } from '../../scripts/verify-builder-downloads.mjs';
const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url)));
function evidence() {
  const tag = 'contract/context-builder/v1.0.0', commit = 'a'.repeat(40);
  return { pkg, lock: { repository: 'DefinitelySecureStudio/codex', contract: 'context-builder', version: '1.0.0', tag, commit,
    schema_id: 'urn:definitely-secure:contract:context-builder:1.0.0:context-builder',
    constitution_commit: 'a9cc8a503aa30e17820edc62ac95f7cbe10e0564',
    publication: { immutable: true, verified_at: '2026-09-16T00:00:00Z', release_url: 'https://github.com/DefinitelySecureStudio/codex/releases/tag/' + tag },
    assets: ['schema.json', 'bundle.json'].map((suffix, i) => ({ filename: 'context-builder-v1.0.0.' + suffix,
      artifact_uri: 'https://github.com/DefinitelySecureStudio/codex/releases/download/' + encodeURIComponent(tag) + '/context-builder-v1.0.0.' + suffix,
      media_type: i ? 'application/json' : 'application/schema+json', ...(i ? { byte_size: 123, sha256: 'sha256:' + 'b'.repeat(64) } : builderSchema) })) },
    headers: Array(3).fill('// Generated from Codex ' + commit + '; released immutable contract.\n' + builderSchema.sha256 + '\nd81e88780511c31099b2dd925f31aff26d6ba75e1173e953b98a37298764b617') };
}
test('Builder package export matches reviewed v1 API inventory and CLI metadata', async () => {
  const inventory = JSON.parse(await readFile(new URL('../../release/context-builder-api-v1.json', import.meta.url)));
  assert.deepEqual(Object.keys(builder).sort(), inventory);
  assert.equal(pkg.bin['studio-context'], './src/context-builder/cli.js');
  assert.equal(pkg.private, true);
  const lock = JSON.parse(await readFile(new URL('../../package-lock.json', import.meta.url)));
  assert.equal(lock.version, pkg.version); assert.equal(lock.packages[''].version, pkg.version);
});
test('actual candidate fails closed until immutable adoption; complete synthetic evidence passes offline shape check', async () => {
  assert.equal((await builderReleaseReadiness()).ready, false);
  assert.deepEqual(checkBuilderRelease(evidence()), { ready: true, blockers: [] });
});
test('release gate rejects missing, malformed, swapped, provisional and stale-generation evidence', () => {
  for (const mutate of [
    e => { delete e.lock; }, e => { e.lock.publication.immutable = false; }, e => { e.lock.commit = 'main'; },
    e => { e.lock.assets = null; }, e => { e.lock.assets[1] = e.lock.assets[0]; },
    e => { e.lock.assets[0].sha256 = 'sha256:' + '0'.repeat(64); },
    e => { e.lock.assets[0].artifact_uri = 'https://example.com/schema'; },
    e => { e.lock.assets[0].byte_size++; }, e => { e.lock.publication.verified_at = 'invalid'; },
    e => { e.headers[0] = 'unreleased candidate'; }, e => { e.pkg.private = false; }
  ]) { const e = structuredClone(evidence()); mutate(e); assert.equal(checkBuilderRelease(e).ready, false); }
});
test('download verification rejects altered assets/manifests and candidate or incomplete releases', async t => {
  const root = await mkdtemp(join(tmpdir(), 'builder-download-test-')); t.after(() => rm(root, { recursive: true, force: true }));
  const content = Buffer.from('public synthetic release bytes');
  const manifest = { repository: 'DefinitelySecureStudio/platform', component: 'context-builder', version: '1.0.0', package_version: '1.1.0',
    tag: 'context-builder/v1.0.0', commit: 'a'.repeat(40), candidate: false, readiness: { ready: true },
    assets: ['source.tar.gz', 'package.tgz', 'package-lock.json', 'sdk-contract-lock.json', 'contract-lock.json'].map(suffix => {
      const filename = 'context-builder-v1.0.0.' + suffix;
      return { filename, media_type: suffix.endsWith('.json') ? 'application/json' : 'application/gzip',
        artifact_uri: 'https://github.com/DefinitelySecureStudio/platform/releases/download/context-builder%2Fv1.0.0/' + filename,
        byte_size: content.length, sha256: 'sha256:' + createHash('sha256').update(content).digest('hex') };
    }) };
  const trusted = join(root, 'trusted.json'), downloaded = join(root, 'context-builder-v1.0.0.manifest.json');
  await writeFile(trusted, JSON.stringify(manifest)); await writeFile(downloaded, JSON.stringify(manifest));
  for (const a of manifest.assets) await writeFile(join(root, a.filename), content);
  assert.equal((await verifyBuilderDownloads(trusted, root)).assets, 6);
  await writeFile(join(root, manifest.assets[0].filename), 'tampered');
  await assert.rejects(verifyBuilderDownloads(trusted, root), /identity mismatch/);
  await writeFile(join(root, manifest.assets[0].filename), content);
  await writeFile(downloaded, '{}'); await assert.rejects(verifyBuilderDownloads(trusted, root), /manifest differs/);
  for (const mutate of [m => { m.candidate = true; }, m => { m.assets = []; }, m => { m.assets[0].filename = '../escape'; }]) {
    const m = structuredClone(manifest); mutate(m); await writeFile(trusted, JSON.stringify(m)); await writeFile(downloaded, JSON.stringify(m));
    await assert.rejects(verifyBuilderDownloads(trusted, root));
  }
});
