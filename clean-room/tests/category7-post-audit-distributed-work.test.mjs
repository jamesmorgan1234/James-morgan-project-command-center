import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  advanceSchedulingRound,
  fairReadyTasks,
  recoverExpiredResourceClaims,
  validateDelegatedAuthority,
  validateDependencyGraph
} from "../dist/agency/index.js";

const migrationUrl = new URL("../../supabase/migrations/20261025013000_category7_distributed_work_hardening.sql", import.meta.url);
const migration = () => readFile(migrationUrl, "utf8");

function task(id, overrides = {}) {
  return {
    id, runId: "run-1", projectId: "project-1", title: id, state: "ready", dependencyIds: [], capability: "code", risk: "low", preferredEnvironment: "normal_chat", evidenceRefs: ["e"], idempotencyKey: `idem-${id}`,
    priority: 5, createdSequence: Number(id.replace(/\D/g, "")) || 0, affinityKeys: [], antiAffinityKeys: [], waitRounds: 0, ...overrides
  };
}

const admission = (overrides = {}) => ({ monetaryBudgetCents: 0, maxConcurrent: 4, maxQueueDepth: 20, maxRetries: 3, maxRuntimeMs: 60000, ...overrides });

function delegated(overrides = {}) {
  return {
    parentTaskId: "parent", childTaskId: "child", depth: 1, parentScopes: ["project:read", "repo:branch"], childScopes: ["project:read"], capability: "research",
    controllingOrchestrator: "command-center", parentSubjectId: "agent:parent", childSubjectId: "agent:child",
    parentScope: { ownerId: "owner-1", companyId: "company-1", projectId: "project-1", accountId: "acct-1", environment: "staging" },
    childScope: { ownerId: "owner-1", companyId: "company-1", projectId: "project-1", accountId: "acct-1", environment: "staging" },
    parentAdmission: admission(), childAdmission: admission({ maxConcurrent: 2, maxQueueDepth: 10, maxRetries: 2, maxRuntimeMs: 30000 }),
    parentResourceLimits: { cpuMs: 1000, outboundCalls: 10 }, childResourceLimits: { cpuMs: 500, outboundCalls: 5 },
    policyVersion: "category2-v1", currentPolicyVersion: "category2-v1", issuedAt: "2026-10-25T01:00:00Z", expiresAt: "2026-10-25T02:00:00Z", revoked: false, evidenceRefs: ["evidence:delegation"],
    ...overrides
  };
}

test("dependency graph validator rejects missing, cross-run, and cyclic edges", () => {
  assert.deepEqual(validateDependencyGraph([task("1"), task("2", { dependencyIds: ["1"] })]), { taskCount: 2, edgeCount: 1, acyclic: true });
  assert.throws(() => validateDependencyGraph([task("1", { dependencyIds: ["missing"] })]), /Missing dependency/);
  assert.throws(() => validateDependencyGraph([task("1"), task("2", { runId: "run-2", dependencyIds: ["1"] })]), /same project\/run/);
  assert.throws(() => validateDependencyGraph([task("1", { dependencyIds: ["2"] }), task("2", { dependencyIds: ["1"] })]), /Dependency cycle detected/);
});

test("fair scheduler gives bounded-starved work precedence and wait rounds cap/reset deterministically", () => {
  const tasks = [
    task("1", { priority: 0, createdSequence: 10, waitRounds: 0 }),
    task("2", { priority: 100, createdSequence: 1, waitRounds: 3 }),
    task("3", { priority: 1, createdSequence: 11, waitRounds: 1 })
  ];
  assert.deepEqual(fairReadyTasks(tasks, 3).map((x) => x.id), ["2", "1", "3"]);
  const advanced = advanceSchedulingRound(tasks, ["2"], 3);
  assert.equal(advanced.find((x) => x.id === "2").waitRounds, 0);
  assert.equal(advanced.find((x) => x.id === "1").waitRounds, 1);
  assert.equal(advanced.find((x) => x.id === "3").waitRounds, 2);
  const capped = advanceSchedulingRound(advanced, ["1"], 3);
  assert.ok(capped.every((x) => x.waitRounds <= 3));
});

test("expired resource recovery is evidence-backed, stable ordered, and does not reap live or already released claims", () => {
  const claims = [
    { claimId: "c2", ownerKey: "run-b", resourceKey: "provider:z", mode: "exclusive", generation: 2, acquiredAt: "2026-10-25T00:00:00Z", expiresAt: "2026-10-25T00:30:00Z", evidenceRefs: ["e:2"] },
    { claimId: "c1", ownerKey: "run-a", resourceKey: "file:a", mode: "exclusive", generation: 1, acquiredAt: "2026-10-25T00:00:00Z", expiresAt: "2026-10-25T00:30:00Z", evidenceRefs: ["e:1"] },
    { claimId: "live", ownerKey: "run-live", resourceKey: "file:b", mode: "shared", generation: 1, acquiredAt: "2026-10-25T00:00:00Z", expiresAt: "2026-10-25T02:00:00Z", evidenceRefs: ["e:live"] },
    { claimId: "released", ownerKey: "run-old", resourceKey: "file:c", mode: "shared", generation: 1, acquiredAt: "2026-10-25T00:00:00Z", expiresAt: "2026-10-25T00:10:00Z", evidenceRefs: ["e:old"], releasedAt: "2026-10-25T00:05:00Z" }
  ];
  const recovered = recoverExpiredResourceClaims(claims, "2026-10-25T01:00:00Z", ["evidence:reap"]);
  assert.deepEqual(recovered.events.map((x) => x.resourceKey), ["file:a", "provider:z"]);
  assert.equal(recovered.claims.find((x) => x.claimId === "live").releasedAt, undefined);
  assert.equal(recovered.claims.find((x) => x.claimId === "released").releasedAt, "2026-10-25T00:05:00Z");
  assert.throws(() => recoverExpiredResourceClaims(claims, "2026-10-25T01:00:00Z", []), /requires unique evidence/);
});

test("delegated authority binds identity and immutable scope, attenuates zero-budget resources, and revalidates current policy", () => {
  assert.doesNotThrow(() => validateDelegatedAuthority(delegated(), 3, 1, 3, "2026-10-25T01:10:00Z"));
  assert.throws(() => validateDelegatedAuthority(delegated({ controllingOrchestrator: "other" }), 3, 1, 3, "2026-10-25T01:10:00Z"), /Command Center/);
  assert.throws(() => validateDelegatedAuthority(delegated({ childSubjectId: "agent:parent" }), 3, 1, 3, "2026-10-25T01:10:00Z"), /distinct bound/);
  assert.throws(() => validateDelegatedAuthority(delegated({ childScope: { ownerId: "owner-1", companyId: "company-2", projectId: "project-1", accountId: "acct-1", environment: "staging" } }), 3, 1, 3, "2026-10-25T01:10:00Z"), /scope mismatch/);
  assert.throws(() => validateDelegatedAuthority(delegated({ childAdmission: admission({ monetaryBudgetCents: 1 }) }), 3, 1, 3, "2026-10-25T01:10:00Z"), /monetary budget amplification/);
  assert.throws(() => validateDelegatedAuthority(delegated({ childResourceLimits: { cpuMs: 1001 } }), 3, 1, 3, "2026-10-25T01:10:00Z"), /resource amplification/);
  assert.throws(() => validateDelegatedAuthority(delegated({ currentPolicyVersion: "category2-v2" }), 3, 1, 3, "2026-10-25T01:10:00Z"), /policy version is stale/);
  assert.throws(() => validateDelegatedAuthority(delegated({ revoked: true }), 3, 1, 3, "2026-10-25T01:10:00Z"), /revoked/);
  assert.throws(() => validateDelegatedAuthority(delegated(), 3, 1, 3, "2026-10-25T02:00:00Z"), /expired/);
});

test("durable hardening enforces same-run acyclic dependencies and starvation-safe bounded scheduling", async () => {
  const sql = await migration();
  assert.match(sql, /Dependency must stay in same project\/run graph/);
  assert.match(sql, /Dependency cycle detected/);
  assert.match(sql, /trg_c7_dependency_edge_guard/);
  assert.match(sql, /command_center_agency_scheduler_wait_state/);
  assert.match(sql, /wait_rounds=least\(p_starvation_rounds/);
  assert.match(sql, /starvation_escalated/);
  assert.match(sql, /order by starved desc,w\.wait_rounds desc,t\.priority asc/);
});

test("durable resource recovery only reaps expired claims under stable locks and records immutable evidence", async () => {
  const sql = await migration();
  assert.match(sql, /command_center_agency_resource_recovery_events/);
  assert.match(sql, /released_at is null and expires_at<=p_now/);
  assert.match(sql, /order by resource_key,claim_id/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /cause='lease_expired'/);
  assert.match(sql, /Resource recovery requires evidence/);
});

test("durable delegation authority keeps Command Center on top and blocks scope, spend, resource, and stale-policy amplification", async () => {
  const sql = await migration();
  assert.match(sql, /controlling_orchestrator='command-center'/);
  assert.match(sql, /distinct bound parent\/child subject identities/);
  assert.match(sql, /Delegated monetary budget must remain zero without separate owner spending authorization/);
  assert.match(sql, /Delegation resource amplification blocked/);
  assert.match(sql, /c7_current_delegation_policy_version/);
  assert.match(sql, /Delegation policy version is stale/);
  assert.match(sql, /command_center_agency_revalidate_delegation_authority/);
  assert.match(sql, /Underlying delegation is no longer active/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_(scheduler_wait_state|resource_recovery_events|delegation_authority)\s+to\s+authenticated/i);
});
