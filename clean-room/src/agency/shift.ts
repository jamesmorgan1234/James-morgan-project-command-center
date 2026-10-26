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

export interface ShiftCoordinationFault {
  readonly taskId: string;
  readonly kind: string;
  readonly ownerBoundaryRequired: boolean;
}

export interface ShiftManagerInput {
  readonly workers: readonly WorkerHealth[];
  readonly queueDepth: number;
  readonly queueCapacity: number;
  readonly resourcePressure: number;
  readonly coordinationFaults: readonly ShiftCoordinationFault[];
  readonly ownerBoundaryTaskIds: readonly string[];
}

export interface ShiftManagerAssessment {
  readonly incidents: readonly ShiftIncident[];
  readonly queuePressure: number;
  readonly resourcePressure: number;
  readonly containmentRequired: boolean;
  readonly safeHandoffTaskIds: readonly string[];
  readonly recoverableFaultTaskIds: readonly string[];
  readonly ownerBoundaryTaskIds: readonly string[];
}

export function inspectShiftManager(input: ShiftManagerInput, now: string, stallAfterMs: number): ShiftManagerAssessment {
  if (!Number.isSafeInteger(input.queueDepth) || input.queueDepth < 0 || !Number.isSafeInteger(input.queueCapacity) || input.queueCapacity < 1) throw new Error("Shift Manager queue depth/capacity are invalid");
  if (!Number.isFinite(input.resourcePressure) || input.resourcePressure < 0 || input.resourcePressure > 1) throw new Error("Shift Manager resource pressure must be between 0 and 1");
  if (!Number.isSafeInteger(stallAfterMs) || stallAfterMs < 1) throw new Error("Shift Manager stall threshold must be positive");

  const explicitOwnerBoundaries = new Set(input.ownerBoundaryTaskIds.map((id) => id.trim()));
  if (explicitOwnerBoundaries.has("")) throw new Error("Shift Manager owner-boundary task ids must be nonblank");
  const faultTaskIds = new Set<string>();
  const recoverableFaultTaskIds: string[] = [];
  const ownerBoundaryFaultTaskIds: string[] = [];
  for (const fault of input.coordinationFaults) {
    if (!fault.taskId.trim() || !fault.kind.trim() || faultTaskIds.has(fault.taskId)) throw new Error("Shift Manager coordination faults require unique nonblank task identity/kind");
    faultTaskIds.add(fault.taskId);
    if (fault.ownerBoundaryRequired) ownerBoundaryFaultTaskIds.push(fault.taskId);
    else recoverableFaultTaskIds.push(fault.taskId);
  }

  const incidents = inspectShift(input.workers, now, stallAfterMs).map((incident) => Object.freeze({
    ...incident,
    ownerAttentionRequired: explicitOwnerBoundaries.has(incident.taskId)
  }));
  const ownerBoundaryTaskIds = [...new Set([...explicitOwnerBoundaries, ...ownerBoundaryFaultTaskIds])].sort();
  const safeHandoffTaskIds = incidents.filter((incident) => incident.kind === "stalled" || incident.kind === "failed").map((incident) => incident.taskId).sort();
  const queuePressure = Math.min(1, input.queueDepth / input.queueCapacity);
  const containmentRequired = queuePressure >= 1 || input.resourcePressure >= 0.9 || safeHandoffTaskIds.length > 0 || input.coordinationFaults.length > 0;

  return Object.freeze({
    incidents: Object.freeze(incidents),
    queuePressure,
    resourcePressure: input.resourcePressure,
    containmentRequired,
    safeHandoffTaskIds: Object.freeze(safeHandoffTaskIds),
    recoverableFaultTaskIds: Object.freeze(recoverableFaultTaskIds.sort()),
    ownerBoundaryTaskIds: Object.freeze(ownerBoundaryTaskIds)
  });
}
