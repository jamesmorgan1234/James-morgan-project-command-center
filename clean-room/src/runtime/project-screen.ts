import type { RuntimeProjectSnapshot } from "./snapshot.js";

export type RuntimeProjectGroupBy = "none" | "type" | "company" | "lifecycle" | "priority";

export interface RuntimeProjectFilter {
  readonly query?: string | undefined;
  readonly lifecycle?: string | undefined;
  readonly priority?: string | undefined;
  readonly typeKey?: string | undefined;
  readonly companyId?: string | undefined;
  readonly groupBy?: RuntimeProjectGroupBy | undefined;
}

export interface RuntimeProjectGroup {
  readonly key: string;
  readonly label: string;
  readonly projects: readonly RuntimeProjectSnapshot[];
}

// Mirrors roadmap/portfolio-future-architecture/06_PORTFOLIO_ACTIVATION_PHASE_FLOW.yaml.
// Completion percentage takes precedence. Ties and projects without percentages
// retain the locked activation order, then alphabetical display order.
const ACTIVATION_COMPANY_NUMBERS = Object.freeze([
  14, 13, 83, 21,
  85, 27, 84, 96,
  30, 64, 44, 8,
  50, 45, 43, 101,
  103, 106, 66, 4,
  2, 92, 105, 97,
  1, 3, 5, 6,
  7, 9, 10, 11,
  12, 15, 16, 17,
  18, 19, 20, 22,
  23, 24, 25, 26,
  28, 29, 31, 32,
  33, 34, 35, 36,
  37, 38, 39, 40,
  41, 42, 46, 47,
  48, 49, 51, 52,
  53, 54, 55, 56,
  57, 58, 59, 60,
  61, 62, 63, 65,
  67, 68, 69, 70,
  71, 72, 73, 74,
  75, 76, 77, 78,
  79, 80, 81, 82,
  86, 87, 88, 89,
  90, 91, 93, 94,
  95, 98, 99, 100,
  102, 104, 107
] as const);

const ACTIVATION_RANK_BY_COMPANY_ID: Readonly<Record<string, number>> = Object.freeze(Object.fromEntries(
  ACTIVATION_COMPANY_NUMBERS.map((companyNumber, index) => [
    `company:future:${String(companyNumber).padStart(3, "0")}`,
    index + 1
  ])
));

function knownText(value: RuntimeProjectSnapshot["lifecycle"]): string | undefined {
  return value.state === "known" ? String(value.value).trim() || undefined : undefined;
}

function optionalKnownText(value: RuntimeProjectSnapshot["typeKey"]): string | undefined {
  return value?.state === "known" ? String(value.value).trim() || undefined : undefined;
}

function normalize(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned.toLocaleLowerCase() : undefined;
}

function activationRank(project: RuntimeProjectSnapshot): number | undefined {
  const companyId = optionalKnownText(project.companyId);
  return companyId ? ACTIVATION_RANK_BY_COMPANY_ID[companyId] : undefined;
}

function comparePortfolioOrder(a: RuntimeProjectSnapshot, b: RuntimeProjectSnapshot): number {
  const percent = (p: RuntimeProjectSnapshot): number | undefined => p.progressPercent?.state === "known" && Number.isFinite(p.progressPercent.value) && p.progressPercent.value >= 0 && p.progressPercent.value <= 100 ? p.progressPercent.value : undefined;
  const aPercent = percent(a), bPercent = percent(b);
  if (aPercent !== undefined && bPercent !== undefined && aPercent !== bPercent) return bPercent - aPercent;
  if (aPercent !== undefined && bPercent === undefined) return -1;
  if (bPercent !== undefined && aPercent === undefined) return 1;
  const aRank = activationRank(a);
  const bRank = activationRank(b);
  if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
  if (aRank !== undefined) return -1;
  if (bRank !== undefined) return 1;
  return a.name.localeCompare(b.name, "en-US", { sensitivity: "base" }) || a.id.localeCompare(b.id);
}

export function projectFilterFromSearch(search: string): RuntimeProjectFilter {
  const params = new URLSearchParams(search);
  const group = params.get("group")?.trim() as RuntimeProjectGroupBy | undefined;
  const groupBy: RuntimeProjectGroupBy = group && ["none", "type", "company", "lifecycle", "priority"].includes(group) ? group : "none";
  const clean = (key: string): string | undefined => params.get(key)?.trim() || undefined;
  return Object.freeze({
    query: clean("q"),
    lifecycle: clean("lifecycle"),
    priority: clean("priority"),
    typeKey: clean("type"),
    companyId: clean("company"),
    groupBy
  });
}

export function filterRuntimeProjects(projects: readonly RuntimeProjectSnapshot[], filter: RuntimeProjectFilter): readonly RuntimeProjectSnapshot[] {
  const query = normalize(filter.query);
  const lifecycle = normalize(filter.lifecycle);
  const priority = normalize(filter.priority);
  const typeKey = normalize(filter.typeKey);
  const companyId = normalize(filter.companyId);
  return Object.freeze([...projects]
    .filter((project) => {
      if (!query) return true;
      const haystack = [
        project.name,
        project.mission.state === "known" ? project.mission.value : "",
        optionalKnownText(project.typeKey) ?? "",
        optionalKnownText(project.companyId) ?? ""
      ].join("\n").toLocaleLowerCase();
      return haystack.includes(query);
    })
    .filter((project) => !lifecycle || normalize(knownText(project.lifecycle)) === lifecycle)
    .filter((project) => !priority || normalize(knownText(project.priority)) === priority)
    .filter((project) => !typeKey || normalize(optionalKnownText(project.typeKey)) === typeKey)
    .filter((project) => !companyId || normalize(optionalKnownText(project.companyId)) === companyId)
    .sort(comparePortfolioOrder));
}

function groupValue(project: RuntimeProjectSnapshot, groupBy: RuntimeProjectGroupBy): string {
  if (groupBy === "type") return optionalKnownText(project.typeKey) ?? "type:unavailable";
  if (groupBy === "company") return optionalKnownText(project.companyId) ?? "company:unassigned";
  if (groupBy === "lifecycle") return knownText(project.lifecycle) ?? "lifecycle:unavailable";
  if (groupBy === "priority") return knownText(project.priority) ?? "priority:unavailable";
  return "all";
}

export function groupRuntimeProjects(projects: readonly RuntimeProjectSnapshot[], groupBy: RuntimeProjectGroupBy = "none"): readonly RuntimeProjectGroup[] {
  if (groupBy === "none") return Object.freeze([{ key: "all", label: "All projects", projects: Object.freeze([...projects].sort(comparePortfolioOrder)) }]);
  const groups = new Map<string, RuntimeProjectSnapshot[]>();
  for (const project of projects) {
    const key = groupValue(project, groupBy);
    const bucket = groups.get(key) ?? [];
    bucket.push(project);
    groups.set(key, bucket);
  }
  return Object.freeze([...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => Object.freeze({ key, label: key.replace(/^.*?:/, "").replaceAll("_", " "), projects: Object.freeze(items.sort(comparePortfolioOrder)) })));
}

export function projectFacetValues(projects: readonly RuntimeProjectSnapshot[]): Readonly<{
  lifecycles: readonly string[];
  priorities: readonly string[];
  typeKeys: readonly string[];
  companyIds: readonly string[];
}> {
  const unique = (values: readonly (string | undefined)[]) => Object.freeze([...new Set(values.filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b)));
  return Object.freeze({
    lifecycles: unique(projects.map((project) => knownText(project.lifecycle))),
    priorities: unique(projects.map((project) => knownText(project.priority))),
    typeKeys: unique(projects.map((project) => optionalKnownText(project.typeKey))),
    companyIds: unique(projects.map((project) => optionalKnownText(project.companyId)))
  });
}
