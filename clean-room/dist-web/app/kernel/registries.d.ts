/**
 * Extensible registries and registration templates.
 *
 * One versioned registry shape owns discovery for tools, security actions,
 * deployment targets and voice providers. Each registry enforces its own contract
 * before an entry can be discovered, and the template factories define what a new
 * project type or agent capability must declare.
 */
export interface RegistryEntry {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
}
export declare class TypedRegistry<T extends RegistryEntry> {
    #private;
    constructor(validate: (item: T) => void);
    register(item: T): T;
    get(key: string): T | undefined;
    list(): readonly T[];
    get size(): number;
}
export type ToolRisk = "low" | "medium" | "high" | "protected";
export interface ToolContract extends RegistryEntry {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly capabilityKeys: readonly string[];
    readonly risk: ToolRisk;
}
export declare class ToolRegistry extends TypedRegistry<ToolContract> {
    constructor();
}
export interface SecurityActionContract extends RegistryEntry {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly protectedAction: boolean;
    readonly requiresApproval: boolean;
}
export declare class SecurityActionRegistry extends TypedRegistry<SecurityActionContract> {
    constructor();
}
export type DeploymentEnvironment = "development" | "preview" | "production";
export interface DeploymentTargetContract extends RegistryEntry {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly environment: DeploymentEnvironment;
    readonly productionAuthorizationRequired: boolean;
}
export declare class DeploymentTargetRegistry extends TypedRegistry<DeploymentTargetContract> {
    constructor();
}
export interface VoiceProviderContract extends RegistryEntry {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly available: boolean;
    readonly permission: "granted" | "denied" | "prompt";
}
export declare class VoiceProviderRegistry extends TypedRegistry<VoiceProviderContract> {
    constructor();
}
export interface ProjectTypeTemplate {
    readonly key: string;
    readonly version: 1;
    readonly requiredSections: readonly string[];
    readonly capabilityKeys: readonly string[];
}
export declare function projectTypeTemplate(input: {
    key: string;
    requiredSections: readonly string[];
    capabilityKeys: readonly string[];
}): Readonly<ProjectTypeTemplate>;
export interface AgentCapabilityTemplate {
    readonly key: string;
    readonly version: 1;
    readonly capabilityKeys: readonly string[];
    readonly risk: ToolRisk;
}
export declare function agentCapabilityTemplate(input: {
    key: string;
    capabilityKeys: readonly string[];
    risk: ToolRisk;
}): Readonly<AgentCapabilityTemplate>;
