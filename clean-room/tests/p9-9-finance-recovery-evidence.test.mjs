import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assessFinancialRecovery } from "../dist/finance/index.js";

function evidence(overrides={}){return {id:"recovery-1",ownerId:"owner-1",providerKey:"finance-provider:test-bank",incidentKind:"restore",observedAt:"2026-10-26T15:00:00Z",evidenceRefs:["audit:evidence:1"],auditRef:"audit:1",integrityVerified:true,provenanceVerified:true,providerHealth:"available",canonicalAccountRefs:["account-1"],priorExecutionRefs:[],receiptRefs:[],restoreValidation:{knownGoodSnapshotRef:"snapshot:known-good",backupHashVerified:true,currentAuthorizationRevalidated:true,currentRevocationsRevalidated:true,immutableHistoryPreserved:true,missingAccountRefs:[]},...overrides};}

test("P9.9 provider error stale balance partial sync duplicate and compromise fail closed",()=>{
 const cases=[["provider_error","defer"],["stale_balance","reject"],["partial_sync","defer"],["duplicate","reject"],["compromised_provider","reject"]];
 for(const [incidentKind,disposition] of cases){const result=assessFinancialRecovery(evidence({incidentKind,providerHealth:incidentKind==="compromised_provider"?"compromised":"available"}));assert.equal(result.disposition,disposition);assert.equal(result.failClosed,true);assert.equal(result.actionReplayAllowed,false);assert.equal(result.protectedActionAuthorized,false);}
});

test("P9.9 integrity or provenance failure rejects restore even when provider is healthy",()=>{
 assert.equal(assessFinancialRecovery(evidence({integrityVerified:false})).reason,"integrity_or_provenance_unverified");
 assert.equal(assessFinancialRecovery(evidence({provenanceVerified:false})).reason,"integrity_or_provenance_unverified");
});

test("P9.9 account relink accepts only when canonical identity set is preserved",()=>{
 const ok=assessFinancialRecovery(evidence({incidentKind:"account_relink",canonicalAccountRefs:["a","b"],relinkedAccountRefs:["b","a"]}));assert.equal(ok.disposition,"accept");assert.equal(ok.canonicalIdentityPreserved,true);
 const conflict=assessFinancialRecovery(evidence({incidentKind:"account_relink",canonicalAccountRefs:["a"],relinkedAccountRefs:["other"]}));assert.equal(conflict.disposition,"manual_review");assert.equal(conflict.canonicalIdentityPreserved,false);
});

test("P9.9 restore requires verified evidence and available provider",()=>{
 assert.equal(assessFinancialRecovery(evidence()).disposition,"accept");
 assert.equal(assessFinancialRecovery(evidence({providerHealth:"degraded"})).disposition,"defer");
 assert.equal(assessFinancialRecovery(evidence({providerHealth:"unavailable"})).disposition,"defer");
});

test("P9.9 uncertain protected action never replays and requires receipt/provider reconciliation",()=>{
 const noReceipt=assessFinancialRecovery(evidence({incidentKind:"protected_action_uncertain"}));assert.equal(noReceipt.disposition,"manual_review");assert.equal(noReceipt.reason,"uncertain_outcome_requires_provider_reconciliation");assert.equal(noReceipt.actionReplayAllowed,false);
 const withReceipt=assessFinancialRecovery(evidence({incidentKind:"protected_action_uncertain",priorExecutionRefs:["exec:1"],receiptRefs:["receipt:1"]}));assert.equal(withReceipt.reason,"uncertain_outcome_requires_receipt_reconciliation");assert.equal(withReceipt.actionReplayAllowed,false);
});

test("P9.9 rollback cannot be authorized from recovery evidence and requires new exact owner authorization",()=>{
 const result=assessFinancialRecovery(evidence({incidentKind:"protected_action_rollback"}));assert.equal(result.disposition,"manual_review");assert.equal(result.reason,"rollback_requires_new_exact_owner_authorization");assert.equal(result.rollbackAuthorized,false);
});

test("P9.9 durable recovery evidence is immutable owner-scoped and forbids replay/rollback authority",()=>{
 const sql=readFileSync(new URL("../../supabase/migrations/20261026107000_p9_9_finance_recovery_evidence.sql",import.meta.url),"utf8");
 assert.match(sql,/command_center_finance_recovery_evidence_history/i);assert.match(sql,/command_center_finance_uncertain_action_evidence_history/i);assert.match(sql,/action_replay_allowed boolean not null default false check\(action_replay_allowed=false\)/i);assert.match(sql,/rollback_authorized boolean not null default false check\(rollback_authorized=false\)/i);assert.match(sql,/fail_closed boolean not null default true check\(fail_closed=true\)/i);assert.match(sql,/history is immutable/i);assert.match(sql,/is_command_center_authorized/i);
});
