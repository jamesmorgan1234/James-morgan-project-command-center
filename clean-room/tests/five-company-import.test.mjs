import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {prepareFiveCompanyImport,generateFiveCompanyImportSql} from '../scripts/prepare-five-company-import.mjs';
import {workReadiness} from '../dist/projects/roadmap.js';
import {filterRuntimeProjects} from '../dist/runtime/project-screen.js';
import {known,unknown} from '../dist/data/canonical.js';
import {SupabaseOwnerRuntimeSnapshotProvider} from '../dist/runtime/supabase-owner-provider.js';
const root=new URL('../../',import.meta.url),owner='00000000-0000-4000-8000-000000000001';
const migration=async name=>readFile(new URL('supabase/migrations/'+name,root),'utf8');

test('all five native project/Brain/task mappings preserve scope, no-spend and 530 source checks',async()=>{
 const b=await prepareFiveCompanyImport();assert.equal(b.items.length,5);assert.equal(b.productionApplied,false);
 assert.equal(b.items.reduce((n,c)=>n+c.roadmap.workUnits.length,0),530);
 for(const c of b.items){
  assert.equal(c.project.agentAccessEnabled,false);assert.equal(c.project.portfolioAutoEnabled,false);assert.equal(c.brain.enabled,false);assert.equal(c.brain.lifecycle,'suspended');assert.equal(c.brain.health,'unavailable');assert.deepEqual(c.brain.supportedProjectIds,[c.project.id]);assert.deepEqual(c.brain.supportedCompanyIds,[c.project.companyId]);assert.deepEqual(c.brain.permissionKeys,[]);assert.deepEqual(c.brain.providerKeys,[]);assert.equal(c.conformance.length,106);assert.ok(c.conformance.every(x=>!x.independent_verification));
  assert.equal(c.roadmap.gates.length,8);assert.ok(c.roadmap.gates.every(g=>!g.satisfied));
  assert.ok(c.roadmap.workUnits.some(u=>workReadiness(c.roadmap,u.id).ready));
  assert.ok(c.roadmap.workUnits.filter(u=>u.id.endsWith(':gate')).every(u=>!workReadiness(c.roadmap,u.id).ready));
 }
 const projects=b.items.map(c=>({...c.project,companyId:known(c.project.companyId),typeKey:known(c.project.typeKey),lifecycle:known('candidate'),priority:known('normal'),mission:known(c.project.mission),progressPercent:unknown()}));
 for(const c of b.items){const found=filterRuntimeProjects(projects,{query:c.project.name});assert.equal(found.length,1);assert.equal(found[0].id,c.project.id);assert.equal(c.route,'/project/'+encodeURIComponent(c.project.id));}
 await assert.rejects(prepareFiveCompanyImport({existingProjects:[{id:b.items[0].project.id}]}),/collision/);
 await assert.rejects(prepareFiveCompanyImport({existingBrains:[{key:b.items[0].brain.key}]}),/collision/);
});

async function database(){
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema command_center_private;create table auth.users(id uuid primary key);insert into auth.users values('${owner}');create function auth.uid() returns uuid language sql as $$select '${owner}'::uuid$$;create function public.is_command_center_authorized() returns boolean language sql as $$select true$$;
 create table command_center_canonical_entities(owner_id uuid,entity_id text,project_id text,entity_type text,payload jsonb,content_hash text,primary key(owner_id,entity_id));
 create table cc7_projects(owner_id uuid,id text,stage text,next_action text,blocker text,last_verified text,updated_at timestamptz);`);
 await db.exec(await readFile(new URL('supabase/seeds/five_company_specialist_prerequisite.sql',root),'utf8'));
 for(const name of ['20261024130000_category5_project_registry.sql','20261024132000_category5_roadmap_engine.sql','20261024132100_category5_roadmap_verification_gate_fix.sql','20261024132200_category5_roadmap_authoring_rpc.sql','20261024133000_category5_project_checkpoints.sql','20261024134000_category5_truthful_project_progress.sql','20261024144000_category6_specialist_brains.sql','20261026010000_pif3_specialist_model_registry.sql','20261103124336_project_status_evidence_and_roadmap_alignment.sql'])await db.exec(await migration(name));
 await db.exec(`
 insert into command_center_project_types(owner_id,type_key,version,label,domain_playbook_key,default_capabilities,required_detail_sections,active,source_ref) values('${owner}','project-type:company-build',1,'Company','portfolio-company-build','{}','{}',true,'fixture');
 insert into command_center_canonical_entities select '${owner}',case when n=0 then 'command-center' when n<=107 then 'project:company:future:'||lpad(n::text,3,'0') else 'original:'||n end,null,'fixture','{}','hash' from generate_series(0,145) n;
 insert into command_center_project_profiles(owner_id,project_id,canonical_entity_id,type_key,company_id,name,mission,lifecycle,status,verification,priority,source_ref) select owner_id,entity_id,entity_id,'project-type:company-build',replace(entity_id,'project:',''),entity_id,'Existing saved mission','active','Existing saved status','unknown','normal','fixture' from command_center_canonical_entities;
 create table command_center_book_catalogue(book_id text primary key,title text);insert into command_center_book_catalogue select 'book:'||n,'Existing book '||n from generate_series(1,43) n;`);return db;
 }catch(e){await db.close();throw e;}
}

test('native import executes against repository Postgres contracts, is idempotent and preserves every old row',async()=>{
 const db=await database();try{
 const before=JSON.stringify((await db.query('select * from command_center_project_profiles order by project_id')).rows);
 const books=JSON.stringify((await db.query('select * from command_center_book_catalogue order by book_id')).rows);
 const sql=generateFiveCompanyImportSql(await prepareFiveCompanyImport());await db.exec(sql);await db.exec(sql);
 assert.equal((await db.query('select count(*)::int as n from command_center_project_profiles')).rows[0].n,151);
 assert.equal((await db.query('select count(*)::int as n from command_center_project_work_units')).rows[0].n,530);
 assert.equal((await db.query('select count(*)::int as n from command_center_project_roadmap_gates')).rows[0].n,40);
 const brains=(await db.query('select * from command_center_specialist_brains')).rows;
 assert.equal(brains.length,5);assert.ok(brains.every(b=>!b.enabled&&b.health==='unavailable'&&b.lifecycle==='suspended'&&b.control_plane==='command_center'&&b.permission_keys.length===0&&b.provider_keys.length===0));
 assert.equal((await db.query('select count(*)::int as n from command_center_specialist_brain_versions')).rows[0].n,5);
 assert.ok((await db.query('select * from command_center_project_roadmaps')).rows.every(r=>r.structure_verified&&!r.denominator_trusted));
 assert.equal(JSON.stringify((await db.query("select * from command_center_project_profiles where project_id !~ 'project:company:future:1(08|09|10|11|12)$' order by project_id")).rows),before);
 assert.equal(JSON.stringify((await db.query('select * from command_center_book_catalogue order by book_id')).rows),books);
 await db.exec("update command_center_project_work_units set status='verified' where work_unit_id='project:company:future:108:p0:scope'");await db.exec(sql);
 assert.equal((await db.query("select status from command_center_project_work_units where work_unit_id='project:company:future:108:p0:scope'")).rows[0].status,'verified');
 await db.exec('set role authenticated');await assert.rejects(db.exec("update command_center_project_profiles set status='overwrite'"),/permission denied/);await db.exec('reset role');
 }finally{await db.close();}
});

test('a later-company collision rolls back the entire additive import',async()=>{
 const db=await database();try{
 await db.exec("update command_center_project_profiles set name='Shipping Exception & Refund Recovery' where project_id='original:108'");
 await assert.rejects(db.exec(generateFiveCompanyImportSql(await prepareFiveCompanyImport())),/collision/);await db.exec('rollback');
 assert.equal((await db.query('select count(*)::int as n from command_center_project_profiles')).rows[0].n,146);
 assert.equal((await db.query('select count(*)::int as n from command_center_specialist_brains')).rows[0].n,0);
 }finally{await db.close();}
});

test('runtime projects keep each disabled specialized Brain plan and source isolated',async()=>{
 const b=await prepareFiveCompanyImport(),values=new Map(),calls=[];
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const fetcher=async(input)=>{
  const u=new URL(String(input));calls.push(u);let data=[];
  if(u.pathname==='/auth/v1/token')data={access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:4102444800,user:{id:owner}};
  else if(u.pathname.endsWith('/cc7_owner_access'))data=[{enabled:true}];
  else if(u.pathname.endsWith('/command_center_project_profiles'))data=b.items.map(c=>({project_id:c.project.id,type_key:c.project.typeKey,company_id:c.project.companyId,name:c.project.name,mission:c.project.mission,lifecycle:'candidate',status:'planned',verification:'unknown',priority:'normal',version:1,source_ref:c.sourceRef,updated_at:'2026-11-03T00:00:00Z'}));
  else if(u.pathname.endsWith('/command_center_specialist_brains'))data=b.items.map(c=>({brain_key:c.brainKey,scope:'project',project_id:c.project.id,enabled:false,capabilities:c.brain.capabilityKeys,configuration_ref:c.configurationRef,updated_at:'2026-11-03T00:00:00Z'}));
  else if(u.pathname.endsWith('/command_center_book_catalogue'))data=[{book_id:'synthetic-book',project_id:'kdp',title:'Synthetic book'}];
  else if(u.pathname.endsWith('/command_center_book_performance_truth_history'))data=[{owner_id:owner,metric_id:'synthetic-metric',project_id:'kdp',book_id:'synthetic-book',provider_key:'owner_report',edition:'current',format:'all_formats',truth:'confirmed',metric:'royalties',value:0.25,currency:'USD',source:'Synthetic test',source_date:'2026-11-03T00:00:00Z',observed_at:'2026-11-03T00:00:00Z',source_refs:['test:synthetic']}];
  else if(u.pathname.endsWith('/analytics_project_kpis')&&!u.searchParams.has('metric_key'))data=[{project_id:b.items[0].project.id,metric_key:'income',label:'Synthetic finance',value_numeric:22,verified:false}];
  else if(u.pathname.endsWith('/integration_connections'))data=[{id:'synthetic-connection',project_id:b.items[0].project.id,provider_label:'Synthetic connection',status:'not_connected'}];
  else if(u.pathname.endsWith('/command_center_assets'))data=[{asset_id:'synthetic-asset',project_id:b.items[1].project.id,name:'Synthetic asset',sensitivity:'internal',original_state:'recorded',approval_state:'unreviewed'}];
  else if(u.pathname.endsWith('/command_center_agency_executors'))data=[{executor_key:'synthetic-disabled',enabled:false,cost_class:'free',health:'unavailable',project_type_keys:[]}];
  return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
 };
 const p=new SupabaseOwnerRuntimeSnapshotProvider({supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_synthetic',releaseId:'synthetic',storage,fetcher,promptForCredentials:async submit=>submit('test@example.com','synthetic-only')});
 const snapshot=await p.load();assert.equal(snapshot.projects.length,5);
 assert.equal(snapshot.books[0].performance[0].value,0.25);
 assert.equal(snapshot.surfaceRecords.finance[0].title,'Synthetic finance');
 assert.equal(snapshot.surfaceRecords.social[0].id,'synthetic-connection');
 assert.equal(snapshot.projects.find(p=>p.id===b.items[1].project.id).workspace.assets[0].title,'Synthetic asset');
 for(const c of b.items){const project=snapshot.projects.find(p=>p.id===c.project.id);assert.equal(project.specialistKey,c.brainKey,JSON.stringify({sources:snapshot.sources,records:snapshot.surfaceRecords?.specialists,projectId:project.id,requestedSpecialists:calls.some(u=>u.pathname.endsWith('/command_center_specialist_brains'))}));assert.equal(project.specialistPlan.configurationRef,c.configurationRef);assert.equal(project.specialistPlan.enabled,false);assert.deepEqual(project.specialistPlan.capabilities,c.brain.capabilityKeys);assert.equal(project.progressPercent.state,'unknown');assert.equal(project.workspace.executorCount,0);}
 assert.ok(calls.filter(u=>u.pathname.startsWith('/rest/v1/')&&!u.pathname.endsWith('/cc7_owner_access')).every(u=>u.searchParams.get('owner_id')==='eq.'+owner));
});
