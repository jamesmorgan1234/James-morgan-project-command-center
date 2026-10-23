export interface SocialRecoveryRecord {
  readonly ownerId: string;
  readonly brandId: string;
  readonly accountId: string;
  readonly credentialRef: string;
  readonly providerState: "connected" | "disconnected" | "expired" | "revoked";
  readonly paidActionAuthorized: boolean;
  readonly sourceRefs: readonly string[];
}

export function assertSocialIsolation(records: readonly SocialRecoveryRecord[]): void {
  const byAccount = new Map<string, SocialRecoveryRecord>();
  for (const record of records) {
    if (!record.ownerId.trim() || !record.brandId.trim() || !record.accountId.trim() || !record.credentialRef.trim()) throw new Error("social recovery record missing stable identity or credential reference");
    if (record.sourceRefs.length === 0) throw new Error("social recovery record requires provenance");
    const prior = byAccount.get(record.accountId);
    if (prior && (prior.ownerId !== record.ownerId || prior.brandId !== record.brandId || prior.credentialRef !== record.credentialRef)) throw new Error("social account identity crosses owner/brand boundary");
    byAccount.set(record.accountId, record);
  }
}

export function assertPaidActionAllowed(record: SocialRecoveryRecord, exactAuthorizationRef?: string): void {
  if (!record.paidActionAuthorized || !exactAuthorizationRef?.trim()) throw new Error("paid social action is blocked without exact owner authorization");
  if (record.providerState !== "connected") throw new Error("paid action requires verified connected provider state");
}

export function recoveryAction(record: SocialRecoveryRecord): "none" | "reconnect" | "reauthorize" {
  if (record.providerState === "connected") return "none";
  if (record.providerState === "revoked") return "reauthorize";
  return "reconnect";
}
