import type { ResolvedRoute, RouteRegistry } from "../ui/routes.js";
export declare const EXPLICIT_BROWSER_ROUTE_KINDS: Readonly<{
    readonly "route:home": "home";
    readonly "route:projects": "projects";
    readonly "route:active-live": "active-live";
    readonly "route:next-up": "next-up";
    readonly "route:project-detail": "project-detail";
    readonly "route:brain": "brain";
    readonly "route:agency": "agency";
    readonly "route:needs-me": "needs-me";
    readonly "route:search": "search";
    readonly "route:automations": "automations";
    readonly "route:personal": "personal";
    readonly "route:finance": "finance";
    readonly "route:social": "social";
    readonly "route:books": "books";
    readonly "route:specialists": "specialists";
    readonly "route:analytics": "analytics";
    readonly "route:settings": "settings";
    readonly "route:settings-security": "settings-security";
    readonly "route:settings-devices": "settings-devices";
}>;
export type BrowserRouteKind = typeof EXPLICIT_BROWSER_ROUTE_KINDS[keyof typeof EXPLICIT_BROWSER_ROUTE_KINDS];
export type BrowserRouteResolution = Readonly<{
    state: "known";
    kind: BrowserRouteKind;
    resolved: ResolvedRoute;
}> | Readonly<{
    state: "unmapped-known";
    path: string;
    routeKey: string;
}> | Readonly<{
    state: "unknown";
    path: string;
}>;
export declare function listExplicitBrowserRouteKeys(): readonly string[];
export declare function resolveBrowserRoute(routes: RouteRegistry, path: string): BrowserRouteResolution;
