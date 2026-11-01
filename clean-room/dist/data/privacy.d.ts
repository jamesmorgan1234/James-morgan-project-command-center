export type DerivedPayloadState = "present" | "restricted" | "erased";
export type DerivedPayloadAuditAction = "registered" | "restricted" | "erased";
export interface DerivedPayloadRecord {
    readonly ownerId: string;
    readonly derivedId: string;
    readonly state: DerivedPayloadState;
    readonly payloadRef?: string;
    readonly contentHash?: string;
    readonly keyVersion?: number;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface DerivedPayloadAuditEvent {
    readonly eventId: string;
    readonly ownerId: string;
    readonly derivedId: string;
    readonly action: DerivedPayloadAuditAction;
    readonly reason: string;
    readonly evidenceRefs: readonly string[];
    readonly recordedAt: string;
}
export interface PayloadAuditInput {
    readonly eventId: string;
    readonly reason: string;
    readonly evidenceRefs: readonly string[];
    readonly recordedAt: string;
}
export declare class DerivedPayloadRegistry {
    #private;
    register(record: DerivedPayloadRecord, audit: PayloadAuditInput): DerivedPayloadRecord;
    restrict(ownerId: string, derivedId: string, audit: PayloadAuditInput): DerivedPayloadRecord;
    erase(ownerId: string, derivedId: string, legalHold: boolean, audit: PayloadAuditInput): DerivedPayloadRecord;
    get(ownerId: string, derivedId: string): DerivedPayloadRecord | undefined;
    auditTrail(ownerId: string, derivedId: string): readonly DerivedPayloadAuditEvent[];
}
