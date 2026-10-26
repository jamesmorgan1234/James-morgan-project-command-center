import { IntelligenceTraceFabric, type IntelligenceTraceEdge, type IntelligenceTraceNode, type TracePrivacyClass } from "../data/intelligence-trace.js";
import { compileLayeredBrainContext, type ContextOmission, type LayeredContextCandidate, type LayeredContextCompileRequest, type LayeredContextPacket } from "./context-builder.js";

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
