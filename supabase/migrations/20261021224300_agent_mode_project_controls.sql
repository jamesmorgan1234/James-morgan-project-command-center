-- Command Center Agent Mode project-specific owner controls.

create or replace function public.command_center_agent_create_project_only_session(
  p_objective text,
  p_project_id text,
  p_success_criteria jsonb default '[]'::jsonb,
  p_excluded_scope jsonb default '[]'::jsonb,
  p_allowed_tool_categories jsonb default '[]'::jsonb,
  p_allow_work boolean default true,
  p_books_target text default null,
  p_dry_run boolean default false
) returns uuid language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); cat text; targets jsonb:='{}'::jsonb; envelope jsonb; policy jsonb; sid uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_project_id),'')='' then raise exception 'Project is required'; end if;
  select category into cat from public.projects where id=p_project_id and owner_id=u; if not found then raise exception 'Project not found or unauthorized'; end if;
  if jsonb_typeof(coalesce(p_allowed_tool_categories,'[]'::jsonb))<>'array' then raise exception 'Allowed tool categories must be an array'; end if;
  if lower(coalesce(cat,'')) like '%book%' then
    if coalesce(btrim(p_books_target),'')='' then raise exception 'Books project requires an explicit named Books target'; end if;
    targets:=jsonb_build_object(p_project_id,btrim(p_books_target));
  end if;
  envelope:=jsonb_build_object('allowed_tool_categories',coalesce(p_allowed_tool_categories,'[]'::jsonb),'allow_work',coalesce(p_allow_work,true));
  policy:=jsonb_build_object('project_switch_mode','this_project_only','project_switch_locked',true,'locked_project_id',p_project_id,'work_concurrency',1,'work_ceiling','GPT-6.1 Sol Medium','astra_allowed',false);
  sid:=public.command_center_agent_create_session(p_objective,array[p_project_id],p_project_id,coalesce(p_success_criteria,'[]'::jsonb),coalesce(p_excluded_scope,'[]'::jsonb),envelope,policy,targets,coalesce(p_dry_run,false),'project_only');
  return sid;
end $$;

create or replace function public.command_center_agent_approve_sol_medium_step(p_step_id uuid,p_reason text default null,p_expires_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); st public.agent_steps%rowtype; h public.agent_work_handoffs%rowtype; authj jsonb; aid uuid; idem text; outj jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into st from public.agent_steps where id=p_step_id and owner_id=u for update; if not found then raise exception 'Agent step not found'; end if;
  if st.route<>'work' or st.model_rung<>'GPT-6.1 Sol Medium' then raise exception 'This control only approves an exact Sol Medium Work step'; end if;
  if st.status<>'pending' then raise exception 'Sol Medium approval is valid only before the pending step starts'; end if;
  if st.last_failure_class is not null and st.last_failure_class not in ('capability_insufficient','execution_complexity') then raise exception 'Current failure class does not justify Sol Medium escalation'; end if;
  select * into h from public.agent_work_handoffs where owner_id=u and step_id=st.id and model_rung='GPT-6.1 Sol Medium' and state='proposed' and approval_state='required' order by created_at desc limit 1 for update;
  if not found then raise exception 'No Sol Medium handoff is awaiting approval for this step'; end if;
  idem:='agent-sol-medium:'||st.id::text||':'||h.id::text;
  authj:=public.command_center_security_authorize_action('agent_mode_work_sol_medium','agent_step',st.id::text,'protected',coalesce(nullif(btrim(p_reason),''),'Owner approved Sol Medium for this exact Agent Mode step'),p_expires_at,idem);
  aid:=(authj->>'authorization_id')::uuid; if aid is null then raise exception 'Sol Medium authorization was not created'; end if;
  update public.agent_steps set authorization_id=aid where id=st.id;
  outj:=public.command_center_agent_approve_work_handoff(h.id,aid);
  perform public.command_center_agent_log_event(u,st.session_id,st.project_id,st.id,'sol_medium_approved','Sol Medium approved for exact blocked step',jsonb_build_object('handoff_id',h.id));
  return jsonb_build_object('ok',true,'step_id',st.id,'handoff_id',h.id,'authorization_id',aid,'model_rung','GPT-6.1 Sol Medium','approval_scope','this_step_only','handoff_state',outj->>'state');
end $$;

revoke execute on function public.command_center_agent_create_project_only_session(text,text,jsonb,jsonb,jsonb,boolean,text,boolean) from public,anon;
grant execute on function public.command_center_agent_create_project_only_session(text,text,jsonb,jsonb,jsonb,boolean,text,boolean) to authenticated;
revoke execute on function public.command_center_agent_approve_sol_medium_step(uuid,text,timestamptz) from public,anon;
grant execute on function public.command_center_agent_approve_sol_medium_step(uuid,text,timestamptz) to authenticated;
