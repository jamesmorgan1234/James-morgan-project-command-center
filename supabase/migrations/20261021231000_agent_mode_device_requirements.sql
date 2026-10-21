-- Agent Mode device/user-action presentation support.
-- Required environment and exact user instructions live in agent_steps.metadata so
-- planners can express device requirements without expanding the core schema.

create or replace function public.command_center_agent_status(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare u uuid:=(select auth.uid()); s public.agent_sessions%rowtype; pj jsonb; sj jsonb; hj jsonb; bj jsonb; ej jsonb; cp jsonb; mj jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.agent_sessions where id=p_session_id and owner_id=u; if not found then raise exception 'Agent session not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('project_id',project_id,'role',project_role,'state',state,'books_target',books_target) order by sort_order),'[]'::jsonb) into pj from public.agent_session_projects where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'project_id',project_id,'step_key',step_key,'title',title,'details',details,'position',position,'route',route,'tool_category',tool_category,
    'scope_class',scope_class,'model_rung',model_rung,'risk_class',risk_class,'impact_radius',impact_radius,'status',status,
    'verification_required',verification_required,'failure_class',last_failure_class,'retry_count',retry_count,
    'meaningful_failure_count',meaningful_failure_count,'metadata',metadata,
    'required_environment',coalesce(nullif(metadata->>'required_environment',''),'any_device'),
    'user_action_instructions',nullif(metadata->>'user_action_instructions',''),
    'resume_after_user_action',coalesce((metadata->>'resume_after_user_action')::boolean,true)
  ) order by position,created_at),'[]'::jsonb) into sj from public.agent_steps where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object('handoff_id',id,'project_id',project_id,'step_id',step_id,'provider',provider,'model_rung',model_rung,'scope_class',scope_class,'risk_class',risk_class,'approval_state',approval_state,'state',state,'failure_class',failure_class,'normal_chat_resumed',normal_chat_resumed) order by created_at desc),'[]'::jsonb) into hj from public.agent_work_handoffs where session_id=s.id and owner_id=u;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',breaker_type,'scope_key',scope_key,'provider',provider,'reason',reason,'failure_count',failure_count,'status',status) order by opened_at desc),'[]'::jsonb) into bj from public.agent_circuit_breakers where owner_id=u and (session_id=s.id or (session_id is null and status='open'));
  select coalesce(jsonb_agg(jsonb_build_object('kind',event_kind,'message',message,'project_id',project_id,'step_id',step_id,'created_at',created_at) order by created_at desc),'[]'::jsonb) into ej from (select * from public.agent_run_events where owner_id=u and session_id=s.id order by created_at desc limit 20) x;
  select jsonb_build_object('id',id,'created_at',created_at,'exact_next_action',exact_next_action,'progress_hash',progress_hash) into cp from public.agent_checkpoints where owner_id=u and session_id=s.id order by created_at desc limit 1;
  select jsonb_build_object('total_steps',count(*),'verified_steps',count(*) filter(where status='verified'),'normal_chat_steps',count(*) filter(where route='normal_chat'),'work_steps',count(*) filter(where route='work'),'blocked_steps',count(*) filter(where status in ('blocked','needs_user_action')),'work_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id),'luna_high_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id and h.model_rung='GPT-6 Luna High'),'sol_light_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id and h.model_rung='GPT-6.1 Sol Light'),'sol_medium_handoffs',(select count(*) from public.agent_work_handoffs h where h.owner_id=u and h.session_id=s.id and h.model_rung='GPT-6.1 Sol Medium'),'failed_attempts',(select count(*) from public.agent_step_attempts a where a.owner_id=u and a.session_id=s.id and a.status='failed'),'work_allowance_total','N/A','work_allowance_remaining','N/A','predicted_work_percentage','N/A') into mj from public.agent_steps where owner_id=u and session_id=s.id;
  return jsonb_build_object('session',jsonb_build_object('id',s.id,'objective',s.objective,'status',s.status,'scope_mode',s.scope_mode,'primary_project_id',s.primary_project_id,'current_project_id',s.current_project_id,'current_step_id',s.current_step_id,'dry_run',s.dry_run,'pause_requested',s.pause_requested,'cancel_requested',s.cancel_requested,'exact_next_action',s.exact_next_action,'started_at',s.started_at,'completed_at',s.completed_at),'projects',pj,'steps',sj,'work_queue',hj,'circuit_breakers',bj,'recent_events',ej,'latest_checkpoint',cp,'metrics',mj);
end $$;

revoke execute on function public.command_center_agent_status(uuid) from public,anon;
grant execute on function public.command_center_agent_status(uuid) to authenticated;
