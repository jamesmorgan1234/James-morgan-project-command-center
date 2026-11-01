import type { CapabilityTruth, EnumerationCapability } from "./refresh.js";
export type ProviderCost = "free" | "paid" | "unknown";
export type ProviderHealth = "available" | "degraded" | "unavailable" | "unconfigured";
export type ProviderFailureMode = "fail_closed" | "read_only" | "degraded";
export type ProviderCompleteness = "unknown" | "partial" | "complete";
export type ProviderTrust = "unrated" | "low" | "medium" | "high" | "authoritative";
export type ProviderReachability = "unknown" | "reachable" | "degraded" | "unreachable";
export interface ProviderReliability {
    readonly successRate?: number;
    readonly sampleSize?: number;
    readonly lastFailureAt?: string;
}
export interface ProviderObligation {
    readonly kind: string;
    readonly dueAt?: string;
    readonly blocking?: boolean;
}
export interface ProviderRevalidation {
    readonly required: boolean;
    readonly after?: string;
    readonly triggerRefs?: readonly string[];
}
export interface ProviderContract {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly authMode: "none" | "oauth" | "api_key_ref" | "session" | "passkey" | "custom_ref";
    readonly capabilities: readonly string[];
    readonly scopes: readonly string[];
    readonly freshnessSeconds: number;
    readonly cost: ProviderCost;
    readonly health: ProviderHealth;
    readonly verification: "none" | "source" | "tool_result" | "live_verified";
    readonly failureMode: ProviderFailureMode;
    readonly completeness?: ProviderCompleteness;
    readonly trust?: ProviderTrust;
    readonly reachability?: ProviderReachability;
    readonly reliability?: ProviderReliability;
    readonly obligations?: readonly ProviderObligation[];
    readonly revalidation?: ProviderRevalidation;
}
export declare class ProviderRegistry {
    #private;
    register(provider: ProviderContract): void;
    replace(provider: ProviderContract, expectedVersion: number): void;
    remove(key: string, expectedVersion: number): ProviderContract;
    forCapability(capability: string): readonly ProviderContract[];
    get(key: string): ProviderContract | undefined;
    assertCurrentScope(key: string, expectedVersion: number, scope: string): ProviderContract;
}
export interface ProviderCapabilitySnapshot {
    readonly id: string;
    readonly providerKey: string;
    readonly observedAt: string;
    readonly apiVersion?: string;
    readonly modelVersion?: string;
    readonly schemaFingerprint: string;
    readonly capabilityFingerprint: string;
    readonly capabilities: readonly string[];
    readonly enumeration: EnumerationCapability;
    readonly callbacks: CapabilityTruth;
    readonly pricing: ProviderCost;
    readonly verification: "tool_result" | "live_verified";
    readonly completeness?: ProviderCompleteness;
    readonly trust?: ProviderTrust;
    readonly reachability?: ProviderReachability;
    readonly reliability?: ProviderReliability;
    readonly obligationRefs?: readonly string[];
    readonly revalidationRequired?: boolean;
}
export type ProviderDrift = "none" | "compatible" | "breaking" | "pricing_unknown";
export declare function classifyProviderDrift(previous: ProviderCapabilitySnapshot | undefined, next: ProviderCapabilitySnapshot): ProviderDrift;
export declare class ProviderCapabilityLedger {
    #private;
    record(snapshot: ProviderCapabilitySnapshot): Readonly<{
        snapshot: ProviderCapabilitySnapshot;
        drift: ProviderDrift;
    }>;
    latest(providerKey: string): ProviderCapabilitySnapshot | undefined;
    history(providerKey: string): readonly ProviderCapabilitySnapshot[];
}
