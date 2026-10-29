import { evidenceMeets, validateEvidenceRecord, type EvidenceRecord } from "./evidence.js";
import { SafeFeatureFlags, type FeatureFlagRecord } from "./resilience.js";
import { parseTimestamp } from "../security/types.js";

export interface DeploymentHealthEvidence extends EvidenceRecord {
  readonly candidateId: string;
  readonly deploymentId: string;
  readonly health: "healthy" | "degraded" | "failed";
  readonly validUntil: string;
}

export interface ReleaseFeatureActivationRequest {
  readonly candidateId: string;
  readonly deploymentId: string;
  readonly scopeRef: string;
  readonly now: string;
}

function assertNonBlank(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required`);
}

export class ReleaseFeatureActivationGate {
  readonly #flags: SafeFeatureFlags;
  readonly #consumedHealthEvidenceIds = new Set<string>();

  constructor(flags: SafeFeatureFlags) {
    this.#flags = flags;
  }

  enable(record: FeatureFlagRecord, expectedVersion: number, evidence: DeploymentHealthEvidence | undefined, request: ReleaseFeatureActivationRequest): void {
    if (!record.enabled) throw new Error("Release feature activation requires an enabled target record");
    if (!evidence || typeof evidence !== "object") throw new Error("Deployment health evidence is required");
    assertNonBlank(request.candidateId, "Release candidateId");
    assertNonBlank(request.deploymentId, "Release deploymentId");
    assertNonBlank(request.scopeRef, "Release scopeRef");
    validateEvidenceRecord(evidence);
    if (!evidenceMeets(evidence, "live_verified")) throw new Error("Deployment health evidence must be verified live-verified evidence");
    assertNonBlank(evidence.candidateId, "Health evidence candidateId");
    assertNonBlank(evidence.deploymentId, "Health evidence deploymentId");
    if (evidence.subjectId !== request.deploymentId || evidence.deploymentId !== request.deploymentId) throw new Error("Deployment health evidence does not match the exact deployment");
    if (evidence.candidateId !== request.candidateId) throw new Error("Deployment health evidence does not match the exact release candidate");
    if (evidence.scopeRef !== request.scopeRef) throw new Error("Deployment health evidence does not match the required scope");
    if (evidence.health !== "healthy") throw new Error(`Deployment health must be healthy before feature activation: ${evidence.health}`);
    const observedAt = parseTimestamp(evidence.recordedAt, "health evidence recordedAt");
    const validUntil = parseTimestamp(evidence.validUntil, "health evidence validUntil");
    const now = parseTimestamp(request.now, "release activation now");
    if (validUntil <= observedAt) throw new Error("Deployment health evidence validity must extend beyond observation");
    if (observedAt > now) throw new Error("Deployment health evidence cannot be observed in the future");
    if (now >= validUntil) throw new Error("Deployment health evidence is stale");
    if (this.#consumedHealthEvidenceIds.has(evidence.id)) throw new Error(`Deployment health evidence already consumed: ${evidence.id}`);
    this.#flags.replace(record, expectedVersion);
    this.#consumedHealthEvidenceIds.add(evidence.id);
  }
}
