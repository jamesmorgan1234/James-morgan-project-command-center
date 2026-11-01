import type { AgencyTask } from "./types.js";
export interface ScheduledTask extends AgencyTask {
    readonly priority: number;
    readonly createdSequence: number;
    readonly affinityKeys: readonly string[];
    readonly antiAffinityKeys: readonly string[];
}
export interface FairScheduledTask extends ScheduledTask {
    readonly waitRounds: number;
}
export interface DependencyGraphProof {
    readonly taskCount: number;
    readonly edgeCount: number;
    readonly acyclic: true;
}
export declare function validateDependencyGraph(tasks: readonly ScheduledTask[]): DependencyGraphProof;
export declare function readyTasks(tasks: readonly ScheduledTask[]): readonly ScheduledTask[];
export declare function fairReadyTasks(tasks: readonly FairScheduledTask[], starvationThresholdRounds: number): readonly FairScheduledTask[];
export declare function advanceSchedulingRound(tasks: readonly FairScheduledTask[], selectedTaskIds: readonly string[], starvationThresholdRounds: number): readonly FairScheduledTask[];
export declare function safeSteal(candidate: ScheduledTask, workerCapabilities: readonly string[], heldAntiAffinity: readonly string[]): boolean;
