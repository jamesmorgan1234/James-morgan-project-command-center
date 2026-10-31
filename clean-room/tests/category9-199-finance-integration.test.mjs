import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FinancialAccountRegistry,
  authorizeFinancialActionExecution,
  calculatePositionNetWorth,
  createCanonicalCreditScoreFact,
  createFinancialAccountPosition,
  createNormalizedFinancialTransaction,
  createRecurringObligation,
  evaluateFinancialDataAccess,
  evaluateFinancialDecisionScenario,
  assessFinancialRecovery,
  summarizeNormalizedCashflow
} from "../dist/finance/index.js";

const OWNER = "owner:p9";
const NOW = "2026-10-31T12:00:00Z";
const manifest = JSON.parse(readFileSync(new URL("../../roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json", import.meta.url), "utf8"));
const financeIndexSource = readFileSync(new URL("../src/finance/index.ts", import.meta.url), "utf8");
const phaseProofFiles = [
  "p9-1-account-provider-rebind.test.mjs",
  "p9-1-financial-data-foundation.test.mjs",
  "p9-2-accounts-net-worth.test.mjs",
  "p9-2-net-worth-truth-states.test.mjs",
  "p9-3-transactions-cashflow.test.mjs",
  "p9-3-transfer-dedup-cashflow.test.mjs",
  "p9-4-recurring-obligations.test.mjs",
  "p9-5-credit-platform.test.mjs",
  "p9-6-goals-debt-scenarios.test.mjs",
  "p9-7-protected-financial-actions.test.mjs",
  "p9-8-financial-identity-isolation.test.mjs",
  "p9-8-postgres-isolation.test.mjs",
  "p9-8-server-capability.test.mjs",
  "p9-9-durable-attempts.test.mjs",
  "p9-9-fault-injection.test.mjs",
  "p9-9-finance-recovery-evidence.test.mjs"
];
const phaseProofSource = phaseProofFiles.map((name) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8")).join("\n");

function position(id, value, positionClass = "asset") {
  return createFinancialAccountPosition({
    id: `position:${id}`,
    ownerId: OWNER,
    accountId: `account:${id}`,
    providerKey: "finance-provider:test-bank",
    externalAccountId: `external:${id}`,
    accountType: positionClass === "liability" ? "credit_card" : "checking",
    accountCurrency: "USD",
    ownership: "sole",
    positionClass,
    value,
    valuationDate: "2026-10-31T11:00:00Z",
    observedAt: NOW,
    provenanceRefs: [`provider:${id}`]
  });
}

function transaction(overrides = {}) {
  return createNormalizedFinancialTransaction({
    id: "transaction:p9",
    canonicalTransactionRef: "transaction:canonical:p9",
    ownerId: OWNER,
    accountId: "account:checking",
    providerKey: "finance-provider:test-bank",
    providerIdentity: "bank:test-bank",
    externalTransactionId: "provider-transaction:p9",
    postingState: "posted",
    occurredAt: "2026-10-31T10:00:00Z",
    postedAt: "2026-10-31T10:05:00Z",
    observedAt: "2026-10-31T10:06:00Z",
    amountCents: -1000,
    currency: "USD",
    category: "Bills",
    categoryProvenanceRefs: ["provider:category:p9"],
    merchantProvenanceRefs: [],
    classificationSource: "provider",
    classificationConfidence: 0.9,
    rawSourceRefs: ["raw:p9"],
    ...overrides
  });
}

function recovery(overrides = {}) {
  return {
    id: "recovery:p9",
    ownerId: OWNER,
    providerKey: "finance-provider:test-bank",
    incidentKind: "restore",
    observedAt: NOW,
    evidenceRefs: ["recovery:evidence:p9"],
    auditRef: "audit:p9",
    integrityVerified: true,
    provenanceVerified: true,
    providerHealth: "available",
    canonicalAccountRefs: ["account:checking"],
    priorExecutionRefs: [],
    receiptRefs: [],
    restoreValidation: {
      knownGoodSnapshotRef: "snapshot:p9",
      backupHashVerified: true,
      currentAuthorizationRevalidated: true,
      currentRevocationsRevalidated: true,
      immutableHistoryPreserved: true,
      missingAccountRefs: []
    },
    ...overrides
  };
}

test("P9 current 199-phase authority is exactly P9.1-P9.9 after IF and C8, with detailed proof for every phase", () => {
  assert.equal(manifest.currentPhaseCount, 199);
  assert.deepEqual(manifest.categories.find((item) => item.id === "C9"), {
    id: "C9",
    count: 9,
    phaseSpec: { prefix: "P9.", start: 1, end: 9 },
    dependsOn: ["C1", "C2", "C3", "C5", "C6", "C7", "IF", "C8"]
  });
  assert.equal(manifest.pif.executionOrder.length, 10);
  for (let phase = 1; phase <= 9; phase += 1) assert.match(phaseProofSource, new RegExp(`P9\\.${phase}(?:\\D|$)`));
  for (const moduleName of ["providers", "accounts", "transaction-normalization", "net-worth", "recurring", "credit", "decision-support", "actions", "isolation", "recovery"]) {
    assert.match(financeIndexSource, new RegExp(`export \\* from "\\./${moduleName}\\.js";`));
  }
});

test("P9.1-P9.2 preserve canonical account identity across relink and distinguish verified zero from unavailable balance truth", () => {
  const registry = new FinancialAccountRegistry();
  registry.register({
    id: "account:p9",
    ownerId: OWNER,
    providerKey: "finance-provider:old-bank",
    externalAccountId: "old-account",
    displayName: "Checking",
    type: "checking",
    balance: { state: "known", cents: 0, currency: "USD" },
    balanceAsOf: "2026-10-31T11:00:00Z",
    liability: false,
    sourceRef: "provider:old-balance",
    version: 1
  });
  const provider = {
    key: "finance-provider:new-bank",
    version: 1,
    enabled: true,
    connectionState: "connected",
    consentState: "granted",
    capabilities: ["accounts.read"],
    dataScopes: ["finance:accounts"],
    freshnessSeconds: 300,
    health: "available"
  };
  const receipt = registry.rebindProvider({
    operationId: "rebind:p9",
    accountId: "account:p9",
    ownerId: OWNER,
    expectedVersion: 1,
    provider,
    externalAccountId: "new-account",
    requiredReadScope: "finance:accounts",
    consentRef: "consent:p9",
    sourceRef: "reconnect:p9"
  });
  assert.equal(registry.get("account:p9").id, "account:p9");
  assert.deepEqual(registry.providerLineage("account:p9").map((item) => item.providerKey), ["finance-provider:old-bank", "finance-provider:new-bank"]);
  assert.equal(receipt.protectedActionAuthorized, false);

  const snapshot = calculatePositionNetWorth(OWNER, [
    position("verified-zero", { state: "verified", cents: 0, currency: "USD" }),
    position("unavailable", { state: "unavailable", reason: "provider_unavailable" }, "liability")
  ], "USD", NOW);
  assert.deepEqual(snapshot.verifiedZeroAccountIds, ["account:verified-zero"]);
  assert.deepEqual(snapshot.unavailableAccountIds, ["account:unavailable"]);
  assert.equal(snapshot.complete, false);
});

test("P9.3-P9.4 keep transfer lineage out of external cashflow and recurrence detection separate from confirmed obligation", () => {
  const outgoing = transaction({
    id: "transaction:transfer-out",
    canonicalTransactionRef: "transaction:transfer-out",
    externalTransactionId: "transfer-out",
    accountId: "account:checking",
    amountCents: -5000,
    transferGroupId: "transfer:p9",
    category: "Transfer",
    rawSourceRefs: ["raw:transfer-out"]
  });
  const incoming = transaction({
    id: "transaction:transfer-in",
    canonicalTransactionRef: "transaction:transfer-in",
    externalTransactionId: "transfer-in",
    accountId: "account:savings",
    amountCents: 5000,
    transferGroupId: "transfer:p9",
    category: "Transfer",
    rawSourceRefs: ["raw:transfer-in"]
  });
  const expense = transaction({ id: "transaction:expense", canonicalTransactionRef: "transaction:expense", externalTransactionId: "expense", amountCents: -2500, rawSourceRefs: ["raw:expense"] });
  const totals = summarizeNormalizedCashflow([outgoing, incoming, expense], OWNER);
  assert.equal(totals.excludedInternalTransferCount, 2);
  assert.equal(totals.postedExternalOutflowCents, 2500);

  const candidate = createRecurringObligation({
    id: "obligation:p9",
    ownerId: OWNER,
    kind: "subscription",
    counterparty: "Example Service",
    currency: "USD",
    expectedAmountCents: 1299,
    expectedNextAt: "2026-11-01T12:00:00Z",
    cadenceRef: "monthly",
    confidence: 0.8,
    detectionEvidenceRefs: ["transaction:a", "transaction:b"],
    contractEvidenceRefs: [],
    status: "candidate",
    observedAt: NOW
  });
  assert.equal(candidate.truth, "detected_candidate");
  assert.throws(() => createRecurringObligation({ ...candidate, status: "active" }), /cannot become an active obligation/i);
});

test("P9.5-P9.6 keep credit provider/model/report-date truth explicit and separate verified scenario inputs from assumptions", () => {
  const score = createCanonicalCreditScoreFact({
    provider: "Experian",
    model: "VantageScore 3.0",
    reportDate: "2026-10-31",
    reportId: "report:p9",
    ownerId: OWNER,
    score: 712,
    observedAt: NOW,
    sourceRefs: ["credit-report:p9"],
    refreshState: "fresh"
  });
  assert.equal(score.provider, "Experian");
  assert.equal(score.model, "VantageScore 3.0");
  assert.equal(score.reportDate, "2026-10-31");
  assert.equal(score.protectedActionAuthorized, false);

  const scenario = evaluateFinancialDecisionScenario({
    id: "scenario:p9",
    ownerId: OWNER,
    name: "Debt payoff comparison",
    currency: "USD",
    goalRefs: ["goal:p9"],
    budgetRefs: ["budget:p9"],
    debtRefs: ["debt:p9"],
    cashflowRefs: ["cashflow:p9"],
    inputs: [
      { key: "verified_cash", cents: 100000, source: "verified_current", evidenceRefs: ["balance:p9"] },
      { key: "assumed_payment", cents: -25000, source: "owner_assumption", evidenceRefs: ["owner:assumption:p9"], sensitivity: { lowCents: -40000, highCents: -10000 } }
    ],
    observedAt: NOW
  });
  assert.deepEqual(scenario.verifiedInputKeys, ["verified_cash"]);
  assert.deepEqual(scenario.assumptionKeys, ["assumed_payment"]);
  assert.equal(scenario.scoreForecast, null);
  assert.equal(scenario.outcomePromise, false);
  assert.equal(scenario.protectedActionAuthorized, false);
});

test("P9.7 money movement requires exact fresh one-time owner authorization and automation cannot self-authorize", () => {
  const intent = {
    id: "intent:p9",
    ownerId: OWNER,
    kind: "payment",
    accountRefs: ["account:p9"],
    amountCents: 5000,
    exactOwnerAuthorizationRef: "auth:p9",
    providerHealthVerified: true,
    duplicateSideEffectChecked: true,
    providerKey: "finance-provider:test-bank",
    intentHash: "sha256:intent:p9",
    createdAt: "2026-10-31T11:55:00Z",
    source: "owner_request"
  };
  const grant = {
    authorizationRef: "auth:p9",
    ownerId: OWNER,
    actionKind: "payment",
    providerKey: "finance-provider:test-bank",
    accountRefs: ["account:p9"],
    amountCents: 5000,
    intentHash: "sha256:intent:p9",
    authorizedAt: "2026-10-31T11:56:00Z",
    expiresAt: "2026-10-31T12:05:00Z",
    assurance: "fresh_passkey_uv",
    oneTime: true,
    consumed: false,
    evidenceRefs: ["passkey:p9"]
  };
  const context = {
    now: NOW,
    providerHealth: "available",
    providerHealthObservedAt: "2026-10-31T11:59:00Z",
    maxProviderHealthAgeMs: 120000,
    duplicateSideEffectChecked: true,
    priorExecutionRefs: []
  };
  assert.equal(authorizeFinancialActionExecution(intent, grant, context).protectedActionAuthorized, true);
  assert.throws(() => authorizeFinancialActionExecution({ ...intent, source: "automation" }, grant, context), /cannot itself authorize money movement/i);
  assert.throws(() => authorizeFinancialActionExecution(intent, { ...grant, amountCents: 6000 }, context), /scope does not exactly match/i);
});

test("P9.8 finance context stays owner-scoped, minimized, secret-free, and isolated from unrelated domains", () => {
  const envelope = { ownerId: OWNER, subjectOwnerId: OWNER, assurance: "passkey_uv", scopes: ["finance:read"], contextDomain: "finance" };
  const decision = evaluateFinancialDataAccess(envelope, {
    requestedDataClasses: ["balances", "transactions"],
    allowedDataClasses: ["balances"],
    auditRef: "audit:p9",
    incidentState: "normal"
  });
  assert.deepEqual(decision.dataClasses, ["balances"]);
  assert.equal(decision.secretsExposed, false);
  assert.deepEqual(decision.credentialRefsExposed, []);
  assert.equal(decision.protectedActionAuthorized, false);
  assert.throws(() => evaluateFinancialDataAccess({ ...envelope, contextDomain: "projects" }, { requestedDataClasses: ["balances"], allowedDataClasses: ["balances"], auditRef: "audit:p9:cross", incidentState: "normal" }), /unrelated context/i);
});

test("P9.9 restore/relink recovery is evidence-gated, preserves canonical identity only when proven, and never replays uncertain actions", () => {
  const restored = assessFinancialRecovery(recovery());
  assert.equal(restored.disposition, "accept");
  assert.equal(restored.failClosed, true);
  assert.equal(restored.actionReplayAllowed, false);
  assert.equal(restored.rollbackAuthorized, false);
  assert.equal(restored.protectedActionAuthorized, false);

  const relinkConflict = assessFinancialRecovery(recovery({
    incidentKind: "account_relink",
    canonicalAccountRefs: ["account:p9"],
    relinkedAccountRefs: ["account:other"]
  }));
  assert.equal(relinkConflict.disposition, "manual_review");
  assert.equal(relinkConflict.canonicalIdentityPreserved, false);

  const uncertain = assessFinancialRecovery(recovery({ incidentKind: "protected_action_uncertain", priorExecutionRefs: ["execution:p9"], receiptRefs: ["receipt:p9"] }));
  assert.equal(uncertain.disposition, "manual_review");
  assert.equal(uncertain.actionReplayAllowed, false);
  assert.match(uncertain.reason, /receipt_reconciliation/);
});
