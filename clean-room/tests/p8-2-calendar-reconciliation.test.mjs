import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calendarLocalTimeCandidates, resolveCalendarLocalTime, reconcileCalendarEvent } from "../dist/personal/index.js";

function event(overrides = {}) {
  return {
    id: "evt_dst",
    ownerId: "owner-1",
    providerKey: "calendar:test",
    externalId: "external-1",
    title: "Meeting",
    startsAt: "2026-11-01T05:30:00Z",
    endsAt: "2026-11-01T06:30:00Z",
    timeZone: "America/New_York",
    version: 1,
    sourceRef: "provider:test:v1",
    ...overrides
  };
}

test("P8.2 rejects skipped DST wall time and exposes both repeated-time candidates", () => {
  assert.deepEqual(calendarLocalTimeCandidates("2026-03-08T02:30:00", "America/New_York"), []);
  assert.throws(() => resolveCalendarLocalTime({ localDateTime: "2026-03-08T02:30:00", timeZone: "America/New_York", disambiguation: "reject" }), /DST skipped time/i);

  const repeated = calendarLocalTimeCandidates("2026-11-01T01:30:00", "America/New_York");
  assert.equal(repeated.length, 2);
  assert.notEqual(repeated[0], repeated[1]);
  assert.throws(() => resolveCalendarLocalTime({ localDateTime: "2026-11-01T01:30:00", timeZone: "America/New_York", disambiguation: "reject" }), /DST repeated time/i);
  assert.equal(resolveCalendarLocalTime({ localDateTime: "2026-11-01T01:30:00", timeZone: "America/New_York", disambiguation: "earlier" }).instant, repeated[0]);
  assert.equal(resolveCalendarLocalTime({ localDateTime: "2026-11-01T01:30:00", timeZone: "America/New_York", disambiguation: "later" }).instant, repeated[1]);
});

test("P8.2 reconciles newer provider edits, ignores stale snapshots, and surfaces equal-version conflict", () => {
  const local = event();
  const newer = event({ title: "Provider-edited meeting", version: 2, sourceRef: "provider:test:v2" });
  const applied = reconcileCalendarEvent(local, newer);
  assert.equal(applied.status, "remote_applied");
  assert.equal(applied.selected?.title, "Provider-edited meeting");
  assert.deepEqual(applied.evidenceRefs, ["provider:test:v1", "provider:test:v2"]);

  const stale = reconcileCalendarEvent(newer, local);
  assert.equal(stale.status, "stale_remote_ignored");
  assert.equal(stale.selected?.version, 2);

  const conflict = reconcileCalendarEvent(local, event({ title: "Same-version divergent edit", sourceRef: "provider:other-observation" }));
  assert.equal(conflict.status, "conflict");
  assert.equal(conflict.selected, undefined);
});

test("P8.2 refuses reconciliation across owner/provider/external identity boundaries", () => {
  assert.throws(() => reconcileCalendarEvent(event(), event({ ownerId: "owner-2" })), /identity boundary mismatch/i);
  assert.throws(() => reconcileCalendarEvent(event(), event({ externalId: "other-external" })), /identity boundary mismatch/i);
});

test("P8.2 durable schema preserves provider identity, reconciliation evidence, and owner isolation", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026081000_p8_2_calendar_reconciliation.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_calendar_events/i);
  assert.match(sql, /unique\(owner_id, provider_key, external_id\)/i);
  assert.match(sql, /time_zone text not null/i);
  assert.match(sql, /provider_version bigint not null/i);
  assert.match(sql, /command_center_calendar_reconciliations/i);
  assert.match(sql, /status text not null check \(status in \('unchanged','remote_applied','stale_remote_ignored','conflict'\)\)/i);
  assert.match(sql, /evidence_refs text\[\] not null/i);
  assert.match(sql, /reconciliation history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
});
