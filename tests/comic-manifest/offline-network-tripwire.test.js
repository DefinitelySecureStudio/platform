import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tripwire = fileURLToPath(new URL('../support/offline-network-tripwire.mjs', import.meta.url));
const attempts = [
  {
    name: 'net.Socket.prototype.connect',
    marker: 'net.Socket.prototype.connect',
    imports: "import net from 'node:net';",
    expression: 'new net.Socket().connect()'
  },
  {
    name: 'dns.Resolver instance method',
    marker: 'dns.Resolver.prototype.resolve4',
    imports: "import dns from 'node:dns';",
    expression: 'new dns.Resolver().resolve4()'
  },
  {
    name: 'dns.promises.Resolver instance method',
    marker: 'dns.promises.Resolver.prototype.resolve4',
    imports: "import dns from 'node:dns';",
    expression: 'new dns.promises.Resolver().resolve4()'
  },
  {
    name: 'dns.lookupService',
    marker: 'dns.lookupService',
    imports: "import dns from 'node:dns';",
    expression: 'dns.lookupService()'
  },
  {
    name: 'dns.promises.lookupService',
    marker: 'dns.promises.lookupService',
    imports: "import dns from 'node:dns';",
    expression: 'dns.promises.lookupService()'
  },
  {
    name: 'node:dns/promises lookupService export',
    marker: 'dns.promises.lookupService',
    imports: "import * as dnsPromises from 'node:dns/promises';",
    expression: 'dnsPromises.lookupService()'
  }
];

const isDnsLookup = method => method === 'lookup' || method === 'lookupService'
  || method === 'reverse' || method.startsWith('resolve');
const dnsEntries = [
  ...Object.keys((await import('node:dns')).default)
    .filter(method => isDnsLookup(method))
    .map(method => ['dns', method]),
  ...Object.keys((await import('node:dns')).default.promises)
    .filter(method => isDnsLookup(method))
    .map(method => ['dns.promises', method]),
  ...Object.keys(await import('node:dns/promises'))
    .filter(method => isDnsLookup(method))
    .map(method => ['dns.promises.namespace', method])
];

test('all exported DNS lookup and resolve functions are tripped', () => {
  const source = `import dns from 'node:dns';
import * as dnsPromises from 'node:dns/promises';
const entries = ${JSON.stringify(dnsEntries)};
for (const [apiName, method] of entries) {
  const api = apiName === 'dns' ? dns : apiName === 'dns.promises' ? dns.promises : dnsPromises;
  try { await api[method](); } catch {}
}
process.exitCode = 0;
`;
  const child = spawnSync(process.execPath, [
    '--import', tripwire,
    '--input-type=module', '-e', source
  ], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_OPTIONS: '' },
    encoding: 'utf8',
    timeout: 10_000
  });

  assert.equal(child.error, undefined, child.error?.message);
  assert.notEqual(child.status, 0, child.stdout);
  const match = child.stderr.match(/\[offline tripwire\] blocked (\d+) network operation/);
  assert.ok(match, child.stderr);
  assert.equal(Number(match[1]), dnsEntries.length, child.stderr);
});

for (const attempt of attempts) {
  for (const disposition of ['caught', 'uncaught']) {
    test(`${attempt.name}: ${disposition} offline attempt fails its subprocess`, () => {
      const handling = disposition === 'caught'
        ? `try { await ${attempt.expression}; } catch {}\nprocess.exitCode = 0;`
        : `await ${attempt.expression};`;
      const source = `${attempt.imports}\n${handling}\n`;
      const child = spawnSync(process.execPath, [
        '--import', tripwire,
        '--input-type=module', '-e', source
      ], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_OPTIONS: '' },
        encoding: 'utf8',
        timeout: 10_000
      });

      assert.equal(child.error, undefined, child.error?.message);
      assert.notEqual(child.status, 0, child.stdout);
      if (disposition === 'caught') {
        assert.match(child.stderr, /\[offline tripwire\] blocked \d+ network operation/);
      } else {
        assert.ok(child.stderr.includes(`OFFLINE_NETWORK_TRIPWIRE:${attempt.marker}`), child.stderr);
      }
    });
  }
}
