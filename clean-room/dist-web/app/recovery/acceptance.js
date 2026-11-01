export const REQUIRED_INTELLIGENCE_BACKUP_CLASSES = [
    "canonical_data", "assets", "methods", "routing", "calibration", "promotions", "evaluators", "procedures", "specialists", "negative_knowledge", "revalidation", "canary_state"
];
export function validateIntelligenceBackup(r) { const present = new Set(r.classes); if (!r.backupId.trim() || !Number.isFinite(Date.parse(r.createdAt)))
    throw new Error("backup_identity_invalid"); if (!r.encrypted)
    throw new Error("backup_encryption_required"); if (!r.integrityVerified)
    throw new Error("backup_integrity_unverified"); if (!r.retentionPolicyRef.trim() || !r.keyStrategyRef.trim())
    throw new Error("backup_retention_key_strategy_required"); for (const k of REQUIRED_INTELLIGENCE_BACKUP_CLASSES)
    if (!present.has(k))
        throw new Error(`backup_class_missing:${k}`); return Object.freeze({ ...r, classes: Object.freeze([...r.classes]) }); }
export function restoreUnderCurrentPolicy(records) { const restored = []; const rejected = []; for (const r of records) {
    if (!r.id.trim() || !r.payloadRef.trim())
        throw new Error("restore_record_invalid");
    if (r.state !== "active" || !r.privacyAllowed || !r.policyAllowed)
        rejected.push(r.id);
    else
        restored.push(Object.freeze({ ...r }));
} return Object.freeze({ restored: Object.freeze(restored), rejected: Object.freeze(rejected) }); }
export function dryRunMigration(items, failAtId) { const migrated = []; const rolledBack = []; for (const item of items) {
    if (!item.id.trim() || !item.identityRef.trim() || item.sourceVersion < 1 || item.targetVersion <= item.sourceVersion)
        throw new Error("migration_item_invalid");
    if (item.erased)
        continue;
    if (item.id === failAtId) {
        rolledBack.push(...migrated);
        return Object.freeze({ status: "rolled_back", migrated: Object.freeze([]), rolledBack: Object.freeze(rolledBack), erasurePreserved: items.filter(i => i.erased).every(i => !migrated.includes(i.id)) });
    }
    migrated.push(item.id);
} return Object.freeze({ status: "completed", migrated: Object.freeze(migrated), rolledBack: Object.freeze([]), erasurePreserved: true }); }
export function evaluateReplacement(c) { if (!c.candidateRef.trim())
    throw new Error("replacement_identity_required"); const reasons = []; if (!c.available)
    reasons.push("candidate_unavailable"); if (!c.costKnownFree)
    reasons.push("cost_not_verified_free"); if (!c.compatible)
    reasons.push("compatibility_failed"); return Object.freeze({ activatable: reasons.length === 0, reasons: Object.freeze(reasons), invalidatedDependents: Object.freeze(c.compatible ? [] : [...c.dependentRefs]) }); }
export function auditHistoricalRecovery(i) { if (i.processedRefs.length === 0 || i.lineageRefs.length === 0)
    throw new Error("historical_scope_lineage_required"); const blockers = [...i.missingArtifacts]; if (!i.originalCcrAvailable)
    blockers.push("original_ccr_ledger_unavailable"); return Object.freeze({ processedCount: i.processedRefs.length, conflictCount: i.conflicts.length, privacyExclusionCount: i.privacyExclusions.length, blockers: Object.freeze([...new Set(blockers)]), complete: blockers.length === 0 }); }
export function validateScaleWorkload(w) { const offered = w.baselineUnits * w.multiplier; if (w.baselineUnits < 1 || w.resourceBudgetUnits < 0 || w.resourceUsedUnits < 0)
    throw new Error("scale_bounds_invalid"); if (w.accepted + w.backpressured + w.lost !== offered)
    throw new Error("scale_accounting_mismatch"); return Object.freeze({ offered, pass: w.lost === 0 && w.resourceUsedUnits <= w.resourceBudgetUnits, boundedBackpressure: w.lost === 0 && w.backpressured >= 0, noProcurementRequired: w.resourceUsedUnits <= w.resourceBudgetUnits }); }
const REACTIVATION_ORDER = ["configure", "connect", "authorize", "enable"];
export function validateDormantReactivation(r) { if (!r.ref.trim() || !r.revalidated || r.obsolete)
    throw new Error("dormant_revalidation_required"); for (let i = 0; i < r.completedStages.length; i++)
    if (r.completedStages[i] !== REACTIVATION_ORDER[i])
        throw new Error("reactivation_stage_order_invalid"); return Object.freeze({ ...r, enabled: r.completedStages.length === 4, completedStages: Object.freeze([...r.completedStages]) }); }
export function validateSyntheticTenantBoundary(records, multiUserActivated) { if (multiUserActivated)
    throw new Error("multi_user_product_activation_forbidden"); const refs = new Set(); for (const r of records) {
    if (!r.tenantRef.startsWith("synthetic:") || !r.roleRef.trim() || !r.privateDataRef.startsWith("synthetic:"))
        throw new Error("synthetic_tenant_boundary_invalid");
    const key = `${r.tenantRef}|${r.privateDataRef}`;
    if (refs.has(key))
        throw new Error("synthetic_tenant_duplicate");
    refs.add(key);
} return true; }
export function buildSyntheticPublicFork(assets, publish) { if (publish)
    throw new Error("public_fork_publication_forbidden"); return Object.freeze(assets.filter(a => a.classification === "public").map(a => a.ref)); }
export function validateFutureInterfaceSeam(s) { if (!s.id.startsWith("synthetic:") || !s.usesCanonicalIntent || !s.usesPolicy || !s.usesCanonicalData || !s.removable || s.productionActivated)
    throw new Error("future_interface_seam_invalid"); return true; }
export function validateChaosDrill(o) { if (!o.syntheticOrCopiedData || !o.stateProvenanceRef.trim() || !o.versionRef.trim() || o.productionEgress || !Number.isFinite(Date.parse(o.observedAt)))
    throw new Error("chaos_isolation_invalid"); return Object.freeze({ pass: o.fenced && o.recovered && o.resumed, observed: true }); }
const LIFE_ORDER = ["create", "use", "fail", "recover", "migrate", "disable", "remove"];
export function validateLongHorizonLifecycle(events) { if (events.length !== LIFE_ORDER.length)
    throw new Error("lifecycle_incomplete"); const entity = events[0]?.entityRef; if (!entity)
    throw new Error("lifecycle_entity_missing"); for (let i = 0; i < LIFE_ORDER.length; i++) {
    const e = events[i];
    if (!e || e.entityRef !== entity || e.action !== LIFE_ORDER[i])
        throw new Error(`lifecycle_step_invalid:${LIFE_ORDER[i]}`);
    if (e.synthetic && e.outcomeClass !== "simulation")
        throw new Error("synthetic_outcome_mislabeled");
} const final = events.at(-1); if (!final || final.authorityRefs.length !== 0 || final.dataRefs.length !== 0)
    throw new Error("orphan_authority_or_data"); return true; }
//# sourceMappingURL=acceptance.js.map