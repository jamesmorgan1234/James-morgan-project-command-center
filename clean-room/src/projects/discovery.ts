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

function assertNonblankUnique(values: readonly string[], label: string): void {
  if (values.length === 0) throw new Error(`${label} is required`);
  if (values.some((value) => !value.trim())) throw new Error(`${label} entries cannot be blank`);
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
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
  if (!candidate.id.trim() || !candidate.proposedName.trim() || !candidate.mission.trim()) throw new Error("Project candidate identity, name, and mission are required");
  assertNonblankUnique(candidate.sourceRefs, "Project candidate provenance");
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error("Duplicate-signal threshold must be between 0 and 1");
  for (const project of projects) {
    if (!project.projectId.trim() || !project.name.trim() || !project.mission.trim()) throw new Error("Project mission fingerprints require projectId, name, and mission");
  }
  return Object.freeze(projects
    .map((project) => ({ projectId: project.projectId, score: missionSimilarity(candidate.mission, project.mission), reason: "mission_token_similarity" }))
    .filter((signal) => signal.score >= threshold)
    .sort((a, b) => b.score - a.score || a.projectId.localeCompare(b.projectId))
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
  if (decision.disposition !== "merge" && decision.targetProjectId?.trim()) throw new Error("Only merge disposition may specify targetProjectId");
}
