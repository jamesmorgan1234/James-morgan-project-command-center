import { InvariantViolationError, RegistrationError } from '../kernel/errors.js';

export class InvariantRegistry {
  #checks = new Map();

  register(id, check, { severity = 'critical', owner = 'A00' } = {}) {
    if (this.#checks.has(id)) throw new RegistrationError(`Invariant already registered: ${id}`);
    if (typeof check !== 'function') throw new TypeError('Invariant check must be a function');
    this.#checks.set(id, Object.freeze({ check, severity, owner }));
  }

  async assert(context, phase) {
    for (const [id, invariant] of this.#checks) {
      const result = await invariant.check(context, phase);
      if (result === false || (result && result.ok === false)) {
        const details = result && typeof result === 'object' ? result : {};
        throw new InvariantViolationError(`Invariant ${id} failed during ${phase}`, {
          id, phase, severity: invariant.severity, owner: invariant.owner, ...details
        });
      }
    }
    return true;
  }

  list() {
    return Object.freeze([...this.#checks.entries()].map(([id, x]) => ({ id, severity: x.severity, owner: x.owner })));
  }
}
