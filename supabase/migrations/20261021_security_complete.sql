-- Command Center Security — phases 1–8
-- Identity/session controls, row isolation, permission registry, authorization gates,
-- secret boundaries, audit trail, alerts, and access revocation/recovery.
-- Free-first: TOTP MFA is supported without paid Auth add-ons. Paid-only leaked-
-- password protection is documented as a plan limitation and is not silently enabled.

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

-- Validate membership against a live Supabase Auth session. If the member has
-- enrolled any verified MFA factor, the current JWT must be aal2. This means
-- Security never forces MFA before the user explicitly enrolls a factor, while
-- automatically honoring that protection afterward.
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
          select 1
          from auth.mfa_factors f
          where f.user_id=m.user_id and f.status='verified'
        )
        or (select auth.jwt()->>'aal')='aal2'
      )
  );
$$;
revoke all on function public.is_command_center_authorized() from public,anon,authenticated;
grant execute on function public.is_command_center_authorized() to authenticated,service_role;

-- Phase 2: Row-Level Data Isolation ---------------------------------------------------
-- No browser table is intentionally readable before authentication.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke create on schema public from public,anon,authenticated;
grant usage on schema public to anon,authenticated;

-- Browser roles do not need database-structure privileges.
revoke truncate,references,trigger on all tables in schema public from authenticated;

-- Tighten legacy owner-scoped policies that were created TO PUBLIC.
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

-- Remove default PUBLIC/anonymous function execution from the exposed schema.
-- Explicit authenticated/service_role grants already present on intentional RPCs
-- remain intact.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
  loop
    execute format('revoke execute on function %s from public,anon',r.signature);
  end loop;
end $$;

-- Trigger-only definer functions are never browser RPCs.
revoke execute on function public.command_center_enforce_scope_freshness_on_refresh() from authenticated;
revoke execute on function public.command_center_guard_project_scope_freshness() from authenticated;
revoke execute on function public.command_center_roadmap_progress_from_checkpoint() from authenticated;
revoke execute on function public.command_center_scope_progress_from_checkpoint() from authenticated;

-- Close mutable search_path findings without changing helper behavior.
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
declare u uuid;
begin
  if tg_op='DELETE' then u:=old.user_id; else u:=new.user_id; end if;
  delete from public.security_permission_registry
   where owner_id=u and source_table='command_center_members' and source_id=u::text;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(
      owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata
    ) values (
      new.user_id,'user',new.user_id::text,'command_center.access',
      case when new.access_status='active' and new.revoked_at is null then 'allow' else 'deny' end,
      case when new.access_status='active' and new.revoked_at is null then 'active' else 'revoked' end,
      'command_center_members',new.user_id::text,jsonb_build_object('access_status',new.access_status)
    );
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function command_center_private.sync_member_permission() from public,anon,authenticated;

drop trigger if exists security_sync_member_permission on public.command_center_members;
create trigger security_sync_member_permission
after insert or update or delete on public.command_center_members
for each row execute function command_center_private.sync_member_permission();

create or replace function command_center_private.sync_integration_permission()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid; sid text;
begin
  if tg_op='DELETE' then u:=old.owner_id; sid:=old.id::text; else u:=new.owner_id; sid:=new.id::text; end if;
  delete from public.security_permission_registry
   where owner_id=u and source_table='integration_permissions' and source_id=sid;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(
      owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata
    ) values (
      new.owner_id,'connection',new.connection_id::text,'integration.'||new.scope_key||'.'||new.access_mode,
      case when new.authorized and (new.expires_at is null or new.expires_at>now()) then 'allow' else 'deny' end,
      case when new.authorized and (new.expires_at is null or new.expires_at>now()) then 'active'
           when new.expires_at is not null and new.expires_at<=now() then 'expired' else 'revoked' end,
      'integration_permissions',new.id::text,
      jsonb_build_object('scope_key',new.scope_key,'access_mode',new.access_mode,'expires_at',new.expires_at)
    );
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function command_center_private.sync_integration_permission() from public,anon,authenticated;

drop trigger if exists security_sync_integration_permission on public.integration_permissions;
create trigger security_sync_integration_permission
after insert or update or delete on public.integration_permissions
for each row execute function command_center_private.sync_integration_permission();

create or replace function command_center_private.sync_automation_action_permission()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid; sid text;
begin
  if tg_op='DELETE' then u:=old.owner_id; sid:=old.id::text; else u:=new.owner_id; sid:=new.id::text; end if;
  delete from public.security_permission_registry
   where owner_id=u and source_table='automation_action_definitions' and source_id=sid;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(
      owner_id,principal_type,principal_id,permission_key,effect,status,project_id,source_table,source_id,metadata
    ) values (
      new.owner_id,'automation_action',new.id::text,'automation.action.execute',
      case when new.authorization_state='authorized' and new.status='active' then 'allow' else 'deny' end,
      case when new.authorization_state='authorized' and new.status='active' then 'active' else 'revoked' end,
      new.project_id,'automation_action_definitions',new.id::text,
      jsonb_build_object('name',new.name,'authorization_state',new.authorization_state,'status',new.status)
    );
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function command_center_private.sync_automation_action_permission() from public,anon,authenticated;

drop trigger if exists security_sync_automation_action_permission on public.automation_action_definitions;
create trigger security_sync_automation_action_permission
after insert or update or delete on public.automation_action_definitions
for each row execute function command_center_private.sync_automation_action_permission();

-- Backfill only real current permission sources; no fabricated permission rows.
insert into public.security_permission_registry(
  owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata
)
select m.user_id,'user',m.user_id::text,'command_center.access',
       case when m.access_status='active' and m.revoked_at is null then 'allow' else 'deny' end,
       case when m.access_status='active' and m.revoked_at is null then 'active' else 'revoked' end,
       'command_center_members',m.user_id::text,jsonb_build_object('access_status',m.access_status)
from public.command_center_members m
on conflict(owner_id,principal_type,principal_id,permission_key,source_table,source_id)
do update set effect=excluded.effect,status=excluded.status,metadata=excluded.metadata,updated_at=now();

insert into public.security_permission_registry(
  owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata
)
select p.owner_id,'connection',p.connection_id::text,'integration.'||p.scope_key||'.'||p.access_mode,
       case when p.authorized and (p.expires_at is null or p.expires_at>now()) then 'allow' else 'deny' end,
       case when p.authorized and (p.expires_at is null or p.expires_at>now()) then 'active'
            when p.expires_at is not null and p.expires_at<=now() then 'expired' else 'revoked' end,
       'integration_permissions',p.id::text,
       jsonb_build_object('scope_key',p.scope_key,'access_mode',p.access_mode,'expires_at',p.expires_at)
from public.integration_permissions p
on conflict(owner_id,principal_type,principal_id,permission_key,source_table,source_id)
do update set effect=excluded.effect,status=excluded.status,metadata=excluded.metadata,updated_at=now();

insert into public.security_permission_registry(
  owner_id,principal_type,principal_id,permission_key,effect,status,project_id,source_table,source_id,metadata
)
select a.owner_id,'automation_action',a.id::text,'automation.action.execute',
       case when a.authorization_state='authorized' and a.status='active' then 'allow' else 'deny' end,
       case when a.authorization_state='authorized' and a.status='active' then 'active' else 'revoked' end,
       a.project_id,'automation_action_definitions',a.id::text,
       jsonb_build_object('name',a.name,'authorization_state',a.authorization_state,'status',a.status)
from public.automation_action_definitions a
on conflict(owner_id,principal_type,principal_id,permission_key,source_table,source_id)
do update set effect=excluded.effect,status=excluded.status,project_id=excluded.project_id,metadata=excluded.metadata,updated_at=now();

-- Phase 4: Action Authorization Gates --------------------------------------------------
create table if not exists public.security_action_authorizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  action_key text not null,
  resource_type text not null,
  resource_id text not null,
  risk_level text not null default 'protected' check (risk_level in ('protected','high','critical')),
  status text not null default 'authorized' check (status in ('authorized','consumed','revoked','expired')),
  reason text null,
  idempotency_key text not null,
  authorized_at timestamptz not null default now(),
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
create policy security_action_authorizations_select_own
on public.security_action_authorizations for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.security_action_authorizations from anon,authenticated;
grant select on public.security_action_authorizations to authenticated;

drop trigger if exists security_action_authorizations_updated_at on public.security_action_authorizations;
create trigger security_action_authorizations_updated_at
before update on public.security_action_authorizations
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.has_action_authorization(
  p_owner uuid,p_action_key text,p_resource_type text,p_resource_id text
)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1
    from public.security_action_authorizations a
    where a.owner_id=p_owner
      and a.action_key=p_action_key
      and a.resource_type=p_resource_type
      and a.resource_id=p_resource_id
      and a.status='authorized'
      and (a.expires_at is null or a.expires_at>now())
  );
$$;
revoke all on function command_center_private.has_action_authorization(uuid,text,text,text) from public,anon,authenticated;

-- Phase 5: Secrets Isolation -----------------------------------------------------------
-- No credential values are stored in Security tables. Browser-visible config may
-- contain only the Supabase publishable key; service-role/provider secrets remain in
-- Edge Function environment or another server-only secret store.
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
create index if not exists security_audit_events_owner_time_idx
  on public.security_audit_events(owner_id,occurred_at desc);
create index if not exists security_audit_events_target_idx
  on public.security_audit_events(target_type,target_id,occurred_at desc);
alter table public.security_audit_events enable row level security;

drop policy if exists security_audit_events_select_own on public.security_audit_events;
create policy security_audit_events_select_own
on public.security_audit_events for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.security_audit_events from anon,authenticated;
grant select on public.security_audit_events to authenticated;

create or replace function command_center_private.audit_protected_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  n jsonb;
  o jsonb;
  owner uuid;
  target text;
  event text:=tg_table_name||'.'||lower(tg_op);
  risk text:='info';
  meta jsonb:=jsonb_build_object('operation',tg_op);
begin
  if tg_op='DELETE' then n:='{}'::jsonb; o:=to_jsonb(old);
  elsif tg_op='INSERT' then n:=to_jsonb(new); o:='{}'::jsonb;
  else n:=to_jsonb(new); o:=to_jsonb(old); end if;

  begin
    owner:=coalesce(
      nullif(n->>'owner_id','')::uuid,
      nullif(o->>'owner_id','')::uuid,
      nullif(n->>'user_id','')::uuid,
      nullif(o->>'user_id','')::uuid
    );
  exception when others then owner:=null; end;
  target:=coalesce(n->>'id',o->>'id',n->>'user_id',o->>'user_id');
  if owner is null then if tg_op='DELETE' then return old; else return new; end if; end if;

  if tg_table_name='command_center_members' then
    risk:=case when coalesce(n->>'access_status',o->>'access_status')<>'active' then 'critical' else 'warning' end;
    meta:=meta||jsonb_build_object('access_status',coalesce(n->>'access_status',o->>'access_status'));
  elsif tg_table_name='integration_permissions' then
    risk:='warning';
    meta:=meta||jsonb_build_object(
      'scope_key',coalesce(n->>'scope_key',o->>'scope_key'),
      'access_mode',coalesce(n->>'access_mode',o->>'access_mode'),
      'authorized',coalesce(n->>'authorized',o->>'authorized')
    );
  elsif tg_table_name='integration_write_requests' then
    risk:=case when coalesce(n->>'authorization_state',o->>'authorization_state')='authorized' then 'warning' else 'info' end;
    meta:=meta||jsonb_build_object(
      'action_key',coalesce(n->>'action_key',o->>'action_key'),
      'authorization_state',coalesce(n->>'authorization_state',o->>'authorization_state'),
      'status',coalesce(n->>'status',o->>'status')
    );
  elsif tg_table_name='automation_action_definitions' then
    risk:=case when coalesce(n->>'authorization_state',o->>'authorization_state')='authorized' then 'warning' else 'info' end;
    meta:=meta||jsonb_build_object(
      'authorization_state',coalesce(n->>'authorization_state',o->>'authorization_state'),
      'status',coalesce(n->>'status',o->>'status')
    );
  elsif tg_table_name='security_action_authorizations' then
    risk:=case
      when coalesce(n->>'status',o->>'status')='authorized' and coalesce(n->>'risk_level',o->>'risk_level')='critical' then 'critical'
      when coalesce(n->>'status',o->>'status') in ('authorized','revoked','consumed') then 'warning'
      else 'info' end;
    meta:=meta||jsonb_build_object(
      'action_key',coalesce(n->>'action_key',o->>'action_key'),
      'status',coalesce(n->>'status',o->>'status'),
      'risk_level',coalesce(n->>'risk_level',o->>'risk_level')
    );
  elsif tg_table_name='analytics_goals' then
    meta:=meta||jsonb_build_object('status',coalesce(n->>'status',o->>'status'));
  end if;

  insert into public.security_audit_events(
    owner_id,actor_user_id,actor_session_id,actor_aal,event_key,action,
    target_type,target_id,risk_level,source,success,metadata
  ) values (
    owner,(select auth.uid()),(select auth.jwt()->>'session_id'),(select auth.jwt()->>'aal'),
    event,lower(tg_op),tg_table_name,target,risk,
    case when auth.uid() is null then 'system' else 'database' end,true,meta
  );

  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function command_center_private.audit_protected_change() from public,anon,authenticated;

-- Attach minimal-metadata audit triggers only after permission-registry backfill.
do $$
declare t text;
begin
  foreach t in array array[
    'command_center_members','integration_permissions','integration_write_requests',
    'automation_action_definitions','security_action_authorizations','analytics_goals'
  ] loop
    execute format('drop trigger if exists security_audit_%I on public.%I',t,t);
    execute format(
      'create trigger security_audit_%I after insert or update or delete on public.%I for each row execute function command_center_private.audit_protected_change()',
      t,t
    );
  end loop;
end $$;

-- Phase 7: Security Alerts -------------------------------------------------------------
create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_audit_event_id uuid null unique references public.security_audit_events(id) on delete cascade,
  severity text not null check (severity in ('warning','critical')),
  alert_key text not null,
  title text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  acknowledged_at timestamptz null,
  resolved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists security_alerts_owner_status_idx
  on public.security_alerts(owner_id,status,created_at desc);
alter table public.security_alerts enable row level security;

drop policy if exists security_alerts_select_own on public.security_alerts;
create policy security_alerts_select_own
on public.security_alerts for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.security_alerts from anon,authenticated;
grant select on public.security_alerts to authenticated;

drop trigger if exists security_alerts_updated_at on public.security_alerts;
create trigger security_alerts_updated_at
before update on public.security_alerts
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.create_security_alert()
returns trigger language plpgsql security definer set search_path='' as $$
declare title text; msg text;
begin
  if new.risk_level not in ('warning','critical') then return new; end if;
  title:=case
    when new.event_key like 'command_center_members.%' then 'Command Center access changed'
    when new.event_key like 'integration_permissions.%' then 'Integration permission changed'
    when new.event_key like 'integration_write_requests.%' then 'Integration write authorization changed'
    when new.event_key like 'automation_action_definitions.%' then 'Automation action authorization changed'
    when new.event_key like 'security_action_authorizations.%' then 'Protected action authorization changed'
    when new.event_key='mfa.challenge_failed' then 'MFA verification failed'
    when new.event_key='session.revoke_others' then 'Other sessions revoked'
    when new.event_key='session.signout_global' then 'Global sign-out requested'
    else 'Security event needs review' end;
  msg:=new.event_key||' · '||new.action||coalesce(' · '||new.target_type,'');
  insert into public.security_alerts(
    owner_id,source_audit_event_id,severity,alert_key,title,message
  ) values (
    new.owner_id,new.id,new.risk_level,new.event_key,title,msg
  ) on conflict(source_audit_event_id) do nothing;
  return new;
end $$;
revoke all on function command_center_private.create_security_alert() from public,anon,authenticated;

drop trigger if exists security_alert_from_audit on public.security_audit_events;
create trigger security_alert_from_audit
after insert on public.security_audit_events
for each row execute function command_center_private.create_security_alert();

-- Controlled client security event logger. The browser cannot insert arbitrary
-- audit severity/content directly.
create or replace function public.command_center_security_log_client_event(
  p_event_key text,
  p_target_type text default 'security',
  p_target_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=(select auth.uid());
  event_id uuid;
  risk text;
  action_name text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_event_key not in (
    'session.revoke_others','session.signout_global','mfa.enrolled','mfa.unenrolled',
    'mfa.challenge_verified','mfa.challenge_failed','security.authorization.created',
    'security.authorization.revoked','security.integrity_warning'
  ) then raise exception 'Unsupported security event'; end if;
  risk:=case
    when p_event_key in ('mfa.challenge_failed','session.revoke_others','session.signout_global','mfa.unenrolled','security.authorization.created','security.authorization.revoked') then 'warning'
    when p_event_key='security.integrity_warning' then 'critical'
    else 'info' end;
  action_name:=case
    when p_event_key like 'session.%' then 'session_control'
    when p_event_key like 'mfa.%' then 'mfa_control'
    when p_event_key like 'security.authorization.%' then 'authorization_control'
    else 'integrity_check' end;
  insert into public.security_audit_events(
    owner_id,actor_user_id,actor_session_id,actor_aal,event_key,action,
    target_type,target_id,risk_level,source,success,metadata
  ) values (
    u,u,(select auth.jwt()->>'session_id'),(select auth.jwt()->>'aal'),
    p_event_key,action_name,coalesce(nullif(btrim(p_target_type),''),'security'),p_target_id,
    risk,'client',p_event_key<>'mfa.challenge_failed',coalesce(p_metadata,'{}'::jsonb)
  ) returning id into event_id;
  return event_id;
end $$;
revoke all on function public.command_center_security_log_client_event(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_security_log_client_event(text,text,text,jsonb) to authenticated;

create or replace function public.command_center_security_set_alert_state(
  p_alert_id uuid,p_action text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare u uuid:=(select auth.uid()); a public.security_alerts%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.security_alerts where id=p_alert_id and owner_id=u;
  if not found then raise exception 'Alert not found'; end if;
  if p_action='acknowledge' then
    update public.security_alerts set status='acknowledged',acknowledged_at=coalesce(acknowledged_at,now()) where id=a.id;
  elsif p_action='resolve' then
    update public.security_alerts set status='resolved',acknowledged_at=coalesce(acknowledged_at,now()),resolved_at=now() where id=a.id;
  elsif p_action='reopen' then
    update public.security_alerts set status='open',acknowledged_at=null,resolved_at=null where id=a.id;
  else raise exception 'Unsupported alert action'; end if;
  return jsonb_build_object('ok',true,'alert_id',a.id,'action',p_action);
end $$;
revoke all on function public.command_center_security_set_alert_state(uuid,text) from public,anon,authenticated;
grant execute on function public.command_center_security_set_alert_state(uuid,text) to authenticated;

-- Explicit protected-action authorization RPCs.
create or replace function public.command_center_security_authorize_action(
  p_action_key text,p_resource_type text,p_resource_id text,p_risk_level text,
  p_reason text default null,p_expires_at timestamptz default null,p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare u uuid:=(select auth.uid()); a public.security_action_authorizations%rowtype; idem text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_action_key),'')='' or coalesce(btrim(p_resource_type),'')='' or coalesce(btrim(p_resource_id),'')='' then raise exception 'Action and resource are required'; end if;
  if p_risk_level not in ('protected','high','critical') then raise exception 'Invalid risk level'; end if;
  if p_expires_at is not null and p_expires_at<=now() then raise exception 'Authorization expiry must be in the future'; end if;
  idem:=coalesce(nullif(btrim(p_idempotency_key),''),'security-auth:'||encode(extensions.gen_random_bytes(12),'hex'));
  insert into public.security_action_authorizations(
    owner_id,action_key,resource_type,resource_id,risk_level,status,reason,idempotency_key,authorized_at,expires_at
  ) values (
    u,btrim(p_action_key),btrim(p_resource_type),btrim(p_resource_id),p_risk_level,'authorized',p_reason,idem,now(),p_expires_at
  )
  on conflict(owner_id,idempotency_key) do update set
    updated_at=public.security_action_authorizations.updated_at
  returning * into a;
  return jsonb_build_object('ok',true,'authorization_id',a.id,'status',a.status,'idempotency_key',a.idempotency_key);
end $$;
revoke all on function public.command_center_security_authorize_action(text,text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.command_center_security_authorize_action(text,text,text,text,text,timestamptz,text) to authenticated;

create or replace function public.command_center_security_revoke_action(p_authorization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare u uuid:=(select auth.uid()); a public.security_action_authorizations%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.security_action_authorizations where id=p_authorization_id and owner_id=u;
  if not found then raise exception 'Authorization not found'; end if;
  update public.security_action_authorizations set status='revoked' where id=a.id;
  return jsonb_build_object('ok',true,'authorization_id',a.id,'status','revoked');
end $$;
revoke all on function public.command_center_security_revoke_action(uuid) from public,anon,authenticated;
grant execute on function public.command_center_security_revoke_action(uuid) to authenticated;

create or replace function command_center_private.sync_security_action_permission()
returns trigger language plpgsql security definer set search_path='' as $$
declare u uuid; sid text;
begin
  if tg_op='DELETE' then u:=old.owner_id; sid:=old.id::text; else u:=new.owner_id; sid:=new.id::text; end if;
  delete from public.security_permission_registry
   where owner_id=u and source_table='security_action_authorizations' and source_id=sid;
  if tg_op<>'DELETE' then
    insert into public.security_permission_registry(
      owner_id,principal_type,principal_id,permission_key,effect,status,source_table,source_id,metadata
    ) values (
      new.owner_id,'security_action',new.id::text,'security.action.'||new.action_key,
      case when new.status='authorized' and (new.expires_at is null or new.expires_at>now()) then 'allow' else 'deny' end,
      case when new.status='authorized' and (new.expires_at is null or new.expires_at>now()) then 'active'
           when new.status='expired' or (new.expires_at is not null and new.expires_at<=now()) then 'expired' else 'revoked' end,
      'security_action_authorizations',new.id::text,
      jsonb_build_object('resource_type',new.resource_type,'resource_id',new.resource_id,'risk_level',new.risk_level,'expires_at',new.expires_at)
    );
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function command_center_private.sync_security_action_permission() from public,anon,authenticated;

drop trigger if exists security_sync_action_permission on public.security_action_authorizations;
create trigger security_sync_action_permission
after insert or update or delete on public.security_action_authorizations
for each row execute function command_center_private.sync_security_action_permission();

-- Phase 8: Access Revocation & Recovery ------------------------------------------------
-- Browser revocation uses Supabase Auth signOut scopes. Server-only member recovery is
-- available without exposing a self-bypass path to revoked browser sessions.
create or replace function public.command_center_security_set_member_access_service(
  p_user_id uuid,p_status text,p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_status not in ('active','revoked','disabled') then raise exception 'Invalid access status'; end if;
  update public.command_center_members
     set access_status=p_status,
         revoked_at=case when p_status='active' then null else now() end,
         revoked_reason=case when p_status='active' then null else p_reason end
   where user_id=p_user_id;
  if not found then raise exception 'Member not found'; end if;
  return jsonb_build_object('ok',true,'user_id',p_user_id,'status',p_status);
end $$;
revoke all on function public.command_center_security_set_member_access_service(uuid,text,text) from public,anon,authenticated;
grant execute on function public.command_center_security_set_member_access_service(uuid,text,text) to service_role;

-- Read-only, privacy-bounded security status for the signed-in owner. Session IDs,
-- IP addresses and secret values are intentionally omitted.
create or replace function public.command_center_security_status()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  u uuid:=(select auth.uid());
  result jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select jsonb_build_object(
    'current_aal',(select auth.jwt()->>'aal'),
    'mfa_verified_factors',(select count(*) from auth.mfa_factors f where f.user_id=u and f.status='verified'),
    'active_sessions',(select count(*) from auth.sessions s where s.user_id=u and (s.not_after is null or s.not_after>now())),
    'public_tables',(select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
    'public_tables_without_rls',(select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),
    'public_views',(select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v'),
    'public_views_without_security_invoker',(select count(*) from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v' and not (coalesce(c.reloptions,'{}'::text[]) @> array['security_invoker=true']::text[])),
    'public_role_policies',(select count(*) from pg_catalog.pg_policies p where p.schemaname='public' and p.roles @> array['public']::name[]),
    'anon_security_definer_functions',(select count(*) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('anon',p.oid,'execute')),
    'permission_records',(select count(*) from public.security_permission_registry r where r.owner_id=u),
    'open_alerts',(select count(*) from public.security_alerts a where a.owner_id=u and a.status='open'),
    'audit_events',(select count(*) from public.security_audit_events e where e.owner_id=u)
  ) into result;
  return result;
end $$;
revoke all on function public.command_center_security_status() from public,anon,authenticated;
grant execute on function public.command_center_security_status() to authenticated;

-- Revoke PUBLIC/anon again for all functions created by this migration and preserve
-- only the explicit authenticated/service_role grants above.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','command_center_private')
  loop
    execute format('revoke execute on function %s from public,anon',r.signature);
  end loop;
end $$;

-- Keep private schema browser-inaccessible after every helper creation.
revoke all on schema command_center_private from public,anon,authenticated;
