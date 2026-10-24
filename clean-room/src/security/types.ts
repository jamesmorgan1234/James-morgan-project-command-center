import type { EnvironmentName } from "../kernel/config.js";

export const ASSURANCE_LEVELS = ["anonymous", "authenticated", "passkey_uv", "fresh_passkey_uv"] as const;
export type AssuranceLevel = (typeof ASSURANCE_LEVELS)[number];

export type SessionState = "active" | "locked" | "revoked" | "expired";
export type DeviceTrustState = "unknown" | "trusted" | "revoked";
export type RiskClass = "low" | "medium" | "high" | "critical";
export type SecretReferenceState = "configured" | "healthy" | "degraded" | "revoked" | "expired";

const ASSURANCE_RANK: Readonly<Record<AssuranceLevel, number>> = Object.freeze({
  anonymous: 0,
  authenticated: 1,
  passkey_uv: 2,
  fresh_passkey_uv: 3
});

export function assuranceAtLeast(actual: AssuranceLevel, required: AssuranceLevel): boolean {
  return ASSURANCE_RANK[actual] >= ASSURANCE_RANK[required];
}

export function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

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
