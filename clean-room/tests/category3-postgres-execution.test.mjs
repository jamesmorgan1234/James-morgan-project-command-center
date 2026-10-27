import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {stageChatExport} from '../dist/data/index.js';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

// Isolated PostgreSQL execution. Auth functions below are explicit fixtures,
// not a substitute for Category 2's production authentication acceptance.
test('Category 3 executes canonical migrations and RPC contracts in isolated PostgreSQL',async(t)=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try {
 await db.exec(`create role anon;create role authenticated;create schema auth;grant usage on schema auth to authenticated;create schema extensions;create schema command_center_private;create extension pgcrypto with schema extensions;create table auth.users(id uuid primary key);insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');create table public.projects(id text primary key,owner_id uuid not null references auth.users(id));insert into public.projects values('project','00000000-0000-0000-0000-000000000001');create function auth.uid() returns uuid language sql as $$select coalesce(nullif(current_setting('fixture.owner',true),''),'00000000-0000-0000-0000-000000000001')::uuid$$;create function public.is_command_center_authorized() returns boolean language sql as $$select coalesce(current_setting('fixture.authorized',true),'true')='true'$$;`);
 for(const name of ['20261024112000_category3_canonical_platform.sql','20261024113000_category3_sync_reconciliation.sql','20261024113500_category3_import_policy_extension.sql','20261024114000_category3_knowledge_provenance_invariant.sql','20261024115000_category3_portability_batches.sql','20261024120000_category3_historical_export_staging.sql','20261024121000_category3_context_artifact_exchange.sql','20261024122000_category3_protocol_adapter_registry.sql','20261024123000_category3_recovery_scale_evidence.sql','20261027174500_category3_declared_schema_compatibility.sql']) await db.exec(readFileSync(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'));

 // Scoped single-use action authorization fixture: exercises import transaction
 // integration without claiming to replace the separately tested C2 authority.
 await db.exec(`create table command_center_private.fixture_grants(id uuid primary key,owner_id uuid,action text,resource text);
 create function command_center_private.consume_action_authorization(u uuid,a uuid,k text,r text,i text) returns void language plpgsql as $$begin
 if r<>'import_batch' then raise exception 'Fixture resource mismatch';end if;
 delete from command_center_private.fixture_grants where id=a and owner_id=u and action=k and resource=i;
 if not found then raise exception 'Fixture authorization missing or consumed';end if;end$$;`);
 const scalar=async(sql)=>Object.values((await db.query(sql)).rows[0])[0];
 await t.test('unsupported schema and ambiguous JSON null fail before persistence',async()=>{
  await assert.rejects(db.query(`select command_center_canonical_create_entity('future','project','project',2,'{}','fixture')`), /supported_schema/);
  await assert.rejects(db.query(`select command_center_append_knowledge_claim('null-claim','project','null-subject',1,'verified','current','known','null'::jsonb,1,array['receipt'],now(),null,null)`), /concrete_known_value/);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='future'`),0);
 });
 await t.test('canonical version conflict rollback zero and tombstone history',async()=>{
  await db.query(`select command_center_canonical_create_entity('entity','project','project',1,'{"zero":0}','fixture')`);
  await assert.rejects(db.query(`select command_center_canonical_replace_entity('entity',9,1,'{}','fixture')`), /version conflict/);
  assert.equal(await scalar(`select version::int from command_center_canonical_entities where entity_id='entity'`),1);
  assert.equal(await scalar(`select (payload->>'zero')::int from command_center_canonical_entities where entity_id='entity'`),0);
  await db.query(`select command_center_canonical_tombstone_entity('entity',1,'fixture')`);
  await assert.rejects(db.query(`select command_center_canonical_replace_entity('entity',2,1,'{}','fixture')`), /silently revived/);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entity_versions where entity_id='entity'`),2);
 });
 await t.test('ambiguous knowledge and failed inference leave verified truth current',async()=>{
  await db.query(`select command_center_append_knowledge_claim('claim','project','subject',1,'verified','current','known','0',1,array['receipt'],now(),null,null)`);
  await assert.rejects(db.query(`select command_center_append_knowledge_claim('bad','project','subject',2,'inferred','current','known','0',1,array['receipt'],now(),null,'claim')`), /confidence/);
  await assert.rejects(db.query(`select command_center_append_knowledge_claim('bad','project','subject',2,'verified','current','unknown','0',1,array['receipt'],now(),null,'claim')`), /Ambiguous/);
  assert.equal(await scalar(`select state from command_center_knowledge_claims where claim_id='claim'`),'current');
 });
 await t.test('owner fixture cannot reference another owners graph nodes and revoked fixture denies mutation',async()=>{
  await db.query(`select command_center_graph_add_node('node','project','project','Owner project')`);
  await db.exec(`set fixture.owner='00000000-0000-0000-0000-000000000002'`);
  await db.query(`select command_center_graph_add_node('other','project','project','Other project')`);
  await assert.rejects(db.query(`select command_center_graph_add_edge('edge','other','node','references','fixture',now())`), /foreign key/);
  await db.exec(`set fixture.authorized='false'`);
  await assert.rejects(db.query(`select command_center_canonical_create_entity('denied','project','project',1,'{}','fixture')`), /Unauthorized/);
  await db.exec(`set fixture.authorized='true';set fixture.owner='00000000-0000-0000-0000-000000000001'`);
 });
 await t.test('projection rebuild reconstructs canonical tombstones and rejects duplicate run identity',async()=>{
  await db.exec('delete from command_center_canonical_projection');
  await db.query(`select command_center_rebuild_canonical_projection('00000000-0000-0000-0000-000000000010','fixture')`);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_projection where entity_id='entity' and deleted_at is not null`),1);
  await assert.rejects(db.query(`select command_center_rebuild_canonical_projection('00000000-0000-0000-0000-000000000010','fixture')`), /already exists/);
 });

 await t.test('asset originals remain missing and provider/protocol registries preserve versions',async()=>{
  await db.query(`select command_center_register_asset('asset','project','Missing original',null,'internal','missing','unreviewed','fixture',null,null)`);
  assert.equal(await scalar(`select original_state from command_center_assets where asset_id='asset'`),'missing');
  await assert.rejects(db.query(`select command_center_register_asset('bad','project','No bytes',null,'internal','available','unreviewed','fixture',null,null)`), /check constraint/);
  await db.query(`select command_center_register_provider('provider:fixture',1,true,'none',null,array['read'],'{}',60,'free','available','tool_result','fail_closed','{}','fixture')`);
  await db.query(`select command_center_register_protocol_adapter('protocol:fixture','mcp',array['read'],'security.fixture','provider:fixture','{}','fixture')`);
  assert.equal(await scalar(`select version::int from command_center_protocol_adapters where adapter_key='protocol:fixture'`),1);
  await assert.rejects(db.query(`select command_center_register_protocol_adapter('protocol:bad','future',array['read'],'security.fixture',null,'{}','fixture')`), /Invalid protocol/);
 });
 await t.test('portable staging preserves payload and never activates canonical truth',async()=>{
  const data={zero:0};const hash=await scalar(`select command_center_private.c3_hash_json('{"zero":0}')`);
  const records=[{id:'imported',entityType:'project',projectId:'project',version:1,schemaVersion:1,contentHash:hash,sensitivity:'internal',provenanceRefs:['fixture'],data}];
  await db.query(`select command_center_stage_portable_import('00000000-0000-0000-0000-000000000020','fixture',$1::jsonb)`,[JSON.stringify(records)]);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='imported'`),0);
  assert.equal(await scalar(`select (payload->>'zero')::int from command_center_import_items where item_key='imported'`),0);
 });
 await t.test('branched historical staging preserves every node and container without canonical activation',async()=>{
  const stage=stageChatExport([{id:'conversation',conversation_template_id:'container',mapping:{root:{id:'root',children:['a','b']},a:{id:'a',parent:'root',children:[]},b:{id:'b',parent:'root',children:[]}}}], '00000000-0000-0000-0000-000000000030');
  await db.query(`select command_center_stage_historical_export('00000000-0000-0000-0000-000000000030','fixture',$1::jsonb)`,[JSON.stringify(stage)]);
  assert.equal(await scalar(`select count(*)::int from command_center_historical_message_nodes where conversation_id='conversation'`),3);
  assert.equal(await scalar(`select lineage_class from command_center_historical_conversations where conversation_id='conversation'`),'project_container_member');
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='conversation'`),0);
 });
 await t.test('context snapshot checks content hash and owner and leaves canonical source untouched',async()=>{
  const value={zero:0};const contentHash=await scalar(`select command_center_private.c3_hash_json('{"zero":0}')`);
  const source={id:'source',kind:'canonical_entity',version:1,ownerId:'00000000-0000-0000-0000-000000000001',projectId:'project',sensitivity:'internal',verificationState:'verified',sourceRef:'fixture',contentHash,value};
  await db.query(`select command_center_create_context_snapshot('00000000-0000-0000-0000-000000000040','project','internal',$1::jsonb)`,[JSON.stringify([source])]);
  await assert.rejects(db.query(`select command_center_create_context_snapshot('00000000-0000-0000-0000-000000000041','project','internal',$1::jsonb)`,[JSON.stringify([{...source,ownerId:'00000000-0000-0000-0000-000000000002'}])]), /owner mismatch/);
  assert.equal(await scalar(`select count(*)::int from command_center_context_snapshots where id='00000000-0000-0000-0000-000000000041'`),0);
  assert.equal(await scalar(`select (payload->>'zero')::int from command_center_canonical_entities where entity_id='entity'`),0);
 });

 await t.test('authenticated RLS reads are owner isolated and direct mutations remain denied',async()=>{
  await db.exec(`set role authenticated`);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='entity'`),1);
  await assert.rejects(db.query(`delete from command_center_canonical_entities where entity_id='entity'`), /permission denied/);
  await db.exec(`set fixture.owner='00000000-0000-0000-0000-000000000002'`);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='entity'`),0);
  await db.exec(`reset role;set fixture.owner='00000000-0000-0000-0000-000000000001'`);
 });

 await t.test('portable commit and rollback consume scoped fixture authorization and retain audit versions',async()=>{
  const batch='00000000-0000-0000-0000-000000000020';
  await assert.rejects(db.query(`select command_center_commit_portable_import('${batch}','00000000-0000-0000-0000-000000000050')`), /authorization missing/);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='imported'`),0);
  await db.exec(`insert into command_center_private.fixture_grants values('00000000-0000-0000-0000-000000000050',auth.uid(),'canonical.import.commit','${batch}'),('00000000-0000-0000-0000-000000000051',auth.uid(),'canonical.import.rollback','${batch}')`);
  await db.query(`select command_center_commit_portable_import('${batch}','00000000-0000-0000-0000-000000000050')`);
  assert.equal(await scalar(`select (payload->>'zero')::int from command_center_canonical_entities where entity_id='imported'`),0);
  await assert.rejects(db.query(`select command_center_commit_portable_import('${batch}','00000000-0000-0000-0000-000000000050')`), /not eligible/);
  await db.query(`select command_center_rollback_portable_import('${batch}','00000000-0000-0000-0000-000000000051')`);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entities where entity_id='imported' and deleted_at is not null`),1);
  assert.equal(await scalar(`select count(*)::int from command_center_canonical_entity_versions where entity_id='imported'`),2);
 });
 } finally {await db.close();}
});
