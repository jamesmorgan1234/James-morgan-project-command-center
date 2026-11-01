export function replacementDisposition(dependency) {
    if (dependency.coreRewriteRequired)
        throw new Error("replaceable dependency contract cannot require core rewrite");
    if (dependency.health === "available")
        return "keep";
    if (dependency.health === "degraded")
        return "degrade_locally";
    return "replace";
}
import { assertProviderReplacement } from '../data/recovery.js';
import { assertRecoveryAccess, assertRecoveryEvidence, recoveryImmutable, recoveryList, recoveryRef, recoveryVersion, requireRecovery } from './contracts.js';
export function assessScopedReplacement(a, p, fabric) { assertRecoveryAccess(a, 'replace', p.scope, p.id); assertRecoveryEvidence(a, p.scope, p.evidenceIds); recoveryVersion(p.oldVersion); recoveryVersion(p.newVersion); requireRecovery(p.newVersion > p.oldVersion, 'replacement_version'); [p.id, p.dependencyId, p.oldAdapterRef, p.newAdapterRef, p.rollbackRef].forEach(recoveryRef); recoveryList(p.requiredCapabilities); const node = fabric.getNode(p.dependencyId, p.oldVersion); requireRecovery(node && node.ownerId === p.scope.ownerId && (node.scopeRef === p.scope.projectId || node.scopeRef === p.scope.companyId || node.privacy === 'ecosystem_shared'), 'replacement_dependency_scope'); const reasons = []; if (p.cost !== 'free')
    reasons.push('cost_not_verified_free'); if (p.health !== 'available')
    reasons.push('candidate_not_available'); if (!p.compatible)
    reasons.push('compatibility_failed'); return recoveryImmutable({ plan: p, eligible: reasons.length === 0, reasons, affectedDependents: fabric.affectedDependents(p.dependencyId, p.newVersion).staleDependentRefs, canonicalOwnerRevalidationRequired: true, authorizationGranted: false }); }
/** Applies only to an explicitly supplied isolated canonical provider registry; no live connectors. */
export function replaceIsolatedProvider(a, p, fabric, registry, next) { requireRecovery(p.scope.environment !== 'production', 'replacement_production_forbidden'); requireRecovery(['ai', 'provider', 'storage', 'hosting', 'integration', 'model'].includes(p.kind), 'intelligence_replacement_requires_canonical_owner'); const assessment = assessScopedReplacement(a, p, fabric); requireRecovery(assessment.eligible, 'replacement_not_eligible'); const old = registry.get(p.dependencyId); requireRecovery(old && old.version === p.oldVersion && next.key === old.key && next.version === p.newVersion, 'replacement_canonical_identity'); assertProviderReplacement(old, next, p.requiredCapabilities, true); requireRecovery(next.scopes.every(s => old.scopes.includes(s)), 'replacement_cannot_expand_permissions'); assertRecoveryAccess(a, 'replace', p.scope, p.id); registry.replace(next, p.oldVersion); return recoveryImmutable({ ...assessment, oldProvider: old, newProvider: registry.get(next.key), rollbackRef: p.rollbackRef }); }
//# sourceMappingURL=replacement.js.map