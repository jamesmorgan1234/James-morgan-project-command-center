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
  const incidents: ShiftIncident[] = [];
  for (const worker of workers) {
    const heartbeat = parseTimestamp(worker.lastHeartbeatAt, "lastHeartbeatAt");
    if (worker.state === "working" && nowMs - heartbeat > stallAfterMs) {
      incidents.push(Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "stalled", ownerAttentionRequired: false }));
      continue;
    }
    if (worker.state === "failed") {
      incidents.push(Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "failed", ownerAttentionRequired: false }));
      continue;
    }
    if (worker.state === "blocked") {
      incidents.push(Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "blocked", ownerAttentionRequired: true }));
    }
  }
  return Object.freeze(incidents);
}
