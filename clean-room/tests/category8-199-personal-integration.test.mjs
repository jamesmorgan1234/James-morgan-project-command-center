import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AutomationRegistry,
  PersonalOperationCapabilityRegistry,
  TaskLedger,
  dispatchScheduledAutomationWindow,
  evaluateWatch,
  planPersonalRecovery,
  reserveTaskOccurrenceForAgency
} from "../dist/personal/index.js";

const OWNER = "owner:p8";
const PROJECT = "personal:p8";
const NOW = "2026-10-31T07:30:00Z";
const manifest = JSON.parse(readFileSync(new URL("../../roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json", import.meta.url), "utf8"));
const runtimeProofSource = readFileSync(new URL("./category8-runtime-integration.test.mjs", import.meta.url), "utf8");
const personalIndexSource = readFileSync(new URL("../src/personal/index.ts", import.meta.url), "utf8");

function task() {
  return {
    id: "task:p8",
    ownerId: OWNER,
    projectId: PROJECT,
    title: "P8 proof task",
    priority: "high",
    state: "open",
    dueAt: "2026-10-31T08:00:00Z",
    recurrenceKey: "daily:04:00:America/New_York",
    sourceRefs: ["owner:p8-proof"],
    version: 1
  };
}

function recoverySnapshot() {
  return {
    schemaVersion: "cc-personal-recovery-v1",
    id: "snapshot:p8",
    ownerId: OWNER,
    projectId: PROJECT,
    domain: "personal-ops",
    createdAt: "2026-10-31T07:00:00Z",
    sensitivityRank: 2,
    integrityHash: "sha256:p8-proof",
    provenanceRefs: ["backup:p8"],
    records: [{
      id: "task:p8",
      ownerId: OWNER,
      projectId: PROJECT,
      domain: "personal-ops",
      sensitivityRank: 1,
      contentHash: "sha256:p8-record",
      provenanceRefs: ["task:p8"],
      kind: "data",
      authorityRef: "auth:p8-current"
    }],
    completedOccurrenceKeys: ["automation:p8:done"],
    executionRefs: ["agency:p8"],
    receiptRefs: ["receipt:p8"],
    completedEffectKeys: ["effect:p8:done"]
  };
}

function recoveryContext(overrides = {}) {
  return {
    ownerId: OWNER,
    projectId: PROJECT,
    domain: "personal-ops",
    now: NOW,
    maxSensitivityRank: 2,
    trustedIntegrityHash: "sha256:p8-proof",
    providerHealth: "available",
    connectivity: "online",
    maxSnapshotAgeMs: 24 * 60 * 60 * 1000,
    currentAuthorizationRefs: ["auth:p8-current"],
    revokedAuthorizationRefs: ["auth:p8-revoked"],
    ...overrides
  };
}

test("P8 current 199-phase authority is exactly P8.1-P8.11 after IF and the exported whole-category runtime proof covers every phase", () => {
  assert.equal(manifest.currentPhaseCount, 199);
  const category = manifest.categories.find((item) => item.id === "C8");
  assert.deepEqual(category, {
    id: "C8",
    count: 11,
    phaseSpec: { prefix: "P8.", start: 1, end: 11 },
    dependsOn: ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "IF"]
  });
  assert.equal(manifest.pif.executionOrder.length, 10);
  assert.ok(manifest.pif.executionOrder.every((phase) => phase.startsWith("PIF.")));
  for (let phase = 1; phase <= 11; phase += 1) assert.match(runtimeProofSource, new RegExp(`P8\\.${phase}(?:\\D|$)`));
  assert.match(personalIndexSource, /export \* from "\.\/runtime-integration\.js";/);
});

test("P8.1 consumes the pre-C8 intelligence trace while Agency remains the execution boundary", async () => {
  const ledger = new TaskLedger();
  ledger.register(task());
  const calls = [];
  const occurrence = await reserveTaskOccurrenceForAgency(ledger, {
    taskId: "task:p8",
    occurrenceKey: "2026-10-31T04:00:00-04:00",
    scheduledFor: "2026-10-31T08:00:00Z",
    evidenceRefs: ["scheduler:p8"],
    pifTraceRef: "pif-trace:p8@1"
  }, {
    async reserve(input) {
      calls.push(input);
      return { agencyExecutionRef: "agency-step:p8", evidenceRefs: ["agency:reserved:p8"] };
    }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].pifTraceRef, "pif-trace:p8@1");
  assert.match(calls[0].idempotencyKey, /^personal-task:/);
  assert.equal(occurrence.agencyExecutionRef, "agency-step:p8");
});

test("P8.3 specialist routing preserves one canonical truth owner and readonly projection", () => {
  const registry = new PersonalOperationCapabilityRegistry();
  registry.register({
    capabilityKey: "coupon:list-view",
    truthOwnerKey: "coupon-autopilot",
    specialistProjectId: "coupon-autopilot",
    kinds: ["shopping"],
    enabled: true,
    health: "available"
  });
  const route = registry.route({
    id: "shopping:p8",
    ownerId: OWNER,
    kind: "shopping",
    title: "P8 shopping projection",
    truthOwnerKey: "coupon-autopilot",
    canonicalRef: "coupon:list:p8",
    specialistProjectId: "coupon-autopilot",
    status: "open",
    sourceRefs: ["coupon:canonical:p8"],
    sensitivityRank: 1
  });
  assert.equal(route.route, "specialist");
  assert.equal(route.capabilityKey, "coupon:list-view");
  assert.equal(route.readOnlyProjection, true);
});

test("P8.9 scheduled automation remains Agency-owned, idempotent across restart, and effect-time authority stays current", async () => {
  const automation = {
    id: "automation:p8",
    ownerId: OWNER,
    projectId: PROJECT,
    scheduleRef: "schedule:p8",
    enabled: true,
    actionPolicy: "safe_action",
    providerHealth: "available",
    protectedActionsAuthorized: false
  };
  const registry = new AutomationRegistry();
  registry.register(automation);
  let reserves = 0;
  let executes = 0;
  let authorityReads = 0;
  const resolver = { async due() { return ["2026-10-31T07:15:00Z", "2026-10-31T07:15:00Z"]; } };
  const agency = {
    async reserve(input) {
      reserves += 1;
      assert.match(input.idempotencyKey, /^personal-automation:/);
      return { agencyExecutionRef: "agency-step:automation:p8", evidenceRefs: ["agency:reserved:p8"] };
    },
    async execute() {
      executes += 1;
      return { state: "completed", evidenceRefs: ["agency:completed:p8"] };
    }
  };
  const authorityProvider = {
    async current() {
      authorityReads += 1;
      return {
        authorizationRef: "auth:p8-current",
        issuedAt: "2026-10-31T07:00:00Z",
        expiresAt: "2026-10-31T08:00:00Z",
        policyEpoch: 4,
        currentPolicyEpoch: 4,
        revocationEpoch: 3,
        currentRevocationEpoch: 3,
        revoked: false
      };
    }
  };
  const input = {
    automation,
    resolver,
    agency,
    authorityProvider,
    windowStart: "2026-10-31T07:00:00Z",
    windowEnd: "2026-10-31T07:30:00Z",
    startedAt: NOW,
    maxCatchUp: 4
  };
  const completed = await dispatchScheduledAutomationWindow({ registry, ...input });
  assert.deepEqual(completed.map((item) => item.state), ["completed"]);
  const restarted = AutomationRegistry.rehydrate(registry.exportSnapshot());
  assert.deepEqual(await dispatchScheduledAutomationWindow({ registry: restarted, ...input, startedAt: "2026-10-31T07:35:00Z" }), []);
  assert.equal(reserves, 1);
  assert.equal(executes, 1);
  assert.equal(authorityReads, 1);
});

test("P8.10 proves condition, event, webhook, and project-state watches without granting protected-action authority", () => {
  for (const watchKind of ["condition", "event", "webhook", "project_state"]) {
    const decision = evaluateWatch({
      id: `watch:${watchKind}`,
      ownerId: OWNER,
      projectId: PROJECT,
      watchKind,
      conditionKey: `condition:${watchKind}`,
      cadenceRef: "hourly",
      actionPolicy: "safe_action",
      protectedActionsAuthorized: false,
      priorVerifiedState: false
    }, {
      watchId: `watch:${watchKind}`,
      watchKind,
      conditionMet: true,
      verified: true,
      observationId: `observation:${watchKind}`,
      observedAt: NOW,
      sourceRefs: [`verified:${watchKind}`]
    });
    assert.equal(decision.fire, true);
    assert.equal(decision.protectedActionAuthorized, false);
  }
  assert.throws(() => evaluateWatch({
    id: "watch:mismatch",
    ownerId: OWNER,
    watchKind: "webhook",
    conditionKey: "condition:mismatch",
    cadenceRef: "hourly",
    actionPolicy: "notification_only",
    protectedActionsAuthorized: false,
    priorVerifiedState: false
  }, {
    watchId: "watch:mismatch",
    watchKind: "project_state",
    conditionMet: true,
    verified: true,
    observationId: "observation:mismatch",
    observedAt: NOW,
    sourceRefs: ["verified:mismatch"]
  }), /kind mismatch/i);
});

test("P8.11 restore keeps privacy and current authority fail-closed and never recreates protected-action permission", () => {
  const snapshot = recoverySnapshot();
  const ready = planPersonalRecovery(snapshot, recoveryContext());
  assert.equal(ready.canApply, true);
  assert.equal(ready.protectedActionAuthorized, false);
  assert.equal(planPersonalRecovery(snapshot, recoveryContext({ ownerId: "owner:other" })).reason, "owner_boundary_mismatch");
  assert.equal(planPersonalRecovery(snapshot, recoveryContext({ domain: "finance" })).reason, "domain_boundary_mismatch");
  const revoked = { ...snapshot, records: [{ ...snapshot.records[0], authorityRef: "auth:p8-revoked" }] };
  assert.equal(planPersonalRecovery(revoked, recoveryContext()).rejectedRecords[0].reason, "authority_not_current");
});
