export interface BookExecutionPolicy {
  readonly projectId: string;
  readonly portfolioAgentAutoAllowed: boolean;
  readonly normalChatScope: readonly string[];
  readonly workScope: readonly string[];
}

export const DEFAULT_BOOK_EXECUTION_POLICY: BookExecutionPolicy = Object.freeze({
  projectId: "books",
  portfolioAgentAutoAllowed: false,
  normalChatScope: Object.freeze(["recovery", "writing", "editing", "artwork", "interior", "cover", "formatting", "qc", "package_creation"]),
  workScope: Object.freeze(["publishing_account_browser_upload", "previewer", "submission", "provider_account_bound_publishing"])
});

export function assertBookExecutionAllowed(policy: BookExecutionPolicy, action: string, executor: "portfolio_agent" | "normal_chat" | "work"): void {
  if (executor === "portfolio_agent" && !policy.portfolioAgentAutoAllowed) throw new Error("Books are excluded from portfolio Agent Auto");
  if (executor === "normal_chat" && !policy.normalChatScope.includes(action)) throw new Error("action is outside normal-chat Books scope");
  if (executor === "work" && !policy.workScope.includes(action)) throw new Error("Work is publishing-only for Books unless owner changes the rule");
}

export type BookExecutorKind = "brain" | "foundry" | "project_agent" | "portfolio_agent" | "normal_chat" | "work";
export type BookExecutionAction = "planning" | "research" | "writing" | "editing" | "artwork" | "interior" | "cover" | "formatting" | "qc" | "package_creation" | "publishing_account_browser_upload" | "previewer" | "submission" | "provider_account_bound_publishing";

export interface EvidenceBackedBookExecutionPolicy {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly version: number;
  readonly portfolioAgentAutoAllowed: boolean;
  readonly normalChatScope: readonly BookExecutionAction[];
  readonly workScope: readonly BookExecutionAction[];
  readonly brainScope: readonly BookExecutionAction[];
  readonly foundryScope: readonly BookExecutionAction[];
  readonly projectAgentScope: readonly BookExecutionAction[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface BookExecutionRequest {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId?: string | undefined;
  readonly action: BookExecutionAction;
  readonly executor: BookExecutorKind;
  readonly exactTargetRef: string;
  readonly authorizationRef?: string | undefined;
  readonly observedAt: string;
}

export interface BookExecutionDecision {
  readonly requestId: string;
  readonly allowed: boolean;
  readonly reason: "allowed" | "portfolio_agent_excluded" | "outside_executor_scope" | "work_publishing_only" | "missing_exact_target" | "missing_protected_authorization";
  readonly executor: BookExecutorKind;
  readonly action: BookExecutionAction;
  readonly exactTargetRef: string;
}

const PROTECTED_BOOK_ACTIONS = new Set<BookExecutionAction>(["publishing_account_browser_upload", "submission", "provider_account_bound_publishing"]);

function boundaryTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function boundaryRefs<T extends string>(values: readonly T[], label: string, requireOne = true): readonly T[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank values`);
  const normalized = values.map((value) => value.trim() as T);
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export function validateEvidenceBackedBookExecutionPolicy(policy: EvidenceBackedBookExecutionPolicy): EvidenceBackedBookExecutionPolicy {
  if (!policy.id.trim() || !policy.ownerId.trim() || !policy.projectId.trim()) throw new Error("book execution policy identity/owner/project are required");
  if (!Number.isSafeInteger(policy.version) || policy.version < 1) throw new Error("book execution policy version must be positive");
  boundaryTimestamp(policy.observedAt, "book execution policy observedAt");
  const sourceRefs = boundaryRefs(policy.sourceRefs, "book execution policy source refs");
  const normalChatScope = boundaryRefs(policy.normalChatScope, "normal chat book scope");
  const workScope = boundaryRefs(policy.workScope, "Work book scope");
  const brainScope = boundaryRefs(policy.brainScope, "Brain book scope", false);
  const foundryScope = boundaryRefs(policy.foundryScope, "Foundry book scope", false);
  const projectAgentScope = boundaryRefs(policy.projectAgentScope, "project Agent book scope", false);
  const forbiddenWork = workScope.filter((action) => !["publishing_account_browser_upload", "previewer", "submission", "provider_account_bound_publishing"].includes(action));
  if (forbiddenWork.length > 0) throw new Error("Work is publishing-only for Books unless owner changes the rule");
  return Object.freeze({ ...policy, sourceRefs, normalChatScope, workScope, brainScope, foundryScope, projectAgentScope });
}

export function assessBookExecution(policy: EvidenceBackedBookExecutionPolicy, request: BookExecutionRequest): BookExecutionDecision {
  const validPolicy = validateEvidenceBackedBookExecutionPolicy(policy);
  boundaryTimestamp(request.observedAt, "book execution request observedAt");
  if (request.ownerId !== validPolicy.ownerId || request.projectId !== validPolicy.projectId) throw new Error("book execution request cannot cross owner/project policy boundary");
  if (!request.exactTargetRef.trim()) return Object.freeze({ requestId: request.id, allowed: false, reason: "missing_exact_target" as const, executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef });
  if (request.executor === "portfolio_agent" && !validPolicy.portfolioAgentAutoAllowed) return Object.freeze({ requestId: request.id, allowed: false, reason: "portfolio_agent_excluded" as const, executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef });
  if (request.executor === "work" && !validPolicy.workScope.includes(request.action)) return Object.freeze({ requestId: request.id, allowed: false, reason: "work_publishing_only" as const, executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef });
  const scope = request.executor === "normal_chat" ? validPolicy.normalChatScope : request.executor === "work" ? validPolicy.workScope : request.executor === "brain" ? validPolicy.brainScope : request.executor === "foundry" ? validPolicy.foundryScope : request.executor === "project_agent" ? validPolicy.projectAgentScope : [];
  if (request.executor !== "portfolio_agent" && !scope.includes(request.action)) return Object.freeze({ requestId: request.id, allowed: false, reason: "outside_executor_scope" as const, executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef });
  if (PROTECTED_BOOK_ACTIONS.has(request.action) && !request.authorizationRef?.trim()) return Object.freeze({ requestId: request.id, allowed: false, reason: "missing_protected_authorization" as const, executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef });
  return Object.freeze({ requestId: request.id, allowed: true, reason: "allowed" as const, executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef });
}

export const DEFAULT_EVIDENCE_BACKED_BOOK_POLICY: EvidenceBackedBookExecutionPolicy = Object.freeze({
  id: "books-default-policy",
  ownerId: "owner",
  projectId: "books",
  version: 1,
  portfolioAgentAutoAllowed: false,
  normalChatScope: Object.freeze(["planning","research","writing","editing","artwork","interior","cover","formatting","qc","package_creation"]),
  workScope: Object.freeze(["publishing_account_browser_upload","previewer","submission","provider_account_bound_publishing"]),
  brainScope: Object.freeze(["planning","research"]),
  foundryScope: Object.freeze(["planning","research","package_creation"]),
  projectAgentScope: Object.freeze(["planning","research","writing","editing","qc","package_creation"]),
  sourceRefs: Object.freeze(["owner:books-boundary-policy"]),
  observedAt: "1970-01-01T00:00:00.000Z"
});
