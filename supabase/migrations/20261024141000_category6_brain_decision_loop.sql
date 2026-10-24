-- Category 6 / P6.1 — durable Brain decision loop.
-- Branch-only migration. No production state is changed by committing this file.
-- Brain decisions record reasoning-state transitions and evidence; protected side effects remain separately gated.

create table if not exists public.command_center_brain_decisions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  decision_id uuid primary key default gen_random_uuid(),
  project_id text,
  request_kind text not null,
  input_ref text not null,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  stage text not null default 'perceive' check (stage in ('perceive','context','plan','route','act','respond','learn','completed','needs_owner','failed','cancelled')),
  provider_route_ref text,
  context_snapshot_id uuid,
  plan_ref text,
  response_ref text,
  learning_ref text,
  blocker text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (project_id is not null or request_kind like 'owner.%'),
  check (length(btrim(request_kind)) between 1 and 160),
  check (length(btrim(input_ref)) between 1 and 1000),
  check (updated_at>=created_at),
  check ((stage='completed' and completed_at is not null) or (stage<>'completed' and completed_at is null))
);

create table if not exists public.command_center_brain_decision_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  decision_id uuid not null references public.command_center_brain_decisions(decision_id) on delete cascade,
  project_id text,
  from_stage text,
  to_stage text not null,
  evidence_refs text[] not null,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail)='object'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_brain_decisions_project_idx
  on public.command_center_brain_decisions(owner_id,project_id,updated_at desc,decision_id);
create index if not exists command_center_brain_decision_events_idx
  on public.command_center_brain_decision_events(owner_id,decision_id,occurred_at,event_id);

-- Browser roles inspect Brain evidence but do not directly mutate the decision ledger.
do $$
declare t text;
begin
  foreach t in array array['command_center_brain_decisions','command_center_brain_decision_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_start_decision(
  p_project_id text,
  p_request_kind text,
  p_input_ref text,
  p_input_hash text,
  p_risk_level text,
  p_evidence_refs text[],
  p_occurred_at timestamptz
)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; v_project text:=nullif(btrim(coalesce(p_project_id,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_project is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Project not found'; end if;
  if v_project is null and coalesce(btrim(p_request_kind),'') not like 'owner.%' then raise exception 'Non-owner Brain request requires project scope'; end if;
  if coalesce(btrim(p_request_kind),'')='' or coalesce(btrim(p_input_ref),'')='' then raise exception 'Brain request kind and input reference are required'; end if;
  if coalesce(p_input_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Brain input hash must be SHA-256 hex'; end if;
  if p_risk_level not in ('low','medium','high','critical') then raise exception 'Invalid Brain risk level'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Brain decision evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Brain decision start requires evidence'; end if;
  insert into public.command_center_brain_decisions(owner_id,project_id,request_kind,input_ref,input_hash,risk_level)
  values(u,v_project,btrim(p_request_kind),btrim(p_input_ref),p_input_hash,p_risk_level)
  returning decision_id into v_id;
  insert into public.command_center_brain_decision_events(owner_id,decision_id,project_id,from_stage,to_stage,evidence_refs,occurred_at)
  values(u,v_id,v_project,null,'perceive',p_evidence_refs,p_occurred_at);
  return v_id;
end $$;

create or replace function public.command_center_brain_advance_decision(
  p_decision_id uuid,
  p_to_stage text,
  p_evidence_refs text[],
  p_detail jsonb,
  p_provider_route_ref text,
  p_context_snapshot_id uuid,
  p_plan_ref text,
  p_response_ref text,
  p_learning_ref text,
  p_blocker text,
  p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.command_center_brain_decisions%rowtype; v_to text:=btrim(coalesce(p_to_stage,'')); expected text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into d from public.command_center_brain_decisions where owner_id=u and decision_id=p_decision_id for update;
  if not found then raise exception 'Brain decision not found'; end if;
  if d.stage in ('completed','failed','cancelled') then raise exception 'Terminal Brain decision cannot advance'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Brain transition evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Brain transition requires evidence'; end if;

  expected:=case d.stage
    when 'perceive' then 'context'
    when 'context' then 'plan'
    when 'plan' then 'route'
    when 'route' then 'act'
    when 'act' then 'respond'
    when 'respond' then 'learn'
    when 'learn' then 'completed'
    when 'needs_owner' then 'context'
    else null end;

  if v_to not in ('needs_owner','failed','cancelled') and v_to<>expected then
    raise exception 'Invalid Brain decision transition: % -> %',d.stage,v_to;
  end if;
  if v_to='needs_owner' and coalesce(btrim(p_blocker),'')='' then raise exception 'needs_owner requires blocker detail'; end if;
  if v_to='route' and coalesce(btrim(p_provider_route_ref),'')='' then raise exception 'route stage requires provider-route reference'; end if;
  if v_to='plan' and coalesce(btrim(p_plan_ref),'')='' then raise exception 'plan stage requires plan reference'; end if;
  if v_to='respond' and coalesce(btrim(p_response_ref),'')='' then raise exception 'respond stage requires response reference'; end if;
  if v_to='learn' and coalesce(btrim(p_learning_ref),'')='' then raise exception 'learn stage requires learning reference'; end if;

  update public.command_center_brain_decisions set
    stage=v_to,
    provider_route_ref=coalesce(nullif(btrim(coalesce(p_provider_route_ref,'')),''),provider_route_ref),
    context_snapshot_id=coalesce(p_context_snapshot_id,context_snapshot_id),
    plan_ref=coalesce(nullif(btrim(coalesce(p_plan_ref,'')),''),plan_ref),
    response_ref=coalesce(nullif(btrim(coalesce(p_response_ref,'')),''),response_ref),
    learning_ref=coalesce(nullif(btrim(coalesce(p_learning_ref,'')),''),learning_ref),
    blocker=case when v_to='needs_owner' then btrim(p_blocker) else null end,
    updated_at=now(),
    completed_at=case when v_to='completed' then now() else null end
  where owner_id=u and decision_id=d.decision_id;

  insert into public.command_center_brain_decision_events(owner_id,decision_id,project_id,from_stage,to_stage,evidence_refs,detail,occurred_at)
  values(u,d.decision_id,d.project_id,d.stage,v_to,p_evidence_refs,coalesce(p_detail,'{}'::jsonb),p_occurred_at);

  return jsonb_build_object('decision_id',d.decision_id,'from_stage',d.stage,'stage',v_to,'project_id',d.project_id);
end $$;

revoke all on function public.command_center_brain_start_decision(text,text,text,text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_brain_advance_decision(uuid,text,text[],jsonb,text,uuid,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.command_center_brain_start_decision(text,text,text,text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_brain_advance_decision(uuid,text,text[],jsonb,text,uuid,text,text,text,text,timestamptz) to authenticated;
