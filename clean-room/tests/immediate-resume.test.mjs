import test from 'node:test';
import assert from 'node:assert/strict';
import {resumeImmediately} from '../../supabase/functions/command-center-execution/immediate-dispatch.mjs';
const now=Date.parse('2026-11-05T14:00:00Z');
const requestId='00000000-0000-4000-8000-000000000099';
const runId='agency-run:existing-unfinished-work';
function fixture(opts={}){
 const projectId=opts.projectId??'aro';
 const type=opts.type??'project-type:company-build';
 const worker={executor_key:'executor:direct',executor_ref:'supabase-function:free-direct-worker',
  enabled:true,health:'available',cost_class:'free',retired_at:null,
  environments:['deterministic'],capabilities:['project.execute','book.editorial.review'],
  project_type_keys:[],authority_class:'execute_reversible'};
 const tables={
  command_center_project_profiles:[{project_id:projectId,type_key:type,status:opts.status??'Active'}],
  command_center_agency_runs:[{run_id:runId,project_id:projectId,state:opts.previousState??'needs_user',
   control_mode:'until_work',generation:7,objective:'Continue approved build',
   stop_requested:false,pause_requested:false}],
  command_center_agency_executors:opts.executors??[worker],
  command_center_agency_tasks:[{task_id:'task:in-progress',state:opts.taskState??'working'}],
  command_center_agency_task_claims:[{task_id:'task:in-progress',worker_id:'executor:direct',
   heartbeat_at:new Date(now-1000).toISOString(),expires_at:new Date(now+60000).toISOString()}],
  command_center_agency_task_commits:[{task_id:'task:in-progress',worker_id:'executor:direct',
   result_ref:'verified:artifacts',result_hash:'a'.repeat(64),evidence_refs:['artifact:1']}]
 };
 const calls=[];
 const readRows=async(table,params)=>{calls.push({kind:'read',table,params});return tables[table]??[]};
 const invoke=async(ref,payload)=>{
  calls.push({kind:'direct-invoke',ref,payload});
  tables.command_center_agency_runs[0].state=opts.finalState??'working';
  return {accepted:true};
 };
 const execute=()=>resumeImmediately({projectId,runId,expectedGeneration:7,requestId,
  readRows,invoke,now:()=>now});
 return{execute,calls,tables};
}
test('on-demand Continue invokes existing run directly and verifies a fresh claim',async()=>{
 const f=fixture();const r=await f.execute();
 assert.equal(r.state,'working');
 assert.equal(r.runId,runId);
 assert.equal(r.taskId,'task:in-progress');
 assert.equal(r.immediateExecutionVerified,true);
 assert.equal(r.scheduledFallback,false);
 const direct=f.calls.filter(x=>x.kind==='direct-invoke');
 assert.equal(direct.length,1);
 assert.equal(direct[0].payload.action,'agency_continue');
 assert.equal(direct[0].payload.expectedGeneration,7);
 assert.equal(direct[0].payload.runId,runId);
 assert.equal(direct[0].payload.allowPaid,false);
 assert.equal(direct[0].payload.ownerMayPublish,false);
});
test('no direct executor means no requeue, no worker invocation',async()=>{
 const f=fixture({executors:[]});
 await assert.rejects(f.execute(),/no_verified_free_immediate_executor/);
 assert.equal(f.calls.filter(x=>x.kind==='direct-invoke').length,0);
});
test('stopped or already working run cannot be resumed',async()=>{
 for(const previousState of ['stopped','working','completed','queued']){
  const f=fixture({previousState});
  await assert.rejects(f.execute(),/run_not_eligible_to_continue/);
  assert.equal(f.calls.filter(x=>x.kind==='direct-invoke').length,0);
 }
});
test('provider accepted but no durable working run fails closed',async()=>{
 const f=fixture({finalState:'blocked'});
 await assert.rejects(f.execute(),/continue_not_verified/);
});
test('stale claim does not count as resumed execution',async()=>{
 const f=fixture();
 f.tables.command_center_agency_task_claims[0].heartbeat_at=new Date(now-70000).toISOString();
 await assert.rejects(f.execute(),/continued_claim_not_verified/);
});
test('on-demand Continue can return completed only with verified result commit',async()=>{
 const f=fixture({finalState:'completed',taskState:'verified'});
 const r=await f.execute();
 assert.equal(r.state,'completed');assert.equal(r.immediateExecutionVerified,true);
 const unproven=fixture({finalState:'completed',taskState:'verified'});
 unproven.tables.command_center_agency_task_commits=[];
 await assert.rejects(unproven.execute(),/continue_completion_unverified/);
});
test('published-book or held project cannot bypass owner gate',async()=>{
 const published=fixture({projectId:'kdp-a-calmer-mind',type:'project-type:book',status:'Published'});
 await assert.rejects(published.execute(),/published_book_requires_separate_scope/);
 const hold=fixture({status:'Paused'});
 await assert.rejects(hold.execute(),/project_hold_requires_owner_review/);
});
