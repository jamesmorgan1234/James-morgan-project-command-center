-- READ-ONLY RECOVERY SNAPSHOT. NOT A MIGRATION. Retrieved 2026-11-06 UTC.
CREATE OR REPLACE FUNCTION public.command_center_pc_cancel_inference(p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); r public.command_center_pc_inference_requests%rowtype;
begin
 if u is null or not public.is_command_center_authorized() then raise exception 'Owner authorization required'; end if;
 update public.command_center_pc_inference_requests set state='cancelled',updated_at=now(),lease_expires_at=null
 where owner_id=u and request_id=p_request_id and state in ('queued','claimed') returning * into r;
 if not found then raise exception 'Not cancellable or not found'; end if;
 return jsonb_build_object('request_id',r.request_id,'state',r.state);
end $function$;

CREATE OR REPLACE FUNCTION public.command_center_pc_claim_service(p_owner_id uuid, p_worker_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.command_center_pc_inference_requests%rowtype;
 t public.command_center_brain_conversation_turns%rowtype;
begin
 if not exists(select 1 from public.command_center_pc_worker_registrations w
  join public.command_center_members m on m.user_id=w.owner_id
  where w.owner_id=p_owner_id and w.worker_id=p_worker_id and w.enabled and w.revoked_at is null
   and m.access_status='active' and m.revoked_at is null) then raise exception 'Worker registration or owner inactive'; end if;
 update public.command_center_pc_inference_requests
  set state='failed',error_code='worker_lease_retry_exhausted',updated_at=now()
  where owner_id=p_owner_id and state='claimed' and lease_expires_at<=now() and attempts>=3;
 select * into r from public.command_center_pc_inference_requests
  where owner_id=p_owner_id and (state='queued' or (state='claimed' and lease_expires_at<now()))
   and attempts<3 and (project_id is null or exists(
    select 1 from public.command_center_specialist_brains b
    join public.command_center_provider_registry pr on pr.owner_id=b.owner_id
      and pr.provider_key='provider:owner-pc:'||p_worker_id::text
    where b.owner_id=p_owner_id and b.project_id=public.command_center_pc_inference_requests.project_id
      and b.brain_key='brain:company:future:'||right(b.project_id,3)||':v1'
      and b.enabled and b.health='healthy' and b.verification_state='verified'
      and b.lifecycle='active' and b.cost_class='free' and b.control_plane='command_center'
      and b.project_id=any(b.supported_project_ids)
      and ('company:future:'||right(b.project_id,3))=any(b.supported_company_ids)
      and pr.enabled and pr.health='available'
      and pr.verification='live_verified' and pr.cost='free'
      and pr.capabilities @> array['brain.respond.read_only']::text[]
      and pr.scopes @> array['company-brain-read-only']::text[]
      and pr.configuration->>'worker_id'=p_worker_id::text
      and pr.provider_key=any(b.provider_keys)
   ))
  order by created_at asc limit 1 for update skip locked;
 if not found then return null; end if;
 select * into t from public.command_center_brain_conversation_turns
   where owner_id=r.owner_id and conversation_id=r.conversation_id and turn_id=r.owner_turn_id
   and role='owner' and redaction_state='safe_text';
 if not found or t.project_id is distinct from r.project_id or t.safe_text is null then
   update public.command_center_pc_inference_requests
    set state='failed',error_code='owner_turn_missing',updated_at=now() where request_id=r.request_id;
   return null;
 end if;
 update public.command_center_pc_inference_requests set state='claimed',worker_id=p_worker_id,
  attempts=attempts+1,fencing_token=fencing_token+1,
  lease_expires_at=now()+interval '180 seconds',updated_at=now()
  where request_id=r.request_id returning * into r;
 update public.command_center_pc_worker_registrations set last_seen_at=now() where worker_id=p_worker_id;
 return jsonb_build_object(
  'requestId',r.request_id,'projectId',r.project_id,'conversationId',r.conversation_id,
  'ownerTurnId',r.owner_turn_id,'workerId',p_worker_id,'fencingToken',r.fencing_token,
  'ownerText',t.safe_text,'redactionState','safe_text','ownerAuthenticated',true,
  'ownerAuthorized',true,'queueClaimVerified',true,'action','brain.respond.read_only',
  'allowPaid',false,'allowProtected',false,'writesAuthorized',false,
  'scheduleAuthorized',false,'executionAuthorized',false);
end $function$;

CREATE OR REPLACE FUNCTION public.command_center_pc_complete_service(p_owner_id uuid, p_worker_id uuid, p_request_id uuid, p_fencing_token bigint, p_model_id text, p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare r public.command_center_pc_inference_requests%rowtype;
 v_turn uuid; v_hash text;
begin
 select * into r from public.command_center_pc_inference_requests
  where owner_id=p_owner_id and request_id=p_request_id for update;
 if not found or r.state<>'claimed' or r.worker_id<>p_worker_id or r.fencing_token<>p_fencing_token
  or r.lease_expires_at<=now() then raise exception 'Stale, expired, or unauthorized worker result'; end if;
 if not exists(select 1 from public.command_center_pc_worker_registrations w
  join public.command_center_members m on m.user_id=w.owner_id
  where w.worker_id=p_worker_id and w.owner_id=p_owner_id and w.enabled and w.revoked_at is null
   and m.access_status='active' and m.revoked_at is null)
 then raise exception 'Revoked worker or owner'; end if;
 if p_text is null or length(btrim(p_text)) not between 1 and 8000 or p_model_id is null
  or p_model_id !~ '^[A-Za-z0-9][A-Za-z0-9._:/-]{0,130}$'
  or p_model_id ~ ':cloud$' then raise exception 'Model response invalid or prohibited'; end if;
 if not exists(select 1 from public.command_center_brain_conversations c
  where c.owner_id=p_owner_id and c.conversation_id=r.conversation_id and c.state='active'
   and c.project_id is not distinct from r.project_id) then raise exception 'Conversation no longer active'; end if;
 v_hash:=encode(sha256(convert_to(btrim(p_text),'UTF8')),'hex');
 insert into public.command_center_brain_conversation_turns(
  owner_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,
  safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at
 ) values(p_owner_id,r.conversation_id,r.project_id,'brain','question',false,'safe_text',
  btrim(p_text),'brain:pc-response:'||r.request_id,v_hash,
  array['brain:response-to:'||r.owner_turn_id,'brain:pc-worker:'||p_worker_id,
   'brain:model:'||p_model_id,'brain:workstation-claim:'||r.request_id],false,now())
 returning turn_id into v_turn;
 update public.command_center_pc_inference_requests set state='completed',brain_turn_id=v_turn,
   model_id=p_model_id,content_hash=v_hash,lease_expires_at=null,
   completed_at=now(),updated_at=now() where request_id=r.request_id;
 update public.command_center_brain_conversations set updated_at=now()
  where owner_id=p_owner_id and conversation_id=r.conversation_id;
 return jsonb_build_object('requestId',r.request_id,'projectId',r.project_id,'brainTurnId',v_turn,
  'workerAttestedInference',true,'canonicalWritesAuthorized',false,'resultHash',v_hash);
end $function$;

CREATE OR REPLACE FUNCTION public.command_center_pc_enqueue_inference(p_request_id uuid, p_conversation_id uuid, p_owner_turn_id uuid, p_project_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid(); c public.command_center_brain_conversations%rowtype;
 t public.command_center_brain_conversation_turns%rowtype;
 existing public.command_center_pc_inference_requests%rowtype;
begin
 if u is null or not public.is_command_center_authorized() then raise exception 'Owner authorization required'; end if;
 if p_request_id is null or p_conversation_id is null or p_owner_turn_id is null then raise exception 'Complete request identity required'; end if;
 if p_project_id is not null and not (p_project_id ~ '^project:company:future:[0-9]{3}$'
   and substring(p_project_id from 24 for 3)::integer between 1 and 117)
 then raise exception 'Company project outside 001..117'; end if;
 select * into c from public.command_center_brain_conversations
   where owner_id=u and conversation_id=p_conversation_id and state='active';
 if not found or c.project_id is distinct from p_project_id then raise exception 'Conversation scope mismatch'; end if;
 select * into t from public.command_center_brain_conversation_turns
   where owner_id=u and conversation_id=c.conversation_id and turn_id=p_owner_turn_id and role='owner';
 if not found or t.project_id is distinct from p_project_id or t.redaction_state<>'safe_text'
   or t.safe_text is null or length(btrim(t.safe_text)) not between 1 and 12000
   or t.content_hash !~ '^[a-f0-9]{64}$' then raise exception 'Owner turn not eligible'; end if;
 insert into public.command_center_pc_inference_requests(request_id,owner_id,project_id,conversation_id,owner_turn_id)
 values(p_request_id,u,p_project_id,p_conversation_id,p_owner_turn_id) on conflict do nothing;
 select * into existing from public.command_center_pc_inference_requests where owner_id=u and owner_turn_id=p_owner_turn_id;
 if not found or existing.request_id<>p_request_id or existing.conversation_id<>p_conversation_id
   or existing.project_id is distinct from p_project_id then raise exception 'Duplicate owner turn requires original request identity'; end if;
 return jsonb_build_object('request_id',existing.request_id,'state',existing.state,
   'project_id',existing.project_id,'owner_turn_id',existing.owner_turn_id);
end $function$;

CREATE OR REPLACE FUNCTION public.command_center_pc_heartbeat_service(p_owner_id uuid, p_worker_id uuid, p_request_id uuid, p_fencing_token bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 update public.command_center_pc_inference_requests set lease_expires_at=now()+interval '180 seconds',updated_at=now()
 where request_id=p_request_id and owner_id=p_owner_id and worker_id=p_worker_id and fencing_token=p_fencing_token
  and state='claimed' and lease_expires_at>now()
  and exists(select 1 from public.command_center_pc_worker_registrations w
   join public.command_center_members m on m.user_id=w.owner_id
   where w.worker_id=p_worker_id and w.owner_id=p_owner_id and w.enabled and w.revoked_at is null
    and m.access_status='active' and m.revoked_at is null);
 return found;
end $function$;

CREATE OR REPLACE FUNCTION public.command_center_pc_owner_worker_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=auth.uid();
begin
 if u is null or not public.is_command_center_authorized() then raise exception 'Owner authorization required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
  'workerId',w.worker_id,'label',w.label,'enabled',w.enabled,
  'lastSeenAt',w.last_seen_at,
  'online',w.enabled and w.revoked_at is null and w.last_seen_at is not null
    and w.last_seen_at>=now()-interval '180 seconds',
  'revoked',w.revoked_at is not null) order by w.created_at)
  from public.command_center_pc_worker_registrations w where w.owner_id=u),'[]'::jsonb);
end $function$;
