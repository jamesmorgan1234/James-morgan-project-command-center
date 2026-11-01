const HEALTH_KEYS = ["calibration_drift", "contradiction_growth", "stale_memory", "evaluator_coverage", "routing_regret", "transfer_outcomes", "quarantine_backlog"];
const validTime = (v) => Number.isFinite(Date.parse(v));
export function computeHealthSnapshot(inputs) {
    const byKey = new Map();
    for (const item of inputs) {
        if (byKey.has(item.key))
            throw new Error(`duplicate_health_metric:${item.key}`);
        if (!validTime(item.observedAt) || item.sourceRefs.length === 0)
            throw new Error(`health_metric_provenance_required:${item.key}`);
        if (item.value !== null && !Number.isFinite(item.value))
            throw new Error(`health_metric_invalid:${item.key}`);
        if (item.truth === "unknown" && item.value !== null)
            throw new Error(`unknown_health_metric_must_be_missing:${item.key}`);
        if (item.value !== null && (item.uncertainty === null || item.uncertainty < 0 || item.uncertainty > 1))
            throw new Error(`health_metric_uncertainty_required:${item.key}`);
        byKey.set(item.key, item);
    }
    const values = {};
    const missing = [];
    const refs = new Set();
    for (const key of HEALTH_KEYS) {
        const item = byKey.get(key);
        values[key] = item?.value ?? null;
        if (!item || item.value === null)
            missing.push(key);
        item?.sourceRefs.forEach(r => refs.add(r));
    }
    return Object.freeze({ values: Object.freeze(values), missing: Object.freeze(missing), evidenceRefs: Object.freeze([...refs].sort()) });
}
const EXPLAIN_STAGES = ["intent", "context", "policy", "method", "evidence", "verifier", "outcome", "learning"];
export function validateExplainabilityChain(nodes) { if (nodes.length !== EXPLAIN_STAGES.length)
    throw new Error("explainability_chain_incomplete"); for (let i = 0; i < EXPLAIN_STAGES.length; i++) {
    const n = nodes[i];
    if (!n || n.stage !== EXPLAIN_STAGES[i])
        throw new Error(`explainability_stage_missing:${EXPLAIN_STAGES[i]}`);
    if (!n.summary.trim() || n.evidenceRefs.length === 0)
        throw new Error(`explainability_evidence_missing:${n.stage}`);
    if (n.containsSecret)
        throw new Error(`explainability_secret_leak:${n.stage}`);
} return Object.freeze(nodes.map(n => Object.freeze({ ...n, evidenceRefs: Object.freeze([...n.evidenceRefs]) }))); }
export function classifyDriftPressure(signals) { const active = signals.filter(s => s.severity !== "ok" || s.revalidationDue); if (active.some(s => !s.subjectRef.trim() || s.sourceRefs.length === 0))
    throw new Error("drift_signal_provenance_required"); const byDomain = new Map(); for (const s of active)
    byDomain.set(s.domain, (byDomain.get(s.domain) ?? 0) + (s.severity === "critical" ? 3 : s.severity === "warning" ? 2 : 0) + (s.revalidationDue ? 1 : 0)); const severityRank = new Map(); for (const s of active)
    severityRank.set(s.domain, Math.max(severityRank.get(s.domain) ?? 0, s.severity === "critical" ? 2 : s.severity === "warning" ? 1 : 0)); const ranked = [...byDomain.entries()].sort((a, b) => (severityRank.get(b[0]) ?? 0) - (severityRank.get(a[0]) ?? 0) || b[1] - a[1] || a[0].localeCompare(b[0])); return Object.freeze({ primaryDomain: ranked[0]?.[0] ?? null, revalidationPressure: active.filter(s => s.revalidationDue).length, domains: Object.freeze(ranked.map(([domain, score]) => Object.freeze({ domain, score }))) }); }
export function assessIndependentConsensus(observations) {
    if (observations.some(o => !o.id.trim() || !o.claimRef.trim() || !o.sourceRef.trim() || !o.providerRef.trim() || !o.modelRef.trim() || !o.benchmarkRef.trim() || o.sourceRefs.length === 0))
        throw new Error("consensus_provenance_required");
    if (new Set(observations.map(o => o.id)).size !== observations.length || new Set(observations.map(o => o.claimRef)).size > 1)
        throw new Error("consensus_identity_or_claim_conflict");
    const parent = observations.map((_, i) => i), root = (i) => { while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
    } return i; };
    const shared = new Map();
    observations.forEach((o, i) => { for (const key of ["sourceRef", "providerRef", "modelRef", "benchmarkRef"]) {
        const fingerprint = JSON.stringify([key, o[key]]), prior = shared.get(fingerprint);
        if (prior === undefined)
            shared.set(fingerprint, i);
        else
            parent[root(i)] = root(prior);
    } for (const ref of [...(o.assumptionRefs ?? []), ...(o.derivedArtifactRefs ?? [])]) {
        const k = JSON.stringify(["dependency", ref]), prior = shared.get(k);
        if (prior === undefined)
            shared.set(k, i);
        else
            parent[root(i)] = root(prior);
    } });
    const groups = new Map();
    observations.forEach((o, i) => groups.set(root(i), [...groups.get(root(i)) ?? [], o]));
    let support = 0, oppose = 0;
    const correlated = [];
    for (const items of groups.values()) {
        if (items.length > 1)
            correlated.push(items.map(o => o.id).sort().join(","));
        const directions = new Set(items.map(o => o.decision));
        if (directions.size === 1) {
            if (directions.has("support"))
                support++;
            else
                oppose++;
        }
    }
    const n = groups.size;
    return Object.freeze({ independentGroups: n, supportGroups: support, opposeGroups: oppose, consensus: n < 2 ? "insufficient" : support > 0 && oppose > 0 ? "mixed" : support >= 2 ? "support" : oppose >= 2 ? "oppose" : "insufficient", correlatedGroups: Object.freeze(correlated.sort()) });
}
export function validateGovernanceProposal(p) { if (!p.id.trim() || !p.proposal.trim() || p.requirementRefs.length === 0 || p.impactRefs.length === 0 || p.evidenceRefs.length === 0 || p.dependencyRefs.length === 0)
    throw new Error("governance_proposal_incomplete"); if (p.autoApply)
    throw new Error("governance_proposal_cannot_self_mutate"); if (p.approvalRef !== undefined && !p.approvalRef.trim())
    throw new Error("approval_ref_invalid"); return Object.freeze({ ...p, requirementRefs: Object.freeze([...p.requirementRefs]), impactRefs: Object.freeze([...p.impactRefs]), evidenceRefs: Object.freeze([...p.evidenceRefs]), dependencyRefs: Object.freeze([...p.dependencyRefs]) }); }
export function detectFormulaDrift(history) { const byMetric = new Map(); for (const f of history) {
    if (!f.metricKey.trim() || !Number.isInteger(f.version) || f.version < 1 || !f.formulaHash.trim() || !validTime(f.effectiveAt))
        throw new Error("invalid_formula_version");
    byMetric.set(f.metricKey, [...(byMetric.get(f.metricKey) ?? []), f]);
} const drift = []; for (const [key, items] of byMetric) {
    const sorted = [...items].sort((a, b) => a.version - b.version);
    for (let i = 1; i < sorted.length; i++) {
        const a = sorted[i - 1], b = sorted[i];
        if (!a || !b)
            continue;
        if (b.version <= a.version)
            throw new Error(`formula_version_not_advancing:${key}`);
        if (b.formulaHash !== a.formulaHash)
            drift.push(`${key}@${a.version}->${b.version}`);
    }
} return Object.freeze(drift); }
export function auditEventStream(events) { const seen = new Set(); let duplicates = 0, delayed = 0; for (const e of events) {
    if (!e.id.trim() || !validTime(e.occurredAt) || !validTime(e.receivedAt))
        throw new Error("invalid_scale_event");
    if (e.containsSensitivePayload)
        throw new Error("privacy_redaction_failed");
    if (seen.has(e.id)) {
        duplicates++;
        continue;
    }
    seen.add(e.id);
    if (Date.parse(e.receivedAt) - Date.parse(e.occurredAt) > 60_000)
        delayed++;
} return Object.freeze({ received: events.length, unique: seen.size, duplicates, delayed, duplicateRate: events.length === 0 ? 0 : duplicates / events.length, highVolumeSafe: events.length <= 1_000_000 }); }
//# sourceMappingURL=intelligence-governance.js.map