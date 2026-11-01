export const DEFAULT_BOOK_EXECUTION_POLICY = Object.freeze({
    projectId: "books",
    portfolioAgentAutoAllowed: false,
    normalChatScope: Object.freeze(["recovery", "writing", "editing", "artwork", "interior", "cover", "formatting", "metadata_preparation", "qc", "package_creation", "evidence"]),
    workScope: Object.freeze(["publishing_account_browser_upload", "previewer", "submission", "provider_account_bound_publishing"])
});
export function assertBookExecutionAllowed(policy, action, executor) {
    if (executor === "portfolio_agent" && !policy.portfolioAgentAutoAllowed)
        throw new Error("Books are excluded from portfolio Agent Auto");
    if (executor === "normal_chat" && !policy.normalChatScope.includes(action))
        throw new Error("action is outside normal-chat Books scope");
    if (executor === "work" && !policy.workScope.includes(action))
        throw new Error("Work is publishing-only for Books unless owner changes the rule");
}
const PROTECTED_BOOK_ACTIONS = new Set(["publishing_account_browser_upload", "submission", "provider_account_bound_publishing"]);
function boundaryTimestamp(value, label) { const parsed = Date.parse(value); if (!Number.isFinite(parsed))
    throw new Error(`${label} must be an ISO-compatible timestamp`); return parsed; }
function boundaryRefs(values, label, requireOne = true) { if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some(v => typeof v !== "string" || !v.trim()))
    throw new Error(`${label} must contain nonblank values`); const normalized = values.map(v => v.trim()); if (new Set(normalized).size !== normalized.length)
    throw new Error(`${label} cannot contain duplicates`); return Object.freeze(normalized); }
export function validateEvidenceBackedBookExecutionPolicy(policy) { if (!policy.id.trim() || !policy.ownerId.trim() || !policy.projectId.trim())
    throw new Error("book execution policy identity/owner/project are required"); if (!Number.isSafeInteger(policy.version) || policy.version < 1)
    throw new Error("book execution policy version must be positive"); boundaryTimestamp(policy.observedAt, "book execution policy observedAt"); const sourceRefs = boundaryRefs(policy.sourceRefs, "book execution policy source refs"), normalChatScope = boundaryRefs(policy.normalChatScope, "normal chat book scope"), workScope = boundaryRefs(policy.workScope, "Work book scope"), brainScope = boundaryRefs(policy.brainScope, "Brain book scope", false), foundryScope = boundaryRefs(policy.foundryScope, "Foundry book scope", false), projectAgentScope = boundaryRefs(policy.projectAgentScope, "project Agent book scope", false); const forbiddenWork = workScope.filter(a => !["publishing_account_browser_upload", "previewer", "submission", "provider_account_bound_publishing"].includes(a)); if (forbiddenWork.length > 0)
    throw new Error("Work is publishing-only for Books unless owner changes the rule"); return Object.freeze({ ...policy, sourceRefs, normalChatScope, workScope, brainScope, foundryScope, projectAgentScope }); }
export function assessBookExecution(policy, request) { const p = validateEvidenceBackedBookExecutionPolicy(policy); boundaryTimestamp(request.observedAt, "book execution request observedAt"); if (request.ownerId !== p.ownerId || request.projectId !== p.projectId)
    throw new Error("book execution request cannot cross owner/project policy boundary"); if (!request.exactTargetRef.trim())
    return Object.freeze({ requestId: request.id, allowed: false, reason: "missing_exact_target", executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef }); if (request.executor === "portfolio_agent" && !p.portfolioAgentAutoAllowed)
    return Object.freeze({ requestId: request.id, allowed: false, reason: "portfolio_agent_excluded", executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef }); if (request.executor === "work" && !p.workScope.includes(request.action))
    return Object.freeze({ requestId: request.id, allowed: false, reason: "work_publishing_only", executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef }); const scope = request.executor === "normal_chat" ? p.normalChatScope : request.executor === "work" ? p.workScope : request.executor === "brain" ? p.brainScope : request.executor === "foundry" ? p.foundryScope : request.executor === "project_agent" ? p.projectAgentScope : []; if (request.executor !== "portfolio_agent" && !scope.includes(request.action))
    return Object.freeze({ requestId: request.id, allowed: false, reason: "outside_executor_scope", executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef }); if (PROTECTED_BOOK_ACTIONS.has(request.action) && !request.authorizationRef?.trim())
    return Object.freeze({ requestId: request.id, allowed: false, reason: "missing_protected_authorization", executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef }); return Object.freeze({ requestId: request.id, allowed: true, reason: "allowed", executor: request.executor, action: request.action, exactTargetRef: request.exactTargetRef }); }
export const DEFAULT_EVIDENCE_BACKED_BOOK_POLICY = Object.freeze({ id: "books-default-policy", ownerId: "owner", projectId: "books", version: 1, portfolioAgentAutoAllowed: false, normalChatScope: Object.freeze(["planning", "research", "writing", "editing", "artwork", "interior", "cover", "formatting", "metadata_preparation", "qc", "package_creation", "recovery", "evidence"]), workScope: Object.freeze(["publishing_account_browser_upload", "previewer", "submission", "provider_account_bound_publishing"]), brainScope: Object.freeze(["planning", "research", "writing", "editing", "metadata_preparation", "qc", "recovery", "evidence"]), foundryScope: Object.freeze(["planning", "research", "metadata_preparation", "package_creation", "evidence"]), projectAgentScope: Object.freeze(["planning", "research", "writing", "editing", "formatting", "metadata_preparation", "qc", "package_creation", "recovery", "evidence"]), sourceRefs: Object.freeze(["owner:books-boundary-policy"]), observedAt: "1970-01-01T00:00:00.000Z" });
//# sourceMappingURL=boundaries.js.map