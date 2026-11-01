import { type SecretReferenceState } from "./types.js";
export interface SecretReferenceMetadata {
    readonly id: string;
    readonly provider: string;
    readonly purpose: string;
    readonly state: SecretReferenceState;
    readonly createdAt: string;
    readonly version?: number;
    readonly keyVersion?: number;
    readonly expiresAt?: string;
    readonly rotatedAt?: string;
    readonly revokedAt?: string;
    readonly replacedBy?: string;
    readonly rotationOverlapUntil?: string;
    readonly lastHealthCheckAt?: string;
    readonly dependentServiceKeys?: readonly string[];
}
export declare function assertReferenceOnly(value: Record<string, unknown>): void;
export declare class SecretReferenceRegistry {
    #private;
    register(record: SecretReferenceMetadata): void;
    get(id: string): SecretReferenceMetadata | undefined;
    list(): readonly SecretReferenceMetadata[];
    assertUsable(id: string, at: string): SecretReferenceMetadata;
    rotate(id: string, replacement: SecretReferenceMetadata, rotatedAt: string, rotationOverlapUntil?: string): readonly [SecretReferenceMetadata, SecretReferenceMetadata];
    replaceProvider(id: string, replacement: SecretReferenceMetadata, replacedAt: string): readonly [SecretReferenceMetadata, SecretReferenceMetadata];
    setState(id: string, state: SecretReferenceState, at: string): SecretReferenceMetadata;
}
