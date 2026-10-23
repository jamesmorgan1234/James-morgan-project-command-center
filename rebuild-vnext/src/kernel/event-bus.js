import { RegistrationError } from './errors.js';

export class EventBus {
  #types = new Map();
  #subscribers = new Map();

  define(type, validate = () => true) {
    if (this.#types.has(type)) throw new RegistrationError(`Event type already defined: ${type}`);
    this.#types.set(type, validate);
  }

  subscribe(type, handler) {
    if (!this.#types.has(type)) throw new RegistrationError(`Unknown event type: ${type}`);
    const handlers = this.#subscribers.get(type) ?? new Set();
    handlers.add(handler);
    this.#subscribers.set(type, handlers);
    return () => handlers.delete(handler);
  }

  async publish(event) {
    const validate = this.#types.get(event?.type);
    if (!validate) throw new RegistrationError(`Unknown event type: ${event?.type}`);
    validate(event);
    const failures = [];
    for (const handler of this.#subscribers.get(event.type) ?? []) {
      try { await handler(Object.freeze(structuredClone(event))); }
      catch (error) { failures.push(error); }
    }
    return Object.freeze({ delivered: (this.#subscribers.get(event.type) ?? new Set()).size, failures });
  }
}
