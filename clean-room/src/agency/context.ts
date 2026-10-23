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

export function createAgencyContextPacket(packet: AgencyContextPacket): AgencyContextPacket {
  if (!packet.id.trim() || !packet.runId.trim() || !packet.taskId.trim() || !packet.projectId.trim()) throw new Error("Agency context identity fields are required");
  if (parseTimestamp(packet.staleAfter, "staleAfter") <= parseTimestamp(packet.builtAt, "builtAt")) throw new Error("Agency context staleAfter must follow builtAt");
  for (const source of packet.sourceRefs) if (source.sensitivityRank > packet.maxSensitivityRank) throw new Error(`Context source exceeds sensitivity envelope: ${source.id}`);
  return Object.freeze({ ...packet, sourceRefs: Object.freeze(packet.sourceRefs.map((source) => Object.freeze({ ...source }))), artifactRefs: Object.freeze([...packet.artifactRefs]), evidenceRefs: Object.freeze([...packet.evidenceRefs]) });
}

export function assertContextFresh(packet: AgencyContextPacket, now: string): void {
  if (parseTimestamp(now, "now") >= parseTimestamp(packet.staleAfter, "staleAfter")) throw new Error("Agency context packet is stale and requires revalidation");
}
