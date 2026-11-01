export interface ScheduledAutomation {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly scheduleRef: string;
    readonly enabled: boolean;
    readonly actionPolicy: "notification_only" | "safe_action";
    readonly providerHealth: "available" | "degraded" | "unavailable";
    readonly protectedActionsAuthorized: false;
}
export interface AutomationAuthoritySnapshot {
    readonly authorizationRef: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly policyEpoch: number;
    readonly currentPolicyEpoch: number;
    readonly revocationEpoch: number;
    readonly currentRevocationEpoch: number;
    readonly revoked: boolean;
}
export interface AutomationExecution {
    readonly automationId: string;
    readonly scheduledFor: string;
    readonly startedAt: string;
    readonly state: "started" | "completed" | "failed";
    readonly evidenceRefs: readonly string[];
    readonly authorityRef?: string;
    readonly agencyExecutionRef?: string;
}
export interface AutomationRegistrySnapshot {
    readonly schemaVersion: "cc-automation-registry-v1";
    readonly automations: readonly ScheduledAutomation[];
    readonly executions: readonly AutomationExecution[];
}
export declare function planAutomationCatchUp(scheduledFor: readonly string[], completedOccurrenceKeys: readonly string[], maxCatchUp: number): readonly string[];
export declare class AutomationRegistry {
    #private;
    static rehydrate(snapshot: AutomationRegistrySnapshot): AutomationRegistry;
    register(input: ScheduledAutomation): void;
    begin(automationId: string, scheduledFor: string, startedAt: string, authority?: AutomationAuthoritySnapshot, agencyExecutionRef?: string): string;
    finish(executionKey: string, state: "completed" | "failed", evidenceRefs: readonly string[]): void;
    execution(executionKey: string): AutomationExecution | undefined;
    exportSnapshot(): AutomationRegistrySnapshot;
}
