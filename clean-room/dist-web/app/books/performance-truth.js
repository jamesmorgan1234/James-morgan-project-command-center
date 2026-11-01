function t(v) { const n = Date.parse(v); if (!Number.isFinite(n))
    throw new Error("book metric timestamps must be ISO-compatible"); return n; }
export function validateBookPerformanceRecord(r) { if (!r.id.trim() || !r.ownerId.trim() || !r.projectId.trim() || !r.bookId.trim() || !r.edition.trim() || !r.format.trim() || !r.providerKey.trim() || !r.marketplace.trim() || !r.source.trim() || !r.providerRecordRef.trim())
    throw new Error("book metric exact identity/source required"); if (r.value !== null && (!Number.isFinite(r.value) || r.value < 0))
    throw new Error("book metric value must be null unknown or nonnegative"); if (t(r.periodEnd) < t(r.periodStart) || t(r.observedAt) < t(r.periodEnd) || t(r.sourceDate) > t(r.observedAt))
    throw new Error("book metric timestamp ordering invalid"); if (!Array.isArray(r.sourceRefs) || r.sourceRefs.length === 0 || r.sourceRefs.some(x => !x.trim()))
    throw new Error("book metric evidence required"); if (r.metric === "royalties" && !r.currency?.trim())
    throw new Error("royalties require currency"); if (r.truth === "settled" && !r.settlementRef?.trim())
    throw new Error("settled metrics require settlement evidence"); return Object.freeze({ ...r, sourceRefs: Object.freeze([...r.sourceRefs]) }); }
export function reconcileBookPerformanceRecords(records) { const ids = new Map(), external = new Map(); for (const input of records) {
    const r = validateBookPerformanceRecord(input);
    const prior = ids.get(r.id);
    if (prior) {
        if (JSON.stringify(prior) !== JSON.stringify(r))
            throw new Error("duplicate metric id has conflicting evidence");
        continue;
    }
    const dedupe = `${r.ownerId}:${r.providerKey}:${r.marketplace}:${r.providerRecordRef}:${r.metric}:${r.truth}`;
    const other = external.get(dedupe);
    if (other && other !== r.id)
        throw new Error("duplicate provider metric record would double count performance");
    external.set(dedupe, r.id);
    ids.set(r.id, r);
} return Object.freeze([...ids.values()]); }
export function verifiedMetricZero(r) { return validateBookPerformanceRecord(r).value === 0; }
export function metricValueOrUnknown(r) { return validateBookPerformanceRecord(r).value; }
//# sourceMappingURL=performance-truth.js.map