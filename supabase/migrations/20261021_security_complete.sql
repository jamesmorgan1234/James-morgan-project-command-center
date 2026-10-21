-- Command Center Security — phases 1–8
-- Identity/session controls, row isolation, permission registry, authorization gates,
-- secret boundaries, audit trail, alerts, and revocation/recovery.
-- Free-first: uses Supabase TOTP MFA (available on all projects) and does not require paid Auth add-ons.

create schema if not exists command_center_private;
revoke all on schema command_center_private from public, anon, authenticated;
grant usage on schema command_center_private to postgres, service_role;

-- Phase 1: Identity & Session Controls -------------------------------------------------
alter table public.command_center_members
  add column if not exists access_status text not null default 'active'
    check (access_status in ('active','revoked','disabled')),
  add column if not exists revoked_at timestamptz null,
  add column if not exists revoked_reason text null,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists command_center_members_updated_at on public.command_center_members;
create trigger command_center_members_updated_at
before update on public.command_center_members
for each row execute function public.command_center_set_updated_at();

-- Strict membership authorization validates the live Supabase session row. If a
-- member has enrolled a verified MFA factor, only an aal2 token is accepted.
create or replace function public.is_command_center_authorized()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists (
    select 1
    from public.command_center_members m
    join auth.sessions s
      on s.user_id=m.user_id
     and s.id::text=(select auth.jwt()->>'session_id')
    where m.user_id=(select auth.uid())
      and m.access_status='active'
      and m.revoked_at is null
      and (s.not_after is null or s.not_after>now())
      and (
        not exists (
          select 1 from auth.mfa_factors f
          where f.user_id=m.user_id and f.status='verified'
        )
        or (select auth.jwt()->>'aal')='aal2'
      )
  );
$$;
revoke all on function public.is_command_center_authorized() from public,anon,authenticated;
grant execute on function public.is_command_center_authorized() to authenticated,service_role;

-- Phase 2: Row-Level Data Isolation ---------------------------------------------------
-- Public browser access is never needed before authentication.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke create on schema public from public,anon,authenticated;
grant usage on schema public to anon,authenticated;

-- Browser users do not need structural table privileges even after sign-in.
revoke truncate,references,trigger on all tables in schema public from authenticated;

-- Tighten legacy RLS policies that previously targeted PUBLIC. The predicates were
-- owner-scoped already; this additionally prevents anonymous policy evaluation.
do $$
declare r record;
begin
  for r in
    select tablename,policyname
    from pg_policies
    where schemaname='public' and roles @> array['public']::name[]
  loop
    execute format('alter policy %I on public.%I to authenticated',r.policyname,r.tablename);
  end loop;
end $$;

-- No SECURITY DEFINER routine in the exposed public schema is anonymously executable.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prosecdef
  loop
    execute format('revoke execute on function %s from public,anon',r.signature);
  end loop;
end $$;

-- Trigger-only definer functions must not be directly callable by browser roles.
revoke execute on function public.command_center_enforce_scope_freshness_on_refresh() from authenticated;
revoke execute on function public.command_center_guard_project_scope_freshness() from authenticated;
revoke execute on function public.command_center_roadmap_progress_from_checkpoint() from authenticated;
revoke execute on function public.command_center_scope_progress_from_checkpoint() from authenticated;

-- Close mutable search_path findings without changing behavior.
alter function public.command_center_priority_bucket(text,text,text,text) set search_path='';
alter function public.set_command_center_project_priority() set search_path='';

-- Phase 3: Permission Registry ---------------------------------------------------------
create table if not exists public.security_permission_registry (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  principal_type text not null check (principal_type in ('user','connection','automation_action','security_action')),
  principal_id text not null,
  permission_key text not null,
  effect text not null check (effect in ('allow','deny')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  project_id text null references public.projects(id) on delete set null,
  source_table text not null,
  source_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,principal_type,principal_id,permission_key,source_table,source_id)
);
create index if not exists security_permission_registry_owner_idx
  on public.security_permission_registry(owner_id,principal_type,status);
create index if not exists security_permission_registry_project_idx
  on public.security_permission_registry(project_id) where project_id is not null;

alter table public.security_permission_registry enable row level security;
drop policy if exists security_permission_registry_select_own on public.security_permission_registry;
create policy security_permission_registry_select_own
on public.security_permission_registry for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.security_permission_registry from anon,authenticated;
grant select on public.security_permission_registry to authenticated;

drop trigger if exists security_permission_registry_updated_at on public.security_permission_registry;
create trigger security_permission_registry_updated_at
before update on public.security_permission_registry
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.sync_member_permission()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid:=coalesce(new.user_id,old.user_id); begin
  delete from public.security_permission_registry
   where owner_id=u and source_table='command_center_members' and source_id=u::text;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata)
    values(new.user_id,'user',new.user_id::text,'command_center.access',case when new.access_status='active' and new.revoked_at is null then 'allow' else 'deny' end,case when new.access_status='active' and new.revoked_at is null then 'active' else 'revoked' end,'command_center_members',new.user_id::text,jsonb_build_object('access_status',new.access_status));
  end if;
  return coalesce(new,old);
end $$;
revoke all on function command_center_private.sync_member_permission() from public,anon,authenticated;

drop trigger if exists security_sync_member_permission on public.command_center_members;
create trigger security_sync_member_permission after insert or update or delete on public.command_center_members
for each row execute function command_center_private.sync_member_permission();

create or replace function command_center_private.sync_integration_permission()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid:=coalesce(new.owner_id,old.owner_id); sid text:=coalesce(new.id,old.id)::text; begin
  delete from public.security_permission_registry where owner_id=u and source_table='integration_permissions' and source_id=sid;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata)
    values(new.owner_id,'connection',new.connection_id::text,'integration.'||new.scope_key||'.'||new.access_mode,
      case when new.authorized and (new.expires_at is null or new.expires_at>now()) then 'allow' else 'deny' end,
      case when new.authorized and (new.expires_at is null or new.expires_at>now()) then 'active' else case when new.expires_at is not null and new.expires_at<=now() then 'expired' else 'revoked' end end,
      'integration_permissions',new.id::text,jsonb_build_object('scope_key',new.scope_key,'access_mode',new.access_mode,'expires_at',new.expires_at));
  end if;
  return coalesce(new,old);
end $$;
revoke all on function command_center_private.sync_integration_permission() from public,anon,authenticated;

drop trigger if exists security_sync_integration_permission on public.integration_permissions;
create trigger security_sync_integration_permission after insert or update or delete on public.integration_permissions
for each row execute function command_center_private.sync_integration_permission();

create or replace function command_center_private.sync_automation_action_permission()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid:=coalesce(new.owner_id,old.owner_id); sid text:=coalesce(new.id,old.id)::text; begin
  delete from public.security_permission_registry where owner_id=u and source_table='automation_action_definitions' and source_id=sid;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(owner_id,principal_type,principal_id,permission_key,effect,status,project_id,source_table,source_id,metadata)
    values(new.owner_id,'automation_action',new.id::text,'automation.action.execute',
      case when new.authorization_state='authorized' and new.status='active' then 'allow' else 'deny' end,
      case when new.authorization_state='authorized' and new.status='active' then 'active' else 'revoked' end,
      new.project_id,'automation_action_definitions',new.id::text,jsonb_build_object('name',new.name,'authorization_state',new.authorization_state,'status',new.status));
  end if;
  return coalesce(new,old);
end $$;
revoke all on function command_center_private.sync_automation_action_permission() from public,anon,authenticated;

drop trigger if exists security_sync_automation_action_permission on public.automation_action_definitions;
create trigger security_sync_automation_action_permission after insert or update or delete on public.automation_action_definitions
for each row execute function command_center_private.sync_automation_action_permission();

-- Backfill the registry from verified current source rows.
insert into public.security_permission_registry(owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata)
select m.user_id,'user',m.user_id::text,'command_center.access',case when m.access_status='active' and m.revoked_at is null then 'allow' else 'deny' end,case when m.access_status='active' and m.revoked_at is null then 'active' else 'revoked' end,'command_center_members',m.user_id::text,jsonb_build_object('access_status',m.access_status)
from public.command_center_members m
on conflict(owner_id,principal_type,principal_id,permission_key,source_table,source_id) do update set effect=excluded.effect,status=excluded.status,metadata=excluded.metadata,updated_at=now();

insert into public.security_permission_registry(owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata)
select p.owner_id,'connection',p.connection_id::text,'integration.'||p.scope_key||'.'||p.access_mode,case when p.authorized and (p.expires_at is null or p.expires_at>now()) then 'allow' else 'deny' end,case when p.authorized and (p.expires_at is null or p.expires_at>now()) then 'active' else case when p.expires_at is not null and p.expires_at<=now() then 'expired' else 'revoked' end end,'integration_permissions',p.id::text,jsonb_build_object('scope_key',p.scope_key,'access_mode',p.access_mode,'expires_at',p.expires_at)
from public.integration_permissions p
on conflict(owner_id,principal_type,principal_id,permission_key,source_table,source_id) do update set effect=excluded.effect,status=excluded.status,metadata=excluded.metadata,updated_at=now();

insert into public.security_permission_registry(owner_id,principal_type,principal_id,permission_key,effect,status,project_id,source_table,source_id,metadata)
select a.owner_id,'automation_action',a.id::text,'automation.action.execute',case when a.authorization_state='authorized' and a.status='active' then 'allow' else 'deny' end,case when a.authorization_state='authorized' and a.status='active' then 'active' else 'revoked' end,a.project_id,'automation_action_definitions',a.id::text,jsonb_build_object('name',a.name,'authorization_state',a.authorization_state,'status',a.status)
from public.automation_action_definitions a
on conflict(owner_id,principal_type,principal_id,permission_key,source_table,source_id) do update set effect=excluded.effect,status=excluded.status,project_id=excluded.project_id,metadata=excluded.metadata,updated_at=now();

-- Phase 4: Action Authorization Gates --------------------------------------------------
create table if not exists public.security_action_authorizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  action_key text not null,
  resource_type text not null,
  resource_id text not null,
  risk_level text not null default 'protected' check (risk_level in ('protected','high','critical')),
  status text not null default 'draft' check (status in ('draft','authorized','consumed','revoked','expired')),
  reason text null,
  idempotency_key text not null,
  authorized_at timestamptz null,
  expires_at timestamptz null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,idempotency_key)
);
create index if not exists security_action_authorizations_owner_idx
  on public.security_action_authorizations(owner_id,status,created_at desc);
alter table public.security_action_authorizations enable row level security;
drop policy if exists security_action_authorizations_select_own on public.security_action_authorizations;
create policy security_action_authorizations_select_own on public.security_action_authorizations for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists security_action_authorizations_insert_own on public.security_action_authorizations;
create policy security_action_authorizations_insert_own on public.security_action_authorizations for insert to authenticated
with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists security_action_authorizations_update_own on public.security_action_authorizations;
create policy security_action_authorizations_update_own on public.security_action_authorizations for update to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.security_action_authorizations from anon,authenticated;
grant select,insert,update on public.security_action_authorizations to authenticated;
drop trigger if exists security_action_authorizations_updated_at on public.security_action_authorizations;
create trigger security_action_authorizations_updated_at before update on public.security_action_authorizations
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.has_action_authorization(p_owner uuid,p_action_key text,p_resource_type text,p_resource_id text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.security_action_authorizations a
    where a.owner_id=p_owner and a.action_key=p_action_key and a.resource_type=p_resource_type and a.resource_id=p_resource_id
      and a.status='authorized' and (a.expires_at is null or a.expires_at>now())
  );
$$;
revoke all on function command_center_private.has_action_authorization(uuid,text,text,text) from public,anon,authenticated;

-- Phase 5: Secrets Isolation -----------------------------------------------------------
-- No credential values are stored in these security tables. Browser-visible config
-- remains publishable-key-only; server secrets stay in Edge Function environment or
-- other server-only secret stores. Keep private helper schema non-exposed.
revoke all on schema command_center_private from public,anon,authenticated;

-- Phase 6: Audit Trail ----------------------------------------------------------------
create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid null references auth.users(id) on delete set null,
  actor_session_id text null,
  actor_aal text null,
  event_key text not null,
  action text not null,
  target_type text not null,
  target_id text null,
  risk_level text not null default 'info' check (risk_level in ('info','warning','critical')),
  source text not null check (source in ('database','client','system')),
  success boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default clock_timestamp()
);
create index if not exists security_audit_events_owner_time_idx on public.security_audit_events(owner_id,occurred_at desc);
create index if not exists security_audit_events_target_idx on public.security_audit_events(target_type,target_id,occurred_at desc);
alter table public.security_audit_events enable row level security;
drop policy if exists security_audit_events_select_own on public.security_audit_events;
create policy security_audit_events_select_own on public.security_audit_events for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists security_audit_events_client_insert on public.security_audit_events;
create policy security_audit_events_client_insert on public.security_audit_events for insert to authenticated
with check (
  owner_id=(select auth.uid()) and actor_user_id=(select auth.uid()) and source='client'
  and event_key in ('session.revoke_others','session.signout_global','mfa.enrolled','mfa.unenrolled','mfa.challenge_verified','security.authorization.created','security.authorization.revoked')
  and (select public.is_command_center_authorized())
);
revoke all on public.security_audit_events from anon,authenticated;
grant select,insert on public.security_audit_events to authenticated;

create or replace function command_center_private.audit_protected_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  n jsonb:=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
  o jsonb:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
  owner uuid;
  target text;
  event text:=tg_table_name||'.'||lower(tg_op);
  risk text:='info';
  meta jsonb:=jsonb_build_object('operation',tg_op);
begin
  begin owner:=coalesce(nullif(n->>'owner_id','')::uuid,nullif(o->>'owner_id','')::uuid,nullif(n->>'user_id','')::uuid,nullif(o->>'user_id','')::uuid); exception when others then owner:=null; end;
  target:=coalesce(n->>'id',o->>'id',n->>'user_id',o->>'user_id');
  if owner is null then return coalesce(new,old); end if;

  if tg_table_name='command_center_members' then
    risk:=case when coalesce(n->>'access_status',o->>'access_status')<>'active' then 'critical' else 'warning' end;
    meta:=meta||jsonb_build_object('access_status',coalesce(n->>'access_status',o->>'access_status'));
  elsif tg_table_name='integration_permissions' then
    risk:='warning';
    meta:=meta||jsonb_build_object('scope_key',coalesce(n->>'scope_key',o->>'scope_key'),'access_mode',coalesce(n->>'access_mode',o->>'access_mode'),'authorized',coalesce(n->>'authorized',o->>'authorized'));
  elsif tg_table_name='integration_write_requests' then
    risk:=case when coalesce(n->>'authorization_state',o->>'authorization_state')='authorized' then 'warning' else 'info' end;
    meta:=meta||jsonb_build_object('action_key',coalesce(n->>'action_key',o->>'action_key'),'authorization_state',coalesce(n->>'authorization_state',o->>'authorization_state'),'status',coalesce(n->>'status',o->>'status'));
  elsif tg_table_name='automation_action_definitions' then
    risk:=case when coalesce(n->>'authorization_state',o->>'authorization_state')='authorized' then 'warning' else 'info' end;
    meta:=meta||jsonb_build_object('authorization_state',coalesce(n->>'authorization_state',o->>'authorization_state'),'status',coalesce(n->>'status',o->>'status'));
  elsif tg_table_name='security_action_authorizations' then
    risk:=case when coalesce(n->>'risk_level',o->>'risk_level')='critical' then 'critical' else 'warning' end;
    meta:=meta||jsonb_build_object('action_key',coalesce(n->>'action_key',o->>'action_key'),'status',coalesce(n->>'status',o->>'status'),'risk_level',coalesce(n->>'risk_level',o->>'risk_level'));
  elsif tg_table_name='analytics_goals' then
    meta:=meta||jsonb_build_object('status',coalesce(n->>'status',o->>'status'));
  end if;

  insert into public.security_audit_events(owner_id,actor_user_id,actor_session_id,actor_aal,event_key,action,target_type,target_id,risk_level,source,success,metadata)
  values(owner,(select auth.uid()),(select auth.jwt()->>'session_id'),(select auth.jwt()->>'aal'),event,lower(tg_op),tg_table_name,target,risk,case when auth.uid() is null then 'system' else 'database' end,true,meta);
  return coalesce(new,old);
end $$;
revoke all on function command_center_private.audit_protected_change() from public,anon,authenticated;

-- Protected state changes are audited automatically; payload/body content is never copied.
for each row execute function command_center_private.audit_protected_change();
