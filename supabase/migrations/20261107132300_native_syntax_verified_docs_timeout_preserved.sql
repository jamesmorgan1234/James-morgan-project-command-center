-- COMMAND CENTER real owner-PC safe syntax canary, independently read back.
-- The research request expired with NO commit; do not promote that capability.
DO $cc_native_safe_proof$
DECLARE
  syntax_job public.command_center_pc_safe_tool_jobs%rowtype;
  docs_job public.command_center_pc_safe_tool_jobs%rowtype;
  proof jsonb;
  rows_changed integer;
BEGIN
  SELECT * INTO syntax_job FROM public.command_center_pc_safe_tool_jobs
     WHERE job_id='8ac2e9b4-2f3d-4c71-9fe8-55cabd43d929'::uuid;
  SELECT * INTO docs_job FROM public.command_center_pc_safe_tool_jobs
     WHERE job_id='ca4c72e1-40ea-42a1-bf3e-6019c74c6f0e'::uuid;

  IF syntax_job.state<>'completed' OR syntax_job.commit_id IS NULL
     OR syntax_job.completed_at IS NULL OR syntax_job.fence<>1
     OR syntax_job.worker_id<>'737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
     OR syntax_job.project_id<>'project:company:future:004'
     OR syntax_job.company_id<>'company:future:004'
     OR syntax_job.action_key<>'code.js_syntax_check'
     OR syntax_job.result->>'jobId'<>syntax_job.job_id::text
     OR syntax_job.result->>'inputHash'<>syntax_job.input_hash
     OR syntax_job.result->>'workerId'<>syntax_job.worker_id::text
     OR syntax_job.result->>'ownerId'<>syntax_job.owner_id::text
     OR syntax_job.result->>'fencingToken'<>syntax_job.fence::text
     OR syntax_job.result->'paidUsageAuthorized'<>'false'::jsonb
     OR syntax_job.result->'companyBuildStarted'<>'false'::jsonb
     OR syntax_job.result->'generalCompanyExecution'<>'false'::jsonb
     OR syntax_job.result->>'outputHash'<>encode(sha256(convert_to(syntax_job.result->>'outputText','UTF8')),'hex')
     OR syntax_job.input_hash<>encode(sha256(convert_to(syntax_job.input_text,'UTF8')),'hex')
     OR (syntax_job.result->>'outputText')::jsonb->'syntaxValid'<>'true'::jsonb
     OR (syntax_job.result->>'outputText')::jsonb->'executed'<>'false'::jsonb
     OR docs_job.state<>'uncertain' OR docs_job.commit_id IS NOT NULL
     OR docs_job.result IS NOT NULL OR docs_job.fence<>1
     OR docs_job.action_key<>'research.public_docs_read'
  THEN RAISE EXCEPTION 'Expected verified syntax and unchanged failed docs canary are not present'; END IF;

  proof:=public.command_center_pc_safe_tool_worker_service(
      syntax_job.owner_id,syntax_job.worker_id,'readback',
      syntax_job.job_id,syntax_job.fence,NULL);
  IF proof->>'canonicalCommitVerified'<>'true'
     OR proof->>'commitId'<>syntax_job.commit_id::text
     OR proof->'result'<>syntax_job.result
  THEN RAISE EXCEPTION 'Native syntax canonical readback differs; no registry update'; END IF;

  UPDATE public.agent_tool_registry SET
    availability='available',error_class=NULL,
    last_success_at=syntax_job.completed_at,last_verified_at=now(),updated_at=now(),
    metadata=metadata||jsonb_build_object(
      'native_worker_verified',true,'canonically_executed',true,
      'evidence_job_id',syntax_job.job_id,
      'verified_capability','syntax_only_no_execution',
      'owner_http_ui_e2e_tested',false,
      'general_company_executor_verified',false)
  WHERE owner_id=syntax_job.owner_id AND provider='command_center_owner_pc'
    AND tool_key='code.js_syntax_check'
    AND availability='degraded'
    AND metadata->'native_worker_verified'='false'::jsonb;
  GET DIAGNOSTICS rows_changed = ROW_COUNT;
  IF rows_changed<>1 THEN RAISE EXCEPTION 'Expected exactly one syntax registry row'; END IF;

  UPDATE public.agent_tool_registry SET
    error_class='live_docs_read_uncommitted_timeout',
    last_verified_at=now(),updated_at=now(),
    metadata=metadata||jsonb_build_object(
      'native_worker_verified',false,
      'document_retrieval_verified',false,
      'last_uncommitted_evidence_job_id',docs_job.job_id,
      'last_uncommitted_job_state',docs_job.state,
      'general_browser_access_verified',false)
  WHERE owner_id=docs_job.owner_id AND provider='command_center_owner_pc'
    AND tool_key='research.public_docs_read'
    AND availability='degraded';
  GET DIAGNOSTICS rows_changed = ROW_COUNT;
  IF rows_changed<>1 THEN RAISE EXCEPTION 'Expected exactly one pending docs registry row'; END IF;
END
$cc_native_safe_proof$;
