/** P15.1 reviewed mappings: roadmap progress, resumption and structure (24 rows). */

const PROG = "clean-room/src/projects/roadmap-progress.ts";
const RUN = "clean-room/src/projects/run-resume.ts";
const STRUCT = "clean-room/src/projects/roadmap-structure.ts";
const SUITE = "clean-room/tests/category1-roadmap.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const PROJ = "Projects / Portfolio / Roadmaps / Progress";
const AGENT = "Agent / Execution Infrastructure";
const SEC = "Security / Trust / Governance";
const provenance = "Current-source contracts authored for this batch at the qualified HEAD; each row is asserted by its named test against the current tree.";

function row(id, module, fn, test, capability, notes) {
  return {
    id,
    owningPhases: ["P7.2"],
    dependencies: ["C1", "C2", "C3", "C5", "C6"],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ["Command Center", capability],
    implementationLocations: [`${module}#${fn}`],
    tests: {
      positive: { applicable: true, references: [t(test)], justification: null },
      negative: { applicable: true, references: [t(test)], justification: null },
      failurePath: { applicable: true, references: [t(test)], justification: null }
    },
    evidence: [`${provenance} ${notes}`],
    closureNotes: notes
  };
}

export function reviewedRoadmapMappings() {
  return [
    row("CCR-00433", PROG, "planVersion", "P1.x plan versioning", AGENT, "Plans carry a positive integer version."),
    row("CCR-00434", PROG, "expandPlan", "P1.x dynamic plan expansion", AGENT, "Expansion appends units and bumps the version."),
    row("CCR-00435", PROG, "planDiff", "P1.x plan-diff history", AGENT, "Plan diffs report added and removed units."),
    row("CCR-00438", PROG, "percentageAfterExpansion", "P1.x plan expansion can decrease the percentage", AGENT, "Expansion may lower, never inflate, the percentage."),
    row("CCR-00440", PROG, "barrierSweep", "P1.x barrier-sweep count and progress separate", AGENT, "Sweep counts and percentage are distinct."),
    row("CCR-00441", PROG, "rejectTimeBasedProgress", "P1.x no time-based fake progress", AGENT, "Elapsed time cannot drive progress."),
    row("CCR-00442", PROG, "rejectStatusBasedProgress", "P1.x no status-based fake progress", AGENT, "Status alone cannot drive progress."),
    row("CCR-00444", PROG, "progressExplanation", "P1.x progress explanation available", AGENT, "Progress can always be explained by remaining units."),
    row("CCR-00436", RUN, "assertTrustworthyPlan", "P1.x verified tasks and trustworthy plan only", SEC, "Only verified tasks form a trustworthy plan."),
    row("CCR-00443", RUN, "taskWeight", "P1.x task weights only where legitimately defined", AGENT, "Missing weights are refused rather than invented."),
    row("CCR-00445", RUN, "linkProgressToEvidence", "P1.x roadmap progress linked to evidence", PROJ, "Progress requires linked evidence."),
    row("CCR-00456", RUN, "checkpointReverify", "P1.x checkpoint re-verifies downstream state", PROJ, "Downstream units are re-verified after a checkpoint."),
    row("CCR-00457", RUN, "resumeSameRun", "P1.x same run resumes after verification", AGENT, "Resumption continues the same run."),
    row("CCR-00458", RUN, "assertNoRunRecreation", "P1.x no run recreation after a blocker", AGENT, "A run is never recreated for a cleared blocker."),
    row("CCR-00459", RUN, "assertNoProjectSwitch", "P1.x no project switching after a blocker", PROJ, "A blocker never switches the project."),
    row("CCR-00463", RUN, "smallestBlockedOperation", "P1.x work task is the smallest useful blocked operation", AGENT, "The work task is the smallest blocked operation."),
    row("CCR-00482", STRUCT, "unitId", "P1.x stable roadmap-unit IDs", PROJ, "Roadmap units receive stable padded IDs."),
    row("CCR-00486", STRUCT, "checkpointAncestry", "P1.x checkpoint ancestry", PROJ, "Ancestry is append-only and cycle-free."),
    row("CCR-00487", STRUCT, "firstIncomplete", "P1.x first-incomplete-unit pointer", PROJ, "The pointer identifies the first incomplete unit."),
    row("CCR-00489", STRUCT, "reopenAffected", "P1.x reopen only affected units", PROJ, "Only affected units reopen."),
    row("CCR-00490", STRUCT, "recordScopeExpansion", "P1.x scope-expansion history", PROJ, "Scope expansion history is append-only."),
    row("CCR-00491", STRUCT, "recalculatePercentage", "P1.x percentage recalculation after scope change", PROJ, "Percentages recalculate from unit weights."),
    row("CCR-00492", STRUCT, "projectTransition", "P1.x project lifecycle state machine", PROJ, "Project states transition explicitly."),
    row("CCR-00494", STRUCT, "sectionAdapter", "P1.x project-detail-section adapters", PROJ, "Detail sections resolve only through known adapters.")
  ];
}
