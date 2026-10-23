alter table public.cc7_agent_controls
  add column if not exists boundary_sweep_enabled boolean not null default false,
  add column if not exists boundary_sweep_started_at timestamptz,
  add column if not exists boundary_sweep_current_project_id text,
  add column if not exists boundary_sweep_completed_project_ids text[] not null default '{}'::text[],
  add column if not exists boundary_sweep_skipped_project_ids text[] not null default '{}'::text[],
  add column if not exists boundary_sweep_last_completed_at timestamptz;

alter table public.cc7_agent_controls
  drop constraint if exists cc7_agent_controls_auto_mode_exclusive;
alter table public.cc7_agent_controls
  add constraint cc7_agent_controls_auto_mode_exclusive
  check (not (auto_enabled and boundary_sweep_enabled));

create or replace function public.cc7_agent_owner_set_auto(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_row public.cc7_agent_controls%rowtype;
  v_work_run uuid;
begin
  if v_owner is null then raise exception 'authenticated owner required'; end if;
  if not exists (select 1 from public.cc7_owner_access a where a.owner_id=v_owner and a.enabled=true) then
    raise exception 'Command Center V7 owner access required';
  end if;

  if coalesce(p_enabled,false) then
    select r.id into v_work_run
    from public.cc7_agent_runs r
    where r.owner_id=v_owner and r.status='work_boundary'
    order by r.created_at asc
    limit 1;
  end if;

  insert into public.cc7_agent_controls(
    owner_id,auto_enabled,boundary_sweep_enabled,current_run_id,runner_state,updated_by,updated_at
  ) values(
    v_owner,coalesce(p_enabled,false),false,v_work_run,'idle','owner_ui_v7',now()
  )
  on conflict(owner_id) do update
    set auto_enabled=excluded.auto_enabled,
        boundary_sweep_enabled=case when excluded.auto_enabled then false else public.cc7_agent_controls.boundary_sweep_enabled end,
        boundary_sweep_current_project_id=case when excluded.auto_enabled then null else public.cc7_agent_controls.boundary_sweep_current_project_id end,
        current_run_id=case when excluded.auto_enabled and public.cc7_agent_controls.current_run_id is null then excluded.current_run_id else public.cc7_agent_controls.current_run_id end,
        updated_by='owner_ui_v7',
        updated_at=now()
  returning * into v_row;

  return jsonb_build_object(
    'ok',true,
    'auto_enabled',v_row.auto_enabled,
    'boundary_sweep_enabled',v_row.boundary_sweep_enabled,
    'runner_state',v_row.runner_state,
    'current_run_id',v_row.current_run_id
  );
end;
$function$;

create or replace function public.cc7_agent_owner_set_boundary_sweep(p_enabled boolean)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_row public.cc7_agent_controls%rowtype;
  v_active public.cc7_agent_runs%rowtype;
begin
  if v_owner is null then raise exception 'authenticated owner required'; end if;
  if not exists (select 1 from public.cc7_owner_access a where a.owner_id=v_owner and a.enabled=true) then
    raise exception 'Command Center V7 owner access required';
  end if;

  if coalesce(p_enabled,false) then
    select r.* into v_active
    from public.cc7_agent_runs r
    join public.cc7_agent_controls c on c.owner_id=v_owner and c.current_run_id=r.id
    where r.owner_id=v_owner and r.status in ('queued','working','paused')
    limit 1;
    if found then
      raise exception 'Stop or finish the current active Agent run before starting the portfolio Work-boundary sweep';
    end if;
  end if;

  insert into public.cc7_agent_controls(
    owner_id,auto_enabled,boundary_sweep_enabled,boundary_sweep_started_at,
    boundary_sweep_current_project_id,boundary_sweep_completed_project_ids,
    boundary_sweep_skipped_project_ids,runner_state,updated_by,updated_at
  ) values(
    v_owner,false,coalesce(p_enabled,false),
    case when p_enabled then now() else null end,
    null,'{}'::text[],'{}'::text[],
    case when p_enabled then 'ready' else 'idle' end,
    'owner_ui_v7',now()
  )
  on conflict(owner_id) do update
    set auto_enabled=case when excluded.boundary_sweep_enabled then false else public.cc7_agent_controls.auto_enabled end,
        boundary_sweep_enabled=excluded.boundary_sweep_enabled,
        boundary_sweep_started_at=case when excluded.boundary_sweep_enabled then now() else public.cc7_agent_controls.boundary_sweep_started_at end,
        boundary_sweep_current_project_id=null,
        boundary_sweep_completed_project_ids=case when excluded.boundary_sweep_enabled then '{}'::text[] else public.cc7_agent_controls.boundary_sweep_completed_project_ids end,
        boundary_sweep_skipped_project_ids=case when excluded.boundary_sweep_enabled then '{}'::text[] else public.cc7_agent_controls.boundary_sweep_skipped_project_ids end,
        runner_state=case when excluded.boundary_sweep_enabled then 'ready' else 'idle' end,
        updated_by='owner_ui_v7',
        updated_at=now()
  returning * into v_row;

  insert into public.cc7_agent_events(owner_id,kind,message,payload)
  values(
    v_owner,
    case when p_enabled then 'owner_boundary_sweep_on' else 'owner_boundary_sweep_off' end,
    case when p_enabled then 'Owner enabled sequential portfolio Work-boundary sweep.' else 'Owner disabled portfolio Work-boundary sweep.' end,
    jsonb_build_object('boundary_sweep_enabled',v_row.boundary_sweep_enabled,'auto_enabled',v_row.auto_enabled)
  );

  return jsonb_build_object(
    'ok',true,
    'auto_enabled',v_row.auto_enabled,
    'boundary_sweep_enabled',v_row.boundary_sweep_enabled,
    'runner_state',v_row.runner_state,
    'current_run_id',v_row.current_run_id
  );
end;
$function$;

create or replace function public.cc7_agent_owner_retry_work_rung(p_task_id uuid, p_rung text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_task public.cc7_agent_tasks%rowtype;
  v_rung text := lower(btrim(coalesce(p_rung,'')));
  v_failure text;
  v_approved boolean;
begin
  if v_owner is null then raise exception 'authenticated owner required'; end if;
  if not exists (select 1 from public.cc7_owner_access a where a.owner_id=v_owner and a.enabled=true) then
    raise exception 'Command Center V7 owner access required';
  end if;
  if v_rung not in ('luna_high','sol_light') then
    raise exception 'Manual Work retry is limited to Luna High or Sol Light';
  end if;

  select * into v_task
  from public.cc7_agent_tasks
  where id=p_task_id and owner_id=v_owner
  for update;
  if not found then raise exception 'V7 Agent task not found'; end if;
  if v_task.status in ('verified','completed','stopped') then
    raise exception 'A completed or stopped Work task cannot be retried';
  end if;

  v_failure := lower(coalesce(v_task.failure_class,''));
  if v_failure not in ('transient_network','provider_timeout','connection_error','provider_unavailable') then
    raise exception 'Manual rung retry is available only after a verified transient connection/provider failure';
  end if;

  select exists(
    select 1 from public.cc7_agent_approvals a
    where a.owner_id=v_owner and a.run_id=v_task.run_id
      and (a.task_id=v_task.id or a.task_id is null)
      and a.approval_type in ('work','work_ladder')
      and a.state='approved'
  ) into v_approved;
  if not v_approved then
    raise exception 'The exact Work task must already have owner Work approval before a manual rung retry';
  end if;

  update public.cc7_agent_tasks
  set status='pending',
      failure_class=null,
      evidence=jsonb_set(
        jsonb_set(coalesce(evidence,'{}'::jsonb),'{work_ladder,manual_retry_requested_rung}',to_jsonb(v_rung),true),
        '{work_ladder,manual_retry_requested_at}',to_jsonb(now()),true
      ),
      started_at=null,
      completed_at=null,
      updated_at=now()
  where id=v_task.id
  returning * into v_task;

  update public.cc7_agent_runs
  set status='queued',
      exact_next_action='Verify downstream state, then retry the owner-selected Work rung for the exact approved task.',
      updated_at=now()
  where id=v_task.run_id and owner_id=v_owner and status not in ('completed','stopped');

  update public.cc7_agent_controls
  set current_run_id=v_task.run_id,runner_state='ready',updated_by='owner_ui_v7',updated_at=now()
  where owner_id=v_owner;

  insert into public.cc7_agent_events(owner_id,run_id,task_id,kind,message,payload)
  values(v_owner,v_task.run_id,v_task.id,'owner_work_retry','Owner requested a manual retry of an already-approved Work rung.',jsonb_build_object('rung',v_rung));

  return jsonb_build_object('ok',true,'task',to_jsonb(v_task),'rung',v_rung);
end;
$function$;

grant execute on function public.cc7_agent_owner_set_boundary_sweep(boolean) to authenticated;
grant execute on function public.cc7_agent_owner_retry_work_rung(uuid,text) to authenticated;
