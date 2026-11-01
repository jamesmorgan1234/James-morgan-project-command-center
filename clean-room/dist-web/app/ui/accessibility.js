export const COMMAND_CENTER_ACCESSIBILITY = Object.freeze({
    logicalTabOrderRequired: true,
    visibleFocusRequired: true,
    dialogFocusTrapRequired: true,
    dialogFocusRestoreRequired: true,
    safeEscapeDismissalRequired: true,
    statusTextEquivalentRequired: true,
    keyboardMenusRequired: true,
    keyboardTablesRequired: true,
    colorOnlyCriticalMeaningForbidden: true,
    reducedMotionRespected: true,
    destructiveConfirmationPreservedByKeyboard: true
});
export function keyboardCommand(key, shiftKey = false) {
    switch (key) {
        case "Enter":
        case " ": return "activate";
        case "Escape": return "dismiss";
        case "Tab": return shiftKey ? "previous" : "next";
        case "Home": return "home";
        case "End": return "end";
        default: return "none";
    }
}
export function focusBoundaryState(modalOpen, destructiveConfirmationPending = false) {
    return Object.freeze({
        modalOpen,
        trapFocus: modalOpen,
        restoreFocusOnClose: modalOpen,
        escapeMayDismiss: modalOpen && !destructiveConfirmationPending
    });
}
export function statusAccessibilityState(visualState, textEquivalent) {
    if (!visualState.trim() || !textEquivalent.trim())
        throw new Error("Status indicators require both visual and textual meaning");
    return Object.freeze({ visualState, textEquivalent, colorOnly: false });
}
export function accessibleMotionDuration(preferredReducedMotion, standardDurationMs) {
    if (!Number.isFinite(standardDurationMs) || standardDurationMs < 0)
        throw new Error("Motion duration must be a non-negative finite number");
    return preferredReducedMotion ? 0 : standardDurationMs;
}
//# sourceMappingURL=accessibility.js.map