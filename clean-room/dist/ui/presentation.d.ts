/**
 * Owner-facing interaction and presentation discipline.
 *
 * These contracts close the "presentation never outruns capability" rules: motion
 * cannot block or mislead, overlays cannot intercept taps, ephemeral feedback can
 * never replace durable blockers, formatting is canonical, and ordinary screens
 * cannot leak internal identifiers, raw payloads or debug tooling.
 */
export declare const MAX_TRANSITION_DURATION_MS: 180;
export interface MotionRequest {
    readonly name: string;
    readonly durationMs: number;
    readonly decorative: boolean;
    readonly harmsUsability?: boolean;
}
export interface MotionDisposition {
    readonly name: string;
    readonly durationMs: number;
    readonly decorative: boolean;
    readonly blocksInteraction: false;
    readonly cancelsOnNavigation: true;
    readonly cancelsOnUnmount: true;
    readonly transitionBudgetMs: number;
}
export declare function assertTransitionBudget(durationMs: number): number;
export declare function decorativeMotionAllowed(request: Pick<MotionRequest, "decorative" | "harmsUsability">): boolean;
export declare function motionDisposition(request: MotionRequest, preferredReducedMotion?: boolean): MotionDisposition;
export interface MotionCancellationState {
    readonly name: string;
    readonly cancelled: boolean;
    readonly reason: "none" | "navigation" | "unmount" | "reduced_motion";
}
export declare function cancelMotion(name: string, reason: Exclude<MotionCancellationState["reason"], "none">): MotionCancellationState;
export declare function animationCancellationPolicy(preferredReducedMotion: boolean): Readonly<{
    cancelOnNavigation: true;
    cancelOnUnmount: true;
    cancelOnReducedMotion: boolean;
    leavesInteractionUnblocked: true;
}>;
export declare const OVERLAY_Z_INDEX: Readonly<{
    content: 0;
    stickyHeader: 20;
    navigation: 40;
    toast: 60;
    tooltip: 80;
    dialog: 100;
    destructiveDialog: 120;
}>;
export interface DecorativeLayerStyle {
    readonly pointerEvents: "none";
    readonly touchAction: "auto";
    readonly ariaHidden: true;
    readonly interceptsTaps: false;
    readonly blocksScroll: false;
}
export declare function decorativeLayerStyle(): DecorativeLayerStyle;
export declare function assertNoTapInterception(layer: {
    interceptsTaps: boolean;
    blocksScroll?: boolean;
}): void;
export declare function overlayZIndex(kind: keyof typeof OVERLAY_Z_INDEX): number;
export declare function assertOverlayOrder(under: keyof typeof OVERLAY_Z_INDEX, over: keyof typeof OVERLAY_Z_INDEX): void;
export declare function assertNoModalStack(openModalDepths: readonly number[]): void;
export type FeedbackSeverity = "info" | "warning" | "failure" | "blocker";
export interface OwnerFeedback {
    readonly key: string;
    readonly message: string;
    readonly severity: FeedbackSeverity;
    readonly durable: boolean;
    readonly occurrences: number;
    readonly firstObservedAt: string;
}
export interface PublishFeedback {
    readonly key: string;
    readonly message: string;
    readonly severity: FeedbackSeverity;
    readonly observedAt: string;
}
export declare function isDurableFeedback(severity: FeedbackSeverity): boolean;
/** The single owner-visible ephemeral feedback channel. */
export declare class OwnerFeedbackCenter {
    #private;
    constructor(maxVisible?: number);
    publish(input: PublishFeedback): OwnerFeedback;
    dismiss(key: string, resolved?: boolean): void;
    list(): readonly OwnerFeedback[];
}
export declare function stableWarningKey(scope: string, code: string): string;
export interface TruncatedText {
    readonly text: string;
    readonly truncated: boolean;
    readonly fullText: string;
    readonly expandable: boolean;
}
export declare function truncateText(value: string, maxChars: number): TruncatedText;
export declare function assertCriticalNotTruncatedOnly(input: {
    critical: boolean;
    truncated: boolean;
    expandable: boolean;
}): void;
export declare const OWNER_CURRENCY = "GBP";
export declare function formatNumber(value: number): string;
export declare function formatCurrency(value: number, currency?: string): string;
export declare function formatPercent(ratio: number, fractionDigits?: number): string;
export declare function formatDate(isoTimestamp: string): string;
export declare function formatDateTime(isoTimestamp: string): string;
export declare const CANONICAL_STATUS_LABELS: Readonly<{
    readonly in_progress: "In progress";
    readonly blocked: "Blocked";
    readonly awaiting_owner: "Awaiting owner";
    readonly needs_attention: "Needs attention";
    readonly unavailable: "Unavailable";
    readonly not_applicable: "Not applicable";
}>;
export declare function statusLabel(status: string): string;
export declare const CANONICAL_TERMS: Readonly<{
    readonly project: readonly ["project", "projects"];
    readonly obligation: readonly ["obligation", "obligations"];
    readonly blocker: readonly ["blocker", "blockers"];
    readonly capability: readonly ["capability", "capabilities"];
}>;
export declare function canonicalTerm(term: string): string;
export declare function ownerFacingText(value: string): string;
export declare function assertNoInternalDetail(value: string): void;
export declare function assertNoTechnicalPlumbing(value: string): void;
export interface DiagnosticsDisclosure {
    readonly visible: boolean;
    readonly ownerOnly: true;
    readonly separatedFromOrdinaryScreens: true;
}
export declare function diagnosticsDisclosure(input: {
    authenticatedOwner: boolean;
    separatedFromOrdinaryScreens: boolean;
}): DiagnosticsDisclosure;
export declare function assertDebugControlsAbsent(production: boolean, debugControls: readonly string[]): void;
export type SectionRenderState = "rendered" | "unavailable";
export interface SectionPresentation {
    readonly section: string;
    readonly state: SectionRenderState;
    readonly sourceRef: string | null;
    readonly label: string;
    readonly fabricated: false;
}
export declare function sectionPresentation(input: {
    section: string;
    capabilityVerified: boolean;
    sourceRef?: string;
}): SectionPresentation;
export declare function assertPresentationWithinCapability(input: {
    capabilityVerified: boolean;
    presentedAsAvailable: boolean;
}): void;
