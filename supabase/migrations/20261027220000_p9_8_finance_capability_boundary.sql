-- Branch-only. Server provisioning required. Unclassified history remains intact and inaccessible.
create schema if not exists command_center_private;
create table command_center_private.finance_record_scopes (
 owner_id uuid not null references auth.users(id), table_name text not null,
 record_key jsonb not null check(jsonb_typeof(record_key)='object' and record_key<>'{}'),
 scope_id text not null check(btrim(scope_id)<>''), primary key(owner_id,table_name,record_key)
);
create table command_center_private.finance_scopes (
 owner_id uuid not null references auth.users(id), scope_id text not null check(btrim(scope_id)<>''),
 company_id text, project_id text, primary key(owner_id,scope_id),
 check(company_id is null or btrim(company_id)<>''), check(project_id is null or btrim(project_id)<>'')
);
create table command_center_private.finance_session_capabilities (
 owner_id uuid not null references auth.users(id), session_id uuid not null,
 scope_id text not null check(btrim(scope_id)<>''), context_domain text not null check(context_domain='finance'),
 company_id text, project_id text, assurance text not null check(assurance in ('passkey_uv','fresh_passkey_uv')),
 verified_at timestamptz not null, expires_at timestamptz not null,
 can_read boolean not null default false, can_write boolean not null default false,
 allowed_tables text[] not null default '{}',
 revoked_at timestamptz, contained boolean not null default false,
 primary key(owner_id,session_id,scope_id), check(expires_at>verified_at),
 check(company_id is null or btrim(company_id)<>''), check(project_id is null or btrim(project_id)<>'')
);
revoke all on command_center_private.finance_record_scopes,command_center_private.finance_scopes,command_center_private.finance_session_capabilities from public,anon,authenticated;
create function public.command_center_finance_row_allowed(p_table text,p_record jsonb,p_write boolean)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare k jsonb; u uuid := auth.uid(); sid text := auth.jwt()->>'session_id';
begin
 if u is null or sid is null or not public.is_command_center_authorized() then return false; end if;
 if p_record->>'owner_id' is distinct from u::text then return false; end if;
 select jsonb_object_agg(a.attname,p_record->a.attname) into k
 from pg_catalog.pg_index i join pg_catalog.pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
 where i.indrelid=pg_catalog.to_regclass('public.'||pg_catalog.quote_ident(p_table)) and i.indisprimary;
 if k is null then return false; end if;
 return exists (
 select 1 from command_center_private.finance_record_scopes r
 join command_center_private.finance_scopes s on s.owner_id=r.owner_id and s.scope_id=r.scope_id
 join command_center_private.finance_session_capabilities c on c.owner_id=r.owner_id and c.scope_id=r.scope_id
 join auth.sessions live on live.id=c.session_id and live.user_id=c.owner_id
 join public.command_center_owner_sessions cs on cs.session_id=c.session_id and cs.owner_id=c.owner_id
 where r.owner_id=u and r.table_name=p_table and r.record_key=k and c.session_id::text=sid
 and p_table=any(c.allowed_tables) and c.context_domain='finance' and c.company_id is not distinct from s.company_id and c.project_id is not distinct from s.project_id
 and c.revoked_at is null and not c.contained and cs.revoked_at is null
 and (live.not_after is null or live.not_after>now()) and cs.assurance in ('passkey_uv','fresh_passkey_uv')
 and c.verified_at<=now() and c.verified_at>now()-interval '5 minutes' and c.expires_at>now()
 and case when p_write then c.can_write and c.assurance='fresh_passkey_uv' and cs.assurance='fresh_passkey_uv' else c.can_read end);
end $$;
revoke all on function public.command_center_finance_row_allowed(text,jsonb,boolean) from public,anon;
grant execute on function public.command_center_finance_row_allowed(text,jsonb,boolean) to authenticated;
-- RESTRICTIVE intersects, rather than replaces, existing owner policies.
do $$ declare t text; begin
 for t in select c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and (c.relname like 'command_center_finance_%' or c.relname like 'command_center_credit_%') loop
 execute format('create policy finance_capability_read on public.%I as restrictive for select to authenticated using(public.command_center_finance_row_allowed(%L,to_jsonb(%I),false))',t,t,t);
 execute format('create policy finance_capability_insert on public.%I as restrictive for insert to authenticated with check(public.command_center_finance_row_allowed(%L,to_jsonb(%I),true))',t,t,t);
 execute format('revoke update,delete,truncate on public.%I from authenticated',t);
 end loop;
 for t in select c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='v' and (c.relname like 'command_center_finance_%' or c.relname like 'command_center_credit_%') loop
 execute format('alter view public.%I set (security_invoker=true)',t);
 end loop;
end $$;
-- Read/write data scope cannot mint action authority or assert provider execution.
revoke insert on public.command_center_finance_action_authorization_history,public.command_center_finance_action_execution_history from authenticated;
