export type CoordinationFaultKind = "deadlock" | "livelock" | "priority_inversion" | "orphaned" | "no_progress";
export type CoordinationRecoveryDisposition = "recover" | "escalate_owner";
export interface CoordinationTaskObservation {
    readonly taskId: string;
    readonly state: "ready" | "working" | "blocked" | "completed" | "failed";
    readonly priority: number;
    readonly waitingOnTaskIds: readonly string[];
    readonly progressToken: string;
    readonly previousProgressToken: string;
    readonly lastProgressAt: string;
    readonly lastHeartbeatAt: string;
    readonly workerId: string;
    readonly claimExpiresAt: string;
}
export interface CoordinationFault {
    readonly taskId: string;
    readonly kind: CoordinationFaultKind;
    readonly relatedTaskIds: readonly string[];
    readonly reason: string;
}
export declare function detectCoordinationFaults(observations: readonly CoordinationTaskObservation[], now: string, noProgressAfterMs: number): readonly CoordinationFault[];
export declare function coordinationRecoveryDisposition(ownerBoundaryRequired: boolean): CoordinationRecoveryDisposition;
export type WorkloadReplayEventKind = "scheduler" | "dispatch" | "claim" | "retry" | "conflict" | "barrier" | "recovery";
export interface WorkloadReplayEvent {
    readonly sequence: number;
    readonly kind: WorkloadReplayEventKind;
    readonly inputHash: string;
    readonly outputHash: string;
    readonly chosenValue: string;
}
export interface WorkloadReplayResult {
    readonly matchedRepresentativeClasses: true;
    readonly transcript: readonly string[];
    readonly protectedSideEffectsExecuted: false;
}
export declare function replayAgencyWorkloadFixture(events: readonly WorkloadReplayEvent[]): WorkloadReplayResult;
export type LogicalLeadScopeKind = "portfolio" | "project" | "department" | "mission";
export type LogicalLeadHandoffState = "stable" | "handoff_pending" | "handed_off" | "failed_over";
export interface LogicalLeadAssignment {
    readonly assignmentId: string;
    readonly scopeKind: LogicalLeadScopeKind;
    readonly scopeId: string;
    readonly mission: string;
    readonly capabilities: readonly string[];
    readonly authorityEnvelope: readonly string[];
    readonly currentHolder: string;
    readonly handoffState: LogicalLeadHandoffState;
    readonly evidenceRefs: readonly string[];
    readonly decisionRefs: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly nextAction: string;
    readonly version: number;
}
export declare function validateLogicalLeadAssignment(assignment: LogicalLeadAssignment): LogicalLeadAssignment;
export declare function handoffLogicalLead(assignment: LogicalLeadAssignment, replacementHolder: string, evidenceRef: string): LogicalLeadAssignment;
export declare function failoverLogicalLead(assignment: LogicalLeadAssignment, replacementHolder: string, evidenceRef: string): LogicalLeadAssignment;
