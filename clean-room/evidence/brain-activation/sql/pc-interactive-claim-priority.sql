-- Preserve original claims and permissions; service queued owner input before bulk diagnostics.
begin;
create or replace function command_center_pc_private.command_center_pc_claim_v4_service(p_owner uuid,p_worker uuid,p_client text)
returns jsonb language plpgsql security definer set search_path='' as $f$
declare q public.command_center_pc_inference_requests%rowtype;t public.command_center_brain_conversation_turns%rowtype;s jsonb;regular jsonb;
begin
 if p_client is distinct from 'cc-pc-inference-activation-v1' then return public.command_center_pc_claim_service(p_owner,p_worker);end if;
 -- Interactive owner messages must not wait behind the portfolio diagnostic batch.
 -- The existing ordinary claim procedure retains all identity/lease/scope checks.
 regular:=public.command_center_pc_claim_service(p_owner,p_worker);
 if regular is not null then return regular;end if;
 update public.command_center_pc_inference_requests set state='failed',error_code='activation_authority_expired',lease_expires_at=null,updated_at=now()
 where owner_id=p_owner and activation_contract is not null and state in ('queued','claimed') and (activation_contract->>'expiresAt')::timestamptz<=now();
 select * into q from public.command_center_pc_inference_requests where owner_id=p_owner and activation_contract is not null
 and activation_contract->>'workerId'=p_worker::text and attempts<3
 and (state='queued' or (state='claimed' and lease_expires_at<now())) order by created_at,request_id limit 1 for update skip locked;
 if not found then return public.command_center_pc_claim_service(p_owner,p_worker);end if;
 begin
  s:=command_center_pc_private.command_center_pc_activation_snapshot_service(p_owner,p_worker,q.project_id);
 exception when others then
  update public.command_center_pc_inference_requests set state='failed',error_code='activation_route_not_eligible',lease_expires_at=null,updated_at=now() where request_id=q.request_id;
  return public.command_center_pc_claim_service(p_owner,p_worker);
 end;
 if s is distinct from q.route_snapshot then
  update public.command_center_pc_inference_requests set state='failed',error_code='activation_context_changed',lease_expires_at=null,updated_at=now() where request_id=q.request_id;
  return public.command_center_pc_claim_service(p_owner,p_worker);
 end if;
 select * into strict t from public.command_center_brain_conversation_turns where owner_id=p_owner and turn_id=q.owner_turn_id and conversation_id=q.conversation_id
 and project_id=q.project_id and role='owner' and redaction_state='safe_text' for share;
 if t.content_hash is distinct from encode(sha256(convert_to(t.safe_text,'UTF8')),'hex') then raise exception 'Diagnostic question integrity mismatch';end if;
 update public.command_center_pc_inference_requests set state='claimed',worker_id=p_worker,attempts=attempts+1,fencing_token=fencing_token+1,
 lease_expires_at=now()+interval '180 seconds',updated_at=now() where request_id=q.request_id returning * into q;
 return jsonb_build_object('requestId',q.request_id,'projectId',q.project_id,'conversationId',q.conversation_id,'ownerTurnId',q.owner_turn_id,
 'ownerId',p_owner,'workerId',p_worker,'fencingToken',q.fencing_token,'purpose','activation_probe','ownerText',t.safe_text,'redactionState','safe_text',
 'ownerAuthenticated',true,'ownerAuthorized',true,'queueClaimVerified',true,'action','brain.respond.read_only','allowPaid',false,'allowProtected',false,
 'writesAuthorized',false,'scheduleAuthorized',false,'executionAuthorized',false,'activationContractText',q.activation_contract::text,
 'activationContractHash',encode(sha256(convert_to(q.activation_contract::text,'UTF8')),'hex'));
end $f$;
commit;
