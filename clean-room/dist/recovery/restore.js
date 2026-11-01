export function validateRestore(plan) {
    if (!plan.isolatedEnvironment)
        throw new Error("restore must run in isolated recovery environment");
    if (!plan.backupId.trim() || !plan.expectedContentHash.trim() || plan.expectedContentHash !== plan.observedContentHash)
        throw new Error("restore integrity mismatch");
    const ids = new Set(plan.items.map((item) => item.id));
    for (const item of plan.items) {
        if (!item.id.trim() || !item.kind.trim() || !item.contentHash.trim())
            throw new Error("restore item incomplete");
        if (!item.dependencyIds.every((id) => ids.has(id)))
            throw new Error("restore dependency missing");
    }
    return Object.freeze({ restored: plan.items.length, consistent: true });
}
import { evaluateRestoreRevalidation } from '../data/recovery.js';
import { verifyEncryptedBackup, validateRecoveryRecord } from './backup.js';
import { assertRecoveryAccess, assertRecoveryEvidence, recoveryDigest, recoveryImmutable, recoveryJson, recoveryScopeKey, recoveryTime, requireRecovery } from './contracts.js';
/** Isolated staging owner only. This cannot restore grants or activate canonical PIF registries. */
export class IsolatedRecoveryWorkspace {
    scope;
    #records = new Map();
    #operations = new Map();
    #revision = 0;
    constructor(scope) {
        this.scope = scope;
        this.scope = recoveryImmutable(scope);
        recoveryScopeKey(scope);
        requireRecovery(scope.environment !== 'production', 'production_workspace_forbidden');
    }
    get revision() { return this.#revision; }
    snapshot() { return recoveryImmutable([...this.#records.values()]); }
    receipt(id) { return this.#operations.get(id); }
    commit(expectedRevision, operationId, digest, records) {
        const old = this.#operations.get(operationId);
        if (old) {
            requireRecovery(old.digest === digest, 'recovery_idempotency_collision');
            requireRecovery(old.revision === this.#revision, 'recovery_operation_superseded');
            return old.revision;
        }
        requireRecovery(expectedRevision === this.#revision, 'recovery_stale_destination');
        const staged = new Map();
        for (const p of records) {
            validateRecoveryRecord(p.record);
            requireRecovery(recoveryScopeKey(p.record.scope) === recoveryScopeKey(this.scope) && !staged.has(p.record.id), 'recovery_scope_or_duplicate');
            requireRecovery(['usable_data', 'historical', 'requires_canonical_owner_revalidation'].includes(p.disposition), 'recovery_disposition');
            staged.set(p.record.id, recoveryImmutable(p));
        }
        this.#records.clear();
        staged.forEach((v, k) => this.#records.set(k, v));
        this.#revision++;
        this.#operations.set(operationId, Object.freeze({ digest, revision: this.#revision }));
        return this.#revision;
    }
}
export async function restoreEncryptedBackup(a, p, b, key, workspace, expectedRevision, current) {
    const started = performance.now();
    requireRecovery(recoveryScopeKey(workspace.scope) === recoveryScopeKey(p.scope), 'restore_workspace_scope');
    const records = await verifyEncryptedBackup(a, p, b, key);
    const currentStates = new Map();
    const projections = records.map(record => {
        const state = current(record);
        currentStates.set(record.id, state ? recoveryImmutable(state) : undefined);
        let disposition = 'historical', reason = 'current_authority_unknown';
        if (state) {
            requireRecovery(state.recordId === record.id && recoveryScopeKey(state.scope) === recoveryScopeKey(record.scope), 'restore_current_state_binding');
            const r = state.revalidation;
            requireRecovery(r.now === a.now(), 'restore_current_time_binding');
            const decision = evaluateRestoreRevalidation(r);
            const epochs = record.policyEpoch === r.currentPolicyEpoch && record.revocationEpoch === state.revocationEpoch;
            let evidenceCurrent = true;
            try {
                assertRecoveryEvidence(a, p.scope, record.evidenceIds);
            }
            catch {
                evidenceCurrent = false;
            }
            if (record.truth === 'current' && !state.invalidated && epochs && state.version === record.version && state.compatibilityVersion === record.compatibleVersion && decision.status === 'active' && evidenceCurrent) {
                disposition = ['canonical_data', 'assets', 'configuration'].includes(record.kind) ? 'usable_data' : 'requires_canonical_owner_revalidation';
                reason = disposition === 'usable_data' ? 'current_data_revalidated' : 'canonical_registry_activation_not_implied';
            }
            else
                reason = decision.status === 'active' ? 'source_version_truth_epoch_or_evidence_invalid' : decision.reason;
        }
        return { record, disposition, reason };
    });
    // Dependency rejection propagates; no missing or cyclic dependencies silently become usable.
    const byId = new Map(projections.map(p => [p.record.id, p])), visiting = new Set(), done = new Set();
    const visit = (id) => { requireRecovery(!visiting.has(id), 'restore_dependency_cycle'); if (done.has(id))
        return; visiting.add(id); const entry = byId.get(id); requireRecovery(entry, 'restore_dependency_missing'); for (const dep of entry.record.dependencyIds) {
        visit(dep);
        if (byId.get(dep)?.disposition === 'historical') {
            entry.disposition = 'historical';
            entry.reason = 'dependency_not_current';
        }
    } visiting.delete(id); done.add(id); };
    projections.forEach(p => visit(p.record.id));
    assertRecoveryAccess(a, 'restore', p.scope, b.header.id);
    assertRecoveryEvidence(a, p.scope, p.evidenceIds);
    const digest = await recoveryDigest({ backup: b.envelopeDigest, projections });
    assertRecoveryAccess(a, 'restore', p.scope, b.header.id);
    for (const record of records)
        requireRecovery(recoveryJson(current(record) ?? null) === recoveryJson(currentStates.get(record.id) ?? null), 'restore_authority_changed_during_verification');
    const revision = workspace.commit(expectedRevision, 'restore:' + b.header.id, digest, projections);
    return recoveryImmutable({ revision, restored: projections.filter(p => p.disposition === 'usable_data').length, historical: projections.filter(p => p.disposition === 'historical').length, requiresRevalidation: projections.filter(p => p.disposition === 'requires_canonical_owner_revalidation').length, rtoMs: performance.now() - started, rpoMs: recoveryTime(a.now()) - recoveryTime(b.header.createdAt), boundary: 'isolated' });
}
//# sourceMappingURL=restore.js.map