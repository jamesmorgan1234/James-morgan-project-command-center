import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMAND_CENTER_EFFECTS,
  MAX_TRANSITION_DURATION_MS,
  animationCancellationPolicy,
  cancelMotion,
  motionDisposition,
  decorativeMotionAllowed,
  assertTransitionBudget,
  decorativeLayerStyle,
  assertNoTapInterception,
  OVERLAY_Z_INDEX,
  overlayZIndex,
  assertOverlayOrder,
  assertNoModalStack,
  OwnerFeedbackCenter,
  stableWarningKey,
  truncateText,
  assertCriticalNotTruncatedOnly,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  statusLabel,
  canonicalTerm,
  ownerFacingText,
  assertNoInternalDetail,
  assertNoTechnicalPlumbing,
  diagnosticsDisclosure,
  assertDebugControlsAbsent,
  sectionPresentation,
  assertPresentationWithinCapability
} from "../dist/ui/index.js";

const AT = "2026-10-31T14:30:00.000Z";

test("P4.7 animation cancellation is mandatory on navigation, unmount and reduced motion", () => {
  assert.deepEqual(animationCancellationPolicy(false), {
    cancelOnNavigation: true,
    cancelOnUnmount: true,
    cancelOnReducedMotion: false,
    leavesInteractionUnblocked: true
  });
  assert.equal(animationCancellationPolicy(true).cancelOnReducedMotion, true);
  assert.deepEqual(cancelMotion("card-expand", "navigation"), { name: "card-expand", cancelled: true, reason: "navigation" });
  assert.throws(() => cancelMotion("  ", "unmount"), /requires a name/);
});

test("P4.7 motion never blocks interaction and decorative usability harm is rejected", () => {
  const disposition = motionDisposition({ name: "row-enter", durationMs: 120, decorative: false });
  assert.equal(disposition.blocksInteraction, false);
  assert.equal(disposition.cancelsOnNavigation, true);
  assert.equal(disposition.cancelsOnUnmount, true);
  assert.equal(decorativeMotionAllowed({ decorative: true, harmsUsability: false }), true);
  assert.equal(decorativeMotionAllowed({ decorative: true, harmsUsability: true }), false);
  assert.throws(() => motionDisposition({ name: "parallax", durationMs: 120, decorative: true, harmsUsability: true }), /harms usability/);
  const reduced = motionDisposition({ name: "row-enter", durationMs: 120, decorative: false }, true);
  assert.equal(reduced.durationMs, COMMAND_CENTER_EFFECTS.reducedMotionDurationMs);
  assert.ok(reduced.durationMs <= MAX_TRANSITION_DURATION_MS);
});

test("P4.7 transition duration budget rejects over-budget and invalid transitions", () => {
  assert.equal(assertTransitionBudget(MAX_TRANSITION_DURATION_MS), 180);
  assert.equal(assertTransitionBudget(0), 0);
  assert.throws(() => assertTransitionBudget(MAX_TRANSITION_DURATION_MS + 1), /exceeds the 180ms budget/);
  assert.throws(() => assertTransitionBudget(-1), /non-negative finite/);
  assert.throws(() => assertTransitionBudget(Number.NaN), /non-negative finite/);
});

test("P4.7 decorative layers cannot intercept taps or hijack touch scrolling", () => {
  assert.deepEqual(decorativeLayerStyle(), {
    pointerEvents: "none",
    touchAction: "auto",
    ariaHidden: true,
    interceptsTaps: false,
    blocksScroll: false
  });
  assert.doesNotThrow(() => assertNoTapInterception(decorativeLayerStyle()));
  assert.throws(() => assertNoTapInterception({ interceptsTaps: true }), /cannot intercept taps/);
  assert.throws(() => assertNoTapInterception({ interceptsTaps: false, blocksScroll: true }), /hijack touch scrolling/);
});

test("P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks", () => {
  assert.ok(overlayZIndex("dialog") > overlayZIndex("toast"));
  assert.ok(overlayZIndex("toast") > overlayZIndex("navigation"));
  assert.ok(OVERLAY_Z_INDEX.destructiveDialog > OVERLAY_Z_INDEX.dialog);
  assert.ok(OVERLAY_Z_INDEX.tooltip > OVERLAY_Z_INDEX.toast);
  assert.doesNotThrow(() => assertOverlayOrder("navigation", "dialog"));
  assert.throws(() => assertOverlayOrder("dialog", "navigation"), /requires dialog below navigation/);
  assert.doesNotThrow(() => assertNoModalStack([0, 1, 0]));
  assert.throws(() => assertNoModalStack([1, 1]), /Modal stacking is prohibited/);
});

test("P4.8 one owner feedback center deduplicates and bounds ephemeral toasts", () => {
  const center = new OwnerFeedbackCenter(2);
  const first = center.publish({ key: "sync", message: "Refreshing sources", severity: "info", observedAt: AT });
  assert.equal(first.durable, false);
  const duplicate = center.publish({ key: "sync", message: "Refreshing sources", severity: "info", observedAt: AT });
  assert.equal(duplicate.occurrences, 2);
  assert.equal(center.list().length, 1);
  center.publish({ key: "cache", message: "Cache warmed", severity: "info", observedAt: AT });
  center.publish({ key: "nav", message: "Route ready", severity: "info", observedAt: AT });
  assert.equal(center.list().length, 2);
  assert.equal(center.list().some((entry) => entry.key === "sync"), false);
  assert.throws(() => new OwnerFeedbackCenter(0), /positive visible limit/);
});

test("P4.8 failures and owner-required blockers survive ephemeral expiry", () => {
  const center = new OwnerFeedbackCenter(1);
  const failure = center.publish({ key: "provider", message: "Provider unavailable", severity: "failure", observedAt: AT });
  const blocker = center.publish({ key: "approval", message: "Owner approval required", severity: "blocker", observedAt: AT });
  assert.equal(failure.durable, true);
  assert.equal(blocker.durable, true);
  for (let index = 0; index < 5; index += 1) center.publish({ key: `info-${index}`, message: "Working", severity: "info", observedAt: AT });
  assert.equal(center.list().some((entry) => entry.key === "provider"), true);
  assert.equal(center.list().some((entry) => entry.key === "approval"), true);
  assert.throws(() => center.dismiss("approval"), /never disappear because a toast expired/);
  center.dismiss("approval", true);
  assert.equal(center.list().some((entry) => entry.key === "approval"), false);
});

test("P4.8 repeated identical warnings dedupe by stable key across refreshes", () => {
  const key = stableWarningKey("source-health", "provider-stale");
  assert.equal(key, "source-health::provider-stale");
  const center = new OwnerFeedbackCenter();
  center.publish({ key, message: "Provider stale", severity: "warning", observedAt: AT });
  center.publish({ key, message: "Provider stale", severity: "warning", observedAt: "2026-10-31T15:00:00.000Z" });
  center.publish({ key, message: "Provider stale", severity: "warning", observedAt: "2026-10-31T16:00:00.000Z" });
  const entries = center.list();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].occurrences, 3);
  assert.equal(entries[0].firstObservedAt, AT);
  assert.throws(() => stableWarningKey("", "code"), /require scope and code/);
});

test("P4.8 truncation is explicit, expandable and never hides critical information", () => {
  const short = truncateText("Approved", 20);
  assert.deepEqual(short, { text: "Approved", truncated: false, fullText: "Approved", expandable: false });
  const long = truncateText("Owner approval is required before the deployment runs", 20);
  assert.equal(long.truncated, true);
  assert.equal(long.expandable, true);
  assert.equal(long.fullText, "Owner approval is required before the deployment runs");
  assert.ok(long.text.endsWith("…"));
  assert.equal(long.text.length, 20);
  assert.doesNotThrow(() => assertCriticalNotTruncatedOnly({ critical: true, truncated: true, expandable: true }));
  assert.throws(() => assertCriticalNotTruncatedOnly({ critical: true, truncated: true, expandable: false }), /Critical information cannot be hidden/);
  assert.throws(() => truncateText("text", 0), /positive integer/);
});

test("P4.8 numbers use one canonical grouped format", () => {
  assert.equal(formatNumber(1234567), "1,234,567");
  assert.equal(formatNumber(1234.5), "1,234.50");
  assert.equal(formatNumber(-42), "-42");
  assert.throws(() => formatNumber(Number.NaN), /finite number/);
});

test("P4.8 currency uses one canonical ISO code and precision", () => {
  assert.equal(formatCurrency(1234.5), "GBP 1,234.50");
  assert.equal(formatCurrency(0, "USD"), "USD 0.00");
  assert.equal(formatCurrency(19.9), "GBP 19.90");
  assert.throws(() => formatCurrency(1, "pounds"), /ISO 4217/);
});

test("P4.8 percentages use one canonical precision", () => {
  assert.equal(formatPercent(0.1234), "12.3%");
  assert.equal(formatPercent(0.5, 0), "50%");
  assert.equal(formatPercent(1), "100.0%");
  assert.throws(() => formatPercent(Number.NaN), /finite ratio/);
  assert.throws(() => formatPercent(0.5, 9), /0\.\.3/);
});

test("P4.8 dates and times use one canonical order and UTC basis", () => {
  assert.equal(formatDate(AT), "2026-10-31");
  assert.equal(formatDateTime(AT), "2026-10-31 14:30 UTC");
  assert.equal(formatDate("2026-01-02T00:00:00.000Z"), "2026-01-02");
  assert.throws(() => formatDate("not-a-date"), /valid timestamp/);
  assert.throws(() => formatDateTime(""), /valid timestamp/);
});

test("P4.8 status labels use one canonical capitalization", () => {
  assert.equal(statusLabel("in_progress"), "In progress");
  assert.equal(statusLabel("BLOCKED"), "Blocked");
  assert.equal(statusLabel("needs-review"), "Needs review");
  assert.equal(statusLabel("awaiting owner"), "Awaiting owner");
  assert.throws(() => statusLabel("   "), /requires a status/);
});

test("P4.8 terminology maps aliases to canonical owner terms", () => {
  assert.equal(canonicalTerm("initiative"), "project");
  assert.equal(canonicalTerm("Issues"), "blockers");
  assert.equal(canonicalTerm("feature"), "capability");
  assert.equal(canonicalTerm("Capability"), "capability");
  assert.throws(() => canonicalTerm("  "), /requires a term/);
});

test("P4.8 internal identifiers are not shown by default", () => {
  assert.equal(ownerFacingText("CCR-01228 animation cleanup"), "animation cleanup");
  assert.equal(ownerFacingText("Approval required"), "Approval required");
  assert.doesNotThrow(() => assertNoInternalDetail("Owner approval is required"));
  assert.throws(() => assertNoInternalDetail("CCR-01228"), /Internal identifiers/);
  assert.throws(() => assertNoInternalDetail("0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0"), /Internal identifiers/);
});

test("P4.8 raw JSON is not shown by default", () => {
  assert.equal(ownerFacingText('{"internal":true}'), "Details are available in diagnostics.");
  assert.doesNotThrow(() => assertNoInternalDetail("Provider stale since 14:30"));
  assert.throws(() => assertNoInternalDetail('{"a":1}'), /Raw JSON/);
});

test("P4.8 private technical plumbing is absent from ordinary owner screens", () => {
  assert.doesNotThrow(() => assertNoTechnicalPlumbing("The provider is unavailable"));
  assert.throws(() => assertNoTechnicalPlumbing("supabase connection failed"), /technical plumbing/);
  assert.throws(() => assertNoTechnicalPlumbing("jwt expired"), /technical plumbing/);
});

test("P4.8 advanced diagnostics are separated from ordinary screens", () => {
  assert.equal(diagnosticsDisclosure({ authenticatedOwner: true, separatedFromOrdinaryScreens: false }).visible, false);
  assert.equal(diagnosticsDisclosure({ authenticatedOwner: false, separatedFromOrdinaryScreens: true }).visible, false);
  assert.equal(diagnosticsDisclosure({ authenticatedOwner: true, separatedFromOrdinaryScreens: true }).visible, true);
});

test("P4.8 advanced diagnostics remain owner-only", () => {
  assert.equal(diagnosticsDisclosure({ authenticatedOwner: false, separatedFromOrdinaryScreens: true }).ownerOnly, true);
  assert.equal(diagnosticsDisclosure({ authenticatedOwner: false, separatedFromOrdinaryScreens: true }).visible, false);
  assert.equal(diagnosticsDisclosure({ authenticatedOwner: true, separatedFromOrdinaryScreens: true }).visible, true);
});

test("P4.8 debug controls are absent from production presentation", () => {
  assert.doesNotThrow(() => assertDebugControlsAbsent(false, ["replay"]));
  assert.doesNotThrow(() => assertDebugControlsAbsent(true, []));
  assert.throws(() => assertDebugControlsAbsent(true, ["replay"]), /prohibited in production/);
});

test("P4.5 missing capability renders a truthful unavailable state instead of a fabricated section", () => {
  const unavailable = sectionPresentation({ section: "finance", capabilityVerified: false });
  assert.equal(unavailable.state, "unavailable");
  assert.equal(unavailable.sourceRef, null);
  assert.equal(unavailable.label, "Unavailable");
  assert.equal(unavailable.fabricated, false);
  assert.throws(() => sectionPresentation({ section: "finance", capabilityVerified: true }), /canonical source reference/);
  const available = sectionPresentation({ section: "finance", capabilityVerified: true, sourceRef: "ledger:finance" });
  assert.equal(available.state, "rendered");
  assert.equal(available.sourceRef, "ledger:finance");
});

test("P4.5 presentation never outruns verified capability", () => {
  assert.doesNotThrow(() => assertPresentationWithinCapability({ capabilityVerified: true, presentedAsAvailable: true }));
  assert.doesNotThrow(() => assertPresentationWithinCapability({ capabilityVerified: false, presentedAsAvailable: false }));
  assert.throws(() => assertPresentationWithinCapability({ capabilityVerified: false, presentedAsAvailable: true }), /cannot outrun verified capability/);
});
