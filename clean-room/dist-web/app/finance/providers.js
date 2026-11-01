function parseTime(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
export function assessFinancialProviderConnection(evidence, now) {
    if (!evidence.providerKey.startsWith("finance-provider:"))
        throw new Error("Financial provider key must start with finance-provider:");
    if (!evidence.ownerId.trim() || !evidence.providerIdentity.trim())
        throw new Error("Financial provider owner and provider identity are required");
    if (!Number.isFinite(evidence.freshnessSeconds) || evidence.freshnessSeconds < 0)
        throw new Error("Financial provider freshness must be non-negative");
    if (!Array.isArray(evidence.provenanceRefs) || evidence.provenanceRefs.length === 0 || evidence.provenanceRefs.some((ref) => !ref.trim()))
        throw new Error("Financial provider provenance is required");
    const nowMs = parseTime(now, "Financial provider assessment now");
    parseTime(evidence.observedAt, "Financial provider observedAt");
    if (evidence.consentState === "granted" && !evidence.consentRef?.trim())
        throw new Error("Granted financial consent requires consent evidence");
    const reconnectRequired = evidence.connectionState === "disconnected" || evidence.connectionState === "expired" || evidence.connectionState === "revoked";
    if (reconnectRequired && !evidence.reconnectRef?.trim())
        throw new Error("Disconnected/expired/revoked financial provider requires reconnect path evidence");
    let freshness = "unknown";
    if (reconnectRequired)
        freshness = "disconnected";
    else if (evidence.lastSuccessfulSyncAt) {
        const syncMs = parseTime(evidence.lastSuccessfulSyncAt, "Financial provider lastSuccessfulSyncAt");
        if (syncMs > nowMs)
            throw new Error("Financial provider sync cannot be in the future");
        freshness = nowMs - syncMs <= evidence.freshnessSeconds * 1000 ? "fresh" : "stale";
    }
    return Object.freeze({
        providerKey: evidence.providerKey,
        providerIdentity: evidence.providerIdentity,
        connectionState: evidence.connectionState,
        consentState: evidence.consentState,
        freshness,
        reconnectRequired,
        historicalRecordsPreserved: true,
        provenanceRefs: Object.freeze([...evidence.provenanceRefs]),
        protectedActionAuthorized: false
    });
}
export class FinancialProviderRegistry {
    #providers = new Map();
    register(provider) {
        if (!provider.key.startsWith("finance-provider:"))
            throw new Error(`Financial provider key must start with finance-provider:: ${provider.key}`);
        if (!Number.isSafeInteger(provider.version) || provider.version < 1)
            throw new Error("Financial provider version must be positive");
        if (!Number.isFinite(provider.freshnessSeconds) || provider.freshnessSeconds < 0)
            throw new Error("Financial provider freshness must be non-negative");
        if (new Set(provider.capabilities).size !== provider.capabilities.length || new Set(provider.dataScopes).size !== provider.dataScopes.length)
            throw new Error("Financial provider capabilities/scopes must be unique");
        if (this.#providers.has(provider.key))
            throw new Error(`Financial provider already exists: ${provider.key}`);
        this.#providers.set(provider.key, Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]), dataScopes: Object.freeze([...provider.dataScopes]) }));
    }
    eligible(capability, requiredScope) {
        return Object.freeze([...this.#providers.values()].filter((provider) => provider.enabled && provider.connectionState === "connected" && provider.consentState === "granted" && provider.health !== "unavailable" && provider.capabilities.includes(capability) && (!requiredScope || provider.dataScopes.includes(requiredScope))));
    }
    get(key) { return this.#providers.get(key); }
    list() { return Object.freeze([...this.#providers.values()]); }
}
//# sourceMappingURL=providers.js.map