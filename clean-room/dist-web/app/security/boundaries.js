export function evaluateDataBoundary(grant, boundary, operation = "read") {
    const operations = grant.operations ?? ["read"];
    if (!operations.includes(operation))
        return Object.freeze({ allowed: false, reason: "operation_not_granted" });
    if (grant.ownerId !== boundary.ownerId)
        return Object.freeze({ allowed: false, reason: "owner_boundary_mismatch" });
    if (boundary.projectId && !grant.projectIds.includes(boundary.projectId))
        return Object.freeze({ allowed: false, reason: "project_boundary_mismatch" });
    if (boundary.companyId && !(grant.companyIds ?? []).includes(boundary.companyId))
        return Object.freeze({ allowed: false, reason: "company_boundary_mismatch" });
    if (boundary.businessId && !grant.businessIds.includes(boundary.businessId))
        return Object.freeze({ allowed: false, reason: "business_boundary_mismatch" });
    if (boundary.accountId && !(grant.accountIds ?? []).includes(boundary.accountId))
        return Object.freeze({ allowed: false, reason: "account_boundary_mismatch" });
    if (boundary.environment && !(grant.environments ?? []).includes(boundary.environment))
        return Object.freeze({ allowed: false, reason: "environment_boundary_mismatch" });
    return Object.freeze({ allowed: true, reason: "allowed" });
}
export function assertDataBoundary(grant, boundary, operation = "read") {
    const decision = evaluateDataBoundary(grant, boundary, operation);
    if (!decision.allowed)
        throw new Error(`Data boundary denied: ${decision.reason}`);
}
//# sourceMappingURL=boundaries.js.map