import type { EnvironmentName } from "../kernel/config.js";
import type { AssetSensitivity } from "./assets.js";
import type { SourceTrust } from "./sources.js";

const SENSITIVITY_RANK: Readonly<Record<AssetSensitivity, number>> = Object.freeze({ internal: 0, sensitive: 1, protected: 2, secret: 3 });

export interface ContextSource {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly companyId?: string;
  readonly accountId?: string;
  readonly environment?: EnvironmentName;
  readonly version: number;
  readonly sensitivity: AssetSensitivity;
  readonly sourceRef: string;
  readonly sourceTrust?: SourceTrust;
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
  readonly sources: readonly ContextSource[];
}): ContextSnapshot {
  const now = Date.parse(input.createdAt);
  const allowed = input.sources.filter((source) => {
    if (source.ownerId !== input.ownerId) return false;
    if (source.projectId && source.projectId !== input.projectId) return false;
    if (input.companyId && source.companyId && source.companyId !== input.companyId) return false;
    if (input.accountId && source.accountId && source.accountId !== input.accountId) return false;
    if (input.environment && source.environment && source.environment !== input.environment) return false;
    if (input.purpose && source.purpose && !source.purpose.includes(input.purpose)) return false;
    if (source.retracted) return false;
    if (source.staleAfter && Number.isFinite(now) && now >= Date.parse(source.staleAfter)) return false;
    return SENSITIVITY_RANK[source.sensitivity] <= SENSITIVITY_RANK[input.maxSensitivity];
  }).map((source) => Object.freeze({ ...source, ...(source.purpose ? { purpose: Object.freeze([...source.purpose]) } : {}), value: Object.freeze({ ...source.value }) }));
  return Object.freeze({ id: input.id, ownerId: input.ownerId, projectId: input.projectId, createdAt: input.createdAt, maxSensitivity: input.maxSensitivity, sourceIds: Object.freeze(allowed.map((source) => source.id)), sources: Object.freeze(allowed) });
}
