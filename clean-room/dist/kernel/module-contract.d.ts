export type SecurityClass = "public" | "internal" | "sensitive" | "protected" | "secret";
export type ModuleActivation = "startup" | "on-demand" | "manual";
export type ModuleFailureBehavior = "fail-closed" | "isolate" | "degrade";
export interface ModuleContract {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly owner: string;
    readonly ownsData: readonly string[];
    readonly ownsCapabilities: readonly string[];
    readonly usesData: readonly string[];
    readonly usesCapabilities: readonly string[];
    readonly dependencies: readonly string[];
    readonly permissions: readonly string[];
    readonly routes: readonly string[];
    readonly events: readonly string[];
    readonly migrations: readonly string[];
    readonly healthCheckKey: string;
    readonly securityClass: SecurityClass;
    readonly activation: ModuleActivation;
    readonly failureBehavior: ModuleFailureBehavior;
    readonly canDisable: boolean;
    readonly canUninstall: boolean;
    readonly tests: readonly string[];
}
export declare function validateModuleContract(contract: ModuleContract): void;
export declare class ModuleRegistry {
    #private;
    install(contract: ModuleContract): void;
    register(contract: ModuleContract): void;
    replace(contract: ModuleContract, expectedVersion: number): void;
    enable(key: string, expectedVersion: number, nextVersion: number): ModuleContract;
    disable(key: string, expectedVersion: number, nextVersion: number): ModuleContract;
    assertDataAccess(moduleKey: string, dataKey: string): void;
    assertCapabilityAccess(moduleKey: string, capabilityKey: string): void;
    get(key: string): ModuleContract | undefined;
    list(): readonly ModuleContract[];
    uninstall(key: string, expectedVersion: number): ModuleContract;
    remove(key: string, expectedVersion: number): ModuleContract;
}
