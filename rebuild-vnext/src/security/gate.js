import { InvariantViolationError, RegistrationError } from '../kernel/errors.js';
import { canAuthorize } from './trust.js';

export class SecurityGate {
  #sessions;
  #authorizations;
  #protectedActions;
  #audit;

  constructor({ sessions, authorizations, protectedActions, audit }) {
    this.#sessions = sessions;
    this.#authorizations = authorizations;
    this.#protectedActions = protectedActions;
    this.#audit = audit;
  }

  evaluate({ actionId, ownerId, sessionId, sourceTrust, scope = {}, now = Date.now() }) {
    const action = this.#protectedActions.get(actionId);
    if (!action) throw new RegistrationError(`Unknown protected action: ${actionId}`);
    if (!canAuthorize(sourceTrust)) return this.#deny(actionId, ownerId, 'source_cannot_authorize');
    const session = this.#sessions.get(sessionId, now);
    if (!session || session.ownerId !== ownerId || session.state !== 'active') return this.#deny(actionId, ownerId, 'invalid_session');
    const decision = this.#authorizations.authorize({ ownerId, permission: action.permission, scope, now });
    if (!decision.allowed) return this.#deny(actionId, ownerId, 'authorization_missing_or_out_of_scope');
    this.#audit.append({ type: 'security.authorization.allowed', actionId, ownerId, grantId: decision.grant.id });
    return Object.freeze({ allowed: true, action, grant: decision.grant });
  }

  assert(input) {
    const decision = this.evaluate(input);
    if (!decision.allowed) throw new InvariantViolationError(`Protected action denied: ${input.actionId}`, decision);
    return decision;
  }

  #deny(actionId, ownerId, reason) {
    this.#audit.append({ type: 'security.authorization.denied', actionId, ownerId, reason });
    return Object.freeze({ allowed: false, reason });
  }
}
