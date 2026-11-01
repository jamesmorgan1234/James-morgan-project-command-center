export type LifecycleStage = "birth" | "configure" | "use" | "failure" | "recovery" | "migration" | "disable" | "removal" | "replacement";
export interface LifecycleEvidence {
    readonly subjectKey: string;
    readonly stages: readonly LifecycleStage[];
    readonly evidenceRefs: readonly string[];
    readonly undocumentedManualSurgery: boolean;
    readonly orphanAuthorityOrData: boolean;
}
export declare function validateLongHorizonLifecycle(record: LifecycleEvidence): void;
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export declare const RECOVERY_LIFECYCLE_STAGES: readonly LifecycleStage[];
export interface ExecutedLifecycleObservation {
    readonly subjectId: string;
    readonly scope: RecoveryScope;
    readonly stage: LifecycleStage;
    readonly versionRef: string;
    readonly occurredAt: string;
    readonly evidenceIds: readonly string[];
    readonly observationDigest: string;
    readonly classification: 'synthetic' | 'copied';
    readonly remainingAuthorityRefs: readonly string[];
    readonly remainingDataRefs: readonly string[];
}
export declare const lifecycleObservationDigest: (o: ExecutedLifecycleObservation) => Promise<string>;
/** Independent canonical receipts bind every observation; a list of claimed stage names is insufficient. */
export declare function auditExecutedRecoveryLifecycle(a: RecoveryAccess, observations: readonly ExecutedLifecycleObservation[], remaining: () => {
    authorityRefs: readonly string[];
    dataRefs: readonly string[];
}): Promise<{
    subjectId: string;
    scope: RecoveryScope;
    stages: readonly LifecycleStage[];
    evidenceIds: string[];
    auditDigest: string;
    boundary: "isolated";
    orphanAuthority: boolean;
    orphanData: boolean;
    productionAccepted: boolean;
}>;
export type RecoveryDriftClass = 'authorized_divergence' | 'stale_configuration' | 'incompatible_version' | 'missing_dependency' | 'shadow_experimental_state' | 'security_drift' | 'undocumented_behavior' | 'orphaned_component' | 'undeclared_side_effect' | 'external_reality' | 'memory_age' | 'dependency_age' | 'replacement_audit';
export interface RecoveryRevalidationInput {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly expected: Readonly<Record<string, unknown>>;
    readonly observed: Readonly<Record<string, unknown>> | null;
    readonly expectedVersion: number;
    readonly observedVersion: number | null;
    readonly observedAt: string;
    readonly revalidateAfter: string;
    readonly evidenceIds: readonly string[];
    readonly authorizedDivergence: boolean;
    readonly missingDependencyRefs: readonly string[];
    readonly orphanRefs: readonly string[];
    readonly securityDrift: boolean;
    readonly undocumented: boolean;
    readonly undeclaredSideEffect: boolean;
    readonly shadow: boolean;
    readonly externalRealityChanged: boolean;
    readonly memoryExpired: boolean;
    readonly dependencyExpired: boolean;
    readonly replacementPending: boolean;
}
export declare function assessRecoveryRevalidation(a: RecoveryAccess, i: RecoveryRevalidationInput): {
    id: string;
    scope: RecoveryScope;
    findings: RecoveryDriftClass[];
    pressure: Readonly<{
        primaryDomain: import("../analytics/intelligence-governance.js").DriftDomain | null;
        revalidationPressure: number;
        domains: readonly Readonly<{
            domain: import("../analytics/intelligence-governance.js").DriftDomain;
            score: number;
        }>[];
    }>;
    current: boolean;
    evidenceCurrent: boolean;
    revalidationRequired: boolean;
    automaticRepairAuthorized: false;
    documentation: string[];
};
export interface CounterfactualSupportInput {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly observedFacts: Readonly<Record<string, number>>;
    readonly correlations: readonly string[];
    readonly assumptions: readonly string[];
    readonly interventions: Readonly<Record<string, number>>;
    readonly coefficients: Readonly<Record<string, number>>;
    readonly sensitivity: Readonly<Record<string, {
        low: number;
        high: number;
    }>>;
    readonly intercept: number;
    readonly evidenceIds: readonly string[];
    readonly modelVersionRef: string;
    readonly unit: string;
}
export declare function simulateRecoveryCounterfactual(a: RecoveryAccess, i: CounterfactualSupportInput): {
    id: string;
    observedFacts: Readonly<Record<string, number>>;
    correlations: readonly string[];
    assumptions: readonly string[];
    interventions: Readonly<Record<string, number>>;
    modelVersionRef: string;
    unit: string;
    simulatedOutcome: number;
    sensitivity: {
        low: number;
        high: number;
    };
    causalLabel: "causal_hypothesis";
    causalClaimProven: false;
    confidence: "not_estimated";
    benchmarkClass: "simulation";
    observedCounterfactual: false;
    authorizationGranted: false;
};
