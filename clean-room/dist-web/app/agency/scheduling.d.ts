/** Scheduling and locks: scheduler role, device acceptance, immersive mode, control lock and resume. */
export declare function schedulerRole(role: "sole" | "continuation"): string;
export declare function assertInstalledDeviceAcceptance(evidence: {
    readonly physicalDevice: boolean;
}): void;
export declare function assertNoForcedImmersive(mode: "default" | "immersive"): void;
export declare function controlModeLock(mode: string, locked: string): void;
export declare function assertExternalVerification(selfReport: {
    readonly verified: boolean;
}, hasExternal: boolean): void;
export declare function resumePoint(tasks: readonly {
    readonly done: boolean;
}[]): number;
