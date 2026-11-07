-- COMMAND CENTER: truthful $0 safe-tool readiness; never synthesize execution proofs.
-- Cloud safe-tools gateway is deployed but native Windows safe-tool extension is not
-- yet owner-verified or canonically executed. Old ChatGPT Tasks executor reference
-- was independently checked as NOT_FOUND; preserve past success as historical only.
DO $cc_registry_reconciliation$
DECLARE
  owner_uuid uuid;
  old_task public.agent_tool_registry%rowtype;
  existing_count integer;
BEGIN
  SELECT owner_id INTO owner_uuid
  FROM public.command_center_pc_worker_registrations
  WHERE worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
    AND enabled AND revoked_at IS NULL;
  IF owner_uuid IS NULL THEN RAISE EXCEPTION 'Existing owner PC worker unavailable'; END IF;

  SELECT * INTO old_task
  FROM public.agent_tool_registry
  WHERE owner_id=owner_uuid AND capability_key='background_runner'
    AND provider='chatgpt_tasks' AND tool_key='command_center_agent_runner'
    AND environment='normal_chat' FOR UPDATE;
  IF NOT FOUND OR old_task.availability NOT IN ('available','degraded')
    OR old_task.metadata->>'automation_title'<>'Command Center Agent Runner'
  THEN RAISE EXCEPTION 'Existing historical scheduler registration differs'; END IF;

  UPDATE public.agent_tool_registry SET
    availability='degraded',error_class='referenced_chatgpt_task_not_found',
    last_verified_at=now(),updated_at=now(),
    metadata=metadata || jsonb_build_object('current_task_lookup','NOT_FOUND',
      'last_success_is_historical',true,'general_executor_live_verified',false)
  WHERE id=old_task.id;

  SELECT count(*) INTO existing_count
  FROM public.agent_tool_registry
  WHERE owner_id=owner_uuid AND provider='command_center_owner_pc'
    AND tool_key IN ('code.js_syntax_check','research.public_docs_read');
  IF existing_count<>0 THEN
    RAISE EXCEPTION 'Safe capability records already exist; do not overwrite or duplicate';
  END IF;

  INSERT INTO public.agent_tool_registry(
    owner_id,capability_key,environment,provider,tool_key,
    availability,auth_state,action_scope,free_status,error_class,
    last_success_at,last_verified_at,metadata
  ) VALUES
  (owner_uuid,'coding_syntax_read_only','external_tool','command_center_owner_pc',
    'code.js_syntax_check','degraded','authenticated',
    '{"syntax_only":true,"execute_code":false,"company_operation":false,"owner_triggered":true}'::jsonb,
    'free','native_pc_safe_tool_receipt_pending',NULL,now(),
    '{"source_commit":"3c7726755894c0f454fc5a073539faac91de467d","backend_live":true,
      "native_worker_verified":false,"canonically_executed":false,"worker_id":"737f5e7c-3884-4c61-81ac-634bdfc4828f"}'::jsonb),
  (owner_uuid,'research_public_docs_read_only','external_tool','command_center_owner_pc',
    'research.public_docs_read','degraded','authenticated',
    '{"public_docs_only":true,"allowlisted_hosts":5,"browser_control":false,"company_operation":false,"owner_triggered":true}'::jsonb,
    'free','native_pc_safe_tool_receipt_pending',NULL,now(),
    '{"source_commit":"3c7726755894c0f454fc5a073539faac91de467d","backend_live":true,
      "native_worker_verified":false,"canonically_executed":false,"worker_id":"737f5e7c-3884-4c61-81ac-634bdfc4828f"}'::jsonb);
END
$cc_registry_reconciliation$;
