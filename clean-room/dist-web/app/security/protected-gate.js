import { assertIntentBinding } from "./intent.js";
import { PolicyDecisionAuditLedger } from "./policy-audit.js";
export class ProtectedActionGate {
    sessions;
    policies;
    devices;
    decisions;
    constructor(sessions, policies, devices, decisions = new PolicyDecisionAuditLedger()) {
        this.sessions = sessions;
        this.policies = policies;
        this.devices = devices;
        this.decisions = decisions;
    }
    authorize(request) {
        const knownSession = this.sessions.get(request.sessionId);
        let session;
        try {
            session = this.sessions.validateLive(request.sessionId, request.now);
            if (session.deviceId)
                this.devices.assertUsable(session.deviceId, session.ownerId);
            if ((request.intent === undefined) !== (request.authorizationIntentBinding === undefined))
                throw new Error("Protected intent and authorization binding must be supplied together");
            if (request.intent && request.authorizationIntentBinding) {
                if (request.intent.action !== request.action || request.intent.ownerId !== request.resourceOwnerId)
                    throw new Error("Protected intent action/owner mismatch");
                if (request.resourceProjectId && request.intent.scope.projectId !== request.resourceProjectId)
                    throw new Error("Protected intent project mismatch");
                if (request.resourceCompanyId && request.intent.scope.companyId !== request.resourceCompanyId)
                    throw new Error("Protected intent company mismatch");
                if (request.resourceAccountId && request.intent.scope.accountId !== request.resourceAccountId)
                    throw new Error("Protected intent account mismatch");
                if (request.resourceEnvironment && request.intent.scope.environment !== request.resourceEnvironment)
                    throw new Error("Protected intent environment mismatch");
                assertIntentBinding(request.intent, request.authorizationIntentBinding);
            }
        }
        catch (error) {
            const ownerId = knownSession?.ownerId ?? request.resourceOwnerId;
            const decision = this.policies.failClosed(request.action, "protected_precondition_failed");
            this.#appendDecision(ownerId, request, decision);
            throw error;
        }
        const subject = {
            ownerId: session.ownerId,
            sessionId: session.id,
            ...(session.deviceId ? { deviceId: session.deviceId } : {}),
            ...(session.projectId ? { projectId: session.projectId } : {}),
            ...(session.companyId ? { companyId: session.companyId } : {}),
            ...(session.accountId ? { accountId: session.accountId } : {}),
            ...(session.environment ? { environment: session.environment } : {}),
            assurance: session.assurance,
            scopes: session.scopes,
            ...(session.lastVerifiedAt ? { lastVerifiedAt: session.lastVerifiedAt } : {}),
            ...(session.policyEpoch !== undefined ? { policyEpoch: session.policyEpoch } : {})
        };
        const policyRequest = {
            action: request.action,
            subject,
            resourceOwnerId: request.resourceOwnerId,
            ...(request.resourceProjectId ? { resourceProjectId: request.resourceProjectId } : {}),
            ...(request.resourceCompanyId ? { resourceCompanyId: request.resourceCompanyId } : {}),
            ...(request.resourceAccountId ? { resourceAccountId: request.resourceAccountId } : {}),
            ...(request.resourceEnvironment ? { resourceEnvironment: request.resourceEnvironment } : {}),
            now: request.now,
            ...(request.policyAvailable !== undefined ? { policyAvailable: request.policyAvailable } : {}),
            ...(request.revocationStateFresh !== undefined ? { revocationStateFresh: request.revocationStateFresh } : {}),
            ...(request.expectedPolicyEpoch !== undefined ? { expectedPolicyEpoch: request.expectedPolicyEpoch } : {})
        };
        const decision = this.policies.evaluate(policyRequest);
        this.#appendDecision(session.ownerId, request, decision);
        if (!decision.allowed)
            throw new Error(`Policy denied ${request.action}: ${decision.reason}`);
        return decision;
    }
    #appendDecision(ownerId, request, decision) {
        this.decisions.append({
            ownerId,
            sessionId: request.sessionId,
            occurredAt: request.now,
            action: request.action,
            resourceOwnerId: request.resourceOwnerId,
            ...(request.resourceProjectId ? { resourceProjectId: request.resourceProjectId } : {}),
            ...(request.resourceCompanyId ? { resourceCompanyId: request.resourceCompanyId } : {}),
            ...(request.resourceAccountId ? { resourceAccountId: request.resourceAccountId } : {}),
            ...(request.resourceEnvironment ? { resourceEnvironment: request.resourceEnvironment } : {}),
            decision
        });
    }
}
//# sourceMappingURL=protected-gate.js.map