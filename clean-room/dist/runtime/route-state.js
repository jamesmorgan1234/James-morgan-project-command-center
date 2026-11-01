export const EXPLICIT_BROWSER_ROUTE_KINDS = Object.freeze({
    "route:home": "home",
    "route:projects": "projects",
    "route:active-live": "active-live",
    "route:next-up": "next-up",
    "route:project-detail": "project-detail",
    "route:brain": "brain",
    "route:agency": "agency",
    "route:needs-me": "needs-me",
    "route:search": "search",
    "route:automations": "automations",
    "route:personal": "personal",
    "route:finance": "finance",
    "route:social": "social",
    "route:books": "books",
    "route:specialists": "specialists",
    "route:analytics": "analytics",
    "route:settings": "settings",
    "route:settings-security": "settings-security",
    "route:settings-devices": "settings-devices"
});
function safeDisplayPath(path) {
    const withoutQuery = path.split(/[?#]/, 1)[0] ?? "/";
    if (!withoutQuery)
        return "/";
    return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}
export function listExplicitBrowserRouteKeys() {
    return Object.freeze(Object.keys(EXPLICIT_BROWSER_ROUTE_KINDS));
}
export function resolveBrowserRoute(routes, path) {
    const displayPath = safeDisplayPath(path);
    let resolved;
    try {
        resolved = routes.resolve(path);
    }
    catch {
        return Object.freeze({ state: "unknown", path: displayPath });
    }
    if (!resolved)
        return Object.freeze({ state: "unknown", path: displayPath });
    const routeKey = resolved.route.key;
    const kind = EXPLICIT_BROWSER_ROUTE_KINDS[routeKey];
    if (!kind)
        return Object.freeze({ state: "unmapped-known", path: displayPath, routeKey: resolved.route.key });
    return Object.freeze({ state: "known", kind, resolved });
}
//# sourceMappingURL=route-state.js.map