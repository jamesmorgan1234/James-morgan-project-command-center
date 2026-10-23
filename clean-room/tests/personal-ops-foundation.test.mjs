import test from "node:test";
import assert from "node:assert/strict";
import {
  TaskLedger,
  assertCalendarEvent,
  assertCalendarChangeIntent,
  CalendarProviderRegistry,
  validatePersonalOperations,
  recommendFollowUps,
  NeedsMeQueue,
  validateOnboardingManifest,
  groupSetupByUnlockImpact,
  federatedSearch,
  routeNotifications,
  AutomationRegistry,
  evaluateWatch,
  dryRunPersonalRestore
} from "../dist/personal/index.js";

const T0 = "2026-10-23T18:00:00Z";

test("task recurrence completion is durable and duplicate-safe", () => {
  const ledger = new TaskLedger();
  ledger.register({ id: "task1", ownerId: "owner-1", title: "Daily check", priority: "normal", state: "open", recurrenceKey: "daily", sourceRefs: ["owner"], version: 1 });
  ledger.complete({ taskId: "task1", occurrenceKey: "2026-10-23", completedAt: T0, evidenceRefs: ["check"] });
  assert.equal(ledger.hasCompletedOccurrence("task1", "2026-10-23"), true);
  assert.throws(() => ledger.complete({ taskId: "task1", occurrenceKey: "2026-10-23", completedAt: T0, evidenceRefs: ["dup"] }));
});

test("calendar records require absolute timestamps/time zone and mutations require owner authorization", () => {
  assert.doesNotThrow(() => assertCalendarEvent({ id: "evt1", ownerId: "owner-1", providerKey: "calendar:g", externalId: "ext1", title: "Meeting", startsAt: "2026-11-01T09:00:00-05:00", endsAt: "2026-11-01T10:00:00-05:00", timeZone: "America/New_York", version: 1, sourceRef: "provider" }));
  assert.throws(() => assertCalendarEvent({ id: "evt2", ownerId: "owner-1", providerKey: "calendar:g", externalId: "ext2", title: "Bad", startsAt: "2026-11-01T09:00:00", endsAt: "2026-11-01T10:00:00", timeZone: "America/New_York", version: 1, sourceRef: "provider" }));
  assert.throws(() => assertCalendarChangeIntent({ eventId: "evt1", action: "update", ownerAuthorizationRef: "" }));
  const providers = new CalendarProviderRegistry();
  providers.register({ key: "calendar:test", version: 1, enabled: true, capabilities: ["read", "create"], health: "available" });
  assert.equal(providers.available("create").length, 1);
});

test("personal operations cannot duplicate specialist truth ownership", () => {
  assert.throws(() => validatePersonalOperations([
    { id: "a", ownerId: "o", kind: "shopping", title: "List", truthOwnerKey: "coupon-autopilot", canonicalRef: "shopping:week", specialistProjectId: "coupon", status: "open", sourceRefs: ["s"] },
    { id: "b", ownerId: "o", kind: "shopping", title: "List copy", truthOwnerKey: "personal-core", canonicalRef: "shopping:week", status: "open", sourceRefs: ["s"] }
  ]));
});

test("contact follow-up recommendations never authorize sends", () => {
  const recs = recommendFollowUps([{ id: "c1", ownerId: "o", displayName: "Contact", sensitivity: "sensitive", relationshipContextRefs: ["ctx"] }], [{ id: "f1", ownerId: "o", contactId: "c1", dueAt: "2026-10-23T17:00:00Z", reason: "Follow up", state: "open", communicationBoundary: "send_requires_authorization", sourceRefs: ["owner"] }], T0);
  assert.equal(recs[0].sendAuthorized, false);
});

test("Needs Me dedupes one owner action across linked work and ranks unlock impact", () => {
  const queue = new NeedsMeQueue();
  queue.upsert({ id: "need1", ownerId: "o", needKey: "provider-login:x", title: "Sign in", reason: "Two projects blocked", urgency: "normal", requiredEnvironment: "local_browser", ownerAction: "Authenticate provider", unlockRefs: ["work:a"], resumeRefs: ["run:a"], sourceRefs: ["a"], state: "open" });
  queue.upsert({ id: "need2", ownerId: "o", needKey: "provider-login:x", title: "Sign in", reason: "Same blocker", urgency: "high", requiredEnvironment: "local_browser", ownerAction: "Authenticate provider", unlockRefs: ["work:b"], resumeRefs: ["run:b"], sourceRefs: ["b"], state: "open" });
  assert.equal(queue.open().length, 1);
  assert.deepEqual(queue.open()[0].unlockRefs.sort(), ["work:a", "work:b"]);
  assert.equal(queue.open()[0].urgency, "high");
});

test("Foundry onboarding manifest exposes known setup dependencies and unlock groups", () => {
  const manifest = { projectId: "p", specVersion: 1, requirements: [
    { id: "account", kind: "account", title: "Create account", dependencyIds: [], unlockRefs: ["provider"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true },
    { id: "credential", kind: "credential", title: "Connect credential", dependencyIds: ["account"], unlockRefs: ["provider", "launch"], requiredEnvironment: "local_browser", ownerOnly: true, knownAtSpecTime: true }
  ] };
  assert.doesNotThrow(() => validateOnboardingManifest(manifest));
  assert.equal(groupSetupByUnlockImpact(manifest)[0].unlockRef, "provider");
});

test("universal search enforces owner/domain/project/sensitivity and provenance", () => {
  const docs = [
    { id: "allowed", ownerId: "o", domain: "projects", projectId: "cc", title: "Command Center", text: "Agency roadmap", sensitivityRank: 1, provenanceRefs: ["repo"] },
    { id: "secret", ownerId: "o", domain: "finance", title: "Private", text: "Agency money", sensitivityRank: 3, provenanceRefs: ["bank"] },
    { id: "other", ownerId: "other", domain: "projects", projectId: "cc", title: "Other", text: "Agency", sensitivityRank: 1, provenanceRefs: ["x"] }
  ];
  const hits = federatedSearch({ ownerId: "o", query: "agency", maxSensitivityRank: 1, allowedDomains: ["projects"], allowedProjectIds: ["cc"] }, docs);
  assert.deepEqual(hits.map((hit) => hit.id), ["allowed"]);
});

test("notification routing dedupes, honors quiet, and minimizes sensitive content", () => {
  const intents = [
    { id: "n1", ownerId: "o", dedupeKey: "need:x", severity: "critical", title: "Sensitive login", body: "Account details", sensitivityRank: 3, deepLink: "/needs-me/x", sourceRefs: ["need"] },
    { id: "n2", ownerId: "o", dedupeKey: "need:x", severity: "critical", title: "Sensitive login", body: "Duplicate", sensitivityRank: 3, sourceRefs: ["need"] },
    { id: "n3", ownerId: "o", dedupeKey: "low:y", severity: "low", title: "Low", body: "Later", sensitivityRank: 0, sourceRefs: ["task"] }
  ];
  const routed = routeNotifications(intents, { channel: "push", enabled: true, maxSensitivityRank: 1, quiet: true });
  assert.equal(routed.length, 1);
  assert.equal(routed[0].minimized, true);
  assert.deepEqual(routed[0].intentIds, ["n1", "n2"]);
});

test("scheduled automation execution is idempotent and evidence-backed", () => {
  const registry = new AutomationRegistry();
  registry.register({ id: "auto1", ownerId: "o", scheduleRef: "daily-8am", enabled: true, actionPolicy: "notification_only", providerHealth: "available", protectedActionsAuthorized: false });
  const key = registry.begin("auto1", "2026-10-24T12:00:00Z", T0);
  assert.throws(() => registry.begin("auto1", "2026-10-24T12:00:00Z", T0));
  assert.throws(() => registry.finish(key, "completed", []));
  registry.finish(key, "completed", ["result"]);
  assert.equal(registry.execution(key).state, "completed");
});

test("condition watch fires only on verified false-to-true transition and never authorizes protected action", () => {
  const watch = { id: "watch1", ownerId: "o", conditionKey: "reply-arrived", cadenceRef: "hourly", actionPolicy: "notification_only", protectedActionsAuthorized: false, priorVerifiedState: false };
  assert.deepEqual(evaluateWatch(watch, { watchId: "watch1", conditionMet: true, verified: true, sourceRefs: ["mail"] }), { fire: true, reason: "verified_condition_transition", protectedActionAuthorized: false });
  assert.equal(evaluateWatch({ ...watch, priorVerifiedState: true }, { watchId: "watch1", conditionMet: true, verified: true, sourceRefs: ["mail"] }).fire, false);
  assert.equal(evaluateWatch(watch, { watchId: "watch1", conditionMet: true, verified: false, sourceRefs: [] }).fire, false);
});

test("personal restore dry run cannot cross owner/domain/sensitivity boundaries", () => {
  const result = dryRunPersonalRestore({ id: "bundle", ownerId: "o", records: [
    { id: "ok", ownerId: "o", domain: "tasks", sensitivityRank: 1, contentHash: "h1", provenanceRefs: ["backup"] },
    { id: "secret", ownerId: "o", domain: "contacts", sensitivityRank: 3, contentHash: "h2", provenanceRefs: ["backup"] },
    { id: "wrong-domain", ownerId: "o", domain: "finance", sensitivityRank: 1, contentHash: "h3", provenanceRefs: ["backup"] }
  ] }, { ownerId: "o", allowedDomains: ["tasks", "contacts"], maxSensitivityRank: 2 });
  assert.deepEqual(result.acceptedIds, ["ok"]);
  assert.equal(result.rejected.length, 2);
});
