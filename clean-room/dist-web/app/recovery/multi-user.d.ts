export interface FuturePrincipalBoundary {
    readonly ownerId: string;
    readonly principalId: string;
    readonly tenantId: string;
    readonly roleKeys: readonly string[];
    readonly resourceScopes: readonly string[];
}
export declare function assertFuturePrincipalIsolation(records: readonly FuturePrincipalBoundary[]): void;
export interface DormantTenantContract {
    readonly tenantId: string;
    readonly principalId: string;
    readonly householdId: string;
    readonly role: 'viewer' | 'contributor';
    readonly projectIds: readonly string[];
    readonly status: 'dormant';
}
export interface SyntheticTenantProjection {
    readonly tenantId: string;
    readonly principalId: string;
    readonly householdId: string;
    readonly projectId: string;
    readonly classification: 'synthetic' | 'owner_private';
    readonly valueRef: string;
}
/** Pure synthetic design seam: never enrolls a user or inherits owner permissions/data. */
export declare function previewDormantTenant(contract: DormantTenantContract, records: readonly SyntheticTenantProjection[]): {
    contract: DormantTenantContract;
    records: SyntheticTenantProjection[];
    activationAllowed: false;
    ownerPermissionsInherited: false;
};
