export const OFFLINE_ORCHESTRATION_LIMITS = Object.freeze({
  maxActiveJobs: 1,
  maxAttemptsPerJob: 2,
  maxProviderCallsPerAttempt: 1,
  jobBudgetMs: 300_000,
  maxPromptBytesPerAttempt: 8 * 1024 * 1024,
  maxNormalizedOutputBytesPerCall: 16 * 1024 * 1024,
  maxGeneratedArtifactBytesPerJob: 64 * 1024 * 1024,
  maxAggregateMaterialBytesPerJob: 128 * 1024 * 1024,
  maxLifecycleEntriesPerJob: 32,
  maxLifecycleMetadataBytesPerEntry: 32 * 1024,
  maxLifecycleMetadataBytesPerJob: 1024 * 1024,
  maxManifestBytes: 8 * 1024 * 1024,
  maxManifestDepth: 32,
  maxManifestValues: 100_000,
  maxManifestStringBytes: 32_768
});

export const LIFECYCLE_METADATA_RESERVE_BYTES = 1024 * 1024;
export const NORMALIZED_OUTCOME_ENVELOPE_RESERVE_BYTES = 32 * 1024;

export function checkedAdd(left, right) {
  if (!Number.isSafeInteger(left) || left < 0 || !Number.isSafeInteger(right) || right < 0) return undefined;
  const total = left + right;
  return Number.isSafeInteger(total) ? total : undefined;
}

export function assertAtMost(bytes, limit, code) {
  if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > limit) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }
  return bytes;
}

/** Byte ledger used only by the offline prototype; metadata has a separate reserve. */
export class MaterialLedger {
  #used = new Map();
  #reservations = new Map();
  #artifactUsed = new Map();
  #artifactReservations = new Map();

  constructor({ maxTotalBytes = OFFLINE_ORCHESTRATION_LIMITS.maxAggregateMaterialBytesPerJob,
    metadataReserveBytes = LIFECYCLE_METADATA_RESERVE_BYTES,
    maxArtifactBytes = OFFLINE_ORCHESTRATION_LIMITS.maxGeneratedArtifactBytesPerJob } = {}) {
    if (!Number.isSafeInteger(maxTotalBytes) || !Number.isSafeInteger(metadataReserveBytes)
      || metadataReserveBytes < 0 || metadataReserveBytes > maxTotalBytes) {
      throw new TypeError('Invalid material ledger limits.');
    }
    this.maxTotalBytes = maxTotalBytes;
    this.metadataReserveBytes = metadataReserveBytes;
    this.maxArtifactBytes = maxArtifactBytes;
  }

  #sum(map) {
    let total = 0;
    for (const bytes of map.values()) {
      total = checkedAdd(total, bytes);
      if (total === undefined) return undefined;
    }
    return total;
  }

  #canFit(nextPayloadBytes) {
    const used = this.#sum(this.#used);
    const ordinaryReserved = this.#sum(this.#reservations);
    const artifactReserved = this.#sum(this.#artifactReservations);
    if (used === undefined || ordinaryReserved === undefined || artifactReserved === undefined) return false;
    const reservations = checkedAdd(ordinaryReserved, artifactReserved);
    const aggregate = reservations === undefined ? undefined : checkedAdd(used, reservations);
    const withNext = aggregate === undefined ? undefined : checkedAdd(aggregate, nextPayloadBytes);
    const maximumPayload = this.maxTotalBytes - this.metadataReserveBytes;
    return withNext !== undefined && withNext <= maximumPayload;
  }

  charge(identity, bytes) {
    if (typeof identity !== 'string' || !identity) throw new TypeError('Material identity is required.');
    assertAtMost(bytes, this.maxTotalBytes, 'MATERIAL_BUDGET_EXCEEDED');
    const existing = this.#used.get(identity);
    if (existing !== undefined) return existing === bytes;
    if (this.#reservations.has(identity) || !this.#canFit(bytes)) return false;
    this.#used.set(identity, bytes);
    return true;
  }

  reserve(identity, bytes, { artifact = false } = {}) {
    if (typeof identity !== 'string' || !identity) throw new TypeError('Reservation identity is required.');
    assertAtMost(bytes, this.maxTotalBytes, 'MATERIAL_BUDGET_EXCEEDED');
    const reservations = artifact ? this.#artifactReservations : this.#reservations;
    if (this.#used.has(identity)) return this.#used.get(identity) >= bytes;
    const existing = reservations.get(identity);
    if (existing !== undefined) return existing >= bytes;
    if (!this.#canFit(bytes)) return false;
    if (artifact) {
      const used = this.#sum(this.#artifactUsed);
      const pending = this.#sum(this.#artifactReservations);
      const total = used === undefined || pending === undefined ? undefined : checkedAdd(used, pending);
      const withNext = total === undefined ? undefined : checkedAdd(total, bytes);
      if (withNext === undefined || withNext > this.maxArtifactBytes) return false;
    }
    reservations.set(identity, bytes);
    return true;
  }

  commitReservation(reservationIdentity, identity, bytes, { artifact = false } = {}) {
    const reservations = artifact ? this.#artifactReservations : this.#reservations;
    const reserved = reservations.get(reservationIdentity);
    if (reserved === undefined || bytes > reserved || !Number.isSafeInteger(bytes) || bytes < 0) return false;
    reservations.delete(reservationIdentity);
    if (this.#used.has(identity)) {
      if (artifact) {
        const existingArtifact = this.#artifactUsed.get(identity);
        return existingArtifact === bytes;
      }
      return this.#used.get(identity) === bytes;
    }
    if (!this.#canFit(0)) return false;
    this.#used.set(identity, bytes);
    if (artifact) {
      const used = this.#sum(this.#artifactUsed);
      const pending = this.#sum(this.#artifactReservations);
      const total = used === undefined || pending === undefined ? undefined : checkedAdd(used, pending);
      const withBytes = total === undefined ? undefined : checkedAdd(total, bytes);
      if (withBytes === undefined || withBytes > this.maxArtifactBytes) {
        this.#used.delete(identity);
        return false;
      }
      this.#artifactUsed.set(identity, bytes);
    }
    return true;
  }

  release(reservationIdentity, { artifact = false } = {}) {
    const reservations = artifact ? this.#artifactReservations : this.#reservations;
    reservations.delete(reservationIdentity);
  }

  get snapshot() {
    const used = this.#sum(this.#used) ?? Number.MAX_SAFE_INTEGER;
    const ordinaryReserved = this.#sum(this.#reservations) ?? Number.MAX_SAFE_INTEGER;
    const artifactUsed = this.#sum(this.#artifactUsed) ?? Number.MAX_SAFE_INTEGER;
    const artifactReserved = this.#sum(this.#artifactReservations) ?? Number.MAX_SAFE_INTEGER;
    const reserved = checkedAdd(ordinaryReserved, artifactReserved) ?? Number.MAX_SAFE_INTEGER;
    return Object.freeze({
      payload_used_bytes: used,
      payload_reserved_bytes: reserved,
      ordinary_reserved_bytes: ordinaryReserved,
      artifact_used_bytes: artifactUsed,
      artifact_reserved_bytes: artifactReserved,
      metadata_reserved_bytes: this.metadataReserveBytes,
      total_ceiling_bytes: this.maxTotalBytes
    });
  }
}
