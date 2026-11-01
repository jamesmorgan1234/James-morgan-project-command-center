/**
 * Brain truth discipline.
 *
 * Precedence, contradiction handling, source-availability distinction, grounded
 * memory claims and recommendation cooldowns. These rules sit in front of context
 * assembly and response composition so the Brain can never present an inference as
 * a fact, silently resolve owner-level conflicts, or confuse missing truth with a
 * negative result.
 */
export const CLAIM_PRECEDENCE = Object.freeze({
    owner_correction: 0,
    owner_instruction: 1,
    verified_source: 2,
    calculated: 3,
    brain_inference: 4,
    brain_hypothesis: 5,
    model_answer: 6
});
function rank(source) {
    const value = CLAIM_PRECEDENCE[source];
    if (value === undefined)
        throw new Error(`Unknown claim source ${source}`);
    return value;
}
export function resolveClaimPrecedence(claims) {
    if (claims.length === 0) {
        return Object.freeze({ selectedId: null, conflictingIds: Object.freeze([]), requiresOwnerResolution: false, reason: "no_claims" });
    }
    for (const claim of claims) {
        if (!claim.id.trim() || !claim.subjectRef.trim() || !claim.valueFingerprint.trim())
            throw new Error("Claims require identity, subject and value fingerprint");
        if (!Number.isFinite(Date.parse(claim.assertedAt)))
            throw new Error("Claims require a valid assertion timestamp");
    }
    const ranked = [...claims].sort((a, b) => rank(a.source) - rank(b.source) || Date.parse(b.assertedAt) - Date.parse(a.assertedAt) || a.id.localeCompare(b.id));
    const top = ranked[0];
    if (!top)
        throw new Error("Claim resolution invariant failed");
    const conflicting = ranked.filter((claim) => claim.id !== top.id && claim.valueFingerprint !== top.valueFingerprint);
    const runnerUp = conflicting[0];
    const ownerLevelTie = runnerUp !== undefined
        && rank(runnerUp.source) === rank(top.source)
        && rank(top.source) <= 1
        && Date.parse(runnerUp.assertedAt) === Date.parse(top.assertedAt);
    return Object.freeze({
        selectedId: top.id,
        conflictingIds: Object.freeze(conflicting.map((claim) => claim.id)),
        requiresOwnerResolution: ownerLevelTie,
        reason: ownerLevelTie ? "owner_level_conflict_requires_precedence" : rank(top.source) <= 1 ? "owner_authority" : "higher_authority_source"
    });
}
export function explainContradiction(a, b) {
    if (!a.id.trim() || !b.id.trim() || !a.subjectRef.trim() || !b.subjectRef.trim())
        throw new Error("Contradiction explanation requires claim identity and subject");
    if (a.subjectRef !== b.subjectRef)
        throw new Error("Contradiction explanation requires the same subject");
    if (a.valueFingerprint === b.valueFingerprint)
        throw new Error("Agreeing claims are not a contradiction");
    return Object.freeze({
        subjectRef: a.subjectRef,
        claimIds: Object.freeze([a.id, b.id]),
        explanation: `Claims ${a.id} and ${b.id} disagree about ${a.subjectRef}`
    });
}
/** Runs before context assembly so contradictory knowledge cannot be silently compiled in. */
export function scanContradictions(items) {
    const bySubject = new Map();
    for (const item of items) {
        if (!item.id.trim() || !item.subjectRef.trim() || !item.valueFingerprint.trim())
            throw new Error("Contradiction scan requires claim identity, subject and value fingerprint");
        bySubject.set(item.subjectRef, [...(bySubject.get(item.subjectRef) ?? []), item]);
    }
    const found = [];
    for (const [subjectRef, claims] of bySubject) {
        for (let index = 0; index < claims.length; index += 1) {
            for (let other = index + 1; other < claims.length; other += 1) {
                const a = claims[index];
                const b = claims[other];
                if (a && b && a.valueFingerprint !== b.valueFingerprint)
                    found.push(explainContradiction(a, b));
            }
        }
    }
    return Object.freeze(found);
}
export function proposeConflictResolution(claims) {
    const resolution = resolveClaimPrecedence(claims);
    if (!resolution.selectedId)
        throw new Error("Conflict resolution requires at least one claim");
    return Object.freeze({
        proposedWinnerId: resolution.selectedId,
        conflictingIds: resolution.conflictingIds,
        rationale: resolution.reason,
        requiresOwnerApproval: true,
        applied: false
    });
}
export function assertNoSilentOwnerConflictResolution(resolution, ownerApproved) {
    if (resolution.requiresOwnerResolution && !ownerApproved)
        throw new Error("Owner-level conflicts cannot be resolved silently without precedence rules");
}
export function assertSupportedMemoryClaim(input) {
    if (!input.supported || input.sources.length === 0 || input.sources.some((source) => !source.trim())) {
        throw new Error("Brain cannot claim it remembers unsupported data");
    }
}
export function classifySourceAvailability(input) {
    if (!Number.isSafeInteger(input.resultCount) || input.resultCount < 0)
        throw new Error("Source availability requires a non-negative result count");
    if (!input.toolAvailable || !input.querySucceeded)
        return "unavailable_tool";
    if (!input.sourceExists)
        return "missing_source";
    if (input.stale)
        return "stale_source";
    if (input.resultCount === 0)
        return "negative_result";
    return "current_source";
}
export function ownerInputRequired(state) {
    return state === "missing_source";
}
export function prefersLiveSource(state) {
    return state === "current_source" || state === "negative_result";
}
export function recommendationCooldown(history, candidateKey, now, cooldownMs) {
    if (!candidateKey.trim())
        throw new Error("Recommendation cooldown requires a key");
    if (!Number.isFinite(cooldownMs) || cooldownMs < 0)
        throw new Error("Recommendation cooldown must be a non-negative duration");
    const current = Date.parse(now);
    if (!Number.isFinite(current))
        throw new Error("Recommendation cooldown requires a valid time");
    const last = history
        .filter((entry) => entry.recommendationKey === candidateKey)
        .map((entry) => Date.parse(entry.presentedAt))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0];
    if (last === undefined)
        return Object.freeze({ allowed: true, remainingMs: 0 });
    const remaining = cooldownMs - (current - last);
    return Object.freeze({ allowed: remaining <= 0, remainingMs: Math.max(0, remaining) });
}
//# sourceMappingURL=truth-discipline.js.map