export function selfAudit(targets) {
    const findings = [];
    for (const target of targets) {
        if (!target.expected)
            continue;
        if (target.implementationState === "verified" && target.evidenceRefs.length > 0)
            continue;
        const severity = target.implementationState === "broken" ? "critical" : target.implementationState === "missing" ? "high" : "warning";
        const reason = target.implementationState === "verified" ? "verified state lacks evidence" : target.implementationState;
        findings.push(Object.freeze({ targetId: target.id, severity, reason, owner: target.owner }));
    }
    return Object.freeze(findings);
}
import { validateGovernanceProposal } from './intelligence-governance.js';
import { authorizeAnalytics, analyticsEvidence, immutable, invariant, bounded, stringSet, timestamp, equalScope } from './contracts.js';
export function architectureCritic(access, scope, targets, components, maxCoupling) {
    authorizeAnalytics(access, 'read', scope, 'architecture-critic');
    bounded(maxCoupling);
    const findings = [];
    for (const t of targets) {
        let proven = false;
        if (t.implementationState === 'verified')
            try {
                analyticsEvidence(access, scope, t.evidenceRefs);
                proven = true;
            }
            catch { }
        if (t.expected && !proven)
            findings.push({ targetId: t.id, severity: t.implementationState === 'broken' ? 'critical' : t.implementationState === 'missing' ? 'high' : 'warning', reason: t.implementationState === 'verified' ? 'evidence_not_current_verified_scoped' : t.implementationState, owner: t.owner });
    }
    invariant(new Set(components.map(c => c.id)).size === components.length, 'duplicate_architecture_component');
    const capabilities = new Map();
    for (const c of components) {
        analyticsEvidence(access, scope, c.evidenceIds);
        bounded(c.coupling);
        stringSet(c.capabilityKeys);
        stringSet(c.dependencyRefs);
        if (c.divergence !== 'none' && c.divergence !== 'authorized')
            findings.push({ targetId: c.id, severity: c.divergence === 'security_drift' || c.divergence === 'undeclared_side_effect' ? 'critical' : 'warning', reason: c.divergence, owner: c.owner });
        else if (c.observedVersion !== c.intendedVersion && c.divergence !== 'authorized')
            findings.push({ targetId: c.id, severity: 'warning', reason: 'architecture_version_drift', owner: c.owner });
        if (c.coupling > maxCoupling)
            findings.push({ targetId: c.id, severity: 'warning', reason: 'excessive_coupling', owner: c.owner });
        for (const dep of c.dependencyRefs)
            if (!components.some(x => x.id === dep))
                findings.push({ targetId: c.id, severity: 'high', reason: 'missing_dependency', owner: c.owner });
        for (const cap of c.capabilityKeys) {
            const prior = capabilities.get(cap);
            if (prior && prior !== c.owner)
                findings.push({ targetId: c.id, severity: 'high', reason: 'duplicate_capability_ownership', owner: c.owner });
            else
                capabilities.set(cap, c.owner);
        }
    }
    return immutable({ scope, findings: findings.sort((a, b) => a.targetId.localeCompare(b.targetId) || a.reason.localeCompare(b.reason)), controlPlane: 'command_center', maySelfMutate: false });
}
export function ecosystemOptimizer(access, scope, opportunities) { authorizeAnalytics(access, 'propose', scope, 'ecosystem-optimizer'); const proposals = []; for (const o of opportunities) {
    analyticsEvidence(access, scope, o.evidenceIds);
    if (o.revoked || timestamp(o.expiresAt) <= timestamp(access.now()))
        continue;
    if (o.expectedBenefit !== null)
        bounded(o.expectedBenefit, -Infinity);
    proposals.push(validateGovernanceProposal({ id: o.id, kind: 'ecosystem_optimizer', requirementRefs: o.requirementRefs, impactRefs: [o.currentVersionRef], evidenceRefs: o.evidenceIds, dependencyRefs: o.dependencyRefs, proposal: `Review ${o.kind} against declared ${o.unit} criteria`, autoApply: false }));
} return immutable({ scope, proposals, mayExecute: false, mayPromote: false, controlPlane: 'command_center' }); }
export function governanceDocumentation(findings, proposals) { invariant(equalScope(findings.scope, proposals.scope), 'governance_document_scope_mismatch'); return ['Command Center governed analytics', ...findings.findings.map(f => `${f.targetId}: ${f.reason} (${f.severity}; owner ${f.owner})`), ...proposals.proposals.map(p => `${p.id}: ${p.proposal}; evidence ${p.evidenceRefs.join(',')}; proposal only`)].join('\n'); }
/** Declared, versioned criteria detect opportunities; no invented universal health thresholds. */
export function inspectEcosystemGovernance(access, scope, observations) {
    authorizeAnalytics(access, 'propose', scope, 'ecosystem-governance');
    const findings = [], opportunities = [], unknown = [];
    invariant(new Set(observations.map(o => o.id)).size === observations.length, 'duplicate_governance_observation');
    for (const o of observations) {
        bounded(o.threshold, -Infinity);
        bounded(o.freshnessMs);
        stringSet(o.requirementRefs, true);
        stringSet(o.dependencyRefs, true);
        invariant(o.criterionVersionRef.trim() && o.unit.trim(), 'governance_criterion_version_unit_required');
        if (o.revoked)
            continue;
        if (o.observedValue === null) {
            unknown.push(o.id);
            continue;
        }
        if (timestamp(o.observedAt) > timestamp(access.now()))
            throw new Error('future_governance_observation');
        if (timestamp(access.now()) - timestamp(o.observedAt) > o.freshnessMs) {
            findings.push({ targetId: o.id, severity: 'warning', reason: 'stale_assumption_revalidation_required', owner: 'command_center' });
            continue;
        }
        bounded(o.observedValue, -Infinity);
        analyticsEvidence(access, scope, o.evidenceIds);
        const worse = o.direction === 'higher_is_worse' ? o.observedValue > o.threshold : o.observedValue < o.threshold;
        if (worse) {
            findings.push({ targetId: o.id, severity: o.kind === 'correlation' ? 'high' : 'warning', reason: o.kind + '_criterion_not_met', owner: 'command_center' });
            opportunities.push({ id: 'proposal:' + o.id, kind: o.kind, requirementRefs: o.requirementRefs, evidenceIds: o.evidenceIds, dependencyRefs: [...o.dependencyRefs, o.criterionVersionRef], expectedBenefit: Math.abs(o.observedValue - o.threshold), unit: o.unit, currentVersionRef: o.subjectVersionRef, expiresAt: o.expiresAt, revoked: false });
        }
    }
    return immutable({ scope, findings, unknown, optimizer: ecosystemOptimizer(access, scope, opportunities), mayExecute: false, controlPlane: 'command_center' });
}
//# sourceMappingURL=self-audit.js.map