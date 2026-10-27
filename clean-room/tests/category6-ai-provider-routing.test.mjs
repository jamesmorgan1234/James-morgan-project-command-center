import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AiRouteRegistry } from "../dist/brain/index.js";

const migration = readFileSync(new URL("../../supabase/migrations/20261024141500_category6_ai_provider_routing.sql", import.meta.url), "utf8");

test("P6.2 durable AI routes extend the canonical provider registry instead of creating a second provider authority", () => {
  assert.match(migration, /foreign key\(owner_id,provider_key\) references public\.command_center_provider_registry/);
  assert.match(migration, /command_center_ai_model_versions/);
  assert.match(migration, /command_center_ai_route_events/);
  assert.match(migration, /provider_version/);
  assert.match(migration, /registry_version/);
});

test("P6.2 durable routing enforces capability, free-first, privacy, health and quota eligibility", () => {
  assert.match(migration, /btrim\(p_capability\)=any\(m\.capabilities\)/);
  assert.match(migration, /p_allow_paid or m\.cost<>'paid'/);
  assert.match(migration, /case m\.cost when 'free' then 0 when 'unknown' then 1 else 2 end asc/);
  assert.match(migration, /m\.health<>'unavailable'/);
  assert.match(migration, /m\.quota_state<>'exhausted'/);
  assert.match(migration, /p\.health not in \('unavailable','unconfigured'\)/);
  assert.match(migration, /case m\.privacy when 'local' then 0 when 'private_remote' then 1 else 2 end/);
});

test("P6.2 records truthful degraded or unavailable routing evidence and supports local/self-hosted seams", () => {
  assert.match(migration, /result text not null check \(result in \('selected','degraded','unavailable'\)\)/);
  assert.match(migration, /no_eligible_route/);
  assert.match(migration, /best_eligible_route_degraded/);
  assert.match(migration, /execution_mode text not null check \(execution_mode in \('local','self_hosted','remote','hybrid'\)\)/);
  assert.match(migration, /fallback_route_keys/);
});

test("in-memory Brain routing matches free-first/privacy/health/quota policy and provider replacement semantics", () => {
  const routes = new AiRouteRegistry();
  routes.register({ key: "ai-route:local-fast", providerKey: "provider:local", modelId: "local-fast", versionRef: "v1", executionMode: "local", enabled: true, capabilities: ["reason"], cost: "free", privacy: "local", health: "available", qualityRank: 7, latencyRank: 1, quotaAvailable: true });
  routes.register({ key: "ai-route:remote-paid", providerKey: "provider:remote", modelId: "remote-paid", versionRef: "v2", executionMode: "remote", enabled: true, capabilities: ["reason"], cost: "paid", privacy: "remote", health: "available", qualityRank: 10, latencyRank: 2, quotaAvailable: true });
  routes.register({ key: "ai-route:free-exhausted", providerKey: "provider:other", modelId: "free-exhausted", versionRef: "v1", executionMode: "self_hosted", enabled: true, capabilities: ["reason"], cost: "free", privacy: "private_remote", health: "available", qualityRank: 9, latencyRank: 1, quotaAvailable: false });

  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "remote", preferQuality: true })?.key, "ai-route:local-fast");
  assert.equal(routes.route({ capability: "reason", allowPaid: true, maxPrivacy: "local", preferQuality: true })?.key, "ai-route:local-fast");
  routes.remove("ai-route:local-fast");
  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "remote", preferQuality: true }), undefined);
  assert.equal(routes.route({ capability: "reason", allowPaid: true, maxPrivacy: "remote", preferQuality: true })?.key, "ai-route:remote-paid");
});

test("P6.2 preserves local and self-hosted execution modes through route selection", () => {
  const routes = new AiRouteRegistry();
  routes.register({ key: "ai-route:local-model", providerKey: "provider:local", modelId: "local-model", versionRef: "sha256:local-v1", executionMode: "local", enabled: true, capabilities: ["reason"], cost: "free", privacy: "local", health: "available", qualityRank: 5, latencyRank: 1, quotaAvailable: true });
  routes.register({ key: "ai-route:self-hosted-model", providerKey: "provider:self-hosted", modelId: "private-model", versionRef: "sha256:private-v1", executionMode: "self_hosted", enabled: true, capabilities: ["reason"], cost: "free", privacy: "private_remote", health: "available", qualityRank: 7, latencyRank: 2, quotaAvailable: true });

  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "local", preferQuality: true })?.executionMode, "local");
  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "private_remote", preferQuality: true })?.executionMode, "self_hosted");
  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "remote", preferQuality: true })?.executionMode, "self_hosted");
});

test("P6.2 rejects unsupported execution modes and reports unavailable when local/self-hosted routes are ineligible", () => {
  const routes = new AiRouteRegistry();
  assert.throws(() => routes.register({ key: "ai-route:invalid-mode", providerKey: "provider:test", modelId: "model", versionRef: "v1", executionMode: "cloud" , enabled: true, capabilities: ["reason"], cost: "free", privacy: "local", health: "available", qualityRank: 1, latencyRank: 1, quotaAvailable: true }), /execution mode is invalid/);
  routes.register({ key: "ai-route:self-hosted-offline", providerKey: "provider:self-hosted", modelId: "private-model", versionRef: "v1", executionMode: "self_hosted", enabled: false, capabilities: ["reason"], cost: "free", privacy: "private_remote", health: "unavailable", qualityRank: 1, latencyRank: 1, quotaAvailable: true });
  assert.equal(routes.route({ capability: "reason", allowPaid: false, maxPrivacy: "remote", preferQuality: true }), undefined);
});
