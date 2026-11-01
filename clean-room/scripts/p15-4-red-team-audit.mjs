/**
 * P15.4 — security, privacy, cross-Brain-transfer and protected-action red team.
 *
 * Every case is a real adversarial exercise against the compiled nonproduction
 * implementation with controlled fixtures: stale/revoked sessions, protected
 * action bypass, intent tampering, cross-project and cross-company isolation,
 * privacy minimisation, leak prevention, credential handling, replay and
 * fail-closed behaviour when policy or provider state is uncertain.
 *
 * Exit code 0 only when no critical/high boundary failure remains. --write emits
 * the phase receipt bound to the exact audited inputs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  AuthSessionStore,
  ProtectedActionGate,
  PolicyEngine,
  DeviceRegistry,
  createIntentBinding,
  assertIntentBinding,
  evaluateDataBoundary,
  assertDataBoundary,
  projectForSurface,
  clipboardProjection,
  classifyDataField,
  assertNotBrainMemory,
  assertNotStoredAsNote,
  assertNoServiceRoleKeyInClient,
  assertWithinBoundary,
  revokeShareLink,
  assertShareLinkActive,
  assertShareLinkScope,
  robotsPolicy,
  assertNoSearchIndexing,
  assertMetadataSafe
} from "../dist/security/index.js";
import { validateLearningPacket } from "../dist/data/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const NOW = "2026-11-01T00:00:00.000Z";
const LATER = "2026-11-01T02:00:00.000Z";
const STALE = "2026-11-01T03:00:00.000Z";
const boundaries = [];
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const expectThrow = (run, pattern, message) => {
  try { run(); } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected rejection "${error.message}"`);
    return;
  }
  throw new Error(`${message}: the attack succeeded and must be blocked`);
};

const scope = { ownerId: "owner:james", projectId: "prj_p15", companyId: "cmp_p15", environment: "test" };

function session(overrides = {}) {
  return {
    id: "ses_p15",
    ownerId: scope.ownerId,
    companyId: scope.companyId,
    projectId: scope.projectId,
    environment: "test",
    assurance: "fresh_passkey_uv",
    scopes: ["recovery:read", "recovery:restore"],
    state: "active",
    createdAt: "2026-10-31T22:00:00.000Z",
    expiresAt: LATER,
    lastValidatedAt: NOW,
    lastVerifiedAt: NOW,
    ...overrides
  };
}

function protectedFixture(policyOverrides = {}) {
  const sessions = new AuthSessionStore();
  const policies = new PolicyEngine();
  const devices = new DeviceRegistry();
  sessions.register(session());
  policies.register({
    action: "recovery.restore",
    version: 1,
    enabled: true,
    riskClass: "high",
    requiredScopes: ["recovery:restore"],
    minimumAssurance: "fresh_passkey_uv",
    freshVerificationMaxAgeMs: 300000,
    ownerOnly: true,
    allowProjectWildcard: false,
    ...policyOverrides
  });
  return { sessions, policies, devices, gate: new ProtectedActionGate(sessions, policies, devices) };
}

function protectedRequest(overrides = {}) {
  return {
    sessionId: "ses_p15",
    action: "recovery.restore",
    resourceOwnerId: scope.ownerId,
    resourceProjectId: scope.projectId,
    resourceCompanyId: scope.companyId,
    resourceEnvironment: "test",
    now: NOW,
    ...overrides
  };
}

function intent(overrides = {}) {
  return {
    action: "recovery.restore",
    ownerId: scope.ownerId,
    scope: { ownerId: scope.ownerId, projectId: scope.projectId, companyId: scope.companyId, environment: "test" },
    targetResourceId: "backup:one",
    parameters: { mode: "full" },
    maximumCostCents: 0,
    ...overrides
  };
}

function learningPacket(overrides = {}) {
  return {
    id: "lrn_p15-4",
    version: 1,
    sourceBrainId: "brn_p15-4",
    sourceSystemRef: "command-center",
    sourceCompanyId: "cmp_a",
    sourceProjectId: "prj_a",
    sourceMethodId: "mth_p15-4",
    sourceMethodVersion: 1,
    sourceCapabilityKey: "capability:research",
    observedAt: "2026-10-31T20:00:00.000Z",
    taskClass: "research",
    domainId: "dom_research",
    conditionIds: ["cnd_one"],
    constraints: ["constraint:low-cost"],
    discovery: "Evidence-first routing reduced rework",
    action: "Route research through evidence-first method",
    evidenceIds: ["evd_p15-4-learning"],
    sourceRefs: ["run_p15-4"],
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
    privacy: { classification: "project_private", scopeRef: "prj_a" },
    securityImplications: [],
    applicableSystems: ["command-center"],
    transferabilityHypothesis: "applies to evidence-led research",
    proposedScope: { scope: "project", ref: "prj_a" },
    proposedPromotionClass: "PROJECT",
    validationState: "validated",
    freshUntil: "2026-12-31T00:00:00.000Z",
    revalidateAfter: "2026-12-01T00:00:00.000Z",
    negativeKnowledge: ["do not skip evidence"],
    recoveryLesson: ["revert to prior method"],
    rollbackEvidenceId: "evd_p15-4-rollback",
    retractionEvidenceIds: [],
    provenanceEvidenceIds: ["evd_p15-4-provenance"],
    ...overrides
  };
}

function suite(id, description, severity, body) {
  const checks = [];
  const check = (name, run) => {
    try { run(); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  body(check);
  const failed = checks.filter((entry) => !entry.passed);
  boundaries.push({ id, description, severity, passed: failed.length === 0, checks });
}

suite("session-identity-and-staleness", "Stale, revoked, expired and time-travelled sessions cannot authorize anything", "critical", (check) => {
  check("expired session is rejected", () => {
    const sessions = new AuthSessionStore();
    sessions.register(session({ id: "ses_expiring", expiresAt: "2026-11-01T00:30:00.000Z" }));
    expectThrow(() => sessions.validateLive("ses_expiring", LATER), /expired|live|invalid/i, "expired session must be rejected");
  });
  check("revoked session cannot be resurrected by a later valid call", () => {
    const sessions = new AuthSessionStore();
    sessions.register(session({ id: "ses_revoked" }));
    sessions.revoke("ses_revoked", NOW, "owner_request");
    expectThrow(() => sessions.validateLive("ses_revoked", NOW), /revoked|invalid|state/i, "revoked session must stay dead");
  });
  check("backward session time is rejected", () => {
    const sessions = new AuthSessionStore();
    sessions.register(session({ id: "ses_time" }));
    expectThrow(() => sessions.validateLive("ses_time", "2026-10-31T21:00:00.000Z"), /not yet valid|backward/i, "time travel must be impossible");
  });
});

suite("protected-action-bypass", "Protected actions require a live session, fresh verification, exact scope and matching intent", "critical", (check) => {
  check("exact authorized protected action succeeds", () => {
    const { gate } = protectedFixture();
    const decision = gate.authorize(protectedRequest());
    expect(decision.allowed === true, `expected allow, got ${JSON.stringify(decision)}`);
  });
  check("policy unavailability fails closed", () => {
    const { gate } = protectedFixture();
    expectThrow(() => gate.authorize(protectedRequest({ policyAvailable: false })), /denied|unavailable|policy/i, "unknown policy must deny");
  });
  check("stale revocation state fails closed", () => {
    const { gate } = protectedFixture();
    expectThrow(() => gate.authorize(protectedRequest({ revocationStateFresh: false })), /denied|revocation|policy/i, "stale revocation state must deny");
  });
  check("missing or insufficient assurance is rejected", () => {
    const weak = protectedFixture();
    weak.sessions.register(session({ id: "ses_weak", assurance: "authenticated" }));
    expectThrow(() => weak.gate.authorize(protectedRequest({ sessionId: "ses_weak" })), /denied|assurance|fresh/i, "insufficient assurance must deny");
  });
  check("stale fresh-verification timestamp is rejected", () => {
    const fixture = protectedFixture();
    fixture.sessions.register(session({ id: "ses_old", lastVerifiedAt: "2026-10-31T23:00:00.000Z" }));
    expectThrow(() => fixture.gate.authorize(protectedRequest({ sessionId: "ses_old" })), /denied|fresh|verification/i, "stale verification must deny");
  });
  check("cross-project, cross-company and cross-environment protected actions are denied", () => {
    const { gate } = protectedFixture();
    for (const override of [
      { resourceProjectId: "prj_other" },
      { resourceCompanyId: "cmp_other" },
      { resourceEnvironment: "production" },
      { resourceOwnerId: "owner:other" }
    ]) {
      expectThrow(() => gate.authorize(protectedRequest(override)), /denied|mismatch|policy|owner/i, `protected action must deny ${JSON.stringify(override)}`);
    }
  });
  check("tampered intent is rejected even with a valid session", () => {
    const { gate } = protectedFixture();
    const authorized = createIntentBinding(intent());
    gate.authorize(protectedRequest({ intent: intent(), authorizationIntentBinding: authorized }));
    const tampered = intent({ targetResourceId: "backup:other" });
    expectThrow(() => gate.authorize(protectedRequest({ intent: tampered, authorizationIntentBinding: authorized })), /changed after authorization|mismatch/i, "tampered intent must be rejected");
    expectThrow(() => gate.authorize(protectedRequest({ intent: intent({ action: "recovery.read" }), authorizationIntentBinding: createIntentBinding(intent({ action: "recovery.read" })) })), /action\/owner mismatch|denied/i, "intent/action mismatch must be rejected");
  });
});

suite("cross-project-company-isolation", "Project, company, account and environment data never cross boundaries", "critical", (check) => {
  const grant = { ownerId: scope.ownerId, projectIds: ["prj_p15"], businessIds: ["biz_p15"], companyIds: ["cmp_p15"], accountIds: ["acc_p15"], environments: ["test"], operations: ["read", "write"] };
  check("exact boundary grant is allowed", () => {
    assertDataBoundary(grant, { ownerId: scope.ownerId, projectId: "prj_p15", companyId: "cmp_p15", businessId: "biz_p15", accountId: "acc_p15", environment: "test", sensitivity: "protected" }, "read");
  });
  check("every boundary mismatch is denied", () => {
    for (const boundary of [
      { ownerId: "owner:other", projectId: "prj_p15", businessId: "biz_p15", sensitivity: "internal" },
      { ownerId: scope.ownerId, projectId: "prj_other", businessId: "biz_p15", sensitivity: "internal" },
      { ownerId: scope.ownerId, companyId: "cmp_other", businessId: "biz_p15", sensitivity: "internal" },
      { ownerId: scope.ownerId, businessId: "biz_other", sensitivity: "internal" },
      { ownerId: scope.ownerId, accountId: "acc_other", businessId: "biz_p15", sensitivity: "internal" },
      { ownerId: scope.ownerId, environment: "production", businessId: "biz_p15", sensitivity: "internal" }
    ]) {
      const decision = evaluateDataBoundary(grant, boundary, "read");
      expect(decision.allowed === false, `boundary must deny ${JSON.stringify(boundary)}`);
    }
  });
  check("write access is not implied by read grants", () => {
    const readOnly = { ...grant, operations: ["read"] };
    expect(evaluateDataBoundary(readOnly, { ownerId: scope.ownerId, projectId: "prj_p15", businessId: "biz_p15", sensitivity: "internal" }, "write").allowed === false, "read grant must not imply write");
  });
});

suite("cross-brain-transfer", "Private or scoped learning cannot be transferred across Brain, project or company scope", "critical", (check) => {
  check("project-private learning cannot cross project scope", () => {
    expectThrow(() => validateLearningPacket(learningPacket({ privacy: { classification: "project_private", scopeRef: "prj_a" }, sourceProjectId: "prj_b" }), NOW), /cannot cross project scope/, "cross-project private learning must be rejected");
  });
  check("company-private learning cannot cross company scope", () => {
    expectThrow(() => validateLearningPacket(learningPacket({ privacy: { classification: "company_private", scopeRef: "cmp_a" }, sourceCompanyId: "cmp_b" }), NOW), /cannot cross company scope/, "cross-company private learning must be rejected");
  });
  check("private learning cannot request global promotion", () => {
    expectThrow(() => validateLearningPacket(learningPacket({ privacy: { classification: "project_private", scopeRef: "prj_a" }, proposedScope: { scope: "global" } }), NOW), /cannot request global promotion/, "private global promotion must be rejected");
  });
  check("learning without evidence, provenance or rollback authority is rejected", () => {
    expectThrow(() => validateLearningPacket(learningPacket({ evidenceIds: [] }), NOW), /evidence|requires at least one/i, "evidence-free learning must be rejected");
    expectThrow(() => validateLearningPacket(learningPacket({ provenanceEvidenceIds: [] }), NOW), /provenance/i, "provenance-free learning must be rejected");
  });
  check("stale validated learning cannot remain validated", () => {
    expectThrow(() => validateLearningPacket(learningPacket({ freshUntil: "2026-11-01T00:00:00.000Z" }), "2026-11-02T00:00:00.000Z"), /stale|fresh/i, "stale learning must not remain validated");
  });
});

suite("privacy-and-data-minimisation", "Sensitive and secret values are minimised per surface and never stored or copied", "high", (check) => {
  const secret = classifyDataField("api_token", "secret");
  const sensitive = classifyDataField("bank_account", "sensitive");
  const publicField = classifyDataField("title", "public");
  check("secret fields are redacted on every surface", () => {
    for (const surface of ["brain_context", "logs", "notifications", "export", "clipboard"]) {
      const [projected] = projectForSurface([secret], surface, { explicitExport: true });
      expect(projected.redacted === true, `secret must be redacted on ${surface}`);
    }
  });
  check("sensitive fields are redacted unless an explicit export is authorized", () => {
    expect(projectForSurface([sensitive], "export")[0].redacted === true, "sensitive export must be redacted by default");
    expect(projectForSurface([sensitive], "export", { explicitExport: true })[0].redacted === false, "explicit export must allow sensitive data");
    expect(projectForSurface([sensitive], "logs", { explicitExport: true })[0].redacted === true, "logs must stay redacted");
    expect(projectForSurface([publicField], "logs")[0].redacted === false, "public data stays visible");
  });
  check("clipboard and credential storage boundaries are enforced", () => {
    expectThrow(() => clipboardProjection(secret, true), /cannot be copied/, "secrets cannot be copied");
    expect(clipboardProjection(sensitive, false).redacted === true, "unconfirmed sensitive clipboard must redact");
    expectThrow(() => assertNotBrainMemory({ kind: "api_token", classification: "private" }), /cannot be stored in Brain memory/, "tokens cannot enter memory");
    expectThrow(() => assertNotStoredAsNote({ kind: "mfa_secret", classification: "private" }), /cannot be stored as normal project notes/, "MFA secrets cannot become notes");
    expectThrow(() => assertNoServiceRoleKeyInClient("const key = SUPABASE_SERVICE_ROLE_KEY;"), /Service-role keys/, "service-role keys cannot appear in client code");
  });
  check("role boundaries cannot read above their class", () => {
    expectThrow(() => assertWithinBoundary({ role: "worker", allowedClasses: ["public", "private"] }, sensitive), /cannot access sensitive data/, "role escalation must be blocked");
  });
});

suite("leak-prevention", "Share links, indexing, metadata and URLs cannot leak private data", "high", (check) => {
  const link = { id: "share:one", scope: "public_preview", expiresAt: LATER, revokedAt: null };
  check("revoked and expired share links are rejected", () => {
    assertShareLinkActive(link, NOW);
    expectThrow(() => assertShareLinkActive(revokeShareLink(link, NOW), NOW), /revoked/, "revoked link must be rejected");
    expectThrow(() => assertShareLinkActive(link, STALE), /expired/, "expired link must be rejected");
  });
  check("share link scope cannot be widened", () => {
    expectThrow(() => assertShareLinkScope(link, ["internal"]), /not permitted/, "unlisted scope must be rejected");
  });
  check("a private PWA can never be search-indexable", () => {
    assertNoSearchIndexing(robotsPolicy(true));
    expectThrow(() => assertNoSearchIndexing(robotsPolicy(false)), /must not be indexable/, "indexable private PWA must be rejected");
  });
  check("public metadata cannot carry project data", () => {
    assertMetadataSafe({ title: "Command Center" }, ["projectName", "clientName"]);
    expectThrow(() => assertMetadataSafe({ title: "Command Center", clientName: "Acme" }, ["projectName", "clientName"]), /must not carry project data/, "project data in metadata must be rejected");
  });
});

suite("replay-and-uncertain-side-effects", "Replay, tampering and uncertain outcomes cannot duplicate or amplify side effects", "high", (check) => {
  check("intent binding is deterministic and parameter-sensitive", () => {
    const baseline = createIntentBinding(intent());
    expect(createIntentBinding(intent()) === baseline, "identical intent must produce an identical binding");
    expect(createIntentBinding(intent({ parameters: { mode: "partial" } })) !== baseline, "parameter change must change the binding");
    expect(createIntentBinding(intent({ maximumCostCents: 1 })) !== baseline, "cost change must change the binding");
    expectThrow(() => assertIntentBinding(intent({ targetResourceId: "backup:other" }), baseline), /changed after authorization/, "changed target must be rejected");
    expectThrow(() => assertIntentBinding(intent(), ""), /Authorized intent binding is required/, "empty binding must be rejected");
  });
  check("unsupported intent parameter shapes are rejected", () => {
    expectThrow(() => createIntentBinding(intent({ parameters: { nested: { bad: Symbol("x") } } })), /unsupported value/, "symbol parameters must be rejected");
    expectThrow(() => createIntentBinding(intent({ parameters: { bad: Number.NaN } })), /non-finite/, "non-finite parameters must be rejected");
    const cyclic = {};
    cyclic.self = cyclic;
    expectThrow(() => createIntentBinding(intent({ parameters: cyclic })), /cycles/, "cyclic parameters must be rejected");
  });
});

const failed = boundaries.filter((boundary) => !boundary.passed);
const criticalFailures = failed.filter((boundary) => boundary.severity === "critical" || boundary.severity === "high");
const summary = {
  phaseId: "P15.4",
  suiteCount: boundaries.length,
  checkCount: boundaries.reduce((total, boundary) => total + boundary.checks.length, 0),
  failedSuiteCount: failed.length,
  criticalFailureCount: criticalFailures.length,
  suites: boundaries
};

if (write && criticalFailures.length === 0) {
  const inputs = [
    "clean-room/src/security/auth.ts",
    "clean-room/src/security/policy.ts",
    "clean-room/src/security/protected-gate.ts",
    "clean-room/src/security/protected-actions.ts",
    "clean-room/src/security/intent.ts",
    "clean-room/src/security/boundaries.ts",
    "clean-room/src/security/data-sensitivity.ts",
    "clean-room/src/security/leak-prevention.ts",
    "clean-room/src/security/devices.ts",
    "clean-room/src/data/learning.ts",
    "clean-room/scripts/p15-4-red-team-audit.mjs",
    "clean-room/scripts/phase-receipt-binding.mjs",
    "clean-room/tests/p15-4-red-team.test.mjs"
  ].filter((path) => existsSync(resolve(repoRoot, path)));
  const receipt = buildPhaseReceipt({
    phaseId: "P15.4",
    headSha,
    inputs,
    evidence: [
      "clean-room/scripts/p15-4-red-team-audit.mjs",
      "clean-room/tests/p15-4-red-team.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/tests/security-foundation.test.mjs",
      "clean-room/tests/p14-security-boundaries.test.mjs",
      "clean-room/tests/category2-p29-adversarial-security.test.mjs"
    ],
    summary
  });
  mkdirSync(resolve(repoRoot, "clean-room/evidence/phase-receipts"), { recursive: true });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_4.json"), `${JSON.stringify(receipt, null, 2)}\n`);
}

console.log(JSON.stringify({ ...summary, suites: boundaries.map((boundary) => ({ id: boundary.id, severity: boundary.severity, passed: boundary.passed, failed: boundary.checks.filter((entry) => !entry.passed) })) }));
if (criticalFailures.length > 0) {
  console.error(`P15.4 red team found ${criticalFailures.length} unresolved critical/high boundary failure(s)`);
  for (const boundary of criticalFailures) for (const check of boundary.checks.filter((entry) => !entry.passed)) console.error(`- ${boundary.id} :: ${check.name}: ${check.error}`);
  process.exit(1);
}
