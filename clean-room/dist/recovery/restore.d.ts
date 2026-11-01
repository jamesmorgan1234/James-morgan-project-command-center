export interface RestoreItem {
    readonly id: string;
    readonly kind: string;
    readonly contentHash: string;
    readonly dependencyIds: readonly string[];
}
export interface RestorePlan {
    readonly backupId: string;
    readonly isolatedEnvironment: boolean;
    readonly items: readonly RestoreItem[];
    readonly expectedContentHash: string;
    readonly observedContentHash: string;
}
export declare function validateRestore(plan: RestorePlan): Readonly<{
    restored: number;
    consistent: true;
}>;
import { type RestoreRevalidationInput } from '../data/recovery.js';
import { type RecoveryRecord, type RecoveryBackupPolicy, type EncryptedRecoveryBackup } from './backup.js';
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export interface CurrentRecoveryState {
    readonly recordId: string;
    readonly scope: RecoveryScope;
    readonly version: number;
    readonly compatibilityVersion: number;
    readonly revocationEpoch: number;
    readonly invalidated: boolean;
    readonly revalidation: RestoreRevalidationInput;
}
export interface RecoveryProjection {
    readonly record: RecoveryRecord;
    readonly disposition: 'usable_data' | 'historical' | 'requires_canonical_owner_revalidation';
    readonly reason: string;
}
/** Isolated staging owner only. This cannot restore grants or activate canonical PIF registries. */
export declare class IsolatedRecoveryWorkspace {
    #private;
    readonly scope: RecoveryScope;
    constructor(scope: RecoveryScope);
    get revision(): number;
    snapshot(): readonly RecoveryProjection[];
    receipt(id: string): Readonly<{
        digest: string;
        revision: number;
    }> | undefined;
    commit(expectedRevision: number, operationId: string, digest: string, records: readonly RecoveryProjection[]): number;
}
export declare function restoreEncryptedBackup(a: RecoveryAccess, p: RecoveryBackupPolicy, b: EncryptedRecoveryBackup, key: CryptoKey, workspace: IsolatedRecoveryWorkspace, expectedRevision: number, current: (record: RecoveryRecord) => CurrentRecoveryState | undefined): Promise<Readonly<{
    revision: number;
    restored: number;
    historical: number;
    requiresRevalidation: number;
    rtoMs: number;
    rpoMs: number;
    boundary: 'isolated';
}>>;
