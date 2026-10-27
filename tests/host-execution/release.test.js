import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as hostExecution from '../../src/host-execution/index.js';

const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));

test('Host Execution API inventory matches the isolated package subpath', async () => {
  const inventory = JSON.parse(await readFile(new URL('../../release/host-execution-api.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(hostExecution).sort(), inventory);
  assert.equal(pkg.exports['./host-execution'], './src/host-execution/index.js');
  assert.equal(pkg.exports['./prompt-sdk'], './src/prompt-sdk/index.js');
  assert.equal(pkg.private, true);
});
