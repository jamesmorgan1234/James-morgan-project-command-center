export interface DecisionContext {
  readonly projectType: string;
  readonly accountScope: string;
  readonly riskClass: string;
  readonly costClass: string;
  readonly actionClass: string;
}

export interface OwnerPrecedent {
  readonly decisionRef: string;
  readonly context: DecisionContext;
  readonly reusableAsDefault: boolean;
  readonly grantsAuthorization: boolean;
}

export interface PrecedentDecision {
  readonly applies: boolean;
  readonly reason: string;
  readonly authorizationInherited: false;
}

export function evaluateOwnerPrecedent(precedent: OwnerPrecedent, current: DecisionContext): PrecedentDecision {
  const differences = Object.entries(precedent.context).filter(([key, value]) => current[key as keyof DecisionContext] !== value).map(([key]) => key);
  if (!precedent.reusableAsDefault) return Object.freeze({ applies: false, reason: "precedent_not_reusable", authorizationInherited: false });
  if (differences.length > 0) return Object.freeze({ applies: false, reason: `material_context_difference:${differences.join(",")}`, authorizationInherited: false });
  return Object.freeze({ applies: true, reason: "same_material_context_default_only", authorizationInherited: false });
}
