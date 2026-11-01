export const COMPLIANCE_DOMAINS = Object.freeze([
    "projects", "architecture", "visual", "agent", "data_truth", "security"
]);
export function selfAuditDue(cadence, now) {
    if (!Number.isFinite(cadence.intervalMs) || cadence.intervalMs <= 0)
        throw new Error("Audit cadence interval must be a positive duration");
    const current = Date.parse(now);
    if (!Number.isFinite(current))
        throw new Error("Audit cadence requires a valid current time");
    if (cadence.lastRunAt === undefined)
        return Object.freeze({ due: true, nextDueAt: new Date(current).toISOString() });
    const last = Date.parse(cadence.lastRunAt);
    if (!Number.isFinite(last))
        throw new Error("Audit cadence requires a valid last run time");
    const next = last + cadence.intervalMs;
    return Object.freeze({ due: current >= next, nextDueAt: new Date(next).toISOString() });
}
export function auditScope(targets, scope) {
    if (scope.domains.length === 0)
        throw new Error("Audit scope requires at least one domain");
    for (const domain of scope.domains)
        if (!COMPLIANCE_DOMAINS.includes(domain))
            throw new Error(`Unknown compliance domain ${domain}`);
    if (!Number.isSafeInteger(scope.maxTargets) || scope.maxTargets < 1)
        throw new Error("Audit scope maxTargets must be a positive integer");
    const selected = [];
    const excludedIds = [];
    for (const entry of targets) {
        if (!scope.domains.includes(entry.domain) || selected.length >= scope.maxTargets) {
            excludedIds.push(entry.target.id);
            continue;
        }
        selected.push(entry.target);
    }
    return Object.freeze({ selected: Object.freeze(selected), excludedIds: Object.freeze(excludedIds) });
}
export function assertAuditReadOnly(mutationRequested) {
    if (mutationRequested)
        throw new Error("Brain self-audit cannot auto-modify production");
}
export function auditResultsToProposals(findings) {
    return Object.freeze(findings.map((finding) => Object.freeze({
        id: `audit:${finding.targetId}:${finding.reason}`,
        kind: finding.severity === "critical" || finding.severity === "high" ? "recommendation" : "finding",
        severity: finding.severity,
        proposal: `Review ${finding.reason} for ${finding.targetId}`,
        autoApply: false,
        executable: false
    })));
}
export function complianceReport(domain, findings, generatedAt) {
    if (!COMPLIANCE_DOMAINS.includes(domain))
        throw new Error(`Unknown compliance domain ${domain}`);
    if (!Number.isFinite(Date.parse(generatedAt)))
        throw new Error("Compliance report requires a valid generatedAt timestamp");
    const blocked = findings.some((finding) => finding.severity === "critical");
    return Object.freeze({
        domain,
        status: blocked ? "blocked" : findings.length > 0 ? "attention" : "compliant",
        findings: Object.freeze([...findings]),
        generatedAt,
        readOnly: true
    });
}
//# sourceMappingURL=compliance-reports.js.map