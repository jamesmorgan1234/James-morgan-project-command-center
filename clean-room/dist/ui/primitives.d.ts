export type PrimitiveKind = "card" | "row" | "status_pill" | "progress" | "expansion" | "dialog" | "button" | "loader" | "empty_state" | "zero_state" | "error_state" | "tooltip" | "health_badge" | "freshness_badge" | "confidence_indicator" | "source_trust_label" | "stale_data_banner" | "provider_state_panel" | "missing_source_panel" | "conflict_panel" | "approval_card" | "obligation_card" | "audit_row" | "reversible_action" | "destructive_confirm_dialog" | "offline_state";
export type PrimitiveInteraction = "none" | "navigate" | "activate" | "toggle" | "dismiss" | "inform" | "confirm" | "reverse";
export interface PrimitiveContract {
    readonly kind: PrimitiveKind;
    readonly interaction: PrimitiveInteraction;
    readonly semanticElement: "article" | "a" | "button" | "div" | "dialog" | "progress" | "span";
    readonly minimumTargetPx: number;
    readonly requiresAccessibleName: boolean;
    readonly usesMachineryVisualLanguage: boolean;
    readonly permitsDecorativeChevron: false;
    readonly privateTruthPolicy: "canonical_or_safe_fixed_copy";
    readonly notes: readonly string[];
}
export interface SemanticComponentState {
    readonly state: string;
    readonly label: string;
    readonly observedAt?: string;
    readonly sourceRef?: string;
    readonly remediationRoute?: string;
    readonly auditRef?: string;
    readonly recoveryRef?: string;
}
export declare const COMMAND_CENTER_PRIMITIVES: Readonly<Record<PrimitiveKind, PrimitiveContract>>;
export declare function semanticComponentState(input: SemanticComponentState): SemanticComponentState;
export interface InteractivePrimitiveInstance {
    readonly kind: PrimitiveKind;
    readonly width: number;
    readonly height: number;
    readonly accessibleName?: string;
    readonly colorOnlyState?: boolean;
    readonly decorativeChevron?: boolean;
}
export declare function assertPrimitiveAccessibility(instance: InteractivePrimitiveInstance): void;
export interface ExpansionState {
    readonly expanded: boolean;
    readonly ariaExpanded: "true" | "false";
}
export declare function expansionState(expanded: boolean): ExpansionState;
export interface DialogInteractionState {
    readonly open: boolean;
    readonly focusContained: boolean;
    readonly returnFocusRequired: boolean;
    readonly escapeDismisses: boolean;
}
export declare function dialogInteractionState(open: boolean): DialogInteractionState;
export interface DestructiveConfirmationState {
    readonly actionRef: string;
    readonly confirmationRequired: true;
    readonly confirmed: boolean;
    readonly executable: boolean;
}
export declare function destructiveConfirmationState(actionRef: string, confirmed: boolean): DestructiveConfirmationState;
export declare function assertTooltipSupplemental(essentialInformationOnlyInTooltip: boolean): void;
export declare function sharedPrimitiveClass(kind: PrimitiveKind): string;
