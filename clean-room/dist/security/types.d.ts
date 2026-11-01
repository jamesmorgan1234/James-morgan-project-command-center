import type { EnvironmentName } from "../kernel/config.js";
export declare const ASSURANCE_LEVELS: readonly ["anonymous", "authenticated", "passkey_uv", "fresh_passkey_uv"];
export type AssuranceLevel = (typeof ASSURANCE_LEVELS)[number];
export type SessionState = "active" | "locked" | "revoked" | "expired";
export type DeviceTrustState = "unknown" | "trusted" | "revoked";
export type RiskClass = "low" | "medium" | "high" | "critical";
export type SecretReferenceState = "configured" | "healthy" | "degraded" | "revoked" | "expired";
export declare function assuranceAtLeast(actual: AssuranceLevel, required: AssuranceLevel): boolean;
export declare function parseTimestamp(value: string, label: string): number;
export interface SecuritySubject {
    readonly ownerId: string;
    readonly sessionId: string;
    readonly deviceId?: string;
    readonly projectId?: string;
    readonly companyId?: string;
    readonly accountId?: string;
    readonly environment?: EnvironmentName;
    readonly machineIdentityId?: string;
    readonly delegationId?: string;
    readonly assurance: AssuranceLevel;
    readonly scopes: readonly string[];
    readonly lastVerifiedAt?: string;
    readonly policyEpoch?: number;
}
