import test from "node:test";
import assert from "node:assert/strict";
import {
  createNormalizedFinancialTransaction,
  dedupeNormalizedFinancialTransactions,
  selectCurrentNormalizedFinancialTransactions,
  summarizeNormalizedCashflow
} from "../dist/finance/index.js";

function transaction({
  id,
  canonicalTransactionRef,
  externalTransactionId,
  accountId,
  amountCents,
  postingState = "posted",
  transferGroupId,
  rawSourceRefs = [`raw-${id}`]
}) {
  return createNormalizedFinancialTransaction({
    id,
    canonicalTransactionRef,
    ownerId: "owner-p9-3",
    accountId,
    providerKey: "finance-provider:test-bank",
    providerIdentity: "provider-account-owner-p9-3",
    externalTransactionId,
    postingState,
    occurredAt: "2026-10-27T12:00:00Z",
    ...(postingState === "posted" ? { postedAt: "2026-10-27T12:05:00Z" } : {}),
    observedAt: postingState === "posted" ? "2026-10-27T12:10:00Z" : "2026-10-27T12:02:00Z",
    amountCents,
    currency: "USD",
    merchantName: "Fixture Merchant",
    merchantProvenanceRefs: [`merchant-${id}`],
    category: "fixture",
    categoryProvenanceRefs: [`category-${id}`],
    classificationSource: "provider",
    classificationConfidence: 1,
    ...(transferGroupId === undefined ? {} : { transferGroupId }),
    rawSourceRefs
  });
}

test("P9.3 cashflow avoids duplicate, pending-posted, and internal-transfer double counting", () => {
  const income = transaction({
    id: "income-a",
    canonicalTransactionRef: "canonical-income",
    externalTransactionId: "external-income",
    accountId: "checking",
    amountCents: 10000,
    rawSourceRefs: ["raw-income-a"]
  });
  const duplicateIncome = transaction({
    id: "income-b",
    canonicalTransactionRef: "canonical-income",
    externalTransactionId: "external-income",
    accountId: "checking",
    amountCents: 10000,
    rawSourceRefs: ["raw-income-b"]
  });
  const transferOut = transaction({
    id: "transfer-out",
    canonicalTransactionRef: "canonical-transfer-out",
    externalTransactionId: "external-transfer-out",
    accountId: "checking",
    amountCents: -5000,
    transferGroupId: "internal-transfer"
  });
  const transferIn = transaction({
    id: "transfer-in",
    canonicalTransactionRef: "canonical-transfer-in",
    externalTransactionId: "external-transfer-in",
    accountId: "savings",
    amountCents: 5000,
    transferGroupId: "internal-transfer"
  });
  const pendingPurchase = transaction({
    id: "purchase-pending",
    canonicalTransactionRef: "canonical-purchase",
    externalTransactionId: "external-purchase-pending",
    accountId: "checking",
    amountCents: -1200,
    postingState: "pending"
  });
  const postedPurchase = transaction({
    id: "purchase-posted",
    canonicalTransactionRef: "canonical-purchase",
    externalTransactionId: "external-purchase-posted",
    accountId: "checking",
    amountCents: -1200,
    postingState: "posted"
  });

  const totals = summarizeNormalizedCashflow(
    [income, duplicateIncome, transferOut, transferIn, pendingPurchase, postedPurchase],
    "owner-p9-3"
  );

  assert.deepEqual(totals, {
    postedExternalInflowCents: 10000,
    postedExternalOutflowCents: 1200,
    pendingExternalInflowCents: 0,
    pendingExternalOutflowCents: 0,
    excludedInternalTransferCount: 2
  });
});

test("P9.3 dedup and pending-posted reconciliation preserve raw-source lineage", () => {
  const first = transaction({
    id: "lineage-a",
    canonicalTransactionRef: "canonical-lineage",
    externalTransactionId: "external-lineage",
    accountId: "checking",
    amountCents: -500,
    rawSourceRefs: ["raw-provider-a"]
  });
  const duplicate = transaction({
    id: "lineage-b",
    canonicalTransactionRef: "canonical-lineage",
    externalTransactionId: "external-lineage",
    accountId: "checking",
    amountCents: -500,
    rawSourceRefs: ["raw-provider-b"]
  });

  const deduped = dedupeNormalizedFinancialTransactions([first, duplicate]);
  assert.equal(deduped.length, 1);
  assert.deepEqual(deduped[0].rawSourceRefs, ["raw-provider-a", "raw-provider-b"]);

  const pending = transaction({
    id: "state-pending",
    canonicalTransactionRef: "canonical-state-transition",
    externalTransactionId: "external-state-pending",
    accountId: "checking",
    amountCents: -900,
    postingState: "pending",
    rawSourceRefs: ["raw-pending"]
  });
  const posted = transaction({
    id: "state-posted",
    canonicalTransactionRef: "canonical-state-transition",
    externalTransactionId: "external-state-posted",
    accountId: "checking",
    amountCents: -900,
    postingState: "posted",
    rawSourceRefs: ["raw-posted"]
  });

  const current = selectCurrentNormalizedFinancialTransactions([pending, posted], "owner-p9-3");
  assert.equal(current.length, 1);
  assert.equal(current[0].postingState, "posted");
  assert.deepEqual(current[0].rawSourceRefs, ["raw-posted", "raw-pending"]);
});
