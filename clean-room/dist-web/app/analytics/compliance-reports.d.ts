import type { AuditFinding, AuditTarget } from "./self-audit.js";
/**
 * Self-audit scheduling and compliance reporting.
 *
 * The audit itself produces findings. These contracts govern when it runs, what it
 * may look at, that it never mutates production, how findings become reviewable
 * proposals, and the per-domain compliance reports the roadmap requires.
 */
export type ComplianceDomain = "projects" | "architecture" | "visual" | "agent" | "data_truth" | "security";
export declare const COMPLIANCE_DOMAINS: readonly ComplianceDomain[];
export interface AuditCadence {
    readonly intervalMs: number;
    readonly lastRunAt?: string;
}
export declare function selfAuditDue(cadence: AuditCadence, now: string): Readonly<{
    due: boolean;
    nextDueAt: string;
}>;
export interface ScopedAuditTarget {
    readonly domain: ComplianceDomain;
    readonly target: AuditTarget;
}
export interface AuditScope {
    readonly domains: readonly ComplianceDomain[];
    readonly maxTargets: number;
}
export declare function auditScope(targets: readonly ScopedAuditTarget[], scope: AuditScope): Readonly<{
    selected: readonly AuditTarget[];
    excludedIds: readonly string[];
}>;
export declare function assertAuditReadOnly(mutationRequested: boolean): void;
export interface AuditProposal {
    readonly id: string;
    readonly kind: "finding" | "recommendation";
    readonly severity: AuditFinding["severity"];
    readonly proposal: string;
    readonly autoApply: false;
    readonly executable: false;
}
export declare function auditResultsToProposals(findings: readonly AuditFinding[]): readonly AuditProposal[];
export interface ComplianceReport {
    readonly domain: ComplianceDomain;
    readonly status: "compliant" | "attention" | "blocked";
    readonly findings: readonly AuditFinding[];
    readonly generatedAt: string;
    readonly readOnly: true;
}
export declare function complianceReport(domain: ComplianceDomain, findings: readonly AuditFinding[], generatedAt: string): ComplianceReport;
