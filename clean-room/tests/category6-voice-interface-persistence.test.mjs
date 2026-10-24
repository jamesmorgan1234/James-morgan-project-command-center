import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { voiceIntent } from "../dist/brain/voice.js";

const migrationUrl = new URL("../../supabase/migrations/20261024151000_category6_voice_interface.sql", import.meta.url);

test("P6.12 durable voice evidence cannot bypass shared intent/security gates", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_voice_adapters/);
  assert.match(sql, /command_center_brain_voice_sessions/);
  assert.match(sql, /command_center_brain_voice_transcripts/);
  assert.match(sql, /text_fallback_available boolean not null default true check \(text_fallback_available=true\)/);
  assert.match(sql, /canonical_writes_authorized boolean not null default false check \(canonical_writes_authorized=false\)/);
  assert.match(sql, /Only a final transcript may carry executable intent classification/);
  assert.match(sql, /Final transcript requires shared Brain intent classification/);
  assert.doesNotMatch(sql, /command_center_security_consume_authorization/);
});

test("P6.12 voice uses same intent engine and denied/partial input fails closed", () => {
  const adapter = { key: "speech:test", available: true, permission: "granted" };
  assert.equal(voiceIntent(adapter, { text: "deploy this", final: true, adapterKey: "speech:test" }).intent, "protected_action_request");
  assert.throws(() => voiceIntent({ ...adapter, permission: "denied" }, { text: "go ahead", final: true, adapterKey: "speech:test" }), /permission/);
  assert.throws(() => voiceIntent(adapter, { text: "go ahead", final: false, adapterKey: "speech:test" }), /partial transcript/);
  assert.throws(() => voiceIntent({ ...adapter, available: false }, { text: "hello", final: true, adapterKey: "speech:test" }), /use text interface/);
});
