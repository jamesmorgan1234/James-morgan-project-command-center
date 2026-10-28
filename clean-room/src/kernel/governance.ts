export const PROTECTED_ACTIONS = Object.freeze([
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
] as const);

export const NON_PROTECTED_ACTIONS = Object.freeze(["read", "analyze", "draft", "local_reversible_write"] as const);

export type ProtectedAction = (typeof PROTECTED_ACTIONS)[number];
export type NonProtectedAction = (typeof NON_PROTECTED_ACTIONS)[number];
export type ActionClass = ProtectedAction | NonProtectedAction;
export type InstructionState = "current" | "stale" | "conflicting";
export type ExecutionSurface = "normal_chat" | "work";

export interface AuthorizationSnapshot {
  readonly ownerId: string;
  readonly action: ActionClass;
  readonly projectId?: string;
  readonly accountId?: string;
  readonly resourceId?: string;
  readonly authorizedAt: string;
  readonly expiresAt?: string;
}

export interface GovernanceContext {
  readonly ownerId: string;
  readonly authorityOwnerId?: string;
  readonly newestInstructionAllows: boolean;
  readonly instructionState?: InstructionState;
  readonly freeFirst: boolean;
  readonly introducesCost: boolean;
  readonly action: ActionClass;
  readonly projectId?: string;
  readonly accountId?: string;
  readonly resourceId?: string;
  readonly executionSurface?: ExecutionSurface;
  readonly normalChatAvailable?: boolean;
  readonly authorization?: AuthorizationSnapshot;
  readonly now: string;
}

export interface GovernanceDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly protected: boolean;
}

function denied(reason: string, protectedAction: boolean): GovernanceDecision {
  return Object.freeze({ allowed: false, reason, protected: protectedAction });
}

function allowed(reason: string, protectedAction: boolean): GovernanceDecision {
  return Object.freeze({ allowed: true, reason, protected: protectedAction });
}

function parseTimestamp(value: string, label: string): number | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export function evaluateGovernance(context: GovernanceContext): GovernanceDecision {
  if (!context || typeof context !== "object"
    || typeof context.ownerId !== "string" || !context.ownerId.trim()
    || typeof context.newestInstructionAllows !== "boolean"
    || typeof context.freeFirst !== "boolean" || typeof context.introducesCost !== "boolean"
    || (context.authorityOwnerId !== undefined && (typeof context.authorityOwnerId !== "string" || !context.authorityOwnerId.trim()))
    || (context.instructionState !== undefined && !["current", "stale", "conflicting"].includes(context.instructionState))
    || (context.executionSurface !== undefined && !["normal_chat", "work"].includes(context.executionSurface))
    || (context.normalChatAvailable !== undefined && typeof context.normalChatAvailable !== "boolean")) {
    return denied("invalid_governance_context", true);
  }
  const isProtected = PROTECTED_ACTIONS.includes(context.action as ProtectedAction);
  const isKnownNonProtected = NON_PROTECTED_ACTIONS.includes(context.action as NonProtectedAction);
  const protectedByDefault = isProtected || !isKnownNonProtected;

  if (context.authorityOwnerId !== undefined && context.authorityOwnerId !== context.ownerId) {
    return denied("owner_authority_mismatch", true);
  }

  const instructionState = context.instructionState ?? "current";
  if (instructionState === "stale") return denied("stale_owner_instruction", protectedByDefault);
  if (instructionState === "conflicting") return denied("conflicting_owner_instruction", protectedByDefault);
  if (!context.newestInstructionAllows) return denied("newest_owner_instruction_blocks_action", protectedByDefault);
  if (context.freeFirst && context.introducesCost) return denied("free_first_blocks_cost", true);

  if (context.executionSurface === "work" && context.normalChatAvailable !== false) {
    return denied("normal_chat_first_requires_local_execution", protectedByDefault);
  }

  if (!isProtected && !isKnownNonProtected) return denied("unknown_action_class", true);
  if (!isProtected) return allowed("allowed_non_protected_action", false);

  const auth = context.authorization;
  if (!auth) return denied("fresh_owner_authorization_required", true);
  if (auth.ownerId !== context.ownerId || auth.action !== context.action) return denied("authorization_scope_mismatch", true);
  if (context.projectId !== undefined && auth.projectId !== context.projectId) return denied("authorization_project_mismatch", true);
  if (context.accountId !== undefined && auth.accountId !== context.accountId) return denied("authorization_account_mismatch", true);
  if (context.resourceId !== undefined && auth.resourceId !== context.resourceId) return denied("authorization_resource_mismatch", true);

  if (context.action === "change_protected_asset") {
    if (!context.resourceId?.trim()) return denied("protected_asset_resource_required", true);
    if (auth.resourceId !== context.resourceId) return denied("protected_asset_authorization_mismatch", true);
  }

  const now = parseTimestamp(context.now, "now");
  const authorizedAt = parseTimestamp(auth.authorizedAt, "authorizedAt");
  if (now === undefined || authorizedAt === undefined) return denied("authorization_timestamp_invalid", true);
  if (authorizedAt > now) return denied("authorization_not_yet_valid", true);

  if (auth.expiresAt !== undefined) {
    const expiresAt = parseTimestamp(auth.expiresAt, "expiresAt");
    if (expiresAt === undefined || expiresAt <= authorizedAt) return denied("authorization_expiry_invalid", true);
    if (now >= expiresAt) return denied("authorization_expired", true);
  }

  return allowed("protected_action_authorized", true);
}

export class GovernanceDeniedError extends Error {
  readonly decision: GovernanceDecision;

  constructor(decision: GovernanceDecision) {
    super(`Governance denied: ${decision.reason}`);
    this.name = "GovernanceDeniedError";
    this.decision = decision;
  }
}

export class GovernanceGate {
  evaluate(context: GovernanceContext): GovernanceDecision {
    return evaluateGovernance(context);
  }

  assertAllowed(context: GovernanceContext): GovernanceDecision {
    const decision = this.evaluate(context);
    if (!decision.allowed) throw new GovernanceDeniedError(decision);
    return decision;
  }

  execute<T>(context: GovernanceContext, operation: () => T): T {
    this.assertAllowed(context);
    return operation();
  }
}
