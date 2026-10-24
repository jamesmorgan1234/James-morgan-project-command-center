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
    .sort((a, b) => a.name.localeCompare(b.name)));
}

function groupValue(project: RuntimeProjectSnapshot, groupBy: RuntimeProjectGroupBy): string {
  if (groupBy === "type") return optionalKnownText(project.typeKey) ?? "type:unavailable";
  if (groupBy === "company") return optionalKnownText(project.companyId) ?? "company:unassigned";
  if (groupBy === "lifecycle") return knownText(project.lifecycle) ?? "lifecycle:unavailable";
  if (groupBy === "priority") return knownText(project.priority) ?? "priority:unavailable";
  return "all";
}

export function groupRuntimeProjects(projects: readonly RuntimeProjectSnapshot[], groupBy: RuntimeProjectGroupBy = "none"): readonly RuntimeProjectGroup[] {
  if (groupBy === "none") return Object.freeze([{ key: "all", label: "All projects", projects: Object.freeze([...projects]) }]);
  const groups = new Map<string, RuntimeProjectSnapshot[]>();
  for (const project of projects) {
    const key = groupValue(project, groupBy);
    const bucket = groups.get(key) ?? [];
    bucket.push(project);
    groups.set(key, bucket);
  }
  return Object.freeze([...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => Object.freeze({ key, label: key.replace(/^.*?:/, "").replaceAll("_", " "), projects: Object.freeze(items.sort((a, b) => a.name.localeCompare(b.name))) })));
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
