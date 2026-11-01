export type ShellState = "cold" | "starting" | "hydrating" | "ready" | "offline_ready" | "degraded" | "failed";
export type StartupCondition = "no_local_state" | "valid_local_state" | "partially_migrated_state" | "corrupted_state" | "provider_disconnected" | "provider_stale" | "provider_unauthorized" | "browser_offline" | "stale_service_worker" | "failed_integrity_check";
export type StartupDisposition = "initialize" | "repair_then_initialize" | "degraded" | "recover" | "block";
export interface StartupPrerequisiteAssessment {
    readonly condition: StartupCondition;
    readonly disposition: StartupDisposition;
    readonly stateContractVerified: boolean;
    readonly routerMayInitialize: boolean;
    readonly validStateMayBePreserved: boolean;
    readonly recoverySurfaceRequired: boolean;
}
export declare function assessStartupCondition(condition: StartupCondition): StartupPrerequisiteAssessment;
export interface ShellBootstrapTrace {
    readonly startedAt: string;
    readonly completedAt?: string;
    readonly thresholdMs: number;
    readonly elapsedMs?: number;
    readonly condition: StartupCondition;
    readonly disposition: StartupDisposition;
}
export declare function shellBootstrapTrace(input: Readonly<{
    startedAt: string;
    completedAt?: string;
    thresholdMs: number;
    condition: StartupCondition;
}>): ShellBootstrapTrace;
export interface ShellModuleMount {
    readonly slot: string;
    readonly moduleKey: string;
}
export declare class ApplicationShell {
    #private;
    get state(): ShellState;
    transition(to: ShellState): void;
    mount(mount: ShellModuleMount): void;
    unmount(slot: string, moduleKey: string): void;
    listMounts(): readonly ShellModuleMount[];
}
