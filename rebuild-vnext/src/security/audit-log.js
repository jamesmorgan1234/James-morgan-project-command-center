export class SecurityAuditLog {
  #events = [];

  append(event) {
    const stored = Object.freeze({ ...structuredClone(event), at: event.at ?? Date.now() });
    this.#events.push(stored);
    return stored;
  }

  list() { return Object.freeze([...this.#events]); }
}
