import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TaskLedger, taskOccurrenceIdempotencyKey } from "../dist/personal/index.js";

const OWNER = "owner-1";
const PROJECT = "prj_command-center";
const TASK = "task_daily-check";
const OCCURRENCE = "2026-10-26T08:00:00-04:00";
const SCHEDULED = "2026-10-26T12:00:00Z";
const COMPLETED = "2026-10-26T12:05:00Z";

function createLedger() {
  const ledger = new TaskLedger();
  ledger.register({
    id: TASK,
    ownerId: OWNER,
    projectId: PROJECT,
    title: "Daily Command Center check",
    priority: "high",
    state: "open",
    dueAt: SCHEDULED,
    recurrenceKey: "daily:08:00:America/New_York",
    sourceRefs: ["owner:task"],
    version: 1
  });
  return ledger;
}

test("P8.1 reserves one canonical occurrence and restart cannot duplicate it", () => {
  const ledger = createLedger();
  const idempotencyKey = taskOccurrenceIdempotencyKey(OWNER, TASK, OCCURRENCE);
  const reserved = ledger.reserveOccurrence({
    taskId: TASK,
    occurrenceKey: OCCURRENCE,
    scheduledFor: SCHEDULED,
    idempotencyKey,
    agencyExecutionRef: "agent-step:reminder-1",
    pifTraceRef: "decision:task-reminder@1",
    evidenceRefs: ["evd_occurrence-reserved"]
  });
  assert.equal(reserved.idempotencyKey, idempotencyKey);
  assert.equal(reserved.state, "reserved");

  const restarted = TaskLedger.rehydrate(ledger.exportSnapshot());
  assert.equal(restarted.occurrences(TASK).length, 1);
  assert.throws(() => restarted.reserveOccurrence({
    taskId: TASK,
    occurrenceKey: OCCURRENCE,
    scheduledFor: SCHEDULED,
    idempotencyKey,
    agencyExecutionRef: "agent-step:reminder-1",
    pifTraceRef: "decision:task-reminder@1",
    evidenceRefs: ["evd_duplicate-attempt"]
  }), /Duplicate task occurrence/i);
});

test("P8.1 completion history survives restart and exact occurrence cannot complete twice", () => {
  const ledger = createLedger();
  const idempotencyKey = taskOccurrenceIdempotencyKey(OWNER, TASK, OCCURRENCE);
  ledger.reserveOccurrence({ taskId: TASK, occurrenceKey: OCCURRENCE, scheduledFor: SCHEDULED, idempotencyKey, agencyExecutionRef: "agent-step:reminder-1", pifTraceRef: "decision:task-reminder@1", evidenceRefs: ["evd_reserved"] });
  ledger.complete({ taskId: TASK, occurrenceKey: OCCURRENCE, completedAt: COMPLETED, idempotencyKey, agencyExecutionRef: "agent-step:reminder-1", pifTraceRef: "decision:task-reminder@1", evidenceRefs: ["evd_completed"] });

  const restarted = TaskLedger.rehydrate(ledger.exportSnapshot());
  assert.equal(restarted.hasCompletedOccurrence(TASK, OCCURRENCE), true);
  assert.equal(restarted.completionHistory(TASK)[0]?.evidenceRefs[0], "evd_completed");
  assert.equal(restarted.occurrences(TASK)[0]?.state, "completed");
  assert.throws(() => restarted.complete({ taskId: TASK, occurrenceKey: OCCURRENCE, completedAt: COMPLETED, idempotencyKey, evidenceRefs: ["evd_duplicate"] }), /Duplicate task occurrence completion/i);
});

test("P8.1 rejects noncanonical execution identity and cross-owner/project persisted rows", () => {
  const ledger = createLedger();
  assert.throws(() => ledger.reserveOccurrence({ taskId: TASK, occurrenceKey: OCCURRENCE, scheduledFor: SCHEDULED, idempotencyKey: "different-key", evidenceRefs: ["evd_bad"] }), /canonical Agency-compatible identity/i);

  const snapshot = ledger.exportSnapshot();
  assert.throws(() => TaskLedger.rehydrate({
    ...snapshot,
    occurrences: [{
      taskId: TASK,
      occurrenceKey: OCCURRENCE,
      scheduledFor: SCHEDULED,
      ownerId: "other-owner",
      projectId: PROJECT,
      idempotencyKey: taskOccurrenceIdempotencyKey(OWNER, TASK, OCCURRENCE),
      state: "reserved",
      evidenceRefs: ["evd_bad-owner"]
    }]
  }), /owner\/project boundary/i);
});

test("P8.1 task search stays owner/project scoped and preserves priority/due-date truth", () => {
  const ledger = createLedger();
  ledger.register({ id: "task_other-project", ownerId: OWNER, projectId: "prj_other", title: "Other project daily check", priority: "low", state: "open", dueAt: "2026-10-27T12:00:00Z", recurrenceKey: "daily", sourceRefs: ["owner"], version: 1 });
  ledger.register({ id: "task_other-owner", ownerId: "owner-2", projectId: PROJECT, title: "Other owner daily check", priority: "critical", state: "open", sourceRefs: ["owner-2"], version: 1 });

  const results = ledger.search({ ownerId: OWNER, projectId: PROJECT, priorities: ["high"], query: "daily" });
  assert.deepEqual(results.map((item) => item.id), [TASK]);
  assert.equal(results[0]?.dueAt, SCHEDULED);
});

test("P8.1 durable schema owns task truth while Agency keeps execution authority", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026080000_p8_1_personal_tasks.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_personal_tasks/i);
  assert.match(sql, /command_center_personal_task_occurrences/i);
  assert.match(sql, /command_center_personal_task_completions/i);
  assert.match(sql, /agency_step_id uuid references public\.agent_steps/i);
  assert.match(sql, /unique\(owner_id, idempotency_key\)/i);
  assert.match(sql, /pif_trace_ref/i);
  assert.match(sql, /evidence_refs text\[\] not null/i);
  assert.match(sql, /completion history is immutable/i);
  assert.match(sql, /command_center_complete_personal_task_occurrence/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.doesNotMatch(sql, /create table if not exists public\.[a-z0-9_]*personal[a-z0-9_]*scheduler/i);
});
