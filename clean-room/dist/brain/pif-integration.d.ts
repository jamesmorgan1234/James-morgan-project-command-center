import type { TransferAssessment } from "../analytics/transferability.js";
import type { LearningPacket, PromotionDecision } from "../data/learning.js";
import { IntelligenceTraceFabric, type IntelligenceTraceEdge, type IntelligenceTraceNode } from "../data/intelligence-trace.js";
import { type LayeredContextCandidate, type LayeredContextCompileRequest, type LayeredContextPacket } from "./context-builder.js";
import type { SpecialistModelContract } from "./specialists.js";
/**
 * Canonical PIF hardening trace gateway. The lower-level trace fabric remains a storage primitive;
 * this gateway enforces privacy monotonicity so private lineage cannot be widened into a broader trace.
 */
export declare class GovernedIntelligenceTraceFabric extends IntelligenceTraceFabric {
    connect(input: IntelligenceTraceEdge): IntelligenceTraceEdge;
}
export interface BrainScopedContextCompileRequest extends LayeredContextCompileRequest {
    readonly brainId: string;
}
export type BrainScopedContextPacket<T = unknown> = LayeredContextPacket<T> & {
    readonly brainId: string;
};
/**
 * Canonical cross-PIF context compiler. Shared memories without a brain binding remain eligible;
 * specialist-local memories must be explicitly bound to the requesting Brain, and any explicitly
 * bound memory is excluded from a different Brain with a durable omission reason.
 */
export declare function compileBrainScopedLayeredContext<T>(request: BrainScopedContextCompileRequest, candidates: readonly LayeredContextCandidate<T>[]): BrainScopedContextPacket<T>;
export declare function assertTraceNodePrivacyMonotonicity(from: IntelligenceTraceNode, to: IntelligenceTraceNode): void;
export interface CrossBrainLearningProjection {
    readonly sourceBrainId: string;
    readonly sourceBrainVersion: number;
    readonly targetBrainId: string;
    readonly targetBrainVersion: number;
    readonly learningPacketRef: string;
    readonly promotionRef: string;
    readonly transferAssessmentRef: string;
    readonly capabilityKey: string;
    readonly sourceMethodId: string;
    readonly taskClass: string;
    readonly evidenceRefs: readonly string[];
    readonly executablePolicy: false;
}
/**
 * P6.6 governed cross-Brain learning bridge. It accepts only canonical validated Learning Packets
 * that already passed scoped promotion and transferability evaluation. The result is a non-executable
 * projection, so learning cannot silently install policy, permissions, tools, or authority.
 */
export declare function projectGovernedCrossBrainLearning(input: {
    readonly source: SpecialistModelContract;
    readonly target: SpecialistModelContract;
    readonly packet: LearningPacket;
    readonly promotion: PromotionDecision;
    readonly transfer: TransferAssessment;
}): CrossBrainLearningProjection;
