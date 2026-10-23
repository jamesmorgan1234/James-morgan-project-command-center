export interface RouteDefinition {
  readonly key: string;
  readonly path: string;
  readonly title: string;
  readonly moduleKey: string;
  readonly scrollOwner: "shell";
  readonly backBehavior: "history" | "home" | "none";
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

  resolvePath(path: string): RouteDefinition | undefined { return this.#byPath.get(path); }
  get(key: string): RouteDefinition | undefined { return this.#byKey.get(key); }
  list(): readonly RouteDefinition[] { return Object.freeze([...this.#byKey.values()]); }
}

export function createCoreRouteRegistry(): RouteRegistry {
  const routes = new RouteRegistry();
  routes.register({ key: "route:home", path: "/", title: "Command Center", moduleKey: "module:home", scrollOwner: "shell", backBehavior: "none" });
  routes.register({ key: "route:projects", path: "/projects", title: "Projects", moduleKey: "module:projects", scrollOwner: "shell", backBehavior: "history" });
  routes.register({ key: "route:active-live", path: "/active", title: "Active / Live", moduleKey: "module:projects", scrollOwner: "shell", backBehavior: "history" });
  routes.register({ key: "route:next-up", path: "/next-up", title: "Next Up", moduleKey: "module:projects", scrollOwner: "shell", backBehavior: "history" });
  routes.register({ key: "route:project-detail", path: "/project/:projectId", title: "Project Details", moduleKey: "module:projects", scrollOwner: "shell", backBehavior: "history" });
  return routes;
}
