export interface AccessibilityInteractionContract {
    readonly logicalTabOrderRequired: true;
    readonly visibleFocusRequired: true;
    readonly dialogFocusTrapRequired: true;
    readonly dialogFocusRestoreRequired: true;
    readonly safeEscapeDismissalRequired: true;
    readonly statusTextEquivalentRequired: true;
    readonly keyboardMenusRequired: true;
    readonly keyboardTablesRequired: true;
    readonly colorOnlyCriticalMeaningForbidden: true;
    readonly reducedMotionRespected: true;
    readonly destructiveConfirmationPreservedByKeyboard: true;
}
export declare const COMMAND_CENTER_ACCESSIBILITY: AccessibilityInteractionContract;
export type KeyboardCommand = "activate" | "dismiss" | "next" | "previous" | "home" | "end" | "none";
export declare function keyboardCommand(key: string, shiftKey?: boolean): KeyboardCommand;
export interface FocusBoundaryState {
    readonly modalOpen: boolean;
    readonly trapFocus: boolean;
    readonly restoreFocusOnClose: boolean;
    readonly escapeMayDismiss: boolean;
}
export declare function focusBoundaryState(modalOpen: boolean, destructiveConfirmationPending?: boolean): FocusBoundaryState;
export interface StatusAccessibilityState {
    readonly visualState: string;
    readonly textEquivalent: string;
    readonly colorOnly: false;
}
export declare function statusAccessibilityState(visualState: string, textEquivalent: string): StatusAccessibilityState;
export declare function accessibleMotionDuration(preferredReducedMotion: boolean, standardDurationMs: number): number;
