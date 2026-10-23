import { RegistrationError } from '../kernel/errors.js';

export class SessionRegistry {
  #sessions = new Map();

  create({ id, ownerId, deviceId, expiresAt, assurance = 'standard' }) {
    if (!id || !ownerId || !deviceId || !expiresAt) throw new RegistrationError('Session requires id, ownerId, deviceId, expiresAt');
    if (this.#sessions.has(id)) throw new RegistrationError(`Duplicate session: ${id}`);
    const session = Object.freeze({ id, ownerId, deviceId, expiresAt, assurance, state: 'active', createdAt: Date.now() });
    this.#sessions.set(id, session);
    return session;
  }

  get(id, now = Date.now()) {
    const session = this.#sessions.get(id);
    if (!session) return null;
    if (session.state === 'active' && session.expiresAt <= now) {
      const expired = Object.freeze({ ...session, state: 'expired', changedAt: now });
      this.#sessions.set(id, expired);
      return expired;
    }
    return session;
  }

  revoke(id, reason = 'owner_revoked') {
    const session = this.#sessions.get(id);
    if (!session) throw new RegistrationError(`Unknown session: ${id}`);
    const revoked = Object.freeze({ ...session, state: 'revoked', revocationReason: reason, changedAt: Date.now() });
    this.#sessions.set(id, revoked);
    return revoked;
  }

  activeForOwner(ownerId, now = Date.now()) {
    return Object.freeze([...this.#sessions.keys()].map(id => this.get(id, now)).filter(s => s.ownerId === ownerId && s.state === 'active'));
  }
}
