import assert from "node:assert/strict";
import { test } from "node:test";

import { AiRouteRegistry } from "../dist/brain/providers.js";
import { AgencyExecutorRegistry } from "../dist/agency/registry.js";
import { SchedulerControlPlane } from "../dist/agency/scheduler.js";
import { FinancialProviderRegistry } from "../dist/finance/providers.js";
import { MetricRegistry } from "../dist/analytics/metrics.js";
import { PlatformProfileRegistry } from "../dist/social/profiles.js";
import { createStandardSurfaceReaders } from "../dist/runtime/surface-readers.js";

const observedAt = "2026-10-23T19:30:00.000Z";

test("standard surface readers report registry facts without fabricating activity or balances", () => {
  const brainRoutes = new AiRouteRegistry();
  brainRoutes.register({ key: "ai-route:free", providerKey: "provider:test", modelId: "model", versionRef: "v1", executionMode: "local", enabled: true, capabilities: ["reason"], cost: "free", privacy: "local", health: "available", qualityRank: 1, latencyRank: 1, quotaAvailable: true });

  const agencyExecutors = new AgencyExecutorRegistry();
  agencyExecutors.register({ key: "executor:normal", version: 1, enabled: true, environments: ["normal_chat"], capabilities: ["build"], projectTypeKeys: [], permissionScopes: [], costClass: "free", health: "available", verificationStrategy: "independent", maxRisk: "high" });
  const agencyScheduler = new SchedulerControlPlane();
  agencyScheduler.acquire("scheduler-1", observedAt, "2026-10-23T20:30:00.000Z");

  const financeProviders = new FinancialProviderRegistry();
  financeProviders.register({ key: "finance-provider:test", version: 1, enabled: true, connectionState: "connected", consentState: "granted", capabilities: ["accounts.read"], dataScopes: ["owner"], freshnessSeconds: 60, health: "available", credentialRef: "secret-ref" });

  const analyticsMetrics = new MetricRegistry();
  analyticsMetrics.register({ key: "metric:test", domain: "test", owner: "analytics", sourceKind: "canonical", formulaRef: null, freshnessMs: 60000, truth: "verified", format: "count", zeroMeaning: "verified zero", missingMeaning: "unknown" });

  const socialProfiles = new PlatformProfileRegistry();
  socialProfiles.register({ key: "platform:test", platform: "test", version: 1, maxCaptionChars: 100, allowedMediaKinds: ["text"], requiredDisclosureTags: [], sourceRef: "policy:test" });
  const socialConnections = [{ accountId: "account:test", state: "connected", credentialRef: "credential:test", credentialState:"healthy", grantedScopes: ["read"], providerHealth: "available", verifiedAt: observedAt, tokenPresent: true }];

  const readers = createStandardSurfaceReaders({ sourceRef: "canonical:test", observedAt, now:()=>observedAt,socialRequiredScopes:["read"], brainRoutes, agencyExecutors, agencyScheduler, financeProviders, analyticsMetrics, socialProfiles, socialConnections });
  const values = new Map(readers.map((reader) => [reader.key, reader.read()]));

  assert.equal(values.get("brain")?.availability, "available");
  assert.match(values.get("brain")?.summary.value ?? "", /1 enabled\/healthy free/);
  assert.equal(values.get("agency")?.availability, "available");
  assert.match(values.get("agency")?.summary.value ?? "", /does not assert any worker is actively executing/i);
  assert.equal(values.get("finance")?.availability, "available");
  assert.match(values.get("finance")?.summary.value ?? "", /No balance is implied/i);
  assert.match(values.get("analytics")?.summary.value ?? "", /does not assert current metric values/i);
  assert.equal(values.get("social")?.availability, "available");
});

test("configured-but-disconnected providers remain disconnected instead of looking active", () => {
  const financeProviders = new FinancialProviderRegistry();
  financeProviders.register({ key: "finance-provider:offline", version: 1, enabled: true, connectionState: "disconnected", consentState: "granted", capabilities: ["accounts.read"], dataScopes: [], freshnessSeconds: 60, health: "available" });
  const reader = createStandardSurfaceReaders({ sourceRef: "canonical:test", observedAt, financeProviders }).find((candidate) => candidate.key === "finance");
  assert.equal(reader?.read().availability, "disconnected");
});

test("social surface rechecks real read-time freshness and never infers live from token/reference alone",()=>{let at=observedAt;const connection={accountId:"account",state:"connected",credentialRef:"secret-ref:test",credentialState:"healthy",grantedScopes:["read"],providerHealth:"available",verifiedAt:observedAt,tokenPresent:true};const reader=createStandardSurfaceReaders({sourceRef:"test",observedAt,now:()=>at,socialRequiredScopes:["read"],socialConnections:[connection]}).find(r=>r.key==="social");assert.equal(reader.read().availability,"available");at="2026-10-23T19:36:00Z";assert.equal(reader.read().availability,"disconnected");const unconfigured=createStandardSurfaceReaders({sourceRef:"test",observedAt,now:()=>observedAt,socialConnections:[connection]}).find(r=>r.key==="social");assert.equal(unconfigured.read().availability,"disconnected");});
