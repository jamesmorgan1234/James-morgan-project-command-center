import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyNormalizedTransactionCorrection,
  createNormalizedFinancialTransaction,
  dedupeNormalizedFinancialTransactions,
  selectCurrentNormalizedFinancialTransactions,
  summarizeNormalizedCashflow
} from "../dist/finance/index.js";

function tx(overrides = {}) {
  return createNormalizedFinancialTransaction({
    id: "tx-event-1",
    canonicalTransactionRef: "txn:coffee",
    ownerId: "owner-1",
    accountId: "account-checking",
    providerKey: "finance-provider:test-bank",
    providerIdentity: "bank:test-bank",
    externalTransactionId: "provider-tx-1",
    postingState: "posted",
    occurredAt: "2026-10-26T10:00:00Z",
    postedAt: "2026-10-26T10:05:00Z",
    observedAt: "2026-10-26T10:06:00Z",
    amountCents: -650,
    currency: "USD",
    merchantName: "Coffee Shop",
    merchantProvenanceRefs: ["provider:merchant:1"],
    category: "Dining",
    categoryProvenanceRefs: ["provider:category:1"],
    classificationSource: "provider",
    classificationConfidence: 0.9,
    rawSourceRefs: ["raw:provider-tx-1:v1"],
    ...overrides
  });
}

test("P9.3 normalized transactions preserve raw-source, merchant, and category lineage", () => {
  const record = tx();
  assert.deepEqual(record.rawSourceRefs, ["raw:provider-tx-1:v1"]);
  assert.deepEqual(record.merchantProvenanceRefs, ["provider:merchant:1"]);
  assert.deepEqual(record.categoryProvenanceRefs, ["provider:category:1"]);
  assert.equal(record.protectedActionAuthorized, false);
});

test("P9.3 exact duplicate provider events dedupe while merging every raw-source lineage reference", () => {
  const first = tx();
  const replay = tx({ id: "tx-event-replay", rawSourceRefs: ["raw:provider-tx-1:retry"], merchantProvenanceRefs: ["provider:merchant:retry"], categoryProvenanceRefs: ["provider:category:retry"] });
  const deduped = dedupeNormalizedFinancialTransactions([first, replay]);
  assert.equal(deduped.length, 1);
  assert.deepEqual(deduped[0].rawSourceRefs, ["raw:provider-tx-1:v1", "raw:provider-tx-1:retry"]);
  assert.deepEqual(deduped[0].merchantProvenanceRefs, ["provider:merchant:1", "provider:merchant:retry"]);
  assert.throws(() => dedupeNormalizedFinancialTransactions([first, tx({ id: "conflict", amountCents: -999 })]), /Conflicting duplicate financial transaction/i);
});

test("P9.3 pending-to-posted lifecycle selects one canonical current transaction without double-counting", () => {
  const pending = tx({ id: "pending", externalTransactionId: "pending-1", postingState: "pending", postedAt: undefined, observedAt: "2026-10-26T10:01:00Z", rawSourceRefs: ["raw:pending"] });
  const posted = tx({ id: "posted", externalTransactionId: "posted-1", postingState: "posted", postedAt: "2026-10-26T10:05:00Z", observedAt: "2026-10-26T10:06:00Z", rawSourceRefs: ["raw:posted"] });
  const current = selectCurrentNormalizedFinancialTransactions([pending, posted], "owner-1");
  assert.equal(current.length, 1);
  assert.equal(current[0].postingState, "posted");
  assert.deepEqual(current[0].rawSourceRefs, ["raw:posted", "raw:pending"]);
  const totals = summarizeNormalizedCashflow([pending, posted], "owner-1");
  assert.equal(totals.postedExternalOutflowCents, 650);
  assert.equal(totals.pendingExternalOutflowCents, 0);
});

test("P9.3 transfer matching excludes both legs while preserving unrelated posted and pending cashflow", () => {
  const out = tx({ id: "transfer-out", canonicalTransactionRef: "txn:transfer-out", externalTransactionId: "transfer-out", accountId: "checking", amountCents: -5000, transferGroupId: "transfer:1", merchantName: undefined, merchantProvenanceRefs: [], category: "Transfer", categoryProvenanceRefs: ["rule:transfer"], rawSourceRefs: ["raw:transfer-out"] });
  const incoming = tx({ id: "transfer-in", canonicalTransactionRef: "txn:transfer-in", externalTransactionId: "transfer-in", accountId: "savings", amountCents: 5000, transferGroupId: "transfer:1", merchantName: undefined, merchantProvenanceRefs: [], category: "Transfer", categoryProvenanceRefs: ["rule:transfer"], rawSourceRefs: ["raw:transfer-in"] });
  const income = tx({ id: "income", canonicalTransactionRef: "txn:income", externalTransactionId: "income", accountId: "checking", amountCents: 10000, merchantName: undefined, merchantProvenanceRefs: [], category: "Income", categoryProvenanceRefs: ["provider:income"], rawSourceRefs: ["raw:income"] });
  const pendingExpense = tx({ id: "pending-expense", canonicalTransactionRef: "txn:pending-expense", externalTransactionId: "pending-expense", accountId: "checking", postingState: "pending", postedAt: undefined, amountCents: -2000, merchantName: undefined, merchantProvenanceRefs: [], category: "Bills", categoryProvenanceRefs: ["provider:bills"], rawSourceRefs: ["raw:pending-expense"] });
  const totals = summarizeNormalizedCashflow([out, incoming, income, pendingExpense], "owner-1");
  assert.equal(totals.excludedInternalTransferCount, 2);
  assert.equal(totals.postedExternalInflowCents, 10000);
  assert.equal(totals.postedExternalOutflowCents, 0);
  assert.equal(totals.pendingExternalOutflowCents, 2000);
});

test("P9.3 owner correction changes classification projection without erasing original raw truth", () => {
  const original = tx();
  const corrected = applyNormalizedTransactionCorrection(original, {
    id: "correction-1",
    ownerId: "owner-1",
    canonicalTransactionRef: "txn:coffee",
    category: "Business Meals",
    merchantName: "Coffee Shop LLC",
    ownerDecisionRef: "owner-decision:1",
    observedAt: "2026-10-26T10:07:00Z",
    provenanceRefs: ["owner:correction:1"]
  });
  assert.equal(corrected.category, "Business Meals");
  assert.equal(corrected.merchantName, "Coffee Shop LLC");
  assert.equal(corrected.classificationSource, "owner");
  assert.equal(corrected.classificationConfidence, 1);
  assert.deepEqual(corrected.rawSourceRefs, original.rawSourceRefs);
  assert.deepEqual(corrected.correctionProvenanceRefs, ["owner:correction:1"]);
  assert.equal(original.category, "Dining");
});

test("P9.3 corrections and transaction truth cannot cross owner/canonical scope", () => {
  const original = tx();
  assert.throws(() => applyNormalizedTransactionCorrection(original, {
    id: "wrong-owner", ownerId: "owner-2", canonicalTransactionRef: "txn:coffee", category: "Other", ownerDecisionRef: "owner-decision:2", observedAt: "2026-10-26T10:07:00Z", provenanceRefs: ["owner:2"]
  }), /scope mismatch/i);
  assert.throws(() => applyNormalizedTransactionCorrection(original, {
    id: "wrong-ref", ownerId: "owner-1", canonicalTransactionRef: "txn:other", category: "Other", ownerDecisionRef: "owner-decision:3", observedAt: "2026-10-26T10:07:00Z", provenanceRefs: ["owner:3"]
  }), /scope mismatch/i);
});

test("P9.3 durable transaction truth is append-only, owner-scoped, raw-lineaged, correction-aware, and transfer-safe", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026101000_p9_3_transactions_cashflow.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_finance_transaction_history/i);
  assert.match(sql, /command_center_finance_transaction_correction_history/i);
  assert.match(sql, /posting_state text not null check \(posting_state in \('pending','posted'\)\)/i);
  assert.match(sql, /raw_source_refs text\[\] not null check \(cardinality\(raw_source_refs\) > 0\)/i);
  assert.match(sql, /merchant_provenance_refs text\[\]/i);
  assert.match(sql, /category_provenance_refs text\[\] not null/i);
  assert.match(sql, /unique\(owner_id,provider_key,external_transaction_id,posting_state\)/i);
  assert.match(sql, /transfer_group_id text/i);
  assert.match(sql, /sum\(amount_cents\)=0/i);
  assert.match(sql, /excluded_internal_transfer/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
});
