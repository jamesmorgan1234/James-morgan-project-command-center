/**
 * Home dashboard access and the Agent module.
 *
 * Home exposes the owner's destinations without disturbing the approved primary
 * one-column grid, and the Agent module reports real run state: queued, working,
 * needs owner, blocked or executor unavailable, with verified progress or N/A.
 * Barrier counts are counts, never invented percentages.
 */

export type HomeDestinationKey = "personal" | "needs_me" | "search" | "notifications" | "finance";

export interface HomeDestination {
  readonly key: HomeDestinationKey;
  readonly title: string;
  readonly route: string;
  readonly enabled: boolean;
  readonly pinned: boolean;
}

const DESTINATIONS: readonly Omit<HomeDestination, "enabled" | "pinned">[] = Object.freeze([
  Object.freeze({ key: "personal" as const, title: "Personal Operations", route: "/personal" }),
  Object.freeze({ key: "needs_me" as const, title: "Needs Me", route: "/needs-me" }),
  Object.freeze({ key: "search" as const, title: "Search", route: "/search" }),
  Object.freeze({ key: "notifications" as const, title: "Notifications", route: "/notifications" }),
  Object.freeze({ key: "finance" as const, title: "Financial Command Center", route: "/finance" })
]);

export function homeDestinations(input: { financeEnabled?: boolean; pinnedKeys?: readonly HomeDestinationKey[] } = {}): readonly HomeDestination[] {
  const pinned = new Set(input.pinnedKeys ?? []);
  for (const key of pinned) if (!DESTINATIONS.some((destination) => destination.key === key)) throw new Error(`Unknown Home destination: ${key}`);
  return Object.freeze(DESTINATIONS.map((destination) => Object.freeze({
    ...destination,
    enabled: destination.key === "finance" ? input.financeEnabled === true : true,
    pinned: pinned.has(destination.key)
  })));
}

export function assertPinnedDestinationsPreservePrimaryGrid(primaryModuleKeys: readonly string[]): void {
  for (const key of primaryModuleKeys) {
    if (DESTINATIONS.some((destination) => destination.key === key)) throw new Error(`Pinned destinations cannot replace the approved primary Home grid: ${key}`);
  }
}

export type AgentRunState = "queued" | "working" | "needs_owner" | "blocked" | "executor_unavailable";

const STATE_LABELS: Readonly<Record<AgentRunState, string>> = Object.freeze({
  queued: "Queued",
  working: "Working",
  needs_owner: "Needs Owner",
  blocked: "Blocked",
  executor_unavailable: "Executor Unavailable"
});

export interface AgentRunSummary {
  readonly projectTitle: string | null;
  readonly taskTitle: string | null;
  readonly nextAction: string | null;
  readonly state: AgentRunState;
  readonly progressPercent: number | null;
  readonly progressVerified: boolean;
  readonly workBoundary: string;
}

export interface HomeAgentModule {
  readonly title: "Agent";
  readonly route: "/agent";
  readonly currentProject: string | null;
  readonly currentTask: string | null;
  readonly nextAction: string | null;
  readonly state: AgentRunState | null;
  readonly stateLabel: string;
  readonly progressPercent: number | null;
  readonly progressLabel: string;
  readonly workBoundary: string;
}

export function homeAgentModule(run: AgentRunSummary | null): HomeAgentModule {
  if (run === null) {
    return Object.freeze({
      title: "Agent" as const,
      route: "/agent" as const,
      currentProject: null,
      currentTask: null,
      nextAction: null,
      state: null,
      stateLabel: "No active run",
      progressPercent: null,
      progressLabel: "N/A",
      workBoundary: "No active run"
    });
  }
  const stateLabel = STATE_LABELS[run.state];
  if (stateLabel === undefined) throw new Error("Unsupported agent run state");
  if (!run.workBoundary.trim()) throw new Error("Agent module requires a work boundary");
  let progressPercent: number | null = null;
  let progressLabel = "N/A";
  if (run.progressPercent !== null) {
    if (!run.progressVerified) throw new Error("Agent progress must be verified or N/A");
    if (!Number.isFinite(run.progressPercent) || run.progressPercent < 0 || run.progressPercent > 100) throw new Error("Agent progress must be 0..100");
    progressPercent = run.progressPercent;
    progressLabel = `${run.progressPercent}% verified`;
  }
  return Object.freeze({
    title: "Agent" as const,
    route: "/agent" as const,
    currentProject: run.projectTitle,
    currentTask: run.taskTitle,
    nextAction: run.nextAction,
    state: run.state,
    stateLabel,
    progressPercent,
    progressLabel,
    workBoundary: run.workBoundary
  });
}

export interface HomeBarriers {
  readonly lockedProject: string | null;
  readonly reviewedOrParkedCount: number;
  readonly percentage: null;
  readonly lockedProjectLabel: string;
  readonly reviewedOrParkedLabel: string;
}

export function homeBarriers(input: { lockedProject?: string | null; reviewedOrParkedCount: number }): HomeBarriers {
  if (!Number.isSafeInteger(input.reviewedOrParkedCount) || input.reviewedOrParkedCount < 0) throw new Error("Reviewed/parked count must be a non-negative integer");
  const lockedProject = input.lockedProject ?? null;
  if (lockedProject !== null && !lockedProject.trim()) throw new Error("Locked project label cannot be blank");
  return Object.freeze({
    lockedProject,
    reviewedOrParkedCount: input.reviewedOrParkedCount,
    percentage: null as null,
    lockedProjectLabel: lockedProject ?? "No project locked",
    reviewedOrParkedLabel: `${input.reviewedOrParkedCount} reviewed or parked`
  });
}
