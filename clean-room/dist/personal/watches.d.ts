export type WatchKind = "condition" | "event" | "webhook" | "project_state";
export interface ConditionWatch {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    /** Explicit trigger class; omitted legacy records are treated as condition watches. */
    readonly watchKind?: WatchKind;
    readonly conditionKey: string;
    readonly cadenceRef: string;
    readonly actionPolicy: "notification_only" | "safe_action";
    readonly protectedActionsAuthorized: false;
    readonly priorVerifiedState: boolean;
    readonly lastObservationId?: string;
    readonly lastVerifiedObservedAt?: string;
    readonly backoffUntil?: string;
}
export interface WatchObservation {
    readonly watchId: string;
    /** Optional provider assertion; when supplied it must match the durable watch class. */
    readonly watchKind?: WatchKind;
    readonly conditionMet: boolean;
    readonly verified: boolean;
    readonly sourceRefs: readonly string[];
    readonly observationId?: string;
    readonly observedAt?: string;
}
export interface WatchDecision {
    readonly fire: boolean;
    readonly reason: string;
    readonly protectedActionAuthorized: false;
}
export declare function nextWatchBackoffUntil(failedAt: string, consecutiveFailures: number, baseSeconds?: number, maxSeconds?: number): string;
export declare function evaluateWatch(watch: ConditionWatch, observation: WatchObservation): WatchDecision;
