export const PROTECTED_ACTIONS = [
  "spend_money",
  "purchase",
  "publish",
  "send_external_communication",
  "merge",
  "deploy_production",
  "destructive_delete",
  "change_security",
  "manage_credentials",
  "change_protected_asset",
  "accept_legal_terms"
] as const;

export const NON_PROTECTED_ACTIONS = ["read", "analyze", "draft", "local_reversible_write"] as const;

export type ProtectedAction = (typeof PROTECTED_ACTIONS)[number];
export type NonProtectedAction = (typeof NON_PROTECTED_ACTIONS)[number];
export type ActionClass = ProtectedAction | NonProtectedAction;

export interface AuthorizationSnapshot {
  readonly ownerId: string;
  readonly action: ActionClass;
  readonly projectId?: string;
  readonly resourceId?: string;
  readonly authorizedAt: string;
  readonly expiresAt?: string;
}

export interface GovernanceContext {
  readonly ownerId: string;
  readonly newestInstructionAllows: boolean;
  readonly freeFirst: boolean;
  readonly introducesCost: boolean;
  readonly action: ActionClass;
  readonly projectId?: string;
  readonly authorization?: AuthorizationSnapshot;
  readonly now: string;
}

export interface GovernanceDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly protected: boolean;
}

export function evaluateGovernance(context: GovernanceContext): GovernanceDecision {
  const isProtected = PROTECTED_ACTIONS.includes(context.action as ProtectedAction);
  const isKnownNonProtected = NON_PROTECTED_ACTIONS.includes(context.action as NonProtectedAction);
  if (!context.newestInstructionAllows) return { allowed: false, reason: "newest_owner_instruction_blocks_action", protected: isProtected || !isKnownNonProtected };
  if (context.freeFirst && context.introducesCost) return { allowed: false, reason: "free_first_blocks_cost", protected: true };
  if (!isProtected && !isKnownNonProtected) return { allowed: false, reason: "unknown_action_class", protected: true };
  if (!isProtected) return { allowed: true, reason: "allowed_non_protected_action", protected: false };
  const auth = context.authorization;
  if (!auth) return { allowed: false, reason: "fresh_owner_authorization_required", protected: true };
  if (auth.ownerId !== context.ownerId || auth.action !== context.action) return { allowed: false, reason: "authorization_scope_mismatch", protected: true };
  if (context.projectId && auth.projectId !== context.projectId) return { allowed: false, reason: "authorization_project_mismatch", protected: true };
  if (auth.expiresAt && Date.parse(context.now) > Date.parse(auth.expiresAt)) return { allowed: false, reason: "authorization_expired", protected: true };
  return { allowed: true, reason: "protected_action_authorized", protected: true };
}
