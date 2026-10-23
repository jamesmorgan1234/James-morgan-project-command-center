export type WorkRung = "normal_chat" | "luna_high" | "sol_light" | "sol_medium";
export type FailureClass = "transient_network" | "provider_timeout" | "provider_unavailable" | "quota_unavailable" | "credentials" | "missing_input" | "user_boundary" | "protected_boundary" | "capability_insufficient" | "execution_complexity" | "verification_failed";

const NEXT_RUNG: Readonly<Record<WorkRung, WorkRung | null>> = Object.freeze({ normal_chat: "luna_high", luna_high: "sol_light", sol_light: "sol_medium", sol_medium: null });

export interface WorkAuthorization {
  readonly projectId: string;
  readonly runId: string;
  readonly projectAuto: boolean;
  readonly workAuthorized: boolean;
  readonly maxRung: WorkRung;
  readonly protectedActionsAuthorized: false;
}

export interface LadderDecision {
  readonly action: "stay" | "retry_once" | "escalate" | "block";
  readonly rung: WorkRung;
  readonly reason: string;
}

const RANK: Readonly<Record<WorkRung, number>> = Object.freeze({ normal_chat: 0, luna_high: 1, sol_light: 2, sol_medium: 3 });

export function decideWorkLadder(current: WorkRung, failure: FailureClass, authorization: WorkAuthorization, transientRetriesUsed: number): LadderDecision {
  if (!authorization.workAuthorized && current !== "normal_chat") return Object.freeze({ action: "block", rung: current, reason: "work_not_authorized" });
  if (["transient_network", "provider_timeout"].includes(failure)) return transientRetriesUsed < 1 ? Object.freeze({ action: "retry_once", rung: current, reason: failure }) : Object.freeze({ action: "block", rung: current, reason: "transient_retry_exhausted" });
  if (["provider_unavailable", "quota_unavailable", "credentials", "missing_input", "user_boundary", "protected_boundary", "verification_failed"].includes(failure)) return Object.freeze({ action: "block", rung: current, reason: failure });
  const next = NEXT_RUNG[current];
  if (!next) return Object.freeze({ action: "block", rung: current, reason: "work_ladder_ceiling" });
  if (RANK[next] > RANK[authorization.maxRung]) return Object.freeze({ action: "block", rung: current, reason: "authorization_rung_ceiling" });
  if (!authorization.workAuthorized && next !== "normal_chat") return Object.freeze({ action: "block", rung: current, reason: "work_not_authorized" });
  return Object.freeze({ action: "escalate", rung: next, reason: failure });
}
