import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BrainMemoryLedger } from "../dist/brain/index.js";

const T0 = "2026-10-29T13:00:00Z";
const parityMigration = readFileSync(new URL("../../supabase/migrations/20261029130000_p15_1_brain_memory_secret_parity.sql", import.meta.url), "utf8");
const originalMemoryMigration = readFileSync(new URL("../../supabase/migrations/20261024142000_category6_brain_memory.sql", import.meta.url), "utf8");

const secretCorpus = [
  "sk-123456789012",
  "ghp_12345678901234567890",
  "AIza123456789012345678901234567890",
  "xoxb-123456789012",
  "Bearer 123456789012",
  "https://example.test/path?access_token=synthetic-value",
  "https://example.test/path?refresh_token=synthetic-value",
  "https://example.test/path?client_secret=synthetic-value",
  "https://user:synthetic-password@example.test/path",
  "-----BEGIN PRIVATE KEY-----"
];

function memory(id, value) {
  return {
    id,
    ownerId: "owner-1",
    projectId: "cc",
    kind: "fact",
    version: 1,
    state: "current",
    value,
    confidence: 1,
    sensitivity: "internal",
    sourceRefs: ["source-1"],
    recordedAt: T0
  };
}

test("P15.1 RG-022 runtime memory guard rejects the shared synthetic secret corpus", () => {
  for (const [index, secret] of secretCorpus.entries()) {
    const ledger = new BrainMemoryLedger();
    assert.throws(
      () => ledger.append(memory(`m${index}`, { note: secret })),
      /Secret-like material|Secret material field/
    );
    assert.equal(ledger.current("owner-1", "cc").length, 0);
  }

  const ledger = new BrainMemoryLedger();
  assert.doesNotThrow(() => ledger.append(memory("safe", {
    credentialRef: "sec_transactional_email",
    note: "reference-only metadata"
  })));
  assert.equal(ledger.current("owner-1", "cc").length, 1);
});

test("P15.1 RG-022 durable SQL guard applies parity patterns to both summary and content_ref", () => {
  assert.match(parityMigration, /foreach v_text in array array\[p_summary,p_content_ref\]/i);
  assert.match(parityMigration, /sk-\[A-Za-z0-9_-\]\{12,\}/);
  assert.match(parityMigration, /gh\[pousr\]_\[A-Za-z0-9\]\{20,\}/);
  assert.match(parityMigration, /AIza\[0-9A-Za-z_-\]\{30,\}/);
  assert.match(parityMigration, /xoxb-\[A-Za-z0-9-\]\{12,\}/);
  assert.match(parityMigration, /Bearer\[\[:space:\]\]\+/);
  assert.match(parityMigration, /access_token\|refresh_token\|token\|secret\|password\|api\[_-\]\?key\|client_secret/);
  assert.match(parityMigration, /https\?:\/\/\[\^:@\/\[\:space:\]\]\+:/);
  assert.match(parityMigration, /BEGIN \[A-Z \]\*PRIVATE KEY/);
  assert.match(parityMigration, /sb_secret_/);
  assert.match(parityMigration, /service\[_-\]\?role/);

  assert.match(
    originalMemoryMigration,
    /perform command_center_private\.c6_assert_safe_memory_summary\(p_summary,p_content_ref\);/i
  );
  assert.doesNotMatch(parityMigration, /credentialref/i);
});
