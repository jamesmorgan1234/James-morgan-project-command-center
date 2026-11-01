/** Voice contracts: independence from Brain logic, listening state, confirmation, providers and logging. */
export declare function voiceIndependence(handlers: {
    readonly brain: boolean;
    readonly voice: boolean;
}): void;
export declare function listeningState(state: "idle" | "listening"): string;
export declare function ambiguityConfirmation(confidence: number): "confirm" | "proceed";
export declare function voiceProvider(provider: string, supported: readonly string[]): string;
export declare function handsFreeSummary(summary: string, maxSeconds: number): string;
export declare function voiceActionLog(originator: string): string;
