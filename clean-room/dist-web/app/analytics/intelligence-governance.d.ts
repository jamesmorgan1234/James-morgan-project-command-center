export type HealthTruth = "verified" | "calculated" | "estimated" | "unknown";
export interface HealthMetricInput {
    key: "calibration_drift" | "contradiction_growth" | "stale_memory" | "evaluator_coverage" | "routing_regret" | "transfer_outcomes" | "quarantine_backlog";
    value: number | null;
    sourceRefs: readonly string[];
    observedAt: string;
    uncertainty: number | null;
    truth: HealthTruth;
}
export interface HealthSnapshot {
    values: Readonly<Record<HealthMetricInput["key"], number | null>>;
    missing: readonly HealthMetricInput["key"][];
    evidenceRefs: readonly string[];
}
export declare function computeHealthSnapshot(inputs: readonly HealthMetricInput[]): HealthSnapshot;
export type ExplainStage = "intent" | "context" | "policy" | "method" | "evidence" | "verifier" | "outcome" | "learning";
export interface ExplainNode {
    stage: ExplainStage;
    summary: string;
    evidenceRefs: readonly string[];
    containsSecret: boolean;
}
export declare function validateExplainabilityChain(nodes: readonly ExplainNode[]): readonly ExplainNode[];
export type DriftDomain = "provider" | "model" | "method" | "evaluator" | "data" | "policy" | "ontology" | "architecture" | "configuration" | "specialist" | "capability" | "transfer" | "unknown";
export interface DriftSignal {
    domain: DriftDomain;
    subjectRef: string;
    severity: "ok" | "warning" | "critical";
    sourceRefs: readonly string[];
    revalidationDue: boolean;
}
export declare function classifyDriftPressure(signals: readonly DriftSignal[]): Readonly<{
    primaryDomain: DriftDomain | null;
    revalidationPressure: number;
    domains: readonly Readonly<{
        domain: DriftDomain;
        score: number;
    }>[];
}>;
export interface ConsensusObservation {
    id: string;
    claimRef: string;
    decision: "support" | "oppose";
    sourceRef: string;
    providerRef: string;
    modelRef: string;
    benchmarkRef: string;
    sourceRefs: readonly string[];
    assumptionRefs?: readonly string[];
    derivedArtifactRefs?: readonly string[];
}
export interface IndependentConsensus {
    independentGroups: number;
    supportGroups: number;
    opposeGroups: number;
    consensus: "support" | "oppose" | "mixed" | "insufficient";
    correlatedGroups: readonly string[];
}
export declare function assessIndependentConsensus(observations: readonly ConsensusObservation[]): IndependentConsensus;
export interface GovernanceProposal {
    id: string;
    kind: "architecture_critic" | "ecosystem_optimizer";
    requirementRefs: readonly string[];
    impactRefs: readonly string[];
    evidenceRefs: readonly string[];
    dependencyRefs: readonly string[];
    proposal: string;
    autoApply: boolean;
    approvalRef?: string;
}
export declare function validateGovernanceProposal(p: GovernanceProposal): GovernanceProposal;
export interface FormulaVersion {
    metricKey: string;
    version: number;
    formulaHash: string;
    effectiveAt: string;
}
export declare function detectFormulaDrift(history: readonly FormulaVersion[]): readonly string[];
export interface ScaleEvent {
    id: string;
    occurredAt: string;
    receivedAt: string;
    containsSensitivePayload: boolean;
}
export declare function auditEventStream(events: readonly ScaleEvent[]): Readonly<{
    received: number;
    unique: number;
    duplicates: number;
    delayed: number;
    duplicateRate: number;
    highVolumeSafe: boolean;
}>;
