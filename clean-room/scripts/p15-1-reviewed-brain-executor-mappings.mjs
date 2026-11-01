/** P15.1 reviewed mappings: Brain governance, voice and executor (20 rows). */

const GOV = "clean-room/src/brain/governance.ts";
const VOICE = "clean-room/src/brain/voice-contracts.ts";
const EXEC = "clean-room/src/agency/executor.ts";
const SUITE = "clean-room/tests/category1-brain-executor.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const BRAIN = "Brain / Intelligence / Reasoning";
const AGENT = "Agent / Execution Infrastructure";
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

export function reviewedBrainExecutorMappings() {
  return [
    row("CCR-00324", GOV, "promptVersion", "P1.x prompt and policy versioning", BRAIN, "Prompt and policy versions are explicit."),
    row("CCR-00328", GOV, "classifyStatement", "P1.x facts separated from ideas", BRAIN, "Facts and ideas are separated at the statement level."),
    row("CCR-00353", GOV, "assertNoSilentArchitectureMutation", "P1.x Brain cannot silently mutate production architecture", BRAIN, "Architecture mutation requires explicit approval."),
    row("CCR-00354", GOV, "assertNoSilentOwnerDecision", "P1.x Brain cannot silently create canonical owner decisions", BRAIN, "Canonical owner decisions require approval."),
    row("CCR-00355", GOV, "classifyAmbiguity", "P1.x ambiguous owner statements require classification", BRAIN, "Ambiguous statements are classified as such."),
    row("CCR-00359", GOV, "rulesBeforeRecommendations", "P1.x Brain rules evaluated before recommendations", BRAIN, "Rules precede recommendations."),
    row("CCR-00361", GOV, "ownerOverride", "P1.x owner override available", BRAIN, "The owner can override the Brain."),
    row("CCR-00367", VOICE, "voiceIndependence", "P1.x voice independent from Brain logic", BRAIN, "Voice and Brain handlers are independent."),
    row("CCR-00370", VOICE, "listeningState", "P1.x visible listening state", BRAIN, "Listening state is explicit and visible."),
    row("CCR-00374", VOICE, "ambiguityConfirmation", "P1.x ambiguity confirmation", BRAIN, "Low-confidence voice input requires confirmation."),
    row("CCR-00378", VOICE, "voiceProvider", "P1.x future multiple voice providers", BRAIN, "Voice providers are pluggable from a supported set."),
    row("CCR-00379", VOICE, "handsFreeSummary", "P1.x future hands-free summaries", BRAIN, "Hands-free summaries are bounded in length."),
    row("CCR-00380", VOICE, "voiceActionLog", "P1.x voice actions logged as owner-originated voice input", BRAIN, "Voice actions carry an owner-voice origin."),
    row("CCR-00388", EXEC, "taskTransition", "P1.x task state machine", AGENT, "Task states transition explicitly and illegally refused."),
    row("CCR-00392", EXEC, "heartbeat", "P1.x heartbeat contract", AGENT, "Heartbeats become stale past the timeout."),
    row("CCR-00394", EXEC, "wakeContract", "P1.x executor wake contract", AGENT, "Executors wake only for a stated reason."),
    row("CCR-00395", EXEC, "resultContract", "P1.x executor result contract", AGENT, "Results carry a task and an outcome."),
    row("CCR-00401", EXEC, "assertObjectiveLock", "P1.x objective hard lock", AGENT, "The objective is locked against silent change."),
    row("CCR-00405", EXEC, "impactRadius", "P1.x impact-radius classification", AGENT, "Impact is classified to task, project or company."),
    row("CCR-00412", EXEC, "assertRealClaim", "P1.x working requires real executor claim", AGENT, "Working requires a real executor claim.")
  ];
}
