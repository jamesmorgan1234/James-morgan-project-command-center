-- Owner Start submits real normal-chat work to the existing ChatGPT Task consumer.
-- Queued is not a claim of execution. The consumer must persist its live task lease.
create or replace function public.command_center_agency_start_normal_chat(
  p_project_id text, p_run_id text, p_objective text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r public.command_center_agency_runs%rowtype;
  evidence text[];
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_objective),'')='' or length(p_objective)>4000
    or coalesce(p_run_id,'') !~ '^agency-run:[a-zA-Z0-9._:-]{1,220}$' then
    raise exception 'A valid run identity and objective are required';
  end if;
  -- Serialize starts for the same owner/project, including different request IDs.
  perform 1 from public.command_center_project_profiles
    where owner_id=u and project_id=btrim(p_project_id) for update;
  if not found then raise exception 'Agency run project not found'; end if;
  select * into r from public.command_center_agency_runs where owner_id=u and run_id=p_run_id;
  if found then
    if r.project_id<>btrim(p_project_id) or r.objective<>btrim(p_objective)
      or r.control_mode<>'until_work' or r.authorization_ref<>'owner:normal-chat-start:'||p_run_id then
      raise exception 'Request identity is already bound to different work';
    end if;
    return jsonb_build_object('run_id',r.run_id,'state',r.state,'generation',r.generation,'duplicate',true);
  end if;
  select * into r from public.command_center_agency_runs
    where owner_id=u and project_id=btrim(p_project_id)
      and authorization_ref like 'owner:normal-chat-start:%'
      and state in ('queued','working','paused','blocked','needs_user')
    order by created_at limit 1;
  if found then
    raise exception 'This project already has an active run. Open its progress or stop it before starting another.';
  end if;
  if not exists(select 1 from public.command_center_agency_executors
    where owner_id=u and enabled and retired_at is null and cost_class='free'
      and 'normal_chat'=any(environments) and 'project.execute'=any(capabilities)
      and executor_ref='chatgpt-task:6ada7af0b254819184456ca1246e3f69') then
    raise exception 'The normal-chat execution connection is not configured';
  end if;
  evidence:=array['owner:normal-chat-start:'||p_run_id];
  perform public.command_center_agency_create_run(btrim(p_project_id),p_run_id,btrim(p_objective),
    'until_work','owner:normal-chat-start:'||p_run_id,0,null,evidence,now());
  perform public.command_center_agency_transition_run(p_run_id,1,'queued',null,'{}'::text[],evidence,now());
  return jsonb_build_object('run_id',p_run_id,'state','queued','generation',1,'duplicate',false);
end $$;
revoke all on function public.command_center_agency_start_normal_chat(text,text,text) from public,anon;
grant execute on function public.command_center_agency_start_normal_chat(text,text,text) to authenticated;
