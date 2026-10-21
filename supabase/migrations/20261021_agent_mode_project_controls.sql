-- Agent Mode owner controls requested during runtime build.
-- Adds an explicit one-project-only session helper and a one-step Sol Medium approval helper.

create or replace function public.command_center_agent_create_project_only_session(
  p_objective text,
  p_project_id text,
  p_success_criteria jsonb default '[]'::jsonb,
  p_excluded_scope jsonb default '[]'::jsonb,
  p_allowed_tool_categories jsonb default '[]'::jsonb,
  p_allow_work boolean default true,
  p_books_target text default null,
  p_dry_run boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  sid uuid;
  category_text text;
  books_targets jsonb := '{}'::jsonb;
  permission_envelope jsonb;
  execution_policy jsonb;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if coalesce(btrim(p_project_id),'')='' then
    raise exception 'Project is required';
  end if;
  select category into category_text
  from public.projects
  where id=p_project_id and owner_id=u;
  if not found then
    raise exception 'Project not found or unauthorized';
  end if;
  if jsonb_typeof(coalesce(p_allowed_tool_categories,'[]'::jsonb)) <> 'array' then
    raise exception 'Allowed tool categories must be an array';
  end if;
  if lower(coalesce(category_text,'')) like '%book%' then
    if coalesce(btrim(p_books_target),'')='' then
      raise exception 'Books project requires an explicit named Books target';
    end if;
    books_targets:=jsonb_build_object(p_project_id,btrim(p_books_target));
  end if;

  permission_envelope:=jsonb_build_object(
    'allowed_tool_categories',coalesce(p_allowed_tool_categories,'[]'::jsonb),
    'allow_work',coalesce(p_allow_work,true)
  );
  execution_policy:=jsonb_build_object(
    'project_switch_mode','this_project_only',
    'project_switch_locked',true,
    'locked_project_id',p_project_id,
    'work_concurrency',1,
    'work_ceiling','GPT-6.1 Sol Medium',
    'astra_allowed',false
  );

  sid:=public.command_center_agent_create_session(
    p_objective,
    array[p_project_id],
    p_project_id,
    coalesce(p_success_criteria,'[]'::jsonb),
    coalesce(p_excluded_scope,'[]'::jsonb),
    permission_envelope,
    execution_policy,
    books_targets,
    coalesce(p_dry_run,false)
  );

  return sid;
end
$$;

create or replace function public.command_center_agent_approve_sol_medium_step(
  p_step_id uuid,
  p_reason text default null,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  u uuid := (select auth.uid());
  st public.agent_steps%rowtype;
  h public.agent_work_handoffs%rowtype;
  auth_result jsonb;
  auth_id uuid;
  idem text;
  handoff_result jsonb;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  select * into st
  from public.agent_steps
  where id=p_step_id and owner_id=u
  for update;
  if not found then
    raise exception 'Agent step not found';
  end if;
  if st.route<>'work' or st.model_rung<>'GPT-6.1 Sol Medium' then
    raise exception 'This control only approves an exact Sol Medium Work step';
  end if;
  if st.status<>'pending' then
    raise exception 'Sol Medium approval is valid only before the pending step starts';
  end if;
  if st.last_failure_class is not null
     and st.last_failure_class not in ('capability_insufficient','execution_complexity') then
    raise exception 'Current failure class does not justify Sol Medium escalation';
  end if;

  select * into h
  from public.agent_work_handoffs
  where owner_id=u and step_id=st.id and model_rung='GPT-6.1 Sol Medium'
    and state='proposed' and approval_state='required'
  order by created_at desc
  limit 1
  for update;
  if not found then
    raise exception 'No Sol Medium handoff is awaiting approval for this step';
  end if;

  idem:='agent-sol-medium:'||st.id::text||':'||h.id::text;
  auth_result:=public.command_center_security_authorize_action(
    'agent_mode_work_sol_medium',
    'agent_step',
    st.id::text,
    'protected',
    coalesce(nullif(btrim(p_reason),''),'Owner approved Sol Medium for this exact Agent Mode step'),
    p_expires_at,
    idem
  );
  auth_id:=(auth_result->>'authorization_id')::uuid;
  if auth_id is null then
    raise exception 'Sol Medium Security authorization was not created';
  end if;

  update public.agent_steps set authorization_id=auth_id where id=st.id;
  handoff_result:=public.command_center_agent_approve_work_handoff(h.id,auth_id);

  return jsonb_build_object(
    'ok',true,
    'step_id',st.id,
    'handoff_id',h.id,
    'authorization_id',auth_id,
    'model_rung','GPT-6.1 Sol Medium',
    'approval_scope','this_step_only',
    'handoff_state',handoff_result->>'state'
  );
end
$$;

revoke execute on function public.command_center_agent_create_project_only_session(text,text,jsonb,jsonb,jsonb,boolean,text,boolean) from public, anon;
grant execute on function public.command_center_agent_create_project_only_session(text,text,jsonb,jsonb,jsonb,boolean,text,boolean) to authenticated;

revoke execute on function public.command_center_agent_approve_sol_medium_step(uuid,text,timestamptz) from public, anon;
grant execute on function public.command_center_agent_approve_sol_medium_step(uuid,text,timestamptz) to authenticated;
