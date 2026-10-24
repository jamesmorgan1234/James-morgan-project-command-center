import { known, unknown, type TruthValue } from "../data/canonical.js";

export type RuntimeConnectionState = "connected" | "disconnected" | "degraded" | "stale";
export type SurfaceAvailability = "available" | "unavailable" | "disconnected" | "stale";

export interface RuntimeEvidenceRef {
  readonly source: string;
  readonly observedAt?: string;
  readonly reference?: string;
}

export interface RuntimeLiveExecution {
  readonly runId: string;
  readonly taskId: string;
  readonly status: "working";
  readonly executorClaimed: true;
  readonly lastHeartbeatAt: string;
  readonly currentTaskTitle?: string;
  readonly blocker?: string;
  readonly evidence: readonly RuntimeEvidenceRef[];
}

export interface RuntimeNextWorkReadiness {
  readonly workUnitId: string;
  readonly ready: true;
  readonly title: string;
  readonly priorityRank: number;
  readonly evidence: readonly RuntimeEvidenceRef[];
}

export interface RuntimeProjectSnapshot {
  readonly id: string;
  readonly name: string;
  readonly mission: TruthValue<string>;
  readonly lifecycle: TruthValue<string>;
  readonly verification: TruthValue<string>;
  readonly priority: TruthValue<string>;
  readonly stage: TruthValue<string>;
  readonly status: TruthValue<string>;
  readonly progressPercent: TruthValue<number>;
  readonly currentCheckpoint: TruthValue<string>;
  readonly nextAction: TruthValue<string>;
  readonly blockers: TruthValue<readonly string[]>;
  readonly needsMeCount: TruthValue<number>;
  readonly agencyState: TruthValue<string>;
  readonly recentActivity: TruthValue<readonly string[]>;
  readonly evidence: readonly RuntimeEvidenceRef[];
  readonly liveExecution?: TruthValue<RuntimeLiveExecution>;
  readonly nextWorkReadiness?: TruthValue<RuntimeNextWorkReadiness>;
  readonly typeKey?: TruthValue<string>;
  readonly companyId?: TruthValue<string>;
  readonly specialistKey?: string;
}

export interface RuntimeSurfaceSnapshot {
  readonly key: string;
  readonly label: string;
  readonly availability: SurfaceAvailability;
  readonly summary: TruthValue<string>;
  readonly evidence: readonly RuntimeEvidenceRef[];
}

export interface CommandCenterRuntimeSnapshot {
  readonly schemaVersion: "cc-runtime-snapshot-v1";
  readonly generatedAt: string;
  readonly connection: Readonly<{
    state: RuntimeConnectionState;
    providerId: string;
    message: string;
    lastSuccessfulSyncAt: TruthValue<string>;
  }>;
  readonly owner: Readonly<{
    displayName: TruthValue<string>;
  }>;
  readonly projects: readonly RuntimeProjectSnapshot[];
  readonly surfaces: readonly RuntimeSurfaceSnapshot[];
  readonly release: Readonly<{
    releaseId: TruthValue<string>;
    knownGoodReleaseId: TruthValue<string>;
  }>;
}

const SURFACES: readonly Readonly<{ key: string; label: string }>[] = Object.freeze([
  { key: "home", label: "Home" },
  { key: "projects", label: "Projects" },
  { key: "brain", label: "Brain" },
  { key: "agency", label: "Agency" },
  { key: "needs-me", label: "Needs Me" },
  { key: "search", label: "Search" },
  { key: "automations", label: "Automations" },
  { key: "personal", label: "Personal" },
  { key: "finance", label: "Finance" },
  { key: "social", label: "Social & Communications" },
  { key: "books", label: "Books" },
  { key: "specialists", label: "Specialists" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" }
]);

function nowIso(): string { return new Date().toISOString(); }

export function createDisconnectedRuntimeSnapshot(providerId = "runtime:disconnected", generatedAt = nowIso()): CommandCenterRuntimeSnapshot {
  return Object.freeze({
    schemaVersion: "cc-runtime-snapshot-v1",
    generatedAt,
    connection: Object.freeze({
      state: "disconnected",
      providerId,
      message: "Canonical runtime data is not connected. Current values remain unavailable rather than being fabricated.",
      lastSuccessfulSyncAt: unknown<string>()
    }),
    owner: Object.freeze({ displayName: unknown<string>() }),
    projects: Object.freeze([]),
    surfaces: Object.freeze(SURFACES.map((surface) => Object.freeze({
      ...surface,
      availability: "disconnected" as const,
      summary: unknown<string>(),
      evidence: Object.freeze([]) as readonly RuntimeEvidenceRef[]
    }))),
    release: Object.freeze({ releaseId: unknown<string>(), knownGoodReleaseId: unknown<string>() })
  });
}

export function createFixtureRuntimeSnapshot(overrides?: Partial<CommandCenterRuntimeSnapshot>): CommandCenterRuntimeSnapshot {
  const base = createDisconnectedRuntimeSnapshot("runtime:test-fixture");
  return Object.freeze({
    ...base,
    ...overrides,
    connection: overrides?.connection ?? Object.freeze({
      state: "connected" as const,
      providerId: "runtime:test-fixture",
      message: "Explicit test fixture",
      lastSuccessfulSyncAt: known(base.generatedAt)
    })
  });
}
