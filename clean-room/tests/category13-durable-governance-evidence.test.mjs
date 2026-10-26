import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql=readFileSync(new URL("../../supabase/migrations/20261026143000_p13_analytics_observability_governance.sql",import.meta.url),"utf8");
const index=readFileSync(new URL("../src/analytics/index.ts",import.meta.url),"utf8");

const tables=[
  "command_center_metric_registry",
  "command_center_observability_events",
  "command_center_health_snapshots",
  "command_center_decision_outcomes",
  "command_center_learning_lessons",
  "command_center_security_analytics",
  "command_center_governance_findings",
  "command_center_evaluator_results"
];

test("C13 durable evidence covers metrics traces health outcomes learning security governance and evaluators",()=>{
  for(const table of tables) assert.match(sql,new RegExp(table,"i"));
  assert.match(sql,/Analytics and governance evidence is immutable/i);
  assert.match(sql,/is_command_center_authorized/i);
  assert.match(sql,/may_self_mutate boolean not null default false check \(may_self_mutate=false\)/i);
});

test("P13.1 cognitive and ecosystem health classes are durable semantic metrics",()=>{
  for(const value of ["calibration_drift","contradiction_growth","stale_memory","evaluator_health","routing_regret","transfer_outcome","ecosystem_learning","provider_drift","model_drift","method_drift","revalidation_pressure"]){
    assert.match(sql,new RegExp(value,"i"));
  }
});

test("P13.2 trace fabric retains ordered pipeline evidence classes",()=>{
  for(const value of ["context","policy","router","specialist","method","tool","evidence","verifier","state","outcome","learning","promotion"]){
    assert.match(sql,new RegExp(`'${value}'`));
  }
  assert.match(sql,/predecessor_ref text/i);
  assert.match(sql,/trace_ref text not null/i);
});

test("P13.6 separates predicted actual process decision and transfer outcomes",()=>{
  for(const value of ["predicted_outcome","actual_outcome","process_quality","decision_quality","transfer_effect","luck_confounded"]){
    assert.match(sql,new RegExp(value,"i"));
  }
});

test("P13.7 learning evidence keeps local scope and explicit promotion state",()=>{
  for(const value of ["build_history","failure_intelligence","negative_knowledge","procedure_learning","ecosystem_candidate","promotion_authorization_ref"]){
    assert.match(sql,new RegExp(value,"i"));
  }
});

test("P13.8 correlated error dimensions are explicit",()=>{
  for(const value of ["correlated_error","shared_source","shared_model","shared_benchmark"]){
    assert.match(sql,new RegExp(value,"i"));
  }
});

test("P13.10 evaluator results bind evaluator benchmark reproducibility privacy calibration and scale",()=>{
  for(const value of ["evaluator_ref","evaluator_version","benchmark_ref","benchmark_version","reproducibility_ref","privacy_class","sample_count","calibration_state"]){
    assert.match(sql,new RegExp(value,"i"));
  }
});

test("analytics public surface exposes the required C13 modules",()=>{
  for(const moduleName of ["metrics","observability","reliability","portfolio","agency","recommendations","lessons","security","self-audit","accuracy","evaluators","transferability","measurement-schema","privacy-instrumentation","intelligence-governance"]){
    assert.match(index,new RegExp(`\\./${moduleName}\\.js`));
  }
});
