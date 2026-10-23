import type { SpecialistProjectProfile } from "./contracts.js";

export interface SpecialistStateRecord {
  readonly projectId: string;
  readonly typeKey: string;
  readonly truthOwner: string;
  readonly canonicalRef: string;
  readonly providerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly status: "active" | "dormant" | "archived";
}

export function assertSpecialistIsolation(records: readonly SpecialistStateRecord[]): void {
  const canonical = new Map<string, SpecialistStateRecord>();
  for (const record of records) {
    if (!record.projectId.trim() || !record.truthOwner.trim() || !record.canonicalRef.trim() || record.sourceRefs.length === 0) throw new Error("specialist state requires identity/provenance");
    const prior = canonical.get(record.canonicalRef);
    if (prior && (prior.projectId !== record.projectId || prior.truthOwner !== record.truthOwner)) throw new Error("specialist truth ownership collision");
    canonical.set(record.canonicalRef, record);
  }
}

export function canReactivate(profile: SpecialistProjectProfile, availableProviderCapabilities: readonly string[]): boolean {
  return profile.contract.providerCapabilities.every((capability) => availableProviderCapabilities.includes(capability));
}

export function renameSpecialist(profile: SpecialistProjectProfile, displayName: string): SpecialistProjectProfile {
  if (!displayName.trim()) throw new Error("display name required");
  return Object.freeze({ ...profile, displayName });
}
