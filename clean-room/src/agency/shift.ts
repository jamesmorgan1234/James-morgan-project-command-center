import { parseTimestamp } from "../security/types.js";

export interface WorkerHealth {
  readonly workerId: string;
  readonly projectId: string;
  readonly taskId: string;
  readonly state: "idle" | "working" | "blocked" | "failed";
  readonly lastHeartbeatAt: string;
}

export interface ShiftIncident {
  readonly workerId: string;
  readonly taskId: string;
  readonly kind: "stalled" | "failed" | "blocked";
  readonly ownerAttentionRequired: boolean;
}

export function inspectShift(workers: readonly WorkerHealth[], now: string, stallAfterMs: number): readonly ShiftIncident[] {
  const nowMs = parseTimestamp(now, "now");
  return Object.freeze(workers.flatMap((worker) => {
    const heartbeat = parseTimestamp(worker.lastHeartbeatAt, "lastHeartbeatAt");
    if (worker.state === "working" && nowMs - heartbeat > stallAfterMs) return [Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "stalled" as const, ownerAttentionRequired: false })];
    if (worker.state === "failed") return [Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "failed" as const, ownerAttentionRequired: false })];
    if (worker.state === "blocked") return [Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "blocked" as const, ownerAttentionRequired: true })];
    return [];
  }));
}
