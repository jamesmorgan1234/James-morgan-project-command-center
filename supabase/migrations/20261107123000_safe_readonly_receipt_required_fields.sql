-- Harden only the newly deployed safe-readonly queue receipt identity, not any completed Brain lane.
DO $cc_safe_readonly_receipt_harden$
DECLARE
  definition text;
  initial constant text := $old$if p_result is null or jsonb_typeof(p_result)<>'object'$old$;
  patched constant text := $new$if p_result is null or jsonb_typeof(p_result)<>'object'
      or not (p_result ?& array['jobId','ownerId','workerId','projectId','companyId','brainKey','brainVersion','actionKey','toolVersion','inputHash','fencingToken','generation','outputText','outputHash','paidUsageAuthorized','companyBuildStarted','generalCompanyExecution'])$new$;
BEGIN
  definition:=pg_get_functiondef('public.command_center_pc_safe_tool_worker_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
  IF md5(definition)<>'960922ced5fc7ddc8affc8c18fbe06bb' OR
     (length(definition)-length(replace(definition,initial,'')))<>length(initial)
  THEN RAISE EXCEPTION 'Safe tool service changed, deny patch'; END IF;
  IF (select count(*) from public.command_center_pc_safe_tool_jobs)<>0 THEN
    RAISE EXCEPTION 'Safe tool queue not empty, deny untested patch';
  END IF;
  EXECUTE replace(definition,initial,patched);
END
$cc_safe_readonly_receipt_harden$;
