import { type CanaryMetrics } from "../agency/rollout.js";
import { type RestoreRevalidationInput } from "../data/recovery.js";
import type { ImprovementProposal } from "./improvements.js";
export type ImprovementLifecycleStage = "proposed" | "evidence_validated" | "scoped" | "risk_assessed" | "evaluated" | "baseline_locked" | "authorized" | "shadow" | "canary" | "verified" | "promoted" | "monitoring" | "rolled_back" | "lesson_recorded" | "rejected";
export type ImprovementRiskClass = "low" | "moderate" | "high" | "critical";
export interface ImprovementGovernancePlan {
    readonly proposalId: string;
    readonly applicabilityRefs: readonly string[];
    readonly requestedPermissionRefs: readonly string[];
    readonly minimumEffectConfidence: number;
    readonly maximumCanaryFraction: number;
    readonly rollbackCheckpointRef: string;
    readonly evidenceRefs: readonly string[];
}
export interface ImprovementEvaluationRecord {
    readonly evaluatorRef: string;
    readonly evaluatorVersion: number;
    readonly acceptanceEligible: boolean;
    readonly calibratedConfidence: number;
    readonly effectsCertain: boolean;
    readonly evidenceRefs: readonly string[];
    readonly evaluatedAt: string;
}
export interface ImprovementBaseline {
    readonly baselineRef: string;
    readonly acceptanceFingerprint: string;
    readonly lockedAt: string;
    readonly evidenceRefs: readonly string[];
}
export interface ImprovementAuthorization {
    readonly id: string;
    readonly proposalId: string;
    readonly issuerRef: string;
    readonly policyEpoch: number;
    readonly revocationEpoch: number;
    readonly permissionRefs: readonly string[];
    readonly maximumCanaryFraction: number;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly revokedAt?: string;
    readonly evidenceRefs: readonly string[];
}
export interface ImprovementIntelligenceSnapshot {
    readonly id: string;
    readonly proposalId: string;
    readonly capturedAt: string;
    readonly policyEpoch: number;
    readonly revocationEpoch: number;
    readonly exactVersionRefs: readonly string[];
    readonly learningRefs: readonly string[];
    readonly permissionRefs: readonly string[];
    readonly traceRef: string;
    readonly baselineRef: string;
    readonly acceptanceFingerprint: string;
    readonly rollbackCheckpointRef: string;
    readonly evidenceRefs: readonly string[];
}
export interface ImprovementMonitoringObservation {
    readonly id: string;
    readonly proposalId: string;
    readonly observedAt: string;
    readonly healthy: boolean;
    readonly effectConfidence: number;
    readonly permissionRefs: readonly string[];
    readonly acceptanceFingerprint: string;
    readonly evidenceRefs: readonly string[];
}
export interface ImprovementTransition {
    readonly proposalId: string;
    readonly version: number;
    readonly sequence: number;
    readonly from: ImprovementLifecycleStage | null;
    readonly to: ImprovementLifecycleStage;
    readonly occurredAt: string;
    readonly actorRef: string;
    readonly reason: string;
    readonly evidenceRefs: readonly string[];
    readonly snapshotRef?: string;
    readonly authorizationRef?: string;
}
export interface ImprovementLifecycleView {
    readonly proposal: ImprovementProposal;
    readonly plan: ImprovementGovernancePlan;
    readonly stage: ImprovementLifecycleStage;
    readonly version: number;
    readonly riskClass?: ImprovementRiskClass;
    readonly evaluation?: ImprovementEvaluationRecord;
    readonly baseline?: ImprovementBaseline;
    readonly authorization?: ImprovementAuthorization;
    readonly snapshot?: ImprovementIntelligenceSnapshot;
    readonly transitions: readonly ImprovementTransition[];
    readonly monitoring: readonly ImprovementMonitoringObservation[];
}
export interface ImprovementCurrentAuthority {
    readonly policyEpoch: number;
    readonly revocationEpoch: number;
    readonly invalidatedLearningRefs: readonly string[];
    readonly revokedAuthorizationRefs: readonly string[];
    readonly now: string;
}
export declare function validateImprovementAuthorization(authorization: ImprovementAuthorization): ImprovementAuthorization;
export declare function validateImprovementSnapshot(snapshot: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority): ImprovementIntelligenceSnapshot;
export declare function assertImprovementRestoreCurrent(snapshot: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority, restore: RestoreRevalidationInput): void;
export declare class SelfImprovementGovernor {
    #private;
    register(proposal: ImprovementProposal, planInput: ImprovementGovernancePlan, actorRef: string, occurredAt: string): ImprovementLifecycleView;
    validateEvidence(proposalId: string, expectedVersion: number, evidenceRefs: readonly string[], actorRef: string, occurredAt: string): ImprovementLifecycleView;
    confirmScope(proposalId: string, expectedVersion: number, applicabilityRefs: readonly string[], requestedPermissionRefs: readonly string[], actorRef: string, occurredAt: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    assessRisk(proposalId: string, expectedVersion: number, riskClass: ImprovementRiskClass, actorRef: string, occurredAt: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    recordEvaluation(proposalId: string, expectedVersion: number, evaluationInput: ImprovementEvaluationRecord, actorRef: string): ImprovementLifecycleView;
    lockBaseline(proposalId: string, expectedVersion: number, baselineInput: ImprovementBaseline, actorRef: string): ImprovementLifecycleView;
    authorize(proposalId: string, expectedVersion: number, authorizationInput: ImprovementAuthorization, snapshotInput: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority, actorRef: string): ImprovementLifecycleView;
    beginShadow(proposalId: string, expectedVersion: number, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    beginCanary(proposalId: string, expectedVersion: number, fraction: number, stable: CanaryMetrics, candidate: CanaryMetrics, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    verify(proposalId: string, expectedVersion: number, observedAcceptanceFingerprint: string, effectConfidence: number, effectsCertain: boolean, evaluatorAcceptanceEligible: boolean, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    promote(proposalId: string, expectedVersion: number, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    monitor(proposalId: string, expectedVersion: number, observationInput: ImprovementMonitoringObservation, authority: ImprovementCurrentAuthority, actorRef: string): ImprovementLifecycleView;
    rollback(proposalId: string, expectedVersion: number, rollbackCheckpointRef: string, authority: ImprovementCurrentAuthority, actorRef: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    recordLesson(proposalId: string, expectedVersion: number, lessonRefs: readonly string[], actorRef: string, occurredAt: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    reject(proposalId: string, expectedVersion: number, actorRef: string, occurredAt: string, reason: string, evidenceRefs: readonly string[]): ImprovementLifecycleView;
    restoreSnapshot(proposalId: string, expectedVersion: number, snapshot: ImprovementIntelligenceSnapshot, authority: ImprovementCurrentAuthority, restore: RestoreRevalidationInput): ImprovementLifecycleView;
    get(proposalId: string): ImprovementLifecycleView | undefined;
}
