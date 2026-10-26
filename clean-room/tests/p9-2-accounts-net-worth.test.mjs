import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculatePositionNetWorth,
  createFinancialAccountPosition,
  reconcileFinancialAccountPosition
} from "../dist/finance/index.js";

function position(overrides = {}) {
  return createFinancialAccountPosition({
    id: "pos-checking-v1",
    ownerId: "owner-1",
    accountId: "account-checking",
    providerKey: "finance-provider:test-bank",
    externalAccountId: "checking-123",
    accountType: "checking",
    accountCurrency: "USD",
    ownership: "sole",
    positionClass: "asset",
    value: { state: "verified", cents: 250000, currency: "USD" },
    valuationDate: "2026-10-26T05:00:00Z",
    observedAt: "2026-10-26T05:01:00Z",
    provenanceRefs: ["provider-balance:checking-123"],
    ...overrides
  });
}

test("P9.2 verified zero is distinct from unavailable and retains source date", () => {
  const zero = position({ id: "zero", accountId: "zero-account", externalAccountId: "zero-account", value: { state: "verified", cents: 0, currency: "USD" }, valuationDate: "2026-10-26T04:00:00Z" });
  const unavailable = position({ id: "unavailable", accountId: "missing-account", externalAccountId: "missing-account", value: { state: "unavailable", reason: "provider_account_unavailable" }, valuationDate: "2026-10-26T03:00:00Z" });
  const snapshot = calculatePositionNetWorth("owner-1", [zero, unavailable], "USD", "2026-10-26T05:30:00Z");
  assert.deepEqual(snapshot.verifiedZeroAccountIds, ["zero-account"]);
  assert.deepEqual(snapshot.unavailableAccountIds, ["missing-account"]);
  assert.equal(snapshot.verifiedNetWorthCents, 0);
  assert.equal(snapshot.sourceDatesByAccount["zero-account"], "2026-10-26T04:00:00Z");
  assert.equal(snapshot.sourceDatesByAccount["missing-account"], "2026-10-26T03:00:00Z");
  assert.equal(snapshot.complete, false);
});

test("P9.2 pending and stale positions are visible but excluded from verified net worth", () => {
  const verifiedAsset = position({ id: "asset", accountId: "asset", externalAccountId: "asset", value: { state: "verified", cents: 500000, currency: "USD" } });
  const verifiedDebt = position({ id: "debt", accountId: "debt", externalAccountId: "debt", accountType: "loan", positionClass: "liability", value: { state: "verified", cents: 125000, currency: "USD" } });
  const pending = position({ id: "pending", accountId: "pending", externalAccountId: "pending", value: { state: "pending", cents: 9000, currency: "USD" } });
  const stale = position({ id: "stale", accountId: "stale", externalAccountId: "stale", value: { state: "stale", cents: 200000, currency: "USD" } });
  const snapshot = calculatePositionNetWorth("owner-1", [verifiedAsset, verifiedDebt, pending, stale], "USD", "2026-10-26T05:30:00Z");
  assert.equal(snapshot.verifiedAssetsCents, 500000);
  assert.equal(snapshot.verifiedLiabilitiesCents, 125000);
  assert.equal(snapshot.verifiedNetWorthCents, 375000);
  assert.deepEqual(snapshot.pendingAccountIds, ["pending"]);
  assert.deepEqual(snapshot.staleAccountIds, ["stale"]);
  assert.equal(snapshot.complete, false);
});

test("P9.2 ownership, asset/liability class, currency and provenance are explicit and action-neutral", () => {
  const joint = position({ id: "joint", accountId: "joint", externalAccountId: "joint", ownership: "joint", positionClass: "asset" });
  assert.equal(joint.ownership, "joint");
  assert.equal(joint.positionClass, "asset");
  assert.equal(joint.accountCurrency, "USD");
  assert.deepEqual(joint.provenanceRefs, ["provider-balance:checking-123"]);
  assert.equal(joint.protectedActionAuthorized, false);
  assert.throws(() => position({ id: "bad-currency", accountId: "bad-currency", externalAccountId: "bad-currency", accountCurrency: "USD", value: { state: "verified", cents: 1, currency: "EUR" } }), /match canonical account currency/i);
});

test("P9.2 reconciliation accepts newer truth, rejects stale truth, dedupes exact replay, and surfaces same-time conflict", () => {
  const current = position();
  const newer = position({ id: "pos-checking-v2", observedAt: "2026-10-26T05:02:00Z", valuationDate: "2026-10-26T05:01:00Z", value: { state: "verified", cents: 251000, currency: "USD" } });
  const older = position({ id: "pos-checking-old", observedAt: "2026-10-26T04:59:00Z", valuationDate: "2026-10-26T04:58:00Z" });
  const replay = position({ id: "replay", observedAt: current.observedAt, valuationDate: current.valuationDate, value: current.value });
  const conflict = position({ id: "conflict", observedAt: current.observedAt, valuationDate: current.valuationDate, value: { state: "verified", cents: 999999, currency: "USD" } });
  assert.equal(reconcileFinancialAccountPosition(undefined, current), "accept_newer");
  assert.equal(reconcileFinancialAccountPosition(current, newer), "accept_newer");
  assert.equal(reconcileFinancialAccountPosition(current, older), "reject_stale");
  assert.equal(reconcileFinancialAccountPosition(current, replay), "duplicate");
  assert.equal(reconcileFinancialAccountPosition(current, conflict), "manual_conflict");
});

test("P9.2 reconciliation cannot cross owner or canonical account/provider identity", () => {
  const current = position();
  assert.throws(() => reconcileFinancialAccountPosition(current, position({ id: "other-owner", ownerId: "owner-2" })), /scope mismatch/i);
  assert.throws(() => reconcileFinancialAccountPosition(current, position({ id: "other-account", accountId: "other" })), /scope mismatch/i);
  assert.throws(() => reconcileFinancialAccountPosition(current, position({ id: "other-provider", providerKey: "finance-provider:other" })), /scope mismatch/i);
});

test("P9.2 net worth snapshots reject duplicate current positions and preserve currency boundaries", () => {
  const a = position({ id: "a" });
  const duplicateCurrent = position({ id: "b", observedAt: "2026-10-26T05:02:00Z" });
  assert.throws(() => calculatePositionNetWorth("owner-1", [a, duplicateCurrent]), /Multiple current positions/i);
  const eur = position({ id: "eur", accountId: "eur", externalAccountId: "eur", accountCurrency: "EUR", value: { state: "verified", cents: 100000, currency: "EUR" } });
  const usdSnapshot = calculatePositionNetWorth("owner-1", [eur], "USD", "2026-10-26T05:30:00Z");
  assert.deepEqual(usdSnapshot.unavailableAccountIds, ["eur"]);
  assert.equal(usdSnapshot.verifiedNetWorthCents, 0);
  assert.equal(usdSnapshot.complete, false);
});

test("P9.2 durable schema is append-only, owner-scoped, source-dated, state-explicit, and reconciliation-evidenced", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026100000_p9_2_accounts_net_worth.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_finance_account_position_history/i);
  assert.match(sql, /command_center_finance_account_reconciliation_history/i);
  assert.match(sql, /position_state text not null check \(position_state in \('verified','pending','stale','unavailable'\)\)/i);
  assert.match(sql, /account_currency text not null/i);
  assert.match(sql, /ownership text not null/i);
  assert.match(sql, /position_class text not null/i);
  assert.match(sql, /valuation_date timestamptz not null/i);
  assert.match(sql, /verified_zero_count/i);
  assert.match(sql, /pending_count/i);
  assert.match(sql, /stale_count/i);
  assert.match(sql, /unavailable_count/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
});
