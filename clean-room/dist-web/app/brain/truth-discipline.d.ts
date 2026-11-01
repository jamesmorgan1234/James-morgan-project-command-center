/**
 * Brain truth discipline.
 *
 * Precedence, contradiction handling, source-availability distinction, grounded
 * memory claims and recommendation cooldowns. These rules sit in front of context
 * assembly and response composition so the Brain can never present an inference as
 * a fact, silently resolve owner-level conflicts, or confuse missing truth with a
 * negative result.
 */
export type ClaimSource = "owner_correction" | "owner_instruction" | "verified_source" | "calculated" | "brain_inference" | "brain_hypothesis" | "model_answer";
export declare const CLAIM_PRECEDENCE: Readonly<Record<ClaimSource, number>>;
export interface PrecedenceClaim {
    readonly id: string;
    readonly source: ClaimSource;
    readonly subjectRef: string;
    readonly valueFingerprint: string;
    readonly assertedAt: string;
}
export interface PrecedenceResolution {
    readonly selectedId: string | null;
    readonly conflictingIds: readonly string[];
    readonly requiresOwnerResolution: boolean;
    readonly reason: "no_claims" | "owner_authority" | "higher_authority_source" | "owner_level_conflict_requires_precedence";
}
export declare function resolveClaimPrecedence(claims: readonly PrecedenceClaim[]): PrecedenceResolution;
export interface ContradictionScanItem {
    readonly id: string;
    readonly subjectRef: string;
    readonly valueFingerprint: string;
}
export interface DetectedContradiction {
    readonly subjectRef: string;
    readonly claimIds: readonly [string, string];
    readonly explanation: string;
}
export declare function explainContradiction(a: ContradictionScanItem, b: ContradictionScanItem): DetectedContradiction;
/** Runs before context assembly so contradictory knowledge cannot be silently compiled in. */
export declare function scanContradictions(items: readonly ContradictionScanItem[]): readonly DetectedContradiction[];
export interface ConflictResolutionProposal {
    readonly proposedWinnerId: string;
    readonly conflictingIds: readonly string[];
    readonly rationale: string;
    readonly requiresOwnerApproval: true;
    readonly applied: false;
}
export declare function proposeConflictResolution(claims: readonly PrecedenceClaim[]): ConflictResolutionProposal;
export declare function assertNoSilentOwnerConflictResolution(resolution: PrecedenceResolution, ownerApproved: boolean): void;
export declare function assertSupportedMemoryClaim(input: {
    supported: boolean;
    sources: readonly string[];
}): void;
export type SourceAvailability = "current_source" | "stale_source" | "negative_result" | "missing_source" | "unavailable_tool";
export declare function classifySourceAvailability(input: {
    sourceExists: boolean;
    toolAvailable: boolean;
    querySucceeded: boolean;
    stale: boolean;
    resultCount: number;
}): SourceAvailability;
export declare function ownerInputRequired(state: SourceAvailability): boolean;
export declare function prefersLiveSource(state: SourceAvailability): boolean;
export interface RecommendationPresentation {
    readonly recommendationKey: string;
    readonly presentedAt: string;
}
export declare function recommendationCooldown(history: readonly RecommendationPresentation[], candidateKey: string, now: string, cooldownMs: number): Readonly<{
    allowed: boolean;
    remainingMs: number;
}>;
