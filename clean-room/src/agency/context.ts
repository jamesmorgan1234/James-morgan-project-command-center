import { parseTimestamp } from "../security/types.js";

export interface AgencyContextSourceRef {
  readonly id: string;
  readonly version: number;
  readonly contentHash: string;
  readonly sensitivityRank: number;
}

export interface AgencyContextPacket {
  readonly id: string;
  readonly runId: string;
  readonly taskId: string;
  readonly projectId: string;
  readonly builtAt: string;
  readonly staleAfter: string;
  readonly maxSensitivityRank: number;
  readonly sourceRefs: readonly AgencyContextSourceRef[];
  readonly artifactRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface AgencyExecutionContextPacket extends AgencyContextPacket {
  readonly missionRef: string;
  readonly ownerRuleRefs: readonly string[];
  readonly protectedAssetRefs: readonly string[];
  readonly allowedToolRefs: readonly string[];
  readonly readScopes: readonly string[];
  readonly writeScopes: readonly string[];
  readonly dependencyRefs: readonly string[];
  readonly acceptanceCriteriaRefs: readonly string[];
  readonly authorizationSnapshotRef: string;
}

function uniqueNonBlank(values: readonly string[], label: string, allowEmpty = false): readonly string[] {
  const normalized = values.map((value) => value.trim());
  if ((!allowEmpty && normalized.length === 0) || normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

export function createAgencyContextPacket(packet: AgencyContextPacket): AgencyContextPacket {
  if (!packet.id.trim() || !packet.runId.trim() || !packet.taskId.trim() || !packet.projectId.trim()) throw new Error("Agency context identity fields are required");
  if (parseTimestamp(packet.staleAfter, "staleAfter") <= parseTimestamp(packet.builtAt, "builtAt")) throw new Error("Agency context staleAfter must follow builtAt");
  for (const source of packet.sourceRefs) if (source.sensitivityRank > packet.maxSensitivityRank) throw new Error(`Context source exceeds sensitivity envelope: ${source.id}`);
  return Object.freeze({ ...packet, sourceRefs: Object.freeze(packet.sourceRefs.map((source) => Object.freeze({ ...source }))), artifactRefs: Object.freeze([...packet.artifactRefs]), evidenceRefs: Object.freeze([...packet.evidenceRefs]) });
}

export function createAgencyExecutionContextPacket(packet: AgencyExecutionContextPacket): AgencyExecutionContextPacket {
  const base = createAgencyContextPacket(packet);
  if (!packet.missionRef.trim() || !packet.authorizationSnapshotRef.trim()) throw new Error("Agency execution context requires mission and authorization snapshot");
  return Object.freeze({
    ...base,
    missionRef: packet.missionRef.trim(),
    ownerRuleRefs: uniqueNonBlank(packet.ownerRuleRefs, "Agency execution owner rules"),
    protectedAssetRefs: uniqueNonBlank(packet.protectedAssetRefs, "Agency execution protected assets", true),
    allowedToolRefs: uniqueNonBlank(packet.allowedToolRefs, "Agency execution allowed tools"),
    readScopes: uniqueNonBlank(packet.readScopes, "Agency execution read scopes"),
    writeScopes: uniqueNonBlank(packet.writeScopes, "Agency execution write scopes", true),
    dependencyRefs: uniqueNonBlank(packet.dependencyRefs, "Agency execution dependencies", true),
    acceptanceCriteriaRefs: uniqueNonBlank(packet.acceptanceCriteriaRefs, "Agency execution acceptance criteria"),
    authorizationSnapshotRef: packet.authorizationSnapshotRef.trim()
  });
}

export function assertContextFresh(packet: AgencyContextPacket, now: string): void {
  if (parseTimestamp(now, "now") >= parseTimestamp(packet.staleAfter, "staleAfter")) throw new Error("Agency context packet is stale and requires revalidation");
}
