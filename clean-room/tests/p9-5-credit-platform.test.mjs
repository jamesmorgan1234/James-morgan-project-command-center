import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assessCreditRefresh,
  assertCreditDataIsolation,
  calculateCreditUtilizationBasisPoints,
  createCanonicalCreditFactor,
  createCanonicalCreditScoreFact,
  createCreditReportAccount,
  createCreditReportSnapshot,
  recommendFromFactors
} from "../dist/finance/index.js";

const identity = { provider: "Experian", model: "VantageScore 3.0", reportDate: "2026-10-26", reportId: "report-1" };

function score(overrides = {}) {
  return createCanonicalCreditScoreFact({ ...identity, ownerId: "owner-1", score: 712, observedAt: "2026-10-26T12:00:00Z", sourceRefs: ["credit-report:1"], refreshState: "fresh", ...overrides });
}
function factor(overrides = {}) {
  return createCanonicalCreditFactor({ ...identity, ownerId: "owner-1", key: "utilization", impact: "negative", observedAt: "2026-10-26T12:00:00Z", evidenceRefs: ["credit-factor:utilization"], ...overrides });
}
function account(overrides = {}) {
  return createCreditReportAccount({ ...identity, ownerId: "owner-1", accountRef: "credit-card-1", creditorName: "Example Bank", accountState: "open", balanceCents: 25000, creditLimitCents: 100000, observedAt: "2026-10-26T12:00:00Z", evidenceRefs: ["credit-account:1"], ...overrides });
}
function snapshot(overrides = {}) {
  return createCreditReportSnapshot({ ...identity, ownerId: "owner-1", observedAt: "2026-10-26T12:00:00Z", refreshState: "fresh", scoreFacts: [score()], factors: [factor()], accounts: [account()], sourceRefs: ["credit-report:1"], ...overrides });
}

test("P9.5 every canonical score/factor/account carries provider model report date and report identity", () => {
  for (const item of [score(), factor(), account()]) {
    assert.equal(item.provider, "Experian");
    assert.equal(item.model, "VantageScore 3.0");
    assert.equal(item.reportDate, "2026-10-26");
    assert.equal(item.reportId, "report-1");
    assert.equal(item.protectedActionAuthorized, false);
  }
});

test("P9.5 report snapshot rejects cross-owner, cross-provider, cross-model, cross-date or cross-report children", () => {
  assert.throws(() => snapshot({ scoreFacts: [score({ ownerId: "owner-2" })] }), /child identity mismatch/i);
  assert.throws(() => snapshot({ factors: [factor({ provider: "Other Bureau" })] }), /child identity mismatch/i);
  assert.throws(() => snapshot({ accounts: [account({ model: "Other Model" })] }), /child identity mismatch/i);
  assert.throws(() => snapshot({ accounts: [account({ reportDate: "2026-10-25" })] }), /child identity mismatch/i);
  assert.throws(() => snapshot({ factors: [factor({ reportId: "other-report" })] }), /child identity mismatch/i);
});

test("P9.5 utilization distinguishes unavailable basis from verified zero and validates supplied truth", () => {
  assert.equal(calculateCreditUtilizationBasisPoints(0, 100000), 0);
  assert.equal(calculateCreditUtilizationBasisPoints(25000, 100000), 2500);
  assert.equal(calculateCreditUtilizationBasisPoints(25000, undefined), undefined);
  assert.equal(calculateCreditUtilizationBasisPoints(25000, 0), undefined);
  assert.equal(account({ balanceCents: 0, creditLimitCents: 100000 }).utilizationBasisPoints, 0);
  assert.throws(() => account({ utilizationBasisPoints: 9999 }), /must match balance\/limit truth/i);
});

test("P9.5 credit refresh preserves pending/unavailable and derives fresh versus stale from report observation", () => {
  assert.equal(assessCreditRefresh(snapshot(), "2026-10-26T12:30:00Z", 60 * 60 * 1000), "fresh");
  assert.equal(assessCreditRefresh(snapshot(), "2026-10-26T14:00:00Z", 60 * 60 * 1000), "stale");
  assert.equal(assessCreditRefresh(snapshot({ refreshState: "pending" }), "2026-10-26T14:00:00Z", 60 * 60 * 1000), "pending");
  assert.equal(assessCreditRefresh(snapshot({ refreshState: "unavailable" }), "2026-10-26T14:00:00Z", 60 * 60 * 1000), "unavailable");
  assert.throws(() => assessCreditRefresh(snapshot(), "2026-10-26T11:59:59Z", 1000), /cannot be in the future/i);
});

test("P9.5 credit data is isolated from unrelated contexts and cross-owner access", () => {
  assert.doesNotThrow(() => assertCreditDataIsolation({ ownerId: "owner-1", subjectOwnerId: "owner-1", contextDomain: "finance:credit", scopes: ["finance:credit:read"] }));
  assert.throws(() => assertCreditDataIsolation({ ownerId: "owner-1", subjectOwnerId: "owner-2", contextDomain: "finance:credit", scopes: ["finance:credit:read"] }), /owner boundary/i);
  assert.throws(() => assertCreditDataIsolation({ ownerId: "owner-1", subjectOwnerId: "owner-1", contextDomain: "projects", scopes: ["finance:credit:read"] }), /unrelated context/i);
  assert.throws(() => assertCreditDataIsolation({ ownerId: "owner-1", subjectOwnerId: "owner-1", contextDomain: "finance:credit", scopes: ["finance:read"] }), /Credit read scope missing/i);
});

test("P9.5 recommendations remain factor-evidenced and never forecast a score", () => {
  const recommendation = recommendFromFactors("Reduce revolving utilization", "Current report identifies utilization as a negative factor.", [{ key: "utilization", impact: "negative", evidenceRef: "credit-factor:utilization" }]);
  assert.deepEqual(recommendation.factorRefs, ["credit-factor:utilization"]);
  assert.equal(recommendation.scoreForecast, null);
});

test("P9.5 durable credit truth is append-only, owner-scoped, refresh-explicit, and identity-complete", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026103000_p9_5_credit_platform.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_credit_report_history/i);
  assert.match(sql, /command_center_credit_score_history/i);
  assert.match(sql, /command_center_credit_factor_history/i);
  assert.match(sql, /command_center_credit_account_history/i);
  assert.match(sql, /provider text not null/i);
  assert.match(sql, /model text not null/i);
  assert.match(sql, /report_date date not null/i);
  assert.match(sql, /refresh_state text not null check \(refresh_state in \('fresh','stale','pending','unavailable'\)\)/i);
  assert.match(sql, /utilization_basis_points integer/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
});
