import { parseTimestamp } from "../security/types.js";

/**
 * Agent run coordination.
 *
 * One active run per project, one active lane per portfolio, deduplication of
 * runs/tasks/equivalent work, stop and pause precedence, plan revalidation when
 * owner scope, rules, tool availability or providers change, and executor
 * compatibility checks before a claim.
 */

export type PendingCommandKind = "start" | "stop" | "pause";

export interface PendingCommand {
  readonly id: string;
  readonly kind: PendingCommandKind;
  readonly runKey: string;
  readonly taskKey: string;
  readonly workFingerprint: string;
  readonly issuedAt: string;
}

export type CommandDisposition = "accepted" | "duplicate_run" | "duplicate_task" | "equivalent_work";

export interface CommandDecision {
  readonly id: string;
  readonly disposition: CommandDisposition;
  readonly duplicateOf: string | null;
}

const KIND_RANK: Readonly<Record<PendingCommandKind, number>> = Object.freeze({ stop: 0, pause: 1, start: 2 });

export class RunCoordinator {
  readonly #commands = new Map<string, PendingCommand>();
  readonly #activeRuns = new Map<string, string>();
  readonly #activeLanes = new Set<string>();

  accept(command: PendingCommand): CommandDecision {
    if (!command.id.trim() || !command.runKey.trim() || !command.taskKey.trim()) throw new Error("Command identity, run and task keys are required");
    parseTimestamp(command.issuedAt, "issuedAt");
    if (this.#commands.has(command.id)) throw new Error(`Command already accepted: ${command.id}`);
    const existing = [...this.#commands.values()];
    const byRun = existing.find((entry) => entry.runKey === command.runKey);
    if (byRun) {
      this.#commands.set(command.id, Object.freeze({ ...command }));
      return Object.freeze({ id: command.id, disposition: "duplicate_run" as const, duplicateOf: byRun.id });
    }
    const byTask = existing.find((entry) => entry.taskKey === command.taskKey);
    if (byTask) {
      this.#commands.set(command.id, Object.freeze({ ...command }));
      return Object.freeze({ id: command.id, disposition: "duplicate_task" as const, duplicateOf: byTask.id });
    }
    const byWork = existing.find((entry) => entry.kind === "start" && command.kind === "start" && entry.workFingerprint === command.workFingerprint);
    if (byWork) {
      this.#commands.set(command.id, Object.freeze({ ...command }));
      return Object.freeze({ id: command.id, disposition: "equivalent_work" as const, duplicateOf: byWork.id });
    }
    this.#commands.set(command.id, Object.freeze({ ...command }));
    return Object.freeze({ id: command.id, disposition: "accepted" as const, duplicateOf: null });
  }

  /** Coalesces pending starts that represent the same work, keeping the earliest. */
  coalesce(): readonly PendingCommand[] {
    const byWork = new Map<string, PendingCommand>();
    const passthrough: PendingCommand[] = [];
    for (const command of this.#commands.values()) {
      if (command.kind !== "start") { passthrough.push(command); continue; }
      const key = `start:${command.workFingerprint}`;
      const prior = byWork.get(key);
      if (!prior || Date.parse(command.issuedAt) < Date.parse(prior.issuedAt)) byWork.set(key, command);
    }
    return Object.freeze([...byWork.values(), ...passthrough]);
  }

  /** Stop outranks pause; pause outranks the next queued start. */
  next(): PendingCommand | null {
    const ordered = [...this.#commands.values()].sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
    return ordered[0] ?? null;
  }

  startRun(projectId: string, runKey: string, lane: string | null = null): void {
    if (!projectId.trim() || !runKey.trim()) throw new Error("Run requires project and run key");
    if (this.#activeRuns.has(projectId)) throw new Error(`Project already has an active run: ${projectId}`);
    if (lane !== null) {
      if (!lane.trim()) throw new Error("Portfolio lane must be nonblank");
      if (this.#activeLanes.has(lane)) throw new Error(`Portfolio lane already active: ${lane}`);
      this.#activeLanes.add(lane);
    }
    this.#activeRuns.set(projectId, runKey);
  }

  finishRun(projectId: string, lane: string | null = null): void {
    this.#activeRuns.delete(projectId);
    if (lane !== null) this.#activeLanes.delete(lane);
  }
}

export type RevalidationReason = "scope_changed" | "rule_changed" | "tool_availability_changed" | "provider_disconnected" | "none";

export interface PlanStamp {
  readonly scopeVersion: string;
  readonly ruleVersion: string;
  readonly toolAvailabilityVersion: string;
  readonly providerConnected: boolean;
}

export function planRevalidation(stamp: PlanStamp, current: PlanStamp): RevalidationReason {
  if (stamp.scopeVersion !== current.scopeVersion) return "scope_changed";
  if (stamp.ruleVersion !== current.ruleVersion) return "rule_changed";
  if (stamp.toolAvailabilityVersion !== current.toolAvailabilityVersion) return "tool_availability_changed";
  if (stamp.providerConnected !== current.providerConnected) return "provider_disconnected";
  return "none";
}

export interface ExecutorContract {
  readonly key: string;
  readonly capabilityVersion: number;
  readonly permissionVersion: number;
  readonly capabilityKeys: readonly string[];
  readonly toolHealth: Readonly<Record<string, "healthy" | "degraded" | "unavailable">>;
}

export function assertExecutorCompatible(executor: ExecutorContract, required: { capabilityKeys: readonly string[]; capabilityVersion: number; permissionVersion: number }): void {
  if (!Number.isSafeInteger(executor.capabilityVersion) || !Number.isSafeInteger(executor.permissionVersion)) throw new Error("Executor versions must be integers");
  for (const key of required.capabilityKeys) if (!executor.capabilityKeys.includes(key)) throw new Error(`Executor lacks required capability: ${key}`);
  if (executor.capabilityVersion < required.capabilityVersion) throw new Error("Executor capability version is stale");
  if (executor.permissionVersion < required.permissionVersion) throw new Error("Executor permission version is stale");
}

export function toolHealthSnapshotAtStart(executor: ExecutorContract, requiredTools: readonly string[]): Readonly<Record<string, string>> {
  const snapshot: Record<string, string> = {};
  for (const tool of requiredTools) {
    const health = executor.toolHealth[tool];
    if (health === undefined) throw new Error(`Executor does not report tool health for: ${tool}`);
    snapshot[tool] = health;
  }
  return Object.freeze(snapshot);
}

export function assertFreshOwnerRule(ruleVersionAtPlan: string, currentRuleVersion: string): void {
  if (ruleVersionAtPlan !== currentRuleVersion) throw new Error("Owner rule changed; revalidate before an external side effect");
}
