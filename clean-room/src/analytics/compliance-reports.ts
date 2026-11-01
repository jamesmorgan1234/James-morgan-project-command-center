import type { AuditFinding, AuditTarget } from "./self-audit.js";

/**
 * Self-audit scheduling and compliance reporting.
 *
 * The audit itself produces findings. These contracts govern when it runs, what it
 * may look at, that it never mutates production, how findings become reviewable
 * proposals, and the per-domain compliance reports the roadmap requires.
 */

export type ComplianceDomain = "projects" | "architecture" | "visual" | "agent" | "data_truth" | "security";

export const COMPLIANCE_DOMAINS: readonly ComplianceDomain[] = Object.freeze([
  "projects", "architecture", "visual", "agent", "data_truth", "security"
]);

export interface AuditCadence {
  readonly intervalMs: number;
  readonly lastRunAt?: string;
}

export function selfAuditDue(cadence: AuditCadence, now: string): Readonly<{ due: boolean; nextDueAt: string }> {
  if (!Number.isFinite(cadence.intervalMs) || cadence.intervalMs <= 0) throw new Error("Audit cadence interval must be a positive duration");
  const current = Date.parse(now);
  if (!Number.isFinite(current)) throw new Error("Audit cadence requires a valid current time");
  if (cadence.lastRunAt === undefined) return Object.freeze({ due: true, nextDueAt: new Date(current).toISOString() });
  const last = Date.parse(cadence.lastRunAt);
  if (!Number.isFinite(last)) throw new Error("Audit cadence requires a valid last run time");
  const next = last + cadence.intervalMs;
  return Object.freeze({ due: current >= next, nextDueAt: new Date(next).toISOString() });
}

export interface ScopedAuditTarget {
  readonly domain: ComplianceDomain;
  readonly target: AuditTarget;
}

export interface AuditScope {
  readonly domains: readonly ComplianceDomain[];
  readonly maxTargets: number;
}

export function auditScope(targets: readonly ScopedAuditTarget[], scope: AuditScope): Readonly<{ selected: readonly AuditTarget[]; excludedIds: readonly string[] }> {
  if (scope.domains.length === 0) throw new Error("Audit scope requires at least one domain");
  for (const domain of scope.domains) if (!COMPLIANCE_DOMAINS.includes(domain)) throw new Error(`Unknown compliance domain ${domain}`);
  if (!Number.isSafeInteger(scope.maxTargets) || scope.maxTargets < 1) throw new Error("Audit scope maxTargets must be a positive integer");
  const selected: AuditTarget[] = [];
  const excludedIds: string[] = [];
  for (const entry of targets) {
    if (!scope.domains.includes(entry.domain) || selected.length >= scope.maxTargets) {
      excludedIds.push(entry.target.id);
      continue;
    }
    selected.push(entry.target);
  }
  return Object.freeze({ selected: Object.freeze(selected), excludedIds: Object.freeze(excludedIds) });
}

export function assertAuditReadOnly(mutationRequested: boolean): void {
  if (mutationRequested) throw new Error("Brain self-audit cannot auto-modify production");
}

export interface AuditProposal {
  readonly id: string;
  readonly kind: "finding" | "recommendation";
  readonly severity: AuditFinding["severity"];
  readonly proposal: string;
  readonly autoApply: false;
  readonly executable: false;
}

export function auditResultsToProposals(findings: readonly AuditFinding[]): readonly AuditProposal[] {
  return Object.freeze(findings.map((finding) => Object.freeze({
    id: `audit:${finding.targetId}:${finding.reason}`,
    kind: finding.severity === "critical" || finding.severity === "high" ? "recommendation" as const : "finding" as const,
    severity: finding.severity,
    proposal: `Review ${finding.reason} for ${finding.targetId}`,
    autoApply: false as const,
    executable: false as const
  })));
}

export interface ComplianceReport {
  readonly domain: ComplianceDomain;
  readonly status: "compliant" | "attention" | "blocked";
  readonly findings: readonly AuditFinding[];
  readonly generatedAt: string;
  readonly readOnly: true;
}

export function complianceReport(domain: ComplianceDomain, findings: readonly AuditFinding[], generatedAt: string): ComplianceReport {
  if (!COMPLIANCE_DOMAINS.includes(domain)) throw new Error(`Unknown compliance domain ${domain}`);
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error("Compliance report requires a valid generatedAt timestamp");
  const blocked = findings.some((finding) => finding.severity === "critical");
  return Object.freeze({
    domain,
    status: blocked ? "blocked" as const : findings.length > 0 ? "attention" as const : "compliant" as const,
    findings: Object.freeze([...findings]),
    generatedAt,
    readOnly: true as const
  });
}
