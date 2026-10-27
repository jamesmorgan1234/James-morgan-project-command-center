import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

// Isolated PostgreSQL execution. Auth functions below are explicit fixtures,
// not a substitute for Category 2's production authentication acceptance.
test('Category 3 executes canonical migrations and RPC contracts in isolated PostgreSQL',async(t)=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try {
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;create schema command_center_private;create extension pgcrypto with schema extensions;create table auth.users(id uuid primary key);insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');create function auth.uid() returns uuid language sql as $$select coalesce(nullif(current_setting('fixture.owner',true),''),'00000000-0000-0000-0000-000000000001')::uuid$$;create function public.is_command_center_authorized() returns boolean language sql as $$select coalesce(current_setting('fixture.authorized',true),'true')='true'$$;`);
 for(const name of ['20261024112000_category3_canonical_platform.sql','20261024113000_category3_sync_reconciliation.sql','20261024113500_category3_import_policy_extension.sql','20261024114000_category3_knowledge_provenance_invariant.sql','20261024115000_category3_portability_batches.sql','20261024120000_category3_historical_export_staging.sql','20261024121000_category3_context_artifact_exchange.sql','20261024122000_category3_protocol_adapter_registry.sql','20261024123000_category3_recovery_scale_evidence.sql','20261027174500_category3_declared_schema_compatibility.sql']) await db.exec(readFileSync(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'));
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
 } finally {await db.close();}
});
