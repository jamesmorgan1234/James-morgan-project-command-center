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
export declare function homeDiagnosticSummary(input: Readonly<Omit<HomeDiagnosticSummary, "availableOffline" | "quickActionsRequireAuthority">>): HomeDiagnosticSummary;
export declare function registerHomeGridExtension(module: HomePrimaryModule): () => void;
export declare function listHomeGridExtensions(): readonly HomePrimaryModule[];
export declare function createHomeGrid(modules: readonly HomePrimaryModule[]): HomeModuleGridContract;
export declare class HomeModuleRegistry<TContext> {
    #private;
    register(registration: HomeModuleRegistration<TContext>): void;
    remove(key: HomePrimaryModuleKey): HomeModuleRegistration<TContext> | undefined;
    list(): readonly HomeModuleRegistration<TContext>[];
    build(context: TContext): HomeModuleGridContract;
}
