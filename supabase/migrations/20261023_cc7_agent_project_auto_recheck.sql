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

  select * into v_controls
  from public.cc7_agent_controls
  where owner_id=v_owner
  for update;

  if not found
     or coalesce(v_controls.project_auto_enabled,false) is not true
     or v_controls.project_auto_project_id is distinct from p_project_id
     or v_controls.current_run_id is null then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','no_matching_project_auto');
  end if;

  select * into v_run
  from public.cc7_agent_runs
  where id=v_controls.current_run_id and owner_id=v_owner
  for update;

  if not found
     or v_run.control_mode <> 'project_auto'
     or v_run.project_id is distinct from p_project_id
     or coalesce(v_run.stop_requested,false)
     or coalesce(v_run.pause_requested,false)
     or v_run.status not in ('needs_user','blocked') then
    return jsonb_build_object('ok',true,'recheck_requested',false,'reason','run_not_recheckable');
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
  set runner_state='ready', updated_by='owner_checkpoint_recheck', updated_at=now()
  where owner_id=v_owner;

  insert into public.cc7_agent_events(owner_id,run_id,task_id,kind,message,payload)
  values(
    v_owner,v_run.id,v_task_id,'owner_recheck_requested',
    'Owner requested re-verification of the exact Project Auto blocker after a Project Checkpoint.',
    jsonb_build_object('project_id',p_project_id,'recheck_requested_at',now())
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
