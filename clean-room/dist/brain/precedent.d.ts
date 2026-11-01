export interface DecisionContext {
    readonly projectType: string;
    readonly accountScope: string;
    readonly riskClass: string;
    readonly costClass: string;
    readonly actionClass: string;
}
export interface OwnerPrecedent {
    readonly decisionRef: string;
    readonly context: DecisionContext;
    readonly reusableAsDefault: boolean;
    readonly grantsAuthorization: boolean;
}
export interface PrecedentDecision {
    readonly applies: boolean;
    readonly reason: string;
    readonly authorizationInherited: false;
}
export declare function evaluateOwnerPrecedent(precedent: OwnerPrecedent, current: DecisionContext): PrecedentDecision;
