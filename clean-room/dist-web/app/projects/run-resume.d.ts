/** Run resumption: trustworthy plans, evidence-linked progress and no recreation. */
export declare function assertTrustworthyPlan(plan: {
    readonly tasks: readonly {
        readonly verified: boolean;
    }[];
}): void;
export declare function taskWeight(task: {
    readonly weight: number | null;
}): number;
export declare function linkProgressToEvidence(progress: {
    readonly evidenceIds: readonly string[];
}): void;
export declare function checkpointReverify(downstream: readonly {
    readonly id: string;
}[]): readonly string[];
export declare function resumeSameRun(runId: string, blockerTaskId: string): {
    readonly runId: string;
    readonly resumeAt: string;
};
export declare function assertNoRunRecreation(before: string, after: string): void;
export declare function assertNoProjectSwitch(before: string, after: string): void;
export declare function smallestBlockedOperation(tasks: readonly {
    readonly id: string;
    readonly size: number;
}[]): string;
