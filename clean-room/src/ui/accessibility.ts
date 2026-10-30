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

export const COMMAND_CENTER_ACCESSIBILITY: AccessibilityInteractionContract = Object.freeze({
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

export type KeyboardCommand = "activate" | "dismiss" | "next" | "previous" | "home" | "end" | "none";

export function keyboardCommand(key: string, shiftKey = false): KeyboardCommand {
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

export interface FocusBoundaryState {
  readonly modalOpen: boolean;
  readonly trapFocus: boolean;
  readonly restoreFocusOnClose: boolean;
  readonly escapeMayDismiss: boolean;
}

export function focusBoundaryState(modalOpen: boolean, destructiveConfirmationPending = false): FocusBoundaryState {
  return Object.freeze({
    modalOpen,
    trapFocus: modalOpen,
    restoreFocusOnClose: modalOpen,
    escapeMayDismiss: modalOpen && !destructiveConfirmationPending
  });
}

export interface StatusAccessibilityState {
  readonly visualState: string;
  readonly textEquivalent: string;
  readonly colorOnly: false;
}

export function statusAccessibilityState(visualState: string, textEquivalent: string): StatusAccessibilityState {
  if (!visualState.trim() || !textEquivalent.trim()) throw new Error("Status indicators require both visual and textual meaning");
  return Object.freeze({ visualState, textEquivalent, colorOnly: false });
}

export function accessibleMotionDuration(preferredReducedMotion: boolean, standardDurationMs: number): number {
  if (!Number.isFinite(standardDurationMs) || standardDurationMs < 0) throw new Error("Motion duration must be a non-negative finite number");
  return preferredReducedMotion ? 0 : standardDurationMs;
}
