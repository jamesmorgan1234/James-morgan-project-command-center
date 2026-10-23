export interface RouteDefinition {
  readonly key: string;
  readonly path: string;
  readonly title: string;
  readonly moduleKey: string;
  readonly scrollOwner: "shell";
  readonly backBehavior: "history" | "home" | "none";
}

export interface ResolvedRoute {
  readonly route: RouteDefinition;
  readonly params: Readonly<Record<string, string>>;
}

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
      params[key] = decodeURIComponent(actual);
      continue;
    }
    if (expected !== actual) return undefined;
  }
  return Object.freeze(params);
}

export class RouteRegistry {
  readonly #byKey = new Map<string, RouteDefinition>();
  readonly #byPath = new Map<string, RouteDefinition>();

  register(route: RouteDefinition): void {
    if (!route.key.startsWith("route:")) throw new Error(`Route key must start with route:: ${route.key}`);
    if (!route.path.startsWith("/")) throw new Error(`Route path must start with /: ${route.path}`);
    if (!route.title.trim() || !route.moduleKey.trim()) throw new Error("Route title and moduleKey are required");
    if (this.#byKey.has(route.key)) throw new Error(`Duplicate route key: ${route.key}`);
    if (this.#byPath.has(route.path)) throw new Error(`Duplicate route path: ${route.path}`);
    const frozen = Object.freeze({ ...route });
    this.#byKey.set(route.key, frozen);
    this.#byPath.set(route.path, frozen);
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

  get(key: string): RouteDefinition | undefined { return this.#byKey.get(key); }
  list(): readonly RouteDefinition[] { return Object.freeze([...this.#byKey.values()]); }
}

function route(key: string, path: string, title: string, moduleKey: string, backBehavior: RouteDefinition["backBehavior"] = "history"): RouteDefinition {
  return { key, path, title, moduleKey, scrollOwner: "shell", backBehavior };
}

export function createCoreRouteRegistry(): RouteRegistry {
  const routes = new RouteRegistry();
  routes.register(route("route:home", "/", "Command Center", "module:home", "none"));
  routes.register(route("route:projects", "/projects", "Projects", "module:projects"));
  routes.register(route("route:active-live", "/active", "Active / Live", "module:projects"));
  routes.register(route("route:next-up", "/next-up", "Next Up", "module:projects"));
  routes.register(route("route:project-detail", "/project/:projectId", "Project Details", "module:projects"));
  routes.register(route("route:brain", "/brain", "Brain", "module:brain"));
  routes.register(route("route:agency", "/agency", "Agency", "module:agency"));
  routes.register(route("route:needs-me", "/needs-me", "Needs Me", "module:needs-me"));
  routes.register(route("route:search", "/search", "Search", "module:search"));
  routes.register(route("route:automations", "/automations", "Automations", "module:automations"));
  routes.register(route("route:personal", "/personal", "Personal", "module:personal"));
  routes.register(route("route:finance", "/finance", "Finance", "module:finance"));
  routes.register(route("route:social", "/social", "Social & Communications", "module:social"));
  routes.register(route("route:books", "/books", "Books", "module:books"));
  routes.register(route("route:specialists", "/specialists", "Specialists", "module:specialists"));
  routes.register(route("route:analytics", "/analytics", "Analytics", "module:analytics"));
  routes.register(route("route:settings", "/settings", "Settings", "module:settings"));
  routes.register(route("route:settings-security", "/settings/security", "Security", "module:settings"));
  routes.register(route("route:settings-devices", "/settings/devices", "Devices", "module:settings"));
  return routes;
}
