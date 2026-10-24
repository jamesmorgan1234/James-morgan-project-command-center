import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SpecialistBrainRegistry } from "../dist/brain/specialists.js";

const migrationUrl = new URL("../../supabase/migrations/20261024144000_category6_specialist_brains.sql", import.meta.url);

test("P6.6 durable specialist registry keeps scope, provenance, versions and deprecation explicit", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_specialist_brains/);
  assert.match(sql, /command_center_brain_shared_patterns/);
  assert.match(sql, /command_center_brain_shared_pattern_versions/);
  assert.match(sql, /scope in \('meta','project','business','books','finance','personal','custom'\)/);
  assert.match(sql, /Project Brain requires valid owner project/);
  assert.match(sql, /Replacement pattern must be active and owner-scoped/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_specialist_brains\s+to\s+authenticated/i);
});

test("P6.6 in-memory specialist pattern reuse remains applicability-scoped", () => {
  const registry = new SpecialistBrainRegistry();
  registry.registerBrain({ key: "brain:books", version: 1, scope: "books", capabilities: ["book-context"], allowedMemoryKinds: ["decision"] });
  registry.registerPattern({ id: "pattern:books-qa", version: 1, provenanceRefs: ["evidence:verified"], applicableScopes: ["books"], deprecated: false });
  assert.equal(registry.usablePatterns("books").length, 1);
  assert.equal(registry.usablePatterns("finance").length, 0);
  registry.removeBrain("brain:books");
});
