/**
 * Blocked-state surface and execution history.
 *
 * An agent must be able to say exactly why it stopped instead of guessing, and
 * its execution history must be queryable by project and run for root-cause
 * analysis.
 */

export type BlockedReason =
  | "cannot_safely_continue"
  | "capability_missing"
  | "verification_impossible"
  | "authorization_expired"
  | "state_changed_since_plan"
  | "project_rule_conflict"
  | "resource_unavailable"
  | "owner_decision_required"
  | "external_provider_required"
  | "future_capability_recommended";

const REQUIRES_OWNER: Readonly<Record<BlockedReason, boolean>> = Object.freeze({
  cannot_safely_continue: true,
  capability_missing: false,
  verification_impossible: true,
  authorization_expired: true,
  state_changed_since_plan: false,
  project_rule_conflict: true,
  resource_unavailable: false,
  owner_decision_required: true,
  external_provider_required: true,
  future_capability_recommended: true
});

export interface BlockedStatus {
  readonly reason: BlockedReason;
  readonly message: string;
  readonly detail: Readonly<Record<string, string>>;
  readonly requiresOwner: boolean;
}

export function blockedStatus(reason: BlockedReason, message: string, detail: Readonly<Record<string, string>> = {}): BlockedStatus {
  if (!message.trim()) throw new Error("A blocked status requires a message");
  if (!(reason in REQUIRES_OWNER)) throw new Error(`Unknown blocked reason: ${reason}`);
  return Object.freeze({ reason, message, detail: Object.freeze({ ...detail }), requiresOwner: REQUIRES_OWNER[reason] });
}

export type ExecutionOutcome = "started" | "succeeded" | "failed" | "blocked";

export interface ExecutionEvent {
  readonly projectId: string;
  readonly runKey: string;
  readonly taskKey: string;
  readonly at: string;
  readonly outcome: ExecutionOutcome;
  readonly code: string;
  readonly detail: string;
}

export class ExecutionHistory {
  readonly #events: ExecutionEvent[] = [];

  record(event: ExecutionEvent): void {
    if (!event.projectId.trim() || !event.runKey.trim() || !event.taskKey.trim()) throw new Error("Execution events require project, run and task keys");
    if (Number.isNaN(Date.parse(event.at))) throw new Error("Execution event requires a valid timestamp");
    if (!event.code.trim()) throw new Error("Execution event requires a code");
    this.#events.push(Object.freeze({ ...event }));
  }

  query(filter: { projectId?: string; runKey?: string }): readonly ExecutionEvent[] {
    if (filter.projectId === undefined && filter.runKey === undefined) throw new Error("Execution history query requires a project or run");
    const matched = this.#events.filter((event) =>
      (filter.projectId === undefined || event.projectId === filter.projectId)
      && (filter.runKey === undefined || event.runKey === filter.runKey));
    return Object.freeze([...matched].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)));
  }

  rootCause(projectId: string, runKey: string): ExecutionEvent | null {
    const events = this.query({ projectId, runKey });
    const failure = events.find((event) => event.outcome === "failed" || event.outcome === "blocked");
    return failure ?? null;
  }
}
