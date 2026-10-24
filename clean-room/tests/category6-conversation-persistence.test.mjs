import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { classifyConversationIntent } from "../dist/brain/conversation.js";

const migrationUrl = new URL("../../supabase/migrations/20261024144500_category6_conversation.sql", import.meta.url);

test("P6.7 persistent conversation stores intent/redaction evidence without canonical-write authority", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_conversations/);
  assert.match(sql, /command_center_brain_conversation_turns/);
  assert.match(sql, /canonical_writes_authorized boolean not null default false check \(canonical_writes_authorized=false\)/);
  assert.match(sql, /redaction_state in \('safe_text','redacted','reference_only'\)/);
  assert.match(sql, /protected_action_request/);
  assert.doesNotMatch(sql, /command_center_security_consume_authorization/);
});

test("P6.7 conversation recognizes protected intent without executing it", () => {
  assert.deepEqual(classifyConversationIntent("deploy this now"), { intent: "protected_action_request", protectedActionPossible: true });
  assert.deepEqual(classifyConversationIntent("research the alternatives"), { intent: "research", protectedActionPossible: false });
  assert.deepEqual(classifyConversationIntent("what changed?"), { intent: "question", protectedActionPossible: false });
  assert.deepEqual(classifyConversationIntent("this is my decision"), { intent: "owner_input", protectedActionPossible: false });
});
