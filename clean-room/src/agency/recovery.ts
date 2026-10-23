import { parseTimestamp } from "../security/types.js";

export interface RecoverableAssignment {
  readonly taskId: string;
  readonly workerId: string;
  readonly leaseExpiresAt: string;
  readonly checkpointRef: string;
  readonly evidenceRefs: readonly string[];
}

export function reapOrphan(assignment: RecoverableAssignment, now: string): Readonly<{ taskId: string; reclaim: boolean; resumeFrom: string }> {
  const expired = parseTimestamp(now, "now") >= parseTimestamp(assignment.leaseExpiresAt, "leaseExpiresAt");
  if (!expired) throw new Error("Cannot reap a live assignment");
  if (!assignment.checkpointRef.trim() || assignment.evidenceRefs.length === 0) throw new Error("Orphan recovery requires verified checkpoint and evidence");
  return Object.freeze({ taskId: assignment.taskId, reclaim: true, resumeFrom: assignment.checkpointRef });
}

export interface LeadFailover {
  readonly projectAgentId: string;
  readonly priorLeadId: string;
  readonly replacementLeadId: string;
  readonly missionRef: string;
  readonly queueRef: string;
  readonly checkpointRef: string;
  readonly authorityScopes: readonly string[];
}

export function validateLeadFailover(failover: LeadFailover): void {
  if (failover.priorLeadId === failover.replacementLeadId) throw new Error("Lead failover requires replacement identity");
  if (!failover.missionRef.trim() || !failover.queueRef.trim() || !failover.checkpointRef.trim()) throw new Error("Lead failover must preserve mission/queue/checkpoint");
}
