import type { EvaluatorDefinition } from "../analytics/evaluators.js";
import type { SpecialistModelContract, SpecialistProjectionRequest } from "../brain/specialists.js";
import { SpecialistBrainRegistry } from "../brain/specialists.js";
import type { CapabilityMethodContract, MethodRoutingRequest } from "../kernel/method-portfolio.js";
import { CapabilityMethodPortfolio } from "../kernel/method-portfolio.js";
import type { ScheduledTask } from "./dag.js";
import type { DelegatedAuthorityEnvelope } from "./delegation.js";
import type { AgencyExecutor } from "./registry.js";
import { AgencyExecutorRegistry } from "./registry.js";
import type { OrchestrationChoice } from "./replay.js";
import type { CanaryDecision, CanaryMetrics } from "./rollout.js";
import type { VerificationRequest } from "./verification.js";
export type AgencyIntelligenceEvaluationPurpose = "routing" | "learning" | "transfer" | "improvement";
export interface AgencyIntelligenceRouteRequest {
    readonly executor: {
        readonly capability: string;
        readonly projectTypeKey: string;
        readonly environment: "normal_chat" | "work" | "deterministic";
        readonly risk: "low" | "medium" | "high" | "critical";
        readonly allowPaid: boolean;
    };
    readonly method: MethodRoutingRequest;
    readonly specialistId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly workClasses: readonly string[];
    readonly dataClasses: readonly string[];
    readonly permissionKeys: readonly string[];
}
export interface AgencyIntelligenceRouteDependencies {
    readonly executors: AgencyExecutorRegistry;
    readonly methods: CapabilityMethodPortfolio;
    readonly specialists: SpecialistBrainRegistry;
}
export interface AgencyIntelligenceRouteDecision {
    readonly eligibleExecutors: readonly AgencyExecutor[];
    readonly method: CapabilityMethodContract;
    readonly specialist: SpecialistModelContract;
    readonly evidenceRefs: readonly string[];
    readonly calibratedConfidence: number;
    readonly reliabilityScore: number;
}
export interface AgencySpecialistDelegationRequest {
    readonly envelope: DelegatedAuthorityEnvelope;
    readonly parentSpecialist: SpecialistModelContract;
    readonly childSpecialist: SpecialistModelContract;
    readonly childProjection: SpecialistProjectionRequest;
    readonly maxDepth: number;
    readonly currentFanOut: number;
    readonly maxFanOut: number;
    readonly now: string;
}
export interface AgencySpecialistDelegationDecision {
    readonly parentSpecialistId: string;
    readonly childSpecialistId: string;
    readonly capabilityKeys: readonly string[];
    readonly permissionKeys: readonly string[];
    readonly evidenceRefs: readonly string[];
}
export interface AgencyIntelligenceEvaluationRequest {
    readonly purpose: AgencyIntelligenceEvaluationPurpose;
    readonly verification: VerificationRequest;
    readonly evaluator: EvaluatorDefinition;
    readonly candidateOwnerRef: string;
    readonly executorOwnerRef: string;
    readonly verifierOwnerRef: string;
}
export interface AgencyIntelligenceEvaluationDecision {
    readonly evaluatorKey: string;
    readonly evaluatorVersion: number;
    readonly independent: true;
    readonly evidenceRefs: readonly string[];
}
export interface AgencyIntelligenceSnapshot {
    readonly methodId: string;
    readonly methodVersion: number;
    readonly specialistId: string;
    readonly specialistVersion: number;
    readonly evaluatorKey?: string;
    readonly evaluatorVersion?: number;
    readonly stateFingerprint: string;
    readonly authorityScopes: readonly string[];
    readonly evidenceRefs: readonly string[];
}
export interface AgencyIntelligenceRecoveryDecision {
    readonly compatible: true;
    readonly authorityNarrowed: true;
    readonly evidenceRefs: readonly string[];
}
/** P7.3/P7.7: canonical method/specialist intelligence narrows, but never bypasses, Agency executor eligibility. */
export declare function routeAgencyIntelligence(request: AgencyIntelligenceRouteRequest, dependencies: AgencyIntelligenceRouteDependencies): AgencyIntelligenceRouteDecision | undefined;
/** P7.7: work stealing remains subject to the historical DAG capability/anti-affinity guard and the current intelligence route. */
export declare function safeStealWithAgencyIntelligence(candidate: ScheduledTask, workerCapabilities: readonly string[], heldAntiAffinity: readonly string[], decision: AgencyIntelligenceRouteDecision, workerExecutorKey: string, workerSpecialistId: string): boolean;
/** P7.13/P7.15: specialist composition is valid only when delegated authority and the canonical specialist projection both narrow. */
export declare function validateAgencySpecialistDelegation(request: AgencySpecialistDelegationRequest): AgencySpecialistDelegationDecision;
/** P7.16: high-risk learning/transfer/improvement requires an evaluator independent of candidate, executor and verifier ownership. */
export declare function validateAgencyIntelligenceEvaluation(request: AgencyIntelligenceEvaluationRequest): AgencyIntelligenceEvaluationDecision;
export declare function validateAgencyIntelligenceSnapshot(snapshot: AgencyIntelligenceSnapshot): AgencyIntelligenceSnapshot;
/** P7.21: intelligence choices become deterministic replay inputs without creating a second replay engine. */
export declare function agencyIntelligenceReplayChoice(snapshot: AgencyIntelligenceSnapshot, sequence: number, inputHash: string, outputHash: string): OrchestrationChoice;
/** P7.22: routing/method/specialist/improvement canaries reuse the historical safety gate and require evaluator evidence. */
export declare function evaluateAgencyIntelligenceCanary(stableSnapshot: AgencyIntelligenceSnapshot, candidateSnapshot: AgencyIntelligenceSnapshot, stableMetrics: CanaryMetrics, candidateMetrics: CanaryMetrics, evaluatorEvidenceRefs: readonly string[], maxSuccessRegression?: number): CanaryDecision;
/** P7.23: recovery fails closed on intelligence-state drift and may only preserve or narrow authority. */
export declare function validateAgencyIntelligenceRecovery(previous: AgencyIntelligenceSnapshot, recovered: AgencyIntelligenceSnapshot): AgencyIntelligenceRecoveryDecision;
