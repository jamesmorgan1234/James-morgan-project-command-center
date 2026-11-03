import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {prepareFiveCompanyImport,generateFiveCompanyImportSql} from '../scripts/prepare-five-company-import.mjs';
import {prepareAdditionalFiveCompanyImport,generateAdditionalCompanyNameSql} from '../scripts/prepare-additional-five-company-import.mjs';
import {workReadiness} from '../dist/projects/roadmap.js';
const root=new URL('../../',import.meta.url),owner='00000000-0000-4000-8000-000000000001';
const migration=async name=>readFile(new URL('supabase/migrations/'+name,root),'utf8');
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
 create table command_center_book_catalogue(book_id text primary key,title text);insert into command_center_book_catalogue select 'book:'||n,'Existing book '||n from generate_series(1,43) n;`);
 const names=(await db.query('select name from command_center_project_profiles')).rows.map(r=>r.name);
 const quote=v=>"'"+v.replaceAll("'","''")+"'";
 await db.exec('alter table public.command_center_project_profiles drop constraint command_center_project_profiles_name_check; create type public.command_center_activation_name as enum ('+names.map(quote).join(',')+'); alter table public.command_center_project_profiles alter column name type public.command_center_activation_name using name::text::public.command_center_activation_name;');
 await db.exec(await readFile(new URL('supabase/seeds/five_company_name_prerequisite.sql',root),'utf8'));
 await db.exec(await readFile(new URL('supabase/seeds/project_roadmap_cycle_validation_bounded.sql',root),'utf8'));
 return db;
 }catch(e){await db.close();throw e;}
}

test('additional companies preserve all 520 domain tasks, sources and scoped protected boundaries',async()=>{
 const b=await prepareAdditionalFiveCompanyImport();assert.equal(b.items.length,5);
 assert.equal(b.items.reduce((n,c)=>n+c.roadmap.workUnits.length,0),520);
 assert.equal(b.expectedHomeCountAfterImport,199);
 for(const [i,c] of b.items.entries()){
  assert.equal(c.project.id,'project:company:future:'+(113+i));
  assert.equal(c.roadmap.workUnits.length,104);assert.equal(c.conformance.length,106);
  assert.ok(c.conformance.every(x=>x.actual_pass===false));
  assert.deepEqual(c.brain.supportedProjectIds,[c.project.id]);assert.deepEqual(c.brain.supportedCompanyIds,[c.project.companyId]);
  assert.deepEqual(c.brain.permissionKeys,[]);assert.deepEqual(c.brain.providerKeys,[]);assert.deepEqual(c.brain.toolKeys,[]);
  assert.equal(c.brain.enabled,false);assert.equal(c.brain.costClass,'free');assert.equal(c.brain.controlPlane,'command_center');
  assert.ok(c.brain.protectedActionBoundaries.length>4);
  assert.ok(c.roadmap.workUnits.some(u=>workReadiness(c.roadmap,u.id).ready));
  assert.ok(c.roadmap.workUnits.filter(u=>u.id.endsWith(':gate')).every(u=>!workReadiness(c.roadmap,u.id).ready));
 }
 await assert.rejects(prepareAdditionalFiveCompanyImport({existingProjects:[{id:b.items[0].project.id}]}),/collision/);
 await assert.rejects(prepareAdditionalFiveCompanyImport({existingBrains:[{projectId:b.items[1].project.id}]}),/collision/);
 assert.notEqual(b.items[0].project.id,'morgancommerce');assert.notEqual(b.items[2].project.companyId,'company:future:036');
});

test('additional native import preserves all 151 prior projects, 43 books, 530 tasks and five Brains; collision rolls back and repeats preserve progress',async()=>{
 const db=await database();try{
  await db.exec(generateFiveCompanyImportSql(await prepareFiveCompanyImport()));
  const b=await prepareAdditionalFiveCompanyImport(),sql=generateFiveCompanyImportSql(b);
  await db.exec(generateAdditionalCompanyNameSql(b));
  await db.exec("update command_center_project_profiles set name='Real Estate Wholesaling & Acquisition Intelligence' where project_id='original:108'");
  await assert.rejects(db.exec(sql),/collision/);await db.exec('rollback');
  assert.equal((await db.query('select count(*)::int as n from command_center_project_profiles')).rows[0].n,151);
  assert.equal((await db.query('select count(*)::int as n from command_center_specialist_brains')).rows[0].n,5);
  await db.exec("update command_center_project_profiles set name='original:108' where project_id='original:108'");
  const snapshot=async(table,key,where='true')=>JSON.stringify((await db.query('select * from '+table+' where '+where+' order by '+key)).rows);
  const before={profiles:await snapshot('command_center_project_profiles','project_id'),books:await snapshot('command_center_book_catalogue','book_id'),tasks:await snapshot('command_center_project_work_units','work_unit_id'),brains:await snapshot('command_center_specialist_brains','brain_key')};
  await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query('select count(*)::int as n from command_center_project_profiles')).rows[0].n,156);
  assert.equal((await db.query('select count(*)::int as n from command_center_project_work_units')).rows[0].n,1050);
  assert.equal((await db.query('select count(*)::int as n from command_center_project_roadmap_gates')).rows[0].n,80);
  assert.equal((await db.query('select count(*)::int as n from command_center_specialist_brain_versions')).rows[0].n,10);
  const old="project_id !~ 'project:company:future:11[3-7]$'";
  assert.equal(await snapshot('command_center_project_profiles','project_id',old),before.profiles);
  assert.equal(await snapshot('command_center_book_catalogue','book_id'),before.books);
  assert.equal(await snapshot('command_center_project_work_units','work_unit_id',old),before.tasks);
  assert.equal(await snapshot('command_center_specialist_brains','brain_key',old),before.brains);
  assert.ok((await db.query('select * from command_center_project_roadmaps')).rows.every(r=>r.structure_verified&&!r.denominator_trusted));
  await db.exec("update command_center_project_work_units set status='verified' where work_unit_id='project:company:future:113:P0:01-source_and_rights'");await db.exec(sql);
  assert.equal((await db.query("select status from command_center_project_work_units where work_unit_id='project:company:future:113:P0:01-source_and_rights'")).rows[0].status,'verified');
  const target='project:company:future:114:P0:01-source_and_rights';
  const peer='project:company:future:114:P0:02-canonical_identity';
  await db.query('update command_center_project_work_units set dependency_ids=array[$2]::text[] where work_unit_id=$1',[target,peer]);
  await db.query('update command_center_project_work_units set dependency_ids=array[$2]::text[] where work_unit_id=$1',[peer,target]);
  await assert.rejects(db.query('select command_center_private.c5_assert_roadmap_integrity($1,$2,1)',[owner,'project:company:future:114']),/cycle/);
  await db.query("update command_center_project_work_units set dependency_ids='{}'::text[] where work_unit_id=$1",[peer]);
  await db.query("update command_center_project_work_units set dependency_ids=array['missing']::text[] where work_unit_id=$1",[target]);
  await assert.rejects(db.query('select command_center_private.c5_assert_roadmap_integrity($1,$2,1)',[owner,'project:company:future:114']),/Unknown dependency/);
  await db.query("update command_center_project_work_units set dependency_ids='{}'::text[] where work_unit_id=$1",[target]);
  await db.exec('set role authenticated');await assert.rejects(db.exec("update command_center_project_profiles set status='overwrite'"),/permission denied/);await db.exec('reset role');
 }finally{await db.close();}
});

test('owner runtime loads every task beyond the API page cap and rejects an incomplete later page',async()=>{
 const {SupabaseOwnerRuntimeSnapshotProvider}=await import('../dist/runtime/supabase-owner-provider.js');
 const all=[...(await prepareFiveCompanyImport()).items,...(await prepareAdditionalFiveCompanyImport()).items];
 const datasets={
  command_center_project_profiles:all.map(c=>({project_id:c.project.id,type_key:c.project.typeKey,company_id:c.project.companyId,name:c.project.name,mission:c.project.mission,lifecycle:'candidate',status:'planned',verification:'unknown',priority:'normal',version:1,source_ref:c.sourceRef,updated_at:'2026-11-03T00:00:00Z'})),
  command_center_project_roadmaps:all.map(c=>({project_id:c.project.id,version:1,state:'current',structure_verified:true,denominator_trusted:false,denominator_evidence_refs:[],source_ref:c.sourceRef,created_at:'2026-11-03T00:00:00Z'})),
  command_center_project_work_units:all.flatMap(c=>c.roadmap.workUnits.map(u=>({project_id:c.project.id,roadmap_version:1,work_unit_id:u.id,category_id:u.categoryId,phase_id:u.phaseId,title:u.title,status:'planned',applicable:true,dependency_ids:u.dependencyIds,gate_ids:u.gateIds,acceptance_criteria:u.acceptanceCriteria,evidence_refs:u.evidenceRefs,updated_at:'2026-11-03T00:00:00Z'}))),
  command_center_project_roadmap_gates:all.flatMap(c=>c.roadmap.gates.map(g=>({project_id:c.project.id,roadmap_version:1,gate_id:g.id,satisfied:false,evidence_refs:[],updated_at:'2026-11-03T00:00:00Z'})))
 };
 const values=new Map(),calls=[];let failLastPage=false;
 const fetcher=async(input)=>{
  const u=new URL(String(input));calls.push(u);
  if(u.pathname==='/auth/v1/token')return new Response(JSON.stringify({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:4102444800,user:{id:owner}}),{status:200});
  const table=u.pathname.split('/').at(-1);
  const records=table==='cc7_owner_access'?[{enabled:true}]:(datasets[table]??[]);
  assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);
  const offset=Number(u.searchParams.get('offset')??0),limit=Math.min(100,Number(u.searchParams.get('limit')??100));
  if(failLastPage&&table==='command_center_project_work_units'&&offset>=1000)throw Error('Synthetic final-page connection loss');
  const rows=records.slice(offset,offset+limit);
  return new Response(JSON.stringify(rows),{status:200,headers:{'content-type':'application/json','content-range':rows.length?`${offset}-${offset+rows.length-1}/${records.length}`:`*/${records.length}`}});
 };
 const provider=new SupabaseOwnerRuntimeSnapshotProvider({supabaseUrl:'https://gmlsucpwliegwlxymjvp.supabase.co',publishableKey:'sb_publishable_synthetic_test',fetcher,storage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},promptForCredentials:async submit=>submit('owner@example.invalid','synthetic-password')});
 const snapshot=await provider.load();assert.equal(snapshot.connection.state,'connected');
 assert.equal(snapshot.projects.length,10);
 assert.equal(snapshot.projects.reduce((n,p)=>n+(p.workspace?.roadmap.length??0),0),1050);
 assert.equal(snapshot.projects.find(p=>p.id==='project:company:future:117').workspace.roadmap.length,104);
 assert.ok(calls.some(u=>u.pathname.endsWith('/command_center_project_work_units')&&u.searchParams.get('offset')==='1000'));
 failLastPage=true;const failed=await provider.load();
 assert.equal(failed.sources.roadmaps,'unavailable');
 assert.ok(failed.projects.every(p=>p.workspace.roadmap.length===0));
});
