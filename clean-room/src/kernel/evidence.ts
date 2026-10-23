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

export function createCheckpoint(checkpoint: Checkpoint): Checkpoint {
  if (!checkpoint.exactNextAction.trim()) throw new Error("Checkpoint exactNextAction is required");
  if (checkpoint.evidenceIds.length === 0) throw new Error("Checkpoint must reference evidence");
  return Object.freeze({ ...checkpoint, evidenceIds: Object.freeze([...checkpoint.evidenceIds]) });
}
