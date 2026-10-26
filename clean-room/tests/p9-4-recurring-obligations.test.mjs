import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyRecurringObligationCorrection,
  buildRecurringObligationReminder,
  createRecurringObligation
} from "../dist/finance/index.js";

function obligation(overrides = {}) {
  return createRecurringObligation({
    id: "obligation-1",
    ownerId: "owner-1",
    kind: "subscription",
    counterparty: "Example Service",
    currency: "USD",
    expectedAmountCents: 1299,
    expectedNextAt: "2026-11-01T12:00:00Z",
    cadenceRef: "monthly",
    confidence: 0.82,
    detectionEvidenceRefs: ["txn:1", "txn:2", "txn:3"],
    contractEvidenceRefs: [],
    status: "candidate",
    observedAt: "2026-10-26T12:00:00Z",
    ...overrides
  });
}

test("P9.4 detected recurrence remains candidate truth without contract or owner confirmation", () => {
  const candidate = obligation();
  assert.equal(candidate.truth, "detected_candidate");
  assert.equal(candidate.status, "candidate");
  assert.equal(candidate.protectedActionAuthorized, false);
});

test("P9.4 active/overdue obligation cannot be inferred from recurrence detection alone", () => {
  assert.throws(() => obligation({ status: "active" }), /cannot become an active obligation/i);
  assert.throws(() => obligation({ status: "overdue" }), /cannot become an active obligation/i);
});

test("P9.4 contract evidence or owner confirmation can establish confirmed obligation truth", () => {
  const contracted = obligation({ status: "active", contractEvidenceRefs: ["contract:service-1"] });
  assert.equal(contracted.truth, "confirmed_obligation");
  const confirmed = obligation({ status: "active", ownerConfirmationRef: "owner:confirm:1" });
  assert.equal(confirmed.truth, "confirmed_obligation");
});

test("P9.4 ended and dismissed states remain explicit truth rather than active obligation", () => {
  assert.equal(obligation({ status: "ended" }).truth, "ended");
  assert.equal(obligation({ status: "dismissed" }).truth, "dismissed");
});

test("P9.4 owner correction changes expected truth with immutable lineage and owner evidence", () => {
  const current = obligation();
  const corrected = applyRecurringObligationCorrection(current, {
    id: "correction-1",
    ownerId: "owner-1",
    obligationId: "obligation-1",
    ownerDecisionRef: "owner:confirm:correction-1",
    observedAt: "2026-10-26T13:00:00Z",
    expectedAmountCents: 1499,
    expectedNextAt: "2026-11-03T12:00:00Z",
    status: "active",
    evidenceRefs: ["owner:statement:1"]
  });
  assert.equal(corrected.expectedAmountCents, 1499);
  assert.equal(corrected.expectedNextAt, "2026-11-03T12:00:00Z");
  assert.equal(corrected.status, "active");
  assert.equal(corrected.truth, "confirmed_obligation");
  assert.equal(corrected.ownerConfirmationRef, "owner:confirm:correction-1");
  assert.equal(corrected.correctionOf, "obligation-1");
  assert.deepEqual(corrected.detectionEvidenceRefs, ["txn:1", "txn:2", "txn:3", "owner:statement:1"]);
  assert.equal(current.truth, "detected_candidate");
});

test("P9.4 corrections fail closed across owner/obligation scope and against stale correction time", () => {
  const current = obligation();
  assert.throws(() => applyRecurringObligationCorrection(current, { id: "bad-owner", ownerId: "owner-2", obligationId: "obligation-1", ownerDecisionRef: "owner:2", observedAt: "2026-10-26T13:00:00Z", evidenceRefs: ["owner:2"] }), /scope mismatch/i);
  assert.throws(() => applyRecurringObligationCorrection(current, { id: "bad-id", ownerId: "owner-1", obligationId: "obligation-2", ownerDecisionRef: "owner:1", observedAt: "2026-10-26T13:00:00Z", evidenceRefs: ["owner:1"] }), /scope mismatch/i);
  assert.throws(() => applyRecurringObligationCorrection(current, { id: "stale", ownerId: "owner-1", obligationId: "obligation-1", ownerDecisionRef: "owner:1", observedAt: "2026-10-26T11:59:59Z", evidenceRefs: ["owner:1"] }), /cannot predate/i);
});

test("P9.4 reminder intent exists only for confirmed active/overdue obligation and never authorizes send", () => {
  assert.equal(buildRecurringObligationReminder(obligation(), "reminder-candidate"), undefined);
  const active = obligation({ status: "active", contractEvidenceRefs: ["contract:service-1"] });
  const reminder = buildRecurringObligationReminder(active, "reminder-1");
  assert.ok(reminder);
  assert.equal(reminder.reason, "upcoming_obligation");
  assert.equal(reminder.sendAuthorized, false);
  assert.equal(reminder.protectedActionAuthorized, false);
  assert.ok(reminder.evidenceRefs.includes("contract:service-1"));
  const overdue = obligation({ status: "overdue", ownerConfirmationRef: "owner:confirm:overdue" });
  assert.equal(buildRecurringObligationReminder(overdue, "reminder-2").reason, "overdue_obligation");
});

test("P9.4 durable recurring truth is append-only, owner-scoped, evidence-gated, correction-aware, and reminder-neutral", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026102000_p9_4_recurring_obligations.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_finance_recurring_obligation_history/i);
  assert.match(sql, /command_center_finance_recurring_obligation_correction_history/i);
  assert.match(sql, /command_center_finance_recurring_reminder_intent_history/i);
  assert.match(sql, /truth_state text not null check \(truth_state in \('detected_candidate','confirmed_obligation','ended','dismissed'\)\)/i);
  assert.match(sql, /detection_evidence_refs text\[\] not null check \(cardinality\(detection_evidence_refs\) > 0\)/i);
  assert.match(sql, /contract_evidence_refs text\[\] not null default '\{\}'::text\[\]/i);
  assert.match(sql, /owner_confirmation_ref text/i);
  assert.match(sql, /status in \('active','overdue'\).*truth_state='confirmed_obligation'/is);
  assert.match(sql, /send_authorized boolean not null default false check \(send_authorized = false\)/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
});
