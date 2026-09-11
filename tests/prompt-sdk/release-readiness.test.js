import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as sdk from '../../src/prompt-sdk/index.js';
import { releaseReadiness } from '../../scripts/check-sdk-release.mjs';
test('documented v1 API inventory exactly matches public exports', async () => {
  const inventory = JSON.parse(await readFile(new URL('../../release/api-v1.json', import.meta.url)));
  assert.deepEqual(Object.keys(sdk).sort(), inventory);
});
test('unpublished SDK is explicitly blocked from stable release', async () => {
  const report = await releaseReadiness();
  assert.equal(report.ready, false);
  assert.ok(report.blockers.some(message => message.includes('immutable')));
  assert.ok(report.blockers.some(message => message.includes('provisional')));
});
