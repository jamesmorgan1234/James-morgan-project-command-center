export type ResourceClaimMode = "shared" | "exclusive";
export interface ResourceRequest {
    readonly resourceKey: string;
    readonly mode: ResourceClaimMode;
}
export interface ResourceClaim {
    readonly ownerKey: string;
    readonly resourceKey: string;
    readonly mode: ResourceClaimMode;
}
export declare class ResourceClaimManager {
    #private;
    claim(ownerKey: string, requests: readonly ResourceRequest[]): readonly ResourceClaim[];
    releaseOwner(ownerKey: string): void;
}
export interface LeasedResourceClaim extends ResourceClaim {
    readonly claimId: string;
    readonly generation: number;
    readonly acquiredAt: string;
    readonly expiresAt: string;
    readonly evidenceRefs: readonly string[];
    readonly releasedAt?: string;
}
export interface ResourceRecoveryEvent {
    readonly claimId: string;
    readonly resourceKey: string;
    readonly priorOwnerKey: string;
    readonly generation: number;
    readonly recoveredAt: string;
    readonly evidenceRefs: readonly string[];
}
export declare function recoverExpiredResourceClaims(claims: readonly LeasedResourceClaim[], now: string, evidenceRefs: readonly string[]): Readonly<{
    claims: readonly LeasedResourceClaim[];
    events: readonly ResourceRecoveryEvent[];
}>;
