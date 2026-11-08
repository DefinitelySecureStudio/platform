import {
  closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync,
  openSync, readFileSync, readdirSync, renameSync, unlinkSync, writeSync
} from 'node:fs';
import { randomUUID } from 'node:crypto';
import { isAbsolute, join, resolve } from 'node:path';
import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { OFFLINE_ORCHESTRATION_LIMITS } from './limits.js';
import { UNKNOWN_STORE_STATE } from './memory-store.js';

const PRIVATE_DIRECTORY_MODE = 0o700;
const PRIVATE_FILE_MODE = 0o600;
const NOFOLLOW = constants.O_NOFOLLOW ?? 0;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cloneFrozen(value) {
  const cloned = JSON.parse(canonicalJson(value));
  const freeze = item => {
    if (!item || typeof item !== 'object' || Object.isFrozen(item)) return item;
    for (const child of Object.values(item)) freeze(child);
    return Object.freeze(item);
  };
  return freeze(cloned);
}

function safeId(value, label) {
  if (typeof value !== 'string' || !value || Buffer.byteLength(value, 'utf8') > 128) {
    throw new TypeError(`Invalid local store ${label}.`);
  }
  return value;
}

function validUuid(value) { return typeof value === 'string' && UUID.test(value); }

function encoded(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decoded(value) {
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.toString('base64url') !== value) return undefined;
  const text = bytes.toString('utf8');
  return Buffer.from(text, 'utf8').equals(bytes) ? text : undefined;
}

function ensurePrivateDirectory(path) {
  try { mkdirSync(path, { mode: PRIVATE_DIRECTORY_MODE }); } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  const info = lstatSync(path);
  const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;
  if (info.isSymbolicLink() || !info.isDirectory() || (info.mode & 0o077) !== 0
    || (uid !== undefined && info.uid !== uid)) {
    throw new Error('LOCAL_STORE_UNSAFE_DIRECTORY');
  }
}

function openNoFollow(path, flags, mode = PRIVATE_FILE_MODE) {
  return openSync(path, flags | NOFOLLOW, mode);
}

function readFileBounded(path, maximumBytes) {
  let fd;
  try { fd = openNoFollow(path, constants.O_RDONLY); } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
  try {
    const info = fstatSync(fd);
    const uid = typeof process.getuid === 'function' ? process.getuid() : undefined;
    if (!info.isFile() || (info.mode & 0o077) !== 0 || info.size > maximumBytes
      || (uid !== undefined && info.uid !== uid)) {
      throw new Error('LOCAL_STORE_FILE_INVALID');
    }
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

function writeAll(fd, bytes) {
  let offset = 0;
  while (offset < bytes.byteLength) {
    const written = writeSync(fd, bytes, offset, bytes.byteLength - offset);
    if (!Number.isSafeInteger(written) || written <= 0) throw new Error('LOCAL_STORE_WRITE_INCOMPLETE');
    offset += written;
  }
}

function syncDirectory(path) {
  const fd = openSync(path, constants.O_RDONLY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function writeNewFile(path, bytes, directory) {
  let fd;
  try {
    fd = openNoFollow(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL);
    writeAll(fd, bytes);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    syncDirectory(directory);
    return true;
  } catch (error) {
    if (fd !== undefined) {
      try { closeSync(fd); } catch { /* preserve the original failure */ }
    }
    throw error;
  }
}

function writeAtomicRecord(path, record, directory) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  writeNewFile(temporary, Buffer.from(canonicalJson(record), 'utf8'), directory);
  try {
    renameSync(temporary, path);
    syncDirectory(directory);
    const actual = readJsonRecord(path);
    if (actual === UNKNOWN_STORE_STATE || !actual || canonicalJson(actual) !== canonicalJson(record)) {
      throw new Error('LOCAL_STORE_READBACK_MISMATCH');
    }
  } catch (error) {
    try { unlinkSync(temporary); } catch { /* keep an ambiguous temporary for reconciliation */ }
    throw error;
  }
}

function readJsonRecord(path) {
  let bytes;
  try { bytes = readFileBounded(path, 16 * 1024); } catch { return UNKNOWN_STORE_STATE; }
  if (bytes === undefined) return undefined;
  try {
    const text = bytes.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(bytes)) return UNKNOWN_STORE_STATE;
    const value = JSON.parse(text);
    if (canonicalJson(value) !== text) return UNKNOWN_STORE_STATE;
    return value;
  } catch {
    return UNKNOWN_STORE_STATE;
  }
}

/**
 * Local-only persistent store for the experimental offline prototype.
 * The caller must own a private local directory; same-account hostile edits are
 * outside the trust model. This store is not a production database.
 */
export class LocalFilePrototypeStore {
  #root;
  #eventsDirectory;
  #blobsDirectory;
  #claimsDirectory;
  #uncertainEvents = new Set();
  #uncertainBlobs = new Set();

  constructor(rootDirectory) {
    if (!NOFOLLOW) throw new Error('LOCAL_STORE_NOFOLLOW_UNSUPPORTED');
    if (typeof rootDirectory !== 'string' || !isAbsolute(rootDirectory)) {
      throw new TypeError('An absolute local store directory is required.');
    }
    this.#root = resolve(rootDirectory);
    ensurePrivateDirectory(this.#root);
    this.#eventsDirectory = join(this.#root, 'events');
    this.#blobsDirectory = join(this.#root, 'blobs');
    this.#claimsDirectory = join(this.#root, 'resume-claims');
    ensurePrivateDirectory(this.#eventsDirectory);
    ensurePrivateDirectory(this.#blobsDirectory);
    ensurePrivateDirectory(this.#claimsDirectory);
  }

  #eventPath(jobId) {
    safeId(jobId, 'job id');
    return join(this.#eventsDirectory, `${encoded(jobId)}.jsonl`);
  }

  #eventPendingPath(jobId) { return `${this.#eventPath(jobId)}.pending`; }

  #blobPath(key) {
    safeId(key, 'blob key');
    return join(this.#blobsDirectory, `${encoded(key)}.blob`);
  }

  #blobPendingPath(key) { return `${this.#blobPath(key)}.pending`; }

  #claimPath(jobId) {
    safeId(jobId, 'job id');
    return join(this.#claimsDirectory, `${encoded(jobId)}.json`);
  }

  reserveJobSlot() {
    const path = join(this.#root, 'job-slot.json');
    const token = randomUUID();
    try {
      writeNewFile(path, Buffer.from(canonicalJson({ status: 'reserved', token }), 'utf8'), this.#root);
      const actual = readJsonRecord(path);
      if (actual === UNKNOWN_STORE_STATE || !actual || canonicalJson(actual) !== canonicalJson({ status: 'reserved', token })) {
        return { status: 'unknown' };
      }
      return Object.freeze({ status: 'acquired', token });
    } catch (error) {
      if (error.code !== 'EEXIST') return { status: 'unknown' };
      const record = readJsonRecord(path);
      if (record === UNKNOWN_STORE_STATE || !record
        || Object.keys(record).sort().join('|') !== 'status|token'
        || !['reserved', 'consumed'].includes(record.status) || !validUuid(record.token)) return { status: 'unknown' };
      return record.status === 'consumed' ? 'consumed' : 'reserved';
    }
  }

  commitJobSlot(token) {
    const path = join(this.#root, 'job-slot.json');
    const record = readJsonRecord(path);
    if (!record || record === UNKNOWN_STORE_STATE || typeof token !== 'string'
      || Object.keys(record).sort().join('|') !== 'status|token' || !validUuid(record.token)) return false;
    if (record.status === 'consumed') return record.token === token;
    if (record.status !== 'reserved' || record.token !== token) return false;
    try {
      writeAtomicRecord(path, { status: 'consumed', token }, this.#root);
      return true;
    } catch {
      return false;
    }
  }

  releaseUnusedJobSlot(token) {
    const path = join(this.#root, 'job-slot.json');
    const record = readJsonRecord(path);
    if (!record || record === UNKNOWN_STORE_STATE || Object.keys(record).sort().join('|') !== 'status|token'
      || !validUuid(record.token) || record.status !== 'reserved' || record.token !== token) return false;
    try {
      unlinkSync(path);
      syncDirectory(this.#root);
      return readJsonRecord(path) === undefined;
    } catch {
      return false;
    }
  }

  append(event) {
    const frozen = cloneFrozen(event);
    const jobId = safeId(frozen.job_id, 'job id');
    const pendingPath = this.#eventPendingPath(jobId);
    try {
      writeNewFile(pendingPath, Buffer.from(canonicalJson({ job_id: jobId, operation: 'append' }), 'utf8'), this.#eventsDirectory);
    } catch { throw new Error('LOCAL_STORE_STATE_UNKNOWN'); }
    const events = this.#readEvents(jobId);
    if (events === UNKNOWN_STORE_STATE) throw new Error('LOCAL_STORE_STATE_UNKNOWN');
    const bytes = Buffer.from(canonicalJson(frozen), 'utf8');
    const priorBytes = events.reduce((sum, item) => sum + Buffer.byteLength(canonicalJson(item), 'utf8'), 0);
    if (events.length >= OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob
      || bytes.byteLength > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerEntry
      || priorBytes + bytes.byteLength > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerJob) {
      try { unlinkSync(pendingPath); syncDirectory(this.#eventsDirectory); } catch { /* fail closed if cleanup is uncertain */ }
      throw new Error('LIFECYCLE_METADATA_LIMIT');
    }
    const path = this.#eventPath(jobId);
    let fd;
    try {
      const prior = readFileBounded(path,
        OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerJob
          + OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob) ?? Buffer.alloc(0);
      const appended = Buffer.concat([prior, bytes, Buffer.from('\n')]);
      fd = openNoFollow(path, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT);
      writeAll(fd, Buffer.concat([bytes, Buffer.from('\n')]));
      fsyncSync(fd);
      closeSync(fd);
      fd = undefined;
      syncDirectory(this.#eventsDirectory);
      const actual = readFileBounded(path,
        OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerJob
          + OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob);
      if (!actual?.equals(appended)) throw new Error('LOCAL_STORE_READBACK_MISMATCH');
      unlinkSync(pendingPath);
      syncDirectory(this.#eventsDirectory);
      this.#uncertainEvents.delete(jobId);
      return true;
    } catch (error) {
      if (fd !== undefined) {
        try { closeSync(fd); } catch { /* preserve the original failure */ }
      }
      this.#uncertainEvents.add(jobId);
      throw error;
    }
  }

  readEvents(jobId) {
    try {
      safeId(jobId, 'job id');
      if (readFileBounded(this.#eventPendingPath(jobId), 16 * 1024) !== undefined) return UNKNOWN_STORE_STATE;
    } catch { return UNKNOWN_STORE_STATE; }
    return this.#readEvents(jobId);
  }

  #readEvents(jobId) {
    try {
      safeId(jobId, 'job id');
      if (this.#uncertainEvents.has(jobId)) return UNKNOWN_STORE_STATE;
      const bytes = readFileBounded(this.#eventPath(jobId),
        OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerJob
          + OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob);
      if (bytes === undefined) return [];
      if (bytes.byteLength === 0 || bytes.at(-1) !== 0x0a) return UNKNOWN_STORE_STATE;
      const text = bytes.toString('utf8');
      if (!Buffer.from(text, 'utf8').equals(bytes)) return UNKNOWN_STORE_STATE;
      const lines = text.slice(0, -1).split('\n');
      if (lines.length > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob) return UNKNOWN_STORE_STATE;
      const events = [];
      let total = 0;
      for (const line of lines) {
        const value = JSON.parse(line);
        if (canonicalJson(value) !== line || value.job_id !== jobId) return UNKNOWN_STORE_STATE;
        const size = Buffer.byteLength(line, 'utf8');
        if (size > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerEntry
          || total + size > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerJob) return UNKNOWN_STORE_STATE;
        total += size;
        events.push(cloneFrozen(value));
      }
      return events;
    } catch {
      return UNKNOWN_STORE_STATE;
    }
  }

  readJobIds() {
    try {
      const ids = new Set();
      for (const name of readdirSync(this.#eventsDirectory)) {
        if (!name.endsWith('.jsonl')) return UNKNOWN_STORE_STATE;
        const jobId = decoded(name.slice(0, -6));
        if (!jobId || this.readEvents(jobId) === UNKNOWN_STORE_STATE) return UNKNOWN_STORE_STATE;
        ids.add(jobId);
      }
      for (const name of readdirSync(this.#blobsDirectory)) {
        if (!name.endsWith('.blob')) return UNKNOWN_STORE_STATE;
        const key = decoded(name.slice(0, -5));
        if (!key) return UNKNOWN_STORE_STATE;
        if (key.startsWith('input:') || key.startsWith('prompt:')) ids.add(key.slice(key.indexOf(':') + 1));
      }
      return [...ids];
    } catch {
      return UNKNOWN_STORE_STATE;
    }
  }

  writeImmutable(key, bytes) {
    safeId(key, 'blob key');
    if (!(bytes instanceof Uint8Array)) throw new TypeError('Invalid local store blob bytes.');
    const existing = this.readImmutable(key);
    if (existing === UNKNOWN_STORE_STATE) throw new Error('LOCAL_STORE_STATE_UNKNOWN');
    if (Buffer.isBuffer(existing)) throw new Error('IMMUTABLE_BLOB_ALREADY_EXISTS');
    const path = this.#blobPath(key);
    const pendingPath = this.#blobPendingPath(key);
    try {
      writeNewFile(pendingPath, Buffer.from(canonicalJson({ key, operation: 'write-immutable' }), 'utf8'), this.#blobsDirectory);
    } catch { throw new Error('LOCAL_STORE_STATE_UNKNOWN'); }
    try {
      writeNewFile(path, Buffer.from(bytes), this.#blobsDirectory);
      const actual = readFileBounded(path, OFFLINE_ORCHESTRATION_LIMITS.maxAggregateMaterialBytesPerJob);
      if (!actual?.equals(Buffer.from(bytes))) throw new Error('LOCAL_STORE_READBACK_MISMATCH');
      unlinkSync(pendingPath);
      syncDirectory(this.#blobsDirectory);
      this.#uncertainBlobs.delete(key);
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') this.#uncertainBlobs.add(key);
      throw error;
    }
  }

  readImmutable(key) {
    try {
      safeId(key, 'blob key');
      if (this.#uncertainBlobs.has(key)) return UNKNOWN_STORE_STATE;
      if (readFileBounded(this.#blobPendingPath(key), 16 * 1024) !== undefined) return UNKNOWN_STORE_STATE;
      const bytes = readFileBounded(this.#blobPath(key), OFFLINE_ORCHESTRATION_LIMITS.maxAggregateMaterialBytesPerJob);
      return bytes === undefined ? Object.freeze({ state: 'absent' }) : Buffer.from(bytes);
    } catch {
      return UNKNOWN_STORE_STATE;
    }
  }

  claimResume(jobId) {
    const path = this.#claimPath(jobId);
    const claimId = randomUUID();
    const record = { job_id: jobId, claim_id: claimId, state: 'held' };
    try {
      writeNewFile(path, Buffer.from(canonicalJson(record), 'utf8'), this.#claimsDirectory);
      const actual = readJsonRecord(path);
      if (actual === UNKNOWN_STORE_STATE || !actual || canonicalJson(actual) !== canonicalJson(record)) {
        return Object.freeze({ status: 'unknown' });
      }
      return Object.freeze({ status: 'acquired', claim_id: claimId });
    } catch (error) {
      if (error.code !== 'EEXIST') return Object.freeze({ status: 'unknown' });
      const existing = readJsonRecord(path);
      if (existing === UNKNOWN_STORE_STATE || !existing
        || Object.keys(existing).sort().join('|') !== 'claim_id|job_id|state'
        || existing.job_id !== jobId || !validUuid(existing.claim_id) || existing.state !== 'held') {
        return Object.freeze({ status: 'unknown' });
      }
      return Object.freeze({ status: 'held' });
    }
  }

  get eventCount() {
    const ids = this.readJobIds();
    if (ids === UNKNOWN_STORE_STATE) return UNKNOWN_STORE_STATE;
    return ids.reduce((sum, jobId) => {
      const events = this.readEvents(jobId);
      return events === UNKNOWN_STORE_STATE ? UNKNOWN_STORE_STATE : sum + events.length;
    }, 0);
  }

  get blobCount() {
    try { return readdirSync(this.#blobsDirectory).length; } catch { return UNKNOWN_STORE_STATE; }
  }

  eventsFor(jobId) {
    return this.readEvents(jobId);
  }
}

export const LOCAL_FILE_STORE_TRUST_BOUNDARY = Object.freeze({
  scope: 'synthetic-local-only',
  directory_mode: PRIVATE_DIRECTORY_MODE,
  file_mode: PRIVATE_FILE_MODE,
  same_account_hostile_edits: 'not-protected',
  digest_authenticity: 'not-provided',
  automatic_claim_takeover: false
});
