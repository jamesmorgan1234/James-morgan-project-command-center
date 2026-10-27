import test from "node:test";
import assert from "node:assert/strict";
import {
  AutomationRegistry,
  CalendarRuntimeRegistry,
  FederatedSearchRuntime,
  NeedsMeQueue,
  NotificationRuntime,
  PersonalOperationCapabilityRegistry,
  TaskLedger,
  applyPersonalRecoveryTransaction,
  capturePersonalRecoverySnapshot,
  dispatchScheduledAutomationWindow,
  evaluateDurableWatch,
  generateOnboardingManifest,
  loadTaskLedger,
  onboardingNeeds,
  planCalendarReminder,
  prepareFollowUpSend,
  recommendScopedFollowUps,
  refreshSearchProvider,
  reserveTaskOccurrenceForAgency,
  resumeResolvedNeed,
  saveTaskLedger,
  transitionPersonalOperation
} from "../dist/personal/index.js";

const OWNER = "owner-1";
const PROJECT = "personal-core";

function task() {
  return { id: "task-1", ownerId: OWNER, projectId: PROJECT, title: "Daily check", priority: "high", state: "open", dueAt: "2026-10-27T12:00:00Z", recurrenceKey: "daily:08:00:America/New_York", sourceRefs: ["owner:task"], version: 1 };
}

function event(overrides = {}) {
  return { id: "evt-1", ownerId: OWNER, providerKey: "calendar:test", externalId: "ext-1", title: "Owner meeting", startsAt: "2026-10-27T15:00:00Z", endsAt: "2026-10-27T16:00:00Z", timeZone: "America/New_York", version: 1, sourceRef: "calendar:test:v1", ...overrides };
}

test("Category 8 runtime closes P8.1 durable task storage and deterministic Agency occurrence handoff", async () => {
  let envelope;
  let revision = 0;
  const store = {
    async load(ownerId) { assert.equal(ownerId, OWNER); return envelope; },
    async save(ownerId, expectedRevision, snapshot) {
      assert.equal(ownerId, OWNER);
      if (envelope && expectedRevision !== envelope.revision) throw new Error("revision conflict");
      if (!envelope && expectedRevision !== undefined) throw new Error("unexpected revision");
      revision += 1;
      envelope = { revision: `r${revision}`, snapshot };
      return envelope.revision;
    }
  };
  const initial = await loadTaskLedger(OWNER, store);
  initial.ledger.register(task());
  const r1 = await saveTaskLedger(OWNER, initial.ledger, store);
  assert.equal(r1, "r1");

  const loaded = await loadTaskLedger(OWNER, store);
  const agencyCalls = [];
  const occurrence = await reserveTaskOccurrenceForAgency(loaded.ledger, {
    taskId: "task-1", occurrenceKey: "2026-10-27T08:00:00-04:00", scheduledFor: "2026-10-27T12:00:00Z", evidenceRefs: ["scheduler:due"], pifTraceRef: "decision:reminder@1"
  }, {
    async reserve(input) {
      agencyCalls.push(input);
      return { agencyExecutionRef: "agent-step:task-1", evidenceRefs: ["agency:reserved"] };
    }
  });
  assert.match(occurrence.idempotencyKey, /^personal-task:/);
  assert.equal(occurrence.agencyExecutionRef, "agent-step:task-1");
  assert.equal(agencyCalls.length, 1);
  const r2 = await saveTaskLedger(OWNER, loaded.ledger, store, loaded.revision);
  assert.equal(r2, "r2");
  const restarted = (await loadTaskLedger(OWNER, store)).ledger;
  assert.equal(restarted.occurrences("task-1").length, 1);
  assert.throws(() => restarted.reserveOccurrence({ taskId: "task-1", occurrenceKey: "2026-10-27T08:00:00-04:00", scheduledFor: "2026-10-27T12:00:00Z", evidenceRefs: ["duplicate"] }), /Duplicate task occurrence/i);
  assert.deepEqual(restarted.search({ ownerId: OWNER, projectId: PROJECT, query: "daily" }).map((item) => item.id), ["task-1"]);
});

test("Category 8 runtime closes P8.2 availability, reminder planning and read-after-write calendar verification", async () => {
  const remote = new Map([["ext-1", event()]]);
  const runtime = new CalendarRuntimeRegistry();
  runtime.register({
    key: "calendar:test", version: 1, enabled: true, health: "available", capabilities: ["read", "create", "update", "delete", "availability"],
    async readEvent(ownerId, externalId) { const found = remote.get(externalId); return found?.ownerId === ownerId ? found : undefined; },
    async listAvailability(ownerId, startsAt, endsAt) { assert.equal(ownerId, OWNER); return [{ startsAt: "2026-10-27T13:00:00Z", endsAt: "2026-10-27T14:00:00Z", sourceRef: "calendar:test:busy" }]; },
    async applyChange(ownerId, intent, next) {
      assert.equal(ownerId, OWNER);
      assert.ok(intent.ownerAuthorizationRef);
      if (intent.action === "delete") remote.delete(next.externalId);
      else remote.set(next.externalId, next);
      return { sourceRef: "calendar:test:mutation", externalId: next.externalId, providerVersion: next.version };
    }
  });
  assert.equal((await runtime.availability("calendar:test", OWNER, "2026-10-27T12:00:00Z", "2026-10-27T17:00:00Z")).length, 1);
  const updated = event({ title: "Owner-edited meeting", version: 2, sourceRef: "owner:edit:v2" });
  const verification = await runtime.applyOwnerChange("calendar:test", OWNER, { eventId: "evt-1", action: "update", ownerAuthorizationRef: "auth:calendar", expectedVersion: 1 }, updated);
  assert.equal(verification.verified, true);
  assert.ok(["unchanged", "remote_applied"].includes(verification.status));
  const reminder = planCalendarReminder(updated, "2026-10-27T14:45:00Z");
  assert.equal(reminder.dedupeKey, "calendar-reminder:evt-1:2026-10-27T14:45:00Z");
  assert.throws(() => planCalendarReminder(updated, updated.startsAt), /before event start/i);
});

test("Category 8 runtime closes P8.3 specialist routing and personal-core workflow without duplicating specialist truth", () => {
  const registry = new PersonalOperationCapabilityRegistry();
  registry.register({ capabilityKey: "coupon:list-view", truthOwnerKey: "coupon-autopilot", specialistProjectId: "coupon-autopilot", kinds: ["shopping"], enabled: true, health: "available" });
  const specialist = { id: "shopping-1", ownerId: OWNER, kind: "shopping", title: "Weekly list", truthOwnerKey: "coupon-autopilot", canonicalRef: "coupon:list:weekly", specialistProjectId: "coupon-autopilot", status: "open", sourceRefs: ["coupon:canonical"], sensitivityRank: 1 };
  const route = registry.route(specialist);
  assert.equal(route.route, "specialist");
  assert.equal(route.readOnlyProjection, true);
  assert.throws(() => transitionPersonalOperation(specialist, "done", "owner:done"), /registered specialist capability/i);
  const personal = { id: "house-1", ownerId: OWNER, kind: "household", title: "Replace filter", truthOwnerKey: "personal-core", canonicalRef: "house:filter", status: "open", sourceRefs: ["owner"], sensitivityRank: 1 };
  assert.equal(transitionPersonalOperation(personal, "planned", "owner:planned").status, "planned");
});

test("Category 8 runtime closes P8.4 scoped follow-up privacy and keeps sends behind protected-action gate", () => {
  const contacts = [
    { id: "c1", ownerId: OWNER, displayName: "Allowed", sensitivity: "sensitive", relationshipContextRefs: ["private:relationship"] },
    { id: "c2", ownerId: OWNER, displayName: "Protected", sensitivity: "protected", relationshipContextRefs: ["private:protected"] },
    { id: "c1", ownerId: "owner-2", displayName: "Other", sensitivity: "internal", relationshipContextRefs: [] }
  ];
  const followUps = [
    { id: "f1", ownerId: OWNER, contactId: "c1", dueAt: "2026-10-27T12:00:00Z", reason: "Commitment follow-up", state: "open", communicationBoundary: "send_requires_authorization", sourceRefs: ["commitment:1"] },
    { id: "f2", ownerId: OWNER, contactId: "c2", dueAt: "2026-10-27T12:00:00Z", reason: "Private follow-up", state: "open", communicationBoundary: "recommend_only", sourceRefs: ["owner"] }
  ];
  const recommendations = recommendScopedFollowUps({ ownerId: OWNER, allowedSensitivities: ["internal", "sensitive"] }, contacts, followUps, "2026-10-27T13:00:00Z");
  assert.deepEqual(recommendations.map((item) => item.followUpId), ["f1"]);
  assert.equal("relationshipContextRefs" in recommendations[0], false);
  const send = prepareFollowUpSend(recommendations[0], "auth:send:f1");
  assert.equal(send.requiresProtectedActionGate, true);
  assert.equal(send.protectedActionAuthorized, false);
});

test("Category 8 runtime closes P8.5 grouped Needs Me resolution-to-resume bridge without authority expansion", async () => {
  const queue = new NeedsMeQueue();
  queue.upsert({ id: "need-1", ownerId: OWNER, needKey: "connect:calendar", title: "Connect calendar", reason: "Calendar blocked", urgency: "high", requiredEnvironment: "local_browser", ownerAction: "Connect calendar", unlockRefs: ["calendar:read", "calendar:write"], resumeRefs: ["run:sync", "run:create"], sourceRefs: ["calendar:block"], state: "open" });
  const resolution = queue.resolveByKey(OWNER, "connect:calendar", "2026-10-27T13:00:00Z", ["owner:connected"]);
  const calls = [];
  const batch = await resumeResolvedNeed(resolution, { async resume(resumeRef) { calls.push(resumeRef); return { resumeRef, evidenceRefs: [`resumed:${resumeRef}`], protectedActionAuthorized: false }; } });
  assert.deepEqual(calls, ["run:sync", "run:create"]);
  assert.deepEqual(batch.unlockRefs, ["calendar:read", "calendar:write"]);
  assert.ok(batch.resumed.every((receipt) => receipt.protectedActionAuthorized === false));
  assert.equal(queue.open().length, 0);
});

test("Category 8 runtime closes P8.6 Foundry spec-to-manifest generation and early Needs Me projection", () => {
  const account = { id: "account", kind: "account", title: "Create provider account", dependencyIds: [], unlockRefs: ["provider:connect"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true };
  const credential = { id: "credential", kind: "credential", title: "Authorize credential", dependencyIds: ["account"], unlockRefs: ["provider:read"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true };
  const manifest = generateOnboardingManifest({ projectId: "prj", specVersion: 7, capabilities: [
    { capabilityRef: "calendar", requirements: [account, credential] },
    { capabilityRef: "search", requirements: [{ ...account, unlockRefs: ["provider:connect", "search:index"] }] }
  ] });
  assert.deepEqual([...manifest.requirements.find((item) => item.id === "account").unlockRefs].sort(), ["provider:connect", "search:index"]);
  const needs = onboardingNeeds(OWNER, manifest, []);
  assert.deepEqual(needs.map((item) => item.needKey).sort(), ["onboarding:prj:7:account", "onboarding:prj:7:credential"]);
  assert.ok(needs.every((item) => item.sourceRefs[0] === "foundry-spec:prj@7"));
});

test("Category 8 runtime closes P8.7 provider federation, index refresh boundary, permission/provenance filtering and conflict detection", async () => {
  const provider = {
    key: "projects", domains: ["projects"], enabled: true, health: "available",
    async search() {
      return [
        { id: "p1", ownerId: OWNER, domain: "projects", projectId: "prj", title: "Verified project", text: "command center project", sensitivityRank: 1, provenanceRefs: ["project:1"], permissionRefs: ["project.read"], sourceVersion: 2 },
        { id: "foreign", ownerId: "owner-2", domain: "projects", projectId: "prj", title: "Foreign", text: "command center project", sensitivityRank: 0, provenanceRefs: ["foreign"], sourceVersion: 1 }
      ];
    }
  };
  const runtime = new FederatedSearchRuntime(); runtime.register(provider);
  const request = { ownerId: OWNER, query: "command center", maxSensitivityRank: 2, allowedDomains: ["projects"], allowedProjectIds: ["prj"], authorizedPermissionRefs: ["project.read"], now: "2026-10-27T13:00:00Z" };
  const hits = await runtime.search(request);
  assert.deepEqual(hits.map((hit) => hit.id), ["p1"]);
  const refreshed = [];
  await assert.rejects(refreshSearchProvider(provider, request, { async replaceProviderDocuments(key, documents) { refreshed.push([key, documents]); } }), /owner boundary/i);
  const safeProvider = { ...provider, async search() { return [(await provider.search())[0]]; } };
  assert.equal(await refreshSearchProvider(safeProvider, request, { async replaceProviderDocuments(key, documents) { refreshed.push([key, documents]); } }), 1);
  assert.equal(refreshed.at(-1)[0], "projects");
});

test("Category 8 runtime closes P8.8 shared preferences, cross-device acknowledgements and replaceable delivery", async () => {
  const acknowledgements = new Set(["already-acked"]);
  const saved = [];
  const runtime = new NotificationRuntime({
    async load(ownerId, channel) { assert.equal(ownerId, OWNER); return { channel, enabled: true, maxSensitivityRank: 1, quiet: false, maxBundles: 5 }; },
    async acknowledgedIntentIds(ownerId) { assert.equal(ownerId, OWNER); return [...acknowledgements]; },
    async saveAcknowledgement(ack) { acknowledgements.add(ack.intentId); saved.push(ack); }
  });
  const deliveries = [];
  runtime.register({ channel: "push", enabled: true, health: "available", async deliver(notification) { deliveries.push(notification); return { channel: "push", intentIds: notification.intentIds, evidenceRefs: ["push:receipt"] }; } });
  const receipts = await runtime.routeAndDeliver(OWNER, "push", [
    { id: "already-acked", ownerId: OWNER, dedupeKey: "old", severity: "normal", title: "Old", body: "Old", sensitivityRank: 0, sourceRefs: ["old"] },
    { id: "secret", ownerId: OWNER, dedupeKey: "secret", severity: "critical", title: "Private", body: "Private body", sensitivityRank: 4, deepLink: "/private?token=secret", sourceRefs: ["private"] }
  ]);
  assert.equal(receipts.length, 1);
  assert.equal(deliveries[0].minimized, true);
  assert.equal(deliveries[0].deepLink, undefined);
  await runtime.acknowledge(OWNER, "secret", "2026-10-27T13:30:00Z", ["owner:ack"]);
  assert.equal(saved.length, 1);
});

test("Category 8 runtime closes P8.9 cadence dispatch, Agency ownership, effect-time authority, restart and duplicate prevention", async () => {
  const automation = { id: "auto-1", ownerId: OWNER, projectId: PROJECT, scheduleRef: "schedule:daily-8", enabled: true, actionPolicy: "safe_action", providerHealth: "available", protectedActionsAuthorized: false };
  const registry = new AutomationRegistry(); registry.register(automation);
  let reserves = 0, executes = 0, authorityReads = 0;
  const resolver = { async due(ref, start, end) { assert.equal(ref, "schedule:daily-8"); return ["2026-10-27T12:00:00Z", "2026-10-27T12:00:00Z"]; } };
  const agency = {
    async reserve(input) { reserves += 1; assert.match(input.idempotencyKey, /^personal-automation:/); return { agencyExecutionRef: "agent-step:auto-1", evidenceRefs: ["agency:reserved"] }; },
    async execute() { executes += 1; return { state: "completed", evidenceRefs: ["agency:completed"] }; }
  };
  const authorityProvider = { async current() { authorityReads += 1; return { authorizationRef: "auth:auto", issuedAt: "2026-10-27T11:00:00Z", expiresAt: "2026-10-27T14:00:00Z", policyEpoch: 3, currentPolicyEpoch: 3, revocationEpoch: 2, currentRevocationEpoch: 2, revoked: false }; } };
  const results = await dispatchScheduledAutomationWindow({ registry, automation, resolver, agency, authorityProvider, windowStart: "2026-10-27T11:00:00Z", windowEnd: "2026-10-27T13:00:00Z", startedAt: "2026-10-27T13:00:00Z", maxCatchUp: 5 });
  assert.deepEqual(results.map((item) => item.state), ["completed"]);
  assert.equal(reserves, 1); assert.equal(executes, 1); assert.equal(authorityReads, 1);
  const restarted = AutomationRegistry.rehydrate(registry.exportSnapshot());
  const replay = await dispatchScheduledAutomationWindow({ registry: restarted, automation, resolver, agency, authorityProvider, windowStart: "2026-10-27T11:00:00Z", windowEnd: "2026-10-27T13:00:00Z", startedAt: "2026-10-27T13:05:00Z", maxCatchUp: 5 });
  assert.deepEqual(replay, []);
  assert.equal(reserves, 1); assert.equal(executes, 1);
});

test("Category 8 runtime closes P8.10 verified watch transition through durable CAS without protected-action authority", async () => {
  let revision = "r1";
  let current = { id: "watch-1", ownerId: OWNER, projectId: PROJECT, conditionKey: "reply", cadenceRef: "hourly", actionPolicy: "safe_action", protectedActionsAuthorized: false, priorVerifiedState: false, lastVerifiedObservedAt: "2026-10-27T12:00:00Z" };
  const store = {
    async load() { return { watch: current, revision }; },
    async compareAndSwap(ownerId, watchId, expected, next) { assert.equal(ownerId, OWNER); assert.equal(watchId, "watch-1"); if (expected !== revision) return undefined; current = next; revision = "r2"; return revision; }
  };
  const result = await evaluateDurableWatch(OWNER, "watch-1", store, { key: "mail", enabled: true, health: "available", async observe() { return { watchId: "watch-1", conditionMet: true, verified: true, sourceRefs: ["mail:message"], observationId: "obs-2", observedAt: "2026-10-27T13:00:00Z" }; } });
  assert.equal(result.decision.fire, true);
  assert.equal(result.decision.protectedActionAuthorized, false);
  assert.equal(result.watch.priorVerifiedState, true);
  assert.equal(result.revision, "r2");
});

test("Category 8 runtime closes P8.11 real capture integrity, current-authority acquisition, transactional restore and rollback", async () => {
  const source = {
    async capture(ownerId, projectId, domain) {
      return { ownerId, projectId, domain, sensitivityRank: 2, provenanceRefs: ["backup:source"], records: [
        { id: "task-1", ownerId, projectId, domain, sensitivityRank: 1, contentHash: "sha256:record", provenanceRefs: ["task:1"], kind: "data", authorityRef: "auth-current" }
      ], completedOccurrenceKeys: ["auto:occurrence"], executionRefs: ["agency:execution"], receiptRefs: ["agency:receipt"], completedEffectKeys: ["effect:done"] };
    }
  };
  const snapshot = await capturePersonalRecoverySnapshot({ snapshotId: "snap-1", createdAt: "2026-10-27T12:00:00Z", ownerId: OWNER, projectId: PROJECT, domain: "personal-ops" }, source);
  assert.match(snapshot.integrityHash, /^sha256:[0-9a-f]{64}$/);
  let committed = false, rolledBack = false; const restored = []; const applications = [];
  const contextProvider = { async current() { return { ownerId: OWNER, projectId: PROJECT, domain: "personal-ops", now: "2026-10-27T13:00:00Z", maxSensitivityRank: 2, providerHealth: "available", connectivity: "online", maxSnapshotAgeMs: 86400000, currentAuthorizationRefs: ["auth-current"], revokedAuthorizationRefs: [] }; } };
  const store = { async begin() { return { async restoreRecord(record) { restored.push(record.id); }, async recordApplication(application) { applications.push(application); }, async commit() { committed = true; }, async rollback() { rolledBack = true; } }; } };
  const application = await applyPersonalRecoveryTransaction(snapshot, contextProvider, store);
  assert.equal(application.protectedActionAuthorized, false);
  assert.deepEqual(restored, ["task-1"]);
  assert.equal(applications.length, 1); assert.equal(committed, true); assert.equal(rolledBack, false);

  const corrupted = { ...snapshot, records: [{ ...snapshot.records[0], contentHash: "tampered" }] };
  await assert.rejects(applyPersonalRecoveryTransaction(corrupted, contextProvider, store), /integrity verification failed/i);

  let rollbackObserved = false;
  const failingStore = { async begin() { return { async restoreRecord() { throw new Error("restore interrupted"); }, async recordApplication() {}, async commit() {}, async rollback() { rollbackObserved = true; } }; } };
  await assert.rejects(applyPersonalRecoveryTransaction(snapshot, contextProvider, failingStore), /restore interrupted/);
  assert.equal(rollbackObserved, true);
});
