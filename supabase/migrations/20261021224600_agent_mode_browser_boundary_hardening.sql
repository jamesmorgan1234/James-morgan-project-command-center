-- Keep Agent Mode browser-facing controls narrow; executor internals remain service-role only.

-- Defense-in-depth owner policies. Tables still have no authenticated table grants.
do $$
declare t text;
begin
  foreach t in array array[
    'agent_sessions','agent_session_projects','agent_steps','agent_step_evidence','agent_checkpoints',
    'agent_step_attempts','agent_work_handoffs','agent_work_queue','agent_circuit_breakers','agent_tool_registry','agent_run_events'
  ] loop
    execute format('drop policy if exists %I on public.%I','agent_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','agent_owner_select_'||t,t);
  end loop;
end $$;

-- Internal executor/runtime RPCs: never directly callable by browser roles.
revoke execute on function public.command_center_agent_add_step(uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) from authenticated;
revoke execute on function public.command_center_agent_attach_authorization(uuid,uuid) from authenticated;
revoke execute on function public.command_center_agent_begin_step(uuid) from authenticated;
revoke execute on function public.command_center_agent_add_evidence(uuid,text,text,text,jsonb) from authenticated;
revoke execute on function public.command_center_agent_confirm_evidence(uuid,text) from authenticated;
revoke execute on function public.command_center_agent_verify_step(uuid) from authenticated;
revoke execute on function public.command_center_agent_checkpoint(uuid,text,jsonb) from authenticated;
revoke execute on function public.command_center_agent_prepare_work_handoff(uuid,text,boolean,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) from authenticated;
revoke execute on function public.command_center_agent_approve_work_handoff(uuid,uuid) from authenticated;
revoke execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) from authenticated;
revoke execute on function public.command_center_agent_record_work_result(uuid,text,text,jsonb,text,text,text) from authenticated;
revoke execute on function public.command_center_agent_reopen_step(uuid,text,text,text) from authenticated;
revoke execute on function public.command_center_agent_close_circuit_breaker(uuid,text,text) from authenticated;
revoke execute on function public.command_center_agent_mark_normal_chat_resumed(uuid) from authenticated;
revoke execute on function public.command_center_agent_record_tool_health(text,text,text,text,text,text,text,jsonb,text,text,boolean,jsonb) from authenticated;

-- Service runtime receives explicit executor permissions.
grant execute on function public.command_center_agent_add_step(uuid,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text,uuid[],text,text,text,integer,jsonb) to service_role;
grant execute on function public.command_center_agent_attach_authorization(uuid,uuid) to service_role;
grant execute on function public.command_center_agent_begin_step(uuid) to service_role;
grant execute on function public.command_center_agent_add_evidence(uuid,text,text,text,jsonb) to service_role;
grant execute on function public.command_center_agent_confirm_evidence(uuid,text) to service_role;
grant execute on function public.command_center_agent_verify_step(uuid) to service_role;
grant execute on function public.command_center_agent_checkpoint(uuid,text,jsonb) to service_role;
grant execute on function public.command_center_agent_prepare_work_handoff(uuid,text,boolean,text,text,jsonb,jsonb,jsonb,text,text,text,text,integer) to service_role;
grant execute on function public.command_center_agent_approve_work_handoff(uuid,uuid) to service_role;
grant execute on function public.command_center_agent_start_work_handoff(uuid,text,boolean) to service_role;
grant execute on function public.command_center_agent_record_work_result(uuid,text,text,jsonb,text,text,text) to service_role;
grant execute on function public.command_center_agent_reopen_step(uuid,text,text,text) to service_role;
grant execute on function public.command_center_agent_close_circuit_breaker(uuid,text,text) to service_role;
grant execute on function public.command_center_agent_mark_normal_chat_resumed(uuid) to service_role;
grant execute on function public.command_center_agent_record_tool_health(text,text,text,text,text,text,text,jsonb,text,text,boolean,jsonb) to service_role;

-- Owner/browser controls intentionally remain available through authenticated, owner-scoped SECURITY DEFINER RPCs:
-- create_session, create_project_only_session, start_session, list_sessions, status, pause, resume, cancel, approve_sol_medium_step.
