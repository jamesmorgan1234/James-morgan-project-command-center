import { assertSecretChannelSafe } from "../security/secret-channels.js";
function timestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function refs(values, label, requireOne = true) {
    if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) {
        throw new Error(`${label} must contain nonblank references`);
    }
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicate references`);
    return Object.freeze(normalized);
}
export function connectionIsLive(connection, requiredScopes, now, maxAgeMs = 300_000) {
    assertSecretChannelSafe("brain_memory", connection);
    if (now === undefined || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 0)
        return false;
    const at = Date.parse(now);
    const verified = Date.parse(connection.verifiedAt);
    if (!Number.isFinite(at) || !Number.isFinite(verified) || verified > at || at - verified > maxAgeMs)
        return false;
    if (connection.state !== "connected" || connection.providerHealth !== "available" || connection.credentialState !== "healthy")
        return false;
    if (!connection.credentialRef.trim() || connection.tokenPresent !== true)
        return false;
    if (connection.tokenExpiresAt !== undefined) {
        const expires = Date.parse(connection.tokenExpiresAt);
        if (!Number.isFinite(expires) || expires <= at)
            return false;
    }
    return requiredScopes.every((scope) => Boolean(scope.trim()) && connection.grantedScopes.includes(scope));
}
export function requiredOwnerConnectionAction(connection, requiredScopes = [], now) {
    if (connection.state === "revoked")
        return "Reconnect and explicitly reauthorize the account";
    if (connection.state === "expired")
        return "Refresh or reconnect the intended social account";
    if (connection.state === "disconnected")
        return "Connect the intended social account";
    if (connection.providerHealth !== "available")
        return "Wait for provider recovery; do not treat stored token metadata as live access";
    if (!connectionIsLive(connection, requiredScopes, now))
        return "Verify the intended account credential health, token freshness, permissions, and current connection evidence";
    return null;
}
export function assessSocialConnection(connection, requiredScopes, now, maxVerificationAgeMs) {
    assertSecretChannelSafe("brain_memory", connection);
    if (!["connected", "disconnected", "expired", "revoked"].includes(connection.state))
        throw new Error("Unknown social connection state");
    if (!["available", "degraded", "unavailable"].includes(connection.providerHealth))
        throw new Error("Unknown social provider health");
    if (!connection.id.trim() || !connection.ownerId.trim() || !connection.canonicalAccountId.trim() || !connection.platformIdentityId.trim()) {
        throw new Error("social connection identity is required");
    }
    const verifiedAt = timestamp(connection.verifiedAt, "social connection verifiedAt");
    const observedAt = timestamp(connection.observedAt, "social connection observedAt");
    const nowMs = timestamp(now, "social connection assessment now");
    if (verifiedAt > observedAt || observedAt > nowMs)
        throw new Error("social connection evidence cannot originate in the future");
    if (!Number.isSafeInteger(maxVerificationAgeMs) || maxVerificationAgeMs < 0)
        throw new Error("social connection verification age policy is invalid");
    refs(connection.evidenceRefs, "social connection evidence");
    const scopes = refs(connection.grantedScopes, "social connection granted scopes", false);
    const required = refs(requiredScopes, "required social scopes", false);
    if (connection.credentialRef !== undefined && !connection.credentialRef.trim())
        throw new Error("social credential reference cannot be blank");
    if (connection.tokenExpiresAt !== undefined)
        timestamp(connection.tokenExpiresAt, "social token expiresAt");
    const missingScopes = required.filter((scope) => !scopes.includes(scope));
    const verificationFresh = nowMs - verifiedAt <= maxVerificationAgeMs;
    const tokenFresh = connection.tokenPresent === true && (connection.tokenExpiresAt === undefined || timestamp(connection.tokenExpiresAt, "social token expiresAt") > nowMs);
    const live = connection.state === "connected" &&
        connection.providerHealth === "available" &&
        connection.credentialState === "healthy" &&
        Boolean(connection.credentialRef?.trim()) &&
        tokenFresh &&
        verificationFresh &&
        missingScopes.length === 0;
    const ownerActionRequired = !live;
    const requiresReconnect = connection.state !== "connected";
    if (requiresReconnect && connection.providerHealth !== "unavailable" && !connection.requiredOwnerActionRef?.trim()) {
        throw new Error("non-live social connection requires owner-action evidence unless blocked only by provider outage");
    }
    if (requiresReconnect && !connection.reconnectRef?.trim())
        throw new Error("disconnected, expired, or revoked social connection requires a recoverable reconnect reference");
    return Object.freeze({
        connectionId: connection.id,
        canonicalAccountId: connection.canonicalAccountId,
        state: connection.state,
        providerHealth: connection.providerHealth,
        live,
        tokenFresh,
        missingScopes: Object.freeze(missingScopes),
        ownerActionRequired,
        ...(connection.requiredOwnerActionRef !== undefined ? { ownerActionRef: connection.requiredOwnerActionRef } : {}),
        ...(connection.reconnectRef !== undefined ? { reconnectRef: connection.reconnectRef } : {}),
        ...(connection.credentialRef !== undefined ? { credentialRef: connection.credentialRef } : {}),
        ...(connection.credentialState !== undefined ? { credentialState: connection.credentialState } : {}),
        secretsExposed: false,
        protectedActionAuthorized: false
    });
}
export function assessSocialConnectionForIdentity(connection, identity, requiredScopes, now, maxAgeMs) {
    if (connection.ownerId !== identity.ownerId || connection.canonicalAccountId !== identity.accountIdentityId || connection.platformIdentityId !== identity.platformIdentityId) {
        throw new Error("social provider account does not match canonical identity");
    }
    if (connection.platform !== undefined && connection.platform !== identity.platform)
        throw new Error("social provider platform does not match canonical identity");
    return assessSocialConnection(connection, requiredScopes, now, maxAgeMs);
}
export function previewSocialDisconnect(accountId) {
    if (!accountId.trim())
        throw new Error("social disconnect impact requires exact account identity");
    return Object.freeze({
        accountId,
        connectionWillBeLost: true,
        publishingWillBeBlocked: true,
        inboxWillBeBlocked: true,
        retainedHistory: Object.freeze(["drafts", "published_content", "failed_content", "analytics", "messages"]),
        secretsDeleted: false
    });
}
//# sourceMappingURL=connections.js.map