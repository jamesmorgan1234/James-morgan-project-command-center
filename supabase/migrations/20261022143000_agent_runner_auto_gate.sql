create table if not exists public.agent_runner_controls (
  owner_id uuid primary key,
  auto_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'system'
);

insert into public.agent_runner_controls(owner_id, auto_enabled, updated_by)
select distinct owner_id, false, 'migration_default_off'
from public.agent_sessions
on conflict (owner_id) do nothing;

create or replace function public.command_center_agent_service_get_auto(p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select coalesce((select c.auto_enabled from public.agent_runner_controls c where c.owner_id=p_owner_id),false);
$$;

create or replace function public.command_center_agent_service_set_auto(
  p_owner_id uuid,
  p_enabled boolean,
  p_updated_by text default 'command_center'
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare caller uuid := auth.uid();
begin
  if caller is null or caller <> p_owner_id then
    raise exception 'authenticated owner session required';
  end if;
  if not public.command_center_agent_service_owner_active(p_owner_id) then
    raise exception 'owner is not active';
  end if;
  insert into public.agent_runner_controls(owner_id,auto_enabled,updated_at,updated_by)
  values(p_owner_id,coalesce(p_enabled,false),now(),coalesce(nullif(p_updated_by,''),'command_center'))
  on conflict(owner_id) do update set auto_enabled=excluded.auto_enabled,updated_at=excluded.updated_at,updated_by=excluded.updated_by;
  return jsonb_build_object('owner_id',p_owner_id,'auto_enabled',coalesce(p_enabled,false),'updated_at',now());
end $$;

create or replace function public.command_center_agent_service_list_runnable(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare outj jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'session_id',s.id,'owner_id',s.owner_id,'objective',s.objective,'scope_mode',s.scope_mode,
    'primary_project_id',s.primary_project_id,'current_project_id',s.current_project_id,
    'current_step_id',s.current_step_id,'status',s.status,'dry_run',s.dry_run,
    'pause_requested',s.pause_requested,'cancel_requested',s.cancel_requested,
    'exact_next_action',s.exact_next_action,'permission_envelope',s.permission_envelope,
    'execution_policy',s.execution_policy,'updated_at',s.updated_at
  ) order by s.updated_at),'[]'::jsonb) into outj
  from (
    select x.* from public.agent_sessions x
    where x.status in ('draft','active','blocked','needs_user_action','partially_completed')
      and not x.cancel_requested
      and public.command_center_agent_service_owner_active(x.owner_id)
      and public.command_center_agent_service_get_auto(x.owner_id)
    order by case when x.status='active' then 0 when x.status='draft' then 1 else 2 end,x.updated_at
    limit greatest(1,least(coalesce(p_limit,20),100))
  ) s;
  return outj;
end $$;