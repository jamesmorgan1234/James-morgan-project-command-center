import { RegistrationError } from '../kernel/errors.js';

export class ConcurrencyError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ConcurrencyError';
    this.code = 'CONCURRENCY_CONFLICT';
    this.details = details;
  }
}

export class RecordStore {
  #records = new Map();
  #history = new Map();

  create({ id, type, data, provenance, sensitivity = 'private', authorityState = 'unverified' }) {
    if (!id || !type || !provenance) throw new RegistrationError('Record requires id, type, provenance');
    if (this.#records.has(id)) throw new RegistrationError(`Duplicate record: ${id}`);
    const record = Object.freeze({ id, type, data: structuredClone(data), provenance: structuredClone(provenance), sensitivity, authorityState, version: 1, state: 'active', createdAt: Date.now(), updatedAt: Date.now() });
    this.#records.set(id, record);
    this.#history.set(id, [record]);
    return record;
  }

  get(id) { return this.#records.get(id) ?? null; }
  history(id) { return Object.freeze([...(this.#history.get(id) ?? [])]); }

  update(id, changes, { expectedVersion, provenance, authorityState } = {}) {
    const current = this.#records.get(id);
    if (!current) throw new RegistrationError(`Unknown record: ${id}`);
    if (expectedVersion !== current.version) throw new ConcurrencyError(`Version conflict for ${id}`, { expectedVersion, actualVersion: current.version });
    if (!provenance) throw new RegistrationError('Update provenance is required');
    const next = Object.freeze({ ...current, data: { ...structuredClone(current.data), ...structuredClone(changes) }, provenance: structuredClone(provenance), authorityState: authorityState ?? current.authorityState, version: current.version + 1, updatedAt: Date.now() });
    this.#records.set(id, next);
    this.#history.get(id).push(next);
    return next;
  }

  archive(id, { expectedVersion, provenance }) {
    return this.#setState(id, 'archived', { expectedVersion, provenance });
  }

  restore(id, { expectedVersion, provenance }) {
    return this.#setState(id, 'active', { expectedVersion, provenance });
  }

  softDelete(id, { expectedVersion, provenance }) {
    return this.#setState(id, 'deleted', { expectedVersion, provenance });
  }

  #setState(id, state, { expectedVersion, provenance }) {
    const current = this.#records.get(id);
    if (!current) throw new RegistrationError(`Unknown record: ${id}`);
    if (expectedVersion !== current.version) throw new ConcurrencyError(`Version conflict for ${id}`, { expectedVersion, actualVersion: current.version });
    if (!provenance) throw new RegistrationError('State-change provenance is required');
    const next = Object.freeze({ ...current, state, provenance: structuredClone(provenance), version: current.version + 1, updatedAt: Date.now() });
    this.#records.set(id, next);
    this.#history.get(id).push(next);
    return next;
  }
}
