import { known } from "../data/canonical.js";
import { connectionIsLive } from "../social/connections.js";
function evidence(options) {
    return Object.freeze([Object.freeze({ source: options.sourceRef, observedAt: options.observedAt })]);
}
function reader(key, label, read) {
    return Object.freeze({ key, label, read });
}
export function createStandardSurfaceReaders(options) {
    if (!options.sourceRef.trim() || !Number.isFinite(Date.parse(options.observedAt)))
        throw new Error("surface reader provenance and observedAt are required");
    const refs = evidence(options);
    const readers = [];
    if (options.brainRoutes)
        readers.push(reader("brain", "Brain", () => {
            const routes = options.brainRoutes.list();
            const enabledHealthy = routes.filter((route) => route.enabled && route.health !== "unavailable" && route.quotaAvailable !== false);
            const freeHealthy = enabledHealthy.filter((route) => route.cost === "free");
            return Object.freeze({ availability: enabledHealthy.length > 0 ? "available" : "unavailable", summary: known(`${routes.length} AI route${routes.length === 1 ? "" : "s"} registered; ${enabledHealthy.length} enabled/healthy; ${freeHealthy.length} enabled/healthy free.`), evidence: refs });
        }));
    if (options.agencyExecutors || options.agencyScheduler)
        readers.push(reader("agency", "Agency", () => {
            const executors = options.agencyExecutors?.list() ?? [];
            const usable = executors.filter((executor) => executor.enabled && executor.health !== "unavailable");
            const leadership = options.agencyScheduler?.current();
            const leadershipCurrent = leadership !== undefined && Date.parse(leadership.expiresAt) > Date.parse(options.observedAt);
            return Object.freeze({ availability: usable.length > 0 ? "available" : "unavailable", summary: known(`${executors.length} executor${executors.length === 1 ? "" : "s"} registered; ${usable.length} enabled and not unavailable; current scheduler leadership record: ${leadershipCurrent ? "yes" : "no"}. This does not assert any worker is actively executing.`), evidence: refs });
        }));
    if (options.financeProviders)
        readers.push(reader("finance", "Finance", () => {
            const providers = options.financeProviders.list();
            const connected = providers.filter((provider) => provider.enabled && provider.connectionState === "connected" && provider.consentState === "granted" && provider.health !== "unavailable");
            const availability = connected.length > 0 ? "available" : providers.length > 0 ? "disconnected" : "unavailable";
            return Object.freeze({ availability, summary: known(`${providers.length} financial provider${providers.length === 1 ? "" : "s"} registered; ${connected.length} connected with granted consent and non-unavailable health. No balance is implied by provider connectivity.`), evidence: refs });
        }));
    if (options.books)
        readers.push(reader("books", "Books", () => {
            const books = options.books.list();
            return Object.freeze({ availability: "available", summary: known(`${books.length} canonical book record${books.length === 1 ? "" : "s"} registered.`), evidence: refs });
        }));
    if (options.specialists)
        readers.push(reader("specialists", "Specialists", () => {
            const profiles = options.specialists.list();
            return Object.freeze({ availability: "available", summary: known(`${profiles.length} specialist project profile${profiles.length === 1 ? "" : "s"} registered.`), evidence: refs });
        }));
    if (options.analyticsMetrics)
        readers.push(reader("analytics", "Analytics", () => {
            const definitions = options.analyticsMetrics.list();
            return Object.freeze({ availability: "available", summary: known(`${definitions.length} metric definition${definitions.length === 1 ? "" : "s"} registered. This does not assert current metric values.`), evidence: refs });
        }));
    if (options.socialProfiles || options.socialConnections)
        readers.push(reader("social", "Social & Communications", () => {
            const profiles = options.socialProfiles?.list() ?? [];
            const connections = options.socialConnections ?? [];
            const now = (options.now ?? (() => new Date().toISOString()))();
            const liveConnections = options.socialRequiredScopes?.length ? connections.filter((connection) => connectionIsLive(connection, options.socialRequiredScopes, now)) : [];
            const availability = liveConnections.length > 0 ? "available" : connections.length > 0 || profiles.length > 0 ? "disconnected" : "unavailable";
            return Object.freeze({ availability, summary: known(`${profiles.length} platform compliance profile${profiles.length === 1 ? "" : "s"} registered; ${connections.length} account connection record${connections.length === 1 ? "" : "s"}; ${liveConnections.length} currently live by connection evidence.`), evidence: refs });
        }));
    return Object.freeze(readers);
}
//# sourceMappingURL=surface-readers.js.map