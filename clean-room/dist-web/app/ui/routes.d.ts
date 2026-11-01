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
export declare class RouteRegistry {
    #private;
    register(route: RouteDefinition): void;
    remove(key: string): RouteDefinition;
    resolvePath(path: string): RouteDefinition | undefined;
    resolve(path: string): ResolvedRoute | undefined;
    transitionDecision(path: string, current?: Readonly<{
        hasProtectedUnsavedEdits: boolean;
    }>): RouteTransitionDecision;
    get(key: string): RouteDefinition | undefined;
    list(): readonly RouteDefinition[];
}
export declare function routeNavigationState(route: ResolvedRoute, search: string, hasProtectedUnsavedEdits?: boolean): RouteNavigationState;
export declare function createCoreRouteRegistry(): RouteRegistry;
