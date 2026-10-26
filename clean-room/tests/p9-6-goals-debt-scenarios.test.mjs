import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildFinancialDecisionRecommendation, evaluateFinancialDecisionScenario } from "../dist/finance/index.js";

function scenario(overrides = {}) {
  return evaluateFinancialDecisionScenario({
    id: "scenario-1", ownerId: "owner-1", name: "Debt payoff comparison", currency: "USD",
    goalRefs: ["goal:debt"], budgetRefs: ["budget:current"], debtRefs: ["debt:card-1"], cashflowRefs: ["cashflow:current"],
    inputs: [
      { key: "verified_cash", cents: 100000, source: "verified_current", evidenceRefs: ["balance:checking"] },
      { key: "assumed_payment", cents: -25000, source: "owner_assumption", evidenceRefs: ["owner:payment:250"], sensitivity: { lowCents: -40000, highCents: -10000 } }
    ], observedAt: "2026-10-26T14:00:00Z", ...overrides
  });
}

test("P9.6 scenario output separates verified current inputs from assumptions", () => {
  const result = scenario();
  assert.equal(result.resultingCents, 75000);
  assert.equal(result.lowSensitivityCents, 60000);
  assert.equal(result.highSensitivityCents, 90000);
  assert.deepEqual(result.verifiedInputKeys, ["verified_cash"]);
  assert.deepEqual(result.assumptionKeys, ["assumed_payment"]);
  assert.deepEqual(result.evidenceRefs, ["balance:checking"]);
  assert.deepEqual(result.assumptionRefs, ["owner:payment:250"]);
  assert.equal(result.scoreForecast, null);
  assert.equal(result.outcomePromise, false);
  assert.equal(result.protectedActionAuthorized, false);
});

test("P9.6 verified data requires evidence and cannot hide sensitivity assumptions", () => {
  assert.throws(() => scenario({ inputs: [{ key: "verified", cents: 100, source: "verified_current", evidenceRefs: [] }] }), /must contain nonblank references/i);
  assert.throws(() => scenario({ inputs: [{ key: "verified", cents: 100, source: "verified_current", evidenceRefs: ["evidence:1"], sensitivity: { lowCents: 0, highCents: 200 } }] }), /cannot carry sensitivity assumption/i);
});

test("P9.6 assumption sensitivity must contain point estimate and remain explicit", () => {
  assert.throws(() => scenario({ inputs: [{ key: "assumption", cents: 100, source: "model_assumption", evidenceRefs: ["model:1"], sensitivity: { lowCents: 200, highCents: 300 } }] }), /outside sensitivity range/i);
  assert.throws(() => scenario({ inputs: [{ key: "assumption", cents: 100, source: "model_assumption", evidenceRefs: ["model:1"], sensitivity: { lowCents: 200, highCents: 100 } }] }), /inverted/i);
});

test("P9.6 goals budgets debt and cashflow lineage remains visible", () => {
  const result = scenario();
  assert.deepEqual(result.goalRefs, ["goal:debt"]);
  assert.deepEqual(result.budgetRefs, ["budget:current"]);
  assert.deepEqual(result.debtRefs, ["debt:card-1"]);
  assert.deepEqual(result.cashflowRefs, ["cashflow:current"]);
});

test("P9.6 recommendations require verified evidence and never promise score/outcome changes", () => {
  const result = scenario();
  const recommendation = buildFinancialDecisionRecommendation("Consider higher payment", "Scenario shows available cash after an owner-selected payment assumption.", result, ["budget:current"]);
  assert.ok(recommendation.evidenceRefs.includes("balance:checking"));
  assert.ok(recommendation.evidenceRefs.includes("budget:current"));
  assert.deepEqual(recommendation.assumptionRefs, ["owner:payment:250"]);
  assert.equal(recommendation.scoreForecast, null);
  assert.equal(recommendation.outcomePromise, false);
  assert.equal(recommendation.protectedActionAuthorized, false);
  const onlyAssumptions = evaluateFinancialDecisionScenario({ id: "assumptions", ownerId: "owner-1", name: "Assumptions only", currency: "USD", goalRefs: [], budgetRefs: [], debtRefs: [], cashflowRefs: [], inputs: [{ key: "future", cents: 1, source: "model_assumption", evidenceRefs: [] }], observedAt: "2026-10-26T14:00:00Z" });
  assert.throws(() => buildFinancialDecisionRecommendation("No evidence", "Cannot recommend solely from unsupported assumptions.", onlyAssumptions), /requires verified evidence/i);
});

test("P9.6 durable scenarios are append-only, owner-scoped and prohibit score/outcome promises", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026104000_p9_6_goals_debt_scenarios.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_finance_decision_scenario_history/i);
  assert.match(sql, /verified_input_keys text\[\]/i);
  assert.match(sql, /assumption_keys text\[\]/i);
  assert.match(sql, /low_sensitivity_cents bigint/i);
  assert.match(sql, /high_sensitivity_cents bigint/i);
  assert.match(sql, /score_forecast is null/i);
  assert.match(sql, /outcome_promise=false/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
});
