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
export declare function selfAudit(targets: readonly AuditTarget[]): readonly AuditFinding[];
import { type GovernanceProposal } from './intelligence-governance.js';
import { type AnalyticsScope, type AnalyticsAccess } from './contracts.js';
export interface ArchitectureComponent {
    readonly id: string;
    readonly owner: string;
    readonly capabilityKeys: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly intendedVersion: string;
    readonly observedVersion: string | null;
    readonly divergence: 'none' | 'authorized' | 'stale' | 'incompatible' | 'missing_dependency' | 'experimental' | 'security_drift' | 'undocumented' | 'orphaned' | 'undeclared_side_effect';
    readonly coupling: number;
    readonly evidenceIds: readonly string[];
}
export declare function architectureCritic(access: AnalyticsAccess, scope: AnalyticsScope, targets: readonly AuditTarget[], components: readonly ArchitectureComponent[], maxCoupling: number): {
    scope: AnalyticsScope;
    findings: AuditFinding[];
    controlPlane: string;
    maySelfMutate: boolean;
};
export interface OptimizationOpportunity {
    readonly id: string;
    readonly kind: 'routing' | 'reuse' | 'method' | 'resource' | 'specialist_boundary' | 'reliability' | 'cost' | 'latency' | 'transfer' | 'calibration' | 'correlation';
    readonly requirementRefs: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly expectedBenefit: number | null;
    readonly unit: string;
    readonly currentVersionRef: string;
    readonly expiresAt: string;
    readonly revoked: boolean;
}
export declare function ecosystemOptimizer(access: AnalyticsAccess, scope: AnalyticsScope, opportunities: readonly OptimizationOpportunity[]): {
    scope: AnalyticsScope;
    proposals: GovernanceProposal[];
    mayExecute: boolean;
    mayPromote: boolean;
    controlPlane: string;
};
export declare function governanceDocumentation(findings: ReturnType<typeof architectureCritic>, proposals: ReturnType<typeof ecosystemOptimizer>): string;
export interface EcosystemGovernanceObservation {
    readonly id: string;
    readonly kind: OptimizationOpportunity['kind'];
    readonly observedValue: number | null;
    readonly threshold: number;
    readonly direction: 'higher_is_worse' | 'lower_is_worse';
    readonly unit: string;
    readonly criterionVersionRef: string;
    readonly observedAt: string;
    readonly freshnessMs: number;
    readonly evidenceIds: readonly string[];
    readonly requirementRefs: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly subjectVersionRef: string;
    readonly expiresAt: string;
    readonly revoked: boolean;
}
/** Declared, versioned criteria detect opportunities; no invented universal health thresholds. */
export declare function inspectEcosystemGovernance(access: AnalyticsAccess, scope: AnalyticsScope, observations: readonly EcosystemGovernanceObservation[]): {
    scope: AnalyticsScope;
    findings: AuditFinding[];
    unknown: string[];
    optimizer: {
        scope: AnalyticsScope;
        proposals: GovernanceProposal[];
        mayExecute: boolean;
        mayPromote: boolean;
        controlPlane: string;
    };
    mayExecute: boolean;
    controlPlane: string;
};
