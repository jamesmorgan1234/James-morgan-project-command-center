export interface RouteDefinition {
  readonly key: string;
  readonly path: string;
  readonly title: string;
  readonly moduleKey: string;
  readonly scrollOwner: "shell";
  readonly backBehavior: "history" | "home" | "none";
  readonly offlineCapable?: boolean;
  readonly protectedEditGuard?: boolean;
}

export interface ResolvedRoute {
  readonly route: RouteDefinition;
  readonly params: Readonly<Record<string, string>>;
}

export interface RouteNavigationState {
  readonly routeKey: string;
  readonly path: string;
  readonly query: string;
  readonly selectedProjectId?: string;
  readonly selectedEntityId?: string;
  readonly hasProtectedUnsavedEdits: boolean;
}

export type RouteTransitionDecision = "allow" | "require_commit_or_discard" | "missing_target";

function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? "/";
  if (!withoutQuery.startsWith("/")) return `/${withoutQuery}`;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) return withoutQuery.slice(0, -1);
  return withoutQuery;
}

function matchRoute(pattern: string, input: string): Readonly<Record<string, string>> | undefined {
  const patternParts = normalizePath(pattern).split("/").filter(Boolean);
  const inputParts = normalizePath(input).split("/").filter(Boolean);
  if (patternParts.length !== inputParts.length) return undefined;
  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = inputParts[index];
    if (expected === undefined || actual === undefined) return undefined;
    if (expected.startsWith(":")) {
      const key = expected.slice(1);
      if (!key || !actual) return undefined;
      try {
        params[key] = decodeURIComponent(actual);
      } catch {
        return undefined;
      }
      continue;
    }
    if (expected !== actual) return undefined;
  }
  return Object.freeze(params);
}

function routePatternIdentity(path: string): string {
  return path.split("/").map((part) => part.startsWith(":") ? ":" : part).join("/");
}

export class RouteRegistry {
  readonly #byKey = new Map<string, RouteDefinition>();
  readonly #byPath = new Map<string, RouteDefinition>();

  register(route: RouteDefinition): void {
    if (!route.key.startsWith("route:") || !route.key.slice("route:".length).trim()) throw new Error(`Route key must start with route:: ${route.key}`);
    if (!route.path.startsWith("/")) throw new Error(`Route path must start with /: ${route.path}`);
    if (!route.title.trim() || !route.moduleKey.trim()) throw new Error("Route title and moduleKey are required");
    if (route.scrollOwner !== "shell" || !["history", "home", "none"].includes(route.backBehavior)) throw new Error("Invalid route scroll owner or back behavior");
    if (/[?#\s]/.test(route.path) || route.path.includes("//")) throw new Error("Route declarations require canonical local path patterns");
    const canonicalPath = normalizePath(route.path);
    const parameters = canonicalPath.split("/").filter((part) => part.startsWith(":")).map((part) => part.slice(1));
    if (parameters.some((name) => !name || ["__proto__", "constructor", "prototype"].includes(name)) || new Set(parameters).size !== parameters.length) throw new Error("Route parameters must be nonempty unique safe names");
    if (this.#byKey.has(route.key)) throw new Error(`Duplicate route key: ${route.key}`);
    if (this.#byPath.has(canonicalPath)) throw new Error(`Duplicate route path: ${canonicalPath}`);
    if ([...this.#byKey.values()].some((existing) => routePatternIdentity(existing.path) === routePatternIdentity(canonicalPath))) throw new Error(`Duplicate route pattern: ${canonicalPath}`);
    const frozen = Object.freeze({ ...route, path: canonicalPath });
    this.#byKey.set(route.key, frozen);
    this.#byPath.set(canonicalPath, frozen);
  }

  remove(key: string): RouteDefinition {
    const route = this.#byKey.get(key);
    if (!route) throw new Error(`Unknown route: ${key}`);
    this.#byKey.delete(key);
    this.#byPath.delete(route.path);
    return route;
  }

  resolvePath(path: string): RouteDefinition | undefined { return this.resolve(path)?.route; }

  resolve(path: string): ResolvedRoute | undefined {
    const normalized = normalizePath(path);
    const exact = this.#byPath.get(normalized);
    if (exact) return Object.freeze({ route: exact, params: Object.freeze({}) });
    for (const route of this.#byKey.values()) {
      if (!route.path.includes(":")) continue;
      const params = matchRoute(route.path, normalized);
      if (params) return Object.freeze({ route, params });
    }
    return undefined;
  }

  transitionDecision(path: string, current?: Readonly<{ hasProtectedUnsavedEdits: boolean }>): RouteTransitionDecision {
    if (!this.resolve(path)) return "missing_target";
    if (current?.hasProtectedUnsavedEdits) return "require_commit_or_discard";
    return "allow";
  }

  get(key: string): RouteDefinition | undefined { return this.#byKey.get(key); }
  list(): readonly RouteDefinition[] { return Object.freeze([...this.#byKey.values()]); }
}

export function routeNavigationState(route: ResolvedRoute, search: string, hasProtectedUnsavedEdits = false): RouteNavigationState {
  const query = new URLSearchParams(search);
  const selectedProjectId = route.params.projectId ?? query.get("project") ?? undefined;
  const selectedEntityId = query.get("entity") ?? undefined;
  return Object.freeze({
    routeKey: route.route.key,
    path: route.route.path,
    query: query.toString(),
    ...(selectedProjectId ? { selectedProjectId } : {}),
    ...(selectedEntityId ? { selectedEntityId } : {}),
    hasProtectedUnsavedEdits
  });
}

function route(key: string, path: string, title: string, moduleKey: string, backBehavior: RouteDefinition["backBehavior"] = "history", options: Readonly<Pick<RouteDefinition, "offlineCapable" | "protectedEditGuard">> = {}): RouteDefinition {
  return { key, path, title, moduleKey, scrollOwner: "shell", backBehavior, ...options };
}

export function createCoreRouteRegistry(): RouteRegistry {
  const routes = new RouteRegistry();
  routes.register(route("route:home", "/", "Command Center", "module:home", "none", { offlineCapable: true }));
  routes.register(route("route:projects", "/projects", "Projects", "module:projects", "history", { offlineCapable: true }));
  routes.register(route("route:active-live", "/active", "Active / Live", "module:projects", "history", { offlineCapable: true }));
  routes.register(route("route:next-up", "/next-up", "Next Up", "module:projects", "history", { offlineCapable: true }));
  routes.register(route("route:project-detail", "/project/:projectId", "Project Details", "module:projects", "history", { offlineCapable: true, protectedEditGuard: true }));
  routes.register(route("route:brain", "/brain", "Brain", "module:brain", "history", { offlineCapable: true, protectedEditGuard: true }));
  routes.register(route("route:agency", "/agency", "Agency", "module:agency", "history", { offlineCapable: true, protectedEditGuard: true }));
  routes.register(route("route:needs-me", "/needs-me", "Needs Me", "module:needs-me", "history", { offlineCapable: true }));
  routes.register(route("route:search", "/search", "Search", "module:search", "history", { offlineCapable: true }));
  routes.register(route("route:automations", "/automations", "Automations", "module:automations", "history", { protectedEditGuard: true }));
  routes.register(route("route:personal", "/personal", "Personal", "module:personal", "history", { offlineCapable: true }));
  routes.register(route("route:finance", "/finance", "Finance", "module:finance", "history", { offlineCapable: true }));
  routes.register(route("route:social", "/social", "Social & Communications", "module:social", "history", { offlineCapable: true }));
  routes.register(route("route:books", "/books", "Books", "module:books", "history", { offlineCapable: true }));
  routes.register(route("route:specialists", "/specialists", "Specialists", "module:specialists", "history", { offlineCapable: true }));
  routes.register(route("route:analytics", "/analytics", "Analytics", "module:analytics", "history", { offlineCapable: true }));
  routes.register(route("route:settings", "/settings", "Settings", "module:settings", "history", { offlineCapable: true, protectedEditGuard: true }));
  routes.register(route("route:settings-security", "/settings/security", "Security", "module:settings", "history", { protectedEditGuard: true }));
  routes.register(route("route:settings-devices", "/settings/devices", "Devices", "module:settings", "history", { offlineCapable: true }));
  routes.register(route("route:offline", "/offline", "Offline", "module:offline", "home", { offlineCapable: true }));
  routes.register(route("route:ui-fixtures", "/__fixtures", "UI Fixtures", "module:fixtures", "home", { offlineCapable: true }));
  return routes;
}
