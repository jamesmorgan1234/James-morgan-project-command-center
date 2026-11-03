import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const root=new URL('../../',import.meta.url);
test('production status repair preserves existing progress, restores ARO evidence, and existing roadmap RPCs validate a real DAG',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema command_center_private;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function public.is_command_center_authorized() returns boolean language sql as $$select auth.uid() is not null$$;
 create table auth.users(id uuid primary key);
 insert into auth.users values('00000000-0000-4000-8000-000000000001');
 create table public.command_center_project_profiles(owner_id uuid,project_id text,status text,verification text,version bigint default 1,updated_at timestamptz default now(),primary key(owner_id,project_id));
 insert into public.command_center_project_profiles(owner_id,project_id,status) values ('00000000-0000-4000-8000-000000000001','aro','Recovered first-class project'),('00000000-0000-4000-8000-000000000001','original','Existing status');
 create table public.cc7_projects(owner_id uuid,id text,stage text,next_action text,blocker text,last_verified text,updated_at timestamptz);
 insert into public.cc7_projects values('00000000-0000-4000-8000-000000000001','original','Substantial existing build','Resume saved work',null,'2026-10-23',now());
 create table public.analytics_project_kpis(project_id text,value_numeric numeric);insert into public.analytics_project_kpis values('original',88);
 create table public.command_center_project_roadmaps(owner_id uuid,project_id text,version bigint,state text default 'current',source_ref text,created_at timestamptz default now(),structure_verified boolean default false,denominator_trusted boolean default false,denominator_evidence_refs text[] default '{}',primary key(owner_id,project_id,version));
 create table public.command_center_project_work_units(owner_id uuid,project_id text,roadmap_version bigint,work_unit_id text,category_id text,phase_id text,title text,status text,applicable boolean,dependency_ids text[],gate_ids text[],acceptance_criteria jsonb default '[]'::jsonb,evidence_refs text[],updated_at timestamptz default now(),primary key(owner_id,project_id,roadmap_version,work_unit_id));`);
 await db.exec(await readFile(new URL('supabase/migrations/20261103124336_project_status_evidence_and_roadmap_alignment.sql',root),'utf8'));
 const aro=(await db.query("select * from command_center_project_profiles where project_id='aro'")).rows[0];assert.equal(aro.progress_summary,'Final integration');assert.match(aro.stage,/876\/876/);assert.match(aro.blocker,/task_synthesis/);assert.equal(aro.status_source_refs.length,3);
 const original=(await db.query("select * from command_center_project_profiles where project_id='original'")).rows[0];assert.equal(original.status,'Existing status');assert.equal(original.stage,'Substantial existing build');assert.equal((await db.query('select value_numeric from analytics_project_kpis')).rows[0].value_numeric,'88');
 await db.exec(await readFile(new URL('supabase/migrations/20261024132000_category5_roadmap_engine.sql',root),'utf8'));
 await db.exec(await readFile(new URL('supabase/migrations/20261024132200_category5_roadmap_authoring_rpc.sql',root),'utf8'));
 await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false)");
 await db.query("select public.command_center_project_start_roadmap('original',1,'test:source')");
 await db.query("select public.command_center_project_put_work_unit('original',1,'first','foundry','ultimate_spec','Compile full source specification','planned',true,'{}','{}',array['Trace every requirement'],'{}')");
 await db.query("select public.command_center_project_finalize_roadmap('original',1,false,'{}')");
 const r=(await db.query("select public.command_center_project_work_readiness('original',1,'first') as result")).rows[0].result;assert.equal(r.ready,true);
 assert.equal((await db.query("select denominator_trusted from command_center_project_roadmaps where project_id='original'")).rows[0].denominator_trusted,false);
 await db.query("select public.command_center_project_put_work_unit('original',1,'bad','foundry','roadmap','Invalid dependency','planned',true,array['missing'],'{}',array['Must reject'],'{}')");
 await assert.rejects(db.query("select public.command_center_project_finalize_roadmap('original',1,false,'{}')"),/Unknown dependency/);
 await db.exec("insert into command_center_project_profiles(owner_id,project_id,status) select '00000000-0000-4000-8000-000000000001','project:company:future:'||lpad(n::text,3,'0'),'planned' from generate_series(1,107) n");
 const seed=await readFile(new URL('supabase/migrations/20261103124714_register_planned_company_preparation.sql',root),'utf8');
 await db.exec(seed); await db.exec(seed);
 const seeded=(await db.query("select count(*)::integer as units from command_center_project_work_units where project_id like 'project:company:future:%'")).rows[0];assert.equal(seeded.units,214);
 const flags=(await db.query("select bool_and(structure_verified) as valid,bool_or(denominator_trusted) as trusted from command_center_project_roadmaps where project_id like 'project:company:future:%'")).rows[0];assert.equal(flags.valid,true);assert.equal(flags.trusted,false);
 assert.equal((await db.query("select count(*)::integer as completed from command_center_project_work_units where project_id like 'project:company:future:%' and status in ('verified','skipped')")).rows[0].completed,0);

 }finally{await db.close();}
});
