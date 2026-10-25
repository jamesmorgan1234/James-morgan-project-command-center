import { HomeModuleRegistry, type HomeModuleGridContract, type HomeModuleRegistration } from "../ui/home.js";
import type { CommandCenterRuntimeSnapshot } from "./snapshot.js";

export interface HomeRuntimeContext {
  readonly snapshot: CommandCenterRuntimeSnapshot;
  readonly activeCount: number;
  readonly nextCount: number;
}

function projectCountText(snapshot: CommandCenterRuntimeSnapshot): Readonly<{ verifiedCount?: number; supportingText: string }> {
  if (snapshot.connection.state !== "connected") return Object.freeze({ supportingText: "Project count unavailable until canonical runtime reconnects." });
  return Object.freeze({ verifiedCount: snapshot.projects.length, supportingText: `${snapshot.projects.length} canonical project record${snapshot.projects.length === 1 ? "" : "s"} loaded.` });
}

function verifiedRuntimeCount(snapshot: CommandCenterRuntimeSnapshot, count: number, label: string, unavailable: string): Readonly<{ verifiedCount?: number; supportingText: string }> {
  if (snapshot.connection.state !== "connected") return Object.freeze({ supportingText: unavailable });
  if (!Number.isSafeInteger(count) || count < 0) throw new Error(`${label} count must be a non-negative safe integer`);
  return Object.freeze({ verifiedCount: count, supportingText: label === "Active / Live"
    ? `${count} project${count === 1 ? "" : "s"} with a claimed executor and fresh verified heartbeat.`
    : `${count} project${count === 1 ? "" : "s"} with verified roadmap readiness and evidence.` });
}

function needsMeText(snapshot: CommandCenterRuntimeSnapshot): Readonly<{ supportingText: string }> {
  const surface = snapshot.surfaces.find((candidate) => candidate.key === "needs-me");
  if (!surface || surface.summary.state !== "known") return Object.freeze({ supportingText: "Owner-attention queue unavailable in the current canonical snapshot." });
  return Object.freeze({ supportingText: surface.summary.value });
}

export function createCoreHomeModuleRegistry(extensions: readonly HomeModuleRegistration<HomeRuntimeContext>[] = []): HomeModuleRegistry<HomeRuntimeContext> {
  const registry = new HomeModuleRegistry<HomeRuntimeContext>();
  registry.register({ key: "projects", title: "Projects", route: "/projects", resolve: ({ snapshot }) => projectCountText(snapshot) });
  registry.register({ key: "active_live", title: "Active / Live", route: "/active", resolve: ({ snapshot, activeCount }) => verifiedRuntimeCount(snapshot, activeCount, "Active / Live", "Live-project count unavailable until canonical runtime reconnects.") });
  registry.register({ key: "next_up", title: "Next Up", route: "/next-up", resolve: ({ snapshot, nextCount }) => verifiedRuntimeCount(snapshot, nextCount, "Next Up", "Priority queue unavailable until canonical runtime reconnects.") });
  registry.register({ key: "owner_attention", title: "Needs Me", route: "/needs-me", resolve: ({ snapshot }) => needsMeText(snapshot) });
  for (const extension of extensions) registry.register(extension);
  return registry;
}

export function buildHomeModuleGrid(context: HomeRuntimeContext, extensions: readonly HomeModuleRegistration<HomeRuntimeContext>[] = []): HomeModuleGridContract {
  return createCoreHomeModuleRegistry(extensions).build(context);
}
