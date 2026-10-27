import type { EnvironmentName } from "./config.js";

export type EvidenceStrength = "self_report_only" | "recorded" | "tool_result" | "canonical_record" | "live_verified";

const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  self_report_only: 0,
  recorded: 1,
  tool_result: 2,
  canonical_record: 3,
  live_verified: 4
};

const REQUIREMENT_TRUTH_STATES = new Set(["planned", "implemented_unverified", "verified", "blocked", "not_applicable"]);

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

function assertNonBlank(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required`);
}

function assertTimestamp(value: string, field: string): void {
  assertNonBlank(value, field);
  if (Number.isNaN(Date.parse(value))) throw new Error(`${field} must be a valid timestamp`);
}

function assertReferenceCollection(values: readonly string[], field: string, subjectId: string): void {
  if (values.some((value) => !value.trim())) throw new Error(`${field} contains blank references: ${subjectId}`);
  if (new Set(values).size !== values.length) throw new Error(`${field} contains duplicate references: ${subjectId}`);
}

function hasValidEvidenceShape(record: EvidenceRecord): boolean {
  if (!record.id?.trim() || !record.subjectId?.trim() || !record.sourceRef?.trim()) return false;
  if (!(record.strength in STRENGTH_RANK)) return false;
  if (!record.recordedAt?.trim() || Number.isNaN(Date.parse(record.recordedAt))) return false;
  if (record.schemaVersion !== undefined && (!Number.isInteger(record.schemaVersion) || record.schemaVersion < 1)) return false;
  for (const optionalRef of [record.codeRef, record.configDigest, record.testRef, record.scopeRef]) {
    if (optionalRef !== undefined && !optionalRef.trim()) return false;
  }
  return true;
}

export function validateEvidenceRecord(record: EvidenceRecord): EvidenceRecord {
  assertNonBlank(record.id, "Evidence id");
  assertNonBlank(record.subjectId, "Evidence subjectId");
  assertNonBlank(record.sourceRef, "Evidence sourceRef");
  if (!(record.strength in STRENGTH_RANK)) throw new Error(`Unknown evidence strength: ${String(record.strength)}`);
  assertTimestamp(record.recordedAt, "Evidence recordedAt");
  if (record.schemaVersion !== undefined && (!Number.isInteger(record.schemaVersion) || record.schemaVersion < 1)) throw new Error("Evidence schemaVersion must be a positive integer");
  for (const [field, value] of [["codeRef", record.codeRef], ["configDigest", record.configDigest], ["testRef", record.testRef], ["scopeRef", record.scopeRef]] as const) {
    if (value !== undefined) assertNonBlank(value, `Evidence ${field}`);
  }
  return Object.freeze({ ...record });
}

export function evidenceMeets(record: EvidenceRecord, minimum: EvidenceStrength): boolean {
  if (!hasValidEvidenceShape(record)) return false;
  return record.verified === true && STRENGTH_RANK[record.strength] >= STRENGTH_RANK[minimum];
}

export function assertCompletionEvidence(records: readonly EvidenceRecord[], subjectId: string, minimum: EvidenceStrength): void {
  assertNonBlank(subjectId, "Completion subjectId");
  if (!records.some((record) => record.subjectId === subjectId && evidenceMeets(record, minimum))) {
    throw new Error(`Completion evidence missing for ${subjectId}; minimum=${minimum}`);
  }
}

export function validateRequirementClosure(record: RequirementClosureRecord): RequirementClosureRecord {
  assertNonBlank(record.requirementId, "Requirement closure requirementId");
  assertNonBlank(record.authoritativeSource, "Requirement closure authoritativeSource");
  assertNonBlank(record.capabilityKey, "Requirement closure capabilityKey");
  assertNonBlank(record.owningPhase, "Requirement closure owningPhase");
  if (!REQUIREMENT_TRUTH_STATES.has(record.truthState)) throw new Error(`Unknown requirement truth state: ${String(record.truthState)}`);

  const collections = [
    ["dependencyIds", record.dependencyIds],
    ["implementationRefs", record.implementationRefs],
    ["positiveTestRefs", record.positiveTestRefs],
    ["negativeTestRefs", record.negativeTestRefs],
    ["failureTestRefs", record.failureTestRefs],
    ["evidenceIds", record.evidenceIds]
  ] as const;
  for (const [field, values] of collections) assertReferenceCollection(values, field, record.requirementId);

  if (record.truthState === "verified") {
    if (
      record.implementationRefs.length === 0 ||
      record.evidenceIds.length === 0 ||
      record.positiveTestRefs.length === 0 ||
      record.negativeTestRefs.length === 0 ||
      record.failureTestRefs.length === 0
    ) {
      throw new Error("Verified requirement requires implementation, positive, negative, failure-path tests, and evidence");
    }
  }
  if ((record.truthState === "blocked" || record.truthState === "not_applicable") && !record.blockerOrNonApplicabilityReason?.trim()) {
    throw new Error("Blocked/not-applicable requirement needs a reason");
  }

  return Object.freeze({
    ...record,
    dependencyIds: Object.freeze([...record.dependencyIds]),
    implementationRefs: Object.freeze([...record.implementationRefs]),
    positiveTestRefs: Object.freeze([...record.positiveTestRefs]),
    negativeTestRefs: Object.freeze([...record.negativeTestRefs]),
    failureTestRefs: Object.freeze([...record.failureTestRefs]),
    evidenceIds: Object.freeze([...record.evidenceIds])
  });
}

export function createCheckpoint(checkpoint: Checkpoint): Checkpoint {
  assertNonBlank(checkpoint.id, "Checkpoint id");
  assertNonBlank(checkpoint.subjectId, "Checkpoint subjectId");
  assertNonBlank(checkpoint.summary, "Checkpoint summary");
  assertNonBlank(checkpoint.exactNextAction, "Checkpoint exactNextAction");
  assertTimestamp(checkpoint.createdAt, "Checkpoint createdAt");
  if (checkpoint.evidenceIds.length === 0) throw new Error("Checkpoint must reference evidence");
  assertReferenceCollection(checkpoint.evidenceIds, "Checkpoint evidenceIds", checkpoint.id);
  return Object.freeze({ ...checkpoint, evidenceIds: Object.freeze([...checkpoint.evidenceIds]) });
}

export function selectLastVerifiedCheckpoint(
  checkpoints: readonly Checkpoint[],
  evidenceRecords: readonly EvidenceRecord[],
  subjectId: string,
  minimum: EvidenceStrength
): Checkpoint | undefined {
  assertNonBlank(subjectId, "Checkpoint resume subjectId");
  if (!(minimum in STRENGTH_RANK)) throw new Error(`Unknown evidence strength: ${String(minimum)}`);

  const evidenceById = new Map<string, EvidenceRecord>();
  for (const record of evidenceRecords) {
    assertNonBlank(record.id, "Evidence id");
    if (evidenceById.has(record.id)) throw new Error(`Duplicate evidence id: ${record.id}`);
    evidenceById.set(record.id, record);
  }

  const candidates: Checkpoint[] = [];
  for (const checkpoint of checkpoints) {
    if (checkpoint.subjectId !== subjectId) continue;

    let validated: Checkpoint;
    try {
      validated = createCheckpoint(checkpoint);
    } catch {
      continue;
    }

    const fullyVerified = validated.evidenceIds.every((evidenceId) => {
      const record = evidenceById.get(evidenceId);
      return record !== undefined && record.subjectId === subjectId && evidenceMeets(record, minimum);
    });
    if (fullyVerified) candidates.push(validated);
  }

  candidates.sort((left, right) => {
    const timeDifference = Date.parse(right.createdAt) - Date.parse(left.createdAt);
    if (timeDifference !== 0) return timeDifference;
    return right.id.localeCompare(left.id);
  });

  return candidates[0];
}
