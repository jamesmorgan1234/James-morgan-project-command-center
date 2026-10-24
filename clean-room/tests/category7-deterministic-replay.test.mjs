import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateReplayLog, replayChoices } from "../dist/agency/replay.js";

const migrationUrl = new URL("../../supabase/migrations/20261024170500_category7_deterministic_replay.sql", import.meta.url);

test("P7.21 durable replay records all nondeterministic choice classes and never executes protected side effects", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const kind of ["scheduler","policy","model","provider","time","random","retry","conflict","barrier","recovery"]) assert.match(sql, new RegExp(`'${kind}'`));
  assert.match(sql, /Replay sequence gap/);
  assert.match(sql, /protected_side_effects_executed boolean not null default false check \(protected_side_effects_executed=false\)/);
  assert.match(sql, /protected_side_effects_executed',false/);
  assert.doesNotMatch(sql, /command_center_security_consume_action_authorization/);
});

test("P7.21 runtime replay rejects gaps and reproduces chosen values deterministically", () => {
  const choices = [
    { sequence: 1, kind: "scheduler", inputHash: "a".repeat(64), outputHash: "b".repeat(64), chosenValue: "task:t1" },
    { sequence: 2, kind: "retry", inputHash: "c".repeat(64), outputHash: "d".repeat(64), chosenValue: "retry:0" },
    { sequence: 3, kind: "barrier", inputHash: "e".repeat(64), outputHash: "f".repeat(64), chosenValue: "boundary:none" }
  ];
  assert.doesNotThrow(() => validateReplayLog(choices));
  assert.deepEqual(replayChoices(choices), ["task:t1","retry:0","boundary:none"]);
  assert.throws(() => validateReplayLog([choices[0], { ...choices[2], sequence: 3 }]), /Replay sequence gap at 2/);
});
