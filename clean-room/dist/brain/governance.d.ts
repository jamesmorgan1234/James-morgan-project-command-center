/** Brain governance: versioning, fact/idea separation and owner authority. */
export declare function promptVersion(version: string): string;
export declare function classifyStatement(statement: {
    readonly kind: "fact" | "idea";
    readonly text: string;
}): "fact" | "idea";
export declare function assertNoSilentArchitectureMutation(change: {
    readonly approved: boolean;
}): void;
export declare function assertNoSilentOwnerDecision(decision: {
    readonly ownerApproved: boolean;
}): void;
export declare function classifyAmbiguity(text: string): "ambiguous" | "clear";
export declare function rulesBeforeRecommendations(steps: readonly string[]): readonly string[];
export declare function ownerOverride(request: {
    readonly owner: boolean;
}): "allowed" | "refused";
