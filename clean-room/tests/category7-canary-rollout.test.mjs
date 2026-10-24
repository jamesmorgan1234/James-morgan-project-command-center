import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateCanary } from "../dist/agency/rollout.js";

const migrationUrl = new URL("../../supabase/migrations/20261024171000_category7_canary_rollout.sql", import.meta.url);

test("P7.22 durable shadow/canary evidence recommends rollback on protected, duplicate, success, or verification regression without deploying", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /mode text not null check \(mode in \('shadow','canary'\)\)/);
  assert.match(sql, /protected_actions_allowed boolean not null default false check \(protected_actions_allowed=false\)/);
  assert.match(sql, /protected_boundary_violation_count/);
  assert.match(sql, /duplicate_side_effect_count/);
  assert.match(sql, /success_rate_regression/);
  assert.match(sql, /verification_regression/);
  assert.match(sql, /protected_side_effect_executed boolean not null default false check \(protected_side_effect_executed=false\)/);
  assert.match(sql, /deployment_changed boolean not null default false check \(deployment_changed=false\)/);
  assert.match(sql, /deployment_changed',false/);
});

test("P7.22 runtime canary evaluator blocks unsafe candidate promotion", () => {
  assert.equal(evaluateCanary({ stableSuccessRate: 0.99, candidateSuccessRate: 0.99, stableVerificationFailureRate: 0.01, candidateVerificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 }, 0.02).action, "promote");
  assert.equal(evaluateCanary({ stableSuccessRate: 0.99, candidateSuccessRate: 0.99, stableVerificationFailureRate: 0.01, candidateVerificationFailureRate: 0.01, protectedBoundaryViolationCount: 1, duplicateSideEffectCount: 0 }, 0.02).action, "rollback");
  assert.equal(evaluateCanary({ stableSuccessRate: 0.99, candidateSuccessRate: 0.99, stableVerificationFailureRate: 0.01, candidateVerificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 1 }, 0.02).action, "rollback");
  assert.equal(evaluateCanary({ stableSuccessRate: 0.99, candidateSuccessRate: 0.90, stableVerificationFailureRate: 0.01, candidateVerificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 }, 0.02).action, "rollback");
  assert.equal(evaluateCanary({ stableSuccessRate: 0.99, candidateSuccessRate: 0.99, stableVerificationFailureRate: 0.01, candidateVerificationFailureRate: 0.04, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 }, 0.02).action, "rollback");
});
