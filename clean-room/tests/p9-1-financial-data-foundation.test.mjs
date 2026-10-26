import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FINANCIAL_PRIMITIVE_KINDS,
  assessFinancialProviderConnection,
  createFinancialPrimitive,
  financialCurrentAndHistory,
  normalizeFinancialProviderRecord,
  assertFinancialActionAuthorized
} from "../dist/finance/index.js";

const source = {
  providerKey: "finance-provider:test-bank",
  providerIdentity: "bank:test-bank",
  providerRecordId: "balance-1",
  fetchedAt: "2026-10-26T05:00:00Z",
  freshness: "fresh",
  provenanceRefs: ["provider-response:1"]
};

function primitive(overrides = {}) {
  return {
    id: "balance:v1",
    ownerId: "owner-1",
    kind: "balance",
    canonicalRef: "account:checking",
    truthState: "realized",
    observedAt: "2026-10-26T05:00:00Z",
    amountCents: 125000,
    currency: "USD",
    confidence: { score: 1, basis: "verified", evidenceRefs: ["provider-response:1"] },
    source,
    ...overrides
  };
}

test("P9.1 exposes every required canonical financial primitive", () => {
  assert.deepEqual(FINANCIAL_PRIMITIVE_KINDS, [
    "account", "balance", "asset", "debt", "category", "merchant", "transaction", "valuation", "forecast", "account_type", "connection_state", "confidence"
  ]);
});

test("P9.1 canonical primitives carry provenance, freshness, confidence, and cannot authorize actions", () => {
  const record = createFinancialPrimitive(primitive());
  assert.equal(record.source.providerIdentity, "bank:test-bank");
  assert.equal(record.source.freshness, "fresh");
  assert.deepEqual(record.source.provenanceRefs, ["provider-response:1"]);
  assert.equal(record.confidence.score, 1);
  assert.equal(record.protectedActionAuthorized, false);
});

test("P9.1 provider-specific payload is consumed at the adapter boundary and not leaked to domain record", () => {
  const raw = {
    providerKey: "finance-provider:test-bank",
    providerIdentity: "bank:test-bank",
    providerRecordId: "raw-123",
    ownerId: "owner-1",
    fetchedAt: "2026-10-26T05:00:00Z",
    provenanceRefs: ["provider-response:raw-123"],
    providerPayload: { institution_magic_code: "provider-only", odd_balance_field: 125000 }
  };
  const normalized = normalizeFinancialProviderRecord(raw, {
    id: "balance:normalized",
    kind: "balance",
    canonicalRef: "account:checking",
    truthState: "realized",
    observedAt: "2026-10-26T05:00:00Z",
    amountCents: 125000,
    currency: "USD",
    confidence: { score: 0.99, basis: "provider", evidenceRefs: ["provider-response:raw-123"] },
    freshness: "fresh"
  });
  assert.equal(normalized.amountCents, 125000);
  assert.equal("providerPayload" in normalized, false);
  assert.equal(JSON.stringify(normalized).includes("institution_magic_code"), false);
});

test("P9.1 consent, reconnect, freshness, provider identity, and provenance are explicit", () => {
  const connected = assessFinancialProviderConnection({
    providerKey: "finance-provider:test-bank",
    ownerId: "owner-1",
    providerIdentity: "bank:test-bank",
    connectionState: "connected",
    consentState: "granted",
    consentRef: "consent:owner-1:test-bank",
    lastSuccessfulSyncAt: "2026-10-26T04:59:00Z",
    observedAt: "2026-10-26T05:00:00Z",
    freshnessSeconds: 300,
    provenanceRefs: ["connection-event:1"]
  }, "2026-10-26T05:00:00Z");
  assert.equal(connected.freshness, "fresh");
  assert.equal(connected.reconnectRequired, false);
  assert.equal(connected.historicalRecordsPreserved, true);
  assert.equal(connected.protectedActionAuthorized, false);

  const disconnected = assessFinancialProviderConnection({
    providerKey: "finance-provider:test-bank",
    ownerId: "owner-1",
    providerIdentity: "bank:test-bank",
    connectionState: "disconnected",
    consentState: "granted",
    consentRef: "consent:owner-1:test-bank",
    reconnectRef: "reconnect:test-bank",
    lastSuccessfulSyncAt: "2026-10-25T05:00:00Z",
    observedAt: "2026-10-26T05:00:00Z",
    freshnessSeconds: 300,
    provenanceRefs: ["disconnect-event:1"]
  }, "2026-10-26T05:00:00Z");
  assert.equal(disconnected.freshness, "disconnected");
  assert.equal(disconnected.reconnectRequired, true);
  assert.equal(disconnected.historicalRecordsPreserved, true);
  assert.throws(() => assessFinancialProviderConnection({
    providerKey: "finance-provider:test-bank", ownerId: "owner-1", providerIdentity: "bank:test-bank",
    connectionState: "disconnected", consentState: "granted", consentRef: "consent:1",
    observedAt: "2026-10-26T05:00:00Z", freshnessSeconds: 300, provenanceRefs: ["disconnect-event:1"]
  }, "2026-10-26T05:00:00Z"), /reconnect path/i);
});

test("P9.1 stale/disconnected state remains visible without destroying financial history", () => {
  const v1 = createFinancialPrimitive(primitive({ id: "balance:v1", observedAt: "2026-10-26T04:00:00Z", amountCents: 100000, source: { ...source, providerRecordId: "balance-v1", fetchedAt: "2026-10-26T04:00:00Z", freshness: "fresh" } }));
  const v2 = createFinancialPrimitive(primitive({ id: "balance:v2", observedAt: "2026-10-26T05:00:00Z", amountCents: 125000, source: { ...source, providerRecordId: "balance-v2", freshness: "disconnected" } }));
  const view = financialCurrentAndHistory([v1, v2], "owner-1", "balance", "account:checking");
  assert.equal(view.current.id, "balance:v2");
  assert.equal(view.current.source.freshness, "disconnected");
  assert.deepEqual(view.history.map((item) => item.id), ["balance:v2", "balance:v1"]);
});

test("P9.1 projected versus realized state is explicit and projected values require visible assumptions", () => {
  assert.throws(() => createFinancialPrimitive(primitive({ id: "forecast:bad", kind: "forecast", canonicalRef: "forecast:cash", truthState: "projected", amountCents: 90000 })), /explicit assumptions/i);
  const forecast = createFinancialPrimitive(primitive({
    id: "forecast:good", kind: "forecast", canonicalRef: "forecast:cash", truthState: "projected",
    assumptionRefs: ["assumption:income-flat", "assumption:rent-known"], scenarioRef: "scenario:baseline", amountCents: 90000
  }));
  assert.equal(forecast.truthState, "projected");
  assert.deepEqual(forecast.assumptionRefs, ["assumption:income-flat", "assumption:rent-known"]);
  assert.equal(forecast.scenarioRef, "scenario:baseline");
  assert.throws(() => createFinancialPrimitive(primitive({ assumptionRefs: ["assumption:not-allowed"] })), /Realized financial primitive cannot carry forecast assumptions/i);
});

test("P9.1 sensitive financial actions still require exact authorization and side-effect checks", () => {
  assert.throws(() => assertFinancialActionAuthorized({ id: "pay-1", ownerId: "owner-1", kind: "payment", accountRefs: ["account:checking"], amountCents: 1000, exactOwnerAuthorizationRef: "", providerHealthVerified: true, duplicateSideEffectChecked: true }), /exact owner authorization/i);
  assert.doesNotThrow(() => assertFinancialActionAuthorized({ id: "pay-1", ownerId: "owner-1", kind: "payment", accountRefs: ["account:checking"], amountCents: 1000, exactOwnerAuthorizationRef: "owner-auth:pay-1", providerHealthVerified: true, duplicateSideEffectChecked: true }));
});

test("P9.1 durable foundation is append-only, owner-scoped, provenance-preserving, and exposes current/history separation", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026095000_p9_1_financial_data_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_finance_provider_connection_history/i);
  assert.match(sql, /command_center_finance_primitive_history/i);
  assert.match(sql, /primitive_kind in \('account','balance','asset','debt','category','merchant','transaction','valuation','forecast','account_type','connection_state','confidence'\)/i);
  assert.match(sql, /provenance_refs text\[\] not null/i);
  assert.match(sql, /source_freshness text not null/i);
  assert.match(sql, /truth_state text not null/i);
  assert.match(sql, /assumption_refs text\[\] not null/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
  assert.match(sql, /command_center_finance_provider_connections_current/i);
  assert.match(sql, /command_center_finance_primitives_current/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.match(sql, /owner_id=\(select auth\.uid\(\)\)/i);
});
