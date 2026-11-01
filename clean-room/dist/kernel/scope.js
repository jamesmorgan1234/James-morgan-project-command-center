export function validateExecutionScope(scope) {
    if (!scope.ownerId.trim())
        throw new Error("Execution scope ownerId is required");
    if (scope.projectId !== undefined && !scope.projectId.trim())
        throw new Error("Execution scope projectId cannot be empty");
    if (scope.companyId !== undefined && !scope.companyId.trim())
        throw new Error("Execution scope companyId cannot be empty");
    if (scope.accountId !== undefined && !scope.accountId.trim())
        throw new Error("Execution scope accountId cannot be empty");
    return Object.freeze({ ...scope });
}
export function executionScopeKey(scope) {
    validateExecutionScope(scope);
    return [scope.ownerId, scope.companyId ?? "-", scope.projectId ?? "-", scope.accountId ?? "-", scope.environment].join("|");
}
export function scopeContains(parent, child) {
    validateExecutionScope(parent);
    validateExecutionScope(child);
    if (parent.ownerId !== child.ownerId || parent.environment !== child.environment)
        return false;
    if (parent.companyId !== undefined && parent.companyId !== child.companyId)
        return false;
    if (parent.projectId !== undefined && parent.projectId !== child.projectId)
        return false;
    if (parent.accountId !== undefined && parent.accountId !== child.accountId)
        return false;
    return true;
}
export function assertScopeContains(parent, child) {
    if (!scopeContains(parent, child))
        throw new Error("Execution scope amplification or mismatch blocked");
}
//# sourceMappingURL=scope.js.map