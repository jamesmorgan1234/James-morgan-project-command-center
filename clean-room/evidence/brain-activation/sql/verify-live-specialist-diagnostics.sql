with checks as (
select q.project_id,q.state,q.request_id,
coalesce(q.state='completed'
and b.version::text=q.route_snapshot->>'brainVersion'
and b.brain_key=q.route_snapshot->>'brainKey'
and p.company_id=q.route_snapshot->>'companyId'
and b.control_plane='command_center'
and b.supported_project_ids=array[q.project_id]
and b.supported_company_ids=array[p.company_id]
and b.permission_keys @> array['project:'||q.project_id||':context.read','project:'||q.project_id||':inference.read_only']
and encode(sha256(convert_to((to_jsonb(b)-'updated_at')::text,'UTF8')),'hex')=q.route_snapshot->>'brainConfigurationHash'
and encode(sha256(convert_to((to_jsonb(pr)-'updated_at')::text,'UTF8')),'hex')=q.route_snapshot->>'providerConfigurationHash'
and q.worker_id::text=q.activation_contract->>'workerId'
and q.activation_contract->>'authorityRef'='evd_owner-command-center-brain-activation-20261105'
and q.model_id=q.route_snapshot->>'modelId'
and q.model_digest ~ '^[a-f0-9]{64}$'
and t.owner_id=q.owner_id and t.project_id=q.project_id and t.conversation_id=q.conversation_id
and t.role='brain' and t.redaction_state='safe_text' and t.canonical_writes_authorized=false
and t.content_hash=q.content_hash and q.content_hash=encode(sha256(convert_to(t.safe_text,'UTF8')),'hex')
and t.evidence_refs @> array['brain:response-to:'||q.owner_turn_id,'brain:pc-worker:'||q.worker_id,'brain:workstation-claim:'||q.request_id,'brain:model-digest:'||q.model_digest,'brain:diagnostic-specialist:'||b.brain_key||'@'||b.version]
and ctx.content_hash=q.route_snapshot->>'contextHash' and ctx.content_hash=encode(sha256(convert_to(ctx.safe_text,'UTF8')),'hex')
and ctx.project_id=q.project_id and ctx.conversation_id=q.conversation_id
and w.version>=(q.route_snapshot->>'workspaceVersion')::bigint+1
and w.turn_ids @> array[q.owner_turn_id,q.brain_turn_id]
and w.verified_result_refs @> array['brain:diagnostic-only:'||q.request_id]
and (case when q.state='completed' then t.safe_text::jsonb end)=jsonb_build_object(
'projectId',q.project_id,'companyId',p.company_id,'brainKey',b.brain_key,'brainVersion',b.version,
'roadmapVersion',(q.route_snapshot->>'roadmapVersion')::bigint,'checkpointId',q.route_snapshot->>'checkpointId',
'nonce',q.request_id,'companyBuildStarted',false,'paidUsageAuthorized',false),false) proof_verified,
q.model_digest
from command_center_pc_inference_requests q
join command_center_specialist_brains b on b.owner_id=q.owner_id and b.project_id=q.project_id
join command_center_project_profiles p on p.owner_id=q.owner_id and p.project_id=q.project_id
join command_center_provider_registry pr on pr.owner_id=q.owner_id and pr.provider_key=q.route_snapshot->>'providerKey'
join command_center_brain_project_workspaces w on w.owner_id=q.owner_id and w.project_id=q.project_id
left join command_center_brain_conversation_turns t on t.owner_id=q.owner_id and t.turn_id=q.brain_turn_id
left join command_center_brain_conversation_turns ctx on ctx.owner_id=q.owner_id and ctx.turn_id=(q.route_snapshot->>'contextTurnId')::uuid
where q.activation_contract is not null)
select jsonb_build_object('observedAt',now(),'registeredDiagnostics',count(*),
'completed',count(*) filter(where state='completed'),
'independentlyVerified',count(*) filter(where proof_verified),
'invalidCompleted',coalesce(jsonb_agg(project_id) filter(where state='completed' and not proof_verified),'[]'::jsonb),
'modelDigests',jsonb_agg(distinct model_digest) filter(where proof_verified),
'queued',count(*) filter(where state='queued'),'claimed',count(*) filter(where state='claimed'),
'failed',count(*) filter(where state='failed')) result from checks;
