import test from "node:test";
import assert from "node:assert/strict";
import {
  knownMoney,
  unknownMoney,
  addKnownMoney,
  FinancialAccountRegistry,
  TransactionLedger,
  summarizeSpending,
  calculateNetWorth,
  calculateBudgetVariance,
  validateCreditScoreFact,
  recommendFromFactors,
  goalProgress,
  createTaxEstimate,
  assertFinancialActionAuthorized,
  reconcileFinancialSnapshot
} from "../dist/finance/index.js";

const T0 = "2026-10-23T18:00:00Z";

test("money keeps unknown distinct from verified zero", () => {
  assert.deepEqual(knownMoney(0), { state: "known", cents: 0, currency: "USD" });
  assert.equal(addKnownMoney([knownMoney(0), unknownMoney("not connected")]).state, "unknown");
});

test("financial accounts normalize provider identity and reject duplicates", () => {
  const accounts = new FinancialAccountRegistry();
  accounts.register({ id: "a1", ownerId: "o", providerKey: "bank:x", externalAccountId: "ext1", displayName: "Checking", type: "checking", balance: knownMoney(12345), balanceAsOf: T0, liability: false, sourceRef: "provider", version: 1 });
  assert.throws(() => accounts.register({ id: "a2", ownerId: "o", providerKey: "bank:x", externalAccountId: "ext1", displayName: "Duplicate", type: "checking", balance: knownMoney(1), balanceAsOf: T0, liability: false, sourceRef: "provider", version: 1 }));
});

test("transaction ingestion is idempotent and owner corrections preserve original record", () => {
  const ledger = new TransactionLedger();
  const tx = { id: "t1", ownerId: "o", accountId: "a1", providerKey: "bank:x", externalTransactionId: "p1", occurredAt: T0, amountCents: -1250, currency: "USD", merchant: "Store", category: "shopping", classificationSource: "provider", classificationConfidence: 0.8, sourceRef: "provider" };
  ledger.ingest(tx);
  assert.throws(() => ledger.ingest({ ...tx, id: "t2" }));
  ledger.correct({ transactionId: "t1", category: "groceries", ownerDecisionRef: "owner-correction" });
  assert.equal(ledger.effectiveCategory("t1"), "groceries");
  assert.equal(ledger.list("o")[0].category, "shopping");
});

test("spending summaries disclose missing source coverage instead of treating it as zero", () => {
  const summary = summarizeSpending([{ id: "t", ownerId: "o", accountId: "a", providerKey: "p", externalTransactionId: "x", occurredAt: T0, amountCents: -500, currency: "USD", category: "food", classificationSource: "provider", classificationConfidence: 1, sourceRef: "s1" }], "USD", ["s1", "s2"], ["s1"]);
  assert.equal(summary.totalExpenseCents, 500);
  assert.equal(summary.sourceCoverageComplete, false);
  assert.deepEqual(summary.missingSourceRefs, ["s2"]);
});

test("net worth reports known subtotal plus unknown accounts rather than fabricating a complete figure", () => {
  const snapshot = calculateNetWorth("o", [
    { id: "cash", ownerId: "o", providerKey: "p", externalAccountId: "1", displayName: "Cash", type: "checking", balance: knownMoney(10000), balanceAsOf: T0, liability: false, sourceRef: "s", version: 1 },
    { id: "card", ownerId: "o", providerKey: "p", externalAccountId: "2", displayName: "Card", type: "credit_card", balance: knownMoney(3000), balanceAsOf: T0, liability: true, sourceRef: "s", version: 1 },
    { id: "missing", ownerId: "o", providerKey: "p", externalAccountId: "3", displayName: "Unknown", type: "loan", balance: unknownMoney("stale provider"), balanceAsOf: T0, liability: true, sourceRef: "s", version: 1 }
  ]);
  assert.equal(snapshot.knownNetWorthCents, 7000);
  assert.equal(snapshot.complete, false);
  assert.deepEqual(snapshot.unknownAccountIds, ["missing"]);
});

test("budget variance remains unknown when actual is unknown", () => {
  const results = calculateBudgetVariance([{ category: "food", budgetCents: 50000, actualCents: 42000 }, { category: "fuel", budgetCents: 10000 }]);
  assert.deepEqual(results[0], { category: "food", state: "known", varianceCents: 8000 });
  assert.deepEqual(results[1], { category: "fuel", state: "unknown" });
});

test("credit facts identify provider/model/date and recommendations never forecast score", () => {
  assert.doesNotThrow(() => validateCreditScoreFact({ provider: "Experian", model: "VantageScore 3.0", score: 700, reportDate: "2026-10-23", sourceRef: "report" }));
  const recommendation = recommendFromFactors("Reduce utilization", "Current utilization factor is negative", [{ key: "utilization", impact: "negative", evidenceRef: "factor1" }]);
  assert.equal(recommendation.scoreForecast, null);
});

test("financial goal percentage is N/A without a current value", () => {
  assert.deepEqual(goalProgress({ id: "g1", ownerId: "o", title: "Emergency fund", targetCents: 100000, sourceRefs: ["owner"] }), { kind: "na", label: "N/A", reason: "current_value_unknown" });
  assert.equal(goalProgress({ id: "g2", ownerId: "o", title: "Emergency fund", targetCents: 100000, currentCents: 25000, sourceRefs: ["owner"] }).percent, 25);
});

test("tax output remains explicitly an estimate grounded in verified evidence", () => {
  const estimate = createTaxEstimate(2026, [{ id: "tax1", ownerId: "o", taxYear: 2026, kind: "income", amountCents: 100000, sourceRef: "1099", verified: true }], 20000);
  assert.equal(estimate.state, "estimate");
  assert.equal(estimate.disclaimer, "not_a_filing_or_final_tax_determination");
});

test("money-moving actions require exact authorization, health, scope and duplicate reconciliation", () => {
  const intent = { id: "act1", ownerId: "o", kind: "transfer", accountRefs: ["a1", "a2"], amountCents: 1000, exactOwnerAuthorizationRef: "owner-this-transfer", providerHealthVerified: true, duplicateSideEffectChecked: true };
  assert.doesNotThrow(() => assertFinancialActionAuthorized(intent));
  assert.throws(() => assertFinancialActionAuthorized({ ...intent, exactOwnerAuthorizationRef: "" }));
  assert.throws(() => assertFinancialActionAuthorized({ ...intent, duplicateSideEffectChecked: false }));
});

test("financial provider recovery rejects stale/conflicting same-time snapshots", () => {
  const current = { providerKey: "bank:x", ownerId: "o", capturedAt: T0, contentHash: "h1", accountIds: ["a1"] };
  assert.equal(reconcileFinancialSnapshot(current, { ...current }), "duplicate");
  assert.equal(reconcileFinancialSnapshot(current, { ...current, contentHash: "h2" }), "manual_conflict");
  assert.equal(reconcileFinancialSnapshot(current, { ...current, capturedAt: "2026-10-23T17:00:00Z", contentHash: "older" }), "reject_stale");
  assert.equal(reconcileFinancialSnapshot(current, { ...current, capturedAt: "2026-10-23T19:00:00Z", contentHash: "new" }), "accept_newer");
});
