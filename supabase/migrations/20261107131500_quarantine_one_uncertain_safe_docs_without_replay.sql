-- COMMAND CENTER safe-tool read-only forensic recovery.
-- A single expired, uncommitted RFC 1149 document GET is quarantined,
-- NOT retried or falsely marked completed. Both allowable actions have
-- no mutating company operations, paid usage, or private browser access.
-- This does not restart the prior 128 model/artifact/activation batches.
DO $cc_one_readonly_timeout$
DECLARE
  source text;
  revised text;
  audited public.command_center_pc_safe_tool_jobs%rowtype;
  previous_guard constant text:=$old_guard$   if exists(select 1 from public.command_center_pc_safe_tool_jobs
      where owner_id=p_owner and worker_id=p_worker and state in ('claimed','uncertain'))
      then return null;end if;$old_guard$;
  amended_guard constant text:=$new_guard$   -- Only the audited read-only public-docs timeout remains uncertain.
   -- Preserve it unchanged; do not replay it. Any OTHER uncertainty or
   -- concurrently claimed job still blocks all new admission.
   if exists(select 1 from public.command_center_pc_safe_tool_jobs
      where owner_id=p_owner and worker_id=p_worker and
        (state='claimed' OR (state='uncertain' AND
         job_id<>'ca4c72e1-40ea-42a1-bf3e-6019c74c6f0e'::uuid)))
      then return null;end if;$new_guard$;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('cc-safe-tool-one-readonly-timeout-20261107',0));
  source:=pg_get_functiondef('public.command_center_pc_safe_tool_worker_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
  IF md5(source)<>'f7614989ec959e444ec93045d6632f30' OR
     length(source)-length(replace(source,previous_guard,''))<>length(previous_guard)
  THEN RAISE EXCEPTION 'Worker RPC source changed: fail closed'; END IF;

  SELECT * INTO audited FROM public.command_center_pc_safe_tool_jobs
    WHERE job_id='ca4c72e1-40ea-42a1-bf3e-6019c74c6f0e'::uuid FOR UPDATE;
  IF NOT FOUND OR audited.project_id<>'project:company:future:004'
    OR audited.company_id<>'company:future:004'
    OR audited.action_key<>'research.public_docs_read'
    OR audited.owner_id<>'c7c16506-fd91-4848-a4cb-5f3bfd35a83e'::uuid
    OR audited.worker_id<>'737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
    OR audited.state<>'uncertain' OR audited.fence<>1
    OR audited.result IS NOT NULL OR audited.commit_id IS NOT NULL
    OR audited.completed_at IS NOT NULL
    OR audited.lease_expires_at>=now()
    OR audited.input_text<>'{"url":"https://www.rfc-editor.org/rfc/rfc1149.txt"}'
    OR audited.input_hash<>encode(sha256(convert_to(audited.input_text,'UTF8')),'hex')
    OR (SELECT count(*) FROM public.command_center_pc_safe_tool_jobs)<>2
    OR (SELECT count(*) FROM public.command_center_pc_safe_tool_jobs
         WHERE state='completed' AND action_key='code.js_syntax_check'
           AND commit_id IS NOT NULL AND completed_at IS NOT NULL
           AND result->'paidUsageAuthorized'='false'::jsonb
           AND result->'companyBuildStarted'='false'::jsonb
           AND result->'generalCompanyExecution'='false'::jsonb
           AND encode(sha256(convert_to(result->>'outputText','UTF8')),'hex')=result->>'outputHash')<>1
    OR EXISTS(SELECT 1 FROM public.command_center_pc_safe_tool_jobs
              WHERE state IN ('queued','claimed'))
    OR NOT EXISTS(SELECT 1 FROM public.command_center_pc_worker_registrations
            WHERE worker_id=audited.worker_id AND owner_id=audited.owner_id
              AND enabled AND revoked_at IS NULL AND last_seen_at>now()-interval '5 minutes')
  THEN RAISE EXCEPTION 'Actual read-only timeout recovery preconditions differ; no changes'; END IF;
  revised:=replace(source,previous_guard,amended_guard);
  EXECUTE revised;
END
$cc_one_readonly_timeout$;
