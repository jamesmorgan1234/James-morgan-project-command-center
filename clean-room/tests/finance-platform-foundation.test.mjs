import test from "node:test";
import assert from "node:assert/strict";
import {
  FinancialProviderRegistry,
  recurringTruthState,
  summarizeCashflowFlows,
  calculateAdditiveScenario,
  assertFinancialReadIsolation,
  assertFinancialWriteIsolation
} from "../dist/finance/index.js";

test("financial provider platform separates connection/consent/health/capability scopes", () => {
  const providers = new FinancialProviderRegistry();
  providers.register({ key: "finance-provider:test-bank", version: 1, enabled: true, connectionState: "connected", consentState: "granted", capabilities: ["accounts.read", "transactions.read"], dataScopes: ["personal-bank"], freshnessSeconds: 300, health: "available", credentialRef: "secret-ref:bank" });
  providers.register({ key: "finance-provider:expired", version: 1, enabled: true, connectionState: "expired", consentState: "granted", capabilities: ["accounts.read"], dataScopes: ["personal-bank"], freshnessSeconds: 300, health: "available" });
  assert.deepEqual(providers.eligible("accounts.read", "personal-bank").map((provider) => provider.key), ["finance-provider:test-bank"]);
  assert.equal(providers.eligible("transfer.write").length, 0);
});

test("detected recurrence is not contract truth until owner/contract evidence confirms it", () => {
  const candidate = { id: "rec1", ownerId: "o", kind: "subscription", merchantOrCounterparty: "Service", expectedAmountCents: -999, confidence: 0.94, evidenceRefs: ["tx1", "tx2"], ownerConfirmed: false, contractEvidence: false, state: "candidate" };
  assert.equal(recurringTruthState(candidate), "detected_candidate");
  assert.equal(recurringTruthState({ ...candidate, ownerConfirmed: true, state: "active" }), "confirmed_obligation");
});

test("cashflow excludes paired internal transfers and separates pending from posted", () => {
  const result = summarizeCashflowFlows([
    { id: "t1", amountCents: -5000, postingState: "posted", transferGroupId: "xfer1", accountId: "checking" },
    { id: "t2", amountCents: 5000, postingState: "posted", transferGroupId: "xfer1", accountId: "savings" },
    { id: "income", amountCents: 10000, postingState: "posted", accountId: "checking" },
    { id: "pending", amountCents: -1200, postingState: "pending", accountId: "checking" }
  ]);
  assert.equal(result.excludedInternalTransferCount, 2);
  assert.equal(result.postedExternalInflowCents, 10000);
  assert.equal(result.pendingExternalOutflowCents, 1200);
});

test("financial scenarios separate verified inputs from assumptions and promise no outcome", () => {
  const result = calculateAdditiveScenario("cash runway", [
    { key: "cash", cents: 100000, source: "verified_current", evidenceRefs: ["account"] },
    { key: "future-expense", cents: -25000, source: "owner_assumption", evidenceRefs: [] }
  ]);
  assert.deepEqual(result.verifiedInputKeys, ["cash"]);
  assert.deepEqual(result.assumptionKeys, ["future-expense"]);
  assert.equal(result.outcomePromise, false);
});

test("finance isolation requires passkey read scope and fresh passkey for writes", () => {
  const read = { ownerId: "o", subjectOwnerId: "o", assurance: "passkey_uv", scopes: ["finance:read"], contextDomain: "finance" };
  assert.doesNotThrow(() => assertFinancialReadIsolation(read));
  assert.throws(() => assertFinancialReadIsolation({ ...read, contextDomain: "social" }));
  assert.throws(() => assertFinancialReadIsolation({ ...read, subjectOwnerId: "other" }));
  assert.throws(() => assertFinancialWriteIsolation({ ...read, scopes: ["finance:read", "finance:write"] }));
  assert.doesNotThrow(() => assertFinancialWriteIsolation({ ...read, assurance: "fresh_passkey_uv", scopes: ["finance:read", "finance:write"] }));
});
