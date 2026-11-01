export interface BackupPolicy {
    readonly scopeKeys: readonly string[];
    readonly cadenceRef: string;
    readonly retentionRef: string;
    readonly encrypted: boolean;
    readonly integrityAlgorithm: "sha256";
    readonly protectedAssetRefs: readonly string[];
    readonly secretStrategy: "references_only" | "encrypted_separate";
}
export interface BackupManifest {
    readonly backupId: string;
    readonly createdAt: string;
    readonly policyHash: string;
    readonly contentHash: string;
    readonly itemCount: number;
    readonly sourceRefs: readonly string[];
}
export declare function validateBackup(policy: BackupPolicy, manifest: BackupManifest): BackupManifest;
import { type IntelligenceBackupClass } from './acceptance.js';
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export declare const RECOVERY_ARTIFACT_CLASSES: readonly ["canonical_data", "assets", "methods", "routing", "calibration", "promotions", "evaluators", "procedures", "specialists", "negative_knowledge", "revalidation", "canary_state", "configuration", "capabilities", "shadow_state"];
export type RecoveryArtifactClass = IntelligenceBackupClass | 'configuration' | 'capabilities' | 'shadow_state';
export type RecoveryTruth = 'current' | 'historical' | 'expired' | 'revoked' | 'superseded' | 'invalidated' | 'unknown' | 'deleted';
export interface RecoveryRecord {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly version: number;
    readonly kind: RecoveryArtifactClass;
    readonly truth: RecoveryTruth;
    readonly policyEpoch: number;
    readonly revocationEpoch: number;
    readonly compatibleVersion: number;
    readonly dependencyIds: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly payload: Readonly<Record<string, unknown>>;
}
export interface RecoveryBackupPolicy {
    readonly id: string;
    readonly version: number;
    readonly scope: RecoveryScope;
    readonly cadenceMs: number;
    readonly retentionMs: number;
    readonly maximumAgeMs: number;
    readonly maximumRecords: number;
    readonly keyRef: string;
    readonly protectedRefs: readonly string[];
    readonly excludedRefs: readonly string[];
    readonly requiredClasses: readonly RecoveryArtifactClass[];
    readonly evidenceIds: readonly string[];
}
export interface EncryptedRecoveryBackup {
    readonly header: {
        readonly id: string;
        readonly formatVersion: 1;
        readonly scope: RecoveryScope;
        readonly createdAt: string;
        readonly expiresAt: string;
        readonly policyId: string;
        readonly policyVersion: number;
        readonly policyDigest: string;
        readonly keyRef: string;
        readonly compatibilityVersion: number;
        readonly itemCount: number;
        readonly classes: readonly RecoveryArtifactClass[];
        readonly contentDigest: string;
        readonly evidenceIds: readonly string[];
    };
    readonly iv: readonly number[];
    readonly ciphertext: readonly number[];
    readonly envelopeDigest: string;
}
export declare function validateRecoveryRecord(r: RecoveryRecord): void;
export declare function validateRecoveryPolicy(p: RecoveryBackupPolicy): void;
export declare function backupDue(p: RecoveryBackupPolicy, lastCreatedAt: string | undefined, now: string): boolean;
export declare function createEncryptedBackup(a: RecoveryAccess, policyInput: RecoveryBackupPolicy, records: readonly RecoveryRecord[], id: string, key: CryptoKey, compatibilityVersion: number): Promise<EncryptedRecoveryBackup>;
export declare function verifyEncryptedBackup(a: RecoveryAccess, policyInput: RecoveryBackupPolicy, backupInput: EncryptedRecoveryBackup, key: CryptoKey): Promise<readonly RecoveryRecord[]>;
