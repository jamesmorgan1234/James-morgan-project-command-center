create function public.command_center_guard_social_inbound() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.command_center_social_identity_map_history where owner_id=new.owner_id and brand_id=new.brand_id and account_identity_id=new.account_id and platform=new.platform) then raise exception 'Inbound canonical account/platform mismatch'; end if;
 return new;
end $$;
create trigger social_inbound_identity_guard before insert on public.command_center_social_inbound_message_history for each row execute function public.command_center_guard_social_inbound();
create function public.command_center_guard_social_reply() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.command_center_social_inbound_message_history where owner_id=new.owner_id and message_id=new.message_id and brand_id=new.brand_id and account_id=new.account_id and thread_id=new.thread_id and received_at<=new.created_at) then raise exception 'Reply message/account/thread mismatch'; end if;
 return new;
end $$;
create trigger social_reply_identity_guard before insert on public.command_center_social_reply_draft_history for each row execute function public.command_center_guard_social_reply();
create function public.command_center_guard_social_send() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.command_center_social_reply_draft_history where owner_id=new.owner_id and reply_draft_id=new.reply_draft_id and reply_version=new.reply_draft_version and content_hash=new.reply_content_hash and brand_id=new.brand_id and account_id=new.account_id and thread_id=new.thread_id and created_at<=new.authorization_observed_at) then raise exception 'Send exact reply/account/thread authorization mismatch'; end if;
 return new;
end $$;
create trigger social_send_identity_guard before insert on public.command_center_social_communication_send_intents for each row execute function public.command_center_guard_social_send();
revoke all on function public.command_center_guard_social_inbound(),public.command_center_guard_social_reply(),public.command_center_guard_social_send() from public,anon,authenticated;
revoke insert on public.command_center_social_communication_send_intents from authenticated;
grant select,insert on public.command_center_social_communication_send_intents to service_role;
create table command_center_private.social_send_reservations (
 owner_id uuid not null,intent_id text not null,authorization_ref text not null,idempotency_key text not null,provider_request_ref text not null,envelope text not null,reserved_at timestamptz not null default now(),
 primary key(owner_id,intent_id),unique(owner_id,authorization_ref),unique(owner_id,idempotency_key),unique(owner_id,provider_request_ref),foreign key(owner_id,intent_id) references public.command_center_social_communication_send_intents(owner_id,send_intent_id)
);
create trigger social_sends_immutable before update or delete on command_center_private.social_send_reservations for each row execute function public.command_center_reject_social_publish_evidence_mutation();
revoke all on command_center_private.social_send_reservations from public,anon,authenticated,service_role;
create function command_center_private.reserve_social_send(p_owner uuid,p_intent text,p_authorization text,p_idempotency text,p_request text,p_envelope text)
returns text language plpgsql security definer set search_path='' as $$
declare prior command_center_private.social_send_reservations;i public.command_center_social_communication_send_intents;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,106));
 select * into prior from command_center_private.social_send_reservations where owner_id=p_owner and (intent_id=p_intent or authorization_ref=p_authorization or idempotency_key=p_idempotency or provider_request_ref=p_request);
 if found then if prior.intent_id=p_intent and prior.authorization_ref=p_authorization and prior.idempotency_key=p_idempotency and prior.provider_request_ref=p_request and prior.envelope=p_envelope then return 'already_reserved'; end if;raise exception 'Send replay/identity collision; reconciliation required';end if;
 select * into i from public.command_center_social_communication_send_intents where owner_id=p_owner and send_intent_id=p_intent;
 if not found or i.authorization_ref<>p_authorization or i.idempotency_key<>p_idempotency or i.authorization_expires_at<=now() or i.authorization_observed_at>now() or i.authorization_observed_at<now()-interval '5 minutes' or nullif(btrim(p_request),'') is null then raise exception 'Current exact send authorization missing';end if;
 if p_envelope::jsonb->>0 is distinct from p_owner::text or p_envelope::jsonb->>5 is distinct from i.account_id or p_envelope::jsonb->>8 is distinct from i.thread_id or p_envelope::jsonb->>13 is distinct from i.reply_content_hash then raise exception 'Send envelope mismatch';end if;
 insert into command_center_private.social_send_reservations(owner_id,intent_id,authorization_ref,idempotency_key,provider_request_ref,envelope)values(p_owner,p_intent,p_authorization,p_idempotency,p_request,p_envelope);return 'reserved';
end $$;
revoke all on function command_center_private.reserve_social_send(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function command_center_private.reserve_social_send(uuid,text,text,text,text,text) to service_role;
grant select on command_center_private.social_send_reservations to service_role;
