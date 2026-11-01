function assertCount(label, value) {
    if (!Number.isSafeInteger(value) || value < 0)
        throw new Error(`${label} must be a non-negative safe integer`);
}
function assertRefs(label, values) {
    if (values.some((value) => !value.trim()) || new Set(values).size !== values.length)
        throw new Error(`${label} must contain unique nonblank references`);
    return Object.freeze([...values]);
}
export function homeDiagnosticSummary(input) {
    assertCount("activeProjectCount", input.activeProjectCount);
    assertCount("blockedProjectCount", input.blockedProjectCount);
    assertCount("pendingApprovalCount", input.pendingApprovalCount);
    assertCount("pendingObligationCount", input.pendingObligationCount);
    if (!input.diagnosticRoute.startsWith("/"))
        throw new Error("Home diagnostic summary requires a local diagnostic route");
    if (!Number.isFinite(Date.parse(input.freshnessObservedAt)))
        throw new Error("Home diagnostic summary requires freshness metadata");
    if (input.setupRoute !== undefined && !input.setupRoute.startsWith("/"))
        throw new Error("Home setup route must be local");
    if (input.recoveryRoute !== undefined && !input.recoveryRoute.startsWith("/"))
        throw new Error("Home recovery route must be local");
    return Object.freeze({
        systemHealth: input.systemHealth,
        connectionHealth: input.connectionHealth,
        knowledgeFreshness: input.knowledgeFreshness,
        activeProjectCount: input.activeProjectCount,
        blockedProjectCount: input.blockedProjectCount,
        pendingApprovalCount: input.pendingApprovalCount,
        pendingObligationCount: input.pendingObligationCount,
        recentAuditEntryRefs: assertRefs("recentAuditEntryRefs", input.recentAuditEntryRefs),
        quickActionRefs: assertRefs("quickActionRefs", input.quickActionRefs),
        diagnosticRoute: input.diagnosticRoute,
        freshnessObservedAt: input.freshnessObservedAt,
        ...(input.setupRoute !== undefined ? { setupRoute: input.setupRoute } : {}),
        ...(input.recoveryRoute !== undefined ? { recoveryRoute: input.recoveryRoute } : {}),
        availableOffline: true,
        quickActionsRequireAuthority: true
    });
}
const HOME_GRID_EXTENSIONS = new Map();
function assertModule(module) {
    if (!module.key.trim() || !module.title.trim() || !module.route.startsWith("/") || !module.supportingText.trim())
        throw new Error(`Invalid Home module: ${module.key || "<blank>"}`);
    if (module.verifiedCount !== undefined && (!Number.isSafeInteger(module.verifiedCount) || module.verifiedCount < 0))
        throw new Error(`Home verifiedCount must be non-negative: ${module.key}`);
}
export function registerHomeGridExtension(module) {
    assertModule(module);
    if (HOME_GRID_EXTENSIONS.has(module.key))
        throw new Error(`Duplicate Home grid extension: ${module.key}`);
    HOME_GRID_EXTENSIONS.set(module.key, Object.freeze({ ...module }));
    let removed = false;
    return () => {
        if (removed)
            return;
        removed = true;
        HOME_GRID_EXTENSIONS.delete(module.key);
    };
}
export function listHomeGridExtensions() {
    return Object.freeze([...HOME_GRID_EXTENSIONS.values()]);
}
export function createHomeGrid(modules) {
    const combined = [...modules, ...listHomeGridExtensions()];
    const seen = new Set();
    for (const module of combined) {
        assertModule(module);
        if (seen.has(module.key))
            throw new Error(`Duplicate Home primary module: ${module.key}`);
        seen.add(module.key);
    }
    return Object.freeze({ columns: 1, equalCardHeight: true, modules: Object.freeze(combined) });
}
export class HomeModuleRegistry {
    #modules = new Map();
    register(registration) {
        const probe = {
            key: registration.key,
            title: registration.title,
            route: registration.route,
            supportingText: "registration-probe"
        };
        assertModule(probe);
        if (this.#modules.has(registration.key))
            throw new Error(`Duplicate Home module registration: ${registration.key}`);
        this.#modules.set(registration.key, Object.freeze({ ...registration }));
    }
    remove(key) {
        const current = this.#modules.get(key);
        if (current)
            this.#modules.delete(key);
        return current;
    }
    list() {
        return Object.freeze([...this.#modules.values()]);
    }
    build(context) {
        const modules = this.list().map((registration) => {
            const resolved = registration.resolve(context);
            return Object.freeze({
                key: registration.key,
                title: registration.title,
                route: registration.route,
                ...resolved
            });
        });
        return createHomeGrid(modules);
    }
}
//# sourceMappingURL=home.js.map