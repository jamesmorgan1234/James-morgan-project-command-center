export class BookApprovalLedger {
    #entries = [];
    record(entry) {
        if (!entry.id.trim() || !entry.bookId.trim() || !entry.ownerActionRef.trim() || entry.targetVersion < 1 || !entry.decidedAt.includes("T"))
            throw new Error("explicit owner approval evidence required");
        if (entry.supersedesApprovalId !== null && !this.#entries.some((item) => item.id === entry.supersedesApprovalId))
            throw new Error("unknown superseded approval");
        const frozen = Object.freeze({ ...entry });
        this.#entries.push(frozen);
        return frozen;
    }
    current(bookId, kind) {
        return [...this.#entries].reverse().find((entry) => entry.bookId === bookId && entry.kind === kind);
    }
}
function approvalTimestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function approvalRefs(values, label) {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank references`);
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
    return Object.freeze(normalized);
}
export class EvidenceBackedBookApprovalLedger {
    #entries = new Map();
    #current = new Map();
    record(entry) {
        if (!entry.id.trim() || !entry.ownerId.trim() || !entry.projectId.trim() || !entry.bookId.trim() || !entry.targetIdentityRef.trim() || !entry.ownerActionRef.trim() || entry.explicitOwnerAction !== true)
            throw new Error("explicit owner approval action and exact target identity are required");
        if (!Number.isSafeInteger(entry.targetVersion) || entry.targetVersion < 1)
            throw new Error("book approval target version must be positive");
        approvalTimestamp(entry.decidedAt, "book approval decidedAt");
        const sourceRefs = approvalRefs(entry.sourceRefs, "book approval source refs");
        if (this.#entries.has(entry.id))
            throw new Error("book approval id must be unique");
        const key = `${entry.ownerId}:${entry.projectId}:${entry.bookId}:${entry.kind}`;
        const prior = this.#current.get(key);
        if (prior) {
            if (!entry.supersedesApprovalId || entry.supersedesApprovalId !== prior.id)
                throw new Error("approval state change must explicitly supersede the current approval");
            if (entry.targetVersion < prior.targetVersion)
                throw new Error("approval target version cannot move backward");
        }
        else if (entry.supersedesApprovalId !== undefined) {
            throw new Error("initial approval cannot supersede unknown state");
        }
        if (entry.decision === "reopen" && !prior)
            throw new Error("reopen requires an existing approved or rejected state");
        const frozen = Object.freeze({ ...entry, sourceRefs });
        this.#entries.set(entry.id, frozen);
        this.#current.set(key, frozen);
        return frozen;
    }
    current(ownerId, projectId, bookId, kind) {
        return this.#current.get(`${ownerId}:${projectId}:${bookId}:${kind}`);
    }
    requireApproved(ownerId, projectId, bookId, kind, targetVersion, targetIdentityRef) {
        const current = this.current(ownerId, projectId, bookId, kind);
        if (!current || current.decision !== "approve" || current.targetVersion !== targetVersion || current.targetIdentityRef !== targetIdentityRef)
            throw new Error("exact owner-approved book state is unavailable");
        return current;
    }
}
export function assertProtectedBookChangeAuthorized(request, authorization) {
    if (!request.ownerId.trim() || !request.projectId.trim() || !request.bookId.trim() || !request.priorIdentityRef.trim() || !request.replacementIdentityRef.trim())
        throw new Error("protected book change identity/scope/target refs are required");
    if (!Number.isSafeInteger(request.fromVersion) || !Number.isSafeInteger(request.toVersion) || request.fromVersion < 1 || request.toVersion <= request.fromVersion)
        throw new Error("protected book change requires an advancing version");
    const now = approvalTimestamp(request.observedAt, "protected book change observedAt");
    if (!authorization)
        throw new Error("protected book change is blocked without exact explicit owner authorization");
    const observedAt = approvalTimestamp(authorization.observedAt, "protected book change authorization observedAt");
    const expiresAt = approvalTimestamp(authorization.expiresAt, "protected book change authorization expiresAt");
    if (!authorization.id.trim() || !authorization.ownerActionRef.trim() || authorization.ownerId !== request.ownerId || authorization.projectId !== request.projectId || authorization.bookId !== request.bookId || authorization.kind !== request.kind || authorization.fromVersion !== request.fromVersion || authorization.toVersion !== request.toVersion || authorization.priorIdentityRef !== request.priorIdentityRef || authorization.replacementIdentityRef !== request.replacementIdentityRef)
        throw new Error("protected book change authorization must bind the exact owner/project/book/kind/version/target change");
    if (observedAt > now || expiresAt <= now || expiresAt <= observedAt)
        throw new Error("protected book change authorization must be current and unexpired");
}
export function discussionCanChangeApprovedBookState() {
    return false;
}
//# sourceMappingURL=approvals.js.map