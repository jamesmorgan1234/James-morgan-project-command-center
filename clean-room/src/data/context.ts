import type { AssetSensitivity } from "./assets.js";

const SENSITIVITY_RANK: Readonly<Record<AssetSensitivity, number>> = Object.freeze({ internal: 0, sensitive: 1, protected: 2, secret: 3 });

export interface ContextSource {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly version: number;
  readonly sensitivity: AssetSensitivity;
  readonly sourceRef: string;
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
  readonly createdAt: string;
  readonly maxSensitivity: AssetSensitivity;
  readonly sources: readonly ContextSource[];
}): ContextSnapshot {
  const allowed = input.sources.filter((source) => {
    if (source.ownerId !== input.ownerId) return false;
    if (source.projectId && source.projectId !== input.projectId) return false;
    return SENSITIVITY_RANK[source.sensitivity] <= SENSITIVITY_RANK[input.maxSensitivity];
  }).map((source) => Object.freeze({ ...source, value: Object.freeze({ ...source.value }) }));
  return Object.freeze({ id: input.id, ownerId: input.ownerId, projectId: input.projectId, createdAt: input.createdAt, maxSensitivity: input.maxSensitivity, sourceIds: Object.freeze(allowed.map((source) => source.id)), sources: Object.freeze(allowed) });
}
