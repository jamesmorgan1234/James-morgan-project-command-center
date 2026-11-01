import { assertSecretChannelSafe } from "../security/secret-channels.js";
export function assertSocialIsolation(records) {
    const byAccount = new Map();
    for (const record of records) {
        if (!record.ownerId.trim() || !record.brandId.trim() || !record.accountId.trim() || !record.credentialRef.trim())
            throw new Error("social recovery record missing stable identity or credential reference");
        if (!record.sourceRefs.length)
            throw new Error("social recovery record requires provenance");
        const prior = byAccount.get(record.accountId);
        if (prior && (prior.ownerId !== record.ownerId || prior.brandId !== record.brandId || prior.credentialRef !== record.credentialRef))
            throw new Error("social account identity crosses owner/brand boundary");
        byAccount.set(record.accountId, record);
    }
}
export function assertPaidActionAllowed(_record, _exactAuthorizationRef) {
    throw new Error("paid social action is blocked without a fresh protected owner authorization path");
}
export function recoveryAction(record) {
    if (record.providerState === "connected")
        return "none";
    if (record.providerState === "revoked")
        return "reauthorize";
    return "reconnect";
}
export function buildDisconnectImpactPreview(input) {
    if (!input.ownerId.trim() || !input.brandId.trim() || !input.accountId.trim() || !input.platform.trim())
        throw new Error("disconnect impact preview requires exact social identity");
    if (!input.evidenceRefs.length || input.evidenceRefs.some((ref) => !ref.trim()))
        throw new Error("disconnect impact preview requires evidence");
    if (input.retainedHistoryRefs.some((ref) => !ref.trim()))
        throw new Error("retained history references cannot be blank");
    return Object.freeze({ ...input, retainedHistoryRefs: Object.freeze([...new Set(input.retainedHistoryRefs)]), evidenceRefs: Object.freeze([...new Set(input.evidenceRefs)]), destructiveHistoryDeletion: false });
}
export function isolatePlatformOutage(platform, accounts) {
    if (!platform.trim() || accounts.some((item) => !item.accountId.trim() || !item.platform.trim()))
        throw new Error("platform outage isolation requires valid account/platform identities");
    return Object.freeze({
        platform,
        affectedAccountIds: Object.freeze(accounts.filter((item) => item.platform === platform).map((item) => item.accountId)),
        unaffectedAccountIds: Object.freeze(accounts.filter((item) => item.platform !== platform).map((item) => item.accountId)),
        crossPlatformBlocked: false
    });
}
function timestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function refs(values, label, requireOne = true) {
    if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank references`);
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
    return Object.freeze(normalized);
}
export class SocialIsolationRegistry {
    #accounts = new Map();
    #platformIdentities = new Map();
    bind(binding) {
        if (!binding.ownerId.trim() || !binding.entityId.trim() || !binding.brandId.trim() || !binding.accountId.trim() || !binding.platformIdentityId.trim())
            throw new Error("social isolation binding requires owner/entity/brand/account/platform identity");
        if (binding.companyId !== undefined && !binding.companyId.trim())
            throw new Error("social isolation companyId cannot be blank");
        if (binding.projectId !== undefined && !binding.projectId.trim())
            throw new Error("social isolation projectId cannot be blank");
        if (binding.credentialRef !== undefined && !binding.credentialRef.trim())
            throw new Error("social isolation credential reference cannot be blank");
        const evidenceRefs = refs(binding.evidenceRefs, "social isolation evidence");
        const current = this.#accounts.get(binding.accountId);
        if (current && (current.ownerId !== binding.ownerId || current.entityId !== binding.entityId || current.companyId !== binding.companyId || current.brandId !== binding.brandId || current.projectId !== binding.projectId || current.platformIdentityId !== binding.platformIdentityId))
            throw new Error("social account crosses owner/company/project/brand isolation boundary");
        assertSecretChannelSafe("brain_memory", binding);
        const identityKey = JSON.stringify([binding.ownerId, binding.platformIdentityId]);
        const boundAccount = this.#platformIdentities.get(identityKey);
        if (boundAccount && boundAccount !== binding.accountId)
            throw new Error("platform identity is already isolated to another account");
        const frozen = Object.freeze({ ...binding, evidenceRefs });
        this.#accounts.set(binding.accountId, frozen);
        this.#platformIdentities.set(identityKey, binding.accountId);
        return frozen;
    }
}
export function assessSocialRecovery(recovery) {
    if (!recovery.id.trim() || !recovery.ownerId.trim() || !recovery.brandId.trim() || !recovery.accountId.trim())
        throw new Error("social recovery case identity is required");
    timestamp(recovery.observedAt, "social recovery observedAt");
    refs(recovery.evidenceRefs, "social recovery evidence");
    const missingScopes = refs(recovery.missingScopes, "social recovery missing scopes", false);
    let action = "none";
    if (recovery.kind === "identity_conflict")
        action = "reconcile_identity";
    else if (recovery.providerState === "unavailable" || recovery.kind === "provider_outage")
        action = "wait_provider";
    else if (recovery.providerState === "revoked")
        action = "reauthorize";
    else if (missingScopes.length || recovery.kind === "scope_loss")
        action = "restore_scope";
    else if (recovery.providerState === "disconnected" || recovery.providerState === "expired" || recovery.kind === "connection_loss" || recovery.kind === "credential_rotation")
        action = "reconnect";
    const ownerActionRequired = ["reconnect", "reauthorize", "reconcile_identity", "restore_scope"].includes(action);
    if (ownerActionRequired && !recovery.ownerActionRef?.trim())
        throw new Error("owner-action recovery path requires explicit owner action reference");
    if ((action === "reconnect" || action === "reauthorize") && !recovery.reconnectRef?.trim())
        throw new Error("connection recovery requires explicit reconnect reference");
    return Object.freeze({ caseId: recovery.id, action, ownerActionRequired, recoverable: action !== "reconcile_identity" || Boolean(recovery.ownerActionRef?.trim()), secretsExposed: false, protectedActionAuthorized: false });
}
export function paidSocialAuthorizationBinding(request, identity) {
    return JSON.stringify([request.ownerId, identity.entityId, identity.companyId ?? null, request.brandId, identity.projectId ?? null, request.accountId, identity.platform, identity.platformIdentityId, request.id, request.actionKind, request.amount, request.currency]);
}
export function assessPaidSocialAction(request, authorization, now, authority) {
    if (!request.id.trim() || !request.ownerId.trim() || !request.brandId.trim() || !request.accountId.trim() || !request.actionKind.trim() || !/^[A-Z]{3}$/.test(request.currency))
        throw new Error("paid social action identity/account/action/currency are required");
    if (!Number.isFinite(request.amount) || request.amount < 0)
        throw new Error("paid social action amount must be nonnegative");
    const nowMs = timestamp(now, "paid social action now");
    if (request.providerState !== "connected")
        return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: false, reason: "provider_not_connected" });
    if (!authorization)
        return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: false, reason: "missing_exact_authorization" });
    if (!authorization.authorizationRef.trim() || authorization.ownerId !== request.ownerId || authorization.accountId !== request.accountId || authorization.actionId !== request.id || authorization.actionKind !== request.actionKind || authorization.currency !== request.currency)
        return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: false, reason: "authorization_mismatch" });
    const issuedAt = timestamp(authorization.observedAt, "paid social authorization observedAt");
    const expiresAt = timestamp(authorization.expiresAt, "paid social authorization expiresAt");
    if (issuedAt > nowMs || expiresAt <= nowMs || expiresAt <= issuedAt)
        return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: false, reason: "authorization_expired", authorizationRef: authorization.authorizationRef });
    if (!Number.isFinite(authorization.maxAmount) || authorization.maxAmount < request.amount)
        return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: false, reason: "amount_exceeds_authorization", authorizationRef: authorization.authorizationRef });
    if (!authority)
        return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: false, reason: "missing_exact_authorization" });
    const session = authority.sessions.validateLive(authority.sessionId, now);
    const identity = authority.identity;
    if (session.ownerId !== request.ownerId || session.companyId !== identity.companyId || session.projectId !== identity.projectId || session.accountId !== request.accountId || session.assurance !== "fresh_passkey_uv" || identity.ownerId !== request.ownerId || identity.brandId !== request.brandId || identity.accountIdentityId !== request.accountId)
        throw new Error("paid action live canonical identity mismatch");
    const decision = authority.policies.evaluate({ action: "social.paid", subject: { ...session, sessionId: session.id }, resourceOwnerId: request.ownerId, ...(identity.companyId ? { resourceCompanyId: identity.companyId } : {}), ...(identity.projectId ? { resourceProjectId: identity.projectId } : {}), resourceAccountId: request.accountId, now, revocationStateFresh: true });
    if (!decision.allowed)
        throw new Error("paid action policy denied");
    const use = { ownerId: request.ownerId, sessionId: authority.sessionId, action: "social.paid", authorizationIntentBinding: paidSocialAuthorizationBinding(request, identity) };
    const grant = authority.authorizations.assertUsable(authorization.authorizationRef, use, now);
    if (grant.authoritySource !== "owner_verified" || nowMs - Date.parse(grant.issuedAt) >= 300_000 || grant.issuedAt !== authorization.observedAt || grant.expiresAt !== authorization.expiresAt)
        throw new Error("paid action requires fresh exact owner approval");
    return Object.freeze({ actionId: request.id, protectedActionAuthorized: false, allowed: true, reason: "authorized", authorizationRef: authorization.authorizationRef });
}
//# sourceMappingURL=recovery.js.map