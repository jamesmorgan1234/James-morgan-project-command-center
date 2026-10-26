import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPersonalOperations, validatePersonalOperations } from "../dist/personal/index.js";

const specialistShopping = {
  id: "op-shopping",
  ownerId: "owner-1",
  kind: "shopping",
  title: "Weekly shopping list",
  truthOwnerKey: "coupon-autopilot",
  canonicalRef: "shopping:list:weekly",
  specialistProjectId: "coupon-autopilot",
  status: "open",
  sourceRefs: ["specialist:coupon-autopilot"],
  sensitivityRank: 1
};

test("P8.3 keeps specialist-owned shopping as a read-only projection", () => {
  const view = projectPersonalOperations({ ownerId: "owner-1", allowedKinds: ["shopping"], maxSensitivityRank: 1, allowedSpecialistProjectIds: ["coupon-autopilot"] }, [specialistShopping]);
  assert.equal(view.length, 1);
  assert.equal(view[0].truthOwnerKey, "coupon-autopilot");
  assert.equal(view[0].readOnlyProjection, true);
});

test("P8.3 privacy and specialist boundaries survive cross-domain views", () => {
  const records = [
    specialistShopping,
    { id: "op-household", ownerId: "owner-1", kind: "household", title: "Replace filter", truthOwnerKey: "personal-core", canonicalRef: "household:filter", status: "planned", sourceRefs: ["owner"], sensitivityRank: 1 },
    { id: "op-private-travel", ownerId: "owner-1", kind: "travel", title: "Private trip", truthOwnerKey: "personal-core", canonicalRef: "travel:private", status: "planned", sourceRefs: ["owner"], sensitivityRank: 4 },
    { id: "op-other-owner", ownerId: "owner-2", kind: "household", title: "Other owner", truthOwnerKey: "personal-core", canonicalRef: "household:filter", status: "open", sourceRefs: ["other"], sensitivityRank: 1 }
  ];
  assert.doesNotThrow(() => validatePersonalOperations(records));
  const view = projectPersonalOperations({ ownerId: "owner-1", allowedKinds: ["shopping", "household", "travel"], maxSensitivityRank: 1, allowedSpecialistProjectIds: ["coupon-autopilot"] }, records);
  assert.deepEqual(view.map((item) => item.id).sort(), ["op-household", "op-shopping"]);
});

test("P8.3 refuses duplicate truth ownership inside one owner scope", () => {
  assert.throws(() => validatePersonalOperations([
    specialistShopping,
    { ...specialistShopping, id: "op-shadow-copy", truthOwnerKey: "personal-core", specialistProjectId: undefined, sourceRefs: ["personal-copy"] }
  ]), /Duplicate specialist truth ownership/i);
  assert.throws(() => validatePersonalOperations([{ ...specialistShopping, specialistProjectId: undefined }]), /identify its specialist project/i);
});

test("P8.3 durable schema stores scoped projections without creating another specialist truth store", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026082000_p8_3_personal_operations.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_personal_operations/i);
  assert.match(sql, /truth_owner_key/i);
  assert.match(sql, /canonical_ref/i);
  assert.match(sql, /specialist_project_id/i);
  assert.match(sql, /projection_only boolean generated always as \(truth_owner_key <> 'personal-core'\) stored/i);
  assert.match(sql, /unique\(owner_id, canonical_ref\)/i);
  assert.match(sql, /sensitivity_rank integer not null/i);
  assert.match(sql, /is_command_center_authorized/i);
  assert.doesNotMatch(sql, /create table if not exists public\.coupon/i);
});
