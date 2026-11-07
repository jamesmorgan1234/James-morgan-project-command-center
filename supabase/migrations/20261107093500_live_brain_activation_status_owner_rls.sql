-- Live, RLS-scoped COMMAND CENTER specialist connection truth.
-- Source-of-truth is the database, never stale checkpoint prose.
-- The status deliberately separates bounded local-model acknowledgements
-- from operational Brain activation and general browser/research/coding tools.
-- This is read-only; no Brain is enabled and no company work is executed.
CREATE OR REPLACE VIEW public.command_center_activation_live_by_project_v1
WITH (security_invoker=true)
AS
SELECT b.owner_id,b.project_id,b.brain_key,b.version AS brain_version,
       b.enabled AS general_brain_enabled,b.lifecycle,b.health,
       coalesce(array_length(b.tool_keys,1),0) AS general_tool_bindings,
       coalesce(array_length(b.delegation_targets,1),0) AS general_delegation_targets,
       x.exchange_id,x.state AS bounded_exchange_state,x.fence,
       x.commit_id,x.completed_at,
       (x.state='completed' AND x.commit_id IS NOT NULL AND x.completed_at IS NOT NULL
        AND x.result IS NOT NULL AND
        x.result->>'exchangeId'=x.exchange_id::text AND
        x.result->>'workerId'=x.worker_id::text AND
        x.result->>'ownerId'=x.owner_id::text AND
        x.result->>'projectId'=x.project_id AND
        x.result->>'companyId'=x.company_id AND
        x.result->>'targetBrainKey'=x.brain_key AND
        x.result->>'brainVersion'=x.brain_version::text AND
        x.result->>'modelId'=x.model_id AND
        x.result->>'modelDigest'=x.expected_model_digest AND
        x.result->>'inputHash'=x.input_hash AND
        x.result->>'fencingToken'=x.fence::text AND
        x.result->'paidUsageAuthorized'='false'::jsonb AND
        x.result->'companyBuildStarted'='false'::jsonb AND
        x.result->'generalToolsExecuted'='false'::jsonb AND
        encode(sha256(convert_to(x.result->>'outputText','UTF8')),'hex')=x.result->>'outputHash' AND
        (x.result->>'outputText')::jsonb=jsonb_build_object(
          'exchangeId',x.exchange_id,'projectId',x.project_id,'companyId',x.company_id,
          'targetBrainKey',x.brain_key,'nonce',x.nonce,'parentResponseHash',x.parent_response_hash,
          'accepted',true,'companyBuildStarted',false,'paidUsageAuthorized',false)
       ) AS bounded_receipt_consistent
FROM public.command_center_specialist_brains b
LEFT JOIN public.command_center_pc_activation_exchanges x
ON x.owner_id=b.owner_id AND x.project_id=b.project_id AND x.brain_version=b.version;

CREATE OR REPLACE VIEW public.command_center_activation_live_summary_v1
WITH (security_invoker=true)
AS
SELECT owner_id,
 count(*)::integer AS registered_specialists,
 count(*) FILTER (WHERE bounded_exchange_state='completed')::integer AS completed_bounded_exchanges,
 count(*) FILTER (WHERE bounded_exchange_state='queued')::integer AS queued_bounded_exchanges,
 count(*) FILTER (WHERE bounded_exchange_state='claimed')::integer AS claimed_bounded_exchanges,
 count(*) FILTER (WHERE bounded_exchange_state='uncertain')::integer AS uncertain_bounded_exchanges,
 count(*) FILTER (WHERE bounded_receipt_consistent)::integer AS internally_consistent_receipts,
 count(*) FILTER (WHERE bounded_exchange_state='completed' AND bounded_receipt_consistent IS DISTINCT FROM TRUE)::integer AS inconsistent_completed_receipts,
 count(*) FILTER (WHERE general_brain_enabled)::integer AS generally_enabled_brains,
 count(*) FILTER (WHERE general_tool_bindings>0)::integer AS tool_bound_brains,
 count(*) FILTER (WHERE general_delegation_targets>0)::integer AS delegation_bound_brains,
 round((100.0*count(*) FILTER (WHERE bounded_receipt_consistent))/nullif(count(*),0),1) AS bounded_exchange_verified_pct
FROM public.command_center_activation_live_by_project_v1
GROUP BY owner_id;

REVOKE ALL ON public.command_center_activation_live_by_project_v1 FROM PUBLIC, anon;
REVOKE ALL ON public.command_center_activation_live_summary_v1 FROM PUBLIC, anon;
GRANT SELECT ON public.command_center_activation_live_by_project_v1 TO authenticated;
GRANT SELECT ON public.command_center_activation_live_summary_v1 TO authenticated;

COMMENT ON VIEW public.command_center_activation_live_by_project_v1 IS
'Owner-RLS read-only current specialist exchange and operational status. Consistent bounded receipt is not general tool/executor/browser activation.';
COMMENT ON VIEW public.command_center_activation_live_summary_v1 IS
'Owner-RLS live counts; bounded_exchange_verified_pct measures only local-model acknowledgement proof, never company completion.';
