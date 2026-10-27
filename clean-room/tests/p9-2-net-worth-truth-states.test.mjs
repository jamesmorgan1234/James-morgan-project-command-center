import test from "node:test";
import assert from "node:assert/strict";
import {
  createFinancialAccountPosition,
  calculatePositionNetWorth
} from "../dist/finance/index.js";

const OBSERVED_AT = "2026-10-27T18:30:00Z";

function position({ id, value, valuationDate, positionClass = "asset" }) {
  return createFinancialAccountPosition({
    id: `position-${id}`,
    ownerId: "owner-p9-2",
    accountId: id,
    providerKey: "finance-provider:test-bank",
    externalAccountId: `external-${id}`,
    accountType: positionClass === "liability" ? "credit_card" : "checking",
    accountCurrency: "USD",
    ownership: "sole",
    positionClass,
    value,
    valuationDate,
    observedAt: OBSERVED_AT,
    provenanceRefs: [`source-${id}`]
  });
}

test("P9.2 net worth keeps verified zero, pending, unavailable and source dates distinct", () => {
  const verifiedZero = position({
    id: "verified-zero",
    value: { state: "verified", cents: 0, currency: "USD" },
    valuationDate: "2026-10-27T18:00:00Z"
  });
  const pending = position({
    id: "pending",
    value: { state: "pending", cents: 2500, currency: "USD" },
    valuationDate: "2026-10-27T17:45:00Z"
  });
  const unavailable = position({
    id: "unavailable",
    value: { state: "unavailable", reason: "provider_temporarily_unavailable" },
    valuationDate: "2026-10-27T17:30:00Z",
    positionClass: "liability"
  });

  const snapshot = calculatePositionNetWorth(
    "owner-p9-2",
    [verifiedZero, pending, unavailable],
    "USD",
    OBSERVED_AT
  );

  assert.equal(snapshot.verifiedNetWorthCents, 0);
  assert.deepEqual(snapshot.verifiedAccountIds, ["verified-zero"]);
  assert.deepEqual(snapshot.verifiedZeroAccountIds, ["verified-zero"]);
  assert.deepEqual(snapshot.pendingAccountIds, ["pending"]);
  assert.deepEqual(snapshot.unavailableAccountIds, ["unavailable"]);
  assert.deepEqual(snapshot.staleAccountIds, []);
  assert.deepEqual(snapshot.sourceDatesByAccount, {
    "verified-zero": "2026-10-27T18:00:00Z",
    pending: "2026-10-27T17:45:00Z",
    unavailable: "2026-10-27T17:30:00Z"
  });
  assert.equal(snapshot.complete, false);
});
