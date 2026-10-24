-- Category 7 / P7.10 — durable Agent Auto portfolio eligibility and dispatch evidence.
-- Branch-only migration. Portfolio scheduling may use only verified stored priorities/policies and never auto-enroll Books.

create table if not exists public.command_center_agency_agent_auto_cycles (
  cycle_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  max_concurrency integer not null check (max_concurrency between 1 and 100),
  selected_project_ids text[] not null default '{}'::text[],
  evidence_refs text[] not null,
  started_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (cardinality(selected_project_ids)<=max_concurrency),
  check (started_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_agency_agent_auto_decisions (
  decision_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  cycle_id uuid not null references public.command_center_agency_agent_auto_cycles(cycle_id) on delete cascade,
  project_id text not null,
  stored_priority text not null check (stored_priority in ('critical','high','normal','low')),
  eligible boolean not null,
  reason text not null check (length(btrim(reason)) between 1 and 500),
  project_type_key text not null,
  authorization_ref text,
  project_agent_generation bigint,
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  unique(owner_id,cycle_id,project_id),
  check (cardinality(evidence_refs)>0),
  check (not eligible or (authorization_ref is not null and project_agent_generation is not null)),
  check (not (eligible and project_type_key like 'project-type:book%'))
);
create index if not exists command_center_agency_agent_auto_decisions_idx
  on public.command_center_agency_agent_auto_decisions(owner_id,cycle_id,eligible,stored_priority,project_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_agent_auto_cycles','command_center_agency_agent_auto_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_plan_agent_auto_cycle(
  p_max_concurrency integer,p_evidence_refs text[],p_started_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_cycle uuid;
  p record;
  v_eligible boolean;
  v_reason text;
  v_auth_ref text;
  v_generation bigint;
  selected text[]:='{}'::text[];
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_max_concurrency<1 or p_max_concurrency>100 then raise exception 'Agent Auto concurrency out of range'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Agent Auto cycle evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Agent Auto cycle requires evidence'; end if;

  insert into public.command_center_agency_agent_auto_cycles(owner_id,max_concurrency,evidence_refs,started_at)
  values(u,p_max_concurrency,p_evidence_refs,p_started_at) returning cycle_id into v_cycle;

  for p in
    select pp.project_id,pp.priority,pp.type_key,pp.lifecycle,pp.verification
    from public.command_center_project_profiles pp
    where pp.owner_id=u
    order by case pp.priority when 'critical' then 0 when 'high' then 1 when 'normal' then 2 else 3 end,pp.updated_at,pp.project_id
  loop
    v_eligible:=true; v_reason:='eligible'; v_auth_ref:=null; v_generation:=null;
    if p.lifecycle<>'active' then v_eligible:=false; v_reason:='project_not_active';
    elsif p.verification='blocked' then v_eligible:=false; v_reason:='project_verification_blocked';
    elsif p.type_key like 'project-type:book%' then v_eligible:=false; v_reason:='books_portfolio_auto_excluded';
    elsif not exists(select 1 from public.command_center_project_authorizations pa where pa.owner_id=u and pa.project_id=p.project_id and pa.authorization_key='project-auth:agent-auto' and pa.state='enabled') then v_eligible:=false; v_reason:='agent_auto_not_authorized';
    elsif not exists(select 1 from public.command_center_agency_project_agents a where a.owner_id=u and a.project_id=p.project_id and a.state not in ('retired','blocked')) then v_eligible:=false; v_reason:='project_agent_unavailable';
    elsif exists(select 1 from public.command_center_agency_project_auto_locks l where l.owner_id=u and l.project_id=p.project_id and l.state='active') then v_eligible:=false; v_reason:='project_already_locked';
    end if;

    if v_eligible and cardinality(selected)<p_max_concurrency then
      select pa.owner_decision_ref into v_auth_ref from public.command_center_project_authorizations pa where pa.owner_id=u and pa.project_id=p.project_id and pa.authorization_key='project-auth:agent-auto' and pa.state='enabled';
      select a.generation into v_generation from public.command_center_agency_project_agents a where a.owner_id=u and a.project_id=p.project_id and a.state not in ('retired','blocked');
      selected:=array_append(selected,p.project_id);
    elsif v_eligible then
      v_eligible:=false; v_reason:='portfolio_concurrency_limit';
    end if;

    insert into public.command_center_agency_agent_auto_decisions(owner_id,cycle_id,project_id,stored_priority,eligible,reason,project_type_key,authorization_ref,project_agent_generation,evidence_refs)
    values(u,v_cycle,p.project_id,p.priority,v_eligible,v_reason,p.type_key,v_auth_ref,v_generation,p_evidence_refs);
  end loop;

  update public.command_center_agency_agent_auto_cycles set selected_project_ids=selected where owner_id=u and cycle_id=v_cycle;
  return jsonb_build_object('cycle_id',v_cycle,'selected_project_ids',to_jsonb(selected),'selected_count',cardinality(selected),'max_concurrency',p_max_concurrency);
end $$;

revoke all on function public.command_center_agency_plan_agent_auto_cycle(integer,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_plan_agent_auto_cycle(integer,text[],timestamptz) to authenticated;
