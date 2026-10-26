import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CapabilityMethodPortfolio } from "../dist/kernel/index.js";

const NOW = "2026-10-25T22:00:00Z";
const LATER = "2026-11-25T22:00:00Z";

function method(overrides = {}) {
  return {
    key: "mth_balanced-analysis",
    version: 1,
    enabled: true,
    capabilityKey: "capability:analysis",
    implementationVersionRef: "analysis-v1",
    lifecycle: "active",
    applicabilityScopeKeys: ["project:prj_command-center"],
    contraindications: [],
    prerequisites: ["input:structured"],
    qualityScore: 0.9,
    calibrationScore: 0.9,
    latencyMs: 900,
    resourceClass: "low",
    costClass: "free",
    privacyClass: "local",
    maxDataSensitivity: "secret",
    securityAssurance: 0.95,
    reliabilityScore: 0.95,
    benchmarkEvidenceIds: ["evd_method-benchmark"],
    outcomeEvidenceIds: ["evd_method-outcome"],
    provenanceEvidenceIds: ["evd_method-provenance"],
    fallbackMethodIds: [],
    rollbackEvidenceId: "evd_method-rollback",
    revalidatedAt: NOW,
    revalidateAfter: LATER,
    ...overrides
  };
}

function request(overrides = {}) {
  return {
    capabilityKey: "capability:analysis",
    scopeKeys: ["project:prj_command-center"],
    conditions: [],
    availablePrerequisites: ["input:structured"],
    allowPaid: false,
    maxPrivacy: "local",
    dataSensitivity: "protected",
    maxResourceClass: "low",
    allowExperimental: false,
    optimization: "quality",
    now: "2026-10-26T00:00:00Z",
    ...overrides
  };
}

test("PIF.2 keeps competing methods side by side and routes by current context instead of a universal default", () => {
  const portfolio = new CapabilityMethodPortfolio();
  portfolio.register(method({ key: "mth_high-quality", qualityScore: 0.98, latencyMs: 1200, fallbackMethodIds: ["mth_fast-local"] }));
  portfolio.register(method({ key: "mth_fast-local", qualityScore: 0.82, calibrationScore: 0.88, reliabilityScore: 0.93, latencyMs: 120 }));
  assert.equal(portfolio.methodsFor("capability:analysis").length, 2);
  assert.equal(portfolio.route(request({ optimization: "quality" })).key, "mth_high-quality");
  assert.equal(portfolio.route(request({ optimization: "latency" })).key, "mth_fast-local");
  assert.equal(portfolio.fallbackFor("mth_high-quality", request({ optimization: "quality" })).key, "mth_fast-local");
});

test("PIF.2 enforces applicability, prerequisites, contraindications, cost, privacy, resource and revalidation gates", () => {
  const portfolio = new CapabilityMethodPortfolio();
  portfolio.register(method({ key: "mth_context-bound", contraindications: ["condition:offline"], costClass: "paid", privacyClass: "private_remote", resourceClass: "medium" }));
  assert.equal(portfolio.route(request()), undefined);
  assert.equal(portfolio.route(request({ allowPaid: true, maxPrivacy: "private_remote", maxResourceClass: "medium" })).key, "mth_context-bound");
  assert.equal(portfolio.route(request({ allowPaid: true, maxPrivacy: "private_remote", maxResourceClass: "medium", conditions: ["condition:offline"] })), undefined);
  assert.equal(portfolio.route(request({ allowPaid: true, maxPrivacy: "private_remote", maxResourceClass: "medium", availablePrerequisites: [] })), undefined);
  assert.equal(portfolio.route(request({ allowPaid: true, maxPrivacy: "private_remote", maxResourceClass: "medium", scopeKeys: ["company:cmp_other"] })), undefined);
  assert.equal(portfolio.route(request({ allowPaid: true, maxPrivacy: "private_remote", maxResourceClass: "medium", now: "2026-12-01T00:00:00Z" })), undefined);
});

test("PIF.2 validates evidence, lifecycle, rollback, version replacement and fallback safety", () => {
  const portfolio = new CapabilityMethodPortfolio();
  assert.throws(() => portfolio.register(method({ key: "not-canonical" })), /canonical identifier/i);
  assert.throws(() => portfolio.register(method({ key: "mth_no-proof", benchmarkEvidenceIds: [] })), /requires at least one value/i);
  assert.throws(() => portfolio.register(method({ key: "mth_self-fallback", fallbackMethodIds: ["mth_self-fallback"] })), /fall back to itself/i);
  portfolio.register(method({ key: "mth_replace-me" }));
  portfolio.replace(method({ key: "mth_replace-me", version: 2, reliabilityScore: 0.99 }), 1);
  assert.equal(portfolio.get("mth_replace-me").version, 2);
});

test("PIF.2 durable schema is a method portfolio under existing capability ownership", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261025220000_pif2_capability_method_portfolio.sql", import.meta.url), "utf8");
  assert.match(sql, /create table if not exists public\.command_center_capability_methods/i);
  assert.match(sql, /create table if not exists public\.command_center_capability_method_versions/i);
  assert.match(sql, /capability_key/i);
  assert.match(sql, /applicability_scope_keys/i);
  assert.match(sql, /contraindications/i);
  assert.match(sql, /prerequisites/i);
  assert.match(sql, /quality_score/i);
  assert.match(sql, /calibration_score/i);
  assert.match(sql, /latency_ms/i);
  assert.match(sql, /cost_class/i);
  assert.match(sql, /privacy_class/i);
  assert.match(sql, /security_assurance/i);
  assert.match(sql, /reliability_score/i);
  assert.match(sql, /benchmark_evidence_ids/i);
  assert.match(sql, /outcome_evidence_ids/i);
  assert.match(sql, /fallback_method_ids/i);
  assert.match(sql, /rollback_evidence_id/i);
  assert.match(sql, /revalidate_after/i);
  assert.doesNotMatch(sql, /universal_default|default_method/i);
  assert.match(sql, /revoke all on table public\.%I from public,anon,authenticated/i);
});
