import test from "node:test";
import assert from "node:assert/strict";
import {
  promptVersion, classifyStatement, assertNoSilentArchitectureMutation,
  assertNoSilentOwnerDecision, classifyAmbiguity, rulesBeforeRecommendations, ownerOverride
} from "../dist/brain/governance.js";
import {
  voiceIndependence, listeningState, ambiguityConfirmation,
  voiceProvider, handsFreeSummary, voiceActionLog
} from "../dist/brain/voice-contracts.js";
import {
  taskTransition, heartbeat, wakeContract, resultContract,
  assertRealClaim, assertObjectiveLock, impactRadius
} from "../dist/agency/executor.js";

test("P1.x prompt and policy versioning", () => {
  assert.equal(promptVersion("v2.3"), "v2.3");
  assert.throws(() => promptVersion("latest"), /must be explicit/);
});

test("P1.x facts separated from ideas", () => {
  assert.equal(classifyStatement({ kind: "idea", text: "Maybe launch" }), "idea");
  assert.throws(() => classifyStatement({ kind: "fact", text: " " }), /requires text/);
});

test("P1.x Brain cannot silently mutate production architecture", () => {
  assert.doesNotThrow(() => assertNoSilentArchitectureMutation({ approved: true }));
  assert.throws(() => assertNoSilentArchitectureMutation({ approved: false }), /silently mutate/);
});

test("P1.x Brain cannot silently create canonical owner decisions", () => {
  assert.doesNotThrow(() => assertNoSilentOwnerDecision({ ownerApproved: true }));
  assert.throws(() => assertNoSilentOwnerDecision({ ownerApproved: false }), /silently create/);
});

test("P1.x ambiguous owner statements require classification", () => {
  assert.equal(classifyAmbiguity("Maybe next quarter?"), "ambiguous");
  assert.equal(classifyAmbiguity("Ship it"), "clear");
});

test("P1.x Brain rules evaluated before recommendations", () => {
  assert.deepEqual([...rulesBeforeRecommendations(["rules", "recommend"])], ["rules", "recommend"]);
  assert.throws(() => rulesBeforeRecommendations(["recommend", "rules"]), /before recommendations/);
});

test("P1.x owner override available", () => {
  assert.equal(ownerOverride({ owner: true }), "allowed");
  assert.equal(ownerOverride({ owner: false }), "refused");
});

test("P1.x voice independent from Brain logic", () => {
  assert.doesNotThrow(() => voiceIndependence({ brain: true, voice: true }));
  assert.throws(() => voiceIndependence({ brain: true, voice: false }), /independent/);
});

test("P1.x visible listening state", () => {
  assert.equal(listeningState("listening"), "listening");
  assert.throws(() => listeningState("hidden"), /visible/);
});

test("P1.x ambiguity confirmation", () => {
  assert.equal(ambiguityConfirmation(0.5), "confirm");
  assert.equal(ambiguityConfirmation(0.95), "proceed");
});

test("P1.x future multiple voice providers", () => {
  assert.equal(voiceProvider("provider-a", ["provider-a", "provider-b"]), "provider-a");
  assert.throws(() => voiceProvider("provider-c", ["provider-a"]), /Unsupported voice provider/);
});

test("P1.x future hands-free summaries", () => {
  assert.equal(handsFreeSummary("Three projects blocked", 30), "Three projects blocked");
  assert.throws(() => handsFreeSummary("Summary", 500), /bounded/);
});

test("P1.x voice actions logged as owner-originated voice input", () => {
  assert.equal(voiceActionLog("owner_voice"), "owner_voice");
  assert.throws(() => voiceActionLog("system"), /owner-originated/);
});

test("P1.x task state machine", () => {
  assert.equal(taskTransition("pending", "claim"), "claimed");
  assert.equal(taskTransition("working", "finish"), "done");
  assert.throws(() => taskTransition("done", "start"), /Invalid task transition/);
});

test("P1.x heartbeat contract", () => {
  assert.equal(heartbeat("2026-10-31T10:00:00.000Z", "2026-10-31T10:00:30.000Z", 60000), "alive");
  assert.equal(heartbeat("2026-10-31T10:00:00.000Z", "2026-10-31T10:05:00.000Z", 60000), "stale");
});

test("P1.x executor wake contract", () => {
  assert.equal(wakeContract("task_assigned"), "task_assigned");
  assert.throws(() => wakeContract(" "), /requires a reason/);
});

test("P1.x executor result contract", () => {
  assert.equal(resultContract({ taskId: "t1", outcome: "done" }), "t1:done");
  assert.throws(() => resultContract({ taskId: "", outcome: "done" }), /requires a task/);
});

test("P1.x working requires real executor claim", () => {
  assert.equal(assertRealClaim({ executorId: "exec-1" }), "exec-1");
  assert.throws(() => assertRealClaim(null), /real executor claim/);
});

test("P1.x objective hard lock", () => {
  assert.doesNotThrow(() => assertObjectiveLock({ objective: "ship" }, "ship"));
  assert.throws(() => assertObjectiveLock({ objective: "change" }, "ship"), /hard locked/);
});

test("P1.x impact-radius classification", () => {
  assert.equal(impactRadius("project"), "project");
  assert.throws(() => impactRadius("everything"), /must be classified/);
});
