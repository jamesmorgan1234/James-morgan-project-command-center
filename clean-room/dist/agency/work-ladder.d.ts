export type WorkRung = "normal_chat" | "luna_high" | "sol_light" | "sol_medium";
export type FailureClass = "transient_network" | "provider_timeout" | "provider_unavailable" | "quota_unavailable" | "credentials" | "missing_input" | "user_boundary" | "protected_boundary" | "capability_insufficient" | "execution_complexity" | "verification_failed";
export interface WorkAuthorization {
    readonly projectId: string;
    readonly runId: string;
    readonly projectAuto: boolean;
    readonly workAuthorized: boolean;
    readonly maxRung: WorkRung;
    readonly protectedActionsAuthorized: false;
}
export interface LadderDecision {
    readonly action: "stay" | "retry_once" | "escalate" | "block";
    readonly rung: WorkRung;
    readonly reason: string;
}
export declare function decideWorkLadder(current: WorkRung, failure: FailureClass, authorization: WorkAuthorization, transientRetriesUsed: number): LadderDecision;
