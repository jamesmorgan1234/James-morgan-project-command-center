const LEVEL_RANK = Object.freeze({ observe: 0, propose: 1, prepare: 2, execute: 3, continuous: 4 });
export function canAct(level, right, protectedAuthorization) {
    if (right === "prohibited")
        return false;
    if (right === "protected")
        return LEVEL_RANK[level] >= LEVEL_RANK.execute && protectedAuthorization;
    if (right === "recommend")
        return LEVEL_RANK[level] >= LEVEL_RANK.propose;
    if (right === "defaultable")
        return LEVEL_RANK[level] >= LEVEL_RANK.prepare;
    return LEVEL_RANK[level] >= LEVEL_RANK.execute;
}
export function assertAutonomyCannotExpandScope(parentScopes, requestedScopes) {
    for (const scope of requestedScopes)
        if (!parentScopes.includes(scope))
            throw new Error(`Autonomy cannot amplify authority scope: ${scope}`);
}
function normalizeDecisionRule(rule) {
    if (!rule.key.trim() || !Number.isSafeInteger(rule.version) || rule.version < 1)
        throw new Error("Decision-right key/version are required");
    const evidenceRefs = rule.evidenceRefs.map((ref) => ref.trim());
    if (evidenceRefs.length === 0 || evidenceRefs.some((ref) => !ref) || new Set(evidenceRefs).size !== evidenceRefs.length)
        throw new Error("Decision-right evidence must be unique and nonblank");
    if (rule.right === "defaultable" && !rule.ownerDefaultRef?.trim())
        throw new Error("Defaultable decision right requires owner-approved default evidence");
    if (rule.right === "protected" && !rule.protectedActionKey?.trim())
        throw new Error("Protected decision right requires an exact protected action key");
    return Object.freeze({
        ...rule,
        key: rule.key.trim(),
        ...(rule.ownerDefaultRef ? { ownerDefaultRef: rule.ownerDefaultRef.trim() } : {}),
        ...(rule.protectedActionKey ? { protectedActionKey: rule.protectedActionKey.trim() } : {}),
        evidenceRefs: Object.freeze(evidenceRefs)
    });
}
export class DecisionRightsRegistry {
    #rules = new Map();
    register(rule) {
        const next = normalizeDecisionRule(rule);
        const current = this.#rules.get(next.key);
        if (current && next.version <= current.version)
            throw new Error(`Decision-right version must advance: ${next.key}`);
        this.#rules.set(next.key, next);
        return next;
    }
    get(key) { return this.#rules.get(key); }
    assess(key, level, protectedAuthorization) {
        const rule = this.#rules.get(key);
        if (!rule)
            throw new Error(`Unknown decision right: ${key}`);
        const allowed = canAct(level, rule.right, protectedAuthorization);
        const ownerBoundaryRequired = rule.right === "protected" && !protectedAuthorization;
        const reason = rule.right === "prohibited" ? "prohibited" :
            ownerBoundaryRequired ? "protected_authorization_required" :
                allowed ? "allowed_by_registry" :
                    "autonomy_level_insufficient";
        return Object.freeze({ key: rule.key, version: rule.version, right: rule.right, allowed, ownerBoundaryRequired, reason });
    }
    list() {
        return Object.freeze([...this.#rules.values()].sort((a, b) => a.key.localeCompare(b.key)));
    }
}
//# sourceMappingURL=autonomy.js.map