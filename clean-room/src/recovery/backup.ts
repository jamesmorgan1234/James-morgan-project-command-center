export interface BackupPolicy {
  readonly scopeKeys: readonly string[];
  readonly cadenceRef: string;
  readonly retentionRef: string;
  readonly encrypted: boolean;
  readonly integrityAlgorithm: "sha256";
  readonly protectedAssetRefs: readonly string[];
  readonly secretStrategy: "references_only" | "encrypted_separate";
}

export interface BackupManifest {
  readonly backupId: string;
  readonly createdAt: string;
  readonly policyHash: string;
  readonly contentHash: string;
  readonly itemCount: number;
  readonly sourceRefs: readonly string[];
}

export function validateBackup(policy: BackupPolicy, manifest: BackupManifest): BackupManifest {
  if (!policy.encrypted || policy.scopeKeys.length === 0 || !policy.cadenceRef.trim() || !policy.retentionRef.trim()) throw new Error("backup policy is incomplete or unencrypted");
  if (!manifest.backupId.trim() || !manifest.createdAt.includes("T") || !manifest.policyHash.trim() || !manifest.contentHash.trim() || manifest.itemCount < 0 || manifest.sourceRefs.length === 0) throw new Error("backup manifest lacks independent identity/integrity evidence");
  return Object.freeze({ ...manifest, sourceRefs: Object.freeze([...manifest.sourceRefs]) });
}
