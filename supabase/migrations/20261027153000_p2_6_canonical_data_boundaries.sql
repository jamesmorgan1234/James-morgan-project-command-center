-- P2.6 — canonical owner/project/company/business/account/environment data boundaries.
-- Branch-only migration source. Committing this file does not apply it to production.
-- Current single-owner access remains valid; explicit scope grants are dormant support
-- for future additional principals and must never broaden anonymous access.

create table if not exists public.security_scope_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  principal_user_id uuid not null references auth.users(id) on delete cascade,
  project_id text null,
  company_id text null,
  business_id text null,
  account_id text null,
  environment text null check (environment in ('development','test','preview','staging','production')),
  can_read boolean not null default true,
  can_write boolean not null default false,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  expires_at timestamptz null,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (can_read or not can_write),
  check (
    project_id is not null or company_id is not null or business_id is not null or
    account_id is not null or environment is not null
  ),
  check (project_id is null or length(btrim(project_id)) between 1 and 240),
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (business_id is null or length(btrim(business_id)) between 1 and 240),
  check (account_id is null or length(btrim(account_id)) between 1 and 240),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at >= created_at)
);

create index if not exists security_scope_grants_owner_principal_idx
  on public.security_scope_grants(owner_id,principal_user_id,status);
create index if not exists security_scope_grants_project_idx
  on public.security_scope_grants(owner_id,project_id,principal_user_id)
  where project_id is not null and status='active';

alter table public.security_scope_grants enable row level security;
alter table public.security_scope_grants force row level security;
revoke all on table public.security_scope_grants from public,anon,authenticated;
grant select on table public.security_scope_grants to authenticated;

drop policy if exists p26_scope_grants_visible on public.security_scope_grants;
create policy p26_scope_grants_visible
on public.security_scope_grants
for select
to authenticated
using (
  (select public.is_command_center_authorized())
  and (
    owner_id=(select auth.uid())
    or principal_user_id=(select auth.uid())
  )
);

-- Private boundary matcher. The owner remains authorized for their own data.
-- A future non-owner principal must hold one active, unexpired grant whose every
-- constrained dimension matches the requested resource boundary.
create or replace function command_center_private.p26_boundary_scope_allowed(
  p_owner_id uuid,
  p_project_id text default null,
  p_company_id text default null,
  p_business_id text default null,
  p_account_id text default null,
  p_environment text default null,
  p_operation text default 'read'
)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select case
    when (select auth.uid()) is null then false
    when p_owner_id is null then false
    when p_operation not in ('read','write') then false
    when not (select public.is_command_center_authorized()) then false
    when (select auth.uid())=p_owner_id then true
    else exists (
      select 1
      from public.security_scope_grants g
      where g.owner_id=p_owner_id
        and g.principal_user_id=(select auth.uid())
        and g.status='active'
        and (g.expires_at is null or g.expires_at>now())
        and (case when p_operation='write' then g.can_write else g.can_read end)
        and (g.project_id is null or g.project_id=p_project_id)
        and (g.company_id is null or g.company_id=p_company_id)
        and (g.business_id is null or g.business_id=p_business_id)
        and (g.account_id is null or g.account_id=p_account_id)
        and (g.environment is null or g.environment=p_environment)
    )
  end;
$$;
revoke all on function command_center_private.p26_boundary_scope_allowed(uuid,text,text,text,text,text,text) from public,anon,authenticated;

-- Exposed fail-closed boundary assertion. It returns no protected row data and is
-- deliberately the only generic authenticated boundary RPC added by this phase.
create or replace function public.command_center_boundary_check(
  p_owner_id uuid,
  p_project_id text default null,
  p_company_id text default null,
  p_business_id text default null,
  p_account_id text default null,
  p_environment text default null,
  p_operation text default 'read'
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if p_environment is not null and p_environment not in ('development','test','preview','staging','production') then
    raise exception 'Data boundary denied' using errcode='42501';
  end if;
  if not command_center_private.p26_boundary_scope_allowed(
    p_owner_id,p_project_id,p_company_id,p_business_id,p_account_id,p_environment,p_operation
  ) then
    raise exception 'Data boundary denied' using errcode='42501';
  end if;
  return jsonb_build_object(
    'allowed',true,
    'operation',p_operation,
    'owner_id',p_owner_id,
    'project_id',p_project_id,
    'company_id',p_company_id,
    'business_id',p_business_id,
    'account_id',p_account_id,
    'environment',p_environment
  );
end $$;
revoke all on function public.command_center_boundary_check(uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.command_center_boundary_check(uuid,text,text,text,text,text,text) to authenticated;

-- Narrow future-multi-user read path for the durable project registry. Existing
-- direct table RLS remains owner-only; this RPC can additionally admit a scoped
-- future principal without weakening that table policy.
create or replace function public.command_center_project_profile_get_scoped(
  p_owner_id uuid,
  p_project_id text
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  r public.command_center_project_profiles%rowtype;
begin
  if p_owner_id is null or coalesce(btrim(p_project_id),'')='' then
    raise exception 'Project not found or boundary denied' using errcode='42501';
  end if;

  select * into r
  from public.command_center_project_profiles p
  where p.owner_id=p_owner_id and p.project_id=btrim(p_project_id);

  if not found or not command_center_private.p26_boundary_scope_allowed(
    r.owner_id,r.project_id,r.company_id,null,null,null,'read'
  ) then
    raise exception 'Project not found or boundary denied' using errcode='42501';
  end if;

  return jsonb_build_object(
    'project_id',r.project_id,
    'company_id',r.company_id,
    'name',r.name,
    'mission',r.mission,
    'lifecycle',r.lifecycle,
    'status',r.status,
    'verification',r.verification,
    'priority',r.priority,
    'version',r.version,
    'protected',r.protected,
    'updated_at',r.updated_at
  );
end $$;
revoke all on function public.command_center_project_profile_get_scoped(uuid,text) from public,anon,authenticated;
grant execute on function public.command_center_project_profile_get_scoped(uuid,text) to authenticated;

-- Catalog assertions: this migration must never accidentally grant direct mutation
-- of scope grants or anonymous execution of the boundary RPC.
do $$
begin
  if has_table_privilege('authenticated','public.security_scope_grants','INSERT')
     or has_table_privilege('authenticated','public.security_scope_grants','UPDATE')
     or has_table_privilege('authenticated','public.security_scope_grants','DELETE') then
    raise exception 'P2.6 scope-grant mutation privilege is too broad';
  end if;
  if has_function_privilege('anon','public.command_center_boundary_check(uuid,text,text,text,text,text,text)','EXECUTE') then
    raise exception 'P2.6 anonymous boundary RPC execution is forbidden';
  end if;
end $$;
