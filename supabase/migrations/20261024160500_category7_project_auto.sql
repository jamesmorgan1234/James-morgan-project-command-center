-- Category 7 / P7.9 — exact-project durable Project Auto activation.
-- Branch-only migration. Activation locks one exact project/run/checkpoint/generation and returns working or a truthful blocker.

create table if not exists public.command_center_agency_project_auto_locks (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  agent_generation bigint not null check (agent_generation>=1),
  checkpoint_id uuid not null,
  state text not null check (state in ('active','released')),
  acquired_at timestamptz not null,
  released_at timestamptz,
  evidence_refs text[] not null,
  primary key(owner_id,project_id),
  unique(owner_id,run_id),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(checkpoint_id) references public.command_center_project_checkpoints(checkpoint_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check ((state='active' and released_at is null) or (state='released' and released_at is not null))
);

create table if not exists public.command_center_agency_project_auto_activations (
  activation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  result text not null check (result in ('working','blocked')),
  task_id text,
  executor_key text,
  blocker text,
  checkpoint_id uuid,
  agent_generation bigint,
  evidence_refs text[] not null,
  activated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check ((result='working' and task_id is not null and executor_key is not null and blocker is null and checkpoint_id is not null and agent_generation is not null)
      or (result='blocked' and blocker is not null and task_id is null and executor_key is null)),
  check (activated_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_project_auto_activation_idx
  on public.command_center_agency_project_auto_activations(owner_id,project_id,activated_at desc,activation_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_project_auto_locks','command_center_agency_project_auto_activations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_activate_project_auto(
  p_project_id text,p_run_id text,p_expected_agent_generation bigint,p_now timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r public.command_center_agency_runs%rowtype;
  a public.command_center_agency_project_agents%rowtype;
  latest_cp uuid;
  ready_task record;
  chosen_executor record;
  v_blocker text;
  v_activation uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Project Auto activation evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Project Auto activation requires evidence'; end if;

  select * into r from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) for update;
  if not found then v_blocker:='project_auto_run_not_found';
  elsif r.control_mode<>'project_auto' then v_blocker:='project_auto_run_scope_mismatch';
  elsif r.state in ('completed','stopped','failed') then v_blocker:='project_auto_run_terminal';
  elsif r.stop_requested then v_blocker:='owner_stop_requested';
  elsif r.pause_requested then v_blocker:='owner_pause_requested';
  elsif r.checkpoint_id is null then v_blocker:='verified_checkpoint_missing';
  end if;

  if v_blocker is null then
    select * into a from public.command_center_agency_project_agents where owner_id=u and project_id=r.project_id for update;
    if not found or a.state='retired' then v_blocker:='project_agent_unavailable';
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

  if v_blocker is null and exists(select 1 from public.command_center_agency_project_auto_locks l where l.owner_id=u and l.project_id=r.project_id and l.state='active' and l.run_id<>r.run_id) then
    v_blocker:='project_locked_by_other_run';
  end if;

  if v_blocker is null then
    select t.task_id,t.capability,t.risk,t.preferred_environment
    into ready_task
    from public.command_center_agency_scheduled_tasks t
    where t.owner_id=u and t.project_id=r.project_id and t.run_ref=r.run_id and t.state in ('pending','ready')
      and not exists(
        select 1 from public.command_center_agency_task_dependencies d
        join public.command_center_agency_scheduled_tasks p on p.owner_id=d.owner_id and p.project_id=d.project_id and p.task_id=d.dependency_task_id
        where d.owner_id=t.owner_id and d.project_id=t.project_id and d.task_id=t.task_id and p.state not in ('verified','skipped')
      )
    order by t.priority asc,t.created_sequence asc,t.task_id asc
    limit 1;
    if ready_task.task_id is null then v_blocker:='no_ready_task'; end if;
  end if;

  if v_blocker is null then
    select e.executor_key
    into chosen_executor
    from public.command_center_agency_executors e
    where e.owner_id=u and e.enabled and e.retired_at is null and e.health not in ('unavailable','unconfigured')
      and ready_task.capability=any(e.capabilities)
      and ready_task.preferred_environment=any(e.environments)
      and (cardinality(e.project_type_keys)=0 or exists(select 1 from public.command_center_project_profiles pp where pp.owner_id=u and pp.project_id=r.project_id and pp.type_key=any(e.project_type_keys)))
      and e.cost_class<>'paid'
      and (case ready_task.risk when 'low' then 0 when 'medium' then 1 when 'high' then 2 else 3 end)
          <= (case e.max_risk when 'low' then 0 when 'medium' then 1 else 2 end)
    order by case e.cost_class when 'free' then 0 else 1 end,e.executor_key
    limit 1;
    if chosen_executor.executor_key is null then v_blocker:='no_eligible_executor'; end if;
  end if;

  if v_blocker is not null then
    insert into public.command_center_agency_project_auto_activations(owner_id,project_id,run_id,result,blocker,evidence_refs,activated_at)
    values(u,btrim(p_project_id),btrim(p_run_id),'blocked',v_blocker,p_evidence_refs,p_now) returning activation_id into v_activation;
    return jsonb_build_object('activation_id',v_activation,'state','blocked','project_id',btrim(p_project_id),'run_id',btrim(p_run_id),'blocker',v_blocker);
  end if;

  insert into public.command_center_agency_project_auto_locks(owner_id,project_id,run_id,agent_generation,checkpoint_id,state,acquired_at,evidence_refs)
  values(u,r.project_id,r.run_id,a.generation,r.checkpoint_id,'active',p_now,p_evidence_refs)
  on conflict(owner_id,project_id) do update set run_id=excluded.run_id,agent_generation=excluded.agent_generation,checkpoint_id=excluded.checkpoint_id,state='active',acquired_at=excluded.acquired_at,released_at=null,evidence_refs=excluded.evidence_refs
  where public.command_center_agency_project_auto_locks.run_id=excluded.run_id or public.command_center_agency_project_auto_locks.state='released';

  if not exists(select 1 from public.command_center_agency_project_auto_locks where owner_id=u and project_id=r.project_id and run_id=r.run_id and state='active') then
    raise exception 'Project Auto lock acquisition failed';
  end if;

  update public.command_center_agency_runs set state='working',updated_at=p_now where owner_id=u and project_id=r.project_id and run_id=r.run_id and state in ('draft','queued','blocked','needs_user','paused');
  update public.command_center_agency_project_agents set state='working',active_run_ref=r.run_id,updated_at=p_now,recorded_at=now() where owner_id=u and project_id=r.project_id and generation=a.generation;

  insert into public.command_center_agency_project_auto_activations(owner_id,project_id,run_id,result,task_id,executor_key,checkpoint_id,agent_generation,evidence_refs,activated_at)
  values(u,r.project_id,r.run_id,'working',ready_task.task_id,chosen_executor.executor_key,r.checkpoint_id,a.generation,p_evidence_refs,p_now) returning activation_id into v_activation;

  return jsonb_build_object('activation_id',v_activation,'state','working','project_id',r.project_id,'run_id',r.run_id,'task_id',ready_task.task_id,'executor_key',chosen_executor.executor_key,'checkpoint_id',r.checkpoint_id,'agent_generation',a.generation);
end $$;

revoke all on function public.command_center_agency_activate_project_auto(text,text,bigint,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_activate_project_auto(text,text,bigint,timestamptz,text[]) to authenticated;
