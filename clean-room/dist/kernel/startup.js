/**
 * Application startup.
 *
 * Single scroll-restoration owner, single global state coordinator, single
 * error boundary hierarchy, explicit startup and session state machines,
 * application readiness, core versus optional modules, deterministic ordering,
 * timeout handling, stuck-loading refusal, Safe Mode and deep links.
 */
function exactlyOne(kind, owners) {
    if (owners.length !== 1)
        throw new Error(`Exactly one ${kind} is required`);
    const owner = owners[0];
    if (owner === undefined || !owner.trim())
        throw new Error(`${kind} must be named`);
    return owner;
}
export function scrollRestorationOwner(owners) {
    return exactlyOne("scroll-restoration owner", owners);
}
export function globalStateCoordinator(coordinators) {
    return exactlyOne("global application-state coordinator", coordinators);
}
export function errorBoundaryRoot(roots) {
    return exactlyOne("error boundary hierarchy", roots);
}
const STARTUP_TRANSITIONS = Object.freeze({
    idle: { start: "starting" },
    starting: { core_ready: "ready", core_failed: "failed", optional_failed: "starting" },
    ready: { reset: "idle" },
    failed: { reset: "idle" },
    safe_mode: { reset: "idle" }
});
export function startupTransition(state, event) {
    const next = STARTUP_TRANSITIONS[state][event];
    if (next === undefined)
        throw new Error(`Invalid startup transition: ${state} + ${event}`);
    return next;
}
const SESSION_TRANSITIONS = Object.freeze({
    anonymous: { authenticate: "authenticating" },
    authenticating: { success: "authenticated", failure: "failed" },
    authenticated: { sign_out: "signed_out" },
    signed_out: { reset: "anonymous", authenticate: "authenticating" },
    failed: { reset: "anonymous" }
});
export function sessionTransition(state, event) {
    const next = SESSION_TRANSITIONS[state][event];
    if (next === undefined)
        throw new Error(`Invalid session transition: ${state} + ${event}`);
    return next;
}
export function applicationReady(coreStates) {
    const values = Object.values(coreStates);
    return values.length > 0 && values.every((state) => state === "ready");
}
export function classifyModule(module) {
    return module.core ? "core" : "optional";
}
function assertDefinitions(definitions) {
    if (definitions.length === 0)
        throw new Error("Startup requires module definitions");
    const keys = new Set();
    const orders = new Set();
    for (const definition of definitions) {
        if (!definition.key.trim())
            throw new Error("A module requires a key");
        if (keys.has(definition.key))
            throw new Error(`Duplicate module: ${definition.key}`);
        if (orders.has(definition.order))
            throw new Error(`Duplicate startup order: ${definition.order}`);
        keys.add(definition.key);
        orders.add(definition.order);
    }
}
export function startupOrder(definitions) {
    assertDefinitions(definitions);
    return Object.freeze([...definitions].sort((a, b) => a.order - b.order).map((definition) => definition.key));
}
export function runStartup(definitions, safeMode = false) {
    assertDefinitions(definitions);
    const ordered = [...definitions].sort((a, b) => a.order - b.order);
    const started = [];
    const skipped = [];
    for (const definition of ordered) {
        if (safeMode && !definition.core) {
            skipped.push(definition.key);
            continue;
        }
        const outcome = definition.start();
        if (outcome === "ready")
            started.push(definition.key);
        else if (definition.core)
            return Object.freeze({ state: "failed", started: Object.freeze(started), skipped: Object.freeze(skipped), failedCore: definition.key });
        else
            skipped.push(definition.key);
    }
    return Object.freeze({ state: safeMode ? "safe_mode" : "ready", started: Object.freeze(started), skipped: Object.freeze(skipped), failedCore: null });
}
export async function startModuleWithin(operation, timeoutMs) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1)
        throw new Error("Startup timeout must be a positive integer");
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Startup timed out")), timeoutMs);
    });
    try {
        return await Promise.race([operation, timeout]);
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
export function assertNotStuckLoading(startedAt, now, limitMs) {
    const start = Date.parse(startedAt);
    const current = Date.parse(now);
    if (Number.isNaN(start) || Number.isNaN(current))
        throw new Error("Loading timestamps must be valid");
    if (current - start > limitMs)
        throw new Error("Application must not remain in an infinite loading state");
}
export function parseDeepLink(url) {
    if (!url.startsWith("/") || url.includes("://"))
        throw new Error("A deep link must be an application-relative path");
    const [path, query = ""] = url.split("?");
    if (path === undefined || !path.trim())
        throw new Error("A deep link requires a path");
    const params = {};
    for (const pair of query.split("&").filter(Boolean)) {
        const [key, value = ""] = pair.split("=");
        if (key !== undefined && key.trim())
            params[key] = value;
    }
    return Object.freeze({ path, params: Object.freeze(params) });
}
//# sourceMappingURL=startup.js.map