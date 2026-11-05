import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchImmediately,isOnDemandScopedProject} from '../../supabase/functions/command-center-execution/immediate-dispatch.mjs';

const requestId='00000000-0000-4000-8000-000000000001';
const expectedRun='agency-run:'+requestId;
const now=Date.parse('2026-11-05T14:00:00Z');
function fixture(options={}){
 const projectId=options.projectId||'aro';
 const type=options.type||'project-type:company-build';
 const objective=options.objective||'Continue the owner-authorized scoped work';
 const company=projectId.match(/^project:company:future:(\d{3})$/);
 const isBook=type==='project-type:book';
 const worker={executor_key:'executor:free-direct',executor_ref:'supabase-function:cc-free-direct-step',
  health:'available',enabled:true,retired_at:null,cost_class:'free',environments:['deterministic'],
  capabilities:['project.execute','book.editorial.review'],
  project_type_keys:[],authority_class:'execute_reversible'};
 const tables={
 command_center_project_profiles:[{project_id:projectId,company_id:company?'company:future:'+company[1]:null,
   status:options.status??(company?'active':isBook?'Agent review required / unpublished':'Planning'),type_key:type}],
 command_center_agency_executors:options.executors??[worker],
 command_center_project_roadmaps:[{version:2,state:'current',structure_verified:true}],
 command_center_project_checkpoints:[{checkpoint_id:'00000000-0000-4000-8000-000000000011',
   exact_next_work_unit_id:projectId+':recovery:source-check'}],
 command_center_agency_runs:[{run_id:expectedRun,project_id:projectId,objective,
   authorization_ref:'owner:on-demand-start:'+expectedRun,control_mode:'next_step',
   state:options.runState??'working',generation:1,stop_requested:false,pause_requested:false}],
 command_center_agency_tasks:[{task_id:'task:source-check',run_id:expectedRun,state:options.taskState??'working',
   evidence_refs:['unit:source-check']}],
 command_center_agency_task_claims:[{task_id:'task:source-check',worker_id:worker.executor_key,
   heartbeat_at:new Date(now-5000).toISOString(),expires_at:new Date(now+60000).toISOString()}],
 command_center_agency_task_commits:[{task_id:'task:source-check',worker_id:worker.executor_key,
   result_ref:'evidence:source-check',result_hash:'a'.repeat(64),evidence_refs:['evidence:source-check']}]
 };
 Object.assign(tables,options.tables||{});
 const reads=[],invocations=[],readinessCalls=[];
 const readRows=async(table,params)=>{reads.push({table,params});return tables[table]??[]};
 const readiness=async(input)=>{readinessCalls.push(input);return {ready:options.ready!==false}};
 const invoke=async(ref,payload)=>{invocations.push({ref,payload});if(options.invokeError)throw Error('provider_unreachable');return {accepted:true}};
 const execute=(override={})=>dispatchImmediately({
  projectId,objective,requestId,readRows,readiness,invoke,now:()=>now,...override
 });
 return{execute,reads,invocations,readinessCalls,tables};
}
test('all named non-future projects are eligible without an hourly task',()=>{
 const ids=['aro','velo-clip','mini-movies','fanvue-veyla','revocapture',
 'coupon-autopilot','torevi','edge-finder','loopwren','margincrafttools','crowdskein'];
 for(const id of ids)assert.equal(isOnDemandScopedProject(id),true,id);
 assert.equal(isOnDemandScopedProject('project:company:future:001'),true);
 assert.equal(isOnDemandScopedProject('project:company:future:117'),true);
 assert.equal(isOnDemandScopedProject('project:company:future:118'),false);
 assert.equal(isOnDemandScopedProject('project:company:future:abc'),false);
});
test('ARO can start now with independently verified live task claim',async()=>{
 const f=fixture();const r=await f.execute();
 assert.equal(r.state,'working');assert.equal(r.immediateExecutionVerified,true);
 assert.equal(r.scheduledFallback,false);assert.equal(r.runId,expectedRun);
 assert.equal(f.invocations.length,1);
 assert.equal(f.invocations[0].ref,'supabase-function:cc-free-direct-step');
 assert.equal(f.invocations[0].payload.allowPaid,false);
 assert.equal(f.invocations[0].payload.ownerMayPublish,false);
 assert.equal(f.invocations[0].payload.next,null);
});
test('unpublished books require a specialist editorial capability and forbid publishing',async()=>{
 const f=fixture({projectId:'kdp-a-calmer-mind',type:'project-type:book'});
 const r=await f.execute();assert.equal(r.bookReview,true);
 const policy=f.invocations[0].payload.bookReviewPolicy;
 assert.equal(policy.workflow,'book_editorial_quality_review');
 assert.equal(policy.substantiveRevision,true);
 assert.equal(policy.humanVoiceReview,true);
 assert.equal(policy.verifySourceManuscript,true);
 assert.equal(policy.authorDefault,'James Morgan');
 assert.equal(policy.publicationAuthorized,false);
 assert.equal(policy.coverApprovedByThisRun,false);
});
test('published books do not auto-rewrite or republish',async()=>{
 const f=fixture({projectId:'kdp-a-calmer-mind',type:'project-type:book',status:'Published / live on Amazon'});
 await assert.rejects(f.execute(),/published_book_requires_separate_scope/);
 assert.equal(f.invocations.length,0);
});
test('book executor missing editorial capability cannot start',async()=>{
 const f=fixture({projectId:'kdp-a-calmer-mind',type:'project-type:book'});
 f.tables.command_center_agency_executors[0].capabilities=['project.execute'];
 await assert.rejects(f.execute(),/no_verified_free_immediate_executor/);
 assert.equal(f.invocations.length,0);
});
test('unavailable free provider never falls back to ChatGPT Task or queues work',async()=>{
 const f=fixture({executors:[{executor_key:'executor:chatgpt-tasks-normal-chat',
  executor_ref:'chatgpt-task:6ada7af0b254819184456ca1246e3f69',
  enabled:true,health:'degraded',cost_class:'free',retired_at:null,
  environments:['normal_chat'],capabilities:['project.execute'],
  project_type_keys:[],authority_class:'execute_reversible'}]});
 await assert.rejects(f.execute(),/no_verified_free_immediate_executor/);
 assert.equal(f.invocations.length,0);
 assert.equal(f.reads.some(x=>x.table==='command_center_agency_runs'),false);
});
test('paid, unavailable, or external executor cannot be used',async()=>{
 for(const edit of [{health:'degraded'},{cost_class:'paid'},{executor_ref:'https://untrusted.site'},
  {executor_ref:'supabase-function:command-center-execution'},{enabled:false},{retired_at:'2026-11-05T00:00:00Z'}]){
  const f=fixture();Object.assign(f.tables.command_center_agency_executors[0],edit);
  await assert.rejects(f.execute(),/no_verified_free_immediate_executor/);
  assert.equal(f.invocations.length,0);
 }
});
test('future companies require verified roadmap and task readiness before invoking',async()=>{
 const f=fixture({projectId:'project:company:future:001'});
 const r=await f.execute();
 assert.equal(r.immediateExecutionVerified,true);assert.equal(f.readinessCalls.length,1);
 assert.equal(f.invocations[0].payload.next.roadmapVersion,2);
 const missing=fixture({projectId:'project:company:future:001',ready:false});
 await assert.rejects(missing.execute(),/next_task_not_ready/);assert.equal(missing.invocations.length,0);
});
test('no false success from queued run or missing live worker claim',async()=>{
 const queued=fixture({runState:'queued'});
 await assert.rejects(queued.execute(),/execution_not_verified/);
 const without=fixture({tables:{command_center_agency_task_claims:[]}});
 await assert.rejects(without.execute(),/worker_claim_not_verified/);
 const stale=fixture();stale.tables.command_center_agency_task_claims[0].expires_at=new Date(now-1).toISOString();
 await assert.rejects(stale.execute(),/worker_claim_not_verified/);
});
test('owner authorization must match exact run, even if a worker claims the task',async()=>{
 const f=fixture();f.tables.command_center_agency_runs[0].authorization_ref='owner:other-run';
 await assert.rejects(f.execute(),/execution_receipt_invalid/);
});
test('catalogue or mixed book groups cannot be silently rewritten as unpublished manuscripts',async()=>{
 for(const status of ['Book catalogue / publication tracking','Mixed — five ready / one on hold','Production complete / publication unconfirmed']){
  const f=fixture({projectId:'kdp-a-calmer-mind',type:'project-type:book',status});
  await assert.rejects(f.execute(),/book_unpublished_scope_not_verified/);
  assert.equal(f.invocations.length,0);
 }
});
test('completed result requires verified task and durable evidence commit',async()=>{
 const complete=fixture({runState:'completed',taskState:'verified'});
 const r=await complete.execute();assert.equal(r.state,'completed');
 assert.equal(r.immediateExecutionVerified,true);
 const missing=fixture({runState:'completed',taskState:'verified',tables:{command_center_agency_task_commits:[]}});
 await assert.rejects(missing.execute(),/completion_evidence_not_verified/);
});
test('bad project identity and blocked project cannot dispatch',async()=>{
 const bad=fixture();bad.tables.command_center_project_profiles[0].project_id='wrong';
 await assert.rejects(bad.execute(),/project_identity_mismatch/);
 const paused=fixture({status:'Paused'});await assert.rejects(paused.execute(),/project_hold_requires_owner_review/);
 const blocked=fixture({status:'Blocked'});await assert.rejects(blocked.execute(),/project_hold_requires_owner_review/);
});
test('no duplicate retry on uncertain provider result',async()=>{
 const f=fixture({invokeError:true});
 await assert.rejects(f.execute(),/provider_unreachable/);
 assert.equal(f.invocations.length,1);
});
