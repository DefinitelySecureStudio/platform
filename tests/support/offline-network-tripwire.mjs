import dgram from 'node:dgram';
import dns from 'node:dns';
import http from 'node:http';
import http2 from 'node:http2';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';

let attempts = 0;
const blocked = label => (..._args) => {
  attempts++;
  const error = new Error(`OFFLINE_NETWORK_TRIPWIRE:${label}`);
  error.code = 'COMIC_OFFLINE_NETWORK_ATTEMPT';
  throw error;
};

for (const method of ['request', 'get']) {
  http[method] = blocked(`http.${method}`);
  https[method] = blocked(`https.${method}`);
}
net.connect = blocked('net.connect');
net.createConnection = blocked('net.createConnection');
net.Socket.prototype.connect = blocked('net.Socket.prototype.connect');
net.Server.prototype.listen = blocked('net.Server.listen');
tls.connect = blocked('tls.connect');
dgram.createSocket = blocked('dgram.createSocket');
http2.connect = blocked('http2.connect');
http2.createServer = blocked('http2.createServer');
http2.createSecureServer = blocked('http2.createSecureServer');
for (const method of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCname', 'resolveMx',
  'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt', 'reverse']) {
  if (typeof dns[method] === 'function') dns[method] = blocked(`dns.${method}`);
  if (typeof dns.promises[method] === 'function') dns.promises[method] = blocked(`dns.promises.${method}`);
}
for (const [label, Resolver] of [['dns.Resolver', dns.Resolver], ['dns.promises.Resolver', dns.promises.Resolver]]) {
  if (typeof Resolver !== 'function' || !Resolver.prototype) continue;
  for (const method of Object.getOwnPropertyNames(Resolver.prototype)) {
    if (method === 'constructor' || typeof Resolver.prototype[method] !== 'function') continue;
    Resolver.prototype[method] = blocked(`${label}.prototype.${method}`);
  }
}
if (typeof globalThis.fetch === 'function') globalThis.fetch = blocked('fetch');
if (typeof globalThis.WebSocket === 'function') globalThis.WebSocket = blocked('WebSocket');
syncBuiltinESMExports();

process.on('exit', () => {
  if (attempts > 0) {
    process.stderr.write(`[offline tripwire] blocked ${attempts} network operation(s)\n`);
    process.exitCode = 1;
  }
});
