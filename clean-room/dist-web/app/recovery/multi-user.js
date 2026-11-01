export function assertFuturePrincipalIsolation(records) {
    for (const record of records) {
        if (!record.ownerId.trim() || !record.principalId.trim() || !record.tenantId.trim())
            throw new Error("future principal boundary incomplete");
        if (record.principalId !== record.ownerId && (record.resourceScopes.some(scope => !/^project:[a-z0-9_-]+:read$/.test(scope)) || record.roleKeys.some(role => !["viewer"].includes(role))))
            throw new Error("future user cannot inherit owner-wide private scope");
    }
}
import { recoveryImmutable, recoveryList, recoveryRef, requireRecovery } from './contracts.js';
/** Pure synthetic design seam: never enrolls a user or inherits owner permissions/data. */
export function previewDormantTenant(contract, records) { requireRecovery(contract.status === 'dormant' && ['viewer', 'contributor'].includes(contract.role), 'future_tenant_must_remain_dormant'); for (const r of [contract.tenantId, contract.principalId, contract.householdId])
    requireRecovery(r.startsWith('synthetic:') && r.length > 10, 'future_tenant_synthetic_identity'); recoveryList(contract.projectIds, true); contract.projectIds.forEach(recoveryRef); const matches = []; const seen = new Set(); for (const r of records) {
    requireRecovery(['synthetic', 'owner_private'].includes(r.classification), 'future_tenant_classification');
    if (r.classification !== 'synthetic' || r.tenantId !== contract.tenantId || r.principalId !== contract.principalId || r.householdId !== contract.householdId || !contract.projectIds.includes(r.projectId))
        continue;
    requireRecovery(r.valueRef.startsWith('synthetic:'), 'future_tenant_private_reference');
    const key = JSON.stringify([r.projectId, r.valueRef]);
    requireRecovery(!seen.has(key), 'future_tenant_duplicate');
    seen.add(key);
    matches.push(r);
} return recoveryImmutable({ contract, records: matches, activationAllowed: false, ownerPermissionsInherited: false }); }
//# sourceMappingURL=multi-user.js.map