import { createIntentBinding } from "./intent.js";
export const PROTECTED_ACTION_CLASSES = [
    "money",
    "purchase",
    "publishing",
    "send",
    "merge_deploy",
    "destructive",
    "security",
    "credential",
    "legal",
    "protected_asset"
];
function validateDefinition(definition) {
    if (!definition.action.trim())
        throw new Error("Protected action key is required");
    if (!PROTECTED_ACTION_CLASSES.includes(definition.actionClass))
        throw new Error("Unknown protected action class");
    if (!Number.isSafeInteger(definition.freshVerificationMaxAgeMs) || definition.freshVerificationMaxAgeMs <= 0) {
        throw new Error("Protected actions require a positive fresh-verification window");
    }
    if (new Set(definition.requiredScopes).size !== definition.requiredScopes.length)
        throw new Error("Protected action scopes must be unique");
    if (definition.requiredScopes.some((scope) => !scope.trim()))
        throw new Error("Protected action scopes cannot be blank");
    if (definition.policyEpoch !== undefined && (!Number.isSafeInteger(definition.policyEpoch) || definition.policyEpoch < 1)) {
        throw new Error("Protected action policyEpoch must be a positive safe integer");
    }
}
export class ProtectedActionCatalog {
    #definitions = new Map();
    register(definition) {
        validateDefinition(definition);
        if (this.#definitions.has(definition.action))
            throw new Error(`Protected action already registered: ${definition.action}`);
        this.#definitions.set(definition.action, Object.freeze({ ...definition, requiredScopes: Object.freeze([...definition.requiredScopes]) }));
    }
    get(action) { return this.#definitions.get(action); }
    required(action) {
        const definition = this.#definitions.get(action);
        if (!definition)
            throw new Error(`Unregistered protected action: ${action}`);
        return definition;
    }
    installPolicy(policy, action, version = 1) {
        if (!Number.isSafeInteger(version) || version < 1)
            throw new Error("Protected action policy version must be positive");
        const definition = this.required(action);
        const rule = {
            action: definition.action,
            version,
            enabled: true,
            riskClass: definition.riskClass,
            requiredScopes: definition.requiredScopes,
            minimumAssurance: definition.minimumAssurance,
            freshVerificationMaxAgeMs: definition.freshVerificationMaxAgeMs,
            ownerOnly: true,
            allowProjectWildcard: false,
            ...(definition.policyEpoch !== undefined ? { policyEpoch: definition.policyEpoch } : {})
        };
        policy.register(rule);
    }
}
export class ProtectedActionExecutor {
    catalog;
    gate;
    authorizations;
    constructor(catalog, gate, authorizations) {
        this.catalog = catalog;
        this.gate = gate;
        this.authorizations = authorizations;
    }
    execute(request) {
        const definition = this.catalog.required(request.action);
        if (request.intent.action !== request.action)
            throw new Error("Protected side-effect intent action mismatch");
        if (request.intent.ownerId !== request.resourceOwnerId)
            throw new Error("Protected side-effect intent owner mismatch");
        if (createIntentBinding(request.intent) !== request.authorizationIntentBinding)
            throw new Error("Protected side-effect authorization binding mismatch");
        const authorizationUse = {
            ownerId: request.resourceOwnerId,
            sessionId: request.sessionId,
            action: request.action,
            authorizationIntentBinding: request.authorizationIntentBinding
        };
        this.authorizations.assertUsable(request.authorizationId, authorizationUse, request.now);
        const gateRequest = {
            sessionId: request.sessionId,
            action: definition.action,
            resourceOwnerId: request.resourceOwnerId,
            ...(request.resourceProjectId !== undefined ? { resourceProjectId: request.resourceProjectId } : {}),
            ...(request.resourceCompanyId !== undefined ? { resourceCompanyId: request.resourceCompanyId } : {}),
            ...(request.resourceAccountId !== undefined ? { resourceAccountId: request.resourceAccountId } : {}),
            ...(request.resourceEnvironment !== undefined ? { resourceEnvironment: request.resourceEnvironment } : {}),
            now: request.now,
            intent: request.intent,
            authorizationIntentBinding: request.authorizationIntentBinding,
            ...(request.expectedPolicyEpoch !== undefined ? { expectedPolicyEpoch: request.expectedPolicyEpoch } : {})
        };
        this.gate.authorize(gateRequest);
        this.authorizations.consume(request.authorizationId, authorizationUse, request.now);
        return request.effect();
    }
}
//# sourceMappingURL=protected-actions.js.map