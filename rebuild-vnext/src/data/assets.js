import { createHash } from 'node:crypto';
import { RegistrationError } from '../kernel/errors.js';

export class AssetRegistry {
  #assets = new Map();

  register({ id, type, projectId, bytes, approvalState = 'unapproved', protectedState = false, provenance }) {
    if (!id || !type || !provenance) throw new RegistrationError('Asset requires id, type, provenance');
    if (this.#assets.has(id)) throw new RegistrationError(`Duplicate asset: ${id}`);
    const version = makeVersion(1, bytes, provenance);
    const asset = { id, type, projectId: projectId ?? null, approvalState, protectedState, currentVersion: 1, versions: [version], canonical: false };
    this.#assets.set(id, asset);
    return this.get(id);
  }

  addVersion(id, { bytes, provenance, allowProtectedChange = false }) {
    const asset = this.#assets.get(id);
    if (!asset) throw new RegistrationError(`Unknown asset: ${id}`);
    if (asset.protectedState && !allowProtectedChange) throw new RegistrationError(`Protected asset cannot be changed without explicit protected change authorization: ${id}`);
    const number = asset.currentVersion + 1;
    asset.versions.push(makeVersion(number, bytes, provenance));
    asset.currentVersion = number;
    return this.get(id);
  }

  protect(id) {
    const asset = this.#assets.get(id);
    if (!asset) throw new RegistrationError(`Unknown asset: ${id}`);
    asset.protectedState = true;
    return this.get(id);
  }

  setCanonical(id, canonical = true) {
    const asset = this.#assets.get(id);
    if (!asset) throw new RegistrationError(`Unknown asset: ${id}`);
    asset.canonical = canonical;
    return this.get(id);
  }

  get(id) {
    const asset = this.#assets.get(id);
    return asset ? structuredClone(asset) : null;
  }
}

function makeVersion(number, bytes, provenance) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes ?? '');
  return Object.freeze({ number, sha256: createHash('sha256').update(buffer).digest('hex'), provenance: structuredClone(provenance), createdAt: Date.now() });
}
