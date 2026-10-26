import test from "node:test";
import assert from "node:assert/strict";
import {
  CapabilityRegistry,
  RecoveryAuthorizationStore,
  authorizeProtectedRecovery
} from "../dist/kernel/index.js";

const BASE_CAPABILITY = {
  key: "capability:r3-proof",
  version: 1,
  enabled: true,
  inputVersion: 1,
  outputVersion: 1,
  compatibleInputVersions: [1],
  compatibleOutputVersions: [1],
  maturity: "portfolio_proven",
  criticalShared: false,
  securityClass: "internal",
  canPin: true,
  canFork: true
};

function proof(id, companyId, independenceKey, overrides = {}) {
  return {
    id,
    evidenceId: `evidence:${id}`,
    capabilityKey: BASE_CAPABILITY.key,
    capabilityVersion: 1,
    methodVersion: "method-v1",
    companyId,
    independenceKey,
    applicability: ["task:r3"],
    result: "passed",
    status: "verified",
    ...overrides
  };
}

test("R3: invented company labels cannot qualify portfolio maturity", () => {
  const registry = new CapabilityRegistry({ proofResolver: () => undefined });
  assert.throws(() => registry.register({
    ...BASE_CAPABILITY,
    proofCompanyIds: ["company:a", "company:b", "company:c"]
  }), /proof receipts/);
});

test("R3: correlated or stale evidence cannot qualify portfolio maturity", () => {
  const correlated = new Map([
    ["p1", proof("p1", "company:a", "same-source")],
    ["p2", proof("p2", "company:b", "same-source")],
    ["p3", proof("p3", "company:c", "same-source")]
  ]);
  assert.throws(() => new CapabilityRegistry({ proofResolver: (id) => correlated.get(id) }).register({
    ...BASE_CAPABILITY,
    proofEvidenceIds: ["p1", "p2", "p3"]
  }), /independent evidence sources/);

  const stale = new Map([
    ["p1", proof("p1", "company:a", "s1")],
    ["p2", proof("p2", "company:b", "s2", { status: "stale" })],
    ["p3", proof("p3", "company:c", "s3")]
  ]);
  assert.throws(() => new CapabilityRegistry({ proofResolver: (id) => stale.get(id) }).register({
    ...BASE_CAPABILITY,
    proofEvidenceIds: ["p1", "p2", "p3"]
  }), /not verified\/passed/);
});

test("R3: proof receipts must match exact capability version and declared companies", () => {
  const receipts = new Map([
    ["p1", proof("p1", "company:a", "s1")],
    ["p2", proof("p2", "company:b", "s2")],
    ["p3", proof("p3", "company:c", "s3", { capabilityVersion: 2 })]
  ]);
  assert.throws(() => new CapabilityRegistry({ proofResolver: (id) => receipts.get(id) }).register({
    ...BASE_CAPABILITY,
    proofEvidenceIds: ["p1", "p2", "p3"]
  }), /different capability\/version/);
});

function recoveryStore(evidence = []) {
  return new RecoveryAuthorizationStore({
    verifyIssuer: ({ issuerId, subjectId, action, environment }) => issuerId === "policy:recovery" && subjectId === "owner-1" && action === "restore.data" && environment === "staging",
    evidenceSink: (receipt) => evidence.push(receipt)
  });
}

function grant(store, overrides = {}) {
  return store.issue({
    id: "recovery:1",
    issuerId: "policy:recovery",
    subjectId: "owner-1",
    action: "restore.data",
    resourceId: "resource:1",
    scope: "project:1",
    environment: "staging",
    operationId: "operation:1",
    issuedAt: "2026-10-25T18:00:00Z",
    expiresAt: "2026-10-25T18:10:00Z",
    ...overrides
  });
}

function request(overrides = {}) {
  return {
    authorizationId: "recovery:1",
    subjectId: "owner-1",
    action: "restore.data",
    resourceId: "resource:1",
    scope: "project:1",
    environment: "staging",
    operationId: "operation:1",
    now: "2026-10-25T18:05:00Z",
    policyState: "unavailable",
    revocationStateFresh: false,
    protectedEffectRequested: true,
    ...overrides
  };
}

test("R3: untrusted issuer and self-asserted authorization are rejected", () => {
  const store = recoveryStore();
  assert.throws(() => grant(store, { issuerId: "caller:self" }), /issuer is not trusted/);
  const result = authorizeProtectedRecovery(store, request({ authorizationId: "not-issued" }));
  assert.equal(result.allowed, false);
  assert.match(result.reason, /not issued/);
});

test("R3: exact recovery scope/action/resource/environment/operation are immutable", () => {
  for (const override of [
    { subjectId: "owner-2" },
    { action: "restore.other" },
    { resourceId: "resource:2" },
    { scope: "project:2" },
    { environment: "production" },
    { operationId: "operation:2" }
  ]) {
    const store = recoveryStore();
    grant(store);
    const result = authorizeProtectedRecovery(store, request(override));
    assert.equal(result.allowed, false, JSON.stringify(override));
    assert.equal(store.consumed("recovery:1"), false);
  }
});

test("R3: expired and revoked recovery grants fail closed", () => {
  const expired = recoveryStore();
  grant(expired, { expiresAt: "2026-10-25T18:04:00Z" });
  assert.equal(authorizeProtectedRecovery(expired, request()).allowed, false);

  const revoked = recoveryStore();
  grant(revoked);
  revoked.revoke("recovery:1", "2026-10-25T18:03:00Z");
  assert.equal(authorizeProtectedRecovery(revoked, request()).allowed, false);
});

test("R3: recovery grant is atomically single-use and records exactly one evidence receipt", async () => {
  const evidence = [];
  const store = recoveryStore(evidence);
  grant(store);
  const results = await Promise.all([
    Promise.resolve().then(() => authorizeProtectedRecovery(store, request())),
    Promise.resolve().then(() => authorizeProtectedRecovery(store, request()))
  ]);
  assert.equal(results.filter((result) => result.allowed).length, 1);
  assert.equal(results.filter((result) => !result.allowed).length, 1);
  assert.equal(store.consumed("recovery:1"), true);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].metadata.authorizationId, "recovery:1");
});
