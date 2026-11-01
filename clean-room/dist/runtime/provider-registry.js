function normalizedProviderId(id) {
    const normalized = id.trim();
    if (!normalized)
        throw new Error("Runtime provider id is required");
    if (normalized !== id)
        throw new Error("Runtime provider id must not contain surrounding whitespace");
    return normalized;
}
export class RuntimeSnapshotProviderRegistry {
    #providers = new Map();
    install(provider) {
        const id = normalizedProviderId(provider.id);
        if (typeof provider.load !== "function")
            throw new Error(`Runtime provider load() is required: ${id}`);
        if (this.#providers.has(id))
            throw new Error(`Runtime provider already installed: ${id}`);
        this.#providers.set(id, provider);
    }
    register(provider) { this.install(provider); }
    remove(id) {
        const key = normalizedProviderId(id);
        const provider = this.#providers.get(key);
        if (!provider)
            throw new Error(`Unknown runtime provider: ${key}`);
        this.#providers.delete(key);
        return provider;
    }
    uninstall(id) { return this.remove(id); }
    get(id) { return this.#providers.get(id); }
    list() { return Object.freeze([...this.#providers.values()]); }
    get size() { return this.#providers.size; }
}
//# sourceMappingURL=provider-registry.js.map