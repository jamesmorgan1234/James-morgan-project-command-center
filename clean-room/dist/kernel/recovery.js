function requireText(value, label) {
    const normalized = value.trim();
    if (!normalized)
        throw new Error(`${label} is required`);
    return normalized;
}
function parseTime(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be a valid timestamp`);
    return parsed;
}
export class RecoveryAuthorizationStore {
    #grants = new Map();
    #consumed = new Set();
    #verifyIssuer;
    #evidenceSink;
    constructor(input) {
        this.#verifyIssuer = input.verifyIssuer;
        this.#evidenceSink = input.evidenceSink;
    }
    issue(input) {
        const id = requireText(input.id, "Recovery authorization id");
        if (this.#grants.has(id))
            throw new Error("Recovery authorization id already exists");
        const issuedAtMs = parseTime(input.issuedAt, "Recovery authorization issuedAt");
        const expiresAtMs = parseTime(input.expiresAt, "Recovery authorization expiresAt");
        if (expiresAtMs <= issuedAtMs)
            throw new Error("Recovery authorization expiry must follow issuance");
        const verification = {
            issuerId: requireText(input.issuerId, "Recovery authorization issuerId"),
            subjectId: requireText(input.subjectId, "Recovery authorization subjectId"),
            action: requireText(input.action, "Recovery authorization action"),
            resourceId: requireText(input.resourceId, "Recovery authorization resourceId"),
            scope: requireText(input.scope, "Recovery authorization scope"),
            environment: requireText(input.environment, "Recovery authorization environment"),
            operationId: requireText(input.operationId, "Recovery authorization operationId")
        };
        if (!this.#verifyIssuer(verification))
            throw new Error("Recovery authorization issuer is not trusted for this operation");
        const grant = Object.freeze({
            id,
            ...verification,
            issuedAt: input.issuedAt,
            expiresAt: input.expiresAt,
            singleUse: true
        });
        this.#grants.set(id, grant);
        return grant;
    }
    revoke(id, revokedAt) {
        const grant = this.#grants.get(id);
        if (!grant)
            throw new Error("Unknown recovery authorization");
        parseTime(revokedAt, "Recovery authorization revokedAt");
        const revoked = Object.freeze({ ...grant, revokedAt });
        this.#grants.set(id, revoked);
        return revoked;
    }
    get(id) {
        return this.#grants.get(id);
    }
    consumed(id) {
        return this.#consumed.has(id);
    }
    consume(input) {
        const grant = this.#grants.get(input.authorizationId);
        if (!grant)
            throw new Error("Recovery authorization was not issued by the trusted authority store");
        if (this.#consumed.has(grant.id))
            throw new Error("Recovery authorization already consumed");
        if (grant.revokedAt)
            throw new Error("Recovery authorization revoked");
        const nowMs = parseTime(input.now, "Recovery authorization consume now");
        if (nowMs < parseTime(grant.issuedAt, "Recovery authorization issuedAt"))
            throw new Error("Recovery authorization is not yet valid");
        if (nowMs >= parseTime(grant.expiresAt, "Recovery authorization expiresAt"))
            throw new Error("Recovery authorization expired");
        const exact = [
            ["subjectId", grant.subjectId, input.subjectId],
            ["action", grant.action, input.action],
            ["resourceId", grant.resourceId, input.resourceId],
            ["scope", grant.scope, input.scope],
            ["environment", grant.environment, input.environment],
            ["operationId", grant.operationId, input.operationId]
        ];
        for (const [label, expected, actual] of exact) {
            if (expected !== requireText(actual, `Recovery consume ${label}`))
                throw new Error(`Recovery authorization ${label} mismatch`);
        }
        // In this single-process reference adapter, the synchronous set is the atomic consume boundary.
        // Durable multi-process consumption must use the canonical transactional persistence adapter.
        this.#consumed.add(grant.id);
        this.#evidenceSink?.(Object.freeze({
            id: `evidence:recovery-consumption:${grant.id}`,
            subjectId: grant.operationId,
            strength: "canonical_record",
            sourceRef: `kernel:recovery-authorization-store:${grant.id}:${grant.action}:${grant.resourceId}:${grant.environment}`,
            recordedAt: input.now,
            verified: true,
            scopeRef: grant.scope
        }));
        return grant;
    }
}
export function decideStartup(assessment) {
    if (!assessment.configValid)
        return { mode: "recovery", reason: "invalid_configuration", rollbackAvailable: assessment.knownGoodReleaseAvailable };
    if (!assessment.schemaCompatible)
        return { mode: "recovery", reason: "schema_incompatible", rollbackAvailable: assessment.knownGoodReleaseAvailable };
    if (!assessment.releaseCompatible)
        return { mode: "recovery", reason: "release_incompatible", rollbackAvailable: assessment.knownGoodReleaseAvailable };
    return { mode: "normal", reason: "startup_checks_passed", rollbackAvailable: assessment.knownGoodReleaseAvailable };
}
/**
 * Advisory recovery classification only. It deliberately cannot authorize a protected effect from a caller-supplied object.
 * Use authorizeProtectedRecovery() at the trusted effect boundary.
 */
export function evaluateProtectedRecovery(assessment) {
    if (!assessment.protectedEffectRequested)
        return Object.freeze({ allowed: true, reason: "non_protected_recovery_action", recoveryOnly: true });
    if (assessment.policyState === "healthy" && assessment.revocationStateFresh)
        return Object.freeze({ allowed: false, reason: "use_normal_policy_path", recoveryOnly: true });
    if (!assessment.recoveryAuthorization)
        return Object.freeze({ allowed: false, reason: "recovery_authorization_required", recoveryOnly: true });
    return Object.freeze({ allowed: false, reason: "trusted_recovery_boundary_required", recoveryOnly: true });
}
export function authorizeProtectedRecovery(store, input) {
    if (!input.protectedEffectRequested)
        return Object.freeze({ allowed: true, reason: "non_protected_recovery_action", recoveryOnly: true });
    if (input.policyState === "healthy" && input.revocationStateFresh)
        return Object.freeze({ allowed: false, reason: "use_normal_policy_path", recoveryOnly: true });
    try {
        const grant = store.consume(input);
        return Object.freeze({ allowed: true, reason: "constrained_recovery_authorized", recoveryOnly: true, authorizationId: grant.id, operationId: grant.operationId });
    }
    catch (error) {
        return Object.freeze({ allowed: false, reason: error instanceof Error ? error.message : "recovery_denied", recoveryOnly: true });
    }
}
const RECOVERY_MESSAGES = Object.freeze({
    invalid_configuration: "Command Center configuration could not be verified. Recovery mode is active.",
    schema_incompatible: "Command Center data compatibility could not be verified. Recovery mode is active.",
    release_incompatible: "Command Center release compatibility could not be verified. Recovery mode is active.",
    startup_failed: "Command Center could not start safely. Recovery mode is active."
});
export function classifyRecoveryFailure(error) {
    if (!(error instanceof Error))
        return "startup_failed";
    const message = error.message.toLowerCase();
    if (message.includes("schema"))
        return "schema_incompatible";
    if (message.includes("release") || message.includes("build placeholder"))
        return "release_incompatible";
    if (message.includes("config") || message.includes("environment") || message.includes("version") || message.includes("feature flag"))
        return "invalid_configuration";
    return "startup_failed";
}
export function createRecoveryShellPlan(reason, knownGoodFallbackAvailable) {
    const safeReason = typeof reason === "string" && Object.hasOwn(RECOVERY_MESSAGES, reason) ? reason : "startup_failed";
    return Object.freeze({
        mode: "recovery",
        reason: safeReason,
        message: RECOVERY_MESSAGES[safeReason],
        retryAllowed: true,
        knownGoodFallbackAvailable,
        privateDataAllowed: false,
        diagnostic: Object.freeze({ code: safeReason, privacySafe: true, ownerStateMutationAllowed: false })
    });
}
export class RecoveryRetryBudget {
    #maximumAttempts;
    #attempts = 0;
    constructor(maximumAttempts = 3) {
        if (!Number.isSafeInteger(maximumAttempts) || maximumAttempts < 1)
            throw new Error("Recovery retry maximumAttempts must be a positive safe integer");
        this.#maximumAttempts = maximumAttempts;
    }
    get attempts() { return this.#attempts; }
    get remaining() { return Math.max(0, this.#maximumAttempts - this.#attempts); }
    consume() {
        if (this.#attempts >= this.#maximumAttempts)
            throw new Error("Recovery retry budget exhausted");
        this.#attempts += 1;
        return this.#attempts;
    }
}
//# sourceMappingURL=recovery.js.map