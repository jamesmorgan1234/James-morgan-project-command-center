import { parseTimestamp } from "../security/types.js";
import { TaskClaimStore, type TaskClaim } from "./leases.js";

/**
 * Owner command dispatch.
 *
 * Acceptance of a command is not an execution claim. A command is accepted, then
 * signalled for dispatch immediately, then explicitly claimed by a worker before
 * execution is allowed. The queue is snapshot/restore capable and ordered by
 * priority. Project locks reuse the fenced task-claim store so a lock is a lease.
 */

export type DispatchPriority = "critical" | "normal" | "low";

const PRIORITY_RANK: Readonly<Record<DispatchPriority, number>> = Object.freeze({ critical: 0, normal: 1, low: 2 });

export interface OwnerCommand {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly issuedAt: string;
  readonly priority: DispatchPriority;
}

export type DispatchState = "accepted" | "dispatched" | "claimed";

export interface DispatchRecord {
  readonly commandId: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly priority: DispatchPriority;
  readonly acceptedAt: string;
  readonly dispatchedAt?: string;
  readonly executionClaimedAt?: string;
  readonly workerId?: string;
  readonly state: DispatchState;
}

export class DispatchQueue {
  readonly #records = new Map<string, DispatchRecord>();

  accept(command: OwnerCommand): DispatchRecord {
    if (!command.id.trim() || !command.ownerId.trim()) throw new Error("Command identity and owner are required");
    parseTimestamp(command.issuedAt, "issuedAt");
    if (PRIORITY_RANK[command.priority] === undefined) throw new Error("Unsupported dispatch priority");
    if (this.#records.has(command.id)) throw new Error(`Command already accepted: ${command.id}`);
    const record: DispatchRecord = Object.freeze({
      commandId: command.id,
      ownerId: command.ownerId,
      ...(command.projectId !== undefined ? { projectId: command.projectId } : {}),
      priority: command.priority,
      acceptedAt: command.issuedAt,
      state: "accepted" as const
    });
    this.#records.set(command.id, record);
    return record;
  }

  signal(commandId: string): DispatchRecord {
    const current = this.#required(commandId);
    if (current.state !== "accepted") throw new Error("Dispatch signal requires an accepted command");
    const next: DispatchRecord = Object.freeze({ ...current, state: "dispatched" as const, dispatchedAt: current.acceptedAt });
    this.#records.set(commandId, next);
    return next;
  }

  claim(commandId: string, workerId: string, claimedAt: string): DispatchRecord {
    const current = this.#required(commandId);
    if (!workerId.trim()) throw new Error("Execution claim requires a worker");
    parseTimestamp(claimedAt, "claimedAt");
    if (current.state === "claimed") throw new Error("Command already claimed for execution");
    const next: DispatchRecord = Object.freeze({ ...current, state: "claimed" as const, executionClaimedAt: claimedAt, workerId });
    this.#records.set(commandId, next);
    return next;
  }

  assertExecutionAllowed(commandId: string): void {
    if (this.#required(commandId).state !== "claimed") throw new Error("Execution requires an explicit claim after acceptance");
  }

  pending(): readonly DispatchRecord[] {
    return Object.freeze([...this.#records.values()].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || Date.parse(a.acceptedAt) - Date.parse(b.acceptedAt) || a.commandId.localeCompare(b.commandId)));
  }

  snapshot(): readonly DispatchRecord[] {
    return Object.freeze([...this.#records.values()]);
  }

  static restore(records: readonly DispatchRecord[]): DispatchQueue {
    const queue = new DispatchQueue();
    for (const record of records) queue.#records.set(record.commandId, Object.freeze({ ...record }));
    return queue;
  }

  #required(commandId: string): DispatchRecord {
    const record = this.#records.get(commandId);
    if (!record) throw new Error(`Unknown dispatch command: ${commandId}`);
    return record;
  }
}

export function acquireProjectLock(store: TaskClaimStore, projectId: string, workerId: string, now: string, expiresAt: string): TaskClaim {
  if (!projectId.trim()) throw new Error("Project lock requires a project reference");
  return store.claim(`project:${projectId}`, workerId, now, expiresAt);
}

export function renewProjectLock(store: TaskClaimStore, projectId: string, workerId: string, fencingToken: number, now: string, expiresAt: string): TaskClaim {
  return store.renew(`project:${projectId}`, workerId, fencingToken, now, expiresAt);
}
