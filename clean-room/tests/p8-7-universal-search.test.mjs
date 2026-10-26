import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { federatedSearch } from "../dist/personal/index.js";

const NOW = "2026-10-26T14:00:00Z";
const base = { id: "doc-1", ownerId: "owner-1", domain: "command-center", projectId: "command-center", title: "Canonical decision", text: "verified routing decision", sensitivityRank: 1, provenanceRefs: ["evd:decision"], permissionRefs: ["decision.read"], updatedAt: "2026-10-26T13:00:00Z", staleAfter: "2026-10-27T13:00:00Z", sourceVersion: 3 };

test("P8.7 query-time permissions, project/domain scope, provenance, and freshness all gate results", () => {
  const documents = [
    base,
    { ...base, id: "doc-other-owner", ownerId: "owner-2" },
    { ...base, id: "doc-other-project", projectId: "other" },
    { ...base, id: "doc-stale", staleAfter: "2026-10-26T13:30:00Z" },
    { ...base, id: "doc-no-provenance", provenanceRefs: [] },
    { ...base, id: "doc-secret", sensitivityRank: 4 }
  ];
  const denied = federatedSearch({ ownerId: "owner-1", query: "verified decision", maxSensitivityRank: 1, allowedDomains: ["command-center"], allowedProjectIds: ["command-center"], authorizedPermissionRefs: [], now: NOW }, documents);
  assert.equal(denied.length, 0);
  const allowed = federatedSearch({ ownerId: "owner-1", query: "verified decision", maxSensitivityRank: 1, allowedDomains: ["command-center"], allowedProjectIds: ["command-center"], authorizedPermissionRefs: ["decision.read"], now: NOW }, documents);
  assert.deepEqual(allowed.map((hit) => hit.id), ["doc-1"]);
  assert.equal(allowed[0].sourceVersion, 3);
  assert.deepEqual(allowed[0].provenanceRefs, ["evd:decision"]);
});

test("P8.7 deletion propagation removes a previously searchable projection immediately at query time", () => {
  const active = federatedSearch({ ownerId: "owner-1", query: "canonical decision", maxSensitivityRank: 1, allowedDomains: ["command-center"], allowedProjectIds: ["command-center"], authorizedPermissionRefs: ["decision.read"], now: NOW }, [base]);
  assert.equal(active.length, 1);
  const deleted = federatedSearch({ ownerId: "owner-1", query: "canonical decision", maxSensitivityRank: 1, allowedDomains: ["command-center"], allowedProjectIds: ["command-center"], authorizedPermissionRefs: ["decision.read"], now: NOW }, [{ ...base, deletedAt: "2026-10-26T13:59:59Z" }]);
  assert.equal(deleted.length, 0);
});

test("P8.7 legacy public projections remain searchable without a permission list", () => {
  const legacy = { id: "legacy", ownerId: "owner-1", domain: "command-center", projectId: "command-center", title: "Legacy canonical", text: "verification", sensitivityRank: 1, provenanceRefs: ["legacy-evidence"] };
  const hits = federatedSearch({ ownerId: "owner-1", query: "legacy verification", maxSensitivityRank: 1, allowedDomains: ["command-center"], allowedProjectIds: ["command-center"] }, [legacy]);
  assert.equal(hits.length, 1);
});

test("P8.7 durable schema stores only owner-scoped search projections with permissions, freshness, provenance, and tombstones", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026090000_p8_7_universal_search.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_search_projections/i);
  assert.match(sql, /permission_refs text\[\] not null/i);
  assert.match(sql, /provenance_refs text\[\] not null/i);
  assert.match(sql, /source_version bigint/i);
  assert.match(sql, /stale_after timestamptz/i);
  assert.match(sql, /deleted_at timestamptz/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.match(sql, /source_pointer text not null/i);
  assert.doesNotMatch(sql, /raw_secret|credential_value|access_token/i);
});
