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
export function assertTransitionBudget(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs < 0)
        throw new Error("Transition duration must be a non-negative finite number");
    if (durationMs > MAX_TRANSITION_DURATION_MS)
        throw new Error(`Transition duration ${durationMs}ms exceeds the ${MAX_TRANSITION_DURATION_MS}ms budget`);
    return durationMs;
}
export function decorativeMotionAllowed(request) {
    return !(request.decorative && request.harmsUsability === true);
}
export function motionDisposition(request, preferredReducedMotion = false) {
    if (!request.name.trim())
        throw new Error("Motion request requires a name");
    const budgeted = assertTransitionBudget(request.durationMs);
    if (!decorativeMotionAllowed(request))
        throw new Error(`Decorative motion ${request.name} harms usability and is not permitted`);
    return Object.freeze({
        name: request.name,
        durationMs: preferredReducedMotion ? COMMAND_CENTER_EFFECTS.reducedMotionDurationMs : budgeted,
        decorative: request.decorative,
        blocksInteraction: false,
        cancelsOnNavigation: true,
        cancelsOnUnmount: true,
        transitionBudgetMs: MAX_TRANSITION_DURATION_MS
    });
}
export function cancelMotion(name, reason) {
    if (!name.trim())
        throw new Error("Motion cancellation requires a name");
    return Object.freeze({ name, cancelled: true, reason });
}
export function animationCancellationPolicy(preferredReducedMotion) {
    return Object.freeze({
        cancelOnNavigation: true,
        cancelOnUnmount: true,
        cancelOnReducedMotion: preferredReducedMotion,
        leavesInteractionUnblocked: true
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
export function decorativeLayerStyle() {
    return Object.freeze({
        pointerEvents: "none",
        touchAction: "auto",
        ariaHidden: true,
        interceptsTaps: false,
        blocksScroll: false
    });
}
export function assertNoTapInterception(layer) {
    if (layer.interceptsTaps)
        throw new Error("Invisible overlay cannot intercept taps");
    if (layer.blocksScroll)
        throw new Error("Decorative layer cannot hijack touch scrolling");
}
export function overlayZIndex(kind) {
    return OVERLAY_Z_INDEX[kind];
}
export function assertOverlayOrder(under, over) {
    if (OVERLAY_Z_INDEX[under] >= OVERLAY_Z_INDEX[over])
        throw new Error(`Overlay order requires ${under} below ${over}`);
}
export function assertNoModalStack(openModalDepths) {
    if (openModalDepths.filter((depth) => depth > 0).length > 1)
        throw new Error("Modal stacking is prohibited unless explicitly designed");
}
const DURABLE_SEVERITIES = ["failure", "blocker"];
export function isDurableFeedback(severity) {
    return DURABLE_SEVERITIES.includes(severity);
}
/** The single owner-visible ephemeral feedback channel. */
export class OwnerFeedbackCenter {
    #active = new Map();
    #maxVisible;
    constructor(maxVisible = 3) {
        if (!Number.isSafeInteger(maxVisible) || maxVisible <= 0)
            throw new Error("Feedback center requires a positive visible limit");
        this.#maxVisible = maxVisible;
    }
    publish(input) {
        if (!input.key.trim() || !input.message.trim())
            throw new Error("Feedback requires a stable key and message");
        if (!Number.isFinite(Date.parse(input.observedAt)))
            throw new Error("Feedback requires a valid observation timestamp");
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
            if (ephemeral.length >= this.#maxVisible && oldest)
                this.#active.delete(oldest.key);
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
    dismiss(key, resolved = false) {
        const record = this.#active.get(key);
        if (!record)
            return;
        if (record.severity === "blocker" && !resolved)
            throw new Error("Owner-required blockers never disappear because a toast expired");
        this.#active.delete(key);
    }
    list() {
        return Object.freeze([...this.#active.values()]);
    }
}
export function stableWarningKey(scope, code) {
    if (!scope.trim() || !code.trim())
        throw new Error("Warning keys require scope and code");
    return `${scope.trim()}::${code.trim()}`;
}
export function truncateText(value, maxChars) {
    if (!Number.isSafeInteger(maxChars) || maxChars < 1)
        throw new Error("Truncation limit must be a positive integer");
    if (value.length <= maxChars)
        return Object.freeze({ text: value, truncated: false, fullText: value, expandable: false });
    return Object.freeze({ text: `${value.slice(0, maxChars - 1)}…`, truncated: true, fullText: value, expandable: true });
}
export function assertCriticalNotTruncatedOnly(input) {
    if (input.critical && input.truncated && !input.expandable)
        throw new Error("Critical information cannot be hidden only by truncation");
}
// ---------------------------------------------------------------- formatting
export const OWNER_CURRENCY = "GBP";
function grouped(value, fractionDigits) {
    if (!Number.isFinite(value))
        throw new Error("Formatting requires a finite number");
    return new Intl.NumberFormat("en-GB", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits, useGrouping: true }).format(value);
}
export function formatNumber(value) {
    return grouped(value, Number.isInteger(value) ? 0 : 2);
}
export function formatCurrency(value, currency = OWNER_CURRENCY) {
    if (!/^[A-Z]{3}$/.test(currency))
        throw new Error("Currency must be an ISO 4217 code");
    return `${currency} ${grouped(value, 2)}`;
}
export function formatPercent(ratio, fractionDigits = 1) {
    if (!Number.isFinite(ratio))
        throw new Error("Percent formatting requires a finite ratio");
    if (!Number.isSafeInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 3)
        throw new Error("Percent fraction digits must be 0..3");
    return `${(ratio * 100).toFixed(fractionDigits)}%`;
}
export function formatDate(isoTimestamp) {
    const parsed = Date.parse(isoTimestamp);
    if (!Number.isFinite(parsed))
        throw new Error("Date formatting requires a valid timestamp");
    return new Date(parsed).toISOString().slice(0, 10);
}
export function formatDateTime(isoTimestamp) {
    const parsed = Date.parse(isoTimestamp);
    if (!Number.isFinite(parsed))
        throw new Error("Date/time formatting requires a valid timestamp");
    return `${new Date(parsed).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
export const CANONICAL_STATUS_LABELS = Object.freeze({
    in_progress: "In progress",
    blocked: "Blocked",
    awaiting_owner: "Awaiting owner",
    needs_attention: "Needs attention",
    unavailable: "Unavailable",
    not_applicable: "Not applicable"
});
export function statusLabel(status) {
    const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const known = CANONICAL_STATUS_LABELS[normalized];
    if (known)
        return known;
    if (!normalized)
        throw new Error("Status label requires a status");
    const [first = "", ...rest] = normalized.split("_").filter(Boolean);
    return `${first.slice(0, 1).toUpperCase()}${first.slice(1)}${rest.map((word) => ` ${word}`).join("")}`;
}
export const CANONICAL_TERMS = Object.freeze({
    project: ["project", "projects"],
    obligation: ["obligation", "obligations"],
    blocker: ["blocker", "blockers"],
    capability: ["capability", "capabilities"]
});
const TERM_ALIASES = Object.freeze({
    initiative: "project",
    initiatives: "project",
    todo: "obligation",
    todos: "obligations",
    issue: "blocker",
    issues: "blockers",
    feature: "capability",
    features: "capabilities"
});
export function canonicalTerm(term) {
    const normalized = term.trim().toLowerCase();
    if (!normalized)
        throw new Error("Terminology requires a term");
    return TERM_ALIASES[normalized] ?? normalized;
}
const INTERNAL_ID = /\b(?:ccr-\d{5}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/gi;
const INTERNAL_ID_PROBE = /\b(?:ccr-\d{5}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i;
const RAW_JSON = /(?:^|[\s:])(?:\{[\s\S]*\}|\[[\s\S]*\])(?:$|\s)/;
export function ownerFacingText(value) {
    const withoutJson = RAW_JSON.test(value) ? "Details are available in diagnostics." : value;
    return withoutJson
        .replace(INTERNAL_ID, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}
export function assertNoInternalDetail(value) {
    if (INTERNAL_ID_PROBE.test(value))
        throw new Error("Internal identifiers are not shown by default");
    if (RAW_JSON.test(value))
        throw new Error("Raw JSON is not shown by default");
}
const TECHNICAL_PLUMBING = /\b(?:supabase|postgres|pgbouncer|redis|jwt|bearer|env\.|process\.env|stack trace|traceback)\b/i;
export function assertNoTechnicalPlumbing(value) {
    if (TECHNICAL_PLUMBING.test(value))
        throw new Error("Private technical plumbing is not shown in ordinary owner screens");
}
export function diagnosticsDisclosure(input) {
    return Object.freeze({
        visible: input.authenticatedOwner && input.separatedFromOrdinaryScreens,
        ownerOnly: true,
        separatedFromOrdinaryScreens: true
    });
}
export function assertDebugControlsAbsent(production, debugControls) {
    if (production && debugControls.length > 0)
        throw new Error("Debug controls are prohibited in production presentation");
}
export function sectionPresentation(input) {
    if (!input.section.trim())
        throw new Error("Section presentation requires a section name");
    if (!input.capabilityVerified) {
        return Object.freeze({ section: input.section, state: "unavailable", sourceRef: null, label: "Unavailable", fabricated: false });
    }
    if (!input.sourceRef?.trim())
        throw new Error(`Verified section ${input.section} requires a canonical source reference`);
    return Object.freeze({ section: input.section, state: "rendered", sourceRef: input.sourceRef, label: "Available", fabricated: false });
}
export function assertPresentationWithinCapability(input) {
    if (input.presentedAsAvailable && !input.capabilityVerified)
        throw new Error("Presentation cannot outrun verified capability");
}
//# sourceMappingURL=presentation.js.map