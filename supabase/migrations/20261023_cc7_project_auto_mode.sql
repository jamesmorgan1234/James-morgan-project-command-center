-- Add one owner-controlled mode: continuous Agent execution locked to one selected project.

alter table public.cc7_agent_runs
  drop constraint if exists cc7_agent_runs_control_mode_check;

alter table public.cc7_agent_runs
  add constraint cc7_agent_runs_control_mode_check
  check (control_mode = any (array[
    'next_step'::text,
    'until_work'::text,
    'manual_task'::text,
    'project_checkpoint'::text,
    'project_auto'::text
  ]));

create or replace function public.cc7_agent_owner_create_run(
  p_project_id text,
  p_objective text,
  p_control_mode text,
  p_books_target text,
  p_allow_work boolean
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_owner uuid := auth.uid();
  v_existing public.cc7_agent_runs%rowtype;
  v_project public.cc7_projects%rowtype;
  v_run public.cc7_agent_runs%rowtype;
begin
  if v_owner is null then
    raise exception 'authenticated owner required';
  end if;
  if not exists (select 1 from public.cc7_owner_access a where a.owner_id=v_owner and a.enabled=true) then
    raise exception 'Command Center V7 owner access required';
  end if;
  if nullif(btrim(coalesce(p_objective,'')),'') is null then
    raise exception 'A concrete Agent task is required';
  end if;
  if p_control_mode not in ('next_step','until_work','manual_task','project_checkpoint','project_auto') then
    raise exception 'Unsupported V7 Agent control mode';
  end if;
  if p_control_mode='project_auto' and p_project_id is null then
    raise exception 'Project Auto requires one selected project';
  end if;

  if p_project_id is not null then
    select * into v_project
    from public.cc7_projects
    where id=p_project_id and owner_id=v_owner;
    if not found then
      raise exception 'Selected V7 project was not found for this owner';
    end if;
    if (lower(coalesce(v_project.category,'')) like '%book%' or lower(coalesce(v_project.category,'')) like '%kdp%')
       and nullif(btrim(coalesce(p_books_target,'')),'') is null then
      raise exception 'Books Agent work requires an exact target';
    end if;
  end if;

  select * into v_existing
  from public.cc7_agent_runs
  where owner_id=v_owner
    and status in ('queued','working','paused','blocked','needs_user','work_boundary')
  order by created_at asc
  limit 1
  for update;

  if found then
    raise exception 'Another V7 Agent run is already open. Stop or complete it before starting a new owner run.';
  end if;

  insert into public.cc7_agent_runs(
    owner_id, project_id, objective, control_mode, books_target, allow_work,
    exact_next_action, status, stop_requested, pause_requested, created_at, updated_at
  ) values (
    v_owner, p_project_id, btrim(p_objective), p_control_mode,
    nullif(btrim(coalesce(p_books_target,'')),''), coalesce(p_allow_work,false),
    'Awaiting clean runner planning', 'queued', false, false, now(), now()
  ) returning * into v_run;

  insert into public.cc7_agent_controls(owner_id,auto_enabled,boundary_sweep_enabled,current_run_id,runner_state,updated_by,updated_at)
  values(v_owner,false,false,v_run.id,'ready','owner_ui_v7',now())
  on conflict(owner_id) do update
    set auto_enabled=case when p_control_mode='project_auto' then false else public.cc7_agent_controls.auto_enabled end,
        boundary_sweep_enabled=case when p_control_mode='project_auto' then false else public.cc7_agent_controls.boundary_sweep_enabled end,
        boundary_sweep_current_project_id=case when p_control_mode='project_auto' then null else public.cc7_agent_controls.boundary_sweep_current_project_id end,
        current_run_id=v_run.id,
        runner_state='ready',
        updated_by='owner_ui_v7',
        updated_at=now();

  insert into public.cc7_agent_events(owner_id,run_id,kind,message,payload)
  values(
    v_owner,
    v_run.id,
    'owner_create',
    case when p_control_mode='project_auto'
      then 'Owner started Project Auto locked to one selected project.'
      else 'Owner created a clean V7 Agent run.'
    end,
    jsonb_build_object('control_mode',p_control_mode,'project_id',p_project_id)
  );

  return jsonb_build_object('ok',true,'run',to_jsonb(v_run));
end;
$function$;

revoke execute on function public.cc7_agent_owner_create_run(text,text,text,text,boolean) from public, anon;
grant execute on function public.cc7_agent_owner_create_run(text,text,text,text,boolean) to authenticated;
