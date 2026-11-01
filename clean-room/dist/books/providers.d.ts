export type PublishingBoundary = "normal" | "work_required";
export interface PublishingProvider {
    readonly key: string;
    readonly version: number;
    readonly health: "available" | "degraded" | "unavailable";
    readonly capabilities: readonly string[];
    readonly boundary: PublishingBoundary;
    readonly sourceRef: string;
}
export declare class PublishingProviderRegistry {
    #private;
    register(provider: PublishingProvider): PublishingProvider;
    route(capability: string): PublishingProvider | null;
}
export type PublishingProviderHealth = "available" | "degraded" | "unavailable";
export type PublishingAdapterBoundary = "normal_chat" | "work_required" | "owner_only";
export interface PublishingProviderAdapter {
    readonly key: string;
    readonly ownerId: string;
    readonly version: number;
    readonly health: PublishingProviderHealth;
    readonly capabilities: readonly string[];
    readonly boundaryByCapability: Readonly<Record<string, PublishingAdapterBoundary>>;
    readonly implementationRef: string;
    readonly evidenceRefs: readonly string[];
    readonly observedAt: string;
}
export interface PublishingProviderRoute {
    readonly providerKey: string;
    readonly providerVersion: number;
    readonly capability: string;
    readonly boundary: PublishingAdapterBoundary;
    readonly health: PublishingProviderHealth;
    readonly implementationRef: string;
    readonly evidenceRefs: readonly string[];
}
export declare class PublishingProviderAdapterRegistry {
    #private;
    register(adapter: PublishingProviderAdapter): PublishingProviderAdapter;
    route(ownerId: string, capability: string): PublishingProviderRoute | null;
    requireExact(ownerId: string, key: string, version: number): PublishingProviderAdapter;
}
export declare function assertPublishingBoundaryTruth(route: PublishingProviderRoute, actualEnvironment: "normal_chat" | "work" | "owner_browser"): void;
