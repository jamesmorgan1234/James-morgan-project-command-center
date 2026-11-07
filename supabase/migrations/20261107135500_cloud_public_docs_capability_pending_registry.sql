-- COMMAND CENTER truthful scoped Free-tier cloud document capability.
-- Separate from native Windows research, general browser access and company execution.
DO $cc_cloud_docs_pending$
DECLARE
 owner_uuid uuid;
 existing int;
BEGIN
 SELECT owner_id INTO owner_uuid FROM public.command_center_pc_worker_registrations
 WHERE worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
 AND enabled AND revoked_at IS NULL;
 IF owner_uuid IS NULL THEN RAISE EXCEPTION 'Existing COMMAND CENTER owner not found'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.command_center_members
     WHERE user_id=owner_uuid AND access_status='active' AND revoked_at IS NULL)
 THEN RAISE EXCEPTION 'Owner membership revoked'; END IF;
 IF to_regclass('public.command_center_cloud_public_docs_receipts') IS NULL
 THEN RAISE EXCEPTION 'Owner-RLS cloud docs receipt store missing'; END IF;
 SELECT count(*) INTO existing FROM public.agent_tool_registry WHERE
   owner_id=owner_uuid AND provider='command_center_free_cloud'
   AND tool_key='research.cloud_public_docs_read';
 IF existing<>0 THEN RAISE EXCEPTION 'Cloud research capability already registered; no overwrite'; END IF;
 INSERT INTO public.agent_tool_registry(
 owner_id,capability_key,environment,provider,tool_key,availability,
 auth_state,action_scope,free_status,error_class,last_success_at,last_verified_at,metadata
 ) VALUES(
 owner_uuid,'research_cloud_public_docs_read_only','external_tool',
 'command_center_free_cloud','research.cloud_public_docs_read',
 'degraded','authenticated',
 '{"public_docs_only":true,"owner_triggered":true,"allowlisted_hosts":5,"cloud":true,"arbitrary_browser":false,"company_operation":false}'::jsonb,
 'free','owner_authenticated_cloud_fetch_proof_pending',NULL,now(),
 '{"backend_deployed":true,"backend_version":6,"native_windows_worker_used":false,
   "signed_in_ui_acceptance_verified":false,"document_retrieval_verified":false,
   "general_company_executor_verified":false,"no_paid_fallback":true}'::jsonb
 );
END
$cc_cloud_docs_pending$;
