export type AuditImplementationState = "verified" | "implemented_unverified" | "missing" | "broken" | "dormant";
export type AuditSeverity = "info" | "warning" | "high" | "critical";

export interface AuditTarget {
  readonly id: string;
  readonly expected: boolean;
  readonly implementationState: AuditImplementationState;
  readonly evidenceRefs: readonly string[];
  readonly owner: string;
}

export interface AuditFinding {
  readonly targetId: string;
  readonly severity: AuditSeverity;
  readonly reason: string;
  readonly owner: string;
}

export function selfAudit(targets: readonly AuditTarget[]): readonly AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const target of targets) {
    if (!target.expected) continue;
    if (target.implementationState === "verified" && target.evidenceRefs.length > 0) continue;
    const severity: AuditSeverity = target.implementationState === "broken" ? "critical" : target.implementationState === "missing" ? "high" : "warning";
    const reason = target.implementationState === "verified" ? "verified state lacks evidence" : target.implementationState;
    findings.push(Object.freeze({ targetId: target.id, severity, reason, owner: target.owner }));
  }
  return Object.freeze(findings);
}
