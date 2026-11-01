import type { EnvironmentName } from "../kernel/config.js";
export type SourceTrust = "owner_authoritative" | "verified_provider" | "historical_evidence" | "untrusted_external";
export type SourceInstructionPolicy = "data_only" | "owner_statement_candidate";
export type SourceLifecycle = "active" | "degraded" | "unavailable" | "tombstoned";
export type SourceSensitivity = "internal" | "sensitive" | "protected" | "secret";
export interface SourceScope {
    readonly ownerId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
}
export interface SourceIdentity {
    readonly id: string;
    readonly providerKey: string;
    readonly sourceType: string;
    readonly externalStableId: string;
    readonly scope: SourceScope;
    readonly trust: SourceTrust;
    readonly instructionPolicy: SourceInstructionPolicy;
    readonly sensitivity: SourceSensitivity;
    readonly purpose: readonly string[];
    readonly retentionClass: string;
    readonly lifecycle: SourceLifecycle;
    readonly version: number;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export declare function validateSourceIdentity(source: SourceIdentity): SourceIdentity;
export declare class SourceRegistry {
    #private;
    register(source: SourceIdentity): SourceIdentity;
    replace(source: SourceIdentity, expectedVersion: number): SourceIdentity;
    get(id: string): SourceIdentity | undefined;
    list(): readonly SourceIdentity[];
}
export type SourceAuthorityDecision = Readonly<{
    action: "prefer_left" | "prefer_right";
    reason: string;
}> | Readonly<{
    action: "abstain_conflict";
    reason: string;
}>;
export declare function compareSourceAuthority(left: SourceIdentity, right: SourceIdentity): SourceAuthorityDecision;
