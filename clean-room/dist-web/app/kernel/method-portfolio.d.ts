import { type RegistryRecord } from "./registry.js";
export type MethodLifecycle = "experimental" | "active" | "deprecated" | "retired";
export type MethodCostClass = "free" | "paid" | "unknown";
export type MethodPrivacyClass = "local" | "private_remote" | "remote";
export type MethodDataSensitivity = "internal" | "sensitive" | "protected" | "secret";
export type MethodResourceClass = "low" | "medium" | "high";
export type MethodOptimization = "quality" | "latency" | "reliability" | "balanced";
export interface CapabilityMethodContract extends RegistryRecord {
    readonly capabilityKey: string;
    readonly implementationVersionRef: string;
    readonly lifecycle: MethodLifecycle;
    readonly applicabilityScopeKeys: readonly string[];
    readonly contraindications: readonly string[];
    readonly prerequisites: readonly string[];
    readonly qualityScore: number;
    readonly calibrationScore: number;
    readonly latencyMs: number;
    readonly resourceClass: MethodResourceClass;
    readonly costClass: MethodCostClass;
    readonly privacyClass: MethodPrivacyClass;
    readonly maxDataSensitivity: MethodDataSensitivity;
    readonly securityAssurance: number;
    readonly reliabilityScore: number;
    readonly benchmarkEvidenceIds: readonly string[];
    readonly outcomeEvidenceIds: readonly string[];
    readonly provenanceEvidenceIds: readonly string[];
    readonly fallbackMethodIds: readonly string[];
    readonly rollbackEvidenceId: string;
    readonly revalidatedAt: string;
    readonly revalidateAfter: string;
}
export interface MethodRoutingRequest {
    readonly capabilityKey: string;
    readonly scopeKeys: readonly string[];
    readonly conditions: readonly string[];
    readonly availablePrerequisites: readonly string[];
    readonly allowPaid: boolean;
    readonly maxPrivacy: MethodPrivacyClass;
    readonly dataSensitivity: MethodDataSensitivity;
    readonly maxResourceClass: MethodResourceClass;
    readonly allowExperimental: boolean;
    readonly optimization: MethodOptimization;
    readonly now: string;
}
export declare function validateCapabilityMethodContract(method: CapabilityMethodContract): void;
export declare class CapabilityMethodPortfolio {
    #private;
    register(method: CapabilityMethodContract): void;
    replace(method: CapabilityMethodContract, expectedVersion: number): void;
    get(methodId: string): CapabilityMethodContract | undefined;
    list(): readonly CapabilityMethodContract[];
    methodsFor(capabilityKey: string): readonly CapabilityMethodContract[];
    route(request: MethodRoutingRequest): CapabilityMethodContract | undefined;
    fallbackFor(methodId: string, request: MethodRoutingRequest): CapabilityMethodContract | undefined;
}
