import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const U='00000000-0000-0000-0000-000000000001', S='00000000-0000-0000-0000-000000000002';
// Explicit auth fixtures; this exercises real PostgreSQL RLS, not hosted Supabase authentication.
test('P9.8 executable finance RLS and security-invoker views',async t=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema command_center_private;
 grant usage on schema auth to authenticated;create table auth.users(id uuid primary key);insert into auth.users values('${U}');
 create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);insert into auth.sessions values('${S}','${U}',now()+interval '1 hour');
 create table public.command_center_owner_sessions(session_id uuid,owner_id uuid,assurance text,revoked_at timestamptz);insert into public.command_center_owner_sessions values('${S}','${U}','fresh_passkey_uv',null);
 create function auth.uid() returns uuid language sql as $$select coalesce(nullif(current_setting('fixture.owner',true),''),'${U}')::uuid$$;
 create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('session_id',coalesce(nullif(current_setting('fixture.session',true),''),'${S}'))$$;
 create function public.is_command_center_authorized() returns boolean language sql as $$select coalesce(current_setting('fixture.authorized',true),'true')='true'$$;`);
 const dir=new URL('../../supabase/migrations/',import.meta.url);
 for(const file of readdirSync(dir).filter(f=>/^20261026\d+_p9_/.test(f)).sort())await db.exec(readFileSync(new URL(file,dir),'utf8'));
 await db.exec(readFileSync(new URL('20261027220000_p9_8_finance_capability_boundary.sql',dir),'utf8'));
 const table='command_center_finance_incident_containment_history';
 await db.exec(`insert into ${table} values('${U}','event','non_financial_compromise','projects',true,array['evidence'],now());`);
 const count=async()=>Number((await db.query(`select count(*) as n from ${table}`)).rows[0].n);
 await t.test('owner membership alone cannot read or insert finance; cannot provision own grant',async()=>{
 await db.exec('set role authenticated');assert.equal(await count(),0);
 await assert.rejects(db.exec(`insert into ${table} values('${U}','forged','non_financial_compromise','projects',true,array['fake'],now())`),/row-level security/);
 await assert.rejects(db.exec(`insert into command_center_private.finance_scopes values('${U}','personal',null,null)`),/permission denied/);await db.exec('reset role');
 });
 await db.exec(`insert into command_center_private.finance_scopes values('${U}','personal',null,null);
 insert into command_center_private.finance_record_scopes values('${U}','${table}','{"owner_id":"${U}","containment_event_id":"event"}','personal');
 insert into command_center_private.finance_session_capabilities values('${U}','${S}','personal','finance',null,null,'fresh_passkey_uv',now(),now()+interval '4 minutes',true,false,array['${table}'],null,false);`);
 await t.test('server-scoped read works and ordinary finance read cannot write or forge protected authorization',async()=>{
 await db.exec('set role authenticated');assert.equal(await count(),1);
 await assert.rejects(db.exec(`delete from ${table}`),/permission denied/);
 await assert.rejects(db.exec(`insert into command_center_finance_action_authorization_history(owner_id) values('${U}')`),/permission denied/);
 await db.exec('reset role');
 });
 await t.test('revocation containment expiry company project and session substitution deny existing rows',async()=>{
 for(const [change,undo] of [
 ["revoked_at=now()","revoked_at=null"],["contained=true","contained=false"],
 ["expires_at=now()-interval '1 second',verified_at=now()-interval '2 seconds'","expires_at=now()+interval '4 minutes',verified_at=now()"],
 ["company_id='other'","company_id=null"],["allowed_tables='{}'","allowed_tables=array['command_center_finance_incident_containment_history']"],["project_id='other'","project_id=null"],
 ["verified_at=now()-interval '6 minutes'","verified_at=now()"]]){
 await db.exec(`update command_center_private.finance_session_capabilities set ${change};set role authenticated`);assert.equal(await count(),0,change);await db.exec(`reset role;update command_center_private.finance_session_capabilities set ${undo}`);
 }
 for(const setting of ["fixture.owner='00000000-0000-0000-0000-000000000003'","fixture.session='00000000-0000-0000-0000-000000000004'","fixture.authorized='false'"]){await db.exec(`set ${setting};set role authenticated`);assert.equal(await count(),0,setting);await db.exec('reset role;reset fixture.owner;reset fixture.session;reset fixture.authorized');}
 await db.exec(`update command_center_owner_sessions set revoked_at=now();set role authenticated`);assert.equal(await count(),0);await db.exec('reset role;update command_center_owner_sessions set revoked_at=null');
 });
 await t.test('real finance view hides unclassified data even from an otherwise authorized owner',async()=>{
 await db.exec(`insert into command_center_finance_provider_connection_history values('${U}','finance-provider:fixture','bank','connected','granted','consent',null,now(),now(),300,array['evidence'],false)`);
 await db.exec('set role authenticated');
 assert.equal((await db.query('select count(*) as n from command_center_finance_provider_connections_current')).rows[0].n,0);
 await db.exec('reset role');
 assert.equal((await db.query('select count(*) as n from command_center_finance_provider_connections_current')).rows[0].n,1);
 });
 await t.test('all finance/credit tables have restrictive policies and all views enforce invoker RLS',async()=>{
 const tables=(await db.query(`select tablename from pg_tables where schemaname='public' and (tablename like 'command_center_finance_%' or tablename like 'command_center_credit_%')`)).rows;
 assert.ok(tables.length>15);
 for(const {tablename} of tables){const p=(await db.query(`select * from pg_policies where tablename=$1 and permissive='RESTRICTIVE'`,[tablename])).rows;assert.equal(p.length,2,tablename);}
 const views=(await db.query(`select relname,reloptions from pg_class where relkind='v' and (relname like 'command_center_finance_%' or relname like 'command_center_credit_%')`)).rows;
 for(const v of views)assert.ok(v.reloptions.includes('security_invoker=true'),v.relname);
 await db.exec('set role authenticated');for(const {relname} of views)assert.equal((await db.query(`select count(*) as n from ${relname}`)).rows[0].n,0,relname);await db.exec('reset role');
 });
 await t.test('immutable audit survives denied mutation and capabilities confer no action authority',async()=>{
 await assert.rejects(db.exec(`update ${table} set source_domain='changed'`),/immutable/);
 assert.equal(await count(),1);
 });
 }finally{await db.close();}
});
