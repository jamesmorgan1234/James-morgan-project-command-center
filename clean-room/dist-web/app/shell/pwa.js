/** PWA lifecycle: manifest identity, scope, freshness, offline separation, updates and health. */
export function manifestId(id) {
    if (!id.startsWith("/"))
        throw new Error("A manifest ID must be an application-relative path");
    return id;
}
export function scopeStrategy(scope, startUrl) {
    if (!scope.startsWith("/") || !startUrl.startsWith(scope))
        throw new Error("Start URL must fall within the stable scope");
    return Object.freeze({ scope, startUrl });
}
export function staleDataIndicator(lastSync, now, maxAgeMs) {
    const last = Date.parse(lastSync);
    const current = Date.parse(now);
    if (Number.isNaN(last) || Number.isNaN(current) || current < last)
        throw new Error("Sync timestamps must be valid and ordered");
    const ageMs = current - last;
    return Object.freeze({ stale: ageMs > maxAgeMs, ageMs });
}
export function offlineStateSeparated(state) {
    if (state !== "live" && state !== "offline")
        throw new Error("State must be live or offline");
    return state;
}
export function updateFailureHandling(attempt) {
    if (!Number.isSafeInteger(attempt) || attempt < 1)
        throw new Error("An update attempt must be a positive integer");
    if (attempt > 3)
        throw new Error("Update retries exceeded");
    return attempt < 3 ? "retry" : "manual";
}
export function detectStaleClient(clientBuild, serverBuild) {
    if (!clientBuild.trim() || !serverBuild.trim())
        throw new Error("Build identifiers are required");
    return clientBuild === serverBuild ? "current" : "stale";
}
export function healthDiagnostics(record) {
    if (!record.cache.trim())
        throw new Error("Health diagnostics require a cache state");
    return Object.freeze({ healthy: record.manifest && record.serviceWorker, cache: record.cache });
}
export function blackSystemSurface(color) {
    if (color.toLowerCase() !== "#000000")
        throw new Error("Android system surfaces must be black");
    return "#000000";
}
//# sourceMappingURL=pwa.js.map