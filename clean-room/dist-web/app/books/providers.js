export class PublishingProviderRegistry {
    #providers = new Map();
    register(provider) {
        if (!provider.key.trim() || provider.version < 1 || !provider.sourceRef.trim())
            throw new Error("publishing provider identity/provenance required");
        const prior = this.#providers.get(provider.key);
        if (prior && provider.version <= prior.version)
            throw new Error("provider version must advance");
        const frozen = Object.freeze({ ...provider, capabilities: Object.freeze([...provider.capabilities]) });
        this.#providers.set(provider.key, frozen);
        return frozen;
    }
    route(capability) {
        return [...this.#providers.values()].find((provider) => provider.health !== "unavailable" && provider.capabilities.includes(capability)) ?? null;
    }
}
function providerTimestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function providerRefs(values, label) {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank values`);
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
    return Object.freeze(normalized);
}
function adapterVersionKey(ownerId, key, version) {
    return `${ownerId}:${key}@${version}`;
}
function adapterCurrentKey(ownerId, key) {
    return `${ownerId}:${key}`;
}
export class PublishingProviderAdapterRegistry {
    #current = new Map();
    #versions = new Map();
    register(adapter) {
        if (!adapter.key.trim() || !adapter.ownerId.trim() || !adapter.implementationRef.trim())
            throw new Error("publishing adapter key/owner/implementation are required");
        if (!Number.isSafeInteger(adapter.version) || adapter.version < 1)
            throw new Error("publishing adapter version must be positive");
        providerTimestamp(adapter.observedAt, "publishing adapter observedAt");
        const capabilities = providerRefs(adapter.capabilities, "publishing adapter capabilities");
        const evidenceRefs = providerRefs(adapter.evidenceRefs, "publishing adapter evidence refs");
        const boundaryEntries = Object.entries(adapter.boundaryByCapability);
        if (boundaryEntries.length === 0)
            throw new Error("publishing adapter boundary map is required");
        for (const capability of capabilities)
            if (!adapter.boundaryByCapability[capability])
                throw new Error(`publishing adapter capability ${capability} lacks an execution boundary`);
        for (const [capability, boundary] of boundaryEntries) {
            if (!capability.trim() || !capabilities.includes(capability))
                throw new Error("publishing adapter boundary map cannot contain unknown capability");
            if (!["normal_chat", "work_required", "owner_only"].includes(boundary))
                throw new Error("invalid publishing adapter boundary");
        }
        const currentKey = adapterCurrentKey(adapter.ownerId, adapter.key);
        const prior = this.#current.get(currentKey);
        if (prior && adapter.version <= prior.version)
            throw new Error("publishing adapter version must advance");
        const frozen = Object.freeze({ ...adapter, capabilities, evidenceRefs, boundaryByCapability: Object.freeze({ ...adapter.boundaryByCapability }) });
        this.#current.set(currentKey, frozen);
        this.#versions.set(adapterVersionKey(adapter.ownerId, adapter.key, adapter.version), frozen);
        return frozen;
    }
    route(ownerId, capability) {
        const candidates = [...this.#current.values()]
            .filter((adapter) => adapter.ownerId === ownerId && adapter.capabilities.includes(capability) && adapter.health !== "unavailable")
            .sort((left, right) => {
            const healthRank = (value) => value === "available" ? 0 : 1;
            return healthRank(left.health) - healthRank(right.health) || right.version - left.version || left.key.localeCompare(right.key);
        });
        const selected = candidates[0];
        if (!selected)
            return null;
        return Object.freeze({ providerKey: selected.key, providerVersion: selected.version, capability, boundary: selected.boundaryByCapability[capability], health: selected.health, implementationRef: selected.implementationRef, evidenceRefs: selected.evidenceRefs });
    }
    requireExact(ownerId, key, version) {
        const adapter = this.#versions.get(adapterVersionKey(ownerId, key, version));
        if (!adapter)
            throw new Error("exact publishing provider adapter version is unavailable");
        return adapter;
    }
}
export function assertPublishingBoundaryTruth(route, actualEnvironment) {
    if (route.boundary === "work_required" && actualEnvironment !== "work")
        throw new Error("publishing capability truthfully requires Work/account browser execution");
    if (route.boundary === "owner_only" && actualEnvironment !== "owner_browser")
        throw new Error("publishing capability truthfully requires owner-only account/browser action");
    if (route.boundary === "normal_chat" && actualEnvironment !== "normal_chat")
        throw new Error("normal-chat publishing capability should not be escalated to another execution environment");
}
//# sourceMappingURL=providers.js.map