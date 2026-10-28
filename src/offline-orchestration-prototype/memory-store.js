import { canonicalJson } from '../prompt-sdk/canonical-json.js';
import { OFFLINE_ORCHESTRATION_LIMITS } from './limits.js';

const UNKNOWN = Object.freeze({ state: 'unknown' });

function cloneFrozen(value) {
  const cloned = JSON.parse(canonicalJson(value));
  const freeze = item => {
    if (!item || typeof item !== 'object' || Object.isFrozen(item)) return item;
    for (const child of Object.values(item)) freeze(child);
    return Object.freeze(item);
  };
  return freeze(cloned);
}

/** In-memory-only store. Fault hooks are available only through the test factory. */
export class InMemoryPrototypeStore {
  #events = [];
  #blobs = new Map();
  #metadataBytes = new Map();
  #faults;
  #jobSlotState = 'free';
  #jobSlotToken;

  constructor(faults = {}) {
    this.#faults = faults;
  }

  reserveJobSlot() {
    if (this.#jobSlotState === 'consumed') return 'consumed';
    if (this.#jobSlotState === 'reserved') return 'reserved';
    const token = Object.freeze({});
    this.#jobSlotState = 'reserved';
    this.#jobSlotToken = token;
    return { status: 'acquired', token };
  }

  commitJobSlot(token) {
    if (this.#jobSlotState !== 'reserved' || token !== this.#jobSlotToken) return false;
    this.#jobSlotState = 'consumed';
    this.#jobSlotToken = undefined;
    return true;
  }

  releaseUnusedJobSlot(token) {
    if (this.#jobSlotState !== 'reserved' || token !== this.#jobSlotToken) return false;
    this.#jobSlotState = 'free';
    this.#jobSlotToken = undefined;
    return true;
  }

  append(event) {
    const frozen = cloneFrozen(event);
    const jobEvents = this.#events.filter(item => item.job_id === frozen.job_id);
    const metadataBytes = Buffer.byteLength(canonicalJson(frozen), 'utf8');
    const priorBytes = this.#metadataBytes.get(frozen.job_id) ?? 0;
    if (jobEvents.length >= OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleEntriesPerJob
      || metadataBytes > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerEntry
      || priorBytes + metadataBytes > OFFLINE_ORCHESTRATION_LIMITS.maxLifecycleMetadataBytesPerJob) {
      throw new Error('LIFECYCLE_METADATA_LIMIT');
    }
    if (this.#faults.beforeAppend?.(frozen) === true) throw new Error('INJECTED_APPEND_FAILURE');
    this.#events.push(frozen);
    this.#metadataBytes.set(frozen.job_id, priorBytes + metadataBytes);
    if (this.#faults.afterAppend?.(frozen) === true) throw new Error('INJECTED_APPEND_AMBIGUITY');
    return true;
  }

  readEvents(jobId) {
    if (this.#faults.unknownEvents?.(jobId) === true) return UNKNOWN;
    return this.#events.filter(item => item.job_id === jobId).map(cloneFrozen);
  }

  readJobIds() {
    const jobIds = this.#events.map(item => item.job_id);
    for (const key of this.#blobs.keys()) {
      if (key.startsWith('input:') || key.startsWith('prompt:')) jobIds.push(key.slice(key.indexOf(':') + 1));
    }
    return [...new Set(jobIds)];
  }

  writeImmutable(key, bytes) {
    if (typeof key !== 'string' || !key || !(bytes instanceof Uint8Array)) throw new TypeError('Invalid in-memory blob.');
    if (this.#faults.beforeBlobWrite?.(key) === true) throw new Error('INJECTED_BLOB_WRITE_FAILURE');
    if (this.#blobs.has(key)) throw new Error('IMMUTABLE_BLOB_ALREADY_EXISTS');
    this.#blobs.set(key, Buffer.from(bytes));
    if (this.#faults.afterBlobWrite?.(key) === true) throw new Error('INJECTED_BLOB_WRITE_AMBIGUITY');
    return true;
  }

  readImmutable(key) {
    if (this.#faults.unknownBlob?.(key) === true) return UNKNOWN;
    const bytes = this.#blobs.get(key);
    return bytes === undefined ? Object.freeze({ state: 'absent' }) : Buffer.from(bytes);
  }

  get eventCount() { return this.#events.length; }
  get blobCount() { return this.#blobs.size; }
  eventsFor(jobId) { return this.readEvents(jobId); }
}

export { UNKNOWN as UNKNOWN_STORE_STATE };
