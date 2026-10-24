import type { ProgressDisplay, SemanticStatus } from "./progress.js";

export type HomePrimaryModuleKey = "projects" | "active_live" | "next_up" | "owner_attention";

export interface HomePrimaryModule {
  readonly key: HomePrimaryModuleKey;
  readonly title: string;
  readonly route: string;
  readonly status?: SemanticStatus;
  readonly progress?: ProgressDisplay;
  readonly verifiedCount?: number | undefined;
  readonly supportingText: string;
}

export interface HomeModuleGridContract {
  readonly columns: 1;
  readonly equalCardHeight: true;
  readonly modules: readonly HomePrimaryModule[];
}

export function createHomeGrid(modules: readonly HomePrimaryModule[]): HomeModuleGridContract {
  const seen = new Set<HomePrimaryModuleKey>();
  for (const module of modules) {
    if (seen.has(module.key)) throw new Error(`Duplicate Home primary module: ${module.key}`);
    if (!module.title.trim() || !module.route.startsWith("/") || !module.supportingText.trim()) throw new Error(`Invalid Home module: ${module.key}`);
    if (module.verifiedCount !== undefined && (!Number.isSafeInteger(module.verifiedCount) || module.verifiedCount < 0)) throw new Error(`Home verifiedCount must be non-negative: ${module.key}`);
    seen.add(module.key);
  }
  return Object.freeze({ columns: 1, equalCardHeight: true, modules: Object.freeze([...modules]) });
}
