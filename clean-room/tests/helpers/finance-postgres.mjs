import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
export const U='00000000-0000-0000-0000-000000000001',S='00000000-0000-0000-0000-000000000002';
export async function financeDatabase(){
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema command_center_private;grant usage on schema auth to authenticated;
 create table auth.users(id uuid primary key);insert into auth.users values('${U}');
 create table auth.sessions(id uuid primary key,user_id uuid,not_after timestamptz);insert into auth.sessions values('${S}','${U}',now()+interval '1 hour');
 create table public.command_center_owner_sessions(session_id uuid,owner_id uuid,assurance text,revoked_at timestamptz);insert into public.command_center_owner_sessions values('${S}','${U}','aal2',null);
 create function auth.uid() returns uuid language sql as $$select coalesce(nullif(current_setting('fixture.owner',true),''),'${U}')::uuid$$;
 create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('session_id',coalesce(nullif(current_setting('fixture.session',true),''),'${S}'))$$;
 create function public.is_command_center_authorized() returns boolean language sql as $$select coalesce(current_setting('fixture.authorized',true),'true')='true'$$;`);
 const dir=new URL('../../../supabase/migrations/',import.meta.url);
 for(const f of readdirSync(dir).filter(f=>/^20261026\d+_p9_/.test(f)).sort())await db.exec(readFileSync(new URL(f,dir),'utf8'));
 for(const f of ['20261027220000_p9_8_finance_capability_boundary.sql','20261027221000_p9_9_durable_finance_attempts.sql'])await db.exec(readFileSync(new URL(f,dir),'utf8'));
 await db.exec(`insert into command_center_private.finance_scopes values('${U}','personal',null,null);
 insert into command_center_private.finance_session_capabilities values('${U}','${S}','personal','finance',null,null,'fresh_passkey_uv',now(),now()+interval '4 minutes',true,true,array['command_center_finance_action_intent_history'],null,false);
 insert into command_center_private.finance_provider_runtime_state values('${U}','finance-provider:fixture','available','connected','granted','healthy',array['payment.write'],now());`);
 return db;
 }catch(e){await db.close();throw e;}
}
export async function seedAction(db,id,changes={}){
 const {intentAmount=500,grantAmount=intentAmount,source='owner_request',age=5,expires=120,consumed=false,hash='hash:'+id}=changes;
 await db.query(`insert into command_center_finance_action_intent_history values($1,$2,'payment','finance-provider:fixture',array['account'],$3,$4,$5,now()-interval '10 seconds',$6,false)`,[U,id,intentAmount,hash,source,'auth:'+id]);
 await db.query(`insert into command_center_finance_action_authorization_history values($1,$2,$3,'payment','finance-provider:fixture',array['account'],$4,$5,now()-($6::text||' seconds')::interval,now()+($7::text||' seconds')::interval,'fresh_passkey_uv',true,$8,array['passkey:verified'])`,[U,'auth:'+id,id,grantAmount,hash,age,expires,consumed]);
 await db.query(`insert into command_center_private.finance_record_scopes values($1,'command_center_finance_action_intent_history',$2,'personal')`,[U,{owner_id:U,intent_id:id}]);
}
