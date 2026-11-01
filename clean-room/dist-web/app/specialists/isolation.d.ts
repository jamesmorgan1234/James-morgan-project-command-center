import type { SpecialistProjectProfile } from "./contracts.js";
export interface SpecialistStateRecord {
    readonly projectId: string;
    readonly typeKey: string;
    readonly truthOwner: string;
    readonly canonicalRef: string;
    readonly providerRefs: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly status: "active" | "dormant" | "archived";
}
export declare function assertSpecialistIsolation(records: readonly SpecialistStateRecord[]): void;
export declare function canReactivate(profile: SpecialistProjectProfile, availableProviderCapabilities: readonly string[]): boolean;
export declare function renameSpecialist(profile: SpecialistProjectProfile, displayName: string): SpecialistProjectProfile;
