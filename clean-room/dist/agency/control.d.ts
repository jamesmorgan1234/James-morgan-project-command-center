export interface RunControlState {
    readonly runId: string;
    readonly generation: number;
    readonly paused: boolean;
    readonly stopped: boolean;
    readonly killScope?: "run" | "project" | "agency";
}
export declare function requestPause(control: RunControlState): RunControlState;
export declare function requestStop(control: RunControlState, killScope?: "run" | "project" | "agency"): RunControlState;
export declare function assertLateResponseAllowed(control: RunControlState, responseGeneration: number): void;
