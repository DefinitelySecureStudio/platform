import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const exec = promisify(execFile);
const guard = new URL('../support/context-builder-offline-guard.js', import.meta.url).href;
test('offline preload rejects accidental fetch, TCP, HTTP and DNS before network access', async () => {
  const code = `import assert from 'node:assert/strict'; import net from 'node:net'; import http from 'node:http'; import dns from 'node:dns';
    const denied = e => e.code === 'TEST_NETWORK_DISABLED';
    await assert.rejects(() => fetch('https://example.invalid'), denied);
    assert.throws(() => net.connect(443, 'example.invalid'), denied);
    assert.throws(() => http.get('http://example.invalid'), denied);
    await assert.rejects(() => dns.promises.lookup('example.invalid'), denied);`;
  const result = await exec(process.execPath, ['--import', guard, '--input-type=module', '-e', code], { timeout: 5000 });
  assert.equal(result.stdout, ''); assert.equal(result.stderr, '');
});
