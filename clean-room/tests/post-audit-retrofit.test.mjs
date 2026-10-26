import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CapabilityRegistry,
  OperationJournal,
  RecoveryAuthorizationStore,
  assertScopeContains,
  authorizeProtectedRecovery,
  evaluateAdmission,
  evaluateProtectedRecovery,
  validateRequirementClosure,
  validateTrustedEnvironment,
  zeroBudgetPolicy
} from "../dist/kernel/index.js";
import {
  AuthSessionStore,
  EncryptionKeyRegistry,
  PolicyEngine,
  ProtectedActionGate,
  SecretReferenceRegistry,
  WebhookAcceptanceGate,
  createIntentBinding,
  evaluateDataBoundary
} from "../dist/security/index.js";

const NOW = "2026-10-24T23:30:00Z";
const SCOPE = { ownerId: "owner-1", companyId: "company-101", projectId: "project-101", accountId: "acct-1", environment: "staging" };

function capabilityProof(id, companyId, independenceKey) {
  return {
    id,
    evidenceId: `evidence:${id}`,
    capabilityKey: "capability:shared",
    capabilityVersion: 1,
    methodVersion: "method-v1",
    companyId,
    independenceKey,
    applicability: ["task:shared-foundation"],
    result: "passed",
    status: "verified"
  };
}

test("capability maturity requires real independent-company proof", () => {
  const proofs = new Map([
    ["proof:1", capabilityProof("proof:1", "c1", "independent:1")],
    ["proof:2", capabilityProof("proof:2", "c2", "independent:2")],
    ["proof:3", capabilityProof("proof:3", "c3", "independent:3")]
  ]);
  const registry = new CapabilityRegistry({ proofResolver: (id) => proofs.get(id) });

  assert.throws(() => registry.register({
    key: "capability:invented-labels",
    version: 1,
    enabled: true,
    inputVersion: 1,
    outputVersion: 1,
    compatibleInputVersions: [1],
    compatibleOutputVersions: [1],
    maturity: "portfolio_proven",
    proofCompanyIds: ["c1", "c2", "c3"],
    criticalShared: false,
    securityClass: "internal",
    canPin: true,
    canFork: true
  }), /proof receipts/);

  assert.throws(() => registry.register({
    key: "capability:shared",
    version: 1,
    enabled: true,
    inputVersion: 1,
    outputVersion: 1,
    compatibleInputVersions: [1],
    compatibleOutputVersions: [1],
    maturity: "portfolio_proven",
    proofEvidenceIds: ["proof:1", "proof:2"],
    criticalShared: false,
    securityClass: "internal",
    canPin: true,
    canFork: true
  }), /at least 3/);

  registry.register({
    key: "capability:shared",
    version: 1,
    enabled: true,
    inputVersion: 1,
    outputVersion: 1,
    compatibleInputVersions: [1],
    compatibleOutputVersions: [1],
    maturity: "portfolio_proven",
    proofEvidenceIds: ["proof:1", "proof:2", "proof:3"],
    proofCompanyIds: ["c1", "c2", "c3"],
    criticalShared: false,
    securityClass: "internal",
    canPin: true,
    canFork: true
  });
  assert.equal(registry.assertCompatible("capability:shared", 1, 1).maturity, "portfolio_proven");
  assert.throws(() => registry.assertCompatible("capability:shared", 2, 1));
});

test("execution scope cannot widen across company/project/environment", () => {
  assert.doesNotThrow(() => assertScopeContains(SCOPE, SCOPE));
  assert.throws(() => assertScopeContains(SCOPE, { ...SCOPE, companyId: "company-102" }));
  assert.throws(() => assertScopeContains(SCOPE, { ...SCOPE, environment: "production" }));
});

test("zero-budget admission blocks unknown or paid work and enforces resource ceilings", () => {
  const policy = zeroBudgetPolicy({ maxConcurrent: 2, maxQueueDepth: 5, maxRetries: 1, maxRuntimeMs: 10_000 });
  assert.equal(evaluateAdmission(policy, { pricingKnown: false, currentConcurrent: 0, queueDepth: 0, retryCount: 0, requestedRuntimeMs: 1000 }).reason, "pricing_unknown");
  assert.equal(evaluateAdmission(policy, { pricingKnown: true, estimatedCostCents: 1, currentConcurrent: 0, queueDepth: 0, retryCount: 0, requestedRuntimeMs: 1000 }).reason, "monetary_budget_exceeded");
  assert.equal(evaluateAdmission(policy, { pricingKnown: true, estimatedCostCents: 0, currentConcurrent: 0, queueDepth: 0, retryCount: 0, requestedRuntimeMs: 1000 }).allowed, true);
});

test("unknown external operation must reconcile before retry and deduplicates in scope", () => {
  const journal = new OperationJournal();
  const base = { id: "op1", idempotencyKey: "idem-1", intentBinding: "binding", scope: SCOPE, state: "prepared", policyVersion: 1, createdAt: NOW, updatedAt: NOW };
  assert.equal(journal.prepare(base).id, "op1");
  assert.equal(journal.prepare({ ...base, id: "op2" }).id, "op1");
  journal.transition("op1", "dispatched", "2026-10-24T23:30:01Z");
  journal.transition("op1", "unknown", "2026-10-24T23:30:02Z");
  assert.throws(() => journal.assertRetrySafe("op1"));
  journal.transition("op1", "reconciled", "2026-10-24T23:30:03Z", { providerReceiptRef: "receipt-1" });
  assert.throws(() => journal.assertRetrySafe("op1"));
});

test("requirement closure cannot claim verified without implementation tests and evidence", () => {
  assert.throws(() => validateRequirementClosure({ requirementId: "REQ-1", authoritativeSource: "spec", capabilityKey: "capability:x", owningPhase: "P1.7", dependencyIds: [], implementationRefs: [], positiveTestRefs: [], negativeTestRefs: [], failureTestRefs: [], evidenceIds: [], truthState: "verified" }));
  assert.equal(validateRequirementClosure({ requirementId: "REQ-1", authoritativeSource: "spec", capabilityKey: "capability:x", owningPhase: "P1.7", dependencyIds: [], implementationRefs: ["src"], positiveTestRefs: ["test"], negativeTestRefs: [], failureTestRefs: [], evidenceIds: ["evidence"], truthState: "verified" }).truthState, "verified");
});

test("trusted environment rejects staging frontend bound to production backend identity", () => {
  assert.throws(() => validateTrustedEnvironment({ environment: "staging", releaseId: "r", configurationDigest: "d", backend: { providerKey: "provider:supabase", environment: "production", baseUrl: "https://prod.supabase.co", projectRef: "prod", authIssuer: "https://prod.supabase.co", authAudience: "authenticated" } }));
  assert.equal(validateTrustedEnvironment({ environment: "staging", releaseId: "r", configurationDigest: "d", backend: { providerKey: "provider:supabase", environment: "staging", baseUrl: "https://stage.supabase.co", projectRef: "stage", authIssuer: "https://stage.supabase.co", authAudience: "authenticated" } }).environment, "staging");
});

test("caller-supplied recovery object cannot authorize a protected effect; trusted issued grant is single-use", () => {
  const advisory = evaluateProtectedRecovery({
    policyState: "unavailable",
    revocationStateFresh: false,
    protectedEffectRequested: true,
    recoveryAuthorization: { id: "self-asserted", scope: "restore:key", expiresAt: "2026-10-24T23:31:00Z", singleUse: true },
    now: NOW
  });
  assert.equal(advisory.allowed, false);
  assert.equal(advisory.reason, "trusted_recovery_boundary_required");

  const evidence = [];
  const store = new RecoveryAuthorizationStore({
    verifyIssuer: ({ issuerId, action, environment }) => issuerId === "policy:recovery" && action === "restore.key" && environment === "staging",
    evidenceSink: (receipt) => evidence.push(receipt)
  });
  store.issue({
    id: "ra1",
    issuerId: "policy:recovery",
    subjectId: "owner-1",
    action: "restore.key",
    resourceId: "key-1",
    scope: "restore:key",
    environment: "staging",
    operationId: "op:restore-1",
    issuedAt: "2026-10-24T23:29:00Z",
    expiresAt: "2026-10-24T23:31:00Z"
  });

  const request = {
    authorizationId: "ra1",
    subjectId: "owner-1",
    action: "restore.key",
    resourceId: "key-1",
    scope: "restore:key",
    environment: "staging",
    operationId: "op:restore-1",
    now: NOW,
    policyState: "unavailable",
    revocationStateFresh: false,
    protectedEffectRequested: true
  };
  assert.equal(authorizeProtectedRecovery(store, request).allowed, true);
  assert.equal(authorizeProtectedRecovery(store, request).allowed, false);
  assert.equal(evidence.length, 1);
});

test("protected action binds company account environment policy epoch and exact intent", () => {
  const sessions = new AuthSessionStore();
  sessions.register({ id: "s1", ownerId: "owner-1", projectId: "project-101", companyId: "company-101", accountId: "acct-1", environment: "staging", scopes: ["security:protected"], assurance: "fresh_passkey_uv", state: "active", createdAt: "2026-10-24T23:00:00Z", expiresAt: "2026-10-25T00:00:00Z", lastValidatedAt: "2026-10-24T23:00:00Z", lastVerifiedAt: "2026-10-24T23:29:30Z", policyEpoch: 7 });
  const policy = new PolicyEngine();
  policy.register({ action: "company.protected", version: 1, enabled: true, riskClass: "high", requiredScopes: ["security:protected"], minimumAssurance: "fresh_passkey_uv", freshVerificationMaxAgeMs: 60_000, ownerOnly: true, allowProjectWildcard: false, policyEpoch: 7 });
  const gate = new ProtectedActionGate(sessions, policy);
  const intent = { action: "company.protected", ownerId: "owner-1", scope: SCOPE, targetResourceId: "resource-1", parameters: { amount: 0, destination: "test" }, maximumCostCents: 0 };
  const binding = createIntentBinding(intent);
  assert.equal(gate.authorize({ sessionId: "s1", action: "company.protected", resourceOwnerId: "owner-1", resourceProjectId: "project-101", resourceCompanyId: "company-101", resourceAccountId: "acct-1", resourceEnvironment: "staging", expectedPolicyEpoch: 7, policyAvailable: true, revocationStateFresh: true, intent, authorizationIntentBinding: binding, now: NOW }).allowed, true);
  assert.throws(() => gate.authorize({ sessionId: "s1", action: "company.protected", resourceOwnerId: "owner-1", resourceProjectId: "project-101", resourceCompanyId: "company-101", resourceAccountId: "acct-1", resourceEnvironment: "staging", expectedPolicyEpoch: 7, policyAvailable: true, revocationStateFresh: true, intent: { ...intent, parameters: { amount: 1, destination: "test" } }, authorizationIntentBinding: binding, now: NOW }));
  assert.throws(() => gate.authorize({ sessionId: "s1", action: "company.protected", resourceOwnerId: "owner-1", resourceProjectId: "project-101", resourceCompanyId: "company-102", resourceAccountId: "acct-1", resourceEnvironment: "staging", expectedPolicyEpoch: 7, policyAvailable: true, revocationStateFresh: true, now: NOW }));
  assert.throws(() => gate.authorize({ sessionId: "s1", action: "company.protected", resourceOwnerId: "owner-1", resourceProjectId: "project-101", resourceCompanyId: "company-101", resourceAccountId: "acct-1", resourceEnvironment: "staging", expectedPolicyEpoch: 7, policyAvailable: false, revocationStateFresh: true, now: NOW }));
});

test("data boundary enforces company account and environment", () => {
  const boundary = { ownerId: "owner-1", projectId: "project-101", companyId: "company-101", businessId: "biz-101", accountId: "acct-1", environment: "staging", sensitivity: "protected" };
  const grant = { ownerId: "owner-1", projectIds: ["project-101"], businessIds: ["biz-101"], companyIds: ["company-101"], accountIds: ["acct-1"], environments: ["staging"] };
  assert.equal(evaluateDataBoundary(grant, boundary).allowed, true);
  assert.equal(evaluateDataBoundary({ ...grant, companyIds: ["company-102"] }, boundary).reason, "company_boundary_mismatch");
});

test("credential rotation and encryption-key revocation are explicit", () => {
  const secrets = new SecretReferenceRegistry();
  secrets.register({ id: "cred-v1", provider: "provider", purpose: "webhook signing", state: "healthy", createdAt: NOW, version: 1, keyVersion: 1, dependentServiceKeys: ["svc:webhook"] });
  secrets.rotate("cred-v1", { id: "cred-v2", provider: "provider", purpose: "webhook signing", state: "healthy", createdAt: "2026-10-24T23:30:10Z", version: 2, keyVersion: 2, dependentServiceKeys: ["svc:webhook"] }, "2026-10-24T23:30:10Z", "2026-10-24T23:31:00Z");
  secrets.setState("cred-v1", "revoked", "2026-10-24T23:30:20Z");
  assert.throws(() => secrets.assertUsable("cred-v1", "2026-10-24T23:30:30Z"));
  assert.equal(secrets.assertUsable("cred-v2", "2026-10-24T23:30:30Z").id, "cred-v2");
  const keys = new EncryptionKeyRegistry();
  keys.register({ id: "key-1", version: 1, state: "active", createdAt: NOW });
  keys.setState("key-1", "revoked", "2026-10-24T23:30:40Z");
  assert.throws(() => keys.assertDecryptAllowed("key-1"));
});

test("webhook gate rejects forged replay cross-account and stale callbacks and prevents out-of-order regression", () => {
  const gate = new WebhookAcceptanceGate((_keyRef, payload, signature) => signature === `sig:${payload}`);
  const expected = { providerKey: "provider:test", accountId: "acct-1", companyId: "company-101", environment: "staging", activeKeyRefs: ["key-v1", "key-v2"], maxAgeMs: 60_000, maxFutureSkewMs: 5_000 };
  const base = { providerKey: "provider:test", eventId: "e1", accountId: "acct-1", companyId: "company-101", environment: "staging", occurredAt: "2026-10-24T23:29:50Z", receivedAt: NOW, keyRef: "key-v1", signedPayload: "payload", signature: "sig:payload", sequence: 2 };
  assert.equal(gate.accept(base, expected).accepted, true);
  assert.equal(gate.accept(base, expected).duplicate, true);
  assert.equal(gate.accept({ ...base, eventId: "e2", accountId: "acct-2" }, expected).reason, "callback_binding_mismatch");
  assert.equal(gate.accept({ ...base, eventId: "e3", signature: "forged" }, expected).reason, "callback_signature_invalid");
  assert.equal(gate.accept({ ...base, eventId: "e4", occurredAt: "2026-10-24T23:20:00Z" }, expected).reason, "callback_expired");
  assert.equal(gate.accept({ ...base, eventId: "e5", sequence: 1 }, expected).advancesAuthoritativeCursor, false);
  assert.equal(gate.accept({ ...base, eventId: "e6", keyRef: "key-v2", sequence: 3 }, expected).advancesAuthoritativeCursor, true);
});

test("owner-session broker has no hardcoded production project and uses server-only identity config", async () => {
  const text = await readFile(new URL("../api/owner-session.mjs", import.meta.url), "utf8");
  assert.equal(text.includes("gmlsucpwliegwlxymjvp"), false);
  assert.equal(text.includes("x-cc-supabase-key"), false);
  assert.match(text, /CC_SUPABASE_URL/);
  assert.match(text, /CC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(text, /MAX_BODY_BYTES/);
  assert.match(text, /AbortSignal\.timeout/);
});
