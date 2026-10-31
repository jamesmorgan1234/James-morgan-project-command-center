import { COMMAND_CENTER_EFFECTS } from "./design-tokens.js";

/**
 * Owner-facing interaction and presentation discipline.
 *
 * These contracts close the "presentation never outruns capability" rules: motion
 * cannot block or mislead, overlays cannot intercept taps, ephemeral feedback can
 * never replace durable blockers, formatting is canonical, and ordinary screens
 * cannot leak internal identifiers, raw payloads or debug tooling.
 */

// ---------------------------------------------------------------- motion

export const MAX_TRANSITION_DURATION_MS = COMMAND_CENTER_EFFECTS.standardMotionDurationMs;

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

export function assertTransitionBudget(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) throw new Error("Transition duration must be a non-negative finite number");
  if (durationMs > MAX_TRANSITION_DURATION_MS) throw new Error(`Transition duration ${durationMs}ms exceeds the ${MAX_TRANSITION_DURATION_MS}ms budget`);
  return durationMs;
}

export function decorativeMotionAllowed(request: Pick<MotionRequest, "decorative" | "harmsUsability">): boolean {
  return !(request.decorative && request.harmsUsability === true);
}

export function motionDisposition(request: MotionRequest, preferredReducedMotion = false): MotionDisposition {
  if (!request.name.trim()) throw new Error("Motion request requires a name");
  const budgeted = assertTransitionBudget(request.durationMs);
  if (!decorativeMotionAllowed(request)) throw new Error(`Decorative motion ${request.name} harms usability and is not permitted`);
  return Object.freeze({
    name: request.name,
    durationMs: preferredReducedMotion ? COMMAND_CENTER_EFFECTS.reducedMotionDurationMs : budgeted,
    decorative: request.decorative,
    blocksInteraction: false as const,
    cancelsOnNavigation: true as const,
    cancelsOnUnmount: true as const,
    transitionBudgetMs: MAX_TRANSITION_DURATION_MS
  });
}

export interface MotionCancellationState {
  readonly name: string;
  readonly cancelled: boolean;
  readonly reason: "none" | "navigation" | "unmount" | "reduced_motion";
}

export function cancelMotion(name: string, reason: Exclude<MotionCancellationState["reason"], "none">): MotionCancellationState {
  if (!name.trim()) throw new Error("Motion cancellation requires a name");
  return Object.freeze({ name, cancelled: true, reason });
}

export function animationCancellationPolicy(preferredReducedMotion: boolean): Readonly<{
  cancelOnNavigation: true;
  cancelOnUnmount: true;
  cancelOnReducedMotion: boolean;
  leavesInteractionUnblocked: true;
}> {
  return Object.freeze({
    cancelOnNavigation: true as const,
    cancelOnUnmount: true as const,
    cancelOnReducedMotion: preferredReducedMotion,
    leavesInteractionUnblocked: true as const
  });
}

// ---------------------------------------------------------------- layering

export const OVERLAY_Z_INDEX = Object.freeze({
  content: 0,
  stickyHeader: 20,
  navigation: 40,
  toast: 60,
  tooltip: 80,
  dialog: 100,
  destructiveDialog: 120
});

export interface DecorativeLayerStyle {
  readonly pointerEvents: "none";
  readonly touchAction: "auto";
  readonly ariaHidden: true;
  readonly interceptsTaps: false;
  readonly blocksScroll: false;
}

export function decorativeLayerStyle(): DecorativeLayerStyle {
  return Object.freeze({
    pointerEvents: "none" as const,
    touchAction: "auto" as const,
    ariaHidden: true as const,
    interceptsTaps: false as const,
    blocksScroll: false as const
  });
}

export function assertNoTapInterception(layer: { interceptsTaps: boolean; blocksScroll?: boolean }): void {
  if (layer.interceptsTaps) throw new Error("Invisible overlay cannot intercept taps");
  if (layer.blocksScroll) throw new Error("Decorative layer cannot hijack touch scrolling");
}

export function overlayZIndex(kind: keyof typeof OVERLAY_Z_INDEX): number {
  return OVERLAY_Z_INDEX[kind];
}

export function assertOverlayOrder(under: keyof typeof OVERLAY_Z_INDEX, over: keyof typeof OVERLAY_Z_INDEX): void {
  if (OVERLAY_Z_INDEX[under] >= OVERLAY_Z_INDEX[over]) throw new Error(`Overlay order requires ${under} below ${over}`);
}

export function assertNoModalStack(openModalDepths: readonly number[]): void {
  if (openModalDepths.filter((depth) => depth > 0).length > 1) throw new Error("Modal stacking is prohibited unless explicitly designed");
}

// ---------------------------------------------------------------- feedback

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

const DURABLE_SEVERITIES: readonly FeedbackSeverity[] = ["failure", "blocker"];

export function isDurableFeedback(severity: FeedbackSeverity): boolean {
  return DURABLE_SEVERITIES.includes(severity);
}

/** The single owner-visible ephemeral feedback channel. */
export class OwnerFeedbackCenter {
  readonly #active = new Map<string, OwnerFeedback>();
  readonly #maxVisible: number;

  constructor(maxVisible = 3) {
    if (!Number.isSafeInteger(maxVisible) || maxVisible <= 0) throw new Error("Feedback center requires a positive visible limit");
    this.#maxVisible = maxVisible;
  }

  publish(input: PublishFeedback): OwnerFeedback {
    if (!input.key.trim() || !input.message.trim()) throw new Error("Feedback requires a stable key and message");
    if (!Number.isFinite(Date.parse(input.observedAt))) throw new Error("Feedback requires a valid observation timestamp");
    const existing = this.#active.get(input.key);
    if (existing) {
      const deduped = Object.freeze({ ...existing, occurrences: existing.occurrences + 1 });
      this.#active.set(input.key, deduped);
      return deduped;
    }
    const durable = isDurableFeedback(input.severity);
    if (!durable) {
      const ephemeral = [...this.#active.values()].filter((entry) => !entry.durable);
      const oldest = ephemeral[0];
      if (ephemeral.length >= this.#maxVisible && oldest) this.#active.delete(oldest.key);
    }
    const record = Object.freeze({
      key: input.key,
      message: input.message,
      severity: input.severity,
      durable,
      occurrences: 1,
      firstObservedAt: input.observedAt
    });
    this.#active.set(input.key, record);
    return record;
  }

  dismiss(key: string, resolved = false): void {
    const record = this.#active.get(key);
    if (!record) return;
    if (record.severity === "blocker" && !resolved) throw new Error("Owner-required blockers never disappear because a toast expired");
    this.#active.delete(key);
  }

  list(): readonly OwnerFeedback[] {
    return Object.freeze([...this.#active.values()]);
  }
}

export function stableWarningKey(scope: string, code: string): string {
  if (!scope.trim() || !code.trim()) throw new Error("Warning keys require scope and code");
  return `${scope.trim()}::${code.trim()}`;
}

// ---------------------------------------------------------------- text

export interface TruncatedText {
  readonly text: string;
  readonly truncated: boolean;
  readonly fullText: string;
  readonly expandable: boolean;
}

export function truncateText(value: string, maxChars: number): TruncatedText {
  if (!Number.isSafeInteger(maxChars) || maxChars < 1) throw new Error("Truncation limit must be a positive integer");
  if (value.length <= maxChars) return Object.freeze({ text: value, truncated: false, fullText: value, expandable: false });
  return Object.freeze({ text: `${value.slice(0, maxChars - 1)}…`, truncated: true, fullText: value, expandable: true });
}

export function assertCriticalNotTruncatedOnly(input: { critical: boolean; truncated: boolean; expandable: boolean }): void {
  if (input.critical && input.truncated && !input.expandable) throw new Error("Critical information cannot be hidden only by truncation");
}

// ---------------------------------------------------------------- formatting

export const OWNER_CURRENCY = "GBP";

function grouped(value: number, fractionDigits: number): string {
  if (!Number.isFinite(value)) throw new Error("Formatting requires a finite number");
  return new Intl.NumberFormat("en-GB", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits, useGrouping: true }).format(value);
}

export function formatNumber(value: number): string {
  return grouped(value, Number.isInteger(value) ? 0 : 2);
}

export function formatCurrency(value: number, currency = OWNER_CURRENCY): string {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must be an ISO 4217 code");
  return `${currency} ${grouped(value, 2)}`;
}

export function formatPercent(ratio: number, fractionDigits = 1): string {
  if (!Number.isFinite(ratio)) throw new Error("Percent formatting requires a finite ratio");
  if (!Number.isSafeInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 3) throw new Error("Percent fraction digits must be 0..3");
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}

export function formatDate(isoTimestamp: string): string {
  const parsed = Date.parse(isoTimestamp);
  if (!Number.isFinite(parsed)) throw new Error("Date formatting requires a valid timestamp");
  return new Date(parsed).toISOString().slice(0, 10);
}

export function formatDateTime(isoTimestamp: string): string {
  const parsed = Date.parse(isoTimestamp);
  if (!Number.isFinite(parsed)) throw new Error("Date/time formatting requires a valid timestamp");
  return `${new Date(parsed).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export const CANONICAL_STATUS_LABELS = Object.freeze({
  in_progress: "In progress",
  blocked: "Blocked",
  awaiting_owner: "Awaiting owner",
  needs_attention: "Needs attention",
  unavailable: "Unavailable",
  not_applicable: "Not applicable"
} as const);

export function statusLabel(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const known = CANONICAL_STATUS_LABELS[normalized as keyof typeof CANONICAL_STATUS_LABELS];
  if (known) return known;
  if (!normalized) throw new Error("Status label requires a status");
  const [first = "", ...rest] = normalized.split("_").filter(Boolean);
  return `${first.slice(0, 1).toUpperCase()}${first.slice(1)}${rest.map((word) => ` ${word}`).join("")}`;
}

export const CANONICAL_TERMS = Object.freeze({
  project: ["project", "projects"],
  obligation: ["obligation", "obligations"],
  blocker: ["blocker", "blockers"],
  capability: ["capability", "capabilities"]
} as const);

const TERM_ALIASES: Readonly<Record<string, string>> = Object.freeze({
  initiative: "project",
  initiatives: "project",
  todo: "obligation",
  todos: "obligations",
  issue: "blocker",
  issues: "blockers",
  feature: "capability",
  features: "capabilities"
});

export function canonicalTerm(term: string): string {
  const normalized = term.trim().toLowerCase();
  if (!normalized) throw new Error("Terminology requires a term");
  return TERM_ALIASES[normalized] ?? normalized;
}

const INTERNAL_ID = /\b(?:ccr-\d{5}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi;
const INTERNAL_ID_PROBE = /\b(?:ccr-\d{5}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const RAW_JSON = /(?:^|[\s:])(?:\{[\s\S]*\}|\[[\s\S]*\])(?:$|\s)/;

export function ownerFacingText(value: string): string {
  const withoutJson = RAW_JSON.test(value) ? "Details are available in diagnostics." : value;
  return withoutJson
    .replace(INTERNAL_ID, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function assertNoInternalDetail(value: string): void {
  if (INTERNAL_ID_PROBE.test(value)) throw new Error("Internal identifiers are not shown by default");
  if (RAW_JSON.test(value)) throw new Error("Raw JSON is not shown by default");
}

const TECHNICAL_PLUMBING = /\b(?:supabase|postgres|pgbouncer|redis|jwt|bearer|env\.|process\.env|stack trace|traceback)\b/i;

export function assertNoTechnicalPlumbing(value: string): void {
  if (TECHNICAL_PLUMBING.test(value)) throw new Error("Private technical plumbing is not shown in ordinary owner screens");
}

// ---------------------------------------------------------------- disclosure

export interface DiagnosticsDisclosure {
  readonly visible: boolean;
  readonly ownerOnly: true;
  readonly separatedFromOrdinaryScreens: true;
}

export function diagnosticsDisclosure(input: { authenticatedOwner: boolean; separatedFromOrdinaryScreens: boolean }): DiagnosticsDisclosure {
  return Object.freeze({
    visible: input.authenticatedOwner && input.separatedFromOrdinaryScreens,
    ownerOnly: true as const,
    separatedFromOrdinaryScreens: true as const
  });
}

export function assertDebugControlsAbsent(production: boolean, debugControls: readonly string[]): void {
  if (production && debugControls.length > 0) throw new Error("Debug controls are prohibited in production presentation");
}

// ---------------------------------------------------------------- capability

export type SectionRenderState = "rendered" | "unavailable";

export interface SectionPresentation {
  readonly section: string;
  readonly state: SectionRenderState;
  readonly sourceRef: string | null;
  readonly label: string;
  readonly fabricated: false;
}

export function sectionPresentation(input: { section: string; capabilityVerified: boolean; sourceRef?: string }): SectionPresentation {
  if (!input.section.trim()) throw new Error("Section presentation requires a section name");
  if (!input.capabilityVerified) {
    return Object.freeze({ section: input.section, state: "unavailable" as const, sourceRef: null, label: "Unavailable", fabricated: false as const });
  }
  if (!input.sourceRef?.trim()) throw new Error(`Verified section ${input.section} requires a canonical source reference`);
  return Object.freeze({ section: input.section, state: "rendered" as const, sourceRef: input.sourceRef, label: "Available", fabricated: false as const });
}

export function assertPresentationWithinCapability(input: { capabilityVerified: boolean; presentedAsAvailable: boolean }): void {
  if (input.presentedAsAvailable && !input.capabilityVerified) throw new Error("Presentation cannot outrun verified capability");
}
