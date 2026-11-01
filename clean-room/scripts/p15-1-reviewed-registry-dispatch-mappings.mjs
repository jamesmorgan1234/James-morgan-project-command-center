/**
 * P15.1 reviewed mappings for the registry catalog (CCR-00083, 00086, 00089,
 * 00090, 00091, 00092, 00098, 00100) and owner command dispatch with project
 * locks (CCR-01345..CCR-01350).
 */

const REGISTRIES = "clean-room/src/kernel/registries.ts";
const DISPATCH = "clean-room/src/agency/dispatch.ts";
const LEASES = "clean-room/src/agency/leases.ts";
const BRAIN_REGISTRY = "clean-room/src/brain/specialists.ts";
const AUTOMATIONS = "clean-room/src/personal/automations.ts";

const REGISTRY_SUITE = "clean-room/tests/category1-registry-catalog.test.mjs";
const DISPATCH_SUITE = "clean-room/tests/category7-dispatch-queue.test.mjs";
const BRAIN_SUITE = "clean-room/tests/brain-foundation.test.mjs";
const PERSONAL_SUITE = "clean-room/tests/category8-199-personal-integration.test.mjs";
const t = (suite, name) => `${suite} :: ${name}`;

const provenance =
  "Current-source registry and dispatch contracts bound at this qualified HEAD; the Brain specialist and automation registries reuse the existing registry proof that already owns them.";

function row(id, phase, dependencies, capability, implementationLocations, test, notes) {
  return {
    id,
    owningPhases: [phase],
    dependencies,
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

const c0 = ["C0"];
const agent = "Agent / Execution Infrastructure";

export function reviewedRegistryDispatchMappings() {
  return [
    row("CCR-00083", "P6.2", ["C1", "C2", "C3", "C5"], "Brain / AI Intelligence",
      [`${BRAIN_REGISTRY}#SpecialistBrainRegistry`],
      t(BRAIN_SUITE, "specialist Brains and shared patterns remain registry-driven and scoped"),
      "Specialist Brains are discovered through one scoped registry rather than hard-coded per specialist."),

    row("CCR-00086", "P1.2", c0, agent,
      [`${REGISTRIES}#ToolRegistry`],
      t(REGISTRY_SUITE, "P1.2 tool registry requires a declared capability and risk class"),
      "Tools are registered with a declared capability and risk class, and unknown risk fails closed."),

    row("CCR-00089", "P8.9", ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "IF"], "Automation / Scheduling / Triggers",
      [`${AUTOMATIONS}#AutomationRegistry`],
      t(PERSONAL_SUITE, "P8.9 scheduled automation remains Agency-owned, idempotent across restart, and effect-time authority stays current"),
      "Automation types are registered through the automation registry that the scheduled-automation proof exercises."),

    row("CCR-00090", "P1.2", c0, "Security / Privacy / Trust / Incident Response",
      [`${REGISTRIES}#SecurityActionRegistry`],
      t(REGISTRY_SUITE, "P1.2 security action registry requires approval for protected actions"),
      "Security actions are registered with an explicit protected flag and protected actions must require approval."),

    row("CCR-00091", "P1.2", c0, "Deployment / Release / Provenance / Rollback",
      [`${REGISTRIES}#DeploymentTargetRegistry`],
      t(REGISTRY_SUITE, "P1.2 deployment target registry requires authorization for production"),
      "Deployment targets are registered by environment and production always requires explicit authorization."),

    row("CCR-00092", "P1.2", c0, "Brain / AI Intelligence",
      [`${REGISTRIES}#VoiceProviderRegistry`],
      t(REGISTRY_SUITE, "P1.2 voice provider registry preserves availability and permission state"),
      "Voice providers are registered with availability and permission state rather than assumed present."),

    row("CCR-00098", "P5.1", ["C1", "C2", "C3", "C4"], "Projects / Portfolio / Roadmaps / Progress",
      [`${REGISTRIES}#projectTypeTemplate`],
      t(REGISTRY_SUITE, "P1.2 project type templates declare required sections and capabilities"),
      "A new project type is defined by a template declaring its sections and capabilities."),

    row("CCR-00100", "P1.2", c0, agent,
      [`${REGISTRIES}#agentCapabilityTemplate`],
      t(REGISTRY_SUITE, "P1.2 agent capability templates declare capabilities and risk"),
      "A new agent capability is defined by a template declaring capabilities and a supported risk class."),

    row("CCR-01345", "P7.2", ["C1", "C2", "C3", "C5", "C6"], agent,
      [`${DISPATCH}#DispatchQueue`, `${DISPATCH}#DispatchQueue.assertExecutionAllowed`],
      t(DISPATCH_SUITE, "P7.2 command acceptance is separate from an execution claim"),
      "Accepting a command records intent only; execution is refused until a worker explicitly claims it."),

    row("CCR-01346", "P7.2", ["C1", "C2", "C3", "C5", "C6"], agent,
      [`${DISPATCH}#DispatchQueue.signal`],
      t(DISPATCH_SUITE, "P7.2 owner command signals dispatch immediately on acceptance"),
      "The dispatch signal fires at acceptance time, so an owner command is not delayed behind a polling cycle."),

    row("CCR-01347", "P7.2", ["C1", "C2", "C3", "C5", "C6"], agent,
      [`${DISPATCH}#DispatchQueue.snapshot`, `${DISPATCH}#DispatchQueue.restore`],
      t(DISPATCH_SUITE, "P7.2 dispatch queue survives restart through snapshot and restore"),
      "The dispatch queue can be snapshotted and restored, so accepted work survives a restart."),

    row("CCR-01348", "P7.2", ["C1", "C2", "C3", "C5", "C6"], agent,
      [`${DISPATCH}#DispatchQueue.pending`],
      t(DISPATCH_SUITE, "P7.2 dispatch priority orders critical before normal before low"),
      "Pending work is ordered by declared priority, then acceptance time."),

    row("CCR-01349", "P7.2", ["C1", "C2", "C3", "C5", "C6"], "Projects / Portfolio / Roadmaps / Progress",
      [`${DISPATCH}#acquireProjectLock`, `${LEASES}#TaskClaimStore`],
      t(DISPATCH_SUITE, "P7.2 project lock acquisition uses a fenced claim"),
      "A project lock is acquired through the fenced task-claim store, so a second worker cannot take the same project."),

    row("CCR-01350", "P7.2", ["C1", "C2", "C3", "C5", "C6"], "Projects / Portfolio / Roadmaps / Progress",
      [`${DISPATCH}#renewProjectLock`, `${LEASES}#TaskClaimStore.renew`],
      t(DISPATCH_SUITE, "P7.2 project lock is a lease that renews and rejects stale holders"),
      "The project lock is a renewable lease and stale fencing tokens are rejected on renewal.")
  ];
}
