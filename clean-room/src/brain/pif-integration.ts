import type { TransferAssessment } from "../analytics/transferability.js";
import type { LearningPacket, PromotionDecision } from "../data/learning.js";
import { IntelligenceTraceFabric, type IntelligenceTraceEdge, type IntelligenceTraceNode, type TracePrivacyClass } from "../data/intelligence-trace.js";
import { compileLayeredBrainContext, type ContextOmission, type LayeredContextCandidate, type LayeredContextCompileRequest, type LayeredContextPacket } from "./context-builder.js";
import type { SpecialistModelContract } from "./specialists.js";

const PRIVACY_RANK: Readonly<Record<TracePrivacyClass, number>> = Object.freeze({
  ecosystem_shared: 0,
  domain_shared: 1,
  company_private: 2,
  project_private: 3,
  owner_private: 4
});

const SCOPED_PRIVACY = new Set<TracePrivacyClass>(["domain_shared", "company_private", "project_private"]);

/**
 * Canonical PIF hardening trace gateway. The lower-level trace fabric remains a storage primitive;
 * this gateway enforces privacy monotonicity so private lineage cannot be widened into a broader trace.
 */
export class GovernedIntelligenceTraceFabric extends IntelligenceTraceFabric {
  override connect(input: IntelligenceTraceEdge): IntelligenceTraceEdge {
    const from = this.getNode(input.fromId, input.fromVersion);
    const to = this.getNode(input.toId, input.toVersion);
    if (!from || !to) throw new Error(`Trace edge requires exact registered endpoint versions: ${input.id}`);
    if (PRIVACY_RANK[from.privacy] > PRIVACY_RANK[to.privacy]) throw new Error("Trace edge cannot widen privacy boundary");
    if (from.privacy === to.privacy && SCOPED_PRIVACY.has(from.privacy) && from.scopeRef !== to.scopeRef) throw new Error("Trace edge cannot cross same-class scope boundary");
    return super.connect(input);
  }
}

export interface BrainScopedContextCompileRequest extends LayeredContextCompileRequest {
  readonly brainId: string;
}

export type BrainScopedContextPacket<T = unknown> = LayeredContextPacket<T> & { readonly brainId: string };

function brainBoundaryOmission<T>(candidate: LayeredContextCandidate<T>): ContextOmission {
  return Object.freeze({
    memoryId: candidate.memory.id,
    memoryVersion: candidate.memory.version,
    layer: candidate.metadata.layer,
    reason: "brain_boundary",
    sourceRefs: Object.freeze([...candidate.memory.sourceRefs]),
    dependencyRefs: Object.freeze([...candidate.metadata.dependencyRefs])
  });
}

/**
 * Canonical cross-PIF context compiler. Shared memories without a brain binding remain eligible;
 * specialist-local memories must be explicitly bound to the requesting Brain, and any explicitly
 * bound memory is excluded from a different Brain with a durable omission reason.
 */
export function compileBrainScopedLayeredContext<T>(request: BrainScopedContextCompileRequest, candidates: readonly LayeredContextCandidate<T>[]): BrainScopedContextPacket<T> {
  if (!request.brainId.trim()) throw new Error("Context brainId is required");
  const allowed: LayeredContextCandidate<T>[] = [];
  const brainOmissions: ContextOmission[] = [];
  for (const candidate of candidates) {
    const boundBrain = candidate.metadata.brainId;
    const specialistRequiresBinding = candidate.metadata.layer === "specialist_local";
    if ((boundBrain !== undefined && boundBrain !== request.brainId) || (specialistRequiresBinding && !boundBrain)) {
      brainOmissions.push(brainBoundaryOmission(candidate));
      continue;
    }
    allowed.push(candidate);
  }
  const compiled = compileLayeredBrainContext(request, allowed);
  return Object.freeze({
    ...compiled,
    brainId: request.brainId,
    omitted: Object.freeze([...compiled.omitted, ...brainOmissions].sort((a, b) => a.memoryId.localeCompare(b.memoryId)))
  });
}

export function assertTraceNodePrivacyMonotonicity(from: IntelligenceTraceNode, to: IntelligenceTraceNode): void {
  if (from.ownerId !== to.ownerId) throw new Error("Trace nodes cross owner boundary");
  if (PRIVACY_RANK[from.privacy] > PRIVACY_RANK[to.privacy]) throw new Error("Trace nodes widen privacy boundary");
  if (from.privacy === to.privacy && SCOPED_PRIVACY.has(from.privacy) && from.scopeRef !== to.scopeRef) throw new Error("Trace nodes cross same-class scope boundary");
}

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

function activeSpecialist(model: SpecialistModelContract, label: string): void {
  if (!model.enabled || model.lifecycle !== "active" || model.health === "unavailable") throw new Error(`${label} Brain must be active and available`);
  if (model.controlPlane !== "command_center") throw new Error(`${label} Brain must remain under Command Center control`);
}

/**
 * P6.6 governed cross-Brain learning bridge. It accepts only canonical validated Learning Packets
 * that already passed scoped promotion and transferability evaluation. The result is a non-executable
 * projection, so learning cannot silently install policy, permissions, tools, or authority.
 */
export function projectGovernedCrossBrainLearning(input: {
  readonly source: SpecialistModelContract;
  readonly target: SpecialistModelContract;
  readonly packet: LearningPacket;
  readonly promotion: PromotionDecision;
  readonly transfer: TransferAssessment;
}): CrossBrainLearningProjection {
  activeSpecialist(input.source, "Source");
  activeSpecialist(input.target, "Target");
  if (input.source.key === input.target.key) throw new Error("Cross-Brain learning requires distinct source and target Brains");
  if (input.packet.sourceBrainId !== input.source.key) throw new Error("Learning packet source Brain mismatch");
  if (input.packet.validationState !== "validated") throw new Error("Cross-Brain learning requires validated learning");
  if (input.promotion.packetId !== input.packet.id || input.promotion.packetVersion !== input.packet.version || input.promotion.lifecycle !== "promoted") throw new Error("Cross-Brain learning requires exact promoted packet version");
  if (input.promotion.executablePolicy !== false) throw new Error("Learning promotion cannot become executable policy");
  if (input.promotion.applicability.scope !== "brain" || input.promotion.applicability.ref !== input.target.key) throw new Error("Cross-Brain promotion must be explicitly scoped to the target Brain");
  if (input.transfer.sourceRef !== `${input.packet.id}@${input.packet.version}` || input.transfer.decision !== "eligible") throw new Error("Cross-Brain learning requires an eligible exact-packet transfer assessment");
  if (!input.target.capabilityKeys.includes(input.packet.sourceCapabilityKey)) throw new Error("Target Brain lacks promoted learning capability");
  if (!input.target.supportedWorkClasses.includes(input.packet.taskClass)) throw new Error("Target Brain does not support the learning task class");

  const evidenceRefs = Object.freeze([...new Set([
    ...input.packet.evidenceIds,
    ...input.packet.provenanceEvidenceIds,
    ...input.promotion.evidenceIds,
    ...input.transfer.evidenceRefs,
    ...input.transfer.applicabilityEvidenceRefs,
    ...input.transfer.evaluatorEvidenceRefs
  ])].sort());
  if (evidenceRefs.length === 0) throw new Error("Cross-Brain learning requires evidence");

  return Object.freeze({
    sourceBrainId: input.source.key,
    sourceBrainVersion: input.source.version,
    targetBrainId: input.target.key,
    targetBrainVersion: input.target.version,
    learningPacketRef: `${input.packet.id}@${input.packet.version}`,
    promotionRef: `${input.promotion.id}@${input.promotion.version}`,
    transferAssessmentRef: `${input.transfer.id}@${input.transfer.version}`,
    capabilityKey: input.packet.sourceCapabilityKey,
    sourceMethodId: input.packet.sourceMethodId,
    taskClass: input.packet.taskClass,
    evidenceRefs,
    executablePolicy: false
  });
}
