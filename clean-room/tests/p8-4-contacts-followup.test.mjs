import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { recommendFollowUps } from "../dist/personal/index.js";

const NOW = "2026-10-26T13:00:00Z";

test("P8.4 contact/follow-up matching is owner scoped even when contact IDs collide", () => {
  const contacts = [
    { id: "contact-1", ownerId: "owner-1", displayName: "Owner One Contact", sensitivity: "sensitive", relationshipContextRefs: ["private:owner-1"] },
    { id: "contact-1", ownerId: "owner-2", displayName: "Owner Two Contact", sensitivity: "protected", relationshipContextRefs: ["private:owner-2"] }
  ];
  const followUps = [
    { id: "follow-1", ownerId: "owner-1", contactId: "contact-1", dueAt: NOW, reason: "Check in", state: "open", communicationBoundary: "draft_allowed", sourceRefs: ["owner"] },
    { id: "follow-orphan", ownerId: "owner-3", contactId: "contact-1", dueAt: NOW, reason: "Should not bind", state: "open", communicationBoundary: "recommend_only", sourceRefs: ["owner-3"] }
  ];
  const recs = recommendFollowUps(contacts, followUps, NOW);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].ownerId, "owner-1");
  assert.equal(recs[0].sensitivity, "sensitive");
});

test("P8.4 recommendations never copy sensitive relationship context or authorize sends", () => {
  const recs = recommendFollowUps(
    [{ id: "contact-1", ownerId: "owner-1", displayName: "Contact", sensitivity: "protected", relationshipContextRefs: ["relationship:protected-context"] }],
    [{ id: "follow-1", ownerId: "owner-1", contactId: "contact-1", dueAt: NOW, reason: "Follow up", state: "open", communicationBoundary: "send_requires_authorization", sourceRefs: ["owner"] }],
    NOW
  );
  assert.equal(recs[0].sendAuthorized, false);
  assert.equal("relationshipContextRefs" in recs[0], false);
  assert.equal(recs[0].communicationBoundary, "send_requires_authorization");
});

test("P8.4 durable schema keeps relationship context scoped and creates no send authority", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026083000_p8_4_contacts_followup.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_personal_contacts/i);
  assert.match(sql, /relationship_context_refs text\[\]/i);
  assert.match(sql, /command_center_personal_followups/i);
  assert.match(sql, /communication_boundary text not null check/i);
  assert.match(sql, /send_requires_authorization/i);
  assert.match(sql, /foreign key\(owner_id, contact_id\)/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.doesNotMatch(sql, /create table if not exists public\.[a-z0-9_]*(outbox|send_queue|messages_to_send)/i);
});
