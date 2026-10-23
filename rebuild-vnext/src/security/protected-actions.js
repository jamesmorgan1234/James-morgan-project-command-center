import { RegistrationError } from '../kernel/errors.js';

export class ProtectedActionRegistry {
  #actions = new Map();

  define(id, { permission, irreversible = false, requiresFreshSession = true, requiresEvidence = true }) {
    if (!id || !permission) throw new RegistrationError('Protected action requires id and permission');
    if (this.#actions.has(id)) throw new RegistrationError(`Protected action already defined: ${id}`);
    const action = Object.freeze({ id, permission, irreversible, requiresFreshSession, requiresEvidence });
    this.#actions.set(id, action);
    return action;
  }

  get(id) { return this.#actions.get(id) ?? null; }
  list() { return Object.freeze([...this.#actions.values()]); }
}
