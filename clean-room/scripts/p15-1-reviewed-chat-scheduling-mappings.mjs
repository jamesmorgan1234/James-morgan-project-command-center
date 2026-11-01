/** P15.1 reviewed mappings: chat surface and scheduling (12 rows). */

const CHAT = "clean-room/src/brain/chat.ts";
const SCHED = "clean-room/src/agency/scheduling.ts";
const SUITE = "clean-room/tests/category1-chat-scheduling.test.mjs";
const t = (name) => `${SUITE} :: ${name}`;
const BRAIN = "Brain / Intelligence / Reasoning";
const AGENT = "Agent / Execution Infrastructure";
const SHELL = "Client Shell / PWA / Navigation";
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

export function reviewedChatSchedulingMappings() {
  return [
    row("CCR-00318", SCHED, "assertNoForcedImmersive", "P1.x no forced immersive mode", SHELL, "Immersive mode is never forced."),
    row("CCR-00320", SCHED, "assertInstalledDeviceAcceptance", "P1.x physical installed-device acceptance", SHELL, "Acceptance requires a physical installed device."),
    row("CCR-00326", CHAT, "buildPortfolioContext", "P1.x portfolio-scoped context builder", BRAIN, "Context is built from the requested portfolio scope and cannot be empty."),
    row("CCR-00347", CHAT, "roadmapComparison", "P1.x roadmap-to-reality comparison", BRAIN, "Planned items are compared against delivered reality."),
    row("CCR-00348", CHAT, "complianceScan", "P1.x requirements compliance scanner", BRAIN, "Compliance scans report met counts and missing requirements."),
    row("CCR-00360", CHAT, "routeProtectedAction", "P1.x protected actions routed through Security", BRAIN, "Protected actions cannot bypass Security."),
    row("CCR-00364", CHAT, "assertNoSuggestionBypass", "P1.x no hidden suggestion-to-Agent bypass", BRAIN, "Suggestions reach the Agent only with approval."),
    row("CCR-00365", CHAT, "actionPreview", "P1.x Brain action previews where consequences matter", BRAIN, "Consequential actions require a preview."),
    row("CCR-00383", SCHED, "schedulerRole", "P1.x scheduler as continuation and fallback", AGENT, "The scheduler is a continuation, never the sole trigger."),
    row("CCR-00402", SCHED, "controlModeLock", "P1.x control-mode hard lock", AGENT, "The control mode is hard locked."),
    row("CCR-00414", SCHED, "assertExternalVerification", "P1.x executor self-report insufficient with external verification", AGENT, "External verification overrides self-report."),
    row("CCR-00427", SCHED, "resumePoint", "P1.x resume from first incomplete task", AGENT, "Resumption starts at the first incomplete task.")
  ];
}
