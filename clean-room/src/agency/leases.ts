import { parseTimestamp } from "../security/types.js";

export interface TaskClaim {
  readonly taskId: string;
  readonly workerId: string;
  readonly fencingToken: number;
  readonly claimedAt: string;
  readonly expiresAt: string;
}

export class TaskClaimStore {
  readonly #claims = new Map<string, TaskClaim>();
  readonly #lastTokens = new Map<string, number>();

  claim(taskId: string, workerId: string, claimedAt: string, expiresAt: string): TaskClaim {
    const now = parseTimestamp(claimedAt, "claimedAt");
    const expiry = parseTimestamp(expiresAt, "expiresAt");
    if (expiry <= now) throw new Error("Task claim expiry must be in the future");
    const current = this.#claims.get(taskId);
    if (current && now < parseTimestamp(current.expiresAt, "existingExpiresAt")) throw new Error(`Task already claimed: ${taskId}`);
    const token = (this.#lastTokens.get(taskId) ?? 0) + 1;
    this.#lastTokens.set(taskId, token);
    const claim = Object.freeze({ taskId, workerId, fencingToken: token, claimedAt, expiresAt });
    this.#claims.set(taskId, claim);
    return claim;
  }

  renew(taskId: string, workerId: string, fencingToken: number, now: string, expiresAt: string): TaskClaim {
    this.assertCommitAllowed(taskId, workerId, fencingToken, now);
    const nextExpiry = parseTimestamp(expiresAt, "expiresAt");
    if (nextExpiry <= parseTimestamp(now, "now")) throw new Error("Renewal expiry must be in the future");
    const current = this.#required(taskId);
    const updated = Object.freeze({ ...current, expiresAt });
    this.#claims.set(taskId, updated);
    return updated;
  }

  assertCommitAllowed(taskId: string, workerId: string, fencingToken: number, now: string): void {
    const current = this.#required(taskId);
    if (current.workerId !== workerId || current.fencingToken !== fencingToken) throw new Error("Stale worker fencing token rejected");
    if (parseTimestamp(now, "now") >= parseTimestamp(current.expiresAt, "expiresAt")) throw new Error("Expired task claim cannot commit");
  }

  release(taskId: string, workerId: string, fencingToken: number, now: string): void {
    this.assertCommitAllowed(taskId, workerId, fencingToken, now);
    this.#claims.delete(taskId);
  }

  get(taskId: string): TaskClaim | undefined { return this.#claims.get(taskId); }

  #required(taskId: string): TaskClaim {
    const claim = this.#claims.get(taskId);
    if (!claim) throw new Error(`No claim for task: ${taskId}`);
    return claim;
  }
}
