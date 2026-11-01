export interface AgencyExecutor {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly environments: readonly ("normal_chat" | "work" | "deterministic")[];
    readonly capabilities: readonly string[];
    readonly projectTypeKeys: readonly string[];
    readonly permissionScopes: readonly string[];
    readonly costClass: "free" | "paid" | "unknown";
    readonly health: "available" | "degraded" | "unavailable";
    readonly verificationStrategy: "self_evidence" | "independent" | "external";
    readonly maxRisk: "low" | "medium" | "high";
}
export declare class AgencyExecutorRegistry {
    #private;
    register(executor: AgencyExecutor): void;
    remove(key: string, expectedVersion: number): AgencyExecutor;
    eligible(input: {
        capability: string;
        projectTypeKey: string;
        environment: "normal_chat" | "work" | "deterministic";
        risk: "low" | "medium" | "high" | "critical";
        allowPaid: boolean;
    }): readonly AgencyExecutor[];
    list(): readonly AgencyExecutor[];
}
