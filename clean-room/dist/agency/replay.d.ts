export interface OrchestrationChoice {
    readonly sequence: number;
    readonly kind: "scheduler" | "policy" | "model" | "provider" | "time" | "random" | "retry" | "conflict" | "barrier" | "recovery";
    readonly inputHash: string;
    readonly outputHash: string;
    readonly chosenValue: string;
}
export declare function validateReplayLog(choices: readonly OrchestrationChoice[]): void;
export declare function replayChoices(choices: readonly OrchestrationChoice[]): readonly string[];
