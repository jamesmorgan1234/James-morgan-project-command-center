with checks as (
select j.project_id,j.state,j.invocation_id,j.completed_at,
coalesce(j.state='completed' and j.admission_authority='delegated-activation-check'
and b.version=j.brain_version and b.brain_key=j.brain_key and b.control_plane='command_center' and b.cost_class='free'
and b.supported_project_ids=array[j.project_id] and b.supported_company_ids=array[j.company_id]
and b.permission_keys @> array['project:'||j.project_id||':tools.request']
and ('provider:owner-pc:'||j.worker_id::text)=any(b.provider_keys)
and p.company_id=j.company_id and w.enabled and w.revoked_at is null and m.access_status='active' and m.revoked_at is null
and j.commit_id is not null and j.completed_at>=j.created_at and j.completed_at<j.lease_expires_at
and j.input_hash=encode(sha256(convert_to(j.input_text,'UTF8')),'hex')
and j.input_text::jsonb=jsonb_build_object('name','activation-check-'||j.invocation_id||'.txt','content','COMMAND_CENTER_ACTIVATION_CHECK:'||j.project_id||':'||j.invocation_id)
and j.result->>'toolKey'='owner-pc-artifacts' and j.result->>'toolVersion'='artifact-v1' and j.result->>'actionKey'='artifact.write'
and j.result->>'inputHash'=j.input_hash
and j.result->>'outputHash'=encode(sha256(convert_to(j.result->>'outputText','UTF8')),'hex')
and j.result->'lease'=jsonb_build_object('invocationId',j.invocation_id,'taskId','pc-tool:'||j.invocation_id,'workerId',j.worker_id,'ownerId',j.owner_id,'projectId',j.project_id,'companyId',j.company_id,'generation',1,'fencingToken',j.fence,'expiresAt',to_char(j.lease_expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
and (case when j.state='completed' then (j.result->>'outputText')::jsonb end)=jsonb_build_object('name','activation-check-'||j.invocation_id||'.txt','bytes',octet_length('COMMAND_CENTER_ACTIVATION_CHECK:'||j.project_id||':'||j.invocation_id),'sha256',encode(sha256(convert_to('COMMAND_CENTER_ACTIVATION_CHECK:'||j.project_id||':'||j.invocation_id,'UTF8')),'hex'),'scope','project_artifact_only'),false) proof_verified
from public.command_center_pc_tool_jobs j
join public.command_center_specialist_brains b on b.owner_id=j.owner_id and b.project_id=j.project_id
join public.command_center_project_profiles p on p.owner_id=j.owner_id and p.project_id=j.project_id
join public.command_center_pc_worker_registrations w on w.worker_id=j.worker_id and w.owner_id=j.owner_id
join public.command_center_members m on m.user_id=j.owner_id
where j.worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f' and j.admission_authority='delegated-activation-check')
select jsonb_build_object('observedAt',now(),'total',count(*),'completed',count(*) filter(where state='completed'),'independentlyVerified',count(*) filter(where proof_verified),'queued',count(*) filter(where state='queued'),'claimed',count(*) filter(where state='claimed'),'uncertain',count(*) filter(where state='uncertain'),'invalidCompleted',coalesce(jsonb_agg(project_id) filter(where state='completed' and not proof_verified),'[]'::jsonb)) result from checks;
