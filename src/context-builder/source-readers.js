import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { PreparationError, fail, requireCondition as need } from './errors.js';
import { digest, equal, snapshot } from './request.js';
import { validateSource } from './generated/source-v1.js';

export const MAX_ARTIFACT_BYTES = 8 * 1024 * 1024;
export const MAX_NORMALIZATION_BYTES = 32 * 1024 * 1024;
const abort = signal => { if (signal?.aborted) fail('CANCELLED'); };
const unavailable = error => {
  if (error instanceof PreparationError) throw error;
  fail('SOURCE_UNAVAILABLE');
};
function metadata(sourceValue, artifactValue) {
  const source = snapshot(sourceValue), artifact = snapshot(artifactValue);
  need(validateSource(source), 'INVALID_REQUEST');
  need(artifact !== null && typeof artifact === 'object' && !Array.isArray(artifact), 'SOURCE_INTEGRITY');
  need(equal(Object.keys(artifact).sort(), ['byte_size', 'media_type', 'sha256']), 'SOURCE_INTEGRITY');
  need(Number.isSafeInteger(artifact.byte_size) && artifact.byte_size > 0 && artifact.byte_size <= MAX_ARTIFACT_BYTES, 'BUDGET_EXCEEDED');
  need(artifact.media_type === source.media_type && /^sha256:[0-9a-f]{64}$/.test(artifact.sha256), 'SOURCE_INTEGRITY');
  if (source.reference.kind === 'public-artifact') {
    const { byte_size, media_type, sha256 } = source.reference.artifact;
    need(equal(artifact, { byte_size, media_type, sha256 }), 'SOURCE_INTEGRITY');
  }
  return { source, artifact };
}
function budget(artifact, maxBytes, signal) {
  abort(signal);
  need(Number.isSafeInteger(maxBytes) && maxBytes >= artifact.byte_size && maxBytes <= MAX_ARTIFACT_BYTES, 'BUDGET_EXCEEDED');
}
function verify(bytes, artifact) {
  need(bytes.byteLength === artifact.byte_size && digest(bytes) === artifact.sha256, 'SOURCE_INTEGRITY');
  return bytes;
}

/** Explicit already-supplied artifacts; no path/URI resolution and no parsing. */
export function createMemorySourceBinding({ source: sourceValue, artifact: artifactValue, bytes }) {
  const { source, artifact } = metadata(sourceValue, artifactValue);
  need(['synthetic', 'caller-supplied'].includes(source.kind), 'INVALID_REQUEST');
  need(bytes instanceof Uint8Array && bytes.byteLength === artifact.byte_size, 'SOURCE_INTEGRITY');
  const stored = Buffer.from(bytes); // Isolate caller mutations; bytes already supplied by the host.
  return Object.freeze({ source, artifact, async read({ maxBytes, signal }) {
    budget(artifact, maxBytes, signal);
    return verify(Buffer.from(stored), artifact);
  } });
}

/** Approved private exports: the installed reader sees only an opaque handle and a bound. */
export function createApprovedExportBinding({ source: sourceValue, artifact: artifactValue, readExport }) {
  const { source, artifact } = metadata(sourceValue, artifactValue);
  need(source.kind === 'approved-private' && source.reference.kind === 'opaque-artifact', 'INVALID_REQUEST');
  need(typeof readExport === 'function', 'INVALID_REQUEST');
  return Object.freeze({ source, artifact, async read({ maxBytes, signal }) {
    budget(artifact, maxBytes, signal);
    try {
      const stream = await readExport(Object.freeze({ handle: source.reference.handle, maxBytes: artifact.byte_size, signal }));
      abort(signal);
      need(stream && typeof stream[Symbol.asyncIterator] === 'function', 'SOURCE_UNAVAILABLE');
      const chunks = []; let size = 0, count = 0;
      for await (const chunk of stream) {
        abort(signal);
        need(++count <= 4096, 'BUDGET_EXCEEDED');
        need(chunk instanceof Uint8Array, 'SOURCE_INTEGRITY');
        need(chunk.byteLength <= artifact.byte_size - size, 'BUDGET_EXCEEDED');
        size += chunk.byteLength;
        chunks.push(Buffer.from(chunk)); // Copy only after checking the remaining bound.
      }
      abort(signal);
      return verify(Buffer.concat(chunks, size), artifact);
    } catch (error) { abort(signal); unavailable(error); }
  } });
}

/** Offline public snapshot. Root and its ancestors must be host-owned, non-adversarial directories. */
export async function createPublicSnapshotBinding({ source: sourceValue, artifact: artifactValue, root, filename }) {
  const { source, artifact } = metadata(sourceValue, artifactValue);
  need(source.kind === 'public-canon' && source.classification === 'public' && source.reference.kind === 'public-artifact', 'INVALID_REQUEST');
  // Flat inventory names eliminate all request-controlled directory traversal, including encoded forms.
  need(typeof filename === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*$/.test(filename)
    && filename.length <= 200, 'INVALID_REQUEST');
  need(typeof root === 'string' && isAbsolute(root), 'INVALID_REQUEST');
  try {
    const configured = resolve(root);
    need(!(await lstat(configured)).isSymbolicLink(), 'SOURCE_UNAVAILABLE');
    const directory = await realpath(configured), rootStat = await lstat(directory);
    need(rootStat.isDirectory() && Number.isInteger(constants.O_NOFOLLOW), 'SOURCE_UNAVAILABLE');
    async function checkRoot() {
      const current = await lstat(directory);
      need(current.isDirectory() && !current.isSymbolicLink() && current.dev === rootStat.dev && current.ino === rootStat.ino
        && await realpath(directory) === directory, 'SOURCE_UNAVAILABLE');
    }
    return Object.freeze({ source, artifact, async read({ maxBytes, signal }) {
      budget(artifact, maxBytes, signal);
      let handle;
      try {
        await checkRoot(); abort(signal);
        handle = await open(join(directory, filename), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        const before = await handle.stat();
        need(before.isFile() && before.nlink === 1, 'SOURCE_UNAVAILABLE');
        need(before.size === artifact.byte_size, 'SOURCE_INTEGRITY');
        await checkRoot(); abort(signal);
        const bytes = Buffer.alloc(artifact.byte_size);
        let offset = 0;
        while (offset < bytes.length) {
          abort(signal);
          const { bytesRead } = await handle.read(bytes, offset, Math.min(65536, bytes.length - offset), offset);
          need(bytesRead > 0, 'SOURCE_INTEGRITY'); offset += bytesRead;
        }
        const after = await handle.stat();
        need(after.size === before.size && after.mtimeMs === before.mtimeMs && after.ctimeMs === before.ctimeMs, 'SOURCE_INTEGRITY');
        await checkRoot(); abort(signal);
        return verify(bytes, artifact);
      } catch (error) { abort(signal); unavailable(error); }
      finally { if (handle) await handle.close().catch(() => {}); }
    } });
  } catch (error) { unavailable(error); }
}
