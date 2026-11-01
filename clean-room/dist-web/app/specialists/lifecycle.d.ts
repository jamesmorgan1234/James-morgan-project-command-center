export type SpecialistLifecycleStatus = "active" | "dormant" | "archived" | "replaced";
export type SpecialistProviderHealth = "available" | "degraded" | "unavailable";
export interface SpecialistTypeRegistration {
    readonly typeKey: string;
    readonly truthOwner: string;
    readonly isolationClass: string;
    readonly requiredProviderCapabilities: readonly string[];
    readonly sourceRefs: readonly string[];
}
export interface SpecialistLifecycleProject {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly typeKey: string;
    readonly displayName: string;
    readonly canonicalRef: string;
    readonly status: SpecialistLifecycleStatus;
    readonly providerCapabilities: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly replacedByProjectId?: string | undefined;
}
export interface SpecialistLifecycleAuthorization {
    readonly authorizationRef: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly action: "rename" | "merge" | "activate" | "replace" | "archive";
    readonly targetProjectId?: string | undefined;
}
export interface SpecialistProviderAssessment {
    readonly projectId: string;
    readonly providerCapability: string;
    readonly health: SpecialistProviderHealth;
    readonly isolatedFailure: boolean;
    readonly sourceRefs: readonly string[];
}
export declare class SpecialistLifecycleRegistry {
    #private;
    registerType(input: SpecialistTypeRegistration): SpecialistTypeRegistration;
    registerProject(input: SpecialistLifecycleProject): SpecialistLifecycleProject;
    get(ownerId: string, projectId: string): SpecialistLifecycleProject;
    rename(ownerId: string, projectId: string, displayName: string, authorization: SpecialistLifecycleAuthorization): SpecialistLifecycleProject;
    setDormant(ownerId: string, projectId: string): SpecialistLifecycleProject;
    activate(ownerId: string, projectId: string, availableProviderCapabilities: readonly string[], authorization: SpecialistLifecycleAuthorization): SpecialistLifecycleProject;
    assessProvider(ownerId: string, projectId: string, providerCapability: string, health: SpecialistProviderHealth, sourceRefs: readonly string[]): SpecialistProviderAssessment;
    merge(ownerId: string, sourceProjectId: string, targetProjectId: string, authorization: SpecialistLifecycleAuthorization): readonly [SpecialistLifecycleProject, SpecialistLifecycleProject];
    replaceProject(ownerId: string, projectId: string, replacement: SpecialistLifecycleProject, authorization: SpecialistLifecycleAuthorization): readonly [SpecialistLifecycleProject, SpecialistLifecycleProject];
    archive(ownerId: string, projectId: string, authorization: SpecialistLifecycleAuthorization): SpecialistLifecycleProject;
    list(ownerId?: string): readonly SpecialistLifecycleProject[];
    private assertAuthorization;
    private replace;
}
