-- Category 7 / R4: durable authenticated provider callback hardening.
-- Extends the canonical side-effect inbox; it does not create a parallel callback queue.

alter table public.command_center_agency_side_effect_inbox
  add column if not exists company_id text,
  add column if not exists callback_occurred_at timestamptz,
  add column if not exists callback_binding_version text,
  add column if not exists callback_binding_hash text,
  add column if not exists signature_key_ref text,
  add column if not exists signature_verified_at timestamptz,
  add column if not exists signature_key_not_before timestamptz,
  add column if not exists signature_key_not_after timestamptz,
  add column if not exists signature_key_revoked_at timestamptz;

alter table public.command_center_agency_side_effect_inbox
  add constraint command_center_agency_side_effect_inbox_callback_binding_check
  check (
    callback_binding_version is null
    or (
      callback_binding_version='cc-webhook-v1'
      and callback_binding_hash ~ '^[a-f0-9]{64}$'
      and coalesce(btrim(signature_key_ref),'')<>''
      and signature_verified_at is not null
      and signature_key_not_before is not null
      and signature_key_not_after is not null
      and signature_key_not_after>signature_key_not_before
      and received_at>=signature_key_not_before
      and received_at<signature_key_not_after
      and (signature_key_revoked_at is null or received_at<signature_key_revoked_at)
    )
  );

create or replace function public.command_center_agency_record_authenticated_side_effect_inbox(
  p_project_id text,
  p_effect_id uuid,
  p_provider_key text,
  p_account_id text,
  p_company_id text,
  p_environment text,
  p_provider_event_id text,
  p_provider_event_hash text,
  p_provider_sequence bigint,
  p_callback_binding_hash text,
  p_signature_key_ref text,
  p_signature_verified_at timestamptz,
  p_signature_key_not_before timestamptz,
  p_signature_key_not_after timestamptz,
  p_signature_key_revoked_at timestamptz,
  p_callback_occurred_at timestamptz,
  p_evidence_refs text[],
  p_received_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  i public.command_center_agency_side_effect_inbox%rowtype;
  v_state text:='received';
  v_inbox_id uuid;
  v_max_sequence bigint;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_project_id),'')='' then raise exception 'Inbox project identity required'; end if;
  if p_effect_id is not null and not exists(
    select 1 from public.command_center_agency_side_effect_outbox
    where owner_id=u and project_id=btrim(p_project_id) and effect_id=p_effect_id
  ) then raise exception 'Inbox effect scope mismatch'; end if;
  if p_environment not in ('development','test','staging','production')
     or coalesce(btrim(p_provider_key),'')=''
     or coalesce(btrim(p_account_id),'')=''
     or coalesce(btrim(p_provider_event_id),'')='' then
    raise exception 'Inbox provider/account/environment/event identity required';
  end if;
  if coalesce(p_provider_event_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Inbox event hash required'; end if;
  if coalesce(p_callback_binding_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Authenticated callback binding hash required'; end if;
  if coalesce(btrim(p_signature_key_ref),'')='' then raise exception 'Authenticated callback signature key reference required'; end if;
  if p_signature_verified_at is null or p_signature_key_not_before is null or p_signature_key_not_after is null or p_received_at is null or p_callback_occurred_at is null then
    raise exception 'Authenticated callback timing evidence required';
  end if;
  if p_signature_key_not_after<=p_signature_key_not_before then raise exception 'Callback key validity window must be bounded and increasing'; end if;
  if p_received_at<p_signature_key_not_before or p_received_at>=p_signature_key_not_after then raise exception 'Callback received outside key validity window'; end if;
  if p_signature_key_revoked_at is not null and p_received_at>=p_signature_key_revoked_at then raise exception 'Callback key was revoked at receipt time'; end if;
  if p_signature_verified_at<p_received_at-interval '5 minutes' or p_signature_verified_at>p_received_at+interval '1 minute' then
    raise exception 'Callback signature verification time is not bound to receipt time';
  end if;
  if p_callback_occurred_at>p_received_at+interval '5 minutes' then raise exception 'Callback occurrence time is implausibly in the future'; end if;
  if p_provider_sequence is not null and p_provider_sequence<0 then raise exception 'Provider sequence must be non-negative'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Authenticated side-effect inbox evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Authenticated side-effect inbox requires evidence'; end if;

  -- Serialize the owner/provider/account stream so concurrent deliveries cannot race the durable cursor.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(u::text||E'\x1f'||btrim(p_provider_key)||E'\x1f'||btrim(p_account_id),0)
  );

  select * into i from public.command_center_agency_side_effect_inbox
    where owner_id=u
      and provider_key=btrim(p_provider_key)
      and account_id=btrim(p_account_id)
      and provider_event_id=btrim(p_provider_event_id)
    for update;
  if found then
    if i.provider_event_hash<>p_provider_event_hash
       or i.project_id<>btrim(p_project_id)
       or i.environment<>p_environment
       or i.effect_id is distinct from p_effect_id
       or i.company_id is distinct from nullif(btrim(coalesce(p_company_id,'')),'')
       or i.provider_sequence is distinct from p_provider_sequence
       or i.callback_occurred_at is distinct from p_callback_occurred_at then
      raise exception 'Provider event identity collision with modified authenticated payload/scope/metadata';
    end if;
    return jsonb_build_object(
      'inbox_id',i.inbox_id,
      'state',i.state,
      'duplicate',true,
      'apply_allowed',false,
      'durable',true,
      'callback_binding_version',i.callback_binding_version
    );
  end if;

  if p_provider_sequence is not null then
    select max(provider_sequence) into v_max_sequence
      from public.command_center_agency_side_effect_inbox
      where owner_id=u
        and provider_key=btrim(p_provider_key)
        and account_id=btrim(p_account_id)
        and provider_sequence is not null
        and state in ('received','applied');
    if v_max_sequence is not null and p_provider_sequence<v_max_sequence then v_state:='out_of_order'; end if;
  end if;

  insert into public.command_center_agency_side_effect_inbox(
    owner_id,project_id,effect_id,provider_key,account_id,company_id,environment,
    provider_event_id,provider_event_hash,provider_sequence,state,evidence_refs,received_at,
    callback_occurred_at,callback_binding_version,callback_binding_hash,signature_key_ref,
    signature_verified_at,signature_key_not_before,signature_key_not_after,signature_key_revoked_at
  ) values (
    u,btrim(p_project_id),p_effect_id,btrim(p_provider_key),btrim(p_account_id),nullif(btrim(coalesce(p_company_id,'')),''),p_environment,
    btrim(p_provider_event_id),p_provider_event_hash,p_provider_sequence,v_state,p_evidence_refs,p_received_at,
    p_callback_occurred_at,'cc-webhook-v1',p_callback_binding_hash,btrim(p_signature_key_ref),
    p_signature_verified_at,p_signature_key_not_before,p_signature_key_not_after,p_signature_key_revoked_at
  ) returning inbox_id into v_inbox_id;

  return jsonb_build_object(
    'inbox_id',v_inbox_id,
    'state',v_state,
    'duplicate',false,
    'apply_allowed',v_state='received',
    'durable',true,
    'callback_binding_version','cc-webhook-v1'
  );
end $$;

-- Applying a callback now requires evidence that it passed the authenticated durable path.
create or replace function public.command_center_agency_apply_side_effect_inbox(
  p_inbox_id uuid,p_effect_id uuid,p_evidence_refs text[],p_applied_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); i public.command_center_agency_side_effect_inbox%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into i from public.command_center_agency_side_effect_inbox where owner_id=u and inbox_id=p_inbox_id for update;
  if not found then raise exception 'Inbox event not found'; end if;
  if i.state='applied' then return jsonb_build_object('inbox_id',i.inbox_id,'state','applied','duplicate_apply',true); end if;
  if i.state<>'received' then raise exception 'Inbox event is not eligible for application'; end if;
  if i.callback_binding_version<>'cc-webhook-v1'
     or i.callback_binding_hash is null
     or i.signature_key_ref is null
     or i.signature_verified_at is null then
    raise exception 'Inbox event lacks authenticated callback binding';
  end if;
  if p_effect_id is not null and not exists(
    select 1 from public.command_center_agency_side_effect_outbox
    where owner_id=u and project_id=i.project_id and effect_id=p_effect_id
  ) then raise exception 'Inbox apply effect scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect inbox apply evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Inbox application requires evidence'; end if;
  update public.command_center_agency_side_effect_inbox
    set state='applied',effect_id=coalesce(p_effect_id,effect_id),evidence_refs=p_evidence_refs,applied_at=p_applied_at
    where owner_id=u and inbox_id=p_inbox_id;
  return jsonb_build_object('inbox_id',i.inbox_id,'state','applied','duplicate_apply',false);
end $$;

-- Retire the legacy unbound write path for authenticated clients. Historical rows remain readable.
revoke execute on function public.command_center_agency_record_side_effect_inbox(text,uuid,text,text,text,text,text,bigint,text[],timestamptz) from authenticated;
revoke all on function public.command_center_agency_record_authenticated_side_effect_inbox(text,uuid,text,text,text,text,text,text,bigint,text,text,timestamptz,timestamptz,timestamptz,timestamptz,timestamptz,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_record_authenticated_side_effect_inbox(text,uuid,text,text,text,text,text,text,bigint,text,text,timestamptz,timestamptz,timestamptz,timestamptz,timestamptz,text[],timestamptz) to authenticated;

-- R4 truth rule: callback loss/uncertainty never implies success. The existing canonical
-- command_center_agency_mark_stale_dispatched_unknown + command_center_agency_reconcile_unknown_side_effect
-- path remains the only way to resolve uncertain external effects, and it requires evidence.
