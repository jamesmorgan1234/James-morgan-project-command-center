export type SteeringCommand = "pause" | "resume" | "reprioritize" | "change" | "redirect";

export interface ActivePlanUnit {
  readonly id: string;
  readonly dependencyIds: readonly string[];
  readonly verified: boolean;
  readonly authorizationScope: readonly string[];
}

export interface SteeringResult {
  readonly preservedVerifiedIds: readonly string[];
  readonly invalidatedIds: readonly string[];
  readonly requiresAuthorizationRecheck: boolean;
}

export function applySteering(command: SteeringCommand, affectedIds: readonly string[], units: readonly ActivePlanUnit[]): SteeringResult {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const invalid = new Set(affectedIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const unit of units) if (!invalid.has(unit.id) && unit.dependencyIds.some((dependency) => invalid.has(dependency))) { invalid.add(unit.id); changed = true; }
  }
  const preserved = units.filter((unit) => unit.verified && !invalid.has(unit.id)).map((unit) => unit.id);
  const invalidated = [...invalid].filter((id) => byId.has(id));
  return Object.freeze({ preservedVerifiedIds: Object.freeze(preserved), invalidatedIds: Object.freeze(invalidated), requiresAuthorizationRecheck: ["change", "redirect", "reprioritize"].includes(command) });
}
