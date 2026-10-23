import { RegistrationError } from '../kernel/errors.js';

export class PermissionRegistry {
  #permissions = new Map();
  define(id, { risk = 'low', description = '' } = {}) {
    if (this.#permissions.has(id)) throw new RegistrationError(`Permission already defined: ${id}`);
    const permission = Object.freeze({ id, risk, description });
    this.#permissions.set(id, permission);
    return permission;
  }
  has(id) { return this.#permissions.has(id); }
  get(id) { return this.#permissions.get(id) ?? null; }
}

export class AuthorizationService {
  #permissions;
  #grants = new Map();

  constructor(permissionRegistry) { this.#permissions = permissionRegistry; }

  grant({ id, ownerId, permission, scope = {}, expiresAt, evidence }) {
    if (!this.#permissions.has(permission)) throw new RegistrationError(`Unknown permission: ${permission}`);
    if (!id || !ownerId || !expiresAt || !evidence) throw new RegistrationError('Grant requires id, ownerId, expiresAt, evidence');
    if (this.#grants.has(id)) throw new RegistrationError(`Duplicate authorization grant: ${id}`);
    const grant = Object.freeze({ id, ownerId, permission, scope: structuredClone(scope), expiresAt, evidence, state: 'active', createdAt: Date.now() });
    this.#grants.set(id, grant);
    return grant;
  }

  revoke(id, reason = 'owner_revoked') {
    const grant = this.#grants.get(id);
    if (!grant) throw new RegistrationError(`Unknown authorization grant: ${id}`);
    const revoked = Object.freeze({ ...grant, state: 'revoked', reason, changedAt: Date.now() });
    this.#grants.set(id, revoked);
    return revoked;
  }

  authorize({ ownerId, permission, scope = {}, now = Date.now() }) {
    const matching = [...this.#grants.values()].filter(grant =>
      grant.ownerId === ownerId &&
      grant.permission === permission &&
      grant.state === 'active' &&
      grant.expiresAt > now &&
      scopeContains(grant.scope, scope)
    );
    return Object.freeze({ allowed: matching.length > 0, grant: matching[0] ?? null });
  }
}

function scopeContains(granted, requested) {
  for (const [key, value] of Object.entries(requested)) {
    if (!(key in granted)) return false;
    if (typeof value === 'number' && typeof granted[key] === 'number') {
      if (value > granted[key]) return false;
    } else if (granted[key] !== value) {
      return false;
    }
  }
  return true;
}
