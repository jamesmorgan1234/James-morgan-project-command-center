import { RegistrationError } from '../kernel/errors.js';

const ALLOWED_STATES = new Set(['planned', 'implemented', 'verified', 'locked', 'deferred', 'excluded', 'reopened', 'superseded']);

export class RequirementRegistry {
  #requirements = new Map();

  register(requirement) {
    const { id, text, sourceIds = [], architectureOwner, state = 'planned' } = requirement;
    if (!id || !text || !architectureOwner) throw new RegistrationError('Requirement requires id, text, architectureOwner');
    if (!ALLOWED_STATES.has(state)) throw new RegistrationError(`Invalid requirement state: ${state}`);
    if (this.#requirements.has(id)) throw new RegistrationError(`Duplicate requirement id: ${id}`);
    const stored = Object.freeze({ ...structuredClone(requirement), sourceIds: Object.freeze([...sourceIds]), state });
    this.#requirements.set(id, stored);
    return stored;
  }

  get(id) { return this.#requirements.get(id) ?? null; }
  list() { return Object.freeze([...this.#requirements.values()]); }

  coverage() {
    const total = this.#requirements.size;
    const verified = [...this.#requirements.values()].filter(r => ['verified', 'locked'].includes(r.state)).length;
    return Object.freeze({ total, verified, percentage: total ? (verified / total) * 100 : null });
  }
}
