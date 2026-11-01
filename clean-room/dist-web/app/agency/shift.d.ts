export interface WorkerHealth {
    readonly workerId: string;
    readonly projectId: string;
    readonly taskId: string;
    readonly state: "idle" | "working" | "blocked" | "failed";
    readonly lastHeartbeatAt: string;
}
export interface ShiftIncident {
    readonly workerId: string;
    readonly taskId: string;
    readonly kind: "stalled" | "failed" | "blocked";
    readonly ownerAttentionRequired: boolean;
}
export declare function inspectShift(workers: readonly WorkerHealth[], now: string, stallAfterMs: number): readonly ShiftIncident[];
export interface ShiftCoordinationFault {
    readonly taskId: string;
    readonly kind: string;
    readonly ownerBoundaryRequired: boolean;
}
export interface ShiftManagerInput {
    readonly workers: readonly WorkerHealth[];
    readonly queueDepth: number;
    readonly queueCapacity: number;
    readonly resourcePressure: number;
    readonly coordinationFaults: readonly ShiftCoordinationFault[];
    readonly ownerBoundaryTaskIds: readonly string[];
}
export interface ShiftManagerAssessment {
    readonly incidents: readonly ShiftIncident[];
    readonly queuePressure: number;
    readonly resourcePressure: number;
    readonly containmentRequired: boolean;
    readonly safeHandoffTaskIds: readonly string[];
    readonly recoverableFaultTaskIds: readonly string[];
    readonly ownerBoundaryTaskIds: readonly string[];
}
export declare function inspectShiftManager(input: ShiftManagerInput, now: string, stallAfterMs: number): ShiftManagerAssessment;
