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
  }
];

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
