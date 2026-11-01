import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export declare const RECOVERY_DURABLE_CLASSES: {
    readonly artifact: readonly ["backup", "known_good", "intelligence_state", "migration", "rollback", "historical_recovery", "scale_plan", "dormant_state", "device_seam", "simulation", "replacement_audit"];
    readonly exercise: readonly ["restore", "migration", "rollback", "provider_replacement", "historical_recovery", "scale_10x", "scale_100x", "reactivation", "chaos", "shadow", "control_plane_failover", "revalidation", "counterfactual"];
    readonly replacement: readonly ["provider", "model", "method", "specialist", "evaluator", "ontology", "library", "service"];
    readonly dormant: readonly ["capability", "specialist", "procedure", "promotion"];
    readonly boundary: readonly ["multi_user", "commercial_public_fork", "device", "interface"];
    readonly drift: readonly ["architecture_drift", "config_drift", "external_reality", "memory_age", "dependency_age", "replacement_audit", "causal_validation"];
};
export type RecoveryDurableKind = keyof typeof RECOVERY_DURABLE_CLASSES;
export interface RecoveryDurableInput {
    readonly id: string;
    readonly version: number;
    readonly scope: RecoveryScope;
    readonly kind: RecoveryDurableKind;
    readonly recordClass: string;
    readonly occurredAt: string;
    readonly evidenceIds: readonly string[];
    readonly sourceRef: string;
    readonly targetRef: string;
    readonly detail: Readonly<Record<string, unknown>>;
}
export interface RecoveryDurableRecord extends RecoveryDurableInput {
    readonly digest: string;
}
export interface RecoveryEvidenceStore {
    append(record: RecoveryDurableRecord): Promise<RecoveryDurableRecord>;
    read(scope: RecoveryScope, kind: RecoveryDurableKind): Promise<readonly RecoveryDurableRecord[]>;
    expire?(scope: RecoveryScope): Promise<number>;
}
export declare function validateRecoveryDurable(r: RecoveryDurableInput): void;
export declare const recoverySourceDigest: (record: RecoveryDurableInput) => Promise<string>;
export declare class RecoveryEvidenceRepository {
    readonly access: RecoveryAccess;
    readonly store: RecoveryEvidenceStore;
    constructor(access: RecoveryAccess, store: RecoveryEvidenceStore);
    record(input: RecoveryDurableInput): Promise<RecoveryDurableRecord>;
    expireBackups(scope: RecoveryScope, evidenceIds: readonly string[]): Promise<number>;
    read(scope: RecoveryScope, kind: RecoveryDurableKind): Promise<readonly (RecoveryDurableRecord & {
        evidenceState: 'current' | 'historical';
    })[]>;
}
export type RecoveryQuery = (sql: string, parameters: readonly unknown[]) => Promise<{
    rows: Record<string, unknown>[];
}>;
export declare class PostgresRecoveryStore implements RecoveryEvidenceStore {
    readonly query: RecoveryQuery;
    constructor(query: RecoveryQuery);
    expire(scope: RecoveryScope): Promise<number>;
    append(r: RecoveryDurableRecord): Promise<RecoveryDurableRecord>;
    read(scope: RecoveryScope, kind: RecoveryDurableKind): Promise<readonly RecoveryDurableRecord[]>;
}
