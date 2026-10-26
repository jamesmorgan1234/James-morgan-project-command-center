export type PersonalOperationKind = "household" | "errand" | "shopping" | "vehicle" | "travel" | "obligation";

export interface PersonalOperationRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly kind: PersonalOperationKind;
  readonly title: string;
  readonly truthOwnerKey: string;
  readonly canonicalRef: string;
  readonly specialistProjectId?: string;
  readonly status: "open" | "planned" | "done" | "cancelled";
  readonly sourceRefs: readonly string[];
  readonly sensitivityRank?: number;
}

export interface PersonalOperationViewRequest {
  readonly ownerId: string;
  readonly allowedKinds: readonly PersonalOperationKind[];
  readonly maxSensitivityRank: number;
  readonly allowedSpecialistProjectIds?: readonly string[];
}

export interface PersonalOperationProjection extends PersonalOperationRecord {
  readonly readOnlyProjection: boolean;
  readonly sensitivityRank: number;
}

function sensitivity(record: PersonalOperationRecord): number {
  const value = record.sensitivityRank ?? 1;
  if (!Number.isInteger(value) || value < 0 || value > 4) throw new Error("Personal operation sensitivityRank must be an integer from 0 to 4");
  return value;
}

export function validatePersonalOperations(records: readonly PersonalOperationRecord[]): void {
  const identities = new Map<string, string>();
  for (const record of records) {
    if (!record.id.trim() || !record.ownerId.trim() || !record.title.trim() || !record.truthOwnerKey.trim() || !record.canonicalRef.trim()) throw new Error("Personal operation identity/truth owner/canonical ref are required");
    if (record.sourceRefs.length === 0 || record.sourceRefs.some((ref) => !ref.trim())) throw new Error("Personal operation requires provenance");
    sensitivity(record);
    if (record.truthOwnerKey !== "personal-core" && !record.specialistProjectId?.trim()) throw new Error("Specialist-owned personal operation must identify its specialist project");
    if (record.truthOwnerKey === "personal-core" && record.specialistProjectId !== undefined) throw new Error("Personal-core truth cannot masquerade as a specialist projection");
    const scopeKey = `${record.ownerId}:${record.canonicalRef}`;
    const existingOwner = identities.get(scopeKey);
    if (existingOwner && existingOwner !== record.truthOwnerKey) throw new Error(`Duplicate specialist truth ownership for ${record.canonicalRef}`);
    identities.set(scopeKey, record.truthOwnerKey);
  }
}

/**
 * Builds a privacy-minimized cross-domain view. Specialist records remain read-only pointers;
 * Personal Ops never becomes the truth owner merely because it displays them.
 */
export function projectPersonalOperations(request: PersonalOperationViewRequest, records: readonly PersonalOperationRecord[]): readonly PersonalOperationProjection[] {
  if (!request.ownerId.trim()) throw new Error("Personal operation view owner is required");
  if (!Number.isInteger(request.maxSensitivityRank) || request.maxSensitivityRank < 0 || request.maxSensitivityRank > 4) throw new Error("Personal operation view sensitivity bound must be 0..4");
  validatePersonalOperations(records);
  const kinds = new Set(request.allowedKinds);
  const specialistIds = request.allowedSpecialistProjectIds ? new Set(request.allowedSpecialistProjectIds) : undefined;
  return Object.freeze(records.filter((record) => {
    if (record.ownerId !== request.ownerId || !kinds.has(record.kind) || sensitivity(record) > request.maxSensitivityRank) return false;
    if (record.specialistProjectId !== undefined && specialistIds && !specialistIds.has(record.specialistProjectId)) return false;
    return true;
  }).map((record) => Object.freeze({ ...record, sensitivityRank: sensitivity(record), sourceRefs: Object.freeze([...record.sourceRefs]), readOnlyProjection: record.truthOwnerKey !== "personal-core" })));
}
