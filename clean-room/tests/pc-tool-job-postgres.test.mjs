import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {mkdtemp,mkdir,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createPcToolJobTransport} from '../src/worker/pc-tool-job-transport.mjs';
import {createPcToolExecutionLane} from '../dist/worker/pc-tool-execution-lane.mjs';
import {createPcArtifactJobRunner} from '../dist/worker/pc-artifact-job-runner.mjs';
const migration=readFileSync(new URL('../../supabase/migrations/20261106194500_pc_exact_artifact_jobs.sql',import.meta.url),'utf8');
const activationMigration=readFileSync(new URL('../../supabase/migrations/20261106203000_pc_artifact_activation_status.sql',import.meta.url),'utf8');
const owner='11111111-1111-4111-8111-111111111111',worker='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444';
const hash=s=>createHash('sha256').update(s).digest('hex');
test('exact owner artifact jobs execute real PostgreSQL authorization, leases and canonical commits',async suite=>{
 const db=new PGlite();const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0]?.value;
 const enqueue=(input={name:'proof.txt',content:'actual content'},action='artifact.write')=>one('select command_center_pc_enqueue_artifact_job($1,$2,$3,$4,$5::jsonb) value',[id,'aro',worker,action,JSON.stringify(input)]);
 const exchange=(action,job=id,fence=1,result=null,actor=owner,pc=worker)=>one('select command_center_pc_tool_exchange_service($1,$2,$3,$4,$5,$6::jsonb) value',[actor,pc,action,job,fence,result===null?null:JSON.stringify(result)]);
 const reset=async()=>db.exec(`reset role;truncate command_center_pc_tool_jobs;update command_center_pc_worker_registrations set enabled=true;update command_center_members set access_status='active';update command_center_specialist_brains set version=2;set fixture.owner='${owner}';`);
 try{
 await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role;create schema command_center_pc_private;grant usage on schema command_center_pc_private to service_role;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('fixture.owner',true),'')::uuid$$;
 create function is_command_center_authorized() returns boolean language sql as $$select auth.uid() is not null$$;
 create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${other}');
 create table command_center_members(user_id uuid primary key,access_status text,revoked_at timestamptz);
 insert into command_center_members values('${owner}','active',null),('${other}','active',null);
 create table command_center_pc_worker_registrations(worker_id uuid primary key,owner_id uuid,enabled boolean,revoked_at timestamptz);
 insert into command_center_pc_worker_registrations values('${worker}','${owner}',true,null);
 create table command_center_project_profiles(owner_id uuid,project_id text,company_id text,primary key(owner_id,project_id));
 insert into command_center_project_profiles values('${owner}','aro','company:legacy:aro');
 create table command_center_specialist_brains(owner_id uuid,project_id text,brain_key text,version bigint,control_plane text,cost_class text,supported_project_ids text[],supported_company_ids text[],permission_keys text[]);
 insert into command_center_specialist_brains values('${owner}','aro','brain:company:legacy:aro:v1',2,'command_center','free',array['aro'],array['company:legacy:aro'],array['project:aro:tools.request']);set fixture.owner='${owner}';`);
 await db.exec(`alter table command_center_specialist_brains add column scope text default 'project',add column specialist_id text default 'specialist:aro',add column provider_keys text[] default array['provider:owner-pc:${worker}'];
 create table command_center_specialist_brain_versions(owner_id uuid,specialist_id text,version bigint,authority_evidence_ids text[]);
 insert into command_center_specialist_brain_versions values('${owner}','specialist:aro',2,array['evd_owner-command-center-brain-activation-20261105']);
 create table command_center_pc_inference_requests(owner_id uuid,worker_id uuid,project_id text,state text,activation_contract jsonb,route_snapshot jsonb,model_digest text);
 insert into command_center_pc_inference_requests values('${owner}','${worker}','aro','completed','{}','{"brainKey":"brain:company:legacy:aro:v1","brainVersion":2}',repeat('a',64));`);
 await db.exec(migration);await db.exec(activationMigration);
 await suite.test('owner admission is idempotent with exact saved bytes; conflicting input is rejected',async()=>{assert.equal((await enqueue()).state,'queued');assert.equal((await enqueue()).state,'queued');await assert.rejects(enqueue({name:'different.txt',content:'different'}),/already bound/);assert.equal(await one('select count(*)::int value from command_center_pc_tool_jobs'),1)});
 await suite.test('anonymous callers cannot queue or invoke service routines and service_role cannot mutate raw rows',async()=>{
  await db.exec('set role anon');await assert.rejects(enqueue(),/permission denied/);await assert.rejects(exchange('next',null,null),/permission denied/);await db.exec('reset role;set role service_role');await assert.rejects(db.query('update command_center_pc_tool_jobs set state=\'completed\''),/permission denied/);await db.exec('reset role');
 });
 await suite.test('wrong owner and unregistered worker are denied',async()=>{await assert.rejects(exchange('next',null,null,null,other),/authorization/);await assert.rejects(exchange('next',null,null,null,owner,other),/authorization/)});
 let claim,result;
 await suite.test('actual claim contains exact owner project, action scope, input hash and fence',async()=>{claim=await exchange('next',null,null);assert.equal(claim.saved.action.companyId,'company:legacy:aro');assert.equal(claim.saved.action.accountRef,'artifact:'+owner+':aro');assert.equal(claim.saved.action.authority.protectedActionAuthorized,false);assert.equal(claim.lease.fencingToken,1);assert.equal(await exchange('next',null,null),null);assert.equal((await exchange('current')).current,true);
  const outputText=JSON.stringify({name:'proof.txt',bytes:14,sha256:hash('actual content'),scope:'project_artifact_only'});result={lease:claim.lease,toolKey:'owner-pc-artifacts',actionKey:'artifact.write',toolVersion:'artifact-v1',inputHash:hash(claim.saved.inputText),outputText,outputHash:hash(outputText)};
 });
 await suite.test('wrong fence, corrupted hash, mismatched scope, and fabricated effect readback cannot commit',async()=>{
  await assert.rejects(exchange('commit',id,2,result),/current tool job/);
  await assert.rejects(exchange('commit',id,1,{...result,outputHash:'0'.repeat(64)}),/identity or hash/);
  await assert.rejects(exchange('commit',id,1,{...result,lease:{...result.lease,companyId:'other'}}),/identity or hash/);
  const outputText=JSON.stringify({name:'proof.txt',bytes:14,sha256:'0'.repeat(64),scope:'project_artifact_only'});await assert.rejects(exchange('commit',id,1,{...result,outputText,outputHash:hash(outputText)}),/readback not verified/);
 });
 await suite.test('canonical commit is immutable and readback returns persisted result and commit identity',async()=>{
  const committed=await exchange('commit',id,1,result);assert.equal(committed.receipt.canonicalCommitVerified,true);assert.match(committed.receipt.commitId,/^[a-f0-9-]{36}$/);assert.deepEqual(await exchange('readback'),committed);assert.deepEqual(await exchange('commit',id,1,result),committed);await assert.rejects(exchange('commit',id,1,{...result,outputText:'changed'}),/differs/);
 });
 await suite.test('owner cancellation during a claimed effect blocks completion',async()=>{await reset();await enqueue();claim=await exchange('next',null,null);await one('select command_center_pc_cancel_artifact_job($1) value',[id]);await assert.rejects(exchange('commit',id,1,{...result,lease:claim.lease}),/stopped or expired/)});
 await suite.test('expired claimed effects become uncertain and are not automatically retried',async()=>{await reset();await enqueue();await exchange('next',null,null);await db.exec(`update command_center_pc_tool_jobs set lease_expires_at=now()-interval '1 second'`);assert.equal(await exchange('next',null,null),null);assert.equal(await one('select state value from command_center_pc_tool_jobs'),'uncertain');await assert.rejects(exchange('current'),/stopped or expired/)});
 await suite.test('changed Brain version and revoked worker prevent claiming or completing',async()=>{await reset();await enqueue();await db.exec('update command_center_specialist_brains set version=3');await assert.rejects(exchange('next',null,null),/binding changed/);await db.exec('update command_center_specialist_brains set version=2');await exchange('next',null,null);await db.exec('update command_center_pc_worker_registrations set enabled=false');await assert.rejects(exchange('commit',id,1,result),/authorization/)});
 await suite.test('read jobs do not accept write payloads, unsafe names, arbitrary actions, or model account fields',async()=>{
  await reset();for(const name of ['../outside','NUL','con.txt','file.'])await assert.rejects(enqueue({name,content:'x'}),/Exact artifact input/);
  await assert.rejects(enqueue({name:123,content:'x'}),/Exact artifact input/);await assert.rejects(enqueue({name:'valid',content:'x'},'artifact.read'),/Exact artifact input/);await assert.rejects(enqueue({name:'valid'},'shell.run'),/Exact artifact input/);await assert.rejects(enqueue({name:'valid',content:'x',accountRef:'other'}),/Exact artifact input/);
 });
 await suite.test('actual PostgreSQL, transport, file effect, local journal and canonical receipt work together',async()=>{
  await reset();await enqueue();const dir=await mkdtemp(join(tmpdir(),'cc-job-pg-'));
  try{
   await mkdir(join(dir,'artifacts'));await mkdir(join(dir,'journal'));
   const transport=createPcToolJobTransport({workerToken:'ccpc_'+'a'.repeat(64),fetcher:async(url,options)=>{
    assert.equal(options.headers['x-command-center-worker-token'],'ccpc_'+'a'.repeat(64));assert.equal(options.redirect,'error');
    const body=JSON.parse(options.body);assert.equal(body.clientContract,'cc-pc-tools-v1');assert.equal(body.executionAuthorized,true);assert.equal(body.allowPaid,false);assert.equal(body.allowProtected,false);
    const action=url.split('/tool-')[1];return{ok:true,json:async()=>({result:await exchange(action,body.invocationId??null,body.fencingToken??null,body.result??null)})};
   }});
   const claimed=await transport.next(),action=claimed.saved.action;
   const descriptor={key:'owner-pc-artifacts',ownerId:owner,provider:'owner-pc:'+worker,versionRef:'artifact-v1',actionKeys:['artifact.write','artifact.read'],actionEffects:{'artifact.write':'local_write','artifact.read':'private_read'},environment:'local',available:true,cost:'free',authenticationRequired:true,authenticated:true,projectIds:['aro'],companyIds:['company:legacy:aro'],accountRefs:[action.accountRef],evidenceRef:'isolated:actual-handler-root-check',verifiedAt:new Date().toISOString()};
   const lane=await createPcToolExecutionLane({workspace:{root:join(dir,'artifacts'),ownerId:owner,projectId:'aro',companyId:'company:legacy:aro',accountRef:action.accountRef,toolKey:'owner-pc-artifacts',versionRef:'artifact-v1'},journalRoot:join(dir,'journal'),resolve:transport.resolve,catalog:async()=>[descriptor],createLease:transport.createLease,assertCurrent:transport.assertCurrent,commitCanonical:transport.commitCanonical,readCanonical:transport.readCanonical});
   const completed=await lane.execute(id);assert.equal(completed.canonicalCommitVerified,true);assert.equal(await readFile(join(dir,'artifacts','proof.txt'),'utf8'),'actual content');assert.equal(await one('select state value from command_center_pc_tool_jobs'),'completed');
   assert.deepEqual(await lane.execute(id),completed);transport.abandon(id);assert.equal(await transport.next(),null);
   await reset();await enqueue();
   const runner=createPcArtifactJobRunner({workerToken:'ccpc_'+'a'.repeat(64),baseDirectory:join(dir,'managed'),fetcher:async(url,options)=>{
    const body=JSON.parse(options.body);return{ok:true,json:async()=>({result:await exchange(url.split('/tool-')[1],body.invocationId??null,body.fencingToken??null,body.result??null)})};
   }});
   assert.equal((await runner.once()).canonicalCommitVerified,true);assert.equal((await runner.once()).state,'idle');
   const partition=hash(JSON.stringify([owner,'aro','company:legacy:aro']));assert.equal(await readFile(join(dir,'managed',partition,'artifacts','proof.txt'),'utf8'),'actual content');
   runner.stop();assert.deepEqual(await runner.once(),{state:'stopped',executed:false});
  }finally{await rm(dir,{recursive:true,force:true})}
 });
 await suite.test('operator activation check has separate provenance, bounded content and per-Brain idempotency',async()=>{
  await reset();
  const queue=nextId=>one('select command_center_pc_queue_activation_artifact_service($1,$2,$3,$4) value',[owner,worker,'aro',nextId]);
  const first=await queue(id),second=await queue(other);assert.equal(first.invocationId,id);assert.equal(second.invocationId,id);assert.equal(first.admissionAuthority,'delegated-activation-check');
  const claimed=await exchange('next',null,null);assert.equal(claimed.saved.action.authority.reference,'command-center:activation-artifact-check:'+id);
  assert.deepEqual(JSON.parse(claimed.saved.inputText),{name:'activation-check-'+id+'.txt',content:'COMMAND_CENTER_ACTIVATION_CHECK:aro:'+id});
  assert.equal(await one('select client_contract value from command_center_pc_tool_client_status'),'cc-pc-tools-v1');
  await assert.rejects(db.query(`update command_center_pc_tool_jobs set input_text='{"name":"other","content":"not an activation check"}'`),/pc_tool_activation_input/);
  const forged=structuredClone(claimed);forged.saved.inputText='{"name":"other.txt","content":"outside diagnostic contract"}';
  await assert.rejects(createPcToolJobTransport({workerToken:'ccpc_'+'a'.repeat(64),fetcher:async()=>({ok:true,json:async()=>({result:forged})})}).next(),/activation_artifact_scope_invalid/);
  const root=await mkdtemp(join(tmpdir(),'cc-activation-job-'));let delivered=false;
  try{
   const runner=createPcArtifactJobRunner({workerToken:'ccpc_'+'a'.repeat(64),baseDirectory:join(root,'managed'),fetcher:async(url,options)=>{
    const body=JSON.parse(options.body),action=url.split('/tool-')[1];
    if(action==='next'){const result=delivered?null:claimed;delivered=true;return{ok:true,json:async()=>({result})}}
    return{ok:true,json:async()=>({result:await exchange(action,body.invocationId,body.fencingToken,body.result??null)})};
   }});
   const proof=await runner.once();assert.equal(proof.purpose,'activation_artifact_check');assert.equal(proof.canonicalCommitVerified,true);assert.equal(await one('select state value from command_center_pc_tool_jobs'),'completed');
  }finally{await rm(root,{recursive:true,force:true})}
 });
 await suite.test('anonymous/ordinary owner roles cannot invoke operator admission; missing live proof blocks the operator',async()=>{
  await reset();await db.exec('set role authenticated');await assert.rejects(one('select command_center_pc_queue_activation_artifact_service($1,$2,$3,$4) value',[owner,worker,'aro',id]),/permission denied/);await db.exec('reset role');
  await db.exec('update command_center_pc_inference_requests set state=\'failed\'');await assert.rejects(one('select command_center_pc_queue_activation_artifact_service($1,$2,$3,$4) value',[owner,worker,'aro',id]),/live specialist inference proof/);
 });
 }finally{await db.close()}
});
