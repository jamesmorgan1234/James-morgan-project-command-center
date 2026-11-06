import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildActivationContext} from '../../supabase/functions/command-center-pc-worker/activation-context.mjs';
import {validateActivationProbe} from '../src/brain/pc-activation-contract.mjs';
import {createOwnerPcInferenceWorker} from '../src/brain/pc-owner-inference-worker.mjs';
import {createPcLocalOllama} from '../src/brain/pc-local-ollama.mjs';
import {PGlite} from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111',worker='22222222-2222-4222-8222-222222222222';
const centralRequest='33333333-3333-4333-8333-333333333333',centralTurn='44444444-4444-4444-8444-444444444444';
const conversation='55555555-5555-4555-8555-555555555555',systemTurn='66666666-6666-4666-8666-666666666666';
const checkpoint='77777777-7777-4777-8777-777777777777',centralConversation='88888888-8888-4888-8888-888888888888';
const provider='provider:owner-pc:'+worker,project='aro',company='company:legacy:aro',brain='brain:'+company+':v1';
const authority='evd_owner-command-center-brain-activation-20261105',model='qwen3:4b-instruct';
const liveSql=readFileSync(new URL('../evidence/brain-activation/deployed-pc-rpc-definitions.sql',import.meta.url),'utf8');
const unifiedSql=readFileSync(new URL('../evidence/CC_UNIFIED_128_PC_READONLY_ROUTING_CANDIDATE.sql',import.meta.url),'utf8');
const candidate=readFileSync(new URL('../evidence/brain-activation/sql/pc-activation-probe-candidate.sql',import.meta.url),'utf8');
async function database(){
 const db=new PGlite();
 await db.exec(`create schema auth;create role anon;create role authenticated;create role service_role;
 create function auth.uid() returns uuid language sql as $$select '${owner}'::uuid$$;
 create function public.is_command_center_authorized() returns boolean language sql as $$select true$$;
 create table command_center_members(user_id uuid primary key,access_status text not null,revoked_at timestamptz);
 create table command_center_pc_worker_registrations(worker_id uuid primary key,owner_id uuid,enabled boolean,revoked_at timestamptz,last_seen_at timestamptz,label text,created_at timestamptz default now());
 create table command_center_project_profiles(owner_id uuid,project_id text,company_id text,version bigint,mission text,protected boolean,primary key(owner_id,project_id));
 create table command_center_specialist_brains(owner_id uuid,project_id text,brain_key text,specialist_id text,version bigint,scope text,enabled boolean,health text,verification_state text,lifecycle text,cost_class text,control_plane text,supported_project_ids text[],supported_company_ids text[],provider_keys text[],permission_keys text[],model_assignments jsonb,updated_at timestamptz default now(),primary key(owner_id,brain_key));
 create table command_center_specialist_brain_versions(owner_id uuid,specialist_id text,version bigint,snapshot jsonb,authority_evidence_ids text[]);
 create table command_center_provider_registry(owner_id uuid,provider_key text,version bigint,enabled boolean,health text,verification text,cost text,scopes text[],capabilities text[],configuration jsonb,updated_at timestamptz default now());
 create table command_center_brain_conversations(owner_id uuid,conversation_id uuid primary key,project_id text,state text,title text,updated_at timestamptz default now());
 create table command_center_brain_conversation_turns(owner_id uuid,turn_id uuid primary key default gen_random_uuid(),conversation_id uuid,project_id text,role text,intent text,protected_action_possible boolean,redaction_state text,safe_text text,content_ref text,content_hash text,evidence_refs text[],canonical_writes_authorized boolean,created_at timestamptz not null);
 create table command_center_pc_inference_requests(request_id uuid primary key,owner_id uuid,project_id text,conversation_id uuid,owner_turn_id uuid,state text default 'queued',attempts int default 0,worker_id uuid,fencing_token bigint default 0,lease_expires_at timestamptz,brain_turn_id uuid,model_id text,content_hash text,error_code text,created_at timestamptz default now(),updated_at timestamptz default now(),completed_at timestamptz,unique(owner_id,owner_turn_id),constraint cc_pc_scope check(project_id is null or project_id ~ '^project:company:future:[0-9]{3}$'));
 create table command_center_brain_project_workspaces(owner_id uuid,project_id text,version bigint,spec_version bigint,conversation_id uuid,turn_ids uuid[],decision_refs text[],execution_run_id text,blocker_refs text[],evidence_refs text[],verified_result_refs text[],recorded_at timestamptz default now(),updated_at timestamptz default now(),primary key(owner_id,project_id),check(updated_at<=recorded_at+interval '5 minutes'));
 create table command_center_brain_project_workspace_versions(owner_id uuid,project_id text,version bigint,spec_version bigint,conversation_id uuid,turn_ids uuid[],decision_refs text[],execution_run_id text,blocker_refs text[],evidence_refs text[],verified_result_refs text[],updated_at timestamptz,primary key(owner_id,project_id,version));
 create table command_center_project_roadmaps(owner_id uuid,project_id text,version bigint,state text,structure_verified boolean);create table command_center_project_checkpoints(owner_id uuid,project_id text,roadmap_version bigint,checkpoint_id uuid,created_at timestamptz default now());
 create table command_center_agency_runs(run_id text primary key,state text);
 insert into command_center_agency_runs values('preserved-stopped','stopped');
 create function immutable_turn() returns trigger language plpgsql as $$begin raise exception 'conversation turns immutable';end$$;
 create trigger immutable_turn before update or delete on command_center_brain_conversation_turns for each row execute function immutable_turn();
 `);
 await db.exec(liveSql);await db.exec(unifiedSql);
 // Match independently inspected LIVE service_role table privileges: workspace
 // tables grant no direct access; row-lock checks also require owner privileges.
 await db.exec(`grant select on command_center_members,command_center_pc_worker_registrations,command_center_project_profiles,command_center_specialist_brains,command_center_specialist_brain_versions,command_center_provider_registry,command_center_brain_conversations,command_center_brain_conversation_turns,command_center_pc_inference_requests,command_center_project_roadmaps,command_center_project_checkpoints to service_role;
 grant insert on command_center_specialist_brains,command_center_specialist_brain_versions,command_center_brain_conversation_turns,command_center_pc_inference_requests to service_role;
 grant update on command_center_specialist_brains,command_center_brain_conversations,command_center_pc_inference_requests,command_center_pc_worker_registrations to service_role;`);
 await db.exec(candidate);
 await db.query(`insert into command_center_members values($1,'active',null);`,[owner]);
 await db.query(`insert into command_center_pc_worker_registrations(worker_id,owner_id,enabled,revoked_at,last_seen_at) values($1,$2,true,null,now())`,[worker,owner]);
 await db.query(`insert into command_center_project_profiles values($1,$2,$3,1,'Existing project mission',true)`,[owner,project,company]);
 await db.query(`insert into command_center_specialist_brains(owner_id,project_id,brain_key,specialist_id,version,scope,enabled,health,verification_state,lifecycle,cost_class,control_plane,supported_project_ids,supported_company_ids,provider_keys,permission_keys,model_assignments) values($1,$2,$3,'brn-existing',2,'project',false,'unavailable','experimental','suspended','free','command_center',array[$2],array[$4],array[$5],array['project:'||$2||':context.read','project:'||$2||':inference.read_only'],$6::jsonb)`,[owner,project,brain,company,provider,JSON.stringify([{providerKey:provider,modelId:model,versionRef:provider+'@1/model-tag:'+model}])]);
 await db.query(`insert into command_center_specialist_brain_versions values($1,'brn-existing',2,'{}',array[$2])`,[owner,authority]);
 const config={worker_id:worker,gateway_ref:'supabase:functions:command-center-pc-worker',execution_mode:'local-ollama',payment_authorized:false,company_build_authorized:false,model_id:model,live_response_evidence:centralRequest};
 await db.query(`insert into command_center_provider_registry(owner_id,provider_key,version,enabled,health,verification,cost,scopes,capabilities,configuration) values($1,$2,1,true,'available','live_verified','free',array['owner-local-inference','owner-central-brain'],array['brain.respond.read_only'],$3::jsonb)`,[owner,provider,JSON.stringify(config)]);
 await db.query(`insert into command_center_brain_conversations(owner_id,conversation_id,project_id,state) values($1,$2,$3,'active'),($1,$4,null,'active')`,[owner,conversation,project,centralConversation]);
 const packet=JSON.stringify({modelAssignments:[{providerKey:provider,modelId:model,versionRef:provider+'@1/model-tag:'+model}],projectId:project,companyId:company,brainKey:brain,brainVersion:2,roadmapVersion:1,checkpointId:checkpoint});
 await db.query(`insert into command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,project_id,role,redaction_state,safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at) values($1,$2,$3,$4,'system','safe_text',$5,'brain:activation-context:'||$4,encode(sha256(convert_to($5,'UTF8')),'hex'),'{}',false,now())`,[owner,systemTurn,conversation,project,packet]);
 await db.query(`insert into command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,project_id,role,redaction_state,safe_text,content_hash,evidence_refs,canonical_writes_authorized,created_at) values($1,$2,$3,null,'brain','safe_text','42',encode(sha256(convert_to('42','UTF8')),'hex'),array[$4,$5,$6],false,now())`,[owner,centralTurn,centralConversation,'brain:workstation-claim:'+centralRequest,'brain:pc-worker:'+worker,'brain:model:'+model]);
 await db.query(`insert into command_center_pc_inference_requests(request_id,owner_id,project_id,conversation_id,owner_turn_id,state,worker_id,brain_turn_id,model_id,content_hash) values($1,$2,null,$3,gen_random_uuid(),'completed',$4,$5,$6,encode(sha256(convert_to('42','UTF8')),'hex'))`,[centralRequest,owner,centralConversation,worker,centralTurn,model]);
 await db.query(`insert into command_center_project_roadmaps values($1,$2,1,'current',true)`,[owner,project]);
 await db.query(`insert into command_center_project_checkpoints(owner_id,project_id,roadmap_version,checkpoint_id) values($1,$2,1,$3)`,[owner,project,checkpoint]);
 await db.query(`insert into command_center_brain_project_workspaces(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs) values($1,$2,2,1,$3,array[$4::uuid],array['preserved-decision'],null,array['full-execution-unverified'],array['preserved-source'],'{}')`,[owner,project,conversation,systemTurn]);
 return db;
}
test('bounded activation SQL executes real PostgreSQL state transitions without enabling Brains or business runs',async suite=>{
 const db=await database();
 const scalar=async(q,args=[])=>{
  const workerCall=/^select command_center_pc_/.test(q);
  if(workerCall)await db.exec('set role service_role');
  try{return Object.values((await db.query(q,args)).rows[0])[0]}
  finally{if(workerCall){try{await db.exec('reset role')}catch{ /* caller rolls back its failed savepoint */ }}}
 };
 const seed=()=>scalar('select command_center_pc_seed_activation_probe_service($1,$2,$3,2,1,$4)',[owner,worker,project,authority]);
 const claim=(client='cc-pc-inference-activation-v1')=>scalar('select command_center_pc_claim_v4_service($1,$2,$3)',[owner,worker,client]);
 const complete=(task,text,digest='a'.repeat(64))=>scalar('select command_center_pc_complete_v4_service($1,$2,$3,$4,$5,$6,$7)',[owner,worker,task.requestId,task.fencingToken,model,digest,text]);
 const expected=task=>JSON.stringify({projectId:project,companyId:company,brainKey:brain,brainVersion:2,roadmapVersion:1,checkpointId:checkpoint,nonce:task.requestId,companyBuildStarted:false,paidUsageAuthorized:false});
 try{
  await suite.test('public and authenticated callers cannot seed or claim diagnostics',async()=>{
   for(const role of ['anon','authenticated']){
    assert.equal(await scalar("select has_function_privilege($1,'command_center_pc_seed_activation_probe_service(uuid,uuid,text,bigint,bigint,text)','execute')",[role]),false);
    assert.equal(await scalar("select has_function_privilege($1,'command_center_pc_claim_v4_service(uuid,uuid,text)','execute')",[role]),false);
   }
   assert.equal(await scalar("select has_function_privilege('service_role','command_center_pc_seed_activation_probe_service(uuid,uuid,text,bigint,bigint,text)','execute')"),true);
  });
  await suite.test('service invokes bounded private operations without gaining raw workspace or identity-table authority',async()=>{
   for(const role of ['anon','authenticated'])assert.equal(await scalar("select has_schema_privilege($1,'command_center_pc_private','USAGE')",[role]),false);
   assert.equal(await scalar("select has_table_privilege('service_role','command_center_brain_project_workspaces','SELECT')"),false);
   assert.equal(await scalar("select has_table_privilege('service_role','command_center_brain_project_workspace_versions','INSERT')"),false);
   assert.equal(await scalar("select has_table_privilege('service_role','command_center_members','UPDATE')"),false);
   const functions=(await db.query("select n.nspname,p.proname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='command_center_pc_activation_snapshot_service'")).rows;
   assert.equal(functions.find(f=>f.nspname==='public').prosecdef,false);
   assert.equal(functions.find(f=>f.nspname==='command_center_pc_private').prosecdef,true);
  });
  await suite.test('seed is idempotent, exact and available while real specialist remains suspended',async()=>{
   const first=await seed(),again=await seed();assert.equal(first.state,'queued');assert.equal(again.requestId,first.requestId);assert.equal(again.duplicate,true);
   assert.equal(Number(await scalar('select count(*) from command_center_pc_inference_requests where activation_contract is not null')),1);
   assert.equal(await scalar('select enabled from command_center_specialist_brains'),false);
   assert.equal(await claim(null),null,'old client never receives a probe');
  });
  const task=await claim();assert.equal(task.purpose,'activation_probe');assert.equal(task.projectId,project);
  const context=await buildActivationContext({task,snapshot:JSON.parse(task.activationContractText).routeSnapshot,ownerId:owner,workerId:worker});
  assert.equal(context.specialistEnabled,false);assert.equal(context.specialistLiveVerified,false);
  await validateActivationProbe(task,context);
  const row=await scalar('select activation_contract from command_center_pc_inference_requests where request_id=$1',[task.requestId]);
  assert.equal(row.companyBuildAuthorized,false);assert.equal(row.toolExecutionAuthorized,false);
  await suite.test('immutable diagnostic question records delegated test provenance instead of fabricating literal user input',async()=>{
   const refs=await scalar('select evidence_refs from command_center_brain_conversation_turns where turn_id=$1',[task.ownerTurnId]);
   assert.ok(refs.includes(authority));assert.ok(refs.includes('brain:diagnostic-question:system-generated-under-owner-task'));
   assert.equal(await scalar('select state from command_center_agency_runs'),'stopped');
  });
  const mutations=[
   ['worker revoked',"update command_center_pc_worker_registrations set revoked_at=now()"],
   ['owner revoked',"update command_center_members set access_status='revoked'"],
   ['provider health unknown',"update command_center_provider_registry set health=null"],
   ['permissions unknown',"update command_center_specialist_brains set permission_keys=null"],
   ['lease missing',"update command_center_pc_inference_requests set lease_expires_at=null where activation_contract is not null"],
   ['provider disabled',"update command_center_provider_registry set enabled=false"],
   ['provider paid',"update command_center_provider_registry set cost='paid'"],
   ['provider changed',"update command_center_provider_registry set version=2"],
   ['Brain retired',"update command_center_specialist_brains set lifecycle='retired'"],
   ['permissions revoked',"update command_center_specialist_brains set permission_keys='{}'"],
   ['Brain changed',"update command_center_specialist_brains set version=3"],
   ['company isolation changed',"update command_center_project_profiles set company_id='company:legacy:another'"],
   ['workspace changed',"update command_center_brain_project_workspaces set version=3"],
   ['checkpoint changed',"update command_center_project_checkpoints set checkpoint_id=gen_random_uuid()"],
   ['conversation stopped',"update command_center_brain_conversations set state='archived'"],
   ['request cancelled',"update command_center_pc_inference_requests set state='cancelled' where activation_contract is not null"],
   ['fence stolen',"update command_center_pc_inference_requests set fencing_token=fencing_token+1 where activation_contract is not null"],
   ['lease expired',"update command_center_pc_inference_requests set lease_expires_at=now()-interval '1 second' where activation_contract is not null"]
  ];
  for(const [name,mutation] of mutations)await suite.test(name+' prevents both lease renewal and completed evidence',async()=>{
   await db.exec('begin');try{
    await db.exec(mutation);
    await db.exec('savepoint before_failure');
    await assert.rejects(scalar('select command_center_pc_heartbeat_v4_service($1,$2,$3,$4)',[owner,worker,task.requestId,task.fencingToken]));
    await db.exec('rollback to before_failure');
    await assert.rejects(complete(task,expected(task)));
   }finally{await db.exec('rollback')}
  });
  await suite.test('a missing fence cannot renew or complete a diagnostic',async()=>{
   await assert.rejects(scalar('select command_center_pc_heartbeat_v4_service($1,$2,$3,null)',[owner,worker,task.requestId]));
   await assert.rejects(complete({...task,fencingToken:null},expected(task)));
  });
  await suite.test('wrong context response or unmeasured model cannot complete a diagnostic',async()=>{
   for(const [text,digest] of [['{}','a'.repeat(64)],[expected(task),null]]){
    await assert.rejects(complete(task,text,digest));
    assert.equal(await scalar('select state from command_center_pc_inference_requests where request_id=$1',[task.requestId]),'claimed');
   }
  });
  await suite.test('isolated model/client/gateway/SQL path persists exact diagnostic evidence without full activation',async()=>{
   const isolatedModel=createPcLocalOllama({modelId:model,fetcher:async(url,init)=>({ok:true,json:async()=>{
    if(url.endsWith('/api/tags'))return {models:[{name:model,details:{family:'qwen'},digest:'a'.repeat(64)}]};
    assert.equal(JSON.parse(init.body).format,'json');
    return {model,done:true,message:{content:expected(task)}};
   }})});
   let receipt;
   const client=createOwnerPcInferenceWorker({claim:async()=>task,context:async()=>context,model:isolatedModel,
    persist:async data=>{assert.equal(data.executionVerified,false);receipt=await complete(task,data.text,data.modelDigest);return receipt},
    readBack:async()=>{
     const proof=await scalar('select command_center_pc_activation_contract_service($1,$2,$3,$4)',[owner,worker,task.requestId,task.fencingToken]);
     const turn=(await db.query('select * from command_center_brain_conversation_turns where turn_id=$1',[receipt.brainTurnId])).rows[0];
     return {...proof,requestId:task.requestId,projectId:project,brainTurnId:turn.turn_id,text:turn.safe_text,role:turn.role,canonicalWritesAuthorized:turn.canonical_writes_authorized,evidenceVerified:true};
    }});
   const verified=await client.processOne();assert.equal(verified.actualInferenceVerified,true);assert.equal(verified.projectExecutionVerified,false);
   assert.equal(receipt.diagnosticOnly,true);assert.equal(receipt.modelDigest,'a'.repeat(64));
   assert.equal(await scalar('select state from command_center_pc_inference_requests where request_id=$1',[task.requestId]),'completed');
   assert.equal(await scalar('select version from command_center_brain_project_workspaces'),3);
   assert.deepEqual(await scalar('select decision_refs from command_center_brain_project_workspaces'),['preserved-decision']);
   assert.deepEqual(await scalar('select blocker_refs from command_center_brain_project_workspaces'),['full-execution-unverified']);
   assert.equal(await scalar('select execution_run_id from command_center_brain_project_workspaces'),null);
   assert.equal(await scalar('select enabled from command_center_specialist_brains'),false);
   assert.equal(await scalar('select state from command_center_agency_runs'),'stopped');
   const replay=await seed();assert.equal(replay.state,'completed');assert.equal(replay.requestId,task.requestId);assert.equal(replay.duplicate,true);
   assert.equal(await claim(),null);
  });
  await suite.test('rollback cancels only pending diagnostics and preserves all completed proof and stopped runs',async()=>{
   const rollback=readFileSync(new URL('../evidence/brain-activation/sql/pc-activation-probe-rollback-candidate.sql',import.meta.url),'utf8');
   const doneBefore=Number(await scalar("select count(*) from command_center_pc_inference_requests where state='completed'"));
   await db.query(`insert into command_center_pc_inference_requests(request_id,owner_id,project_id,conversation_id,owner_turn_id,activation_contract,route_snapshot)
    select $1::uuid,owner_id,project_id,conversation_id,$2::uuid,
    activation_contract||jsonb_build_object('requestId',$1::text,'ownerTurnId',$2::text,'routeSnapshot',route_snapshot||jsonb_build_object('brainVersion',3)),
    route_snapshot||jsonb_build_object('brainVersion',3) from command_center_pc_inference_requests where activation_contract is not null limit 1`,
    ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2']);
   await db.exec(rollback);
   assert.equal(Number(await scalar("select count(*) from command_center_pc_inference_requests where state='completed'")),doneBefore);
   assert.equal(Number(await scalar("select count(*) from command_center_pc_inference_requests where error_code='activation_diagnostic_rollback' and state='cancelled'")),1);
   await assert.rejects(seed(),/disabled by rollback/);
   assert.equal(await scalar("select has_function_privilege('service_role','command_center_pc_private.command_center_pc_seed_activation_probe_service(uuid,uuid,text,bigint,bigint,text)','EXECUTE')"),false);
   assert.equal(await scalar("select has_function_privilege('service_role','command_center_pc_private.command_center_pc_claim_v4_service(uuid,uuid,text)','EXECUTE')"),false);
   assert.equal(await claim(),null);
   assert.equal(await scalar('select state from command_center_agency_runs'),'stopped');
  });
 }finally{await db.close()}
});
