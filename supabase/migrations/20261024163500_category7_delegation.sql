-- Category 7 / P7.15 — durable bounded delegation for research/planning/build specialists.
-- Branch-only migration. Child authority/capability contracts are equal or narrower than parent and depth/fan-out are hard bounded.

create table if not exists public.command_center_agency_delegations (
  delegation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  parent_task_id text not null,
  child_task_id text not null,
  depth integer not null check (depth>=1),
  max_depth integer not null check (max_depth>=1),
  max_fan_out integer not null check (max_fan_out>=1),
  capability text not null check (length(btrim(capability)) between 1 and 240),
  parent_scopes text[] not null,
  child_scopes text[] not null,
  role_class text not null check (role_class in ('research','planning','build','verification','integration','other')),
  state text not null default 'active' check (state in ('active','completed','cancelled','failed')),
  evidence_refs text[] not null,
  delegated_at timestamptz not null,
  ended_at timestamptz,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(owner_id,project_id,parent_task_id) references public.command_center_agency_tasks(owner_id,project_id,task_id) on delete restrict,
  foreign key(owner_id,project_id,child_task_id) references public.command_center_agency_tasks(owner_id,project_id,task_id) on delete restrict,
  unique(owner_id,project_id,parent_task_id,child_task_id),
  check (parent_task_id<>child_task_id),
  check (cardinality(parent_scopes)>0),
  check (child_scopes <@ parent_scopes),
  check (cardinality(evidence_refs)>0),
  check ((state='active' and ended_at is null) or (state<>'active' and ended_at is not null)),
  check (delegated_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_delegations_parent_idx
  on public.command_center_agency_delegations(owner_id,project_id,parent_task_id,state,delegated_at);

alter table public.command_center_agency_delegations enable row level security;
revoke all on table public.command_center_agency_delegations from public,anon,authenticated;
grant select on table public.command_center_agency_delegations to authenticated;
drop policy if exists c7_owner_select_agency_delegations on public.command_center_agency_delegations;
create policy c7_owner_select_agency_delegations
  on public.command_center_agency_delegations for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_delegate_task(
  p_project_id text,p_run_id text,p_parent_task_id text,p_child_task_id text,p_parent_scopes text[],p_child_scopes text[],p_capability text,p_role_class text,p_max_depth integer,p_max_fan_out integer,p_evidence_refs text[],p_delegated_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  parent_task public.command_center_agency_tasks%rowtype;
  child_task public.command_center_agency_tasks%rowtype;
  parent_delegation public.command_center_agency_delegations%rowtype;
  v_depth integer;
  v_fan_out integer;
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into parent_task from public.command_center_agency_tasks where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) and task_id=btrim(p_parent_task_id);
  select * into child_task from public.command_center_agency_tasks where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) and task_id=btrim(p_child_task_id);
  if parent_task.task_id is null or child_task.task_id is null then raise exception 'Delegation tasks must exist in same project/run'; end if;
  if child_task.capability<>btrim(p_capability) then raise exception 'Delegated capability does not match child task'; end if;
  if p_role_class not in ('research','planning','build','verification','integration','other') then raise exception 'Invalid delegation role'; end if;
  if p_max_depth<1 or p_max_fan_out<1 then raise exception 'Delegation limits must be positive'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_parent_scopes,'Delegation parent scopes');
  perform command_center_private.c3_assert_unique_text_array(p_child_scopes,'Delegation child scopes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Delegation evidence');
  if cardinality(coalesce(p_parent_scopes,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Delegation requires parent authority and evidence'; end if;
  if not coalesce(p_child_scopes,'{}'::text[]) <@ p_parent_scopes then raise exception 'Delegation authority amplification blocked'; end if;

  select * into parent_delegation from public.command_center_agency_delegations
  where owner_id=u and project_id=btrim(p_project_id) and child_task_id=parent_task.task_id
  order by depth desc limit 1;
  v_depth:=coalesce(parent_delegation.depth,0)+1;
  if v_depth>p_max_depth then raise exception 'Delegation depth limit exceeded'; end if;
  select count(*)::integer into v_fan_out from public.command_center_agency_delegations
  where owner_id=u and project_id=btrim(p_project_id) and parent_task_id=parent_task.task_id and state='active';
  if v_fan_out>=p_max_fan_out then raise exception 'Delegation fan-out limit exceeded'; end if;
  if exists(
    with recursive ancestry(task_id) as (
      select parent_task.task_id
      union all
      select d.parent_task_id from public.command_center_agency_delegations d join ancestry a on d.child_task_id=a.task_id
      where d.owner_id=u and d.project_id=btrim(p_project_id)
    ) select 1 from ancestry where task_id=child_task.task_id
  ) then raise exception 'Delegation cycle detected'; end if;

  insert into public.command_center_agency_delegations(owner_id,project_id,run_id,parent_task_id,child_task_id,depth,max_depth,max_fan_out,capability,parent_scopes,child_scopes,role_class,evidence_refs,delegated_at)
  values(u,btrim(p_project_id),btrim(p_run_id),parent_task.task_id,child_task.task_id,v_depth,p_max_depth,p_max_fan_out,btrim(p_capability),p_parent_scopes,coalesce(p_child_scopes,'{}'::text[]),p_role_class,p_evidence_refs,p_delegated_at)
  returning delegation_id into v_id;
  return jsonb_build_object('delegation_id',v_id,'depth',v_depth,'fan_out_before',v_fan_out,'child_scopes',to_jsonb(coalesce(p_child_scopes,'{}'::text[])),'authority_amplified',false);
end $$;

revoke all on function public.command_center_agency_delegate_task(text,text,text,text,text[],text[],text,text,integer,integer,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_delegate_task(text,text,text,text,text[],text[],text,text,integer,integer,text[],timestamptz) to authenticated;
