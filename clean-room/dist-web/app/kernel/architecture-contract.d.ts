export interface ArchitectureResponsibilityContract {
    readonly responsibility: string;
    readonly owner: string;
    readonly truthSource: string;
    readonly expandable: boolean;
    readonly extensionPath?: string;
    readonly critical: boolean;
    readonly recoveryPath?: string;
    readonly failureBehavior: string;
    readonly verificationPath: string;
}
declare const CORE_ARCHITECTURE_RESPONSIBILITIES: readonly ["startup", "router", "renderer", "scroll", "command-runtime", "side-effects", "module-registry", "capability-registry", "configuration", "governance", "authority-ledger", "evidence"];
export declare function validateArchitectureResponsibility(contract: ArchitectureResponsibilityContract): ArchitectureResponsibilityContract;
export declare class ArchitectureResponsibilityRegistry {
    #private;
    register(contract: ArchitectureResponsibilityContract): ArchitectureResponsibilityContract;
    get(responsibility: string): ArchitectureResponsibilityContract | undefined;
    list(): readonly ArchitectureResponsibilityContract[];
    assertCoreCoverage(): void;
}
export declare function createCoreArchitectureResponsibilityRegistry(): ArchitectureResponsibilityRegistry;
export { CORE_ARCHITECTURE_RESPONSIBILITIES };
