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
}

export function validatePersonalOperations(records: readonly PersonalOperationRecord[]): void {
  const identities = new Map<string, string>();
  for (const record of records) {
    if (!record.id.trim() || !record.ownerId.trim() || !record.title.trim() || !record.truthOwnerKey.trim() || !record.canonicalRef.trim()) throw new Error("Personal operation identity/truth owner/canonical ref are required");
    if (record.sourceRefs.length === 0) throw new Error("Personal operation requires provenance");
    const existingOwner = identities.get(record.canonicalRef);
    if (existingOwner && existingOwner !== record.truthOwnerKey) throw new Error(`Duplicate specialist truth ownership for ${record.canonicalRef}`);
    identities.set(record.canonicalRef, record.truthOwnerKey);
  }
}
