export interface RecoverableAssignment {
    readonly taskId: string;
    readonly workerId: string;
    readonly leaseExpiresAt: string;
    readonly checkpointRef: string;
    readonly evidenceRefs: readonly string[];
}
export declare function reapOrphan(assignment: RecoverableAssignment, now: string): Readonly<{
    taskId: string;
    reclaim: boolean;
    resumeFrom: string;
}>;
export interface ExpiringAssignment {
    readonly taskId: string;
    readonly workerId: string;
    readonly generation: number;
    readonly fencingToken: number;
    readonly claimedAt: string;
    readonly expiresAt: string;
    readonly checkpointRef?: string;
    readonly evidenceRefs: readonly string[];
}
export interface RecoveredAssignment {
    readonly taskId: string;
    readonly workerId: string;
    readonly generation: number;
    readonly fencingToken: number;
    readonly claimedAt: string;
    readonly checkpointRef: string;
    readonly evidenceRefs: readonly string[];
    readonly contextRevalidationRequired: true;
}
/** Reclaims only an expired worker lease and preserves checkpoint/evidence truth. */
export declare function recoverExpiredAssignment(assignment: ExpiringAssignment, replacementWorkerId: string, now: string): RecoveredAssignment;
export interface LeadFailover {
    readonly projectAgentId: string;
    readonly priorLeadId: string;
    readonly replacementLeadId: string;
    readonly missionRef: string;
    readonly queueRef: string;
    readonly checkpointRef: string;
    readonly authorityScopes: readonly string[];
}
export declare function validateLeadFailover(failover: LeadFailover): void;
