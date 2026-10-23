export interface FuturePrincipalBoundary {
  readonly ownerId: string;
  readonly principalId: string;
  readonly tenantId: string;
  readonly roleKeys: readonly string[];
  readonly resourceScopes: readonly string[];
}

export function assertFuturePrincipalIsolation(records: readonly FuturePrincipalBoundary[]): void {
  for (const record of records) {
    if (!record.ownerId.trim() || !record.principalId.trim() || !record.tenantId.trim()) throw new Error("future principal boundary incomplete");
    if (record.principalId !== record.ownerId && record.resourceScopes.includes("owner:*")) throw new Error("future user cannot inherit owner-wide private scope");
  }
}
