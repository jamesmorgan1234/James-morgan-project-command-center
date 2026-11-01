export type PersonalOperationKind = "household" | "errand" | "shopping" | "vehicle" | "travel" | "obligation";
export interface PersonalOperationRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly kind: PersonalOperationKind;
    readonly title: string;
    readonly truthOwnerKey: string;
    readonly canonicalRef: string;
    readonly specialistProjectId?: string;
    readonly status: "open" | "planned" | "done" | "cancelled";
    readonly sourceRefs: readonly string[];
    readonly sensitivityRank?: number;
}
export interface PersonalOperationViewRequest {
    readonly ownerId: string;
    readonly allowedKinds: readonly PersonalOperationKind[];
    readonly maxSensitivityRank: number;
    readonly allowedSpecialistProjectIds?: readonly string[];
}
export interface PersonalOperationProjection extends PersonalOperationRecord {
    readonly readOnlyProjection: boolean;
    readonly sensitivityRank: number;
}
export declare function validatePersonalOperations(records: readonly PersonalOperationRecord[]): void;
/**
 * Builds a privacy-minimized cross-domain view. Specialist records remain read-only pointers;
 * Personal Ops never becomes the truth owner merely because it displays them. A specialist
 * project id is optional provenance/routing metadata; when a caller supplies an explicit
 * specialist allowlist, an external projection without a matching specialist id fails closed.
 */
export declare function projectPersonalOperations(request: PersonalOperationViewRequest, records: readonly PersonalOperationRecord[]): readonly PersonalOperationProjection[];
