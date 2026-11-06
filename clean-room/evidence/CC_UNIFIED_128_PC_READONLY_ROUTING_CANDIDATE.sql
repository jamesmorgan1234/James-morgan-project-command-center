-- ISOLATED CANDIDATE ONLY. NOT DEPLOYED. No permissions, tools, worker access, or provider scopes granted.
-- Derived from live public function definitions and constraint as of 2026-11-05.
-- Apply only through a separately authorized, tested migration/release workflow.
-- Each legacy project must be an exact protected owner/company/specialist match.
begin;
alter table public.command_center_pc_inference_requests
 drop constraint cc_pc_scope;
alter table public.command_center_pc_inference_requests
 add constraint cc_pc_scope check(
   project_id is null or
   (
     project_id ~ '^project:company:future:(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,96})$'
     or project_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
   )
 );
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
 -- Every company must resolve through the same owner-scoped registry join.
 -- Identifier syntax never grants access, and company counts are not limits.
 if p_project_id is not null and not exists (
     select 1 from public.command_center_project_profiles p
     join public.command_center_specialist_brains b
       on b.owner_id=p.owner_id and b.project_id=p.project_id
     where p.owner_id=u and p.project_id=p_project_id
       and ((p_project_id ~ '^project:company:future:(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,96})$'
             and p.company_id=substring(p_project_id from 9))
         or (p_project_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and p.protected
             and p.company_id='company:legacy:'||p_project_id))
       and b.brain_key='brain:'||p.company_id||':v1'
       and p.project_id=any(b.supported_project_ids)
       and p.company_id=any(b.supported_company_ids)
       and b.control_plane='command_center' and b.cost_class='free'
 ) then raise exception 'Company project outside registered scope'; end if;
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
end $function$
;
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
    join public.command_center_project_profiles p on p.owner_id=b.owner_id
      and p.project_id=b.project_id
    where b.owner_id=p_owner_id and b.project_id=public.command_center_pc_inference_requests.project_id
      and b.brain_key='brain:'||p.company_id||':v1'
      and (
       (b.project_id ~ '^project:company:future:(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,96})$'
         and p.company_id=substring(b.project_id from 9))
       or
       (b.project_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and p.protected
         and p.company_id='company:legacy:'||b.project_id)
      )
      and b.enabled and b.health='healthy' and b.verification_state='verified'
      and b.lifecycle='active' and b.cost_class='free' and b.control_plane='command_center'
      and b.project_id=any(b.supported_project_ids)
      and p.company_id=any(b.supported_company_ids)
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
end $function$
;
-- Preserve existing EXECUTE grants and all owner/RLS/worker-token protections.
commit;
