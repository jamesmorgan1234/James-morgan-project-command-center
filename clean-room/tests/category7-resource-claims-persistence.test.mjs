import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ResourceClaimManager } from "../dist/agency/resources.js";

const migrationUrl = new URL("../../supabase/migrations/20261024155000_category7_resource_claims.sql", import.meta.url);

test("P7.5 durable resource claims use stable lock ordering and serialize conflicting mutations", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /order by btrim\(x->>'resourceKey'\)/);
  assert.match(sql, /Resource conflict:/);
  assert.match(sql, /mode in \('shared','exclusive'\)/);
  assert.match(sql, /released_at/);
  assert.match(sql, /serialized',true/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_resource_claims\s+to\s+authenticated/i);
});

test("P7.5 runtime resource manager allows disjoint/shared work and rejects conflicting exclusive work", () => {
  const manager = new ResourceClaimManager();
  manager.claim("run-a", [{ resourceKey: "file:a", mode: "shared" }, { resourceKey: "provider:x", mode: "exclusive" }]);
  assert.doesNotThrow(() => manager.claim("run-b", [{ resourceKey: "file:a", mode: "shared" }, { resourceKey: "file:b", mode: "exclusive" }]));
  assert.throws(() => manager.claim("run-c", [{ resourceKey: "provider:x", mode: "shared" }]), /Resource conflict/);
  manager.releaseOwner("run-a");
  assert.doesNotThrow(() => manager.claim("run-c", [{ resourceKey: "provider:x", mode: "exclusive" }]));
});
