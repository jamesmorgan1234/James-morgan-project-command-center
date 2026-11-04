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
  const total = snapshot.projects.length + books;
  return Object.freeze({ verifiedCount: total, supportingText: `${total} projects` });
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
  const agencyCount = snapshot.agency?.availability === "available" ? snapshot.agency.runs.filter(run => run.state === "needs_user").length : undefined;
  if (agencyCount) return Object.freeze({ supportingText: `${agencyCount} Agency run${agencyCount === 1 ? "" : "s"} need${agencyCount === 1 ? "s" : ""} your action.${surface?.summary.state === "known" ? ` ${surface.summary.value}` : " Project checkpoint attention is unavailable."}` });
  if (!surface || surface.summary.state !== "known") return Object.freeze({ supportingText: "Owner-attention queue unavailable: the canonical checkpoint source did not load, so zero cannot be proven." });
  return Object.freeze({ supportingText: surface.summary.value });
}

export function revenueCell(snapshot: CommandCenterRuntimeSnapshot): HomeCell {
  const revenue = snapshot.revenue;
  if (!revenue || sourceUnavailable(snapshot, "revenue")) {
    return Object.freeze({ supportingText: "No verified recorded revenue is available. A missing measurement is not zero." });
  }
  return Object.freeze({
    supportingText: `Recorded for ${revenue.projectCount} project${revenue.projectCount === 1 ? "" : "s"} · last verified ${revenue.latestObservedAt.slice(0, 10)} · not a live portfolio total.`
  });
}

export function agentCell(snapshot: CommandCenterRuntimeSnapshot): HomeCell {
  const agency = snapshot.agency;
  if (!agency || agency.availability !== "available") return Object.freeze({
    supportingText: "Agent execution status unavailable. No queued or working run is assumed."
  });
  const running = agency.runs.filter((run) => ["queued", "working", "paused", "blocked", "needs_user"].includes(run.state));
  const current = running.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!current) return Object.freeze({ supportingText: "No currently active Agent run was recorded in the loaded canonical snapshot." });
  const task = agency.tasks
    .filter((entry) => entry.runId === current.runId && ["queued", "working", "blocked", "needs_user"].includes(entry.state))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const next = task?.title ?? current.blocker ?? current.objective;
  return Object.freeze({
    verifiedCount: running.length,
    supportingText: `Agent ${current.state.replaceAll("_", " ")} · ${next.slice(0, 155)}`
  });
}

export function brainCell(snapshot: CommandCenterRuntimeSnapshot): HomeCell {
  if (!snapshot.brain || snapshot.brain.availability !== "available") return Object.freeze({
    supportingText: "Brain status unavailable. No recommendations are inferred."
  });
  const recommendations = snapshot.brain.improvements.filter((item) => item.state === "proposed").length;
  return Object.freeze({
    verifiedCount: recommendations,
    supportingText: `${recommendations} proposed improvement${recommendations === 1 ? "" : "s"} · ${snapshot.brain.workspaces.length} project workspaces recorded.`
  });
}

export function workBarriersCell(snapshot: CommandCenterRuntimeSnapshot): HomeCell {
  if (!snapshot.agency || snapshot.agency.availability !== "available") return Object.freeze({
    supportingText: "Work-boundary inventory unavailable. No zero is inferred."
  });
  const runs = snapshot.agency.runs.filter((run) => ["blocked", "needs_user", "work_boundary"].includes(run.state));
  const tasks = snapshot.agency.tasks.filter((task) => ["blocked", "needs_user", "work_boundary", "parked"].includes(task.state));
  const newest = runs.slice().sort((a,b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return Object.freeze({
    supportingText: `${runs.length} blocked/owner-action runs · ${tasks.length} blocked/parked tasks${newest ? ` · most recent: ${newest.projectId}` : ""}. Counts are not completion percentages.`
  });
}

export function createCoreHomeModuleRegistry(extensions: readonly HomeModuleRegistration<HomeRuntimeContext>[] = []): HomeModuleRegistry<HomeRuntimeContext> {
  const registry = new HomeModuleRegistry<HomeRuntimeContext>();
  registry.register({ key: "projects", title: "Projects", route: "/projects", resolve: ({ snapshot }) => projectCountCell(snapshot) });
  registry.register({ key: "active_live", title: "Active / Live", route: "/active", resolve: ({ snapshot, activeCount }) => activeLiveCell(snapshot, activeCount) });
  registry.register({ key: "next_up", title: "Next Up", route: "/next-up", resolve: ({ snapshot, nextCount }) => nextUpCell(snapshot, nextCount) });
  registry.register({ key: "owner_attention", title: "Needs Me", route: "/needs-me", resolve: ({ snapshot }) => needsMeCell(snapshot) });
  registry.register({ key: "agent", title: "Agent", route: "/agency", resolve: ({ snapshot }) => agentCell(snapshot) });
  registry.register({ key: "brain", title: "Brain", route: "/brain", resolve: ({ snapshot }) => brainCell(snapshot) });
  registry.register({ key: "work_barriers", title: "To Work Barriers", route: "/agency", resolve: ({ snapshot }) => workBarriersCell(snapshot) });
  registry.register({ key: "revenue", title: "Revenue", route: "/finance", resolve: ({ snapshot }) => revenueCell(snapshot) });
  for (const extension of extensions) registry.register(extension);
  return registry;
}

export function buildHomeModuleGrid(context: HomeRuntimeContext, extensions: readonly HomeModuleRegistration<HomeRuntimeContext>[] = []): HomeModuleGridContract {
  return createCoreHomeModuleRegistry(extensions).build(context);
}
