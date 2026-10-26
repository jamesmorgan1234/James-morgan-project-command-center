import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { acknowledgeNotification, routeNotifications } from "../dist/personal/index.js";

function intent(id, overrides = {}) {
  return { id, ownerId: "owner-1", dedupeKey: `key:${id}`, severity: "normal", title: `Title ${id}`, body: `Body ${id}`, sensitivityRank: 1, deepLink: `/needs/${id}`, sourceRefs: [`evd:${id}`], ...overrides };
}

test("P8.8 flood routing preserves critical signal and bundles/dedupes within owner scope", () => {
  const intents = [
    ...Array.from({ length: 20 }, (_, index) => intent(`normal-${index}`)),
    intent("critical-a", { severity: "critical", dedupeKey: "critical-group" }),
    intent("critical-b", { severity: "critical", dedupeKey: "critical-group" }),
    intent("critical-other-owner", { ownerId: "owner-2", severity: "critical", dedupeKey: "critical-group" })
  ];
  const routed = routeNotifications(intents, { channel: "push", enabled: true, maxSensitivityRank: 2, quiet: false, maxBundles: 2 });
  assert.equal(routed.length, 2);
  assert.ok(routed.every((item) => item.severity === "critical"));
  assert.deepEqual(routed.find((item) => item.ownerId === "owner-1")?.intentIds, ["critical-a", "critical-b"]);
  assert.deepEqual(routed.find((item) => item.ownerId === "owner-2")?.intentIds, ["critical-other-owner"]);
});

test("P8.8 quiet mode keeps only critical signal and protected content is minimized without deep-link leakage", () => {
  const routed = routeNotifications([
    intent("normal"),
    intent("secret-critical", { severity: "critical", sensitivityRank: 4, title: "Secret title", body: "Secret details", deepLink: "/open?token=abc123" })
  ], { channel: "push", enabled: true, maxSensitivityRank: 1, quiet: true });
  assert.equal(routed.length, 1);
  assert.equal(routed[0].title, "Command Center needs your attention");
  assert.equal(routed[0].body, "Open Command Center to view the protected details.");
  assert.equal(routed[0].deepLink, undefined);
  assert.equal(routed[0].minimized, true);
});

test("P8.8 acknowledged intents do not re-notify and acknowledgements require evidence", () => {
  const acknowledgement = acknowledgeNotification("owner-1", "normal", "2026-10-26T14:30:00Z", ["evd:owner-ack"]);
  assert.equal(acknowledgement.intentId, "normal");
  const routed = routeNotifications([intent("normal"), intent("other")], { channel: "push", enabled: true, maxSensitivityRank: 2, quiet: false, acknowledgedIntentIds: ["normal"] });
  assert.deepEqual(routed.flatMap((item) => item.intentIds), ["other"]);
  assert.throws(() => acknowledgeNotification("owner-1", "normal", "2026-10-26T14:30:00Z", []), /evidence/i);
});

test("P8.8 durable schema records intents, routing receipts, and immutable acknowledgements without sensitive payload duplication", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026091000_p8_8_notifications.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_notification_intents/i);
  assert.match(sql, /dedupe_key/i);
  assert.match(sql, /sensitivity_rank/i);
  assert.match(sql, /command_center_notification_deliveries/i);
  assert.match(sql, /minimized boolean not null/i);
  assert.match(sql, /command_center_notification_acknowledgements/i);
  assert.match(sql, /acknowledgement history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.doesNotMatch(sql, /secret_payload|access_token|credential_value/i);
});
