import assert from 'node:assert/strict';
import test from 'node:test';
import { createExecutionHandler } from '../../supabase/functions/command-center-execution/handler.mjs';
import { ManagedOwnerRuntimeProvider } from '../dist/runtime/owner-security-provider.js';
const requestId='00000000-0000-4000-8000-000000000001';
const conversationId='00000000-0000-4000-8000-000000000002';
const ownerTurnId='00000000-0000-4000-8000-000000000003';
const brainTurnId='00000000-0000-4000-8000-000000000004';
const base='https://gmlsucpwliegwlxymjvp.supabase.co';
const now=Date.parse('2026-11-04T08:00:00Z');
const executor={executor_key:'executor:native',executor_ref:'supabase-function:native-worker',
 project_type_keys:['software'],environments:['deterministic'],capabilities:['project.execute'],
 enabled:true,health:'available',retired_at:null,cost_class:'free',authority_class:'execute_reversible'};
function harness(overrides={}) {
 const calls=[];
 const data={command_center_project_roadmaps:[{version:1,structure_verified:true}],command_center_project_checkpoints:[{checkpoint_id:'checkpoint:1',exact_next_work_unit_id:'unit:1'}],command_center_project_profiles:[{project_id:'project-1',type_key:'software',status:'Planning'}],command_center_agency_executors:[executor],command_center_agency_runs:[{project_id:'project-1',run_id:'agency-run:'+requestId,state:'working',generation:1,objective:'Build next task',stop_requested:false,pause_requested:false}],command_center_agency_tasks:[{task_id:'agency-task:1',run_id:'agency-run:'+requestId,state:'working',evidence_refs:['evidence:mock-task']}],command_center_agency_task_claims:[{task_id:'agency-task:1',worker_id:'executor:native',heartbeat_at:new Date(now-1000).toISOString(),expires_at:new Date(now+60000).toISOString()}],command_center_provider_registry:[{provider_key:'provider:native',capabilities:['brain.respond'],configuration:{execution_ref:'supabase-function:native-brain'}}],...overrides};
 const fetcher=async(input,init)=>{
  const url=new URL(input);calls.push({url,init});
  assert.equal(url.origin,base); assert.equal(init.headers.authorization,'Bearer owner-session');assert.equal(init.redirect,'error');
  let value;
  if(url.pathname==='/auth/v1/user')value={id:'owner-1'};
  else if(url.pathname.endsWith('/is_command_center_authorized'))value=overrides.authorized??true;
  else if(url.pathname.endsWith('/command_center_project_work_readiness'))value={ready:overrides.ready??true};
  else if(url.pathname==='/functions/v1/native-worker')value={accepted:true};
  else if(url.pathname==='/functions/v1/native-brain')value={brainTurnId};
  else {
   assert.equal(url.searchParams.get('owner_id'),'eq.owner-1');
   const table=url.pathname.split('/').pop();
   if(table==='command_center_brain_conversation_turns') value=url.searchParams.get('role')==='eq.owner'?[{turn_id:ownerTurnId,project_id:'project-1'}]:[{turn_id:brainTurnId,project_id:overrides.responseProject??'project-1',safe_text:'Actual persisted response',redaction_state:'safe_text',canonical_writes_authorized:false,evidence_refs:[`brain:response-to:${ownerTurnId}`]}];
   else value=data[table];
   assert.notEqual(value,undefined,'Unexpected request '+url.pathname);
  }
  return Response.json(value);
 };
 return {calls,handler:createExecutionHandler({supabaseUrl:base,publishableKey:'public-key',fetcher,now:()=>now})};
}
function request(body,headers={}){return new Request(base+'/functions/v1/command-center-execution',{method:'POST',headers:{authorization:'Bearer owner-session','content-type':'application/json',...headers},body:JSON.stringify(body)});}
const start={action:'agency_start',projectId:'project-1',objective:'Build next task',requestId};
test('Start calls the registered worker immediately and independently verifies its live claim',async()=>{
 const {handler,calls}=harness();const result=await handler(request(start));assert.equal(result.status,200);assert.equal((await result.json()).state,'working');
 assert.equal(calls.filter(c=>c.url.pathname==='/functions/v1/native-worker').length,1);
 assert.equal(calls.some(c=>c.url.pathname.endsWith('command_center_agency_create_run')),false);
 const dispatch=JSON.parse(calls.find(c=>c.url.pathname==='/functions/v1/native-worker').init.body);
 assert.equal(dispatch.allowPaid,false);assert.equal(dispatch.allowProtected,false);assert.equal(dispatch.requestId,requestId);
});
test('No executor returns a concrete blocker without creating a draft or invoking a worker',async()=>{
 const {handler,calls}=harness({command_center_agency_executors:[]});const result=await handler(request(start));assert.equal(result.status,503);assert.equal((await result.json()).error,'no_verified_free_immediate_executor');assert.equal(calls.some(c=>c.url.pathname.startsWith('/functions/')),false);
});
for(const [name,override,error] of [
 ['accepted-only worker',{command_center_agency_runs:[]},'execution_receipt_missing'],
 ['draft receipt',{command_center_agency_runs:[{run_id:'agency-run:'+requestId,project_id:'project-1',state:'draft',objective:'Build next task'}]},'execution_not_verified'],
 ['stale heartbeat',{command_center_agency_task_claims:[{task_id:'agency-task:1',worker_id:'executor:native',heartbeat_at:new Date(now-61000).toISOString(),expires_at:new Date(now+1000).toISOString()}]},'worker_claim_not_verified'],
 ['different task claim',{command_center_agency_task_claims:[{task_id:'other-task',worker_id:'executor:native',heartbeat_at:new Date(now).toISOString(),expires_at:new Date(now+1000).toISOString()}]},'worker_claim_not_verified'],
 ['wrong executor',{command_center_agency_task_claims:[{task_id:'agency-task:1',worker_id:'executor:other',heartbeat_at:new Date(now).toISOString(),expires_at:new Date(now+1000).toISOString()}]},'worker_claim_not_verified']
])test(name+' cannot report working',async()=>{const {handler}=harness(override);const response=await handler(request(start));assert.equal((await response.json()).error,error);});
test('Executor references cannot forward owner credentials outside the production backend',async()=>{
 const {handler,calls}=harness({command_center_agency_executors:[{...executor,executor_ref:'https://attacker.invalid'}]});const result=await handler(request(start));assert.equal(result.status,503);assert.equal(calls.some(c=>c.url.hostname==='attacker.invalid'),false);
});
test('Unauthorized owner cannot invoke a worker',async()=>{const {handler,calls}=harness({authorized:false});assert.equal((await handler(request(start))).status,403);assert.equal(calls.some(c=>c.url.pathname.startsWith('/functions/')),false);});
test('Brain success requires a saved, scoped response tied to the exact owner turn',async()=>{const {handler}=harness();const result=await handler(request({action:'brain_response',conversationId,ownerTurnId}));assert.equal(result.status,200);assert.equal((await result.json()).brainTurnId,brainTurnId);});
test('Brain cannot substitute a response from another project',async()=>{const {handler}=harness({responseProject:'other-project'});const result=await handler(request({action:'brain_response',conversationId,ownerTurnId}));assert.equal((await result.json()).error,'response_not_verified');});
test('Missing inference provider is explicit and performs no generation call',async()=>{const {handler,calls}=harness({command_center_provider_registry:[]});const result=await handler(request({action:'brain_response',conversationId,ownerTurnId}));assert.equal((await result.json()).error,'no_eligible_inference');assert.equal(calls.some(c=>c.url.pathname.startsWith('/functions/')),false);});
test('Untrusted origin cannot trigger execution',async()=>{const {handler,calls}=harness();assert.equal((await handler(request(start,{origin:'https://attacker.invalid'}))).status,403);assert.equal(calls.length,0);});
test('Browser refuses an accepted/draft transport receipt instead of claiming Start succeeded',async()=>{
 const storage={getItem:()=>JSON.stringify({accessToken:'owner-session',refreshToken:'unused',expiresAt:9999999999,userId:'owner-1'}),setItem(){},removeItem(){}};
 const provider=new ManagedOwnerRuntimeProvider({storage,inner:{id:'test',load:async()=>({}),signIn:async()=>{},signOut:async()=>{}},supabaseUrl:base,publishableKey:'sb_publishable_test',fetcher:async(input)=>String(input).includes('/functions/')?Response.json({runId:'agency-run:'+requestId,state:'draft'}):Response.json([{project_id:'project-1'}])});
 await assert.rejects(provider.createProjectAgencyRun('project-1','Build next task',requestId),/verified worker claim/);
});

test('Unsatisfied future-company roadmap gates prevent any worker invocation',async()=>{
 const id='project:company:future:001';
 const {handler,calls}=harness({ready:false,
 command_center_project_profiles:[{project_id:id,company_id:'company:future:001',type_key:'software',status:'active'}],
 command_center_project_roadmaps:[{version:1,state:'current',structure_verified:true}],
 command_center_project_checkpoints:[{checkpoint_id:'checkpoint:1',exact_next_work_unit_id:id+':recovery:source-check'}]});
 const result=await handler(request({...start,projectId:id}));
 assert.equal(result.status,409);
 assert.equal((await result.json()).error,'next_task_not_ready');
 assert.equal(calls.some(c=>c.url.pathname.startsWith('/functions/')),false);
});
