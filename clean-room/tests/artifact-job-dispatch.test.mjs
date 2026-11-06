import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createExecutionHandler} from '../../supabase/functions/command-center-execution/handler.mjs';
import {requestOwnerArtifactJob,readOwnerArtifactJob,cancelOwnerArtifactJob} from '../dist/runtime/execution-gateway.js';
import {ManagedOwnerRuntimeProvider} from '../dist/runtime/owner-security-provider.js';
const base='https://gmlsucpwliegwlxymjvp.supabase.co',owner='11111111-1111-4111-8111-111111111111',worker='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
const hash=s=>createHash('sha256').update(s).digest('hex');
const command={projectId:'aro',invocationId:id,workerId:worker,actionKey:'artifact.write',input:{name:'proof.txt',content:'owner approved content'}};
function harness(){
 const calls=[];let job=null,authorized=true;
 const fetcher=async(url,init)=>{
  const u=new URL(url);calls.push({url:u,init});assert.equal(u.origin,base);assert.equal(init.headers.authorization,'Bearer owner-session');
  if(u.pathname==='/auth/v1/user')return Response.json({id:owner});
  if(u.pathname.endsWith('/is_command_center_authorized'))return Response.json(authorized);
  if(u.pathname.endsWith('/command_center_pc_enqueue_artifact_job')){
   const p=JSON.parse(init.body);assert.equal(p.p_project,'aro');assert.equal(p.p_worker,worker);assert.equal(p.p_action,'artifact.write');
   const text=JSON.stringify(p.p_input);job??={invocation_id:p.p_invocation,owner_id:owner,worker_id:worker,project_id:'aro',company_id:'company:legacy:aro',brain_key:'brain:company:legacy:aro:v1',brain_version:2,action_key:p.p_action,input_text:text,input_hash:hash(text),state:'queued',fence:0,result:null,commit_id:null};
   return Response.json({invocationId:id,projectId:'aro',state:job.state,companyBuildStarted:false});
  }
  if(u.pathname.endsWith('/command_center_pc_cancel_artifact_job')){assert.equal(JSON.parse(init.body).p_invocation,id);if(job.state!=='completed')job.state='cancelled';return Response.json(job.state==='cancelled')}
  assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
  if(u.pathname.endsWith('/command_center_project_profiles'))return Response.json([{project_id:'aro',company_id:'company:legacy:aro'}]);
  if(u.pathname.endsWith('/command_center_pc_tool_jobs'))return Response.json(job?[job]:[]);
  throw Error('Unexpected upstream '+u.pathname);
 };
 const handler=createExecutionHandler({supabaseUrl:base,publishableKey:'public',fetcher});
 const send=(body,headers={})=>handler(new Request(base+'/functions/v1/command-center-execution',{method:'POST',headers:{authorization:'Bearer owner-session','content-type':'application/json',...headers},body:JSON.stringify(body)}));
 const options={supabaseUrl:base,publishableKey:'public',accessToken:'owner-session',fetcher:async(url,init)=>handler(new Request(url,init))};
 return{calls,send,options,set authorized(v){authorized=v},get job(){return job},complete(){
  job.state='completed';job.fence=1;job.lease_expires_at=new Date(Date.now()+90000).toISOString();job.commit_id='44444444-4444-4444-8444-444444444444';
  const text='actual persisted artifact result';job.result={lease:{invocationId:id,ownerId:owner,projectId:'aro',companyId:'company:legacy:aro',workerId:worker,taskId:'pc-tool:'+id,generation:1,fencingToken:1,expiresAt:job.lease_expires_at},toolKey:'owner-pc-artifacts',toolVersion:'artifact-v1',actionKey:'artifact.write',inputHash:job.input_hash,outputText:text,outputHash:hash(text)};
 }};
}
const start={...command,action:'artifact_job_start',executionAuthorized:true,allowPaid:false,allowProtected:false};
test('application start -> gateway -> owner RPC -> saved queue preserves exact input without claiming execution',async()=>{
 const h=harness(),receipt=await requestOwnerArtifactJob(h.options,command);assert.equal(receipt.state,'queued');assert.equal(receipt.executionVerified,false);assert.equal(receipt.companyBuildStarted,false);
 assert.equal(h.calls.filter(c=>c.url.pathname.endsWith('/command_center_pc_enqueue_artifact_job')).length,1);assert.equal(h.calls.some(c=>c.url.pathname.includes('agency')),false);
 assert.equal((await readOwnerArtifactJob(h.options,'aro',id)).state,'queued');assert.equal((await cancelOwnerArtifactJob(h.options,'aro',id)).state,'cancelled');
});
test('repeated exact admission reuses the same invocation rather than generating another identity',async()=>{const h=harness();await requestOwnerArtifactJob(h.options,command);await requestOwnerArtifactJob(h.options,command);assert.equal(h.job.invocation_id,id)});
test('artifact admission accepts a bounded file beyond the ordinary chat request envelope',async()=>{const h=harness();const r=await requestOwnerArtifactJob(h.options,{...command,input:{name:'larger.txt',content:'x'.repeat(20000)}});assert.equal(r.state,'queued');assert.equal(JSON.parse(h.job.input_text).content.length,20000)});
test('ordinary chat requests retain their original size bound',async()=>{const h=harness();const r=await h.send({action:'brain_response',extra:'x'.repeat(9000)});assert.equal(r.status,413);assert.equal(h.calls.length,0)});
for(const[label,patch,error]of[
 ['paid scope',{allowPaid:true},'artifact_action_scope_required'],['protected scope',{allowProtected:true},'artifact_action_scope_required'],
 ['missing execution scope',{executionAuthorized:false},'artifact_action_scope_required'],['arbitrary shell action',{actionKey:'shell.run'},'invalid_artifact_action'],
 ['traversal',{input:{name:'../private',content:'x'}},'invalid_artifact_input'],['injected account',{input:{name:'safe',content:'x',accountRef:'other'}},'invalid_artifact_input'],
 ['numeric filename',{input:{name:123,content:'x'}},'invalid_artifact_input']
])test(label+' is denied before owner admission',async()=>{const h=harness();const r=await h.send({...start,...patch});assert.equal((await r.json()).error,error);assert.equal(h.job,null)});
test('unauthorized session cannot queue or inspect a job',async()=>{const h=harness();h.authorized=false;const r=await h.send(start);assert.equal(r.status,403);assert.equal(h.job,null)});
test('untrusted origin cannot make even an authentication lookup',async()=>{const h=harness();const r=await h.send(start,{origin:'https://untrusted.invalid'});assert.equal(r.status,403);assert.equal(h.calls.length,0)});
test('a missing job is not a completion or permission to create one on a status read',async()=>{const h=harness();const r=await h.send({action:'artifact_job_status',projectId:'aro',invocationId:id});assert.equal(r.status,404);assert.equal(h.job,null)});
test('application completion requires persisted output hash, exact project lease and canonical commit',async()=>{const h=harness();await requestOwnerArtifactJob(h.options,command);h.complete();const r=await readOwnerArtifactJob(h.options,'aro',id);assert.equal(r.executionVerified,true);assert.equal(r.outputText,'actual persisted artifact result');assert.equal((await cancelOwnerArtifactJob(h.options,'aro',id)).state,'completed')});
for(const[label,change]of[
 ['corrupted output',j=>j.result.outputText='changed'],['cross-project lease',j=>j.result.lease.projectId='other'],
 ['wrong account owner',j=>j.result.lease.ownerId='other'],['wrong fence',j=>j.result.lease.fencingToken=2],['missing commit',j=>j.commit_id=null],['different lease expiry',j=>j.result.lease.expiresAt='2000-01-01T00:00:00Z']
])test(label+' cannot reach the application as verified output',async()=>{const h=harness();await requestOwnerArtifactJob(h.options,command);h.complete();change(h.job);const r=await h.send({action:'artifact_job_status',projectId:'aro',invocationId:id});assert.equal(r.status,503);assert.equal((await r.json()).error,'artifact_result_not_verified')});
test('owner provider routes artifact work through the authenticated dispatcher after a project-membership check',async()=>{
 const h=harness();const storage={getItem:()=>JSON.stringify({accessToken:'owner-session',refreshToken:'unused',expiresAt:9999999999,userId:owner}),setItem(){},removeItem(){}};
 const provider=new ManagedOwnerRuntimeProvider({storage,inner:{id:'test',load:async()=>({}),signIn:async()=>{},signOut:async()=>{}},supabaseUrl:base,publishableKey:'sb_publishable_test',fetcher:async(url,init)=>String(url).includes('/functions/')?h.options.fetcher(url,init):Response.json([{project_id:'aro'}])});
 assert.equal((await provider.requestOwnerArtifactJob(command)).executionVerified,false);assert.equal((await provider.readOwnerArtifactJob('aro',id)).state,'queued');assert.equal((await provider.cancelOwnerArtifactJob('aro',id)).state,'cancelled');
});
