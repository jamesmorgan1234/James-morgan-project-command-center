/**
 * P15.1 reviewed mappings for the self-audit/compliance cluster
 * (CCR-01335..CCR-01344) plus three registry rows that existing kernel,
 * agency and Brain registry proof already asserts (CCR-00084, CCR-00085,
 * CCR-00093).
 */

const COMPLIANCE = "clean-room/src/analytics/compliance-reports.ts";
const SELF_AUDIT = "clean-room/src/analytics/self-audit.ts";
const CAPABILITIES = "clean-room/src/kernel/capabilities.ts";
const EXECUTORS = "clean-room/src/agency/registry.ts";
const AI_ROUTES = "clean-room/src/brain/providers.ts";

const COMPLIANCE_SUITE = "clean-room/tests/category13-compliance-reports.test.mjs";
const CAPABILITY_SUITE = "clean-room/tests/category1-p1-2-registry-capability-fabric.test.mjs";
const EXECUTOR_SUITE = "clean-room/tests/category7-executor-registry-persistence.test.mjs";
const BRAIN_SUITE = "clean-room/tests/brain-foundation.test.mjs";
const t = (suite, name) => `${suite} :: ${name}`;

const provenance =
  "Current-source compliance reporting and registry proof bound at this qualified HEAD; self-audit findings reuse the existing audit engine and registry rows reuse the kernel, agency and Brain registries that already own them.";

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

const p13 = ["C0", "C1", "C2", "C3"];
const analytics = "Analytics / Metrics / Recommendations / Self-Audit / Evidence";

export function reviewedComplianceRegistryMappings() {
  return [
    row("CCR-01335", "P13.10", p13, analytics,
      [`${COMPLIANCE}#selfAuditDue`, `${SELF_AUDIT}#selfAudit`],
      t(COMPLIANCE_SUITE, "P13.10 self-audit cadence is a schedule seam that reports the next due time"),
      "Audit cadence is an explicit interval with a computed next due time rather than an implicit timer."),

    row("CCR-01336", "P13.10", p13, analytics,
      [`${COMPLIANCE}#auditScope`],
      t(COMPLIANCE_SUITE, "P13.10 self-audit scope controls bound domains and target count"),
      "Audit scope selects explicit domains and a hard target bound, and records every excluded target."),

    row("CCR-01337", "P13.10", p13, analytics,
      [`${COMPLIANCE}#assertAuditReadOnly`],
      t(COMPLIANCE_SUITE, "P13.10 self-audit is read-only and cannot auto-modify production"),
      "Any audit path that requests a production mutation fails closed."),

    row("CCR-01338", "P13.10", p13, analytics,
      [`${COMPLIANCE}#auditResultsToProposals`],
      t(COMPLIANCE_SUITE, "P13.10 self-audit results become proposals and findings rather than mutations"),
      "Audit findings are emitted as non-executable proposals and findings with autoApply=false."),

    row("CCR-01339", "P13.10", p13, "Projects / Portfolio / Roadmaps / Progress",
      [`${COMPLIANCE}#complianceReport`],
      t(COMPLIANCE_SUITE, "P13.10 roadmap compliance report summarizes project findings"),
      "The projects compliance report carries project findings and a compliant/attention/blocked status."),

    row("CCR-01340", "P13.10", p13, "Brain / AI Intelligence",
      [`${COMPLIANCE}#complianceReport`],
      t(COMPLIANCE_SUITE, "P13.10 architecture compliance report summarizes architecture findings"),
      "The architecture compliance report reuses self-audit findings and blocks on critical findings."),

    row("CCR-01341", "P13.10", p13, "Client Shell / UX / PWA / Offline / Multi-device",
      [`${COMPLIANCE}#complianceReport`],
      t(COMPLIANCE_SUITE, "P13.10 visual compliance report summarizes visual findings"),
      "The visual compliance report is a read-only report over visual findings."),

    row("CCR-01342", "P13.10", p13, "Agent / Execution Infrastructure",
      [`${COMPLIANCE}#complianceReport`],
      t(COMPLIANCE_SUITE, "P13.10 agent compliance report summarizes agent findings"),
      "The agent compliance report summarizes execution findings without mutating them."),

    row("CCR-01343", "P13.10", p13, "Data / Knowledge / Provenance / Assets",
      [`${COMPLIANCE}#complianceReport`],
      t(COMPLIANCE_SUITE, "P13.10 data truth compliance report summarizes truth findings"),
      "The data truth compliance report blocks on critical truth findings."),

    row("CCR-01344", "P13.10", p13, "Security / Privacy / Trust / Incident Response",
      [`${COMPLIANCE}#complianceReport`],
      t(COMPLIANCE_SUITE, "P13.10 security compliance report summarizes security findings"),
      "The security compliance report validates its domain and timestamp and reports security findings."),

    row("CCR-00084", "P1.2", ["C0"], "Agent / Execution Infrastructure",
      [`${CAPABILITIES}#CapabilityRegistry`],
      t(CAPABILITY_SUITE, "P1.2 capability fabric registers discovers enables disables and unregisters an extensible capability"),
      "Agent capabilities are owned by the canonical capability registry rather than a per-agent list."),

    row("CCR-00085", "P7.2", ["C1", "C2", "C3", "C5", "C6"], "Agent / Execution Infrastructure",
      [`${EXECUTORS}#AgencyExecutorRegistry`],
      t(EXECUTOR_SUITE, "P7.2 runtime registry remains capability/risk/free-first driven and replaceable"),
      "Executors are registered in the agency executor registry with capability/risk/free-first metadata and replaceability."),

    row("CCR-00093", "P6.2", ["C1", "C2", "C3", "C5"], "Brain / AI Intelligence",
      [`${AI_ROUTES}#AiRouteRegistry`],
      t(BRAIN_SUITE, "AI routing preserves free-first/privacy/health and can replace providers"),
      "AI providers are registered and replaced through the canonical AI route registry rather than hard-coded call sites.")
  ];
}
