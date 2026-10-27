import test from "node:test";
import assert from "node:assert/strict";
import { assertDataBoundary, evaluateDataBoundary } from "../dist/security/index.js";

const grant = Object.freeze({
  ownerId: "owner-1",
  projectIds: Object.freeze(["project-a"]),
  companyIds: Object.freeze(["company-a"]),
  businessIds: Object.freeze(["business-a"]),
  accountIds: Object.freeze(["account-a"]),
  environments: Object.freeze(["preview"]),
  operations: Object.freeze(["read", "write"])
});

const allowedBoundary = Object.freeze({
  ownerId: "owner-1",
  projectId: "project-a",
  companyId: "company-a",
  businessId: "business-a",
  accountId: "account-a",
  environment: "preview",
  sensitivity: "protected"
});

test("P2.6 canonical boundary allows the exact authorized owner/project/company/business/account/environment scope", () => {
  assert.deepEqual(evaluateDataBoundary(grant, allowedBoundary, "read"), { allowed: true, reason: "allowed" });
  assert.deepEqual(evaluateDataBoundary(grant, allowedBoundary, "write"), { allowed: true, reason: "allowed" });
  assert.doesNotThrow(() => assertDataBoundary(grant, allowedBoundary, "read"));
  assert.doesNotThrow(() => assertDataBoundary(grant, allowedBoundary, "write"));
});

for (const [field, value, reason] of [
  ["ownerId", "owner-2", "owner_boundary_mismatch"],
  ["projectId", "project-b", "project_boundary_mismatch"],
  ["companyId", "company-b", "company_boundary_mismatch"],
  ["businessId", "business-b", "business_boundary_mismatch"],
  ["accountId", "account-b", "account_boundary_mismatch"],
  ["environment", "production", "environment_boundary_mismatch"]
]) {
  test(`P2.6 adversarial read/write scope rejects cross-boundary ${field}`, () => {
    const attemptedBoundary = { ...allowedBoundary, [field]: value };
    for (const operation of ["read", "write"]) {
      const decision = evaluateDataBoundary(grant, attemptedBoundary, operation);
      assert.equal(decision.allowed, false);
      assert.equal(decision.reason, reason);
      assert.throws(() => assertDataBoundary(grant, attemptedBoundary, operation), new RegExp(reason));
    }
  });
}

test("P2.6 grants default to read-only and require explicit write authority", () => {
  const readOnly = {
    ownerId: "owner-1",
    projectIds: ["project-a"],
    companyIds: ["company-a"],
    businessIds: ["business-a"],
    accountIds: ["account-a"],
    environments: ["preview"]
  };
  assert.equal(evaluateDataBoundary(readOnly, allowedBoundary, "read").allowed, true);
  assert.deepEqual(evaluateDataBoundary(readOnly, allowedBoundary, "write"), { allowed: false, reason: "operation_not_granted" });
  assert.throws(() => assertDataBoundary(readOnly, allowedBoundary, "write"), /operation_not_granted/);
});

test("P2.6 omitted optional grant dimensions fail closed when the resource carries those dimensions", () => {
  const narrowGrant = { ownerId: "owner-1", projectIds: ["project-a"], businessIds: ["business-a"] };
  assert.equal(evaluateDataBoundary(narrowGrant, { ...allowedBoundary, companyId: "company-a" }).reason, "company_boundary_mismatch");
  assert.equal(evaluateDataBoundary(narrowGrant, { ...allowedBoundary, accountId: "account-a", companyId: undefined }).reason, "account_boundary_mismatch");
  assert.equal(evaluateDataBoundary(narrowGrant, { ...allowedBoundary, environment: "preview", companyId: undefined, accountId: undefined }).reason, "environment_boundary_mismatch");
});
