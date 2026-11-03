import { HomeModuleRegistry, type HomeModuleGridContract, type HomeModuleRegistration } from "../ui/home.js";
import type { CommandCenterRuntimeSnapshot } from "./snapshot.js";

export interface HomeRuntimeContext {
  readonly snapshot: CommandCenterRuntimeSnapshot;
  readonly activeCount: number;
  readonly nextCount: number;
}

export interface HomeCell {
  readonly supportingText: string;
  readonly verifiedCount?: number;
}

// A capability is unavailable only when the source it actually requires did not
// load. Failures in unrelated optional sources must not blank core surfaces.
function sourceUnavailable(snapshot: CommandCenterRuntimeSnapshot, sourceKey: string): boolean {
  if (snapshot.connection.state === "disconnected") return true;
  return snapshot.sources?.[sourceKey] === "unavailable";
}

export function projectCountCell(snapshot: CommandCenterRuntimeSnapshot): HomeCell {
  if (sourceUnavailable(snapshot, "projects")) return Object.freeze({ supportingText: "Project count unavailable: the canonical project profile source did not load." });
  if (sourceUnavailable(snapshot, "book-catalogue")) return Object.freeze({ supportingText: "Combined project count unavailable: the book catalogue did not load." });
  const books = snapshot.books?.length ?? 0;
  return Object.freeze({ verifiedCount: snapshot.projects.length + books, supportingText: `${snapshot.projects.length} project records + ${books} individual books.` });
}

function verifiedRuntimeCount(snapshot: CommandCenterRuntimeSnapshot, count: number, label: string, unavailable: string, sourceKey: string): HomeCell {
  if (sourceUnavailable(snapshot, sourceKey)) return Object.freeze({ supportingText: unavailable });
  if (!Number.isSafeInteger(count) || count < 0) throw new Error(`${label} count must be a non-negative safe integer`);
  return Object.freeze({ verifiedCount: count, supportingText: label === "Active / Live"
    ? `${count} project${count === 1 ? "" : "s"} with a claimed executor and fresh verified heartbeat.`
    : `${count} project${count === 1 ? "" : "s"} with verified roadmap readiness and evidence.` });
}

export function activeLiveCell(snapshot: CommandCenterRuntimeSnapshot, count: number): HomeCell {
  return verifiedRuntimeCount(snapshot, count, "Active / Live", "Live-project count unavailable: verified executor heartbeat data did not load.", "activity");
}

export function nextUpCell(snapshot: CommandCenterRuntimeSnapshot, count: number): HomeCell {
  return verifiedRuntimeCount(snapshot, count, "Next Up", "Priority queue unavailable: canonical roadmap and readiness data did not load.", "roadmaps");
}

export function needsMeCell(snapshot: CommandCenterRuntimeSnapshot): HomeCell {
  const surface = snapshot.surfaces.find((candidate) => candidate.key === "needs-me");
  if (!surface || surface.summary.state !== "known") return Object.freeze({ supportingText: "Owner-attention queue unavailable: the canonical checkpoint source did not load, so zero cannot be proven." });
  return Object.freeze({ supportingText: surface.summary.value });
}

export function createCoreHomeModuleRegistry(extensions: readonly HomeModuleRegistration<HomeRuntimeContext>[] = []): HomeModuleRegistry<HomeRuntimeContext> {
  const registry = new HomeModuleRegistry<HomeRuntimeContext>();
  registry.register({ key: "projects", title: "Projects", route: "/projects", resolve: ({ snapshot }) => projectCountCell(snapshot) });
  registry.register({ key: "active_live", title: "Active / Live", route: "/active", resolve: ({ snapshot, activeCount }) => activeLiveCell(snapshot, activeCount) });
  registry.register({ key: "next_up", title: "Next Up", route: "/next-up", resolve: ({ snapshot, nextCount }) => nextUpCell(snapshot, nextCount) });
  registry.register({ key: "owner_attention", title: "Needs Me", route: "/needs-me", resolve: ({ snapshot }) => needsMeCell(snapshot) });
  for (const extension of extensions) registry.register(extension);
  return registry;
}

export function buildHomeModuleGrid(context: HomeRuntimeContext, extensions: readonly HomeModuleRegistration<HomeRuntimeContext>[] = []): HomeModuleGridContract {
  return createCoreHomeModuleRegistry(extensions).build(context);
}
