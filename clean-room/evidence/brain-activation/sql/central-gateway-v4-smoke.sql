-- One idempotent, owner-authorized central model diagnostic; no company workflow.
begin;
do $smoke$
declare u uuid;cid uuid;tid uuid;rid uuid;question text;
begin
 select w.owner_id into strict u from public.command_center_pc_worker_registrations w
 join public.command_center_members m on m.user_id=w.owner_id
 join public.command_center_provider_registry p on p.owner_id=w.owner_id and p.provider_key='provider:owner-pc:'||w.worker_id::text
 where w.worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f' and w.enabled and w.revoked_at is null
 and w.last_seen_at>now()-interval '3 minutes' and m.access_status='active' and m.revoked_at is null
 and p.enabled and p.cost='free' and p.health='available' and p.verification='live_verified'
 and p.configuration->>'model_id'='qwen3:4b-instruct' and p.configuration->>'payment_authorized'='false'
 for share of w,m,p;
 perform pg_advisory_xact_lock(hashtextextended('brain:central-gateway-v4-smoke:'||u::text,0));
 if exists(select 1 from public.command_center_brain_conversation_turns where owner_id=u and content_ref='brain:central-gateway-v4-smoke:20261106') then return;end if;
 select c.conversation_id into strict cid from public.command_center_brain_conversations c
 join public.command_center_pc_inference_requests q on q.owner_id=c.owner_id and q.conversation_id=c.conversation_id
 where c.owner_id=u and c.project_id is null and c.state='active'
 and q.request_id='3ba37fbd-5ffe-4f17-9d6f-5575d90ab84a' and q.state='completed' for share of c;
 tid:=gen_random_uuid();rid:=gen_random_uuid();
 question:='COMMAND CENTER activation-only gateway diagnostic authorized by the owner task. What count of specialist Brain registrations is reported in your current canonical catalogue context? Reply with only the integer. Do not start or perform company work.';
 insert into public.command_center_brain_conversation_turns(owner_id,turn_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,canonical_writes_authorized,created_at)
 values(u,tid,cid,null,'owner','question',false,'safe_text',question,'brain:central-gateway-v4-smoke:20261106',
 encode(sha256(convert_to(question,'UTF8')),'hex'),array['evd_owner-command-center-brain-activation-20261105','brain:diagnostic-question:system-generated-under-owner-task'],false,now());
 insert into public.command_center_pc_inference_requests(request_id,owner_id,project_id,conversation_id,owner_turn_id)
 values(rid,u,null,cid,tid);
end $smoke$;
commit;
