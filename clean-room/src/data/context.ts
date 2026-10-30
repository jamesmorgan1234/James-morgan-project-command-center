import type { EnvironmentName } from "../kernel/config.js";
import type { AssetSensitivity } from "./assets.js";
import type { SourceTrust } from "./sources.js";
import { immutableJson } from "./canonical.js";

const SENSITIVITY_RANK: Readonly<Record<AssetSensitivity, number>> = Object.freeze({ internal: 0, sensitive: 1, protected: 2, secret: 3 });

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

export function createContextSnapshot(input: {
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
}): ContextSnapshot {
  const now = Date.parse(input.createdAt);
  if (!["internal", "sensitive", "protected"].includes(input.maxSensitivity)) throw new Error("Context exchange forbids secret or unsupported sensitivity ceilings");
  if (!Number.isFinite(now) || !input.id.trim() || !input.ownerId.trim() || !input.projectId.trim()) throw new Error("Context identity and creation timestamp are required");
  if (input.requiredContractVersion !== undefined && (!Number.isSafeInteger(input.requiredContractVersion) || input.requiredContractVersion < 1)) throw new Error("Context required contract version must be positive");
  if (input.minimumConfidence !== undefined && (!Number.isFinite(input.minimumConfidence) || input.minimumConfidence < 0 || input.minimumConfidence > 1)) throw new Error("Context minimum confidence must be between 0 and 1");
  if (input.authorizedAuthorityRefs !== undefined && (input.authorizedAuthorityRefs.some((ref) => !ref.trim()) || new Set(input.authorizedAuthorityRefs).size !== input.authorizedAuthorityRefs.length)) throw new Error("Context authority refs must be unique and nonblank");
  if (input.requiredApplicabilityRefs !== undefined && (input.requiredApplicabilityRefs.some((ref) => !ref.trim()) || new Set(input.requiredApplicabilityRefs).size !== input.requiredApplicabilityRefs.length)) throw new Error("Context applicability refs must be unique and nonblank");
  if (new Set(input.sources.map((source) => source.id)).size !== input.sources.length) throw new Error("Context source identities must be unique");
  const allowed = input.sources.filter((source) => {
    if (source.ownerId !== input.ownerId) return false;
    if (source.projectId && source.projectId !== input.projectId) return false;
    if (source.companyId && source.companyId !== input.companyId) return false;
    if (source.accountId && source.accountId !== input.accountId) return false;
    if (source.environment && source.environment !== input.environment) return false;
    if (source.purpose && (!input.purpose || !source.purpose.includes(input.purpose))) return false;
    if (!source.id.trim() || !source.sourceRef.trim() || !Number.isSafeInteger(source.version) || source.version < 1) return false;
    if (source.contractVersion !== undefined && (!Number.isSafeInteger(source.contractVersion) || source.contractVersion < 1)) return false;
    if (input.requiredContractVersion !== undefined && source.contractVersion !== input.requiredContractVersion) return false;
    if (source.authorityRef !== undefined && !source.authorityRef.trim()) return false;
    if (input.authorizedAuthorityRefs !== undefined && (!source.authorityRef || !input.authorizedAuthorityRefs.includes(source.authorityRef))) return false;
    if (source.confidence !== undefined && (!Number.isFinite(source.confidence) || source.confidence < 0 || source.confidence > 1)) return false;
    if (input.minimumConfidence !== undefined && (source.confidence === undefined || source.confidence < input.minimumConfidence)) return false;
    if (source.lifecycle !== undefined && source.lifecycle !== "active") return false;
    if (source.entityId !== undefined && input.entityId !== undefined && source.entityId !== input.entityId) return false;
    if (source.subsystemId !== undefined && input.subsystemId !== undefined && source.subsystemId !== input.subsystemId) return false;
    if (source.applicabilityRefs !== undefined && (source.applicabilityRefs.some((ref) => !ref.trim()) || new Set(source.applicabilityRefs).size !== source.applicabilityRefs.length)) return false;
    if (input.requiredApplicabilityRefs !== undefined && !input.requiredApplicabilityRefs.every((ref) => source.applicabilityRefs?.includes(ref))) return false;
    if (source.lineageRefs !== undefined && (source.lineageRefs.some((ref) => !ref.trim()) || new Set(source.lineageRefs).size !== source.lineageRefs.length)) return false;
    if (source.retracted) return false;
    if (source.staleAfter !== undefined && (!Number.isFinite(Date.parse(source.staleAfter)) || now >= Date.parse(source.staleAfter))) return false;
    return SENSITIVITY_RANK[source.sensitivity] <= SENSITIVITY_RANK[input.maxSensitivity];
  }).map((source) => Object.freeze({
    ...source,
    ...(source.purpose ? { purpose: Object.freeze([...source.purpose]) } : {}),
    applicabilityRefs: source.applicabilityRefs === undefined ? undefined : Object.freeze([...source.applicabilityRefs]),
    lineageRefs: source.lineageRefs === undefined ? undefined : Object.freeze([...source.lineageRefs]),
    value: immutableJson(source.value) as Readonly<Record<string, unknown>>
  }));
  return Object.freeze({
    id: input.id,
    ownerId: input.ownerId,
    projectId: input.projectId,
    createdAt: input.createdAt,
    maxSensitivity: input.maxSensitivity,
    entityId: input.entityId,
    subsystemId: input.subsystemId,
    contractVersion: input.requiredContractVersion,
    sourceIds: Object.freeze(allowed.map((source) => source.id)),
    sources: Object.freeze(allowed)
  });
}
