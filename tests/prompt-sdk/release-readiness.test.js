import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as sdk from '../../src/prompt-sdk/index.js';
import { releaseReadiness, checkReleaseInputs } from '../../scripts/check-sdk-release.mjs';
import { RELEASE_CONTRACTS } from '../../src/prompt-sdk/release-contracts.js';
test('documented v1 API inventory exactly matches public exports', async () => {
  const inventory = JSON.parse(await readFile(new URL('../../release/api-v1.json', import.meta.url)));
  assert.deepEqual(Object.keys(sdk).sort(), inventory);
});
test('SDK adopts all five verified immutable releases', async () => {
  const report = await releaseReadiness();
  assert.deepEqual(report, { ready: true, blockers: [] });
});
test('release checks reject missing, duplicated, malformed and unverified lock data', async () => {
  const lock = JSON.parse(await readFile(new URL('../../release/contract-lock.json', import.meta.url)));
  const pkg = { version: '1.0.0' };
  for (const mutate of [
    value => { value.contracts = []; },
    value => { value.contracts[0] = value.contracts[1]; },
    value => { value.contracts[0] = null; },
    value => { value.contracts[0].publication.immutable = false; },
    value => { value.contracts[0].commit = 'a'.repeat(40); },
    value => { value.contracts[0].assets[0].sha256 = 'sha256:' + '0'.repeat(64); },
    value => { value.contracts[0].assets = {}; }
  ]) {
    const candidate = structuredClone(lock); mutate(candidate);
    assert.equal(checkReleaseInputs({ pkg, lock: candidate }).ready, false);
  }
  const pins = structuredClone(RELEASE_CONTRACTS);
  pins['execution-provenance'].status = 'provisional-unreleased';
  assert.equal(checkReleaseInputs({ pkg, lock, pins }).ready, false);
  assert.equal(checkReleaseInputs({ pkg: { version: '0.1.0' }, lock }).ready, false);
  assert.equal(checkReleaseInputs({ pkg }).ready, false);
});
test('all compiled validators name the released source commit and schema digest', async () => {
  for (const [name, file] of Object.entries({
    'prompt-definition': 'prompt-definition', 'provider-execution': 'provider-execution',
    'context-package': 'context-package', 'structured-output': 'structured-output', 'execution-provenance': 'provenance'
  })) {
    const text = await readFile(new URL('../../src/prompt-sdk/generated/' + file + '-v1-schema.js', import.meta.url), 'utf8');
    assert.ok(text.includes(RELEASE_CONTRACTS[name].commit));
    assert.ok(text.includes(RELEASE_CONTRACTS[name].schema_sha256.slice(7)));
  }
});
