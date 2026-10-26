import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql=readFileSync(new URL("../../supabase/migrations/20261026144000_p14_recovery_migration_scale_lifecycle.sql",import.meta.url),"utf8");
const recoveryIndex=readFileSync(new URL("../src/recovery/index.ts",import.meta.url),"utf8");

test("P14.1-P14.5 recovery migration replacement and historical evidence are durable",()=>{
  for(const token of ["command_center_recovery_artifacts","intelligence_state","known_good","command_center_recovery_exercises","restore","migration","rollback","command_center_dependency_replacements","provider","model","method","specialist","evaluator","ontology","historical_recovery"])
    assert.match(sql,new RegExp(token,"i"));
  assert.match(sql,/policy_snapshot_ref text not null/i); assert.match(sql,/revocation_snapshot_ref text not null/i);
});

test("P14.6 scale evidence includes 10x and 100x exercises",()=>{ assert.match(sql,/scale_10x/); assert.match(sql,/scale_100x/); });

test("P14.7 dormant state requires current-policy and revocation revalidation",()=>{
  for(const token of ["command_center_dormant_reactivations","capability","specialist","procedure","promotion","current_policy_ref","current_revocation_ref","revalidation_state"])
    assert.match(sql,new RegExp(token,"i"));
});

test("P14.8-P14.10 future boundaries cannot inherit private state",()=>{
  for(const token of ["multi_user","commercial_public_fork","device","interface","may_inherit_private_state boolean not null default false"])
    assert.match(sql,new RegExp(token,"i"));
});

test("P14.11 simulation chaos shadow and failover prohibit production side effects",()=>{
  for(const token of ["chaos","shadow","control_plane_failover","deterministic_replay_ref"])
    assert.match(sql,new RegExp(token,"i"));
  assert.match(sql,/production_side_effects boolean not null default false check \(production_side_effects=false\)/i);
});

test("P14.12 long-horizon drift external reality causal and replacement audits are explicit",()=>{
  for(const token of ["architecture_drift","config_drift","external_reality","memory_age","dependency_age","replacement_audit","causal_validation","counterfactual"])
    assert.match(sql,new RegExp(token,"i"));
});

test("recovery public surface retains the C14 implementation modules",()=>{
  for(const moduleName of ["backup","chaos","dormant","historical-report","lifecycle","migrations","multi-user","public-fork","replacement"])
    assert.match(recoveryIndex,new RegExp(`\\./${moduleName}\\.js`));
});

test("C14 durable evidence is immutable and Command Center authorized",()=>{
  assert.match(sql,/Recovery and lifecycle evidence is immutable/i); assert.match(sql,/is_command_center_authorized/i);
});
