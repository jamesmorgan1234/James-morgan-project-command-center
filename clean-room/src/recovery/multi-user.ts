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
    if (record.principalId !== record.ownerId && (record.resourceScopes.some(scope => !/^project:[a-z0-9_-]+:read$/.test(scope)) || record.roleKeys.some(role => !["viewer"].includes(role)))) throw new Error("future user cannot inherit owner-wide private scope");
  }
}

import {recoveryImmutable,recoveryList,recoveryRef,requireRecovery} from './contracts.js';
export interface DormantTenantContract {readonly tenantId:string;readonly principalId:string;readonly householdId:string;readonly role:'viewer'|'contributor';readonly projectIds:readonly string[];readonly status:'dormant'}
export interface SyntheticTenantProjection {readonly tenantId:string;readonly principalId:string;readonly householdId:string;readonly projectId:string;readonly classification:'synthetic'|'owner_private';readonly valueRef:string}
/** Pure synthetic design seam: never enrolls a user or inherits owner permissions/data. */
export function previewDormantTenant(contract:DormantTenantContract,records:readonly SyntheticTenantProjection[]){requireRecovery(contract.status==='dormant'&&['viewer','contributor'].includes(contract.role),'future_tenant_must_remain_dormant');for(const r of [contract.tenantId,contract.principalId,contract.householdId])requireRecovery(r.startsWith('synthetic:')&&r.length>10,'future_tenant_synthetic_identity');recoveryList(contract.projectIds,true);contract.projectIds.forEach(recoveryRef);const matches: SyntheticTenantProjection[]=[];const seen=new Set<string>();for(const r of records){requireRecovery(['synthetic','owner_private'].includes(r.classification),'future_tenant_classification');if(r.classification!=='synthetic'||r.tenantId!==contract.tenantId||r.principalId!==contract.principalId||r.householdId!==contract.householdId||!contract.projectIds.includes(r.projectId))continue;requireRecovery(r.valueRef.startsWith('synthetic:'),'future_tenant_private_reference');const key=JSON.stringify([r.projectId,r.valueRef]);requireRecovery(!seen.has(key),'future_tenant_duplicate');seen.add(key);matches.push(r);}return recoveryImmutable({contract,records:matches,activationAllowed:false as const,ownerPermissionsInherited:false as const});}
