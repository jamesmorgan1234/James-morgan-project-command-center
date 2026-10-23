import type { ResolvedRoute, RouteRegistry } from "../ui/routes.js";

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
} as const);

export type BrowserRouteKind = typeof EXPLICIT_BROWSER_ROUTE_KINDS[keyof typeof EXPLICIT_BROWSER_ROUTE_KINDS];

export type BrowserRouteResolution =
  | Readonly<{ state: "known"; kind: BrowserRouteKind; resolved: ResolvedRoute }>
  | Readonly<{ state: "unmapped-known"; path: string; routeKey: string }>
  | Readonly<{ state: "unknown"; path: string }>;

function safeDisplayPath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? "/";
  if (!withoutQuery) return "/";
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

export function listExplicitBrowserRouteKeys(): readonly string[] {
  return Object.freeze(Object.keys(EXPLICIT_BROWSER_ROUTE_KINDS));
}

export function resolveBrowserRoute(routes: RouteRegistry, path: string): BrowserRouteResolution {
  const displayPath = safeDisplayPath(path);
  let resolved: ResolvedRoute | undefined;
  try {
    resolved = routes.resolve(path);
  } catch {
    return Object.freeze({ state: "unknown" as const, path: displayPath });
  }
  if (!resolved) return Object.freeze({ state: "unknown" as const, path: displayPath });
  const routeKey = resolved.route.key as keyof typeof EXPLICIT_BROWSER_ROUTE_KINDS;
  const kind = EXPLICIT_BROWSER_ROUTE_KINDS[routeKey];
  if (!kind) return Object.freeze({ state: "unmapped-known" as const, path: displayPath, routeKey: resolved.route.key });
  return Object.freeze({ state: "known" as const, kind, resolved });
}
