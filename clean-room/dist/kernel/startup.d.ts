/**
 * Application startup.
 *
 * Single scroll-restoration owner, single global state coordinator, single
 * error boundary hierarchy, explicit startup and session state machines,
 * application readiness, core versus optional modules, deterministic ordering,
 * timeout handling, stuck-loading refusal, Safe Mode and deep links.
 */
export declare function scrollRestorationOwner(owners: readonly string[]): string;
export declare function globalStateCoordinator(coordinators: readonly string[]): string;
export declare function errorBoundaryRoot(roots: readonly string[]): string;
export type StartupState = "idle" | "starting" | "ready" | "failed" | "safe_mode";
export type StartupEvent = "start" | "core_ready" | "core_failed" | "optional_failed" | "reset";
export declare function startupTransition(state: StartupState, event: StartupEvent): StartupState;
export type SessionState = "anonymous" | "authenticating" | "authenticated" | "signed_out" | "failed";
export type SessionEvent = "authenticate" | "success" | "failure" | "sign_out" | "reset";
export declare function sessionTransition(state: SessionState, event: SessionEvent): SessionState;
export declare function applicationReady(coreStates: Readonly<Record<string, string>>): boolean;
export type ModuleClass = "core" | "optional";
export declare function classifyModule(module: {
    readonly core: boolean;
}): ModuleClass;
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
export declare function startupOrder(definitions: readonly ModuleDefinition[]): readonly string[];
export declare function runStartup(definitions: readonly ModuleDefinition[], safeMode?: boolean): StartupResult;
export declare function startModuleWithin<T>(operation: Promise<T>, timeoutMs: number): Promise<T>;
export declare function assertNotStuckLoading(startedAt: string, now: string, limitMs: number): void;
export interface DeepLink {
    readonly path: string;
    readonly params: Readonly<Record<string, string>>;
}
export declare function parseDeepLink(url: string): DeepLink;
