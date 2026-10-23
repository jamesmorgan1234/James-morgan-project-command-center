create or replace function public.cc7_agent_owner_request_project_auto_recheck(p_project_id text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_controls public.cc7_agent_controls%rowtype;
  v_run public.cc7_agent_runs%rowtype;
  v_project public.cc7_projects%rowtype;
  v_task_id uuid;
begin
  if v_owner is null then raise exception 'authenticated owner required'; end if;
  if not exists (
    select 1 from public.cc7_owner_access a
    where a.owner_id=v_owner and a.enabled=true
  ) then raise exception 'Command Center V7 owner access required'; end if;
  if nullif(btrim(coalesce(p_project_id,'')),'') is null then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','project_required');
  end if;

  select * into v_project
  from public.cc7_projects
  where id=p_project_id and owner_id=v_owner;
  if not found then raise exception 'Selected V7 project was not found for this owner'; end if;
  if not coalesce(v_project.agent_access_enabled,true) then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','agent_access_disabled');
  end if;

  select * into v_controls
  from public.cc7_agent_controls
  where owner_id=v_owner
  for update;

  if not found then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','controls_missing');
  end if;

  if coalesce(v_controls.auto_enabled,false) or coalesce(v_controls.boundary_sweep_enabled,false) then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','conflicting_auto_mode');
  end if;

  if v_controls.current_run_id is not null then
    select * into v_run
    from public.cc7_agent_runs
    where id=v_controls.current_run_id
      and owner_id=v_owner
      and project_id=p_project_id
      and control_mode='project_auto'
      and status in ('needs_user','blocked')
      and coalesce(stop_requested,false)=false
      and coalesce(pause_requested,false)=false
    for update;
  end if;

  if not found then
    select * into v_run
    from public.cc7_agent_runs
    where owner_id=v_owner
      and project_id=p_project_id
      and control_mode='project_auto'
      and status in ('needs_user','blocked')
      and coalesce(stop_requested,false)=false
      and coalesce(pause_requested,false)=false
    order by created_at desc
    limit 1
    for update;
  end if;

  if not found then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','no_recheckable_project_auto_run');
  end if;

  select t.id into v_task_id
  from public.cc7_agent_tasks t
  where t.owner_id=v_owner
    and t.run_id=v_run.id
    and t.status in ('needs_user','blocked')
  order by t.position asc
  limit 1
  for update;

  if v_task_id is not null then
    update public.cc7_agent_tasks
    set status='pending', failure_class=null, completed_at=null, updated_at=now()
    where id=v_task_id and owner_id=v_owner;
  end if;

  update public.cc7_agent_runs
  set status='queued',
      exact_next_action='Re-verify the owner-completed external step against current live state. If verified, continue this same Project Auto run; otherwise return to the exact blocker without switching projects.',
      completed_at=null,
      updated_at=now()
  where id=v_run.id and owner_id=v_owner;

  update public.cc7_agent_controls
  set auto_enabled=false,
      boundary_sweep_enabled=false,
      boundary_sweep_current_project_id=null,
      project_auto_enabled=true,
      project_auto_project_id=p_project_id,
      current_run_id=v_run.id,
      runner_state='ready',
      updated_by='owner_checkpoint_recheck',
      updated_at=now()
  where owner_id=v_owner;

  insert into public.cc7_agent_events(owner_id,run_id,task_id,kind,message,payload)
  values(
    v_owner,v_run.id,v_task_id,'owner_recheck_requested',
    'Owner requested re-verification of the exact Project Auto blocker after a Project Checkpoint.',
    jsonb_build_object('project_id',p_project_id,'recheck_requested_at',now(),'same_run_resume',true)
  );

  return jsonb_build_object(
    'ok',true,
    'recheck_requested',true,
    'run_id',v_run.id,
    'task_id',v_task_id,
    'project_id',p_project_id,
    'status','queued'
  );
end;
$function$;

revoke all on function public.cc7_agent_owner_request_project_auto_recheck(text) from public;
grant execute on function public.cc7_agent_owner_request_project_auto_recheck(text) to authenticated;
