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

export interface DecisionRightRule {
  readonly key: string;
  readonly version: number;
  readonly right: DecisionRight;
  readonly ownerDefaultRef?: string;
  readonly protectedActionKey?: string;
  readonly evidenceRefs: readonly string[];
}

export interface DecisionRightAssessment {
  readonly key: string;
  readonly version: number;
  readonly right: DecisionRight;
  readonly allowed: boolean;
  readonly ownerBoundaryRequired: boolean;
  readonly reason: "allowed_by_registry" | "protected_authorization_required" | "prohibited" | "autonomy_level_insufficient";
}

function normalizeDecisionRule(rule: DecisionRightRule): DecisionRightRule {
  if (!rule.key.trim() || !Number.isSafeInteger(rule.version) || rule.version < 1) throw new Error("Decision-right key/version are required");
  const evidenceRefs = rule.evidenceRefs.map((ref) => ref.trim());
  if (evidenceRefs.length === 0 || evidenceRefs.some((ref) => !ref) || new Set(evidenceRefs).size !== evidenceRefs.length) throw new Error("Decision-right evidence must be unique and nonblank");
  if (rule.right === "defaultable" && !rule.ownerDefaultRef?.trim()) throw new Error("Defaultable decision right requires owner-approved default evidence");
  if (rule.right === "protected" && !rule.protectedActionKey?.trim()) throw new Error("Protected decision right requires an exact protected action key");
  return Object.freeze({
    ...rule,
    key: rule.key.trim(),
    ...(rule.ownerDefaultRef ? { ownerDefaultRef: rule.ownerDefaultRef.trim() } : {}),
    ...(rule.protectedActionKey ? { protectedActionKey: rule.protectedActionKey.trim() } : {}),
    evidenceRefs: Object.freeze(evidenceRefs)
  });
}

export class DecisionRightsRegistry {
  readonly #rules = new Map<string, DecisionRightRule>();

  register(rule: DecisionRightRule): DecisionRightRule {
    const next = normalizeDecisionRule(rule);
    const current = this.#rules.get(next.key);
    if (current && next.version <= current.version) throw new Error(`Decision-right version must advance: ${next.key}`);
    this.#rules.set(next.key, next);
    return next;
  }

  get(key: string): DecisionRightRule | undefined { return this.#rules.get(key); }

  assess(key: string, level: AutonomyLevel, protectedAuthorization: boolean): DecisionRightAssessment {
    const rule = this.#rules.get(key);
    if (!rule) throw new Error(`Unknown decision right: ${key}`);
    const allowed = canAct(level, rule.right, protectedAuthorization);
    const ownerBoundaryRequired = rule.right === "protected" && !protectedAuthorization;
    const reason: DecisionRightAssessment["reason"] =
      rule.right === "prohibited" ? "prohibited" :
      ownerBoundaryRequired ? "protected_authorization_required" :
      allowed ? "allowed_by_registry" :
      "autonomy_level_insufficient";
    return Object.freeze({ key: rule.key, version: rule.version, right: rule.right, allowed, ownerBoundaryRequired, reason });
  }

  list(): readonly DecisionRightRule[] {
    return Object.freeze([...this.#rules.values()].sort((a, b) => a.key.localeCompare(b.key)));
  }
}
