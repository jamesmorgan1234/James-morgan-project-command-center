export class Registry {
    #records = new Map();
    register(record) {
        if (this.#records.has(record.key))
            throw new Error(`Registry key already exists: ${record.key}`);
        if (!Number.isSafeInteger(record.version) || record.version < 1)
            throw new Error(`Registry version must be a positive safe integer for ${record.key}`);
        this.#records.set(record.key, Object.freeze({ ...record }));
    }
    replace(record, expectedVersion) {
        const current = this.#records.get(record.key);
        if (!current)
            throw new Error(`Registry key does not exist: ${record.key}`);
        if (current.version !== expectedVersion)
            throw new Error(`Registry version conflict for ${record.key}: expected ${expectedVersion}, current ${current.version}`);
        if (!Number.isSafeInteger(record.version) || record.version < 1)
            throw new Error(`Registry version must be a positive safe integer for ${record.key}`);
        if (record.version <= current.version)
            throw new Error(`Replacement version must advance for ${record.key}`);
        this.#records.set(record.key, Object.freeze({ ...record }));
    }
    remove(key, expectedVersion) {
        const current = this.#records.get(key);
        if (!current)
            throw new Error(`Registry key does not exist: ${key}`);
        if (current.version !== expectedVersion)
            throw new Error(`Registry version conflict for ${key}: expected ${expectedVersion}, current ${current.version}`);
        this.#records.delete(key);
        return current;
    }
    get(key) { return this.#records.get(key); }
    list() { return Object.freeze([...this.#records.values()]); }
    get size() { return this.#records.size; }
}
//# sourceMappingURL=registry.js.map