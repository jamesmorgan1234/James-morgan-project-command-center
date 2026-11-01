import { createIntentBinding } from '../security/intent.js';
export function analyticsAccessIntent(operation, scope, reference, environment) { return { action: 'analytics.' + operation, ownerId: scope.ownerId, scope: { ownerId: scope.ownerId, companyId: scope.companyId, projectId: scope.projectId, environment }, targetResourceId: reference, parameters: { brainId: scope.brainId }, maximumCostCents: 0 }; }
/** Current C2 policy/session checks; analytics creates no grants or alternate security path. */
export function analyticsC2Access(gate, grants, sessions, sessionId, environment, now, evidence, exportAuthorizationId) {
    return { now, evidence, authorize(operation, scope, reference) { try {
            const session = sessions.validateLive(sessionId, now());
            if (!session.scopes.includes('analytics:brain:' + scope.brainId))
                return false;
            const intent = analyticsAccessIntent(operation, scope, reference, environment), binding = createIntentBinding(intent);
            if (operation === 'export') {
                const id = exportAuthorizationId(scope, reference);
                if (!id)
                    return false;
                const grant = grants.assertUsable(id, { ownerId: scope.ownerId, sessionId, action: intent.action, authorizationIntentBinding: binding }, now());
                if (grant.authoritySource !== 'owner_verified')
                    return false;
            }
            return gate.authorize({ sessionId, action: intent.action, resourceOwnerId: scope.ownerId, resourceCompanyId: scope.companyId, resourceProjectId: scope.projectId, resourceEnvironment: environment, now: now(), intent, authorizationIntentBinding: binding }).allowed;
        }
        catch {
            return false;
        } } };
}
//# sourceMappingURL=access.js.map