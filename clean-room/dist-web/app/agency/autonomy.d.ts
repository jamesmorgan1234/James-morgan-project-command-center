export type AutonomyLevel = "observe" | "propose" | "prepare" | "execute" | "continuous";
export type DecisionRight = "self_decidable" | "defaultable" | "recommend" | "protected" | "prohibited";
export declare function canAct(level: AutonomyLevel, right: DecisionRight, protectedAuthorization: boolean): boolean;
export declare function assertAutonomyCannotExpandScope(parentScopes: readonly string[], requestedScopes: readonly string[]): void;
export interface DecisionRightRule {
    readonly key: string;
    readonly version: number;
    readonly right: DecisionRight;
    readonly ownerDefaultRef?: string;
    readonly protectedActionKey?: string;
    readonly evidenceRefs: readonly string[];
}
export interface DecisionRightAssessment {
    readonly key: string;
    readonly version: number;
    readonly right: DecisionRight;
    readonly allowed: boolean;
    readonly ownerBoundaryRequired: boolean;
    readonly reason: "allowed_by_registry" | "protected_authorization_required" | "prohibited" | "autonomy_level_insufficient";
}
export declare class DecisionRightsRegistry {
    #private;
    register(rule: DecisionRightRule): DecisionRightRule;
    get(key: string): DecisionRightRule | undefined;
    assess(key: string, level: AutonomyLevel, protectedAuthorization: boolean): DecisionRightAssessment;
    list(): readonly DecisionRightRule[];
}
