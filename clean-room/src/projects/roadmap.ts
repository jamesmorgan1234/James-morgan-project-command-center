export type WorkUnitStatus = "planned" | "ready" | "working" | "blocked" | "verified" | "skipped";

export interface RoadmapWorkUnit {
  readonly id: string;
  readonly categoryId: string;
  readonly phaseId: string;
  readonly title: string;
  readonly status: WorkUnitStatus;
  readonly applicable: boolean;
  readonly dependencyIds: readonly string[];
  readonly gateIds: readonly string[];
  readonly acceptanceCriteria: readonly string[];
}

export interface RoadmapGate {
  readonly id: string;
  readonly satisfied: boolean;
  readonly evidenceRefs: readonly string[];
}

export interface ProjectRoadmap {
  readonly projectId: string;
  readonly version: number;
  readonly workUnits: readonly RoadmapWorkUnit[];
  readonly gates: readonly RoadmapGate[];
}

export interface WorkReadiness {
  readonly ready: boolean;
  readonly unmetDependencies: readonly string[];
  readonly unmetGates: readonly string[];
}

export function validateRoadmap(roadmap: ProjectRoadmap): void {
  if (!roadmap.projectId.trim() || !Number.isSafeInteger(roadmap.version) || roadmap.version < 1) throw new Error("Roadmap project/version are required");
  const ids = new Set(roadmap.workUnits.map((unit) => unit.id));
  if (ids.size !== roadmap.workUnits.length) throw new Error("Roadmap work-unit IDs must be unique");
  const gateIds = new Set(roadmap.gates.map((gate) => gate.id));
  if (gateIds.size !== roadmap.gates.length) throw new Error("Roadmap gate IDs must be unique");
  for (const unit of roadmap.workUnits) {
    if (unit.dependencyIds.includes(unit.id)) throw new Error(`Work unit cannot depend on itself: ${unit.id}`);
    for (const dependency of unit.dependencyIds) if (!ids.has(dependency)) throw new Error(`Unknown dependency ${dependency} for ${unit.id}`);
    for (const gate of unit.gateIds) if (!gateIds.has(gate)) throw new Error(`Unknown gate ${gate} for ${unit.id}`);
    if (unit.acceptanceCriteria.length === 0) throw new Error(`Work unit requires acceptance criteria: ${unit.id}`);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(roadmap.workUnits.map((unit) => [unit.id, unit]));
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`Roadmap dependency cycle detected at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    const unit = byId.get(id);
    if (!unit) throw new Error(`Unknown roadmap unit: ${id}`);
    for (const dependency of unit.dependencyIds) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);
}

export function workReadiness(roadmap: ProjectRoadmap, workUnitId: string): WorkReadiness {
  validateRoadmap(roadmap);
  const unit = roadmap.workUnits.find((candidate) => candidate.id === workUnitId);
  if (!unit) throw new Error(`Unknown work unit: ${workUnitId}`);
  const byId = new Map(roadmap.workUnits.map((candidate) => [candidate.id, candidate]));
  const gates = new Map(roadmap.gates.map((gate) => [gate.id, gate]));
  const unmetDependencies = unit.dependencyIds.filter((id) => byId.get(id)?.status !== "verified" && byId.get(id)?.status !== "skipped");
  const unmetGates = unit.gateIds.filter((id) => !gates.get(id)?.satisfied);
  return Object.freeze({ ready: unit.applicable && unmetDependencies.length === 0 && unmetGates.length === 0 && ["planned", "ready"].includes(unit.status), unmetDependencies: Object.freeze(unmetDependencies), unmetGates: Object.freeze(unmetGates) });
}
