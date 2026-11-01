export type SetupKind = "account" | "provider" | "credential" | "domain" | "device" | "permission" | "legal";
export interface SetupRequirement {
    readonly id: string;
    readonly kind: SetupKind;
    readonly title: string;
    readonly dependencyIds: readonly string[];
    readonly unlockRefs: readonly string[];
    readonly requiredEnvironment: "pc" | "phone" | "local_browser" | "any_device";
    readonly ownerOnly: boolean;
    readonly knownAtSpecTime: boolean;
}
export interface OnboardingManifest {
    readonly projectId: string;
    readonly specVersion: number;
    readonly requirements: readonly SetupRequirement[];
}
export interface SetupBlockerView {
    readonly requirementId: string;
    readonly title: string;
    readonly kind: SetupKind;
    readonly requiredEnvironment: SetupRequirement["requiredEnvironment"];
    readonly ownerOnly: boolean;
    readonly unmetDependencyIds: readonly string[];
    readonly unlockRefs: readonly string[];
    readonly readyForOwnerAction: boolean;
}
export declare function validateOnboardingManifest(manifest: OnboardingManifest): void;
export declare function groupSetupByUnlockImpact(manifest: OnboardingManifest): readonly Readonly<{
    unlockRef: string;
    requirementIds: readonly string[];
}>[];
/** Returns every spec-time-known unmet prerequisite, including ones blocked behind other prerequisites. */
export declare function knownSetupBlockers(manifest: OnboardingManifest, completedRequirementIds: readonly string[]): readonly SetupBlockerView[];
