export interface PersonalBackupRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly domain: string;
  readonly sensitivityRank: number;
  readonly contentHash: string;
  readonly provenanceRefs: readonly string[];
}

export interface PersonalBackupBundle {
  readonly id: string;
  readonly ownerId: string;
  readonly records: readonly PersonalBackupRecord[];
}

export interface PersonalRestorePolicy {
  readonly ownerId: string;
  readonly allowedDomains: readonly string[];
  readonly maxSensitivityRank: number;
}

export interface PersonalRestoreDryRun {
  readonly acceptedIds: readonly string[];
  readonly rejected: readonly Readonly<{ id: string; reason: string }>[];
}

export function dryRunPersonalRestore(bundle: PersonalBackupBundle, policy: PersonalRestorePolicy): PersonalRestoreDryRun {
  const accepted: string[] = [];
  const rejected: Readonly<{ id: string; reason: string }>[] = [];
  const domains = new Set(policy.allowedDomains);
  for (const record of bundle.records) {
    if (bundle.ownerId !== policy.ownerId || record.ownerId !== policy.ownerId) { rejected.push(Object.freeze({ id: record.id, reason: "owner_boundary_mismatch" })); continue; }
    if (!domains.has(record.domain)) { rejected.push(Object.freeze({ id: record.id, reason: "domain_not_authorized" })); continue; }
    if (record.sensitivityRank > policy.maxSensitivityRank) { rejected.push(Object.freeze({ id: record.id, reason: "sensitivity_boundary" })); continue; }
    if (!record.contentHash.trim() || record.provenanceRefs.length === 0) { rejected.push(Object.freeze({ id: record.id, reason: "missing_integrity_or_provenance" })); continue; }
    accepted.push(record.id);
  }
  return Object.freeze({ acceptedIds: Object.freeze(accepted), rejected: Object.freeze(rejected) });
}
