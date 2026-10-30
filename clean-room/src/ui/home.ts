import type { ProgressDisplay, SemanticStatus } from "./progress.js";

export type HomePrimaryModuleKey = string;

export interface HomePrimaryModule {
  readonly key: HomePrimaryModuleKey;
  readonly title: string;
  readonly route: string;
  readonly status?: SemanticStatus;
  readonly progress?: ProgressDisplay;
  readonly verifiedCount?: number | undefined;
  readonly supportingText: string;
}

export interface HomeModuleRegistration<TContext> {
  readonly key: HomePrimaryModuleKey;
  readonly title: string;
  readonly route: string;
  resolve(context: TContext): Readonly<Pick<HomePrimaryModule, "supportingText" | "verifiedCount" | "status" | "progress">>;
}

export interface HomeModuleGridContract {
  readonly columns: 1;
  readonly equalCardHeight: true;
  readonly modules: readonly HomePrimaryModule[];
}

export type HomeHealthState = "healthy" | "degraded" | "blocked" | "unknown";

export interface HomeDiagnosticSummary {
  readonly systemHealth: HomeHealthState;
  readonly connectionHealth: HomeHealthState;
  readonly knowledgeFreshness: HomeHealthState;
  readonly activeProjectCount: number;
  readonly blockedProjectCount: number;
  readonly pendingApprovalCount: number;
  readonly pendingObligationCount: number;
  readonly recentAuditEntryRefs: readonly string[];
  readonly quickActionRefs: readonly string[];
  readonly diagnosticRoute: string;
  readonly freshnessObservedAt: string;
  readonly setupRoute?: string;
  readonly recoveryRoute?: string;
  readonly availableOffline: true;
  readonly quickActionsRequireAuthority: true;
}

function assertCount(label: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer`);
}

function assertRefs(label: string, values: readonly string[]): readonly string[] {
  if (values.some((value) => !value.trim()) || new Set(values).size !== values.length) throw new Error(`${label} must contain unique nonblank references`);
  return Object.freeze([...values]);
}

export function homeDiagnosticSummary(input: Readonly<Omit<HomeDiagnosticSummary, "availableOffline" | "quickActionsRequireAuthority">>): HomeDiagnosticSummary {
  assertCount("activeProjectCount", input.activeProjectCount);
  assertCount("blockedProjectCount", input.blockedProjectCount);
  assertCount("pendingApprovalCount", input.pendingApprovalCount);
  assertCount("pendingObligationCount", input.pendingObligationCount);
  if (!input.diagnosticRoute.startsWith("/")) throw new Error("Home diagnostic summary requires a local diagnostic route");
  if (!Number.isFinite(Date.parse(input.freshnessObservedAt))) throw new Error("Home diagnostic summary requires freshness metadata");
  if (input.setupRoute !== undefined && !input.setupRoute.startsWith("/")) throw new Error("Home setup route must be local");
  if (input.recoveryRoute !== undefined && !input.recoveryRoute.startsWith("/")) throw new Error("Home recovery route must be local");
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

const HOME_GRID_EXTENSIONS = new Map<HomePrimaryModuleKey, HomePrimaryModule>();

function assertModule(module: HomePrimaryModule): void {
  if (!module.key.trim() || !module.title.trim() || !module.route.startsWith("/") || !module.supportingText.trim()) throw new Error(`Invalid Home module: ${module.key || "<blank>"}`);
  if (module.verifiedCount !== undefined && (!Number.isSafeInteger(module.verifiedCount) || module.verifiedCount < 0)) throw new Error(`Home verifiedCount must be non-negative: ${module.key}`);
}

export function registerHomeGridExtension(module: HomePrimaryModule): () => void {
  assertModule(module);
  if (HOME_GRID_EXTENSIONS.has(module.key)) throw new Error(`Duplicate Home grid extension: ${module.key}`);
  HOME_GRID_EXTENSIONS.set(module.key, Object.freeze({ ...module }));
  let removed = false;
  return () => {
    if (removed) return;
    removed = true;
    HOME_GRID_EXTENSIONS.delete(module.key);
  };
}

export function listHomeGridExtensions(): readonly HomePrimaryModule[] {
  return Object.freeze([...HOME_GRID_EXTENSIONS.values()]);
}

export function createHomeGrid(modules: readonly HomePrimaryModule[]): HomeModuleGridContract {
  const combined = [...modules, ...listHomeGridExtensions()];
  const seen = new Set<HomePrimaryModuleKey>();
  for (const module of combined) {
    assertModule(module);
    if (seen.has(module.key)) throw new Error(`Duplicate Home primary module: ${module.key}`);
    seen.add(module.key);
  }
  return Object.freeze({ columns: 1, equalCardHeight: true, modules: Object.freeze(combined) });
}

export class HomeModuleRegistry<TContext> {
  readonly #modules = new Map<HomePrimaryModuleKey, HomeModuleRegistration<TContext>>();

  register(registration: HomeModuleRegistration<TContext>): void {
    const probe: HomePrimaryModule = {
      key: registration.key,
      title: registration.title,
      route: registration.route,
      supportingText: "registration-probe"
    };
    assertModule(probe);
    if (this.#modules.has(registration.key)) throw new Error(`Duplicate Home module registration: ${registration.key}`);
    this.#modules.set(registration.key, Object.freeze({ ...registration }));
  }

  remove(key: HomePrimaryModuleKey): HomeModuleRegistration<TContext> | undefined {
    const current = this.#modules.get(key);
    if (current) this.#modules.delete(key);
    return current;
  }

  list(): readonly HomeModuleRegistration<TContext>[] {
    return Object.freeze([...this.#modules.values()]);
  }

  build(context: TContext): HomeModuleGridContract {
    const modules = this.list().map((registration) => {
      const resolved = registration.resolve(context);
      return Object.freeze({
        key: registration.key,
        title: registration.title,
        route: registration.route,
        ...resolved
      }) satisfies HomePrimaryModule;
    });
    return createHomeGrid(modules);
  }
}
