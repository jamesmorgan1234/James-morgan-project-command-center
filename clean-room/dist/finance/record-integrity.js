/**
 * Record integrity: revenue only from verified evidence, no sample data in
 * live records, protected screenshot references, and bounded text and counts.
 */
export function deriveRevenue(entries) {
    if (entries.length === 0)
        throw new Error("Revenue requires financial evidence");
    const currency = entries[0]?.currency;
    let total = 0;
    for (const entry of entries) {
        if (!entry.verified)
            throw new Error("Revenue must derive from verified financial evidence");
        if (entry.currency !== currency)
            throw new Error("Revenue evidence must share one currency");
        if (!Number.isFinite(entry.amount) || entry.amount < 0)
            throw new Error("Revenue amounts must be nonnegative");
        total += entry.amount;
    }
    return Object.freeze({ total: Math.round(total * 100) / 100, currency: currency });
}
export function assertNoSampleData(records) {
    for (const record of records) {
        if (record.source !== "live")
            throw new Error("Sample or screenshot data cannot enter live records");
    }
}
export function screenshotReference(storageKey) {
    if (!/^evidence\/screenshots\/[a-z0-9-]+\.(png|webp)$/.test(storageKey)) {
        throw new Error("Screenshot references must be protected storage keys");
    }
    return Object.freeze({ storageKey });
}
export function projectDisplayName(name, limit = 48) {
    if (!name.trim())
        throw new Error("A project requires a name");
    if (!Number.isSafeInteger(limit) || limit < 4)
        throw new Error("A display limit must be at least four characters");
    if (name.length <= limit)
        return Object.freeze({ display: name, full: name });
    return Object.freeze({ display: `${name.slice(0, limit - 1)}…`, full: name });
}
export function blockerText(text, limit = 160) {
    if (!text.trim())
        throw new Error("A blocker requires text");
    return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}
export function assertProjectCountSupported(count, pageSize = 50) {
    if (!Number.isSafeInteger(count) || count < 0)
        throw new Error("A project count must be a nonnegative integer");
    if (pageSize < 1)
        throw new Error("A page size must be positive");
    if (count > 10000)
        throw new Error("Large project counts require paging, not a full render");
}
//# sourceMappingURL=record-integrity.js.map