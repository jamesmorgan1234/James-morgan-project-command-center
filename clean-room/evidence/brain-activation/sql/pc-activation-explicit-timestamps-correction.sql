-- Correct explicit creation timestamps required by the live immutable turn schema.
-- No queue or Brain state reset; original failed seed transaction created no row.
begin;
create or replace function command_center_pc_private.command_center_pc_seed_activation_probe_service(p_owner uuid,p_worker uuid,p_project text,p_brain_version bigint,p_provider_version bigint,p_authority text)
returns jsonb language plpgsql security definer set search_path='' as $f$
declare s jsonb;ac jsonb;rid uuid;tid uuid;question text;existing public.command_center_pc_inference_requests%rowtype;
begin
 if p_authority is distinct from 'evd_owner-command-center-brain-activation-20261105' then raise exception 'Exact activation task authority required';end if;
 perform pg_advisory_xact_lock(hashtextextended('pc-activation:'||p_owner||':'||p_project,0));
 -- Idempotency precedes snapshot comparison because completed evidence advances workspace history.
 select * into existing from public.command_center_pc_inference_requests where owner_id=p_owner and project_id=p_project
 and activation_contract is not null and route_snapshot->>'brainVersion'=p_brain_version::text;
 if found then return jsonb_build_object('requestId',existing.request_id,'state',existing.state,'duplicate',true);end if;
 s:=command_center_pc_private.command_center_pc_activation_snapshot_service(p_owner,p_worker,p_project);
 if s->>'brainVersion' is distinct from p_brain_version::text or s->>'providerVersion' is distinct from p_provider_version::text
 then raise exception 'Activation binding version changed';end if;
 rid:=gen_random_uuid();tid:=gen_random_uuid();
 ac:=jsonb_build_object('contract','cc-pc-activation-probe-v1','purpose','activation_probe','authorityRef',p_authority,
 'requestId',rid,'ownerId',p_owner,'workerId',p_worker,'conversationId',s->>'conversationId','ownerTurnId',tid,
 'issuedAt',now(),'expiresAt',now()+interval '6 hours','routeSnapshot',s,'systemHash',encode(sha256(convert_to(s->>'system','UTF8')),'hex'),
 'companyBuildAuthorized',false,'toolExecutionAuthorized',false,'paidUsageAuthorized',false);
 question:='Owner-authorized COMMAND CENTER activation diagnostic only. Reply with exactly this JSON object, without Markdown or commentary: '||jsonb_build_object(
 'projectId',p_project,'companyId',s->>'companyId','brainKey',s->>'brainKey','brainVersion',p_brain_version,
 'roadmapVersion',(s->>'roadmapVersion')::bigint,'checkpointId',s->>'checkpointId','nonce',rid,
 'companyBuildStarted',false,'paidUsageAuthorized',false)::text;
 insert into public.command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at)
 values(p_owner,tid,(s->>'conversationId')::uuid,p_project,'owner','question',false,'safe_text',question,'brain:owner-authorized-activation-diagnostic:'||rid,
 encode(sha256(convert_to(question,'UTF8')),'hex'),array[p_authority,'brain:diagnostic-question:system-generated-under-owner-task'],false,now());
 insert into public.command_center_pc_inference_requests(request_id,owner_id,project_id,conversation_id,owner_turn_id,activation_contract,route_snapshot)
 values(rid,p_owner,p_project,(s->>'conversationId')::uuid,tid,ac,s);
 return jsonb_build_object('requestId',rid,'state','queued','duplicate',false);
end $f$;
create or replace function command_center_pc_private.command_center_pc_complete_v4_service(p_owner uuid,p_worker uuid,p_request uuid,p_fence bigint,p_model text,p_digest text,p_text text)
returns jsonb language plpgsql security definer set search_path='' as $f$
declare q public.command_center_pc_inference_requests%rowtype;s jsonb;actual jsonb;expected jsonb;receipt jsonb;new_turn uuid;
begin
 select * into strict q from public.command_center_pc_inference_requests where owner_id=p_owner and request_id=p_request for update;
 if q.activation_contract is null then return public.command_center_pc_complete_service(p_owner,p_worker,p_request,p_fence,p_model,p_text);end if;
 if q.state is distinct from 'claimed' or q.worker_id is distinct from p_worker or q.fencing_token is distinct from p_fence or q.lease_expires_at is null or q.lease_expires_at<=now()
 or (q.activation_contract->>'expiresAt')::timestamptz<=now() then raise exception 'Activation claim stale, cancelled or expired';end if;
 s:=command_center_pc_private.command_center_pc_activation_snapshot_service(p_owner,p_worker,q.project_id);
 if s is distinct from q.route_snapshot or p_model is distinct from s->>'modelId' or coalesce(p_digest,'') !~ '^[a-f0-9]{64}$'
 then raise exception 'Activation route, configuration or model not verified';end if;
 actual:=btrim(p_text)::jsonb;
 expected:=jsonb_build_object('projectId',q.project_id,'companyId',s->>'companyId','brainKey',s->>'brainKey','brainVersion',(s->>'brainVersion')::bigint,
 'roadmapVersion',(s->>'roadmapVersion')::bigint,'checkpointId',s->>'checkpointId','nonce',q.request_id,'companyBuildStarted',false,'paidUsageAuthorized',false);
 if actual is distinct from expected then raise exception 'Actual model diagnostic response did not satisfy context contract';end if;
 insert into public.command_center_brain_conversation_turns(owner_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at)
 values(p_owner,q.conversation_id,q.project_id,'brain','question',false,'safe_text',btrim(p_text),'brain:pc-response:'||q.request_id,
 encode(sha256(convert_to(btrim(p_text),'UTF8')),'hex'),array['brain:response-to:'||q.owner_turn_id,'brain:pc-worker:'||p_worker,
 'brain:model:'||p_model,'brain:workstation-claim:'||q.request_id,
 'brain:activation-contract:'||encode(sha256(convert_to(q.activation_contract::text,'UTF8')),'hex'),
 'brain:diagnostic-specialist:'||(s->>'brainKey')||'@'||(s->>'brainVersion'),'brain:model-digest:'||p_digest,
 'brain:diagnostic-only:not-full-operational-activation'],false,now()) returning turn_id into new_turn;
 update public.command_center_pc_inference_requests set state='completed',brain_turn_id=new_turn,model_id=p_model,model_digest=p_digest,
 content_hash=encode(sha256(convert_to(btrim(p_text),'UTF8')),'hex'),lease_expires_at=null,completed_at=now(),updated_at=now()
 where owner_id=p_owner and request_id=p_request;
 update public.command_center_brain_conversations set updated_at=now() where owner_id=p_owner and conversation_id=q.conversation_id;
 receipt:=jsonb_build_object('requestId',q.request_id,'projectId',q.project_id,'brainTurnId',new_turn,'workerAttestedInference',true,
 'canonicalWritesAuthorized',false,'resultHash',encode(sha256(convert_to(btrim(p_text),'UTF8')),'hex'));
 -- Append diagnostic evidence while preserving business state, blockers and run binding.
 update public.command_center_brain_project_workspaces set version=version+1,turn_ids=turn_ids||array[q.owner_turn_id,new_turn],
 evidence_refs=evidence_refs||array['brain:activation-probe:'||p_request],verified_result_refs=verified_result_refs||array['brain:diagnostic-only:'||p_request],
 recorded_at=now(),updated_at=now() where owner_id=p_owner and project_id=q.project_id and version=(s->>'workspaceVersion')::bigint;
 if not found then raise exception 'Concurrent workspace change';end if;
 insert into public.command_center_brain_project_workspace_versions(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at)
 select owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at
 from public.command_center_brain_project_workspaces where owner_id=p_owner and project_id=q.project_id;
 return receipt||jsonb_build_object('modelDigest',p_digest,'activationContractHash',encode(sha256(convert_to(q.activation_contract::text,'UTF8')),'hex'),'diagnosticOnly',true);
end $f$;
commit;
