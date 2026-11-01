export type BuildLessonKind = "scope_drift" | "patch_stacking" | "lost_artifact" | "false_completion" | "bad_sequencing" | "handoff_friction" | "success_pattern";
export interface BuildLesson {
    readonly id: string;
    readonly kind: BuildLessonKind;
    readonly evidenceRefs: readonly string[];
    readonly sourceVersion: string;
    readonly statement: string;
    readonly improvementProposalRef: string;
    readonly autoApplied: false;
}
export declare function validateBuildLesson(lesson: BuildLesson): BuildLesson;
import { type NegativeKnowledgeRecord } from './transferability.js';
import type { SpecialistDecision } from '../specialists/interoperability.js';
import { type AnalyticsScope, type AnalyticsAccess } from './contracts.js';
export interface FailureIntelligence {
    readonly id: string;
    readonly scope: AnalyticsScope;
    readonly failureClass: string;
    readonly sourceVersionRefs: readonly string[];
    readonly precursorRefs: readonly string[];
    readonly impactRefs: readonly string[];
    readonly rootCauseConfidence: number;
    readonly recoveryRef: string;
    readonly detectedAfterMs: number | null;
    readonly recoveredAfterMs: number | null;
    readonly preventionProposalRef: string;
    readonly affectedPromotionRefs: readonly string[];
    readonly negativeKnowledgeRef: string;
    readonly evidenceIds: readonly string[];
}
export declare function failureIntelligence(access: AnalyticsAccess, input: FailureIntelligence, negative: NegativeKnowledgeRecord): {
    negativeKnowledgeVersion: number;
    discoverable: boolean;
    autoApplied: boolean;
    compilerSourceOnly: boolean;
    id: string;
    scope: AnalyticsScope;
    failureClass: string;
    sourceVersionRefs: readonly string[];
    precursorRefs: readonly string[];
    impactRefs: readonly string[];
    rootCauseConfidence: number;
    recoveryRef: string;
    detectedAfterMs: number | null;
    recoveredAfterMs: number | null;
    preventionProposalRef: string;
    affectedPromotionRefs: readonly string[];
    negativeKnowledgeRef: string;
    evidenceIds: readonly string[];
};
export declare function procedureOutcomeHistory(access: AnalyticsAccess, scope: AnalyticsScope, reference: {
    id: string;
    version: number;
}, resolve: (id: string, version: number) => SpecialistDecision | undefined, outcomes: readonly {
    procedureId: string;
    procedureVersion: number;
    success: boolean;
    observedAt: string;
    evidenceIds: readonly string[];
}[]): {
    procedureId: string;
    version: number;
    canonicalOwner: string;
    sourceDecisionId: string;
    sourceRuns: readonly string[];
    applicabilityScope: import("../specialists/interoperability.js").SpecialistScope;
    evidenceIds: readonly string[];
    observations: number;
    successes: number;
    failures: number;
    successRate: number | null;
    expired: boolean;
    mayPromote: boolean;
    mayExecute: boolean;
};
export declare function summarizeFailureHistory(access: AnalyticsAccess, scope: AnalyticsScope, records: readonly FailureIntelligence[]): {
    counts: Record<string, number>;
    recurrences: {
        failureClass: string;
        count: number;
    }[];
    meanRecoveryMs: number | null;
    affectedPromotionRefs: string[];
    mayAutoRollback: boolean;
};
