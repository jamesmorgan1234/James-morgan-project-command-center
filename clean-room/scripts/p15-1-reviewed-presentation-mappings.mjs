/**
 * P15.1 current reviewed mappings for the CCR-01228..CCR-01264 interaction and
 * presentation batch (Client Shell / UX / PWA and Search / Notifications owners).
 *
 * Every row below is bound to an implementation and a named test that exist at the
 * current qualified HEAD. Nothing here is promoted from the recovered diagnostics:
 * those documents supplied the surface navigation only, and the contracts and
 * focused suites were authored and executed against the current repository.
 */

const PRESENTATION = "clean-room/src/ui/presentation.ts";
const TOKENS = "clean-room/src/ui/design-tokens.ts";
const NOTIFICATIONS = "clean-room/src/personal/notifications.ts";
const SUITE = "clean-room/tests/category4-presentation-discipline.test.mjs";
const NOTIFICATION_SUITE = "clean-room/tests/p8-8-notifications.test.mjs";

const t = (suite, name) => `${suite} :: ${name}`;

const presentationProvenance =
  "Current-source interaction/presentation discipline contract authored for this batch at the qualified HEAD; the recovered diagnostics were used only to navigate the UI/NOTIFY/VIEW surfaces and are not the proof.";

function row(id, phase, dependencies, applicable, implementationLocations, positive, negative, failurePath, notes) {
  return {
    id,
    owningPhases: [phase],
    dependencies,
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: applicable,
    implementationLocations,
    tests: {
      positive: { applicable: true, references: [positive], justification: null },
      negative: { applicable: true, references: [negative], justification: null },
      failurePath: { applicable: true, references: [failurePath], justification: null }
    },
    evidence: [`${presentationProvenance} ${notes}`],
    closureNotes: notes
  };
}

const p4 = ["C1", "C2", "C3"];
const shell = ["Command Center", "Client Shell / UX / PWA / Offline / Multi-device"];
const notify = ["Command Center", "Search / Notifications / Needs Me"];
const p8 = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "IF"];

export function reviewedPresentationMappings() {
  return [
    row("CCR-01228", "P4.7", p4, shell,
      [`${PRESENTATION}#animationCancellationPolicy`, `${PRESENTATION}#cancelMotion`],
      t(SUITE, "P4.7 animation cancellation is mandatory on navigation, unmount and reduced motion"),
      t(SUITE, "P4.7 animation cancellation is mandatory on navigation, unmount and reduced motion"),
      t(SUITE, "P4.7 animation cancellation is mandatory on navigation, unmount and reduced motion"),
      "Motion cancellation is a first-class policy: navigation, unmount and reduced motion all cancel, and an unnamed motion cannot be cancelled silently."),

    row("CCR-01229", "P4.7", p4, shell,
      [`${PRESENTATION}#motionDisposition`],
      t(SUITE, "P4.7 motion never blocks interaction and decorative usability harm is rejected"),
      t(SUITE, "P4.7 motion never blocks interaction and decorative usability harm is rejected"),
      t(SUITE, "P4.7 motion never blocks interaction and decorative usability harm is rejected"),
      "Every motion disposition fixes blocksInteraction=false while retaining cancellation on navigation and unmount."),

    row("CCR-01230", "P4.7", p4, shell,
      [`${TOKENS}#COMMAND_CENTER_EFFECTS`, `${PRESENTATION}#MAX_TRANSITION_DURATION_MS`, `${PRESENTATION}#assertTransitionBudget`],
      t(SUITE, "P4.7 transition duration budget rejects over-budget and invalid transitions"),
      t(SUITE, "P4.7 transition duration budget rejects over-budget and invalid transitions"),
      t(SUITE, "P4.7 transition duration budget rejects over-budget and invalid transitions"),
      "The 180ms token is enforced as a hard budget; over-budget, negative and non-finite transitions fail closed."),

    row("CCR-01231", "P4.7", p4, shell,
      [`${PRESENTATION}#decorativeMotionAllowed`],
      t(SUITE, "P4.7 motion never blocks interaction and decorative usability harm is rejected"),
      t(SUITE, "P4.7 motion never blocks interaction and decorative usability harm is rejected"),
      t(SUITE, "P4.7 motion never blocks interaction and decorative usability harm is rejected"),
      "Decorative motion that harms usability is refused at the contract boundary rather than left to per-screen judgement."),

    row("CCR-01232", "P4.7", p4, shell,
      [`${PRESENTATION}#decorativeLayerStyle`],
      t(SUITE, "P4.7 decorative layers cannot intercept taps or hijack touch scrolling"),
      t(SUITE, "P4.7 decorative layers cannot intercept taps or hijack touch scrolling"),
      t(SUITE, "P4.7 decorative layers cannot intercept taps or hijack touch scrolling"),
      "Decorative layers are pinned to touch-action:auto and blocksScroll=false so they can never hijack touch scrolling."),

    row("CCR-01233", "P4.7", p4, shell,
      [`${PRESENTATION}#decorativeLayerStyle`, `${PRESENTATION}#assertNoTapInterception`],
      t(SUITE, "P4.7 decorative layers cannot intercept taps or hijack touch scrolling"),
      t(SUITE, "P4.7 decorative layers cannot intercept taps or hijack touch scrolling"),
      t(SUITE, "P4.7 decorative layers cannot intercept taps or hijack touch scrolling"),
      "pointer-events:none is mandatory for decorative layers and any tap-interception claim fails closed."),

    row("CCR-01235", "P4.8", p4, shell,
      [`${PRESENTATION}#OVERLAY_Z_INDEX`, `${PRESENTATION}#assertOverlayOrder`],
      t(SUITE, "P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks"),
      t(SUITE, "P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks"),
      t(SUITE, "P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks"),
      "One ordered overlay scale ranks content through destructive dialogs, and inverted orders are rejected."),

    row("CCR-01236", "P4.8", p4, shell,
      [`${PRESENTATION}#assertNoModalStack`],
      t(SUITE, "P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks"),
      t(SUITE, "P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks"),
      t(SUITE, "P4.8 overlay stacking contract orders surfaces and prohibits undesigned modal stacks"),
      "Two simultaneous modal depths are refused unless a screen is explicitly designed for stacking."),

    row("CCR-01237", "P4.8", p4, shell,
      [`${PRESENTATION}#OwnerFeedbackCenter`],
      t(SUITE, "P4.8 one owner feedback center deduplicates and bounds ephemeral toasts"),
      t(SUITE, "P4.8 one owner feedback center deduplicates and bounds ephemeral toasts"),
      t(SUITE, "P4.8 one owner feedback center deduplicates and bounds ephemeral toasts"),
      "A single owner feedback center owns all ephemeral toasts, so screens cannot invent competing toast channels."),

    row("CCR-01238", "P4.8", p4, shell,
      [`${PRESENTATION}#OwnerFeedbackCenter.publish`],
      t(SUITE, "P4.8 one owner feedback center deduplicates and bounds ephemeral toasts"),
      t(SUITE, "P4.8 one owner feedback center deduplicates and bounds ephemeral toasts"),
      t(SUITE, "P4.8 one owner feedback center deduplicates and bounds ephemeral toasts"),
      "Publishing under an existing stable key increments occurrences instead of creating a duplicate toast."),

    row("CCR-01239", "P4.8", p4, shell,
      [`${PRESENTATION}#isDurableFeedback`],
      t(SUITE, "P4.8 failures and owner-required blockers survive ephemeral expiry"),
      t(SUITE, "P4.8 failures and owner-required blockers survive ephemeral expiry"),
      t(SUITE, "P4.8 failures and owner-required blockers survive ephemeral expiry"),
      "Failure severity is durable by construction, so an important failure cannot evaporate when a toast times out."),

    row("CCR-01240", "P4.8", p4, shell,
      [`${PRESENTATION}#OwnerFeedbackCenter.dismiss`],
      t(SUITE, "P4.8 failures and owner-required blockers survive ephemeral expiry"),
      t(SUITE, "P4.8 failures and owner-required blockers survive ephemeral expiry"),
      t(SUITE, "P4.8 failures and owner-required blockers survive ephemeral expiry"),
      "Blockers are exempt from the ephemeral visible limit and dismissal fails unless the blocker is explicitly resolved."),

    row("CCR-01241", "P8.8", p8, notify,
      [`${NOTIFICATIONS}#routeNotifications`, `${NOTIFICATIONS}#acknowledgeNotification`],
      t(NOTIFICATION_SUITE, "P8.8 durable schema records intents, routing receipts, and immutable acknowledgements without sensitive payload duplication"),
      t(NOTIFICATION_SUITE, "P8.8 durable schema records intents, routing receipts, and immutable acknowledgements without sensitive payload duplication"),
      t(NOTIFICATION_SUITE, "P8.8 acknowledged intents do not re-notify and acknowledgements require evidence"),
      "Owner-relevant intents carry source references and durable acknowledgement history, so the notification center receives evidence-backed events rather than transient display state."),

    row("CCR-01242", "P8.8", p8, notify,
      [`${NOTIFICATIONS}#routeNotifications`],
      t(NOTIFICATION_SUITE, "P8.8 flood routing preserves critical signal and bundles/dedupes within owner scope"),
      t(NOTIFICATION_SUITE, "P8.8 flood routing preserves critical signal and bundles/dedupes within owner scope"),
      t(NOTIFICATION_SUITE, "P8.8 quiet mode keeps only critical signal and protected content is minimized without deep-link leakage"),
      "Flood routing bundles and deduplicates per owner and channel while preserving critical signal."),

    row("CCR-01243", "P4.8", p4, shell,
      [`${PRESENTATION}#stableWarningKey`, `${PRESENTATION}#OwnerFeedbackCenter`],
      t(SUITE, "P4.8 repeated identical warnings dedupe by stable key across refreshes"),
      t(SUITE, "P4.8 repeated identical warnings dedupe by stable key across refreshes"),
      t(SUITE, "P4.8 repeated identical warnings dedupe by stable key across refreshes"),
      "Warnings keyed by scope and code dedupe across repeated refreshes while retaining the first observation timestamp."),

    row("CCR-01244", "P4.7", p4, shell,
      [`${PRESENTATION}#truncateText`],
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      "Truncation is an explicit, measured result with the full text retained rather than a CSS-only visual cut."),

    row("CCR-01245", "P4.7", p4, shell,
      [`${PRESENTATION}#truncateText`, `${PRESENTATION}#TruncatedText`],
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      "Any truncated value is marked expandable and retains fullText for the expansion affordance."),

    row("CCR-01246", "P4.7", p4, shell,
      [`${PRESENTATION}#assertCriticalNotTruncatedOnly`],
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      t(SUITE, "P4.8 truncation is explicit, expandable and never hides critical information"),
      "Critical information that is truncated without an expansion path is refused."),

    row("CCR-01247", "P4.8", p4, shell,
      [`${PRESENTATION}#formatNumber`],
      t(SUITE, "P4.8 numbers use one canonical grouped format"),
      t(SUITE, "P4.8 numbers use one canonical grouped format"),
      t(SUITE, "P4.8 numbers use one canonical grouped format"),
      "One grouped numeric format is used everywhere instead of per-screen ad-hoc formatting."),

    row("CCR-01248", "P4.8", p4, shell,
      [`${PRESENTATION}#formatCurrency`, `${PRESENTATION}#OWNER_CURRENCY`],
      t(SUITE, "P4.8 currency uses one canonical ISO code and precision"),
      t(SUITE, "P4.8 currency uses one canonical ISO code and precision"),
      t(SUITE, "P4.8 currency uses one canonical ISO code and precision"),
      "Currency is rendered with a validated ISO code and fixed two-decimal precision."),

    row("CCR-01249", "P4.8", p4, shell,
      [`${PRESENTATION}#formatPercent`],
      t(SUITE, "P4.8 percentages use one canonical precision"),
      t(SUITE, "P4.8 percentages use one canonical precision"),
      t(SUITE, "P4.8 percentages use one canonical precision"),
      "Percentages render from a finite ratio with bounded precision rather than caller-formatted strings."),

    row("CCR-01250", "P4.8", p4, shell,
      [`${PRESENTATION}#formatDate`, `${PRESENTATION}#formatDateTime`],
      t(SUITE, "P4.8 dates and times use one canonical order and UTC basis"),
      t(SUITE, "P4.8 dates and times use one canonical order and UTC basis"),
      t(SUITE, "P4.8 dates and times use one canonical order and UTC basis"),
      "Dates use ISO order and timestamps use a fixed UTC rendering, so locale drift cannot change owner-facing truth."),

    row("CCR-01251", "P4.8", p4, shell,
      [`${PRESENTATION}#statusLabel`, `${PRESENTATION}#CANONICAL_STATUS_LABELS`],
      t(SUITE, "P4.8 status labels use one canonical capitalization"),
      t(SUITE, "P4.8 status labels use one canonical capitalization"),
      t(SUITE, "P4.8 status labels use one canonical capitalization"),
      "Status labels resolve through one canonical label table with deterministic sentence-case fallback."),

    row("CCR-01252", "P4.8", p4, shell,
      [`${PRESENTATION}#canonicalTerm`, `${PRESENTATION}#CANONICAL_TERMS`],
      t(SUITE, "P4.8 terminology maps aliases to canonical owner terms"),
      t(SUITE, "P4.8 terminology maps aliases to canonical owner terms"),
      t(SUITE, "P4.8 terminology maps aliases to canonical owner terms"),
      "Synonym aliases resolve to the canonical owner vocabulary instead of screen-specific wording."),

    row("CCR-01253", "P4.8", p4, shell,
      [`${PRESENTATION}#ownerFacingText`, `${PRESENTATION}#assertNoInternalDetail`],
      t(SUITE, "P4.8 internal identifiers are not shown by default"),
      t(SUITE, "P4.8 internal identifiers are not shown by default"),
      t(SUITE, "P4.8 internal identifiers are not shown by default"),
      "Default owner text strips CCR and UUID identifiers, and explicit assertion rejects any that remain."),

    row("CCR-01254", "P4.8", p4, shell,
      [`${PRESENTATION}#ownerFacingText`, `${PRESENTATION}#assertNoInternalDetail`],
      t(SUITE, "P4.8 raw JSON is not shown by default"),
      t(SUITE, "P4.8 raw JSON is not shown by default"),
      t(SUITE, "P4.8 raw JSON is not shown by default"),
      "Raw JSON payloads are replaced with fixed safe copy in ordinary owner text."),

    row("CCR-01255", "P4.8", p4, shell,
      [`${PRESENTATION}#assertNoTechnicalPlumbing`],
      t(SUITE, "P4.8 private technical plumbing is absent from ordinary owner screens"),
      t(SUITE, "P4.8 private technical plumbing is absent from ordinary owner screens"),
      t(SUITE, "P4.8 private technical plumbing is absent from ordinary owner screens"),
      "Provider, database, token and stack-trace vocabulary is refused in ordinary owner screens."),

    row("CCR-01256", "P4.8", p4, shell,
      [`${PRESENTATION}#diagnosticsDisclosure`],
      t(SUITE, "P4.8 advanced diagnostics are separated from ordinary screens"),
      t(SUITE, "P4.8 advanced diagnostics are separated from ordinary screens"),
      t(SUITE, "P4.8 advanced diagnostics are separated from ordinary screens"),
      "Diagnostics are visible only when they are separated from ordinary screens, so they cannot leak inline."),

    row("CCR-01257", "P4.8", p4, shell,
      [`${PRESENTATION}#diagnosticsDisclosure`],
      t(SUITE, "P4.8 advanced diagnostics remain owner-only"),
      t(SUITE, "P4.8 advanced diagnostics remain owner-only"),
      t(SUITE, "P4.8 advanced diagnostics remain owner-only"),
      "Diagnostics disclosure requires an authenticated owner as well as separation."),

    row("CCR-01258", "P4.8", p4, shell,
      [`${PRESENTATION}#assertDebugControlsAbsent`],
      t(SUITE, "P4.8 debug controls are absent from production presentation"),
      t(SUITE, "P4.8 debug controls are absent from production presentation"),
      t(SUITE, "P4.8 debug controls are absent from production presentation"),
      "Production presentation refuses debug controls while development builds may retain them."),

    row("CCR-01262", "P4.5", p4, shell,
      [`${PRESENTATION}#sectionPresentation`],
      t(SUITE, "P4.5 missing capability renders a truthful unavailable state instead of a fabricated section"),
      t(SUITE, "P4.5 missing capability renders a truthful unavailable state instead of a fabricated section"),
      t(SUITE, "P4.5 missing capability renders a truthful unavailable state instead of a fabricated section"),
      "A section without verified capability renders an unavailable state; a rendered section requires a canonical source reference."),

    row("CCR-01263", "P4.5", p4, shell,
      [`${PRESENTATION}#sectionPresentation`, `${PRESENTATION}#SectionPresentation`],
      t(SUITE, "P4.5 missing capability renders a truthful unavailable state instead of a fabricated section"),
      t(SUITE, "P4.5 missing capability renders a truthful unavailable state instead of a fabricated section"),
      t(SUITE, "P4.5 missing capability renders a truthful unavailable state instead of a fabricated section"),
      "Unavailable is an explicit labelled state with a null source reference and fabricated=false."),

    row("CCR-01264", "P4.5", p4, shell,
      [`${PRESENTATION}#assertPresentationWithinCapability`],
      t(SUITE, "P4.5 presentation never outruns verified capability"),
      t(SUITE, "P4.5 presentation never outruns verified capability"),
      t(SUITE, "P4.5 presentation never outruns verified capability"),
      "Presenting unverified capability as available fails closed at the presentation boundary.")
  ];
}
