import assert from 'node:assert/strict';
import test from 'node:test';
import { queueOnExistingNormalChatWorker, NORMAL_CHAT_WORKER_KEY, NORMAL_CHAT_WORKER_REF } from '../../supabase/functions/command-center-execution/normal-chat-adapter.mjs';
const projectId='project:company:future:001';
const companyId='company:future:001';
const requestId='00000000-0000-4000-8000-000000000001';
const runId='agency-run:'+requestId;
const objective='Prepare the next approved company build task';
function fixture(changes={}) {
 const calls=[];
 const tables={
   command_center_project_profiles:[{project_id:projectId,company_id:companyId,status:'active',type_key:'software'}],
   command_center_agency_executors:[{executor_key:NORMAL_CHAT_WORKER_KEY,executor_ref:NORMAL_CHAT_WORKER_REF,enabled:true,health:'degraded',cost_class:'free',retired_at:null,environments:['normal_chat'],capabilities:['project.execute'],authority_class:'execute_reversible'}],
   command_center_project_roadmaps:[{version:2,state:'current',structure_verified:true}],
   command_center_project_checkpoints:[{checkpoint_id:'00000000-0000-4000-8000-000000000002',roadmap_version:2,exact_next_work_unit_id:projectId+':recovery:source-integrity'}],
   command_center_agency_runs:[{run_id:runId,project_id:projectId,objective,control_mode:'until_work',authorization_ref:'owner:normal-chat-start:'+runId,state:'queued',generation:1,stop_requested:false,pause_requested:false}]
 };
 Object.assign(tables,changes);
 const readRows=async(table,params)=>{calls.push({kind:'read',table,params});return tables[table]??[]};
 const rpc=async(name,payload)=>{calls.push({kind:'rpc',name,payload});return changes.rpcReceipt??{run_id:runId,generation:1,state:'queued',duplicate:false}};
 const invoke=(args={})=>queueOnExistingNormalChatWorker({projectId,objective,requestId,readRows,rpc,...args});
 return {calls,readRows,rpc,invoke};
}
test('bound old worker queues durably; degraded health never implies immediate execution',async()=>{
 const {calls,invoke}=fixture();
 const x=await invoke();
 assert.equal(x.companyId,companyId);assert.equal(x.runId,runId);
 assert.equal(x.workerKey,NORMAL_CHAT_WORKER_KEY);
 assert.equal(x.workerRef,NORMAL_CHAT_WORKER_REF);
 assert.equal(x.workerHealth,'degraded');
 assert.equal(x.runState,'queued');assert.equal(x.queueAccepted,true);
 assert.equal(x.executionVerified,false);assert.equal(x.workerImmediatelyInvoked,false);
 assert.equal(x.workingTaskId,null);assert.equal(x.allowPaid,false);assert.equal(x.allowProtected,false);
 const rpcCalls=calls.filter(c=>c.kind==='rpc');assert.equal(rpcCalls.length,1);
 assert.equal(rpcCalls[0].name,'command_center_agency_start_normal_chat');
 assert.deepEqual(rpcCalls[0].payload,{p_project_id:projectId,p_run_id:runId,p_objective:objective});
 assert.equal(calls.filter(c=>c.kind==='read'&&c.table==='command_center_agency_runs').length,1);
});
test('excluded company 014 returns 403 BEFORE any database read or queue action',async()=>{
 const {calls,invoke}=fixture();
 await assert.rejects(invoke({projectId:'project:company:future:014'}),e=>e.status===403&&e.message==='project_outside_preparation_scope');
 assert.equal(calls.length,0);
});
test('rejects invalid IDs and out-of-scope projects before any database read',async()=>{
 for(const id of ['project:company:future:000','project:company:future:118','project:company:future:1','project:company:future:014:task','project:another:001']) {
   const {calls,invoke}=fixture();await assert.rejects(invoke({projectId:id}),/project_outside_preparation_scope/);assert.equal(calls.length,0);
 }
});
test('rejects wrong company identity',async()=>{
 const f=fixture({command_center_project_profiles:[{project_id:projectId,company_id:'company:future:002',status:'active'}]});
 await assert.rejects(f.invoke(),/project_identity_mismatch/);assert.equal(f.calls.filter(c=>c.kind==='rpc').length,0);
});
test('no registered old worker fails closed; it does not register a new worker',async()=>{
 const f=fixture({command_center_agency_executors:[]});
 await assert.rejects(f.invoke(),/existing_worker_unavailable/);assert.equal(f.calls.filter(c=>c.kind==='rpc').length,0);
});
test('spoofed free executor ref fails closed',async()=>{
 const f=fixture({command_center_agency_executors:[{executor_key:NORMAL_CHAT_WORKER_KEY,executor_ref:'supabase-function:unapproved-worker',enabled:true,cost_class:'free',retired_at:null,environments:['normal_chat'],capabilities:['project.execute'],authority_class:'execute_reversible'}]});
 await assert.rejects(f.invoke(),/existing_worker_unavailable/);assert.equal(f.calls.filter(c=>c.kind==='rpc').length,0);
});
test('paid, retired, or disabled worker cannot be selected',async()=>{
 for(const change of [{cost_class:'paid'},{retired_at:'2026-11-04T00:00:00Z'},{enabled:false},{environments:['work']},{capabilities:[]}]){
   const original=fixture();
   const originalRead=original.readRows;
   const readRows=async(table,params)=>{
     const rows=await originalRead(table,params);
     return table==='command_center_agency_executors' ? rows.map(row=>({...row,...change})) : rows;
   };
   await assert.rejects(original.invoke({readRows}),/existing_worker_unavailable/);
   assert.equal(original.calls.filter(c=>c.kind==='rpc').length,0);
 }
});
test('roadmap or checkpoint failure cannot create a run',async()=>{
 for(const change of [{command_center_project_roadmaps:[{version:2,state:'current',structure_verified:false}]},{command_center_project_checkpoints:[]}]){
   const f=fixture(change);await assert.rejects(f.invoke(),/roadmap_not_verified|checkpoint_not_available/);
   assert.equal(f.calls.filter(c=>c.kind==='rpc').length,0);
 }
});
test('wrong durable run or unauthorized binding cannot be reported queued',async()=>{
 for(const over of [
  {state:'working',generation:1},
  {state:'queued',objective:'different objective'},
  {state:'queued',authorization_ref:'owner:start:other'},
  {state:'queued',stop_requested:true},
  {state:'queued',generation:2}
 ]) {
   const run={run_id:runId,project_id:projectId,objective,control_mode:'until_work',authorization_ref:'owner:normal-chat-start:'+runId,state:'queued',generation:1,stop_requested:false,pause_requested:false,...over};
   const x=fixture({command_center_agency_runs:[run]});
   await assert.rejects(x.invoke(),/queue_not_persisted|run_stopped/);
 }
});
test('duplicate admission is idempotent and still not execution evidence',async()=>{
 const f=fixture({rpcReceipt:{run_id:runId,generation:1,state:'queued',duplicate:true}});
 const result=await f.invoke();
 assert.equal(result.duplicate,true);assert.equal(result.executionVerified,false);assert.equal(result.queueAccepted,true);
});
test('owner-only RPC failure propagates without a fabricated queue receipt',async()=>{
 const f=fixture();
 const rpc=async()=>{throw Error('owner authorization denied')};
 await assert.rejects(f.invoke({rpc}),/owner authorization denied/);
 assert.equal(f.calls.filter(c=>c.table==='command_center_agency_runs').length,0);
});
