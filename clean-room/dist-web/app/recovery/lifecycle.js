const REQUIRED = Object.freeze(["birth", "configure", "use", "failure", "recovery", "migration", "disable", "removal", "replacement"]);
export function validateLongHorizonLifecycle(record) {
    if (!record.subjectKey.trim() || record.evidenceRefs.length === 0)
        throw new Error("lifecycle audit requires identity/evidence");
    if (!REQUIRED.every((stage) => record.stages.includes(stage)))
        throw new Error("lifecycle audit is incomplete");
    if (record.undocumentedManualSurgery || record.orphanAuthorityOrData)
        throw new Error("lifecycle leaves hidden manual surgery or orphan state");
}
import { classifyDriftPressure } from '../analytics/intelligence-governance.js';
import { assertRecoveryAccess, assertRecoveryEvidence, assertRecoveryPayload, recoveryDigest, recoveryImmutable, recoveryJson, recoveryList, recoveryRef, recoveryScopeKey, recoveryTime, recoveryVersion, requireRecovery } from './contracts.js';
export const RECOVERY_LIFECYCLE_STAGES = ['birth', 'configure', 'use', 'failure', 'recovery', 'migration', 'disable', 'removal', 'replacement'];
export const lifecycleObservationDigest = (o) => recoveryDigest({ subjectId: o.subjectId, scope: o.scope, stage: o.stage, versionRef: o.versionRef, occurredAt: o.occurredAt, classification: o.classification, remainingAuthorityRefs: o.remainingAuthorityRefs, remainingDataRefs: o.remainingDataRefs });
/** Independent canonical receipts bind every observation; a list of claimed stage names is insufficient. */
export async function auditExecutedRecoveryLifecycle(a, observations, remaining) { requireRecovery(observations.length === RECOVERY_LIFECYCLE_STAGES.length, 'executed_lifecycle_incomplete'); const first = observations[0]; assertRecoveryAccess(a, 'read', first.scope, first.subjectId); let previous = -Infinity; for (let i = 0; i < observations.length; i++) {
    const o = observations[i];
    requireRecovery(o.subjectId === first.subjectId && recoveryScopeKey(o.scope) === recoveryScopeKey(first.scope) && o.stage === RECOVERY_LIFECYCLE_STAGES[i] && ['synthetic', 'copied'].includes(o.classification), 'executed_lifecycle_order_scope');
    recoveryRef(o.versionRef);
    recoveryList(o.remainingAuthorityRefs);
    recoveryList(o.remainingDataRefs);
    const at = recoveryTime(o.occurredAt);
    requireRecovery(at >= previous && at <= recoveryTime(a.now()), 'executed_lifecycle_time');
    previous = at;
    assertRecoveryEvidence(a, o.scope, o.evidenceIds);
    requireRecovery(o.observationDigest === await lifecycleObservationDigest(o) && o.evidenceIds.some(id => { const e = a.evidence(id); return e?.record.subjectId === o.subjectId && e.record.configDigest === o.observationDigest; }), 'executed_lifecycle_source_binding');
    if (o.stage === 'removal' || o.stage === 'replacement')
        requireRecovery(o.remainingAuthorityRefs.length === 0 && o.remainingDataRefs.length === 0, 'executed_lifecycle_orphan');
} const residual = remaining(); requireRecovery(residual.authorityRefs.length === 0 && residual.dataRefs.length === 0, 'executed_lifecycle_live_orphan'); assertRecoveryAccess(a, 'read', first.scope, first.subjectId); return recoveryImmutable({ subjectId: first.subjectId, scope: first.scope, stages: RECOVERY_LIFECYCLE_STAGES, evidenceIds: observations.flatMap(o => o.evidenceIds), auditDigest: await recoveryDigest(observations), boundary: 'isolated', orphanAuthority: false, orphanData: false, productionAccepted: false }); }
export function assessRecoveryRevalidation(a, i) { assertRecoveryAccess(a, 'read', i.scope, i.id); recoveryVersion(i.expectedVersion); assertRecoveryPayload(i.expected); if (i.observed !== null)
    assertRecoveryPayload(i.observed); const now = recoveryTime(a.now()); requireRecovery(recoveryTime(i.observedAt) <= now, 'revalidation_future'); recoveryList(i.missingDependencyRefs); recoveryList(i.orphanRefs); const findings = []; let evidenceCurrent = true; try {
    assertRecoveryEvidence(a, i.scope, i.evidenceIds);
}
catch {
    evidenceCurrent = false;
} if (i.observed === null || !evidenceCurrent || recoveryTime(i.revalidateAfter) <= now)
    findings.push('stale_configuration'); if (i.observedVersion !== i.expectedVersion)
    findings.push('incompatible_version'); if (i.observedVersion !== null)
    recoveryVersion(i.observedVersion); if (i.missingDependencyRefs.length)
    findings.push('missing_dependency'); if (i.orphanRefs.length)
    findings.push('orphaned_component'); if (i.securityDrift)
    findings.push('security_drift'); if (i.undocumented)
    findings.push('undocumented_behavior'); if (i.undeclaredSideEffect)
    findings.push('undeclared_side_effect'); if (i.shadow)
    findings.push('shadow_experimental_state'); if (i.externalRealityChanged)
    findings.push('external_reality'); if (i.memoryExpired)
    findings.push('memory_age'); if (i.dependencyExpired)
    findings.push('dependency_age'); if (i.replacementPending)
    findings.push('replacement_audit'); if (i.observed !== null && recoveryJson(i.expected) !== recoveryJson(i.observed))
    findings.push(i.authorizedDivergence ? 'authorized_divergence' : 'undocumented_behavior'); const unique = [...new Set(findings)]; const signals = unique.map(f => ({ domain: f === 'security_drift' ? 'policy' : f === 'external_reality' ? 'provider' : 'architecture', subjectRef: i.id, severity: f === 'authorized_divergence' || f === 'shadow_experimental_state' ? 'warning' : 'critical', sourceRefs: i.evidenceIds, revalidationDue: f !== 'authorized_divergence' })); return recoveryImmutable({ id: i.id, scope: i.scope, findings: unique, pressure: classifyDriftPressure(signals), current: unique.length === 0 && evidenceCurrent, evidenceCurrent, revalidationRequired: unique.some(f => f !== 'authorized_divergence'), automaticRepairAuthorized: false, documentation: unique.map(f => `${i.id}: ${f}; source ${i.evidenceIds.join(',')}; current authority must revalidate before use`) }); }
export function simulateRecoveryCounterfactual(a, i) { assertRecoveryAccess(a, 'read', i.scope, i.id); assertRecoveryEvidence(a, i.scope, i.evidenceIds); recoveryList(i.assumptions, true); recoveryList(i.correlations); recoveryRef(i.modelVersionRef); recoveryRef(i.unit); requireRecovery(Number.isFinite(i.intercept) && Object.keys(i.coefficients).length > 0, 'counterfactual_model_invalid'); const names = Object.keys(i.coefficients).sort(); requireRecovery(Object.keys(i.interventions).every(k => names.includes(k)) && Object.keys(i.sensitivity).every(k => names.includes(k)), 'counterfactual_unknown_intervention'); let predicted = i.intercept, low = i.intercept, high = i.intercept; for (const name of names) {
    const weight = i.coefficients[name], fact = i.observedFacts[name], value = i.interventions[name] ?? fact;
    requireRecovery(Number.isFinite(weight) && typeof fact === 'number' && Number.isFinite(fact) && typeof value === 'number' && Number.isFinite(value), 'counterfactual_unknown_fact');
    const range = i.sensitivity[name] ?? { low: value, high: value };
    requireRecovery(Number.isFinite(range.low) && Number.isFinite(range.high) && range.low <= range.high && value >= range.low && value <= range.high, 'counterfactual_sensitivity_invalid');
    predicted += weight * value;
    low += Math.min(weight * range.low, weight * range.high);
    high += Math.max(weight * range.low, weight * range.high);
} requireRecovery([predicted, low, high].every(Number.isFinite), 'counterfactual_overflow'); const causalLabel = 'causal_hypothesis'; return recoveryImmutable({ id: i.id, observedFacts: i.observedFacts, correlations: i.correlations, assumptions: i.assumptions, interventions: i.interventions, modelVersionRef: i.modelVersionRef, unit: i.unit, simulatedOutcome: predicted, sensitivity: { low, high }, causalLabel, causalClaimProven: false, confidence: 'not_estimated', benchmarkClass: 'simulation', observedCounterfactual: false, authorizationGranted: false }); }
//# sourceMappingURL=lifecycle.js.map