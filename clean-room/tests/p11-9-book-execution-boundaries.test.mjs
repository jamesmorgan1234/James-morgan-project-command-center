import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateEvidenceBackedBookExecutionPolicy, assessBookExecution } from "../dist/books/index.js";

const policy={id:"policy-1",ownerId:"owner-1",projectId:"books",version:1,portfolioAgentAutoAllowed:false,normalChatScope:["planning","research","writing","editing","artwork","interior","cover","formatting","qc","package_creation"],workScope:["publishing_account_browser_upload","previewer","submission","provider_account_bound_publishing"],brainScope:["planning","research"],foundryScope:["planning","research","package_creation"],projectAgentScope:["planning","research","writing","editing","qc","package_creation"],sourceRefs:["owner:books-policy"],observedAt:"2026-10-26T16:00:00Z"};
function request(overrides={}){return {id:"req-1",ownerId:"owner-1",projectId:"books",bookId:"book-1",action:"writing",executor:"normal_chat",exactTargetRef:"book:book-1:v1",observedAt:"2026-10-26T16:05:00Z",...overrides};}

test("P11.9 normal chat owns planning/research/writing/QC/package work and Work stays publishing-only",()=>{assert.doesNotThrow(()=>validateEvidenceBackedBookExecutionPolicy(policy));assert.equal(assessBookExecution(policy,request()).allowed,true);assert.equal(assessBookExecution(policy,request({executor:"work"})).reason,"work_publishing_only");assert.throws(()=>validateEvidenceBackedBookExecutionPolicy({...policy,workScope:[...policy.workScope,"writing"]}),/publishing-only/i);});

test("P11.9 portfolio Agent Auto remains excluded",()=>{const result=assessBookExecution(policy,request({executor:"portfolio_agent"}));assert.equal(result.allowed,false);assert.equal(result.reason,"portfolio_agent_excluded");});

test("P11.9 project-specific Agent can work only inside declared exact scope",()=>{assert.equal(assessBookExecution(policy,request({executor:"project_agent",action:"editing"})).allowed,true);assert.equal(assessBookExecution(policy,request({executor:"project_agent",action:"cover"})).reason,"outside_executor_scope");});

test("P11.9 protected publishing actions require exact target and authorization",()=>{assert.equal(assessBookExecution(policy,request({executor:"work",action:"submission",exactTargetRef:"book:book-1:kindle:v2"})).reason,"missing_protected_authorization");assert.equal(assessBookExecution(policy,request({executor:"work",action:"submission",exactTargetRef:"book:book-1:kindle:v2",authorizationRef:"owner-submit:1"})).allowed,true);assert.equal(assessBookExecution(policy,request({exactTargetRef:""})).reason,"missing_exact_target");});

test("P11.9 execution policy cannot cross owner/project scope",()=>{assert.throws(()=>assessBookExecution(policy,request({projectId:"other"})),/cannot cross owner\/project/i);});

test("P11.9 durable execution-boundary decisions are immutable owner-scoped and preserve Agent/Work rules",()=>{const sql=readFileSync(new URL("../../supabase/migrations/20261026124000_p11_9_book_execution_boundaries.sql",import.meta.url),"utf8");assert.match(sql,/command_center_book_execution_policy_history/i);assert.match(sql,/command_center_book_execution_decision_history/i);assert.match(sql,/portfolio_agent_auto_allowed boolean not null/i);assert.match(sql,/normal_chat_scope text\[\]/i);assert.match(sql,/work_scope text\[\]/i);assert.match(sql,/executor text not null check\(executor in \('brain','foundry','project_agent','portfolio_agent','normal_chat','work'\)\)/i);assert.match(sql,/book execution boundary evidence is immutable/i);assert.match(sql,/is_command_center_authorized/i);});
