-- Trusted-server persistence for the existing publish ledger, not a new authorization issuer.
create table command_center_private.social_publish_reservations (
 owner_id uuid not null references auth.users(id), intent_id text not null, authorization_ref text not null,
 idempotency_key text not null, provider_request_ref text not null, envelope text not null,
 reserved_at timestamptz not null default now(),
 primary key(owner_id,intent_id), unique(owner_id,authorization_ref), unique(owner_id,idempotency_key), unique(owner_id,provider_request_ref),
 foreign key(owner_id,intent_id) references public.command_center_social_publish_intents(owner_id,intent_id)
);
create trigger social_reservations_immutable before update or delete on command_center_private.social_publish_reservations for each row execute function public.command_center_reject_social_publish_evidence_mutation();
revoke all on command_center_private.social_publish_reservations from public,anon,authenticated,service_role;
create function command_center_private.reserve_social_publish(p_owner uuid,p_intent text,p_authorization text,p_idempotency text,p_request text,p_envelope text)
returns text language plpgsql security definer set search_path='' as $$
declare i public.command_center_social_publish_intents; prior command_center_private.social_publish_reservations;
begin
 if exists(select 1 from unnest(array[p_intent,p_authorization,p_idempotency,p_request,p_envelope]) r where nullif(btrim(r),'') is null) then raise exception 'Exact publish reservation identity required'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text,105));
 select * into prior from command_center_private.social_publish_reservations where owner_id=p_owner and (intent_id=p_intent or authorization_ref=p_authorization or idempotency_key=p_idempotency or provider_request_ref=p_request);
 if found then
 if prior.intent_id=p_intent and prior.authorization_ref=p_authorization and prior.idempotency_key=p_idempotency and prior.provider_request_ref=p_request and prior.envelope=p_envelope then return 'already_reserved'; end if;
 raise exception 'Publish replay/identity collision; reconcile prior effect'; end if;
 select * into i from public.command_center_social_publish_intents where owner_id=p_owner and intent_id=p_intent;
 if not found or i.authorization_ref<>p_authorization or i.idempotency_key<>p_idempotency or i.authorization_expires_at<=now() or i.authorization_observed_at>now() or i.authorization_observed_at<now()-interval '5 minutes' or (i.scheduled_at is not null and i.scheduled_at>now()) then raise exception 'Current exact publish authorization/schedule missing'; end if;
 if jsonb_typeof(p_envelope::jsonb)<>'array' or p_envelope::jsonb->>0 is distinct from p_owner::text or p_envelope::jsonb->>3 is distinct from i.brand_id or p_envelope::jsonb->>5 is distinct from i.account_id or p_envelope::jsonb->>9 is distinct from i.intent_id or p_envelope::jsonb->>12 is distinct from i.draft_content_hash then raise exception 'Publish reservation envelope mismatch'; end if;
 insert into command_center_private.social_publish_reservations(owner_id,intent_id,authorization_ref,idempotency_key,provider_request_ref,envelope) values(p_owner,p_intent,p_authorization,p_idempotency,p_request,p_envelope);
 return 'reserved';
end $$;
revoke all on function command_center_private.reserve_social_publish(uuid,text,text,text,text,text) from public,anon,authenticated;
grant usage on schema command_center_private to service_role;
grant execute on function command_center_private.reserve_social_publish(uuid,text,text,text,text,text) to service_role;
grant select on command_center_private.social_publish_reservations to service_role;
-- Ordinary draft owners cannot fabricate dispatches, receipts or authorization evidence.
revoke insert on public.command_center_social_publish_intents,public.command_center_social_publish_state_history,public.command_center_social_publish_attempt_history,public.command_center_social_publish_receipts from authenticated;
grant select,insert on public.command_center_social_publish_intents,public.command_center_social_publish_state_history,public.command_center_social_publish_attempt_history,public.command_center_social_publish_receipts to service_role;
create function public.command_center_guard_social_publish_receipt() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.command_center_social_publish_intents i join command_center_private.social_publish_reservations r using(owner_id,intent_id) where i.owner_id=new.owner_id and i.intent_id=new.intent_id and i.account_id=new.account_id and i.idempotency_key=new.idempotency_key) then raise exception 'Publication receipt requires exact reserved account/intent'; end if;
 return new;
end $$;
revoke all on function public.command_center_guard_social_publish_receipt() from public,anon,authenticated;
create trigger social_publish_receipt_guard before insert on public.command_center_social_publish_receipts for each row execute function public.command_center_guard_social_publish_receipt();
alter table public.command_center_social_publish_state_history drop constraint command_center_social_publish_state_history_state_check;
alter table public.command_center_social_publish_state_history add constraint command_center_social_publish_state_history_state_check check(state in ('prepared','scheduled','submitting','uncertain','published','failed','cancelled'));
alter table public.command_center_social_publish_state_history add column scheduled_at timestamptz;
create or replace view public.command_center_social_publish_current with (security_invoker=true) as select distinct on(s.owner_id,s.intent_id) s.owner_id,s.intent_id,s.state,s.observed_at,s.evidence_refs,i.brand_id,i.account_id,i.draft_id,i.draft_version,i.draft_content_hash,i.profile_key,i.profile_version,i.idempotency_key,coalesce(s.scheduled_at,i.scheduled_at) as scheduled_at,i.authorization_ref,i.authorization_account_id,i.authorization_observed_at,i.authorization_expires_at,i.required_scopes from public.command_center_social_publish_state_history s join public.command_center_social_publish_intents i using(owner_id,intent_id) order by s.owner_id,s.intent_id,s.observed_at desc;
alter table public.command_center_social_platform_profile_history add column publish_scope text check(publish_scope is null or btrim(publish_scope)<>'');
