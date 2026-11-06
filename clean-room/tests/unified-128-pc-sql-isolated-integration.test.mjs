import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";

const candidate=readFileSync(new URL("../evidence/CC_UNIFIED_128_PC_READONLY_ROUTING_CANDIDATE.sql",import.meta.url),"utf8");
const owner="11111111-1111-4111-8111-111111111111";
const worker="22222222-2222-4222-8222-222222222222";
const provider="provider:owner-pc:"+worker;
const hash="a".repeat(64);
const ids={
 lc:"33333333-3333-4333-8333-333333333333",
 lt:"44444444-4444-4444-8444-444444444444",
 fc:"55555555-5555-4555-8555-555555555555",
 ft:"66666666-6666-4666-8666-666666666666",
 lr:"77777777-7777-4777-8777-777777777777",
 fr:"88888888-8888-4888-8888-888888888888",
 wrong:"99999999-9999-4999-8999-999999999999"
};
const json=v=>typeof v==="string"?JSON.parse(v):v;

test("real candidate SQL runs in disposable PGlite, enqueues both scopes, denies escalation and returns read-only claims",async()=>{
 const db=new PGlite();
 try {
  const schema=[
   "create schema if not exists auth;",
   "create or replace function auth.uid() returns uuid language sql stable as $$ select '"+owner+"'::uuid $$;",
   "create or replace function public.is_command_center_authorized() returns boolean language sql stable as $$ select true $$;",
   "create table public.command_center_project_profiles(owner_id uuid,project_id text,company_id text,protected boolean,primary key(owner_id,project_id));",
   "create table public.command_center_specialist_brains(owner_id uuid,project_id text,brain_key text,enabled boolean default false,health text default 'unavailable',verification_state text default 'experimental',lifecycle text default 'suspended',cost_class text default 'free',control_plane text default 'command_center',provider_keys text[] default '{}',supported_project_ids text[] default '{}',supported_company_ids text[] default '{}');",
   "create table public.command_center_provider_registry(owner_id uuid,provider_key text,enabled boolean,health text,verification text,cost text,capabilities text[],scopes text[],configuration jsonb);",
   "create table public.command_center_brain_conversations(owner_id uuid,conversation_id uuid primary key,project_id text,state text);",
   "create table public.command_center_brain_conversation_turns(owner_id uuid,conversation_id uuid,turn_id uuid primary key,project_id text,role text,redaction_state text,safe_text text,content_hash text);",
   "create table public.command_center_pc_inference_requests(request_id uuid primary key,owner_id uuid,project_id text,conversation_id uuid,owner_turn_id uuid,state text default 'queued',worker_id uuid,attempts int default 0,fencing_token int default 0,lease_expires_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now(),error_code text,constraint cc_pc_scope check (project_id is null or (project_id ~ '^project:company:future:[0-9]{3}$' and substring(project_id from 24 for 3)::integer between 1 and 117)),unique(owner_id,owner_turn_id));",
   "create table public.command_center_pc_worker_registrations(owner_id uuid,worker_id uuid,enabled boolean,revoked_at timestamptz,last_seen_at timestamptz);",
   "create table public.command_center_members(user_id uuid,access_status text,revoked_at timestamptz);"
  ].join("\n");
  await db.exec(schema);
  // Both PL/pgSQL functions and the CHECK migration must compile with real PostgreSQL semantics.
  await db.exec(candidate);
  const funcs=await db.query("select proname from pg_proc where proname in ('command_center_pc_enqueue_inference','command_center_pc_claim_service')");
  assert.equal(funcs.rows.length,2);

  await db.query("insert into public.command_center_project_profiles values ($1,'margincrafttools','company:legacy:margincrafttools',true),($1,'project:company:future:001','company:future:001',false)",[owner]);
  await db.query("insert into public.command_center_specialist_brains(owner_id,project_id,brain_key,provider_keys,supported_project_ids,supported_company_ids) values ($1,'margincrafttools','brain:company:legacy:margincrafttools:v1',array[$2],array['margincrafttools'],array['company:legacy:margincrafttools']),($1,'project:company:future:001','brain:company:future:001:v1',array[$2],array['project:company:future:001'],array['company:future:001'])",[owner,provider]);
  await db.query("insert into public.command_center_provider_registry values ($1,$2,true,'available','live_verified','free',array['brain.respond.read_only'],array['owner-central-brain','owner-local-inference'],jsonb_build_object('worker_id',$3::text))",[owner,provider,worker]);
  await db.query("insert into public.command_center_pc_worker_registrations values ($1,$2,true,null,null)",[owner,worker]);
  await db.query("insert into public.command_center_members values ($1,'active',null)",[owner]);
  await db.query("insert into public.command_center_brain_conversations values ($1,$2,'margincrafttools','active'),($1,$3,'project:company:future:001','active')",[owner,ids.lc,ids.fc]);
  await db.query("insert into public.command_center_brain_conversation_turns values ($1,$2,$3,'margincrafttools','owner','safe_text','Read only legacy analysis',$6),($1,$4,$5,'project:company:future:001','owner','safe_text','Read only future analysis',$6)",[owner,ids.lc,ids.lt,ids.fc,ids.ft,hash]);
  const queue=async(req,conv,turn,scope)=>json((await db.query("select public.command_center_pc_enqueue_inference($1::uuid,$2::uuid,$3::uuid,$4::text) as receipt",[req,conv,turn,scope])).rows[0].receipt);
  const claim=async()=>json((await db.query("select public.command_center_pc_claim_service($1::uuid,$2::uuid) as task",[owner,worker])).rows[0].task);
  await assert.rejects(queue(ids.wrong,ids.lc,ids.lt,"unknown-project"),/outside registered scope/i);
  await assert.rejects(queue(ids.wrong,ids.lc,ids.lt,"project:company:future:118"),/outside registered scope/i);
  await assert.rejects(queue(ids.wrong,ids.lc,ids.lt,"project:legacy:aro"),/outside registered scope/i);
  await assert.rejects(queue(ids.wrong,ids.fc,ids.ft,"margincrafttools"),/conversation scope mismatch/i);
  assert.equal((await queue(ids.lr,ids.lc,ids.lt,"margincrafttools")).state,"queued");
  assert.equal((await queue(ids.fr,ids.fc,ids.ft,"project:company:future:001")).state,"queued");
  assert.equal((await queue(ids.lr,ids.lc,ids.lt,"margincrafttools")).request_id,ids.lr);
  await assert.rejects(queue(ids.wrong,ids.lc,ids.lt,"margincrafttools"),/Duplicate owner turn requires original request identity/i);
  assert.equal((await db.query("select count(*)::int as n from public.command_center_pc_inference_requests")).rows[0].n,2);
  assert.equal(await claim(),null,"provider mapping never enables a disabled specialist");
  await db.query("update public.command_center_provider_registry set scopes=array['company-brain-read-only','owner-central-brain']");
  assert.equal(await claim(),null,"company provider scope alone cannot activate a disabled specialist");
  // Enable ONLY one synthetic test specialist in the disposable database.
  await db.query("update public.command_center_specialist_brains set enabled=true,health='healthy',verification_state='verified',lifecycle='active' where project_id='margincrafttools'");
  const receipt=await claim();
  assert.equal(receipt.projectId,"margincrafttools");
  assert.equal(receipt.ownerText,"Read only legacy analysis");
  for(const key of ["allowPaid","allowProtected","writesAuthorized","scheduleAuthorized","executionAuthorized"]) assert.equal(receipt[key],false,key);
  assert.equal(receipt.action,"brain.respond.read_only");
  assert.equal(receipt.workerId,worker);
  assert.equal(await claim(),null,"the other unverified company stays queued");
  assert.equal((await db.query("select count(*)::int as n from public.command_center_pc_inference_requests where state='claimed'")).rows[0].n,1);
 } finally {await db.close();}
});
