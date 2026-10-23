export interface ConditionWatch {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly conditionKey: string;
  readonly cadenceRef: string;
  readonly actionPolicy: "notification_only" | "safe_action";
  readonly protectedActionsAuthorized: false;
  readonly priorVerifiedState: boolean;
}

export interface WatchObservation {
  readonly watchId: string;
  readonly conditionMet: boolean;
  readonly verified: boolean;
  readonly sourceRefs: readonly string[];
}

export interface WatchDecision {
  readonly fire: boolean;
  readonly reason: string;
  readonly protectedActionAuthorized: false;
}

export function evaluateWatch(watch: ConditionWatch, observation: WatchObservation): WatchDecision {
  if (observation.watchId !== watch.id) throw new Error("Watch observation identity mismatch");
  if (!observation.verified || observation.sourceRefs.length === 0) return Object.freeze({ fire: false, reason: "unverified_observation", protectedActionAuthorized: false as const });
  if (watch.priorVerifiedState || !observation.conditionMet) return Object.freeze({ fire: false, reason: "no_verified_false_to_true_transition", protectedActionAuthorized: false as const });
  return Object.freeze({ fire: true, reason: "verified_condition_transition", protectedActionAuthorized: false as const });
}
