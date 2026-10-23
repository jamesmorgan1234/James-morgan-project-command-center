export type AutonomyLevel = "observe" | "propose" | "prepare" | "execute" | "continuous";
export type DecisionRight = "self_decidable" | "defaultable" | "recommend" | "protected" | "prohibited";

const LEVEL_RANK: Readonly<Record<AutonomyLevel, number>> = Object.freeze({ observe: 0, propose: 1, prepare: 2, execute: 3, continuous: 4 });

export function canAct(level: AutonomyLevel, right: DecisionRight, protectedAuthorization: boolean): boolean {
  if (right === "prohibited") return false;
  if (right === "protected") return LEVEL_RANK[level] >= LEVEL_RANK.execute && protectedAuthorization;
  if (right === "recommend") return LEVEL_RANK[level] >= LEVEL_RANK.propose;
  if (right === "defaultable") return LEVEL_RANK[level] >= LEVEL_RANK.prepare;
  return LEVEL_RANK[level] >= LEVEL_RANK.execute;
}

export function assertAutonomyCannotExpandScope(parentScopes: readonly string[], requestedScopes: readonly string[]): void {
  for (const scope of requestedScopes) if (!parentScopes.includes(scope)) throw new Error(`Autonomy cannot amplify authority scope: ${scope}`);
}
