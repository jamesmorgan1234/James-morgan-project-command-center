import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
// Isolated replay of recovered LIVE RPC definitions, not production auth evidence.
const sql=readFileSync(new URL('../evidence/brain-activation/deployed-pc-rpc-definitions.sql',import.meta.url),'utf8');
const u='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',w='00000000-0000-4000-8000-000000000003',c='00000000-0000-4000-8000-000000000004',t='00000000-0000-4000-8000-000000000005',q='00000000-0000-4000-8000-000000000006';
test('deployed PC worker RPCs execute against isolated PostgreSQL',async suite=>{
 const db=new PGlite();
 const scalar=async(text)=>Object.values((await db.query(text)).rows[0])[0];
 try{
 await db.exec(`create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('fixture.owner',true),'')::uuid$$;create function public.is_command_center_authorized() returns boolean language sql as $$select coalesce(current_setting('fixture.authorized',true),'true')='true'$$;
 create table command_center_members(user_id uuid primary key,access_status text,revoked_at timestamptz);
 create table command_center_pc_worker_registrations(worker_id uuid primary key,owner_id uuid,enabled boolean,revoked_at timestamptz,last_seen_at timestamptz,label text,created_at timestamptz default now());
 create table command_center_brain_conversations(owner_id uuid,conversation_id uuid primary key,project_id text,state text,updated_at timestamptz default now());
 create table command_center_brain_conversation_turns(owner_id uuid,turn_id uuid primary key default gen_random_uuid(),conversation_id uuid,project_id text,role text,intent text,protected_action_possible boolean,redaction_state text,safe_text text,content_ref text,content_hash text,evidence_refs text[],canonical_writes_authorized boolean,created_at timestamptz default now());
 create table command_center_pc_inference_requests(request_id uuid primary key,owner_id uuid,project_id text,conversation_id uuid,owner_turn_id uuid,state text default 'queued',attempts int default 0,worker_id uuid,fencing_token bigint default 0,lease_expires_at timestamptz,brain_turn_id uuid,model_id text,content_hash text,error_code text,created_at timestamptz default now(),updated_at timestamptz default now(),completed_at timestamptz,unique(owner_id,owner_turn_id));
 create table command_center_specialist_brains(owner_id uuid,project_id text,brain_key text,enabled boolean,health text,verification_state text,lifecycle text,cost_class text,control_plane text,supported_project_ids text[],supported_company_ids text[],provider_keys text[]);
 create table command_center_provider_registry(owner_id uuid,provider_key text,enabled boolean,health text,verification text,cost text,capabilities text[],scopes text[],configuration jsonb);
 insert into command_center_members values('${u}','active',null);
 insert into command_center_pc_worker_registrations(worker_id,owner_id,enabled) values('${w}','${u}',true);
 insert into command_center_brain_conversations(owner_id,conversation_id,state) values('${u}','${c}','active');
 insert into command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,role,redaction_state,safe_text,content_hash) values('${u}','${t}','${c}','owner','safe_text','What is 19 plus 23?',encode(sha256(convert_to('What is 19 plus 23?','UTF8')),'hex'));
 set fixture.owner='${u}';`);
 await db.exec(sql);
 const enqueue=()=>db.query(`select command_center_pc_enqueue_inference('${q}','${c}','${t}',null)`);
 const claim=()=>scalar(`select command_center_pc_claim_service('${u}','${w}')`);
 const complete=(fence=1,owner=u)=>db.query(`select command_center_pc_complete_service('${owner}','${w}','${q}',${fence},'qwen3:4b-instruct','42')`);
 const reset=()=>db.exec(`delete from command_center_pc_inference_requests;delete from command_center_brain_conversation_turns where role='brain';update command_center_members set access_status='active',revoked_at=null;update command_center_pc_worker_registrations set enabled=true,revoked_at=null;update command_center_brain_conversations set state='active';set fixture.owner='${u}';set fixture.authorized='true';`);
 await suite.test('enqueue idempotency and exclusivity preserve one request and one live claimant',async()=>{await enqueue();await enqueue();assert.equal(await scalar('select count(*)::int from command_center_pc_inference_requests'),1);assert.equal((await claim()).fencingToken,1);assert.equal(await claim(),null);await assert.rejects(db.query(`select command_center_pc_enqueue_inference('${w}','${c}','${t}',null)`),/original request identity/)});
 await suite.test('completed response is persisted with exact response links and actual SHA256',async()=>{await complete();assert.equal(await scalar(`select state from command_center_pc_inference_requests`),'completed');assert.equal(await scalar(`select content_hash=encode(sha256(convert_to('42','UTF8')),'hex') from command_center_pc_inference_requests`),true);assert.equal(await scalar(`select canonical_writes_authorized from command_center_brain_conversation_turns where role='brain'`),false);await assert.rejects(complete(),/Stale, expired/)});
 await suite.test('cancelled request cannot accept an in-flight completion',async()=>{await reset();await enqueue();await claim();await db.query(`select command_center_pc_cancel_inference('${q}')`);await assert.rejects(complete(),/Stale, expired/)});
 await suite.test('expired lease must reclaim with a new fence before committing',async()=>{await reset();await enqueue();await claim();await db.exec(`update command_center_pc_inference_requests set lease_expires_at=now()-interval '1 second'`);await assert.rejects(complete(),/Stale, expired/);assert.equal((await claim()).fencingToken,2);await assert.rejects(complete(),/Stale, expired/);await complete(2)});
 await suite.test('worker revoke, owner revoke, closed conversation, and cross owner commits are rejected',async()=>{
 for(const mutation of [`update command_center_pc_worker_registrations set enabled=false`,`update command_center_members set access_status='revoked'`,`update command_center_brain_conversations set state='closed'`]){await reset();await enqueue();await claim();await db.exec(mutation);await assert.rejects(complete());}
 await reset();await enqueue();await claim();await assert.rejects(complete(1,other),/Stale, expired/);
 });
 await suite.test('owner-only enqueue rejects unauthenticated and unauthorized fixtures',async()=>{await reset();await db.exec(`set fixture.owner=''`);await assert.rejects(enqueue(),/Owner authorization/);await db.exec(`set fixture.owner='${u}';set fixture.authorized='false'`);await assert.rejects(enqueue(),/Owner authorization/)});
 await suite.test('legacy project routing is genuinely absent in deployed owner RPC',async()=>{await reset();await assert.rejects(db.query(`select command_center_pc_enqueue_inference('${q}','${c}','${t}','aro')`),/Company project outside/)});
 await suite.test('cloud models cannot be committed',async()=>{await reset();await enqueue();await claim();await assert.rejects(db.query(`select command_center_pc_complete_service('${u}','${w}','${q}',1,'qwen:cloud','42')`),/prohibited/)});
 }finally{await db.close()}
});
