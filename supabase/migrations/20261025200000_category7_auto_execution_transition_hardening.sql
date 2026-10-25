-- Category 7 post-audit hardening — P7.1/P7.9/P7.10 auto-execution transition integrity.
-- Branch-only migration. Project Auto and Agent Auto must use the canonical durable run-transition
-- contract; planning is not execution, draft runs cannot jump directly to Working, and every real
-- state transition keeps the P7.1 state-event/evidence trail intact.

alter table public.command_center_agency_agent_auto_decisions
  add column if not exists dispatch_state text not null default 'planned',
  add column if not exists run_id text,
  add column if not exists task_id text,
  add column if not exists executor_key text,
  add column if not exists dispatch_blocker text,
  add column if not exists dispatched_at timestamptz;

alter table public.command_center_agency_agent_auto_decisions
  drop constraint if exists command_center_agency_agent_auto_decisions_dispatch_state_check;
alter table public.command_center_agency_agent_auto_decisions
  add constraint command_center_agency_agent_auto_decisions_dispatch_state_check
  check (dispatch_state in ('planned','working','blocked'));

alter table public.command_center_agency_agent_auto_decisions
  drop constraint if exists command_center_agency_agent_auto_decisions_dispatch_shape_check;
alter table public.command_center_agency_agent_auto_decisions
  add constraint command_center_agency_agent_auto_decisions_dispatch_shape_check
  check (
    (dispatch_state='planned' and run_id is null and task_id is null and executor_key is null and dispatch_blocker is null and dispatched_at is null)
    or
    (dispatch_state='working' and run_id is not null and task_id is not null and executor_key is not null and dispatch_blocker is null and dispatched_at is not null)
    or
    (dispatch_state='blocked' and dispatch_blocker is not null and task_id is null and executor_key is null and dispatched_at is not null)
  );

create table if not exists public.command_center_agency_agent_auto_dispatch_events (
  dispatch_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  cycle_id uuid not null references public.command_center_agency_agent_auto_cycles(cycle_id) on delete cascade,
  decision_id uuid not null references public.command_center_agency_agent_auto_decisions(decision_id) on delete cascade,
  project_id text not null,
  result text not null check (result in ('working','blocked')),
  run_id text,
  task_id text,
  executor_key text,
  blocker text,
  authorization_ref text,
  checkpoint_id uuid,
  project_agent_generation bigint,
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,cycle_id,decision_id),
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes'),
  check (
    (result='working' and run_id is not null and task_id is not null and executor_key is not null and blocker is null and authorization_ref is not null and checkpoint_id is not null and project_agent_generation is not null)
    or
    (result='blocked' and blocker is not null and task_id is null and executor_key is null)
  )
);

alter table public.command_center_agency_agent_auto_dispatch_events enable row level security;
revoke all on table public.command_center_agency_agent_auto_dispatch_events from public,anon,authenticated;
grant select on table public.command_center_agency_agent_auto_dispatch_events to authenticated;
drop policy if exists c7_owner_select_command_center_agency_agent_auto_dispatch_events on public.command_center_agency_agent_auto_dispatch_events;
create policy c7_owner_select_command_center_agency_agent_auto_dispatch_events
  on public.command_center_agency_agent_auto_dispatch_events for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

-- Replace the P7.9 activation RPC so Project Auto no longer bypasses the canonical P7.1 transition
-- function. A draft run is truthful-but-not-dispatchable until it has been explicitly queued.
create or replace function public.command_center_agency_activate_project_auto(
  p_project_id text,p_run_id text,p_expected_agent_generation bigint,p_now timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r public.command_center_agency_runs%rowtype;
  a public.command_center_agency_project_agents%rowtype;
  latest_cp uuid;
  v_task_id text;
  v_capability text;
  v_risk text;
  v_environment text;
  v_executor_key text;
  v_blocker text;
  v_activation uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Project Auto activation evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Project Auto activation requires evidence'; end if;

  select * into r from public.command_center_agency_runs
  where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) for update;
  if not found then v_blocker:='project_auto_run_not_found';
  elsif r.control_mode<>'project_auto' then v_blocker:='project_auto_run_scope_mismatch';
  elsif r.state in ('completed','stopped','failed') then v_blocker:='project_auto_run_terminal';
  elsif r.state='draft' then v_blocker:='project_auto_run_not_queued';
  elsif r.stop_requested then v_blocker:='owner_stop_requested';
  elsif r.pause_requested then v_blocker:='owner_pause_requested';
  elsif r.checkpoint_id is null then v_blocker:='verified_checkpoint_missing';
  end if;

  if v_blocker is null then
    select * into a from public.command_center_agency_project_agents
    where owner_id=u and project_id=r.project_id for update;
    if not found or a.state in ('retired','blocked') then v_blocker:='project_agent_unavailable';
    elsif a.generation<>p_expected_agent_generation then v_blocker:='project_agent_generation_mismatch';
    elsif a.checkpoint_id is distinct from r.checkpoint_id then v_blocker:='project_agent_checkpoint_mismatch';
    end if;
  end if;

  if v_blocker is null then
    select checkpoint_id into latest_cp
    from public.command_center_project_checkpoints
    where owner_id=u and project_id=r.project_id
    order by created_at desc,checkpoint_id desc limit 1;
    if latest_cp is distinct from r.checkpoint_id then v_blocker:='run_not_at_latest_verified_checkpoint'; end if;
  end if;

  if v_blocker is null and exists(
    select 1 from public.command_center_agency_project_auto_locks l
    where l.owner_id=u and l.project_id=r.project_id and l.state='active' and l.run_id<>r.run_id
  ) then v_blocker:='project_locked_by_other_run'; end if;

  if v_blocker is null then
    select t.task_id,t.capability,t.risk,t.preferred_environment
      into v_task_id,v_capability,v_risk,v_environment
    from public.command_center_agency_scheduled_tasks t
    where t.owner_id=u and t.project_id=r.project_id and t.run_ref=r.run_id and t.state in ('pending','ready')
      and not exists(
        select 1 from public.command_center_agency_task_dependencies d
        join public.command_center_agency_scheduled_tasks p
          on p.owner_id=d.owner_id and p.project_id=d.project_id and p.task_id=d.dependency_task_id
        where d.owner_id=t.owner_id and d.project_id=t.project_id and d.task_id=t.task_id
          and p.state not in ('verified','skipped')
      )
    order by t.priority asc,t.created_sequence asc,t.task_id asc
    limit 1;
    if v_task_id is null then v_blocker:='no_ready_task'; end if;
  end if;

  if v_blocker is null then
    select e.executor_key into v_executor_key
    from public.command_center_agency_executors e
    where e.owner_id=u and e.enabled and e.retired_at is null
      and e.health not in ('unavailable','unconfigured')
      and v_capability=any(e.capabilities)
      and v_environment=any(e.environments)
      and (cardinality(e.project_type_keys)=0 or exists(
        select 1 from public.command_center_project_profiles pp
        where pp.owner_id=u and pp.project_id=r.project_id and pp.type_key=any(e.project_type_keys)
      ))
      and e.cost_class<>'paid'
      and (case v_risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end)
          <= (case e.max_risk when 'low' then 0 when 'medium' then 1 else 2 end)
    order by case e.cost_class when 'free' then 0 else 1 end,e.executor_key
    limit 1;
    if v_executor_key is null then v_blocker:='no_eligible_executor'; end if;
  end if;

  if v_blocker is not null then
    insert into public.command_center_agency_project_auto_activations(owner_id,project_id,run_id,result,blocker,evidence_refs,activated_at)
    values(u,btrim(p_project_id),btrim(p_run_id),'blocked',v_blocker,p_evidence_refs,p_now)
    returning activation_id into v_activation;
    return jsonb_build_object('activation_id',v_activation,'state','blocked','project_id',btrim(p_project_id),'run_id',btrim(p_run_id),'blocker',v_blocker);
  end if;

  insert into public.command_center_agency_project_auto_locks(owner_id,project_id,run_id,agent_generation,checkpoint_id,state,acquired_at,evidence_refs)
  values(u,r.project_id,r.run_id,a.generation,r.checkpoint_id,'active',p_now,p_evidence_refs)
  on conflict(owner_id,project_id) do update
    set run_id=excluded.run_id,agent_generation=excluded.agent_generation,checkpoint_id=excluded.checkpoint_id,
        state='active',acquired_at=excluded.acquired_at,released_at=null,evidence_refs=excluded.evidence_refs
  where public.command_center_agency_project_auto_locks.run_id=excluded.run_id
     or public.command_center_agency_project_auto_locks.state='released';

  if not exists(
    select 1 from public.command_center_agency_project_auto_locks
    where owner_id=u and project_id=r.project_id and run_id=r.run_id and state='active'
  ) then raise exception 'Project Auto lock acquisition failed'; end if;

  if r.state<>'working' then
    perform public.command_center_agency_transition_run(
      r.run_id,r.generation,'working',null,'{}'::text[],p_evidence_refs,p_now
    );
  end if;

  update public.command_center_agency_project_agents
  set state='working',active_run_ref=r.run_id,updated_at=p_now,recorded_at=now()
  where owner_id=u and project_id=r.project_id and generation=a.generation;

  insert into public.command_center_agency_project_auto_activations(
    owner_id,project_id,run_id,result,task_id,executor_key,checkpoint_id,agent_generation,evidence_refs,activated_at
  ) values(
    u,r.project_id,r.run_id,'working',v_task_id,v_executor_key,r.checkpoint_id,a.generation,p_evidence_refs,p_now
  ) returning activation_id into v_activation;

  return jsonb_build_object(
    'activation_id',v_activation,'state','working','project_id',r.project_id,'run_id',r.run_id,
    'task_id',v_task_id,'executor_key',v_executor_key,'checkpoint_id',r.checkpoint_id,'agent_generation',a.generation
  );
end $$;

revoke all on function public.command_center_agency_activate_project_auto(text,text,bigint,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_activate_project_auto(text,text,bigint,timestamptz,text[]) to authenticated;

-- P7.10 dispatch is deliberately separate from planning. It revalidates every selected project at
-- execution time, then uses the same project lock + canonical P7.1 run-transition contract.
create or replace function public.command_center_agency_dispatch_agent_auto_cycle(
  p_cycle_id uuid,p_now timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  c public.command_center_agency_agent_auto_cycles%rowtype;
  d public.command_center_agency_agent_auto_decisions%rowtype;
  pp public.command_center_project_profiles%rowtype;
  a public.command_center_agency_project_agents%rowtype;
  r public.command_center_agency_runs%rowtype;
  v_auth_ref text;
  v_latest_checkpoint uuid;
  v_run_count integer;
  v_task_id text;
  v_capability text;
  v_risk text;
  v_environment text;
  v_executor_key text;
  v_blocker text;
  v_working integer:=0;
  v_blocked integer:=0;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Agent Auto dispatch evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Agent Auto dispatch requires evidence'; end if;

  select * into c from public.command_center_agency_agent_auto_cycles
  where owner_id=u and cycle_id=p_cycle_id for update;
  if not found then raise exception 'Agent Auto cycle not found'; end if;

  if exists(
    select 1 from unnest(c.selected_project_ids) as selected(project_id)
    where not exists(
      select 1 from public.command_center_agency_agent_auto_decisions x
      where x.owner_id=u and x.cycle_id=c.cycle_id and x.project_id=selected.project_id and x.eligible
    )
  ) then raise exception 'Agent Auto cycle contains a selected project without an eligible decision'; end if;

  for d in
    select x.*
    from unnest(c.selected_project_ids) with ordinality as selected(project_id,ordinality)
    join public.command_center_agency_agent_auto_decisions x
      on x.owner_id=u and x.cycle_id=c.cycle_id and x.project_id=selected.project_id and x.eligible
    order by selected.ordinality,x.project_id
    for update of x
  loop
    if d.dispatch_state<>'planned' then continue; end if;

    v_auth_ref:=null;
    v_latest_checkpoint:=null;
    v_run_count:=0;
    v_task_id:=null;
    v_capability:=null;
    v_risk:=null;
    v_environment:=null;
    v_executor_key:=null;
    v_blocker:=null;
    r:=null;
    a:=null;
    pp:=null;

    select * into pp from public.command_center_project_profiles
    where owner_id=u and project_id=d.project_id;
    if not found or pp.lifecycle<>'active' then v_blocker:='project_not_active';
    elsif pp.verification='blocked' then v_blocker:='project_verification_blocked';
    elsif pp.type_key like 'project-type:book%' then v_blocker:='books_portfolio_auto_excluded';
    elsif pp.priority<>d.stored_priority then v_blocker:='portfolio_priority_changed_replan_required';
    end if;

    if v_blocker is null then
      select pa.owner_decision_ref into v_auth_ref
      from public.command_center_project_authorizations pa
      where pa.owner_id=u and pa.project_id=d.project_id
        and pa.authorization_key='project-auth:agent-auto' and pa.state='enabled';
      if v_auth_ref is null or v_auth_ref is distinct from d.authorization_ref then
        v_blocker:='agent_auto_authorization_changed_or_revoked';
      end if;
    end if;

    if v_blocker is null then
      select * into a from public.command_center_agency_project_agents
      where owner_id=u and project_id=d.project_id for update;
      if not found or a.state in ('retired','blocked') then v_blocker:='project_agent_unavailable';
      elsif a.generation is distinct from d.project_agent_generation then v_blocker:='project_agent_generation_changed_replan_required';
      end if;
    end if;

    if v_blocker is null and exists(
      select 1 from public.command_center_agency_project_auto_locks l
      where l.owner_id=u and l.project_id=d.project_id and l.state='active'
    ) then v_blocker:='project_already_locked'; end if;

    if v_blocker is null then
      select count(*) into v_run_count
      from public.command_center_agency_runs x
      where x.owner_id=u and x.project_id=d.project_id and x.control_mode='agent_auto'
        and x.state in ('draft','queued','blocked','needs_user','paused','working')
        and not x.stop_requested and not x.pause_requested;
      if v_run_count=0 then v_blocker:='agent_auto_run_missing';
      elsif v_run_count>1 then v_blocker:='ambiguous_agent_auto_run';
      else
        select * into r from public.command_center_agency_runs x
        where x.owner_id=u and x.project_id=d.project_id and x.control_mode='agent_auto'
          and x.state in ('draft','queued','blocked','needs_user','paused','working')
          and not x.stop_requested and not x.pause_requested
        order by x.updated_at desc,x.run_id limit 1 for update;
        if r.authorization_ref is distinct from v_auth_ref then v_blocker:='agent_auto_run_authorization_mismatch';
        elsif r.state='draft' then v_blocker:='agent_auto_run_not_queued';
        elsif r.checkpoint_id is null then v_blocker:='verified_checkpoint_missing';
        elsif a.checkpoint_id is distinct from r.checkpoint_id then v_blocker:='project_agent_checkpoint_mismatch';
        end if;
      end if;
    end if;

    if v_blocker is null then
      select checkpoint_id into v_latest_checkpoint
      from public.command_center_project_checkpoints
      where owner_id=u and project_id=d.project_id
      order by created_at desc,checkpoint_id desc limit 1;
      if v_latest_checkpoint is distinct from r.checkpoint_id then v_blocker:='run_not_at_latest_verified_checkpoint'; end if;
    end if;

    if v_blocker is null then
      select t.task_id,t.capability,t.risk,t.preferred_environment
        into v_task_id,v_capability,v_risk,v_environment
      from public.command_center_agency_scheduled_tasks t
      where t.owner_id=u and t.project_id=d.project_id and t.run_ref=r.run_id and t.state in ('pending','ready')
        and not exists(
          select 1 from public.command_center_agency_task_dependencies dep
          join public.command_center_agency_scheduled_tasks prereq
            on prereq.owner_id=dep.owner_id and prereq.project_id=dep.project_id and prereq.task_id=dep.dependency_task_id
          where dep.owner_id=t.owner_id and dep.project_id=t.project_id and dep.task_id=t.task_id
            and prereq.state not in ('verified','skipped')
        )
      order by t.priority asc,t.created_sequence asc,t.task_id asc limit 1;
      if v_task_id is null then v_blocker:='no_ready_task'; end if;
    end if;

    if v_blocker is null then
      select e.executor_key into v_executor_key
      from public.command_center_agency_executors e
      where e.owner_id=u and e.enabled and e.retired_at is null
        and e.health not in ('unavailable','unconfigured')
        and v_capability=any(e.capabilities)
        and v_environment=any(e.environments)
        and (cardinality(e.project_type_keys)=0 or pp.type_key=any(e.project_type_keys))
        and e.cost_class<>'paid'
        and (case v_risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end)
            <= (case e.max_risk when 'low' then 0 when 'medium' then 1 else 2 end)
      order by case e.cost_class when 'free' then 0 else 1 end,e.executor_key limit 1;
      if v_executor_key is null then v_blocker:='no_eligible_executor'; end if;
    end if;

    if v_blocker is null then
      insert into public.command_center_agency_project_auto_locks(
        owner_id,project_id,run_id,agent_generation,checkpoint_id,state,acquired_at,evidence_refs
      ) values(u,d.project_id,r.run_id,a.generation,r.checkpoint_id,'active',p_now,p_evidence_refs)
      on conflict(owner_id,project_id) do update
        set run_id=excluded.run_id,agent_generation=excluded.agent_generation,checkpoint_id=excluded.checkpoint_id,
            state='active',acquired_at=excluded.acquired_at,released_at=null,evidence_refs=excluded.evidence_refs
      where public.command_center_agency_project_auto_locks.state='released';

      if not exists(
        select 1 from public.command_center_agency_project_auto_locks l
        where l.owner_id=u and l.project_id=d.project_id and l.run_id=r.run_id and l.state='active'
      ) then v_blocker:='project_lock_acquisition_failed'; end if;
    end if;

    if v_blocker is null then
      if r.state<>'working' then
        perform public.command_center_agency_transition_run(
          r.run_id,r.generation,'working',null,'{}'::text[],p_evidence_refs,p_now
        );
      end if;

      update public.command_center_agency_project_agents
      set state='working',active_run_ref=r.run_id,updated_at=p_now,recorded_at=now()
      where owner_id=u and project_id=d.project_id and generation=a.generation;

      update public.command_center_agency_agent_auto_decisions
      set dispatch_state='working',run_id=r.run_id,task_id=v_task_id,executor_key=v_executor_key,
          dispatch_blocker=null,dispatched_at=p_now
      where owner_id=u and decision_id=d.decision_id;

      insert into public.command_center_agency_agent_auto_dispatch_events(
        owner_id,cycle_id,decision_id,project_id,result,run_id,task_id,executor_key,authorization_ref,
        checkpoint_id,project_agent_generation,evidence_refs,occurred_at
      ) values(
        u,c.cycle_id,d.decision_id,d.project_id,'working',r.run_id,v_task_id,v_executor_key,
        v_auth_ref,r.checkpoint_id,a.generation,p_evidence_refs,p_now
      );
      v_working:=v_working+1;
    else
      update public.command_center_agency_agent_auto_decisions
      set dispatch_state='blocked',run_id=r.run_id,task_id=null,executor_key=null,
          dispatch_blocker=v_blocker,dispatched_at=p_now
      where owner_id=u and decision_id=d.decision_id;

      insert into public.command_center_agency_agent_auto_dispatch_events(
        owner_id,cycle_id,decision_id,project_id,result,run_id,blocker,authorization_ref,evidence_refs,occurred_at
      ) values(
        u,c.cycle_id,d.decision_id,d.project_id,'blocked',r.run_id,v_blocker,v_auth_ref,p_evidence_refs,p_now
      );
      v_blocked:=v_blocked+1;
    end if;
  end loop;

  return jsonb_build_object(
    'cycle_id',c.cycle_id,'selected_count',cardinality(c.selected_project_ids),
    'working_count',v_working,'blocked_count',v_blocked
  );
end $$;

revoke all on function public.command_center_agency_dispatch_agent_auto_cycle(uuid,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_dispatch_agent_auto_cycle(uuid,timestamptz,text[]) to authenticated;
