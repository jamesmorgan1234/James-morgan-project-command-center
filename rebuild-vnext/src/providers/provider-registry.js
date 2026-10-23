import { RegistrationError } from '../kernel/errors.js';

export class ProviderRegistry {
  #providers = new Map();

  register(id, provider) {
    if (this.#providers.has(id)) throw new RegistrationError(`Duplicate provider: ${id}`);
    for (const key of ['kind', 'version', 'capabilities', 'normalize', 'health']) {
      if (!(key in provider)) throw new RegistrationError(`Provider ${id} missing ${key}`);
    }
    if (typeof provider.normalize !== 'function' || typeof provider.health !== 'function') throw new RegistrationError(`Provider ${id} normalize/health must be functions`);
    this.#providers.set(id, provider);
    return this.describe(id);
  }

  describe(id) {
    const p = this.#providers.get(id);
    if (!p) return null;
    return Object.freeze({ id, kind: p.kind, version: p.version, capabilities: [...p.capabilities], activationState: p.activationState ?? 'BUILT — NEEDS CONNECTION' });
  }

  async health(id) {
    const p = this.#providers.get(id);
    if (!p) throw new RegistrationError(`Unknown provider: ${id}`);
    const result = await p.health();
    return Object.freeze({ id, ...result });
  }

  normalize(id, payload, context = {}) {
    const p = this.#providers.get(id);
    if (!p) throw new RegistrationError(`Unknown provider: ${id}`);
    return p.normalize(payload, context);
  }
}
