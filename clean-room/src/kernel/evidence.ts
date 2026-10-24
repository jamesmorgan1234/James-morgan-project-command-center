import type { EnvironmentName } from "./config.js";

export type EvidenceStrength = "self_report_only" | "recorded" | "tool_result" | "canonical_record" | "live_verified";

const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  self_report_only: 0,
  recorded: 1,
  tool_result: 2,
  canonical_record: 3,
  live_verified: 4
};

export interface EvidenceRecord {
  readonly id: string;
  readonly subjectId: string;
  readonly strength: EvidenceStrength;
  readonly sourceRef: string;
  readonly recordedAt: string;
  readonly verified: boolean;
  readonly codeRef?: string;
  readonly configDigest?: string;
  readonly schemaVersion?: number;
  readonly environment?: EnvironmentName;
  readonly testRef?: string;
  readonly scopeRef?: string;
}

export interface RequirementClosureRecord {
  readonly requirementId: string;
  readonly authoritativeSource: string;
  readonly capabilityKey: string;
  readonly owningPhase: string;
  readonly dependencyIds: readonly string[];
  readonly implementationRefs: readonly string[];
  readonly positiveTestRefs: readonly string[];
  readonly negativeTestRefs: readonly string[];
  readonly failureTestRefs: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly truthState: "planned" | "implemented_unverified" | "verified" | "blocked" | "not_applicable";
  readonly blockerOrNonApplicabilityReason?: string;
}

export interface Checkpoint {
  readonly id: string;
  readonly subjectId: string;
  readonly summary: string;
  readonly exactNextAction: string;
  readonly evidenceIds: readonly string[];
  readonly createdAt: string;
}

export function evidenceMeets(record: EvidenceRecord, minimum: EvidenceStrength): boolean {
  return record.verified && STRENGTH_RANK[record.strength] >= STRENGTH_RANK[minimum];
}

export function assertCompletionEvidence(records: readonly EvidenceRecord[], subjectId: string, minimum: EvidenceStrength): void {
  if (!records.some((record) => record.subjectId === subjectId && evidenceMeets(record, minimum))) {
    throw new Error(`Completion evidence missing for ${subjectId}; minimum=${minimum}`);
  }
}

export function validateRequirementClosure(record: RequirementClosureRecord): RequirementClosureRecord {
  if (!record.requirementId.trim() || !record.authoritativeSource.trim() || !record.capabilityKey.trim() || !record.owningPhase.trim()) throw new Error("Requirement closure identity fields are required");
  const collections = [record.dependencyIds, record.implementationRefs, record.positiveTestRefs, record.negativeTestRefs, record.failureTestRefs, record.evidenceIds];
  for (const values of collections) if (new Set(values).size !== values.length) throw new Error(`Requirement closure contains duplicate references: ${record.requirementId}`);
  if (record.truthState === "verified" && (record.implementationRefs.length === 0 || record.evidenceIds.length === 0 || record.positiveTestRefs.length === 0)) throw new Error("Verified requirement requires implementation, positive tests, and evidence");
  if ((record.truthState === "blocked" || record.truthState === "not_applicable") && !record.blockerOrNonApplicabilityReason?.trim()) throw new Error("Blocked/not-applicable requirement needs a reason");
  return Object.freeze({ ...record, dependencyIds: Object.freeze([...record.dependencyIds]), implementationRefs: Object.freeze([...record.implementationRefs]), positiveTestRefs: Object.freeze([...record.positiveTestRefs]), negativeTestRefs: Object.freeze([...record.negativeTestRefs]), failureTestRefs: Object.freeze([...record.failureTestRefs]), evidenceIds: Object.freeze([...record.evidenceIds]) });
}

export function createCheckpoint(checkpoint: Checkpoint): Checkpoint {
  if (!checkpoint.exactNextAction.trim()) throw new Error("Checkpoint exactNextAction is required");
  if (checkpoint.evidenceIds.length === 0) throw new Error("Checkpoint must reference evidence");
  return Object.freeze({ ...checkpoint, evidenceIds: Object.freeze([...checkpoint.evidenceIds]) });
}
