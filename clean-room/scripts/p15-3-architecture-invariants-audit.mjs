/**
 * P15.3 — architecture invariants, intelligence-governance and extensibility audit.
 *
 * Every invariant is exercised against the real compiled implementation, not
 * against roadmap prose: single ownership and control-plane authority, delegation
 * that can only narrow, canonical registries, an acyclic module graph with no
 * legacy edge, registration-only extension, learning that cannot become global
 * truth by itself, self-improvement that cannot mutate authority, and recovery
 * that cannot resurrect revoked scope.
 *
 * Exit code 0 only when every invariant passes. --write emits the phase receipt
 * bound to the exact source commit and audited inputs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import {
  ArchitectureResponsibilityRegistry,
  CapabilityMethodPortfolio,
  CapabilityRegistry,
  Registry,
  assertNoLegacyRuntimeImports,
  assertScopeContains,
  assertSingleOwners,
  createCoreArchitectureResponsibilityRegistry,
  validateArchitectureResponsibility
} from "../dist/kernel/index.js";
import { validateDelegatedAuthority } from "../dist/agency/index.js";
import { assertProtectedPreflight } from "../dist/agency/index.js";
import { SpecialistBrainRegistry, SelfImprovementGovernor, validateImprovementSnapshot, validateSpecialistProjection } from "../dist/brain/index.js";
import { LearningPromotionGovernor } from "../dist/data/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const NOW = "2026-11-01T00:00:00.000Z";
const LATER = "2027-01-01T00:00:00.000Z";
const results = [];
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const expectThrow = (run, pattern, message) => {
  try {
    run();
  } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected error "${error.message}"`);
    return;
  }
  throw new Error(`${message}: expected a rejection but the operation succeeded`);
};
const invariant = (id, description, body) => {
  const checks = [];
  const check = (name, run) => {
    try { run(); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  body(check);
  const failed = checks.filter((entry) => !entry.passed);
  results.push({ id, description, passed: failed.length === 0, checks });
};

const commandCenter = { actor: "command_center", evidenceIds: ["evd_p15-3-authority"] };

function specialistModel(overrides = {}) {
  return {
    key: "brn_p15-3-specialist",
    version: 1,
    enabled: true,
    controlPlane: "command_center",
    domain: "research",
    subdomains: [],
    supportedCompanyIds: ["company:p15"],
    supportedProjectIds: ["project:p15"],
    supportedWorkClasses: ["research"],
    strengths: ["evidence-led research"],
    weaknesses: ["requires evidence"],
    capabilityKeys: ["capability:research"],
    methodIds: ["mth_p15-3"],
    permissionKeys: ["repo:read"],
    protectedActionBoundaries: ["owner_approval"],
    dataClasses: ["internal"],
    toolKeys: ["tool:web"],
    providerKeys: ["pvd_local"],
    modelAssignments: [{ providerKey: "pvd_local", modelId: "local-reasoner", versionRef: "v1" }],
    dependencyVersionRefs: ["dependency:research@1"],
    calibrationScore: 0.9,
    evaluationEvidenceIds: ["evd_p15-3-evaluation"],
    historicalAccuracy: 0.9,
    reliabilityScore: 0.9,
    latencyMs: 20,
    resourceClass: "low",
    costClass: "free",
    failureModes: ["provider_unavailable"],
    degradedModes: ["manual_review"],
    fallbackSpecialistIds: [],
    delegationTargets: [],
    learningEligibility: "promotion_candidate",
    experimentStatus: "stable",
    health: "healthy",
    lifecycle: "active",
    rollbackEvidenceId: "evd_p15-3-rollback",
    provenanceEvidenceIds: ["evd_p15-3-provenance"],
    verificationState: "verified",
    revalidatedAt: NOW,
    revalidateAfter: LATER,
    ...overrides
  };
}

function capabilityContract(overrides = {}) {
  return {
    key: "capability:p15-3",
    version: 1,
    enabled: true,
    inputVersion: 1,
    outputVersion: 1,
    compatibleInputVersions: [1],
    compatibleOutputVersions: [1],
    maturity: "local",
    criticalShared: false,
    securityClass: "internal",
    canPin: true,
    canFork: false,
    ...overrides
  };
}

function methodContract(overrides = {}) {
  return {
    key: "mth_p15-3",
    version: 1,
    enabled: true,
    capabilityKey: "capability:research",
    implementationVersionRef: "implementation:research@1",
    lifecycle: "active",
    applicabilityScopeKeys: ["global"],
    contraindications: [],
    prerequisites: [],
    qualityScore: 0.9,
    calibrationScore: 0.9,
    latencyMs: 20,
    resourceClass: "low",
    costClass: "free",
    privacyClass: "local",
    maxDataSensitivity: "secret",
    securityAssurance: 0.9,
    reliabilityScore: 0.9,
    benchmarkEvidenceIds: ["evd_p15-3-benchmark"],
    outcomeEvidenceIds: ["evd_p15-3-outcome"],
    provenanceEvidenceIds: ["evd_p15-3-provenance"],
    fallbackMethodIds: [],
    rollbackEvidenceId: "evd_p15-3-rollback",
    revalidatedAt: NOW,
    revalidateAfter: LATER,
    ...overrides
  };
}

function delegationEnvelope(overrides = {}) {
  const admission = { monetaryBudgetCents: 0, maxConcurrent: 2, maxQueueDepth: 10, maxRetries: 2, maxRuntimeMs: 60000 };
  return {
    parentTaskId: "task:parent",
    childTaskId: "task:child",
    depth: 1,
    parentScopes: ["repo:read", "repo:write"],
    childScopes: ["repo:read"],
    capability: "research",
    controllingOrchestrator: "command-center",
    parentSubjectId: "subject:parent",
    childSubjectId: "subject:child",
    parentScope: { ownerId: "owner:p15", companyId: "company:p15", projectId: "project:p15", environment: "normal_chat" },
    childScope: { ownerId: "owner:p15", companyId: "company:p15", projectId: "project:p15", environment: "normal_chat" },
    parentAdmission: admission,
    childAdmission: { ...admission, maxConcurrent: 1 },
    parentResourceLimits: { workers: 2 },
    childResourceLimits: { workers: 1 },
    policyVersion: "policy:p15@1",
    currentPolicyVersion: "policy:p15@1",
    issuedAt: "2026-10-31T23:00:00.000Z",
    expiresAt: "2026-11-01T01:00:00.000Z",
    revoked: false,
    evidenceRefs: ["evd_p15-3-delegation"],
    ...overrides
  };
}

function learningPacket(overrides = {}) {
  return {
    id: "lrn_p15-3",
    version: 1,
    sourceBrainId: "brn_p15-3",
    sourceSystemRef: "command-center",
    sourceCompanyId: "cmp_p15",
    sourceProjectId: "prj_p15",
    sourceMethodId: "mth_p15-3",
    sourceMethodVersion: 1,
    sourceCapabilityKey: "capability:research",
    observedAt: "2026-10-31T20:00:00.000Z",
    taskClass: "research",
    domainId: "dom_research",
    conditionIds: ["cnd_one"],
    constraints: ["constraint:low-cost"],
    discovery: "Evidence-first routing reduced rework",
    action: "Route research through evidence-first method",
    evidenceIds: ["evd_p15-3-learning"],
    sourceRefs: ["run:p15-3"],
    sampleCount: 3,
    metrics: [{ key: "rework", unit: "count", baseline: 4, measured: 1 }],
    outcome: "rework reduced",
    successCriteria: ["rework lower"],
    failureCriteria: ["rework higher"],
    confidence: 0.9,
    calibration: 0.9,
    reproducibility: 0.9,
    causalConfidence: 0.85,
    confounders: ["seasonality"],
    limitations: ["single project"],
    failureConditions: ["provider unavailable"],
    prerequisites: [],
    requiredTools: ["tool:web"],
    requiredDataClasses: ["internal"],
    resourceImplications: [],
    latencyImplications: [],
    financialImplications: [],
    privacy: { classification: "project_private", scopeRef: "prj_p15" },
    securityImplications: [],
    applicableSystems: ["command-center"],
    transferabilityHypothesis: "applies to evidence-led research",
    proposedScope: { scope: "project", ref: "prj_p15" },
    proposedPromotionClass: "GLOBAL",
    validationState: "validated",
    freshUntil: "2026-12-31T00:00:00.000Z",
    revalidateAfter: "2026-12-01T00:00:00.000Z",
    negativeKnowledge: ["do not skip evidence"],
    recoveryLesson: ["revert to prior method"],
    rollbackEvidenceId: "evd_p15-3-rollback",
    retractionEvidenceIds: [],
    provenanceEvidenceIds: ["evd_p15-3-learning-provenance"],
    ...overrides
  };
}

// ---------- static architecture graph ----------
const srcRoot = resolve(cleanRoom, "src");
const sourceFiles = execFileSync("git", ["ls-files", "clean-room/src"], { cwd: repoRoot }).toString("utf8").split("\n").filter((path) => path.endsWith(".ts"));
const sourceSet = new Set(sourceFiles);
const graph = new Map();
const escaping = [];
const foreignControlPlanes = [];

/** Runtime module edges only: type-only imports/exports are erased and cannot form a runtime cycle. */
function runtimeSpecifiers(path, text) {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const specifiers = [];
  const literal = (node) => (node && ts.isStringLiteralLike(node) ? node.text : undefined);
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      const typeOnly = clause
        ? Boolean(clause.isTypeOnly) || Boolean(clause.namedBindings && ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.every((element) => element.isTypeOnly))
        : false;
      if (!typeOnly) { const specifier = literal(statement.moduleSpecifier); if (specifier) specifiers.push(specifier); }
      continue;
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      const typeOnly = Boolean(statement.isTypeOnly)
        || Boolean(statement.exportClause && ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.every((element) => element.isTypeOnly));
      if (!typeOnly) { const specifier = literal(statement.moduleSpecifier); if (specifier) specifiers.push(specifier); }
      continue;
    }
    if (ts.isCallExpression(statement)) {
      const dynamicImport = statement.expression.kind === ts.SyntaxKind.ImportKeyword;
      const requireCall = ts.isIdentifier(statement.expression) && statement.expression.text === "require";
      if (dynamicImport || requireCall) { const specifier = literal(statement.arguments[0]); if (specifier) specifiers.push(specifier); }
    }
  }
  // dynamic imports nested inside functions are still runtime edges
  const visitNested = (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const specifier = literal(node.arguments[0]);
      if (specifier && !specifiers.includes(specifier)) specifiers.push(specifier);
    }
    ts.forEachChild(node, visitNested);
  };
  ts.forEachChild(sourceFile, visitNested);
  return specifiers.filter((specifier) => specifier.startsWith("."));
}

for (const path of sourceFiles) {
  const text = readFileSync(resolve(repoRoot, path), "utf8");
  const dependencies = [];
  for (const specifier of runtimeSpecifiers(path, text)) {
    const base = resolve(repoRoot, dirname(path), specifier.replace(/\.js$/, ".ts"));
    const asRepoPath = base.replace(repoRoot + "/", "");
    if (!asRepoPath.startsWith("clean-room/src/")) { escaping.push({ path, specifier }); continue; }
    if (sourceSet.has(asRepoPath)) dependencies.push(asRepoPath);
    else if (sourceSet.has(`${asRepoPath}/index.ts`)) dependencies.push(`${asRepoPath}/index.ts`);
  }
  graph.set(path, dependencies);
  for (const match of text.matchAll(/controlPlane\s*[:=]\s*["']([^"']+)["']/g)) {
    if (match[1] !== "command_center") foreignControlPlanes.push({ path, value: match[1] });
  }
}
function findCycle() {
  const state = new Map();
  const stack = [];
  const walk = (node) => {
    if (state.get(node) === "done") return null;
    if (state.get(node) === "active") return [...stack.slice(stack.indexOf(node)), node];
    state.set(node, "active");
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = walk(next);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(node, "done");
    return null;
  };
  for (const node of [...graph.keys()].sort()) {
    const cycle = walk(node);
    if (cycle) return cycle;
  }
  return null;
}
const cycle = findCycle();

// ---------- invariants ----------
invariant("single-owner-responsibilities", "Command Center owns each architectural responsibility exactly once", (check) => {
  check("core responsibility registry covers every core contract", () => {
    const registry = createCoreArchitectureResponsibilityRegistry();
    registry.assertCoreCoverage();
    expect(registry.list().length === 12, `expected 12 core responsibilities, got ${registry.list().length}`);
  });
  check("duplicate responsibility ownership is rejected", () => {
    const registry = new ArchitectureResponsibilityRegistry();
    const contract = { responsibility: "renderer", owner: "application-shell", truthSource: "browser renderer", expandable: false, critical: false, failureBehavior: "reject", verificationPath: "tests" };
    validateArchitectureResponsibility(contract);
    registry.register(contract);
    expectThrow(() => registry.register(contract), /already has an owner/, "second owner must be rejected");
  });
  check("single-owner assertion rejects competing owners", () => {
    assertSingleOwners({ renderer: ["application-shell"], router: ["application-shell"] });
    expectThrow(() => assertSingleOwners({ renderer: ["application-shell", "legacy-shell"] }), /exactly one owner/, "competing owners must be rejected");
  });
});

invariant("command-center-control-plane", "James' Command Center remains the only control plane above specialists", (check) => {
  check("specialist model without Command Center control plane is rejected", () => {
    const registry = new SpecialistBrainRegistry();
    registry.registerModel(specialistModel(), commandCenter);
    expectThrow(() => registry.registerModel(specialistModel({ key: "brn_p15-3-peer", controlPlane: "peer_brain" }), commandCenter), /controlling specialist control plane/, "peer control plane must be rejected");
  });
  check("specialist authority requires the command-center actor", () => {
    const registry = new SpecialistBrainRegistry();
    expectThrow(() => registry.registerModel(specialistModel(), { actor: "brn_p15-3-specialist", evidenceIds: ["evd_self"] }), /authority|Command Center/i, "specialist self-authorization must be rejected");
  });
  check("delegation controlled by any other orchestrator is rejected", () => {
    expectThrow(() => validateDelegatedAuthority(delegationEnvelope({ controllingOrchestrator: "specialist-orchestrator" }), 2, 0, 4, NOW), /Command Center must remain the controlling orchestrator/, "non-Command-Center orchestration must be rejected");
  });
  check("specialist projections cannot inherit unrelated scope", () => {
    const model = specialistModel();
    const registry = new SpecialistBrainRegistry();
    registry.registerModel(model, commandCenter);
    const projection = { specialistId: "brn_p15-3-specialist", specialistVersion: 1, companyId: "company:other", workClasses: ["research"], dataClasses: ["internal"], capabilityKeys: ["capability:research"], permissionKeys: ["repo:read"] };
    expectThrow(() => validateSpecialistProjection(model, projection), /unrelated company scope/i, "foreign company projection must be rejected");
  });
});

invariant("authority-narrows-never-expands", "Delegated authority can only narrow, never amplify", (check) => {
  check("equal-or-narrower delegation is accepted", () => {
    validateDelegatedAuthority(delegationEnvelope(), 2, 0, 4, NOW);
    validateDelegatedAuthority(delegationEnvelope({ childScopes: [] }), 2, 0, 4, NOW);
  });
  check("scope amplification is rejected", () => {
    expectThrow(() => validateDelegatedAuthority(delegationEnvelope({ childScopes: ["repo:read", "admin:all"] }), 2, 0, 4, NOW), /amplification blocked/, "child scope superset must be rejected");
  });
  check("budget, concurrency, retry and resource amplification are rejected", () => {
    const admission = { monetaryBudgetCents: 0, maxConcurrent: 2, maxQueueDepth: 10, maxRetries: 2, maxRuntimeMs: 60000 };
    for (const override of [
      { childAdmission: { ...admission, monetaryBudgetCents: 1 } },
      { childAdmission: { ...admission, maxConcurrent: 3 } },
      { childAdmission: { ...admission, maxQueueDepth: 11 } },
      { childAdmission: { ...admission, maxRetries: 3 } },
      { childAdmission: { ...admission, maxRuntimeMs: 60001 } },
      { childResourceLimits: { workers: 3 } }
    ]) {
      expectThrow(() => validateDelegatedAuthority(delegationEnvelope(override), 2, 0, 4, NOW), /amplification blocked/, `amplification must be rejected for ${JSON.stringify(override)}`);
    }
  });
  check("revoked, stale-policy and expired delegation is rejected", () => {
    expectThrow(() => validateDelegatedAuthority(delegationEnvelope({ revoked: true }), 2, 0, 4, NOW), /revoked/, "revoked delegation must be rejected");
    expectThrow(() => validateDelegatedAuthority(delegationEnvelope({ currentPolicyVersion: "policy:p15@2" }), 2, 0, 4, NOW), /stale/, "stale policy delegation must be rejected");
    expectThrow(() => validateDelegatedAuthority(delegationEnvelope(), 2, 0, 4, "2026-11-02T00:00:00.000Z"), /expired/, "expired delegation must be rejected");
  });
  check("execution scope containment is directional", () => {
    assertScopeContains({ ownerId: "owner:p15", environment: "normal_chat" }, { ownerId: "owner:p15", environment: "normal_chat", projectId: "project:p15" });
    expectThrow(() => assertScopeContains({ ownerId: "owner:p15", environment: "normal_chat", projectId: "project:p15" }, { ownerId: "owner:p15", environment: "normal_chat" }), /amplification or mismatch/, "widening scope must be rejected");
    expectThrow(() => assertScopeContains({ ownerId: "owner:p15", environment: "normal_chat" }, { ownerId: "owner:other", environment: "normal_chat" }), /amplification or mismatch/, "foreign owner scope must be rejected");
  });
});

invariant("canonical-registries", "Canonical registries stay canonical and reject incompatible or duplicated entries", (check) => {
  check("duplicate registry keys and version regressions are rejected", () => {
    const registry = new Registry();
    registry.register({ key: "k", version: 1, enabled: true });
    expectThrow(() => registry.register({ key: "k", version: 1, enabled: true }), /already exists/, "duplicate key must be rejected");
    expectThrow(() => registry.replace({ key: "k", version: 1, enabled: false }, 1), /must advance/, "version must advance");
    expectThrow(() => registry.replace({ key: "k", version: 2, enabled: false }, 9), /version conflict/, "stale expected version must be rejected");
  });
  check("incompatible capability versions are rejected and unregistration is residue-free", () => {
    const capabilities = new CapabilityRegistry();
    capabilities.register(capabilityContract());
    capabilities.assertCompatible("capability:p15-3", 1, 1);
    expectThrow(() => capabilities.assertCompatible("capability:p15-3", 2, 1), /input version incompatible/, "incompatible input version must be rejected");
    expectThrow(() => capabilities.register(capabilityContract()), /already exists/, "duplicate capability must be rejected");
    expectThrow(() => capabilities.register(capabilityContract({ key: "p15-3", version: 1 })), /must start with capability:/, "non-canonical capability key must be rejected");
    capabilities.unregister("capability:p15-3", 1);
    expect(capabilities.list().length === 0, "unregistration must leave no residue");
    expectThrow(() => capabilities.assertCompatible("capability:p15-3", 1, 1), /unavailable/, "removed capability must be unavailable");
  });
  check("method contracts require provenance, benchmark and rollback evidence", () => {
    const portfolio = new CapabilityMethodPortfolio();
    portfolio.register(methodContract());
    expectThrow(() => portfolio.register(methodContract()), /already exists/, "duplicate method must be rejected");
    for (const field of ["benchmarkEvidenceIds", "outcomeEvidenceIds", "provenanceEvidenceIds"]) {
      expectThrow(() => portfolio.register(methodContract({ key: `mth_p15-3-${field}`, [field]: [] })), /evidence|requires at least one/i, `missing ${field} must be rejected`);
    }
  });
});

invariant("no-duplicate-control-plane-and-acyclic-dependencies", "One architecture: acyclic module graph, no escaping or legacy edges, no foreign control plane", (check) => {
  check("no static relative import cycle exists across active source", () => {
    expect(!cycle, `import cycle detected: ${(cycle ?? []).join(" -> ")}`);
  });
  check("no active source import escapes clean-room/src", () => {
    expect(escaping.length === 0, `imports escape the active source root: ${JSON.stringify(escaping.slice(0, 5))}`);
  });
  check("no active source declares a competing control plane", () => {
    expect(foreignControlPlanes.length === 0, `foreign control plane declared: ${JSON.stringify(foreignControlPlanes.slice(0, 5))}`);
  });
  check("legacy runtime imports are rejected", () => {
    assertNoLegacyRuntimeImports(["../kernel/index.js", "./scope.js"]);
    expectThrow(() => assertNoLegacyRuntimeImports(["../legacy/runtime.js"]), /Legacy runtime import prohibited/, "legacy import must be rejected");
  });
});

invariant("registration-only-extension", "Representative capabilities and specialists extend and retire without mutating architecture", (check) => {
  check("capability can be added through registration and removed cleanly", () => {
    const capabilities = new CapabilityRegistry();
    const before = capabilities.list().length;
    capabilities.register(capabilityContract());
    expect(capabilities.list().length === before + 1, "registration must be the only extension step");
    capabilities.unregister("capability:p15-3", 1);
    expect(capabilities.list().length === before, "removal must restore the prior portfolio");
  });
  check("specialist can be registered, versioned and retired through the registry", () => {
    const registry = new SpecialistBrainRegistry();
    registry.registerModel(specialistModel(), commandCenter);
    registry.replaceModel(specialistModel({ version: 2, reliabilityScore: 0.95 }), 1, commandCenter);
    const retired = registry.retireModel("brn_p15-3-specialist", 2, commandCenter);
    expect(retired.lifecycle === "retired" && retired.enabled === false, "retirement must disable the specialist");
    expect(retired.learningEligibility === "none", "retired specialist cannot remain learning-eligible");
  });
  check("protected side effects require fresh exact authorization", () => {
    const base = { projectId: "project:p15", projectLockProjectId: "project:p15", requestedScopes: ["repo:read"], credential: { id: "cred:one", provider: "github", allowedScopes: ["repo:read"], projectId: "project:p15" }, toolHealthy: true, authorizationFresh: true, protectedActionAuthorized: true };
    assertProtectedPreflight(base);
    expectThrow(() => assertProtectedPreflight({ ...base, authorizationFresh: false }), /fresh exact authorization/, "stale authorization must be rejected");
    expectThrow(() => assertProtectedPreflight({ ...base, requestedScopes: ["admin:all"] }), /Credential scope denied/, "credential scope escape must be rejected");
    expectThrow(() => assertProtectedPreflight({ ...base, projectLockProjectId: "project:other" }), /mismatch/, "project lock mismatch must be rejected");
  });
});

invariant("learning-cannot-become-global-truth", "Unsupported learning cannot silently become global truth", (check) => {
  const readiness = (overrides = {}) => ({ epistemicsReady: true, evaluatorReady: true, negativeKnowledgeReady: true, traceReady: true, recoveryReady: true, ...overrides });
  check("private learning cannot be proposed for global promotion", () => {
    const governor = new LearningPromotionGovernor();
    expectThrow(() => governor.submit(learningPacket({ proposedPromotionClass: "GLOBAL", proposedScope: { scope: "global" } }), NOW), /cannot request global promotion/, "private global promotion must be rejected");
  });
  check("validated project learning promotes only at its own scope", () => {
    const governor = new LearningPromotionGovernor();
    governor.submit(learningPacket({ proposedPromotionClass: "PROJECT" }), NOW);
    const decision = governor.decide("lrn_p15-3", "prm_p15-3", readiness(), ["evaluator:p15-3"], NOW);
    expect(decision.classification === "PROJECT", `expected PROJECT classification, got ${decision.classification}`);
    expect(decision.lifecycle === "promoted", `expected promoted lifecycle, got ${decision.lifecycle}`);
    expect(decision.executablePolicy === false, "promotions must not become executable policy directly");
  });
  check("unvalidated, stale, contradicted and retracted learning cannot stay promoted", () => {
    const governor = new LearningPromotionGovernor();
    governor.submit(learningPacket({ proposedPromotionClass: "PROJECT", validationState: "unvalidated" }), NOW);
    expect(governor.decide("lrn_p15-3", "prm_unvalidated", readiness(), ["evaluator:p15-3"], NOW).classification === "REJECTED", "unvalidated learning must be rejected");
    governor.submit(learningPacket({ version: 2, proposedPromotionClass: "PROJECT" }), NOW);
    expect(governor.decide("lrn_p15-3", "prm_stale", readiness(), ["evaluator:p15-3"], LATER).classification === "QUARANTINED", "stale learning must be quarantined");
    const retracted = governor.retract("prm_unvalidated", "evd_p15-3-retraction", NOW);
    expect(retracted.lifecycle === "retracted" && retracted.executablePolicy === false, "retraction must deprecate the promotion");
  });
  check("global promotion requires every readiness dependency", () => {
    const governor = new LearningPromotionGovernor();
    governor.submit(learningPacket({ proposedPromotionClass: "GLOBAL", privacy: { classification: "ecosystem_shared", scopeRef: "ecosystem" }, proposedScope: { scope: "global" } }), NOW);
    const blocked = governor.decide("lrn_p15-3", "prm_global-blocked", readiness({ evaluatorReady: false }), ["evaluator:p15-3"], NOW);
    expect(blocked.lifecycle === "quarantined", `missing readiness must quarantine, got ${blocked.lifecycle}`);
    const promoted = governor.decide("lrn_p15-3", "prm_global", readiness(), ["evaluator:p15-3"], NOW);
    expect(promoted.lifecycle === "promoted", `fully supported global promotion must promote, got ${promoted.lifecycle}`);
  });
});

invariant("self-improvement-cannot-mutate-authority", "Self-improvement cannot install itself or expand scope, permission or authority", (check) => {
  const plan = { proposalId: "improvement:p15-3", applicabilityRefs: ["scope:project:p15"], requestedPermissionRefs: ["repo:read"], minimumEffectConfidence: 0.8, maximumCanaryFraction: 0.1, rollbackCheckpointRef: "checkpoint:p15-3", evidenceRefs: ["evd_p15-3-plan"] };
  const proposal = { id: "improvement:p15-3", evidenceRefs: ["evd_p15-3-proposal"], installsAutomatically: false };
  check("a self-installing proposal is rejected", () => {
    const governor = new SelfImprovementGovernor();
    expectThrow(() => governor.register({ ...proposal, installsAutomatically: true }, plan, "owner:james", NOW), /cannot self-install/, "automatic install must be rejected");
  });
  check("scope and permission expansion are rejected", () => {
    const governor = new SelfImprovementGovernor();
    governor.register(proposal, plan, "owner:james", NOW);
    expectThrow(() => governor.confirmScope("improvement:p15-3", 1, ["scope:company:p15"], ["repo:read"], "owner:james", NOW, ["evd_p15-3-scope"]), /scope expansion is not allowed/, "scope expansion must be rejected");
    expectThrow(() => governor.confirmScope("improvement:p15-3", 1, ["scope:project:p15"], ["repo:write"], "owner:james", NOW, ["evd_p15-3-scope"]), /permission expansion is not allowed/, "permission expansion must be rejected");
  });
  check("snapshots bound to stale policy or invalidated learning are rejected", () => {
    const authority = { now: NOW, policyEpoch: 3, revocationEpoch: 3, invalidatedLearningRefs: ["learning:invalidated"] };
    const snapshot = { id: "snapshot:p15-3", proposalId: "improvement:p15-3", traceRef: "trace:one", baselineRef: "baseline:one", acceptanceFingerprint: "sha256:one", rollbackCheckpointRef: "checkpoint:one", capturedAt: NOW, policyEpoch: 3, revocationEpoch: 3, exactVersionRefs: ["version:one"], learningRefs: ["learning:valid"], permissionRefs: [], evidenceRefs: ["evd_p15-3-snapshot"] };
    validateImprovementSnapshot(snapshot, authority);
    expectThrow(() => validateImprovementSnapshot({ ...snapshot, policyEpoch: 2 }, authority), /policy is stale/, "stale policy snapshot must be rejected");
    expectThrow(() => validateImprovementSnapshot({ ...snapshot, revocationEpoch: 2 }, authority), /revocation state is stale/, "stale revocation snapshot must be rejected");
    expectThrow(() => validateImprovementSnapshot({ ...snapshot, learningRefs: ["learning:invalidated"] }, authority), /invalidated learning/, "invalidated learning dependency must be rejected");
  });
});

invariant("evidence-and-provenance-controls", "Evidence, provenance, confidence, risk, cost and privacy controls remain enforced", (check) => {
  check("method registration rejects unsupported evidence and expiry ordering", () => {
    const portfolio = new CapabilityMethodPortfolio();
    expectThrow(() => portfolio.register(methodContract({ rollbackEvidenceId: "" })), /rollback|evidence|identifier/i, "missing rollback evidence must be rejected");
    expectThrow(() => portfolio.register(methodContract({ revalidateAfter: NOW })), /revalidat/i, "revalidation ordering must be enforced");
    expectThrow(() => portfolio.register(methodContract({ securityAssurance: 2 })), /security/i, "confidence/assurance bounds must be enforced");
  });
  check("capability maturity cannot be inflated without proof", () => {
    const capabilities = new CapabilityRegistry();
    capabilities.register(capabilityContract());
    expectThrow(() => capabilities.register(capabilityContract({ key: "capability:p15-3-proven", maturity: "portfolio_proven" })), /proof resolver|proof receipts/, "unproven maturity must be rejected");
    expectThrow(() => capabilities.register(capabilityContract({ key: "capability:p15-3-critical", maturity: "critical_shared_proven", criticalShared: true })), /proof resolver|proof receipts|critical evidence/i, "unproven critical maturity must be rejected");
  });
});

const failed = results.filter((result) => !result.passed);
const summary = {
  phaseId: "P15.3",
  invariantCount: results.length,
  checkCount: results.reduce((total, result) => total + result.checks.length, 0),
  failedInvariantCount: failed.length,
  sourceFileCount: sourceFiles.length,
  importEdgeCount: [...graph.values()].reduce((total, list) => total + list.length, 0),
  invariants: results
};

if (write && failed.length === 0) {
  const inputs = [
    "clean-room/src/kernel/invariants.ts",
    "clean-room/src/kernel/architecture-contract.ts",
    "clean-room/src/kernel/registry.ts",
    "clean-room/src/kernel/registries.ts",
    "clean-room/src/kernel/scope.ts",
    "clean-room/src/kernel/capabilities.ts",
    "clean-room/src/kernel/method-portfolio.ts",
    "clean-room/src/agency/delegation.ts",
    "clean-room/src/agency/protected.ts",
    "clean-room/src/brain/specialists.ts",
    "clean-room/src/brain/improvement-governor.ts",
    "clean-room/src/data/learning.ts",
    "clean-room/scripts/p15-3-architecture-invariants-audit.mjs",
    "clean-room/scripts/phase-receipt-binding.mjs",
    "clean-room/tests/p15-3-architecture-invariants.test.mjs"
  ].filter((path) => existsSync(resolve(repoRoot, path)));
  const receipt = buildPhaseReceipt({
    phaseId: "P15.3",
    headSha,
    inputs,
    evidence: [
      "clean-room/scripts/p15-3-architecture-invariants-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/tests/p15-3-architecture-invariants.test.mjs",
      "clean-room/scripts/check-architecture-contracts.mjs",
      "clean-room/tests/kernel-foundation.test.mjs",
      "clean-room/tests/runtime-integration.test.mjs"
    ],
    summary
  });
  mkdirSync(resolve(repoRoot, "clean-room/evidence/phase-receipts"), { recursive: true });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_3.json"), `${JSON.stringify(receipt, null, 2)}\n`);
}

console.log(JSON.stringify({ ...summary, invariants: results.map((result) => ({ id: result.id, passed: result.passed, checks: result.checks.length, failed: result.checks.filter((entry) => !entry.passed) })) }));
if (failed.length > 0) {
  console.error(`P15.3 architecture invariant audit failed ${failed.length} invariant(s)`);
  for (const result of failed) for (const check of result.checks.filter((entry) => !entry.passed)) console.error(`- ${result.id} :: ${check.name}: ${check.error}`);
  process.exit(1);
}
