import net from 'node:net';
import tls from 'node:tls';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';

// Accidental-network tripwire for trusted conformance tests, NOT a hostile-code sandbox.
const blocked = () => { const error = new Error('Network disabled in Context Builder conformance.'); error.code = 'TEST_NETWORK_DISABLED'; throw error; };
net.Socket.prototype.connect = blocked;
net.connect = blocked; net.createConnection = blocked; tls.connect = blocked;
http.request = blocked; http.get = blocked; https.request = blocked; https.get = blocked;
dns.lookup = blocked; dns.resolve = blocked; dns.promises.lookup = async () => blocked(); dns.promises.resolve = async () => blocked();
globalThis.fetch = async () => blocked();
