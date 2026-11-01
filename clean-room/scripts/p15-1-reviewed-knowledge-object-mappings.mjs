/**
 * P15.1 reviewed mappings for the canonical knowledge object cohort
 * CCR-01266..CCR-01290 (owner: Brain / AI Intelligence, data knowledge, projects).
 *
 * Phase authority: CCR-01265 (canonical knowledge object model) is already verified
 * as P3.2 with C1,C2 prerequisites, and every row here is a type or metadata facet of
 * that same model. Each row binds to the object model or the ledger primitive that
 * enforces it, plus the named test that asserts the exact behaviour at this HEAD.
 */

const OBJECTS = "clean-room/src/data/knowledge-objects.ts";
const LEDGER = "clean-room/src/data/knowledge.ts";
const SUITE = "clean-room/tests/category3-knowledge-objects.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;

const provenance =
  "Current-source canonical knowledge object model authored for this batch at the qualified HEAD; the recovered diagnostics were navigation only and are not the proof.";

function row(id, applicable, implementationLocations, test, notes) {
  return {
    id,
    owningPhases: ["P3.2"],
    dependencies: ["C1", "C2"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", applicable],
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

const brain = "Brain / AI Intelligence";

export function reviewedKnowledgeObjectMappings() {
  return [
    row("CCR-01266", brain, [`${OBJECTS}#createKnowledgeObject`, `${LEDGER}#KnowledgeClaim`],
      t("P3.2 fact objects require provenance and a bounded confidence"),
      "Fact objects are a first-class type requiring provenance and a bounded confidence before they enter the ledger."),

    row("CCR-01267", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 rule objects carry applicability references without inventing scope"),
      "Rule objects are typed explicitly and cannot be created without a value."),

    row("CCR-01268", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 decision objects preserve owner authority"),
      "Decision objects retain owner origin; a brain-originated object cannot be marked owner-editable."),

    row("CCR-01269", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 preference objects stay owner-editable and scoped"),
      "Preference objects are owner-editable only when owner-originated, preserving the ownership boundary."),

    row("CCR-01270", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 goal objects carry temporal validity and confidence"),
      "Goal objects carry bounded confidence and an ordered validity window."),

    row("CCR-01271", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 idea objects cannot claim verified certainty"),
      "Idea objects are uncertain by construction and reject certainty."),

    row("CCR-01272", brain, [`${OBJECTS}#createKnowledgeObject`, `${OBJECTS}#knowledgeFreshnessState`],
      t("P3.2 hypothesis objects carry confidence and freshness metadata"),
      "Hypothesis objects carry bounded confidence plus staleAfter freshness metadata."),

    row("CCR-01274", "Search / Notifications / Needs Me", [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 research findings require external provenance and evidence"),
      "Research findings require external provenance and at least one evidence reference."),

    row("CCR-01275", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 question objects remain open and never fabricate a value"),
      "Question objects are valueless, so an unanswered question cannot carry a fabricated answer."),

    row("CCR-01276", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 unknown gap objects never fabricate a value"),
      "Unknown/gap objects are valueless and refuse any substituted value, including zero."),

    row("CCR-01277", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 contradiction objects require at least two opposing references"),
      "Contradiction objects require two distinct opposing references and carry no value."),

    row("CCR-01278", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 owner corrections must supersede an existing object"),
      "Owner corrections must name the object they supersede."),

    row("CCR-01279", brain, [`${LEDGER}#KnowledgeLedger`, `${OBJECTS}#createKnowledgeObject`],
      t("P3.2 owner corrections must supersede an existing object"),
      "Supersession is explicit at the ledger (supersedes plus advancing version) and at the correction object boundary."),

    row("CCR-01281", "Projects / Portfolio / Roadmaps / Progress", [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 project scope binds knowledge to an explicit project reference"),
      "Every knowledge object binds to an explicit subject reference, including project-scoped knowledge."),

    row("CCR-01283", brain, [`${OBJECTS}#createKnowledgeObject`, `${LEDGER}#KnowledgeApplicability`],
      t("P3.2 temporal validity is explicit and ordered"),
      "Temporal validity is parsed and ordered; an inverted window fails closed."),

    row("CCR-01284", brain, [`${LEDGER}#KnowledgeClaim`, `${OBJECTS}#createKnowledgeObject`],
      t("P3.2 confidence is bounded and uncertain types never claim certainty"),
      "Confidence is bounded 0..1 for types that carry it and uncertain types cannot claim certainty."),

    row("CCR-01285", brain, [`${OBJECTS}#knowledgeFreshnessState`, `${OBJECTS}#createKnowledgeObject`],
      t("P3.2 freshness marks stale objects without hiding them"),
      "Freshness derives from staleAfter and returns fresh/stale/unknown without hiding stale objects."),

    row("CCR-01286", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 sensitivity classification is mandatory and cannot be downgraded by sharing"),
      "Unsupported sensitivity is refused and protected knowledge cannot be shared internally."),

    row("CCR-01287", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 shareability never exceeds sensitivity"),
      "Shareability is capped by sensitivity; protected objects cannot be owner-shared and sensitive objects cannot be internal."),

    row("CCR-01288", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 owner-editable flag is limited to owner-originated objects"),
      "The owner-editable flag is rejected for external objects, preventing edits to non-owner knowledge."),

    row("CCR-01289", brain, [`${OBJECTS}#createKnowledgeObject`],
      t("P3.2 externally verified objects require external evidence"),
      "Externally verified knowledge requires external origin and evidence; owner-originated facts cannot self-declare it."),

    row("CCR-01290", brain, [`${OBJECTS}#isOwnerOriginated`, `${OBJECTS}#isBrainGenerated`],
      t("P3.2 origin distinguishes owner, brain and external sources"),
      "Origin is explicit and distinguishes owner-originated from brain-generated and external knowledge.")
  ];
}
