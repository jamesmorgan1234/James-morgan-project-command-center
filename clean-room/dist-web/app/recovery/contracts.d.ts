import { type EvidenceRecord } from '../kernel/evidence.js';
import type { ExecutionScope } from '../kernel/scope.js';
export { canonicalAnalyticsJson as recoveryJson, analyticsDigest as recoveryDigest, immutable as recoveryImmutable } from '../analytics/contracts.js';
export interface RecoveryScope extends ExecutionScope {
    readonly companyId: string;
    readonly projectId: string;
}
export type RecoveryOperation = 'backup' | 'restore' | 'migrate' | 'rollback' | 'replace' | 'reactivate' | 'record' | 'read' | 'expire';
export interface RecoveryAccess {
    readonly now: () => string;
    readonly authorize: (operation: RecoveryOperation, scope: RecoveryScope, reference: string) => boolean;
    readonly evidence: (id: string) => {
        record: EvidenceRecord;
        scope: RecoveryScope;
        expiresAt: string;
    } | undefined;
}
export declare function requireRecovery(value: unknown, message: string): asserts value;
export declare function recoveryTime(value: string): number;
export declare function recoveryRef(value: string): void;
export declare function recoveryList(values: readonly string[], required?: boolean): void;
export declare function recoveryVersion(value: number): void;
export declare function assertRecoveryScope(scope: RecoveryScope): void;
export declare function recoveryScopeKey(s: RecoveryScope): string;
export declare function assertRecoveryAccess(a: RecoveryAccess, op: RecoveryOperation, s: RecoveryScope, ref: string): void;
export declare function assertRecoveryEvidence(a: RecoveryAccess, s: RecoveryScope, ids: readonly string[]): void;
/** Defense in depth: encrypted payloads still never accept credential/grant material. */
export declare function assertRecoveryPayload(value: unknown): void;
