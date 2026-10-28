import test from 'node:test';import assert from 'node:assert/strict';import {PGlite} from '@electric-sql/pglite';import {readFileSync} from 'node:fs';
import {PostgresSpecialistDecisionStore,PostgresSpecialistEvolutionStore,SpecialistInteroperability,applySpecialistEvolution,commitSpecialistEvolution} from '../dist/specialists/index.js';
import {fixture,owner,model,authority,evolutionReview,NOW} from './helpers/specialist-interoperability.mjs';
const read=name=>readFileSync(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8');
async function database(){const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema command_center_private;create table auth.users(id uuid primary key);insert into auth.users values('${owner}');create table command_center_project_profiles(owner_id uuid,project_id text,primary key(owner_id,project_id));create function auth.uid() returns uuid language sql as $$select '${owner}'::uuid$$;create function public.is_command_center_authorized() returns boolean language sql as $$select true$$;create function command_center_private.c3_text_array_unique_nonblank(v text[]) returns boolean language sql immutable as $$select not exists(select 1 from unnest(v) s where btrim(s)='') and cardinality(v)=(select count(distinct s) from unnest(v) s)$$;`);
 for(const migration of ['20261024144000_category6_specialist_brains.sql','20261026010000_pif3_specialist_model_registry.sql','20261028020000_p12_8_specialist_interoperability.sql','20261028021000_p12_8_canonical_specialist_evolution.sql','20261026128000_p12_8_specialist_lifecycle.sql','20261026142000_p12_8_specialist_lifecycle_isolation.sql','20261028010000_p12_8_canonical_authorization_evidence.sql','20261028022000_p12_8_lifecycle_transition_guards.sql'])await db.exec(read(migration));
 return db;
 }catch(e){await db.close();throw e;}}

test('P12.8 PostgreSQL durable decision adapter is immutable, scoped, replay-safe and unavailable to ordinary clients',async()=>{
 const db=await database();try{
 const f=fixture();f.deps.store=new PostgresSpecialistDecisionStore((sql,params)=>db.query(sql,params));const controller=new SpecialistInteroperability(f.deps);
 await db.exec('set role service_role');const a=await controller.decide(f.request);assert.equal(a.accepted,true,a.reason);assert.deepEqual(await controller.decide(f.request),a);
 await assert.rejects(controller.decide({...f.request,operation:'inherit'}),/idempotency conflict/);
 assert.equal((await db.query('select count(*)::int as n from command_center_specialist_interoperability_decisions')).rows[0].n,1);
 await db.exec('reset role');await assert.rejects(db.exec("update command_center_specialist_interoperability_decisions set decision=decision"),/immutable/);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.exec('select * from command_center_specialist_interoperability_decisions'),/permission denied/);await assert.rejects(db.query('select command_center_private.append_specialist_decision($1::jsonb)',[JSON.stringify(a)]),/permission denied/);await db.exec('reset role');}
 for(const patch of [{artifact:{...a.artifact,executable:true}},{artifact:{...a.artifact,scope:{...a.scope,companyId:'cmp_other'}}},{authorizationEvidenceId:'rename:1'},{requestDigest:'wrong'},{artifact:{...a.artifact,expiresAt:NOW}},{artifact:{...a.artifact,evidenceIds:['merge:1']}}]){
 const bad={...a,...patch,id:'dec_invalid'};await assert.rejects(db.query('select command_center_private.append_specialist_decision($1::jsonb)',[JSON.stringify(bad)]));}
 f.state.allowed=false;await assert.rejects(controller.decide(f.request),/authorization_changed|recovery_requires/);
 }finally{await db.close();}
});

test('P12.8 canonical PostgreSQL model batches append PIF.3 lineage and roll back every row on conflict',async()=>{
 const db=await database();try{
 const store=new PostgresSpecialistEvolutionStore((sql,params)=>db.query(sql,params));
 await db.exec('set role service_role');await store.apply(owner,[{model:model('brn_seed'),expectedVersion:null}],authority.evidenceIds);
 await store.apply(owner,[{model:model('brn_seed',{version:2,strengths:['evolved']}),expectedVersion:1}],authority.evidenceIds);
 const f=fixture();f.brains.registerModel(model('brn_seed',{version:2}),authority);
 const out=await commitSpecialistEvolution(owner,f.brains,store,{operation:'split',sources:[{id:'brn_seed',version:2}],targets:[model('brn_child-one',{domain:'child-one'}),model('brn_child-two',{domain:'child-two'})]},authority,evolutionReview(),()=>true);
 assert.equal(f.brains.getModel('brn_seed').lifecycle,'retired');
 assert.equal((await db.query("select lifecycle from command_center_specialist_brains where specialist_id='brn_seed'")).rows[0].lifecycle,'retired');
 assert.equal((await db.query('select count(*)::int as n from command_center_specialist_brain_versions')).rows[0].n,5);
 await assert.rejects(store.apply(owner,[{model:model('brn_a-new'),expectedVersion:null},{model:model('brn_child-one',{version:2}),expectedVersion:99}],authority.evidenceIds),/conflict/);
 assert.equal((await db.query("select count(*)::int as n from command_center_specialist_brains where specialist_id='brn_a-new'")).rows[0].n,0);
 await assert.rejects(store.apply(owner,[{model:model('brn_child-one',{version:2,controlPlane:'other'}),expectedVersion:1}],authority.evidenceIds),/Command Center/);
 await db.exec('reset role');await assert.rejects(db.exec('delete from command_center_specialist_brain_versions'),/immutable/);
 await db.exec('set role authenticated');await assert.rejects(store.apply(owner,[{model:model('brn_client'),expectedVersion:null}],authority.evidenceIds),/permission denied/);
 }finally{await db.close();}
});


test('P12.8 PostgreSQL lifecycle versions reject invalid activation, identity substitution and recovery resurrection',async()=>{
 const db=await database();try{
 await db.query("insert into command_center_specialist_projects(owner_user_id,project_ref,type_key,display_name,canonical_ref,lifecycle_status,recovery_ref,version) values($1,'project','example','Example','example:one','active','recovery:one',1)",[owner]);
 const insert=(version,action,status,patch={})=>db.query("insert into command_center_specialist_project_history(owner_user_id,project_ref,version,type_key,display_name,canonical_ref,lifecycle_status,action,authorization_ref,actor_ref,occurred_at) values($1,'project',$2,'example',$3,$4,$5,$6,'evd_authority','owner',$7)",[owner,version,patch.name??'Example',patch.canonical??'example:one',status,action,NOW]);
 await assert.rejects(insert(1,'rename','active'),/valid registration/);await insert(1,'register','active');
 await assert.rejects(insert(2,'activate','active'),/dormant source/);await assert.rejects(insert(2,'rename','active',{canonical:'other'}),/binding mismatch/);
 await insert(2,'dormant','dormant');await insert(3,'activate','active');await insert(4,'archive','archived');
 await assert.rejects(insert(5,'rename','archived'),/Inactive/);await assert.rejects(insert(5,'recover','active'),/resurrect/);
 await insert(5,'recover','archived');assert.equal((await db.query('select count(*)::int as n from command_center_specialist_project_history')).rows[0].n,5);
 await db.exec('set role authenticated');await assert.rejects(insert(6,'recover','archived'),/permission denied/);
 }finally{await db.close();}
});
