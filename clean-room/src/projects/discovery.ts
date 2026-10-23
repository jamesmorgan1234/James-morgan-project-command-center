export type CandidateDisposition = "add" | "merge" | "park" | "reject" | "research";

export interface ProjectMissionFingerprint {
  readonly projectId: string;
  readonly name: string;
  readonly mission: string;
}

export interface ProjectCandidate {
  readonly id: string;
  readonly proposedName: string;
  readonly mission: string;
  readonly sourceRefs: readonly string[];
}

export interface DuplicateSignal {
  readonly projectId: string;
  readonly score: number;
  readonly reason: string;
}

function tokens(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length >= 3));
}

export function missionSimilarity(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / union.size;
}

export function discoverDuplicateSignals(candidate: ProjectCandidate, projects: readonly ProjectMissionFingerprint[], threshold = 0.42): readonly DuplicateSignal[] {
  if (candidate.sourceRefs.length === 0) throw new Error("Project candidate requires provenance");
  return Object.freeze(projects
    .map((project) => ({ projectId: project.projectId, score: missionSimilarity(candidate.mission, project.mission), reason: "mission_token_similarity" }))
    .filter((signal) => signal.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map((signal) => Object.freeze(signal)));
}

export interface CandidateDecision {
  readonly candidateId: string;
  readonly disposition: CandidateDisposition;
  readonly ownerDecisionRef: string;
  readonly targetProjectId?: string;
}

export function assertOwnerGovernedCandidateDecision(decision: CandidateDecision): void {
  if (!decision.candidateId.trim() || !decision.ownerDecisionRef.trim()) throw new Error("Candidate disposition requires explicit owner decision evidence");
  if (decision.disposition === "merge" && !decision.targetProjectId?.trim()) throw new Error("Merge disposition requires targetProjectId");
}
