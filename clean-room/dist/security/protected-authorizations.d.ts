export type ProtectedAuthorizationState = "authorized" | "consumed" | "revoked" | "expired";
export declare const TRUSTED_PROTECTED_AUTHORITY_SOURCES: readonly ["owner_verified", "trusted_security_policy"];
export type ProtectedAuthorizationAuthoritySource = (typeof TRUSTED_PROTECTED_AUTHORITY_SOURCES)[number];
export interface ProtectedAuthorizationRecord {
    readonly id: string;
    readonly ownerId: string;
    readonly sessionId: string;
    readonly action: string;
    readonly authorizationIntentBinding: string;
    readonly authoritySource: ProtectedAuthorizationAuthoritySource;
    readonly sourceRef: string;
    readonly state: ProtectedAuthorizationState;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly consumedAt?: string;
    readonly revokedAt?: string;
    readonly revocationReason?: string;
}
export interface ProtectedAuthorizationUse {
    readonly ownerId: string;
    readonly sessionId: string;
    readonly action: string;
    readonly authorizationIntentBinding: string;
}
export declare class ProtectedAuthorizationRegistry {
    #private;
    register(record: ProtectedAuthorizationRecord): void;
    get(id: string): ProtectedAuthorizationRecord | undefined;
    assertUsable(id: string, use: ProtectedAuthorizationUse, now: string): ProtectedAuthorizationRecord;
    consume(id: string, use: ProtectedAuthorizationUse, consumedAt: string): ProtectedAuthorizationRecord;
    revoke(id: string, revokedAt: string, reason: string): ProtectedAuthorizationRecord;
}
