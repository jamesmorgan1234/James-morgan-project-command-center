import { RegistrationError } from '../kernel/errors.js';

const FORBIDDEN_KEYS = new Set(['value', 'secret', 'token', 'password', 'key', 'credential']);

export class SecretReferenceRegistry {
  #refs = new Map();

  register(id, reference) {
    if (!id || !reference?.provider || !reference?.locator) throw new RegistrationError('Secret reference requires id, provider, locator');
    for (const key of Object.keys(reference)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) throw new RegistrationError(`Secret values are forbidden in SecretReferenceRegistry: ${key}`);
    }
    if (this.#refs.has(id)) throw new RegistrationError(`Duplicate secret reference: ${id}`);
    const stored = Object.freeze({ id, ...structuredClone(reference) });
    this.#refs.set(id, stored);
    return stored;
  }

  get(id) { return this.#refs.get(id) ?? null; }
}
