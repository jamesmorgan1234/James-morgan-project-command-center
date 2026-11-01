import { createIntentBinding } from '../security/intent.js';
import { recoveryScopeKey } from './contracts.js';
export function recoveryIntent(operation, scope, reference) { return { action: 'recovery.' + operation, ownerId: scope.ownerId, scope, targetResourceId: reference, parameters: { recoveryScope: recoveryScopeKey(scope), isolatedOnly: true }, maximumCostCents: 0 }; }
/** Uses current C2 sessions/policy and exact owner-verified grants. Never issues grants. */
export function recoveryC2Access(gate, grants, sessions, sessionId, now, evidence, authorizationId) { return { now, evidence, authorize(operation, scope, reference) { try {
        if (scope.environment === 'production')
            return false;
        const session = sessions.validateLive(sessionId, now());
        if (!session.scopes.includes('recovery:' + operation))
            return false;
        const intent = recoveryIntent(operation, scope, reference), binding = createIntentBinding(intent);
        if (operation !== 'read') {
            const id = authorizationId(operation, scope, reference);
            if (!id)
                return false;
            const g = grants.assertUsable(id, { ownerId: scope.ownerId, sessionId, action: intent.action, authorizationIntentBinding: binding }, now());
            if (g.authoritySource !== 'owner_verified')
                return false;
        }
        return gate.authorize({ sessionId, action: intent.action, resourceOwnerId: scope.ownerId, resourceCompanyId: scope.companyId, resourceProjectId: scope.projectId, resourceEnvironment: scope.environment, ...(scope.accountId ? { resourceAccountId: scope.accountId } : {}), now: now(), intent, authorizationIntentBinding: binding }).allowed;
    }
    catch {
        return false;
    } } }; }
//# sourceMappingURL=access.js.map