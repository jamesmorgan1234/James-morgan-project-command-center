/**
 * Application startup.
 *
 * Single scroll-restoration owner, single global state coordinator, single
 * error boundary hierarchy, explicit startup and session state machines,
 * application readiness, core versus optional modules, deterministic ordering,
 * timeout handling, stuck-loading refusal, Safe Mode and deep links.
 */

function exactlyOne(kind: string, owners: readonly string[]): string {
  if (owners.length !== 1) throw new Error(`Exactly one ${kind} is required`);
  const owner = owners[0];
  if (owner === undefined || !owner.trim()) throw new Error(`${kind} must be named`);
  return owner;
}

export function scrollRestorationOwner(owners: readonly string[]): string {
  return exactlyOne("scroll-restoration owner", owners);
}

export function globalStateCoordinator(coordinators: readonly string[]): string {
  return exactlyOne("global application-state coordinator", coordinators);
}

export function errorBoundaryRoot(roots: readonly string[]): string {
  return exactlyOne("error boundary hierarchy", roots);
}

export type StartupState = "idle" | "starting" | "ready" | "failed" | "safe_mode";
export type StartupEvent = "start" | "core_ready" | "core_failed" | "optional_failed" | "reset";

const STARTUP_TRANSITIONS: Readonly<Record<StartupState, Partial<Record<StartupEvent, StartupState>>>> = Object.freeze({
  idle: { start: "starting" },
  starting: { core_ready: "ready", core_failed: "failed", optional_failed: "starting" },
  ready: { reset: "idle" },
  failed: { reset: "idle" },
  safe_mode: { reset: "idle" }
});

export function startupTransition(state: StartupState, event: StartupEvent): StartupState {
  const next = STARTUP_TRANSITIONS[state][event];
  if (next === undefined) throw new Error(`Invalid startup transition: ${state} + ${event}`);
  return next;
}

export type SessionState = "anonymous" | "authenticating" | "authenticated" | "signed_out" | "failed";
export type SessionEvent = "authenticate" | "success" | "failure" | "sign_out" | "reset";

const SESSION_TRANSITIONS: Readonly<Record<SessionState, Partial<Record<SessionEvent, SessionState>>>> = Object.freeze({
  anonymous: { authenticate: "authenticating" },
  authenticating: { success: "authenticated", failure: "failed" },
  authenticated: { sign_out: "signed_out" },
  signed_out: { reset: "anonymous", authenticate: "authenticating" },
  failed: { reset: "anonymous" }
});

export function sessionTransition(state: SessionState, event: SessionEvent): SessionState {
  const next = SESSION_TRANSITIONS[state][event];
  if (next === undefined) throw new Error(`Invalid session transition: ${state} + ${event}`);
  return next;
}

export function applicationReady(coreStates: Readonly<Record<string, string>>): boolean {
  const values = Object.values(coreStates);
  return values.length > 0 && values.every((state) => state === "ready");
}

export type ModuleClass = "core" | "optional";

export function classifyModule(module: { readonly core: boolean }): ModuleClass {
  return module.core ? "core" : "optional";
}

export interface ModuleDefinition {
  readonly key: string;
  readonly core: boolean;
  readonly order: number;
  readonly start: () => "ready" | "failed";
}

export interface StartupResult {
  readonly state: "ready" | "failed" | "safe_mode";
  readonly started: readonly string[];
  readonly skipped: readonly string[];
  readonly failedCore: string | null;
}

function assertDefinitions(definitions: readonly ModuleDefinition[]): void {
  if (definitions.length === 0) throw new Error("Startup requires module definitions");
  const keys = new Set<string>();
  const orders = new Set<number>();
  for (const definition of definitions) {
    if (!definition.key.trim()) throw new Error("A module requires a key");
    if (keys.has(definition.key)) throw new Error(`Duplicate module: ${definition.key}`);
    if (orders.has(definition.order)) throw new Error(`Duplicate startup order: ${definition.order}`);
    keys.add(definition.key);
    orders.add(definition.order);
  }
}

export function startupOrder(definitions: readonly ModuleDefinition[]): readonly string[] {
  assertDefinitions(definitions);
  return Object.freeze([...definitions].sort((a, b) => a.order - b.order).map((definition) => definition.key));
}

export function runStartup(definitions: readonly ModuleDefinition[], safeMode = false): StartupResult {
  assertDefinitions(definitions);
  const ordered = [...definitions].sort((a, b) => a.order - b.order);
  const started: string[] = [];
  const skipped: string[] = [];
  for (const definition of ordered) {
    if (safeMode && !definition.core) {
      skipped.push(definition.key);
      continue;
    }
    const outcome = definition.start();
    if (outcome === "ready") started.push(definition.key);
    else if (definition.core) return Object.freeze({ state: "failed" as const, started: Object.freeze(started), skipped: Object.freeze(skipped), failedCore: definition.key });
    else skipped.push(definition.key);
  }
  return Object.freeze({ state: safeMode ? "safe_mode" as const : "ready" as const, started: Object.freeze(started), skipped: Object.freeze(skipped), failedCore: null });
}

export async function startModuleWithin<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error("Startup timeout must be a positive integer");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Startup timed out")), timeoutMs);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function assertNotStuckLoading(startedAt: string, now: string, limitMs: number): void {
  const start = Date.parse(startedAt);
  const current = Date.parse(now);
  if (Number.isNaN(start) || Number.isNaN(current)) throw new Error("Loading timestamps must be valid");
  if (current - start > limitMs) throw new Error("Application must not remain in an infinite loading state");
}

export interface DeepLink {
  readonly path: string;
  readonly params: Readonly<Record<string, string>>;
}

export function parseDeepLink(url: string): DeepLink {
  if (!url.startsWith("/") || url.includes("://")) throw new Error("A deep link must be an application-relative path");
  const [path, query = ""] = url.split("?");
  if (path === undefined || !path.trim()) throw new Error("A deep link requires a path");
  const params: Record<string, string> = {};
  for (const pair of query.split("&").filter(Boolean)) {
    const [key, value = ""] = pair.split("=");
    if (key !== undefined && key.trim()) params[key] = value;
  }
  return Object.freeze({ path, params: Object.freeze(params) });
}
