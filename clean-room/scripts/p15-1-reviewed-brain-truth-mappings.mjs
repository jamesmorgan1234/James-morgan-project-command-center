/**
 * P15.1 reviewed mappings for CCR-01291..CCR-01313 (Brain truth, context and
 * recommendation discipline).
 *
 * Rows with existing current proof bind to the context compiler, planning claim
 * classes, canonical write boundary and recommendation validation that already
 * assert them. Rows whose behaviour did not exist bind to the truth-discipline
 * contracts authored for this batch and to their focused tests.
 */

const TRUTH = "clean-room/src/brain/truth-discipline.ts";
const CONTEXT = "clean-room/src/brain/context-builder.ts";
const PLANNING = "clean-room/src/brain/planning.ts";
const CORE = "clean-room/src/brain/core.ts";
const MEMORY = "clean-room/src/brain/memory.ts";
const RECOMMENDATIONS = "clean-room/src/analytics/recommendations.ts";

const CONTEXT_SUITE = "clean-room/tests/category6-context-builder-persistence.test.mjs";
const INTEGRATION_SUITE = "clean-room/tests/category6-intelligence-integration.test.mjs";
const FOUNDATION_SUITE = "clean-room/tests/brain-foundation.test.mjs";
const TRUTH_SUITE = "clean-room/tests/category6-truth-discipline.test.mjs";
const t = (suite, name) => `${suite} :: ${name}`;

const provenance =
  "Current-source Brain truth and context discipline bound at this qualified HEAD; existing context/planning/recommendation proof reused where it already asserts the row, and new contracts authored only for the missing behaviours.";

const p6 = ["C1", "C2", "C3", "C5"];
const brain = "Brain / AI Intelligence";

function row(id, phase, capability, implementationLocations, test, notes) {
  return {
    id,
    owningPhases: [phase],
    dependencies: p6,
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
    implementationLocations,
    tests: {
      positive: { applicable: true, references: [test], justification: null },
      negative: { applicable: true, references: [test], justification: null },
      failurePath: { applicable: true, references: [test], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

const filters = t(CONTEXT_SUITE, "P6.4 Context Builder filters cross-project, stale, sensitivity and low-relevance candidates");
const durable = t(CONTEXT_SUITE, "P6.4 durable context build binds selection evidence to immutable owner/project snapshot");
const layered = t(INTEGRATION_SUITE, "P6.3 and P6.4 preserve layered memory, negative/quarantined knowledge, freshness and Context Compiler omissions");
const coreBoundary = t(FOUNDATION_SUITE, "Brain core separates intelligence output from canonical write authority");
const claimClasses = t(INTEGRATION_SUITE, "P6.5 keeps observed facts, assumptions, simulations, counterfactuals and causal claims explicitly separated");
const proposals = t(INTEGRATION_SUITE, "P6.13 recommendations remain proposals and never self-install");

export function reviewedBrainTruthMappings() {
  return [
    row("CCR-01291", "P6.5", brain, [`${PLANNING}#ClaimClass`], claimClasses,
      "Planning claims are classified as verified fact, owner decision, assumption, estimate or recommendation, so a generated hypothesis cannot enter as a fact."),

    row("CCR-01292", "P6.1", brain, [`${CORE}#BrainResponseEnvelope`], coreBoundary,
      "Every Brain response envelope fixes canonicalWritesAuthorized=false, so a model answer never becomes canonical automatically."),

    row("CCR-01293", "P6.15", brain, [`${TRUTH}#resolveClaimPrecedence`, `${MEMORY}#BrainMemoryLedger`],
      t(TRUTH_SUITE, "P6.15 owner corrections outrank brain inference and hypotheses"),
      "Precedence ranks owner corrections above inference and hypotheses, and the ledger requires corrections to stay inside owner/project/kind boundaries."),

    row("CCR-01294", "P6.15", brain, [`${TRUTH}#resolveClaimPrecedence`],
      t(TRUTH_SUITE, "P6.15 newer explicit owner instruction supersedes older conflicting instruction"),
      "Two conflicting owner instructions resolve deterministically to the newer explicit instruction."),

    row("CCR-01295", "P6.4", brain, [`${TRUTH}#scanContradictions`, `${MEMORY}#LayeredMemoryMetadata`, `${CONTEXT}#compileLayeredBrainContext`], layered,
      "Contradictions are detected before assembly and memory carrying contradictionRefs is omitted with the explicit unresolved_contradiction reason."),

    row("CCR-01296", "P6.4", brain, [`${CONTEXT}#buildBrainContext`], filters,
      "Context candidates carry a bounded relevance score and anything below the request threshold is excluded."),

    row("CCR-01297", "P6.4", brain, [`${CONTEXT}#compileLayeredBrainContext`], layered,
      "Context size is bounded by maxBudgetUnits and maxItems, and overflow is recorded as an explicit budget_overflow omission."),

    row("CCR-01298", "P6.4", brain, [`${CONTEXT}#buildBrainContext`], filters,
      "Project isolation is enforced during context build: a candidate bound to another project is excluded."),

    row("CCR-01299", "P6.4", brain, [`${CONTEXT}#buildBrainContext`], filters,
      "Only candidates matching the requested project survive, so cross-project context requires an explicit project request."),

    row("CCR-01300", "P6.4", brain, [`${CONTEXT}#compileLayeredBrainContext`], filters,
      "Candidates above the sensitivity ceiling are omitted with sensitivity_boundary before entering the packet."),

    row("CCR-01301", "P6.4", brain, [`${CONTEXT}#LayeredContextPacket`, `${CONTEXT}#compileLayeredBrainContext`], durable,
      "The compiled packet retains exact memory version references plus every omission and its reason, giving an internal assembly trace."),

    row("CCR-01302", "P6.1", brain, [`${CORE}#BrainResponseEnvelope`], coreBoundary,
      "Every Brain answer carries evidence references in its response envelope."),

    row("CCR-01303", "P6.13", brain, [`${RECOMMENDATIONS}#validateRecommendation`], proposals,
      "Recommendations require evidence references, confidence and success criteria before they can be recorded."),

    row("CCR-01304", "P6.15", brain, [`${TRUTH}#assertSupportedMemoryClaim`],
      t(TRUTH_SUITE, "P6.15 unsupported memory claims are refused"),
      "A claim that the Brain remembers data is refused unless it is supported by nonblank sources."),

    row("CCR-01305", "P6.15", brain, [`${TRUTH}#ownerInputRequired`],
      t(TRUTH_SUITE, "P6.15 owner input is requested only for genuinely missing truth"),
      "Owner input is required only for missing sources, not for negative results, unavailable tools or stale data."),

    row("CCR-01306", "P6.4", brain, [`${TRUTH}#prefersLiveSource`],
      t(TRUTH_SUITE, "P6.15 live source is preferred over stale memory"),
      "A live current or negative-result source is preferred over stale memory."),

    row("CCR-01307", "P6.15", brain, [`${TRUTH}#classifySourceAvailability`],
      t(TRUTH_SUITE, "P6.15 source availability distinguishes missing, absent, unavailable, stale and current"),
      "Missing source and negative result are distinct states, so absence of data is never reported as a negative finding."),

    row("CCR-01308", "P6.15", brain, [`${TRUTH}#classifySourceAvailability`],
      t(TRUTH_SUITE, "P6.15 source availability distinguishes missing, absent, unavailable, stale and current"),
      "An unavailable tool is distinguished from absent data and from a missing source."),

    row("CCR-01309", "P6.4", brain, [`${CONTEXT}#buildBrainContext`], filters,
      "Stale candidates are separated into omittedStaleIds and never presented as current context."),

    row("CCR-01310", "P6.15", brain, [`${TRUTH}#explainContradiction`],
      t(TRUTH_SUITE, "P6.15 contradictions are explainable with both claim identities"),
      "A contradiction explanation names both claims, their shared subject and the disagreement."),

    row("CCR-01311", "P6.15", brain, [`${TRUTH}#proposeConflictResolution`],
      t(TRUTH_SUITE, "P6.15 conflict resolution is proposed but never silently applied"),
      "Conflict resolution returns a proposal with requiresOwnerApproval=true and applied=false."),

    row("CCR-01312", "P6.15", brain, [`${TRUTH}#assertNoSilentOwnerConflictResolution`],
      t(TRUTH_SUITE, "P6.15 conflict resolution is proposed but never silently applied"),
      "Owner-level conflicts without a decisive precedence rule fail closed until the owner approves."),

    row("CCR-01313", "P6.13", brain, [`${TRUTH}#recommendationCooldown`],
      t(TRUTH_SUITE, "P6.15 recommendation cooldown prevents repeated presentation"),
      "A recommendation key cannot be re-presented inside its cooldown window, and the remaining time is reported.")
  ];
}
