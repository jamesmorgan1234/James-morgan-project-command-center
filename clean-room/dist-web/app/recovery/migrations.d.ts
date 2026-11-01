export interface MigrationStep {
    readonly id: string;
    readonly fromVersion: number;
    readonly toVersion: number;
    readonly preconditionRefs: readonly string[];
    readonly backupRef: string;
    readonly rollbackRef: string;
    readonly compatibleFrom: readonly number[];
}
export declare function dryRunMigration(step: MigrationStep, currentVersion: number): Readonly<{
    canApply: boolean;
    reason: string;
}>;
export declare function rollbackRequired(result: "applied" | "failed" | "uncertain"): boolean;
import { IsolatedRecoveryWorkspace, type RecoveryProjection } from './restore.js';
import { type RecoveryRecord } from './backup.js';
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export interface RecoveryMigrationPlan {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly fromVersion: number;
    readonly toVersion: number;
    readonly compatibleFrom: readonly number[];
    readonly compatibleBackTo: readonly number[];
    readonly backupRef: string;
    readonly rollbackRef: string;
    readonly sourceDigest: string;
    readonly evidenceIds: readonly string[];
}
export interface RecoveryMigrationReceipt {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly sourceDigest: string;
    readonly targetDigest: string;
    readonly sourceRevision: number;
    readonly targetRevision: number;
    readonly source: readonly RecoveryProjection[];
    readonly plan: RecoveryMigrationPlan;
    readonly planDigest: string;
}
export declare function migrateIsolatedWorkspace(a: RecoveryAccess, w: IsolatedRecoveryWorkspace, p: RecoveryMigrationPlan, expectedRevision: number, transform: (record: RecoveryRecord) => RecoveryRecord, failAtId?: string): Promise<RecoveryMigrationReceipt>;
export declare function rollbackIsolatedMigration(a: RecoveryAccess, w: IsolatedRecoveryWorkspace, receipt: RecoveryMigrationReceipt, erasedIds: readonly string[], current: (record: RecoveryRecord) => RecoveryProjection): Promise<number>;
/** Retry checks the immutable applied plan before returning the original recorded receipt. */
export declare function resumeIsolatedMigration(w: IsolatedRecoveryWorkspace, p: RecoveryMigrationPlan, r: RecoveryMigrationReceipt): Promise<RecoveryMigrationReceipt>;
