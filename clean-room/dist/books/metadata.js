export function validateMetadata(metadata) {
    if (!metadata.bookId.trim() || metadata.version < 1 || !metadata.description.trim() || !metadata.trimRef.trim() || !metadata.packageManifestHash.trim() || metadata.sourceRefs.length === 0)
        throw new Error("metadata package is incomplete");
    return Object.freeze({ ...metadata, keywords: Object.freeze([...metadata.keywords]), categories: Object.freeze([...metadata.categories]), sourceRefs: Object.freeze([...metadata.sourceRefs]) });
}
export function validateRollout(steps) {
    const orders = steps.map((step) => step.order);
    if (new Set(orders).size !== orders.length || orders.some((order) => !Number.isInteger(order) || order < 1))
        throw new Error("rollout order must be unique positive integers");
    return Object.freeze([...steps].sort((a, b) => a.order - b.order));
}
function metadataTimestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function metadataRefs(values, label, requireOne = true) {
    if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank values`);
    const normalized = values.map((value) => value.trim());
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
    return Object.freeze(normalized);
}
export function validateEvidenceBackedBookMetadata(metadata) {
    if (!metadata.id.trim() || !metadata.ownerId.trim() || !metadata.projectId.trim() || !metadata.bookId.trim() || !metadata.description.trim() || !metadata.trimRef.trim() || !metadata.packageManifestHash.trim() || !metadata.packageManifestRef.trim())
        throw new Error("book metadata/package identity and required fields are incomplete");
    if (!Number.isSafeInteger(metadata.version) || metadata.version < 1)
        throw new Error("book metadata version must be positive");
    metadataTimestamp(metadata.observedAt, "book metadata observedAt");
    const keywords = metadataRefs(metadata.keywords, "book metadata keywords", false);
    const categories = metadataRefs(metadata.categories, "book metadata categories", false);
    const formats = metadataRefs(metadata.formats, "book metadata formats");
    const sourceRefs = metadataRefs(metadata.sourceRefs, "book metadata source refs");
    return Object.freeze({ ...metadata, keywords, categories, formats, sourceRefs });
}
export function validatePricingRecommendation(recommendation) {
    if (!recommendation.id.trim() || !recommendation.ownerId.trim() || !recommendation.projectId.trim() || !recommendation.bookId.trim() || !recommendation.currency.trim())
        throw new Error("book pricing recommendation identity/scope/currency are required");
    if (!Number.isFinite(recommendation.amount) || recommendation.amount < 0)
        throw new Error("book pricing recommendation amount must be nonnegative");
    metadataTimestamp(recommendation.observedAt, "book pricing observedAt");
    const rationaleRefs = metadataRefs(recommendation.rationaleRefs, "book pricing rationale refs");
    const sourceRefs = metadataRefs(recommendation.sourceRefs, "book pricing source refs");
    return Object.freeze({ ...recommendation, rationaleRefs, sourceRefs });
}
export function validateLockedBookRollout(plan) {
    if (!plan.id.trim() || !plan.ownerId.trim() || !plan.projectId.trim() || !plan.ownerLockedOrderRef.trim())
        throw new Error("book rollout plan identity/scope/owner lock are required");
    if (!Number.isSafeInteger(plan.version) || plan.version < 1)
        throw new Error("book rollout version must be positive");
    metadataTimestamp(plan.observedAt, "book rollout observedAt");
    const sourceRefs = metadataRefs(plan.sourceRefs, "book rollout source refs");
    if (plan.steps.length === 0)
        throw new Error("book rollout plan requires at least one step");
    const ids = new Set();
    const orders = new Set();
    const steps = [...plan.steps].sort((left, right) => left.order - right.order).map((step, index) => {
        if (!step.id.trim() || !step.bookId.trim())
            throw new Error("book rollout step identity/book are required");
        if (!Number.isSafeInteger(step.order) || step.order < 1 || !Number.isSafeInteger(step.phase) || step.phase < 1)
            throw new Error("book rollout step order/phase must be positive integers");
        if (ids.has(step.id) || orders.has(step.order))
            throw new Error("book rollout step ids and orders must be unique");
        if (step.order !== index + 1)
            throw new Error("book rollout order must be contiguous and owner-locked");
        if (step.kdpSelect && step.format !== "kindle" && step.format !== "collection_kindle")
            throw new Error("KDP Select can only apply to Kindle rollout steps");
        ids.add(step.id);
        orders.add(step.order);
        return Object.freeze({ ...step });
    });
    return Object.freeze({ ...plan, steps: Object.freeze(steps), sourceRefs });
}
export function assertRolloutMatchesOwnerLockedOrder(candidate, locked) {
    const validCandidate = validateLockedBookRollout(candidate);
    const validLocked = validateLockedBookRollout(locked);
    if (validCandidate.ownerId !== validLocked.ownerId || validCandidate.projectId !== validLocked.projectId || validCandidate.ownerLockedOrderRef !== validLocked.ownerLockedOrderRef)
        throw new Error("rollout candidate does not bind the exact owner-locked plan");
    const canonical = (plan) => plan.steps.map((step) => `${step.order}:${step.phase}:${step.bookId}:${step.format}:${step.kdpSelect ? "select" : "plain"}`).join("|");
    if (canonical(validCandidate) !== canonical(validLocked))
        throw new Error("rollout candidate violates owner-locked order");
}
export function assessBookPackageReadiness(metadata, rollout, pricing) {
    const validMetadata = validateEvidenceBackedBookMetadata(metadata);
    const validRollout = validateLockedBookRollout(rollout);
    if (validMetadata.ownerId !== validRollout.ownerId || validMetadata.projectId !== validRollout.projectId)
        throw new Error("book metadata and rollout cannot cross owner/project boundary");
    const blockers = [];
    const relevantSteps = validRollout.steps.filter((step) => step.bookId === validMetadata.bookId);
    if (relevantSteps.length === 0)
        blockers.push("book_missing_from_rollout");
    for (const step of relevantSteps)
        if (!validMetadata.formats.includes(step.format))
            blockers.push(`metadata_missing_format:${step.format}`);
    const validPricing = pricing.map(validatePricingRecommendation).filter((item) => item.ownerId === validMetadata.ownerId && item.projectId === validMetadata.projectId && item.bookId === validMetadata.bookId);
    for (const step of relevantSteps)
        if (!validPricing.some((item) => item.format === step.format))
            blockers.push(`pricing_missing:${step.format}`);
    return Object.freeze({ ownerId: validMetadata.ownerId, projectId: validMetadata.projectId, bookId: validMetadata.bookId, metadataVersion: validMetadata.version, packageManifestHash: validMetadata.packageManifestHash, rolloutPlanId: validRollout.id, ready: blockers.length === 0, blockers: Object.freeze(blockers) });
}
//# sourceMappingURL=metadata.js.map