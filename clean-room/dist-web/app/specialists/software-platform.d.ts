export type SoftwarePlatformDomain = "user" | "role" | "roadmap" | "repository" | "deployment" | "provider" | "analytics" | "support" | "monetization";
export interface SoftwarePlatformBinding {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly repositoryRef: string;
    readonly deploymentProviderRef: string;
    readonly analyticsProviderRefs: readonly string[];
    readonly supportProviderRefs: readonly string[];
    readonly sourceRefs: readonly string[];
}
export interface SoftwarePlatformState {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly domain: SoftwarePlatformDomain;
    readonly canonicalRef: string;
    readonly state: string;
    readonly providerRef?: string | undefined;
    readonly sourceRefs: readonly string[];
}
export interface SoftwareDeploymentEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId: string;
    readonly repositoryRef: string;
    readonly commitRef: string;
    readonly environmentRef: string;
    readonly deploymentProviderRef: string;
    readonly deploymentRef: string;
    readonly sourceRefs: readonly string[];
}
export declare class SoftwarePlatformRegistry {
    #private;
    register(input: SoftwarePlatformBinding): SoftwarePlatformBinding;
    require(ownerId: string, projectId: string): SoftwarePlatformBinding;
}
export declare function validateSoftwarePlatformState(input: SoftwarePlatformState, binding: SoftwarePlatformBinding): SoftwarePlatformState;
export declare function validateSoftwareDeploymentEvidence(input: SoftwareDeploymentEvidence, binding: SoftwarePlatformBinding): SoftwareDeploymentEvidence;
export declare const SOFTWARE_PLATFORM_TRUTH_OWNER: "specialist:software_platform";
