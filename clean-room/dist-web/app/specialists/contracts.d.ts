import type { SpecialistModelContract, SpecialistProjectionRequest } from "../brain/specialists.js";
export interface SpecialistCapabilityContract {
    readonly key: string;
    readonly truthOwner: string;
    readonly dataDomains: readonly string[];
    readonly brainCapabilities: readonly string[];
    readonly agencyCapabilities: readonly string[];
    readonly projectDetailSections: readonly string[];
    readonly metricKeys: readonly string[];
    readonly providerCapabilities: readonly string[];
    readonly isolationClass: string;
}
export interface SpecialistProjectProfile {
    readonly projectId: string;
    readonly typeKey: string;
    readonly displayName: string;
    readonly contract: SpecialistCapabilityContract;
    readonly sourceRefs: readonly string[];
    readonly active: boolean;
    /** PIF.3 canonical authority reference. Legacy C6 profiles may omit until migrated. */
    readonly specialistId?: string;
    readonly specialistVersion?: number;
    readonly companyId?: string;
    readonly workClasses?: readonly string[];
    readonly dataClasses?: readonly string[];
    readonly capabilityKeys?: readonly string[];
    readonly permissionKeys?: readonly string[];
}
export declare function validateSpecialistContract(contract: SpecialistCapabilityContract): SpecialistCapabilityContract;
export declare function specialistProjectionRequest(profile: SpecialistProjectProfile): SpecialistProjectionRequest;
export declare function validateCanonicalSpecialistProjection(profile: SpecialistProjectProfile, model: SpecialistModelContract): SpecialistProjectProfile;
