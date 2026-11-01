import type { EnvironmentName } from "../kernel/config.js";
import type { AssetSensitivity } from "./assets.js";
import type { SourceTrust } from "./sources.js";
export type ContextLifecycle = "active" | "stale" | "superseded" | "retracted";
export interface ContextSource {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
    readonly version: number;
    readonly contractVersion?: number;
    readonly sensitivity: AssetSensitivity;
    readonly sourceRef: string;
    readonly sourceTrust?: SourceTrust;
    readonly authorityRef?: string;
    readonly confidence?: number;
    readonly lifecycle?: ContextLifecycle;
    readonly entityId?: string;
    readonly subsystemId?: string;
    readonly applicabilityRefs?: readonly string[];
    readonly lineageRefs?: readonly string[];
    readonly purpose?: readonly string[];
    readonly staleAfter?: string;
    readonly retracted?: boolean;
    readonly value: Readonly<Record<string, unknown>>;
}
export interface ContextSnapshot {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly createdAt: string;
    readonly maxSensitivity: AssetSensitivity;
    readonly entityId?: string;
    readonly subsystemId?: string;
    readonly contractVersion?: number;
    readonly sourceIds: readonly string[];
    readonly sources: readonly ContextSource[];
}
export declare function createContextSnapshot(input: {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly companyId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
    readonly purpose?: string;
    readonly createdAt: string;
    readonly maxSensitivity: AssetSensitivity;
    readonly entityId?: string;
    readonly subsystemId?: string;
    readonly requiredContractVersion?: number;
    readonly authorizedAuthorityRefs?: readonly string[];
    readonly requiredApplicabilityRefs?: readonly string[];
    readonly minimumConfidence?: number;
    readonly sources: readonly ContextSource[];
}): ContextSnapshot;
