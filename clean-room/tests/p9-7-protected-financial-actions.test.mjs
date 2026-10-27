import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { authorizeFinancialActionExecution } from "../dist/finance/index.js";

const intent = {
 id:"intent-1", ownerId:"owner-1", kind:"payment", accountRefs:["account-checking"], amountCents:5000,
 exactOwnerAuthorizationRef:"auth-1", providerHealthVerified:true, duplicateSideEffectChecked:true,
 providerKey:"finance-provider:test-bank", intentHash:"sha256:intent-1", createdAt:"2026-10-26T14:00:00Z", source:"owner_request"
};
const grant = {
 authorizationRef:"auth-1", ownerId:"owner-1", actionKind:"payment", providerKey:"finance-provider:test-bank",
 accountRefs:["account-checking"], amountCents:5000, intentHash:"sha256:intent-1", authorizedAt:"2026-10-26T14:01:00Z",
 expiresAt:"2026-10-26T14:06:00Z", assurance:"fresh_passkey_uv", oneTime:true, consumed:false, evidenceRefs:["passkey:uv:1"]
};
const context = { now:"2026-10-26T14:02:00Z", providerHealth:"available", providerHealthObservedAt:"2026-10-26T14:01:30Z", maxProviderHealthAgeMs:120000, duplicateSideEffectChecked:true, priorExecutionRefs:[] };

test("P9.7 exact fresh one-time owner authorization enables only its exact financial action envelope",()=>{
 const result=authorizeFinancialActionExecution(intent,grant,context);
 assert.equal(result.executionAuthorized,true); assert.equal(result.protectedActionAuthorized,true); assert.equal(result.oneTime,true);
 assert.equal(result.authorizationRef,"auth-1"); assert.equal(result.intentHash,"sha256:intent-1");
});

test("P9.7 analysis recommendation and automation cannot authorize money movement",()=>{
 for(const source of ["analysis","recommendation","automation"]) assert.throws(()=>authorizeFinancialActionExecution({...intent,source},grant,context),/cannot itself authorize money movement/i);
});

test("P9.7 stale consumed mismatched or replayed authorization fails closed",()=>{
 assert.throws(()=>authorizeFinancialActionExecution(intent,grant,{...context,now:"2026-10-26T14:06:00Z"}),/stale or expired/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,{...grant,consumed:true},context),/already been consumed/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,{...grant,amountCents:6000},context),/scope does not exactly match/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,{...grant,accountRefs:["other"]},context),/scope does not exactly match/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,{...grant,providerKey:"finance-provider:other"},context),/scope does not exactly match/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,grant,{...context,priorExecutionRefs:["execution:1"]}),/already has execution evidence/i);
});

test("P9.7 provider health must be available and immediately fresh",()=>{
 assert.throws(()=>authorizeFinancialActionExecution(intent,grant,{...context,providerHealth:"degraded"}),/health is unavailable, degraded, stale, or invalid/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,grant,{...context,providerHealth:"unavailable"}),/health is unavailable, degraded, stale, or invalid/i);
 assert.throws(()=>authorizeFinancialActionExecution(intent,grant,{...context,providerHealthObservedAt:"2026-10-26T13:00:00Z"}),/health is unavailable, degraded, stale, or invalid/i);
});

test("P9.7 authorization is exact across owner kind provider accounts amount hash and reference",()=>{
 const changes=[
  {...grant,ownerId:"owner-2"},{...grant,actionKind:"transfer"},{...grant,intentHash:"other"},{...grant,authorizationRef:"other"}
 ];
 for(const changed of changes) assert.throws(()=>authorizeFinancialActionExecution(intent,changed,context),/(scope does not exactly match|reference does not match)/i);
});


test("P9.7 money-moving actions require explicit positive amount scope",()=>{
 for(const kind of ["transfer","payment","trade","purchase"]) {
  assert.throws(()=>authorizeFinancialActionExecution({...intent,kind,amountCents:undefined},{...grant,actionKind:kind,amountCents:undefined},context),/requires exact amount scope/i);
 }
});

test("P9.7 fresh authorization cannot predate its exact action intent",()=>{
 assert.throws(()=>authorizeFinancialActionExecution(intent,{...grant,authorizedAt:"2026-10-26T13:59:00Z"},context),/cannot predate its exact action intent/i);
});

test("P9.7 durable protected action records are immutable owner-scoped one-time and receipt-backed",()=>{
 const sql=readFileSync(new URL("../../supabase/migrations/20261026105000_p9_7_protected_financial_actions.sql",import.meta.url),"utf8");
 assert.match(sql,/command_center_finance_action_intent_history/i); assert.match(sql,/command_center_finance_action_authorization_history/i); assert.match(sql,/command_center_finance_action_execution_history/i);
 assert.match(sql,/assurance text not null check\(assurance='fresh_passkey_uv'\)/i); assert.match(sql,/one_time boolean not null default true check\(one_time=true\)/i);
 assert.match(sql,/unique\(owner_id,intent_id\)/i); assert.match(sql,/unique\(owner_id,authorization_ref\)/i); assert.match(sql,/duplicate_side_effect_checked boolean not null check\(duplicate_side_effect_checked=true\)/i);
 assert.match(sql,/receipt_refs text\[\] not null check\(cardinality\(receipt_refs\)>0\)/i); assert.match(sql,/history is immutable/i); assert.match(sql,/is_command_center_authorized/i);
});
