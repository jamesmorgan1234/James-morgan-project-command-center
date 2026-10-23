import { known, notApplicable, unknown, type TruthValue } from "../data/canonical.js";
import type { NeedsMeQueue } from "../personal/needs-me.js";
import type { ProjectCheckpointStore } from "../projects/checkpoints.js";
import { calculateProjectProgress } from "../projects/progress.js";
import type { ProjectRegistry } from "../projects/registry.js";
import type { ProjectRoadmap } from "../projects/roadmap.js";
import type { CommandCenterRuntimeSnapshot, RuntimeEvidenceRef, RuntimeProjectSnapshot, RuntimeSurfaceSnapshot, SurfaceAvailability } from "./snapshot.js";

export interface RuntimeRoadmapSource {
  readonly roadmap: ProjectRoadmap;
  readonly denominatorTrusted: boolean;
}

export interface RuntimeSurfaceReader {
  readonly key: string;
  readonly label: string;
  read(): Readonly<{
    availability: SurfaceAvailability;
    summary: TruthValue<string>;
    evidence: readonly RuntimeEvidenceRef[];
  }>;
}

export interface CanonicalRuntimeAssemblyOptions {
  readonly providerId: string;
  readonly observedAt: string;
  readonly sourceRef: string;
  readonly projects: ProjectRegistry;
  readonly checkpoints: ProjectCheckpointStore;
  readonly needsMe: NeedsMeQueue;
  readonly roadmaps?: ReadonlyMap<string, RuntimeRoadmapSource>;
  readonly surfaceReaders?: readonly RuntimeSurfaceReader[];
  readonly ownerDisplayName?: string;
  readonly releaseId?: string;
  readonly knownGoodReleaseId?: string;
}

const BASE_SURFACES = Object.freeze([
  ["home", "Home"], ["projects", "Projects"], ["brain", "Brain"], ["agency", "Agency"], ["needs-me", "Needs Me"],
  ["search", "Search"], ["automations", "Automations"], ["personal", "Personal"], ["finance", "Finance"],
  ["social", "Social & Communications"], ["books", "Books"], ["specialists", "Specialists"], ["analytics", "Analytics"], ["settings", "Settings"]
] as const);

function sourceEvidence(sourceRef: string, observedAt: string): readonly RuntimeEvidenceRef[] {
  return Object.freeze([Object.freeze({ source: sourceRef, observedAt })]);
}

function projectProgress(projectId: string, roadmaps: ReadonlyMap<string, RuntimeRoadmapSource> | undefined): TruthValue<number> {
  const source = roadmaps?.get(projectId);
  if (!source) return unknown<number>();
  const progress = calculateProjectProgress(source.roadmap, source.denominatorTrusted);
  return progress.kind === "percent" ? known(progress.percent) : notApplicable<number>();
}

function projectSnapshot(options: CanonicalRuntimeAssemblyOptions, project: ReturnType<ProjectRegistry["list"]>[number]): RuntimeProjectSnapshot {
  const checkpoint = options.checkpoints.latest(project.id);
  const nextAction = checkpoint?.ownerAction ?? checkpoint?.exactNextWorkUnitId;
  return Object.freeze({
    id: project.id,
    name: project.name,
    stage: unknown<string>(),
    status: known(`${project.lifecycle} · ${project.verification}`),
    progressPercent: projectProgress(project.id, options.roadmaps),
    currentCheckpoint: checkpoint ? known(checkpoint.id) : unknown<string>(),
    nextAction: nextAction ? known(nextAction) : unknown<string>(),
    blockers: checkpoint?.blocker ? known(Object.freeze([checkpoint.blocker])) : unknown<readonly string[]>(),
    needsMeCount: unknown<number>(),
    agencyState: unknown<string>(),
    recentActivity: unknown<readonly string[]>(),
    evidence: sourceEvidence(options.sourceRef, options.observedAt)
  });
}

function surfaces(options: CanonicalRuntimeAssemblyOptions, projectCount: number, needsCount: number): readonly RuntimeSurfaceSnapshot[] {
  const readers = new Map((options.surfaceReaders ?? []).map((reader) => [reader.key, reader]));
  const evidence = sourceEvidence(options.sourceRef, options.observedAt);
  return Object.freeze(BASE_SURFACES.map(([key, label]) => {
    if (key === "home") return Object.freeze({ key, label, availability: "available" as const, summary: known("Canonical Command Center runtime connected."), evidence });
    if (key === "projects") return Object.freeze({ key, label, availability: "available" as const, summary: known(`${projectCount} canonical project record${projectCount === 1 ? "" : "s"} loaded.`), evidence });
    if (key === "needs-me") return Object.freeze({ key, label, availability: "available" as const, summary: known(`${needsCount} open owner-attention item${needsCount === 1 ? "" : "s"}.`), evidence });
    const reader = readers.get(key);
    if (!reader) return Object.freeze({ key, label, availability: "unavailable" as const, summary: unknown<string>(), evidence: Object.freeze([]) as readonly RuntimeEvidenceRef[] });
    const value = reader.read();
    return Object.freeze({ key, label: reader.label, availability: value.availability, summary: value.summary, evidence: Object.freeze([...value.evidence]) });
  }));
}

export function assembleCanonicalRuntimeSnapshot(options: CanonicalRuntimeAssemblyOptions): CommandCenterRuntimeSnapshot {
  if (!options.providerId.trim() || !options.sourceRef.trim()) throw new Error("Runtime provider/source identity are required");
  if (!Number.isFinite(Date.parse(options.observedAt))) throw new Error("Runtime observedAt must be an ISO-compatible timestamp");
  const projects = Object.freeze(options.projects.list().map((project) => projectSnapshot(options, project)));
  const needs = options.needsMe.open();
  return Object.freeze({
    schemaVersion: "cc-runtime-snapshot-v1",
    generatedAt: options.observedAt,
    connection: Object.freeze({ state: "connected" as const, providerId: options.providerId, message: "Canonical clean-room domain snapshot loaded.", lastSuccessfulSyncAt: known(options.observedAt) }),
    owner: Object.freeze({ displayName: options.ownerDisplayName ? known(options.ownerDisplayName) : unknown<string>() }),
    projects,
    surfaces: surfaces(options, projects.length, needs.length),
    release: Object.freeze({ releaseId: options.releaseId ? known(options.releaseId) : unknown<string>(), knownGoodReleaseId: options.knownGoodReleaseId ? known(options.knownGoodReleaseId) : unknown<string>() })
  });
}
