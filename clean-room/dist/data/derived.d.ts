import { type ProvenanceRef } from "./provenance.js";
export type DerivedState = "active" | "restricted" | "deleted";
export interface DerivedRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly purpose: string;
    readonly retentionClass: string;
    readonly state: DerivedState;
    readonly provenance: readonly ProvenanceRef[];
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly legalHold: boolean;
    readonly holdReason?: string;
    readonly holdReleasedAt?: string;
    readonly holdReleaseAuthorizationRef?: string;
    readonly holdReleaseReason?: string;
    readonly restrictionReason?: string;
}
export declare class DerivedLifecycleRegistry {
    #private;
    register(record: DerivedRecord): DerivedRecord;
    placeLegalHold(id: string, at: string, reason: string): DerivedRecord;
    releaseLegalHold(id: string, at: string, authorizationRef: string, reason: string): DerivedRecord;
    invalidateByObservation(observationId: string, at: string, reason: string): readonly DerivedRecord[];
    restrictPurpose(id: string, at: string, reason: string): DerivedRecord;
    get(id: string): DerivedRecord | undefined;
}
