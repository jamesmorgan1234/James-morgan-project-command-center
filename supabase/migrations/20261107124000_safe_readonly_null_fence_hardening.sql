-- Fail-closed NULL handling for safe tool receipt identity/attestation.
DO $harden_null$
DECLARE
  d text; a text; b text; count int;
BEGIN
  d:=pg_get_functiondef('public.command_center_pc_safe_tool_worker_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
  IF md5(d)<>'5f806c7cb9385668882c46da6c9196c4'
    OR (select count(*) from public.command_center_pc_safe_tool_jobs)<>0
  THEN RAISE EXCEPTION 'Safe tool source or queue changed';END IF;
  FOR a,b IN SELECT * FROM (VALUES
   ('p_result->>''jobId''<>j.job_id::text','p_result->>''jobId'' IS DISTINCT FROM j.job_id::text'),
   ('p_result->>''ownerId''<>j.owner_id::text','p_result->>''ownerId'' IS DISTINCT FROM j.owner_id::text'),
   ('p_result->>''workerId''<>j.worker_id::text','p_result->>''workerId'' IS DISTINCT FROM j.worker_id::text'),
   ('p_result->>''projectId''<>j.project_id','p_result->>''projectId'' IS DISTINCT FROM j.project_id'),
   ('p_result->>''companyId''<>j.company_id','p_result->>''companyId'' IS DISTINCT FROM j.company_id'),
   ('p_result->>''brainKey''<>j.brain_key','p_result->>''brainKey'' IS DISTINCT FROM j.brain_key'),
   ('p_result->>''brainVersion''<>j.brain_version::text','p_result->>''brainVersion'' IS DISTINCT FROM j.brain_version::text'),
   ('p_result->>''actionKey''<>j.action_key','p_result->>''actionKey'' IS DISTINCT FROM j.action_key'),
   ('p_result->>''toolVersion''<>''safe-readonly-v1''','p_result->>''toolVersion'' IS DISTINCT FROM ''safe-readonly-v1'''),
   ('p_result->>''inputHash''<>j.input_hash','p_result->>''inputHash'' IS DISTINCT FROM j.input_hash'),
   ('p_result->>''fencingToken''<>j.fence::text','p_result->>''fencingToken'' IS DISTINCT FROM j.fence::text'),
   ('p_result->>''generation''<>''1''','p_result->>''generation'' IS DISTINCT FROM ''1'''),
   ('p_result->''paidUsageAuthorized''<>''false''::jsonb','p_result->''paidUsageAuthorized'' IS DISTINCT FROM ''false''::jsonb'),
   ('p_result->''companyBuildStarted''<>''false''::jsonb','p_result->''companyBuildStarted'' IS DISTINCT FROM ''false''::jsonb'),
   ('p_result->''generalCompanyExecution''<>''false''::jsonb','p_result->''generalCompanyExecution'' IS DISTINCT FROM ''false''::jsonb'),
   ('p_result->>''outputHash''<>encode(sha256(convert_to(p_result->>''outputText'',''UTF8'')),''hex'')','p_result->>''outputHash'' IS DISTINCT FROM encode(sha256(convert_to(p_result->>''outputText'',''UTF8'')),''hex'')')
  ) AS transformations(needle,replacement)
  LOOP
    count:=(length(d)-length(replace(d,a,'')))/length(a);
    IF count<>1 THEN RAISE EXCEPTION 'Exact field comparison not found';END IF;
    d:=replace(d,a,b);
  END LOOP;
  EXECUTE d;
END
$harden_null$;
