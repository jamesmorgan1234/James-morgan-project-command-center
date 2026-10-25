-- Category 7 post-audit retrofit — durable quota reservation and provider usage reconciliation.
-- Branch-only migration. Committing this file does not apply it to production.
-- Monetary values are integer micro-USD (1 USD = 1,000,000 micro-USD); floating-point money is forbidden.
-- Default policy is zero units / zero monetary spend and unknown pricing is denied.

create table if not exists public.command_center_resource_quota_buckets (
  bucket_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  company_id text not null default '',
  account_id text not null default '',
  environment text not null check (environment in ('development','test','staging','production')),
  provider_key text not null,
  resource_kind text not null,
  period_key text not null,
  unit_limit bigint not null default 0 check (unit_limit>=0),
  cost_limit_microusd bigint not null default 0 check (cost_limit_microusd>=0),
  reserved_units bigint not null default 0 check (reserved_units>=0),
  reserved_cost_microusd bigint not null default 0 check (reserved_cost_microusd>=0),
  consumed_units bigint not null default 0 check (consumed_units>=0),
  consumed_cost_microusd bigint not null default 0 check (consumed_cost_microusd>=0),
  unknown_pricing_policy text not null default 'deny' check (unknown_pricing_policy='deny'),
  state text not null default 'active' check (state in ('active','breached','closed')),
  policy_epoch bigint not null default 1 check (policy_epoch>=1),
  paid_budget_authorization_ref text,
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(owner_id,project_id,company_id,account_id,environment,provider_key,resource_kind,period_key),
  check (length(btrim(project_id)) between 1 and 500),
  check (company_id='' or length(btrim(company_id)) between 1 and 240),
  check (account_id='' or length(btrim(account_id)) between 1 and 240),
  check (length(btrim(provider_key)) between 1 and 240),
  check (length(btrim(resource_kind)) between 1 and 240),
  check (length(btrim(period_key)) between 1 and 240),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check (cost_limit_microusd=0 or length(btrim(coalesce(paid_budget_authorization_ref,'')))>0)
);

create table if not exists public.command_center_resource_quota_reservations (
  reservation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_id uuid not null references public.command_center_resource_quota_buckets(bucket_id) on delete restrict,
  project_id text not null,
  work_ref text not null,
  idempotency_key text not null,
  intent_hash text not null check (intent_hash ~ '^[a-f0-9]{64}$'),
  requested_units bigint not null check (requested_units>=0),
  estimated_cost_microusd bigint not null check (estimated_cost_microusd>=0),
  state text not null check (state in ('reserved','settled_pending_receipt','reconciled','released','expired')),
  generation bigint not null default 1 check (generation>=1),
  expires_at timestamptz not null,
  actual_internal_units bigint check (actual_internal_units is null or actual_internal_units>=0),
  actual_internal_cost_microusd bigint check (actual_internal_cost_microusd is null or actual_internal_cost_microusd>=0),
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  settled_at timestamptz,
  released_at timestamptz,
  reconciled_at timestamptz,
  unique(owner_id,idempotency_key),
  check (length(btrim(project_id)) between 1 and 500),
  check (length(btrim(work_ref)) between 1 and 500),
  check (length(btrim(idempotency_key)) between 1 and 500),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state in ('settled_pending_receipt','reconciled') and actual_internal_units is not null and actual_internal_cost_microusd is not null and settled_at is not null) or state not in ('settled_pending_receipt','reconciled')),
  check ((state='reconciled' and reconciled_at is not null) or state<>'reconciled'),
  check ((state in ('released','expired') and released_at is not null) or state not in ('released','expired'))
);
create index if not exists command_center_resource_quota_reservations_bucket_idx
  on public.command_center_resource_quota_reservations(owner_id,bucket_id,state,expires_at,reservation_id);

create table if not exists public.command_center_provider_usage_receipts (
  usage_receipt_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  reservation_id uuid not null references public.command_center_resource_quota_reservations(reservation_id) on delete restrict,
  provider_key text not null,
  account_id text not null default '',
  environment text not null check (environment in ('development','test','staging','production')),
  provider_receipt_id text not null,
  provider_receipt_hash text not null check (provider_receipt_hash ~ '^[a-f0-9]{64}$'),
  reported_units bigint not null check (reported_units>=0),
  reported_cost_microusd bigint not null check (reported_cost_microusd>=0),
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,provider_key,account_id,environment,provider_receipt_id),
  check (length(btrim(provider_key)) between 1 and 240),
  check (account_id='' or length(btrim(account_id)) between 1 and 240),
  check (length(btrim(provider_receipt_id)) between 1 and 500),
  check (cardinality(evidence_refs)>0),
  check (observed_at>=occurred_at)
);
create index if not exists command_center_provider_usage_receipts_reservation_idx
  on public.command_center_provider_usage_receipts(owner_id,reservation_id,observed_at,usage_receipt_id);

create table if not exists public.command_center_resource_usage_reconciliations (
  reconciliation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  reservation_id uuid not null references public.command_center_resource_quota_reservations(reservation_id) on delete restrict,
  state text not null check (state in ('matched','provider_higher','internal_higher','mixed_mismatch')),
  internal_units bigint not null check (internal_units>=0),
  provider_units bigint not null check (provider_units>=0),
  internal_cost_microusd bigint not null check (internal_cost_microusd>=0),
  provider_cost_microusd bigint not null check (provider_cost_microusd>=0),
  receipt_count integer not null check (receipt_count>0),
  evidence_refs text[] not null,
  reconciled_at timestamptz not null,
  unique(owner_id,reservation_id),
  check (cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_resource_quota_events (
  quota_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_id uuid not null references public.command_center_resource_quota_buckets(bucket_id) on delete restrict,
  reservation_id uuid references public.command_center_resource_quota_reservations(reservation_id) on delete restrict,
  event_kind text not null check (event_kind in ('policy_created','policy_updated','reserved','released','expired','settled','receipt_recorded','reconciled','mismatch','breached')),
  generation bigint,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail)='object'),
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (generation is null or generation>=1),
  check (cardinality(evidence_refs)>0)
);
create index if not exists command_center_resource_quota_events_idx
  on public.command_center_resource_quota_events(owner_id,bucket_id,occurred_at,quota_event_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_resource_quota_buckets','command_center_resource_quota_reservations','command_center_provider_usage_receipts','command_center_resource_usage_reconciliations','command_center_resource_quota_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c7_quota_lock_key(
  p_owner_id uuid,p_project_id text,p_company_id text,p_account_id text,p_environment text,p_provider_key text,p_resource_kind text,p_period_key text
) returns bigint language sql immutable set search_path='' as $$
  select hashtextextended(
    p_owner_id::text||':'||btrim(p_project_id)||':'||coalesce(btrim(p_company_id),'')||':'||coalesce(btrim(p_account_id),'')||':'||p_environment||':'||btrim(p_provider_key)||':'||btrim(p_resource_kind)||':'||btrim(p_period_key),
    0
  );
$$;
revoke all on function command_center_private.c7_quota_lock_key(uuid,text,text,text,text,text,text,text) from public,anon,authenticated;

create or replace function command_center_private.c7_record_quota_event(
  p_owner_id uuid,p_bucket_id uuid,p_reservation_id uuid,p_event_kind text,p_generation bigint,p_detail jsonb,p_evidence_refs text[],p_occurred_at timestamptz
) returns void language plpgsql security definer set search_path='' as $$
begin
  insert into public.command_center_resource_quota_events(owner_id,bucket_id,reservation_id,event_kind,generation,detail,evidence_refs,occurred_at)
  values(p_owner_id,p_bucket_id,p_reservation_id,p_event_kind,p_generation,coalesce(p_detail,'{}'::jsonb),p_evidence_refs,p_occurred_at);
end $$;
revoke all on function command_center_private.c7_record_quota_event(uuid,uuid,uuid,text,bigint,jsonb,text[],timestamptz) from public,anon,authenticated;

create or replace function public.command_center_resource_configure_quota(
  p_project_id text,p_company_id text,p_account_id text,p_environment text,p_provider_key text,p_resource_kind text,p_period_key text,
  p_unit_limit bigint,p_cost_limit_microusd bigint,p_paid_budget_authorization_ref text,p_policy_epoch bigint,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b public.command_center_resource_quota_buckets%rowtype; v_company text:=coalesce(btrim(p_company_id),''); v_account text:=coalesce(btrim(p_account_id),''); v_event text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_environment not in ('development','test','staging','production') then raise exception 'Invalid quota environment'; end if;
  if coalesce(btrim(p_project_id),'')='' or coalesce(btrim(p_provider_key),'')='' or coalesce(btrim(p_resource_kind),'')='' or coalesce(btrim(p_period_key),'')='' then raise exception 'Quota scope/provider/resource/period required'; end if;
  if p_unit_limit is null or p_unit_limit<0 or p_cost_limit_microusd is null or p_cost_limit_microusd<0 then raise exception 'Quota limits must be known non-negative integers'; end if;
  if p_cost_limit_microusd>0 and coalesce(btrim(p_paid_budget_authorization_ref),'')='' then raise exception 'Positive monetary quota requires exact paid-budget authorization evidence'; end if;
  if p_policy_epoch is null or p_policy_epoch<1 then raise exception 'Quota policy epoch required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Quota policy evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Quota policy requires evidence'; end if;

  perform pg_advisory_xact_lock(command_center_private.c7_quota_lock_key(u,btrim(p_project_id),v_company,v_account,p_environment,btrim(p_provider_key),btrim(p_resource_kind),btrim(p_period_key)));
  select * into b from public.command_center_resource_quota_buckets
    where owner_id=u and project_id=btrim(p_project_id) and company_id=v_company and account_id=v_account and environment=p_environment
      and provider_key=btrim(p_provider_key) and resource_kind=btrim(p_resource_kind) and period_key=btrim(p_period_key) for update;

  if found then
    if p_policy_epoch<=b.policy_epoch then raise exception 'Quota policy epoch must advance'; end if;
    if p_unit_limit < b.consumed_units+b.reserved_units or p_cost_limit_microusd < b.consumed_cost_microusd+b.reserved_cost_microusd then raise exception 'Quota cannot be lowered below consumed plus reserved usage'; end if;
    update public.command_center_resource_quota_buckets
      set unit_limit=p_unit_limit,cost_limit_microusd=p_cost_limit_microusd,paid_budget_authorization_ref=nullif(btrim(p_paid_budget_authorization_ref),''),
          policy_epoch=p_policy_epoch,state=case when consumed_units<=p_unit_limit and consumed_cost_microusd<=p_cost_limit_microusd then 'active' else 'breached' end,
          evidence_refs=p_evidence_refs,updated_at=p_now
      where bucket_id=b.bucket_id and owner_id=u returning * into b;
    v_event:='policy_updated';
  else
    insert into public.command_center_resource_quota_buckets(owner_id,project_id,company_id,account_id,environment,provider_key,resource_kind,period_key,unit_limit,cost_limit_microusd,unknown_pricing_policy,state,policy_epoch,paid_budget_authorization_ref,evidence_refs,created_at,updated_at)
    values(u,btrim(p_project_id),v_company,v_account,p_environment,btrim(p_provider_key),btrim(p_resource_kind),btrim(p_period_key),p_unit_limit,p_cost_limit_microusd,'deny','active',p_policy_epoch,nullif(btrim(p_paid_budget_authorization_ref),''),p_evidence_refs,p_now,p_now)
    returning * into b;
    v_event:='policy_created';
  end if;
  perform command_center_private.c7_record_quota_event(u,b.bucket_id,null,v_event,null,jsonb_build_object('unit_limit',b.unit_limit,'cost_limit_microusd',b.cost_limit_microusd,'policy_epoch',b.policy_epoch),p_evidence_refs,p_now);
  return jsonb_build_object('bucket_id',b.bucket_id,'state',b.state,'unit_limit',b.unit_limit,'cost_limit_microusd',b.cost_limit_microusd,'policy_epoch',b.policy_epoch,'unknown_pricing_policy','deny');
end $$;

create or replace function public.command_center_resource_reserve_quota(
  p_project_id text,p_company_id text,p_account_id text,p_environment text,p_provider_key text,p_resource_kind text,p_period_key text,
  p_work_ref text,p_idempotency_key text,p_intent_hash text,p_requested_units bigint,p_estimated_cost_microusd bigint,p_expires_at timestamptz,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b public.command_center_resource_quota_buckets%rowtype; r public.command_center_resource_quota_reservations%rowtype; v_company text:=coalesce(btrim(p_company_id),''); v_account text:=coalesce(btrim(p_account_id),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_environment not in ('development','test','staging','production') then raise exception 'Invalid quota environment'; end if;
  if coalesce(btrim(p_project_id),'')='' or coalesce(btrim(p_provider_key),'')='' or coalesce(btrim(p_resource_kind),'')='' or coalesce(btrim(p_period_key),'')='' or coalesce(btrim(p_work_ref),'')='' or coalesce(btrim(p_idempotency_key),'')='' then raise exception 'Quota reservation scope and identity required'; end if;
  if coalesce(p_intent_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Quota reservation intent hash required'; end if;
  if p_requested_units is null or p_requested_units<0 then raise exception 'Requested quota units must be known and non-negative'; end if;
  if p_estimated_cost_microusd is null then raise exception 'Unknown pricing denied'; end if;
  if p_estimated_cost_microusd<0 then raise exception 'Estimated cost must be non-negative'; end if;
  if p_expires_at is null or p_expires_at<=p_now then raise exception 'Quota reservation expiry must be in the future'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Quota reservation evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Quota reservation requires evidence'; end if;

  perform pg_advisory_xact_lock(command_center_private.c7_quota_lock_key(u,btrim(p_project_id),v_company,v_account,p_environment,btrim(p_provider_key),btrim(p_resource_kind),btrim(p_period_key)));

  select * into r from public.command_center_resource_quota_reservations where owner_id=u and idempotency_key=btrim(p_idempotency_key) for update;
  if found then
    select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id;
    if r.project_id<>btrim(p_project_id) or r.work_ref<>btrim(p_work_ref) or r.intent_hash<>p_intent_hash or r.requested_units<>p_requested_units or r.estimated_cost_microusd<>p_estimated_cost_microusd
       or b.company_id<>v_company or b.account_id<>v_account or b.environment<>p_environment or b.provider_key<>btrim(p_provider_key) or b.resource_kind<>btrim(p_resource_kind) or b.period_key<>btrim(p_period_key) then
      raise exception 'Quota idempotency key reuse with modified intent or scope';
    end if;
    return jsonb_build_object('reservation_id',r.reservation_id,'bucket_id',r.bucket_id,'state',r.state,'generation',r.generation,'duplicate',true);
  end if;

  select * into b from public.command_center_resource_quota_buckets
    where owner_id=u and project_id=btrim(p_project_id) and company_id=v_company and account_id=v_account and environment=p_environment
      and provider_key=btrim(p_provider_key) and resource_kind=btrim(p_resource_kind) and period_key=btrim(p_period_key) for update;
  if not found then
    insert into public.command_center_resource_quota_buckets(owner_id,project_id,company_id,account_id,environment,provider_key,resource_kind,period_key,unit_limit,cost_limit_microusd,unknown_pricing_policy,state,policy_epoch,evidence_refs,created_at,updated_at)
    values(u,btrim(p_project_id),v_company,v_account,p_environment,btrim(p_provider_key),btrim(p_resource_kind),btrim(p_period_key),0,0,'deny','active',1,p_evidence_refs,p_now,p_now)
    returning * into b;
    perform command_center_private.c7_record_quota_event(u,b.bucket_id,null,'policy_created',null,jsonb_build_object('default_zero_budget',true),p_evidence_refs,p_now);
  end if;
  if b.state<>'active' then raise exception 'Quota bucket is not active'; end if;
  if p_requested_units > b.unit_limit-b.consumed_units-b.reserved_units then raise exception 'Quota unit limit exceeded'; end if;
  if p_estimated_cost_microusd > b.cost_limit_microusd-b.consumed_cost_microusd-b.reserved_cost_microusd then raise exception 'Quota monetary limit exceeded'; end if;

  update public.command_center_resource_quota_buckets
    set reserved_units=reserved_units+p_requested_units,reserved_cost_microusd=reserved_cost_microusd+p_estimated_cost_microusd,updated_at=p_now
    where owner_id=u and bucket_id=b.bucket_id returning * into b;
  insert into public.command_center_resource_quota_reservations(owner_id,bucket_id,project_id,work_ref,idempotency_key,intent_hash,requested_units,estimated_cost_microusd,state,generation,expires_at,evidence_refs,created_at,updated_at)
    values(u,b.bucket_id,b.project_id,btrim(p_work_ref),btrim(p_idempotency_key),p_intent_hash,p_requested_units,p_estimated_cost_microusd,'reserved',1,p_expires_at,p_evidence_refs,p_now,p_now)
    returning * into r;
  perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'reserved',r.generation,jsonb_build_object('requested_units',p_requested_units,'estimated_cost_microusd',p_estimated_cost_microusd),p_evidence_refs,p_now);
  return jsonb_build_object('reservation_id',r.reservation_id,'bucket_id',b.bucket_id,'state','reserved','generation',1,'duplicate',false,'paid_budget_authorization_ref',b.paid_budget_authorization_ref);
end $$;

create or replace function public.command_center_resource_release_quota(
  p_reservation_id uuid,p_expected_generation bigint,p_reason text,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; v_state text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Quota release evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_reason),'')='' then raise exception 'Quota release reason and evidence required'; end if;
  select * into r from public.command_center_resource_quota_reservations where owner_id=u and reservation_id=p_reservation_id for update;
  if not found then raise exception 'Quota reservation not found'; end if;
  if r.state<>'reserved' or r.generation<>p_expected_generation then raise exception 'Quota release state/generation conflict'; end if;
  select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id for update;
  v_state:=case when r.expires_at<=p_now then 'expired' else 'released' end;
  update public.command_center_resource_quota_buckets set reserved_units=reserved_units-r.requested_units,reserved_cost_microusd=reserved_cost_microusd-r.estimated_cost_microusd,updated_at=p_now where owner_id=u and bucket_id=b.bucket_id;
  update public.command_center_resource_quota_reservations set state=v_state,generation=generation+1,evidence_refs=p_evidence_refs,released_at=p_now,updated_at=p_now where owner_id=u and reservation_id=r.reservation_id returning * into r;
  perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,v_state,r.generation,jsonb_build_object('reason',btrim(p_reason)),p_evidence_refs,p_now);
  return jsonb_build_object('reservation_id',r.reservation_id,'state',r.state,'generation',r.generation);
end $$;

create or replace function public.command_center_resource_expire_quota_reservations(
  p_project_id text,p_now timestamptz,p_evidence_refs text[]
) returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; v_count integer:=0; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Quota expiry evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Quota expiry evidence required'; end if;
  for r in select * from public.command_center_resource_quota_reservations where owner_id=u and project_id=btrim(p_project_id) and state='reserved' and expires_at<=p_now order by expires_at,reservation_id for update skip locked
  loop
    select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id for update;
    update public.command_center_resource_quota_buckets set reserved_units=reserved_units-r.requested_units,reserved_cost_microusd=reserved_cost_microusd-r.estimated_cost_microusd,updated_at=p_now where owner_id=u and bucket_id=b.bucket_id;
    update public.command_center_resource_quota_reservations set state='expired',generation=generation+1,evidence_refs=p_evidence_refs,released_at=p_now,updated_at=p_now where owner_id=u and reservation_id=r.reservation_id returning * into r;
    perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'expired',r.generation,jsonb_build_object('reason','reservation_expired'),p_evidence_refs,p_now);
    v_count:=v_count+1;
  end loop;
  return v_count;
end $$;

create or replace function public.command_center_resource_settle_quota(
  p_reservation_id uuid,p_expected_generation bigint,p_actual_units bigint,p_actual_cost_microusd bigint,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; v_breached boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_actual_units is null or p_actual_units<0 or p_actual_cost_microusd is null or p_actual_cost_microusd<0 then raise exception 'Actual usage and cost must be known non-negative integers'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Quota settlement evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Quota settlement evidence required'; end if;
  select * into r from public.command_center_resource_quota_reservations where owner_id=u and reservation_id=p_reservation_id for update;
  if not found then raise exception 'Quota reservation not found'; end if;
  if r.state<>'reserved' or r.generation<>p_expected_generation then raise exception 'Quota settlement state/generation conflict'; end if;
  select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id for update;
  v_breached:=(b.consumed_units+p_actual_units>b.unit_limit or b.consumed_cost_microusd+p_actual_cost_microusd>b.cost_limit_microusd);
  update public.command_center_resource_quota_buckets
    set reserved_units=reserved_units-r.requested_units,reserved_cost_microusd=reserved_cost_microusd-r.estimated_cost_microusd,
        consumed_units=consumed_units+p_actual_units,consumed_cost_microusd=consumed_cost_microusd+p_actual_cost_microusd,
        state=case when v_breached then 'breached' else state end,updated_at=p_now
    where owner_id=u and bucket_id=b.bucket_id returning * into b;
  update public.command_center_resource_quota_reservations
    set state='settled_pending_receipt',generation=generation+1,actual_internal_units=p_actual_units,actual_internal_cost_microusd=p_actual_cost_microusd,evidence_refs=p_evidence_refs,settled_at=p_now,updated_at=p_now
    where owner_id=u and reservation_id=r.reservation_id returning * into r;
  perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'settled',r.generation,jsonb_build_object('actual_units',p_actual_units,'actual_cost_microusd',p_actual_cost_microusd),p_evidence_refs,p_now);
  if v_breached then perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'breached',r.generation,jsonb_build_object('unit_limit',b.unit_limit,'cost_limit_microusd',b.cost_limit_microusd),p_evidence_refs,p_now); end if;
  return jsonb_build_object('reservation_id',r.reservation_id,'state',r.state,'generation',r.generation,'bucket_state',b.state,'provider_reconciliation_required',true);
end $$;

create or replace function public.command_center_resource_record_provider_usage_receipt(
  p_reservation_id uuid,p_provider_receipt_id text,p_provider_receipt_hash text,p_reported_units bigint,p_reported_cost_microusd bigint,p_evidence_refs text[],p_occurred_at timestamptz,p_observed_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; x public.command_center_provider_usage_receipts%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_provider_receipt_id),'')='' or coalesce(p_provider_receipt_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Provider usage receipt stable identity and hash required'; end if;
  if p_reported_units is null or p_reported_units<0 or p_reported_cost_microusd is null or p_reported_cost_microusd<0 then raise exception 'Provider usage receipt must report known non-negative usage and cost'; end if;
  if p_observed_at<p_occurred_at then raise exception 'Provider usage receipt observed time cannot precede occurrence'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Provider usage receipt evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Provider usage receipt evidence required'; end if;
  select * into r from public.command_center_resource_quota_reservations where owner_id=u and reservation_id=p_reservation_id;
  if not found or r.state not in ('settled_pending_receipt','reconciled') then raise exception 'Provider usage receipt requires settled reservation'; end if;
  select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id;

  select * into x from public.command_center_provider_usage_receipts where owner_id=u and provider_key=b.provider_key and account_id=b.account_id and environment=b.environment and provider_receipt_id=btrim(p_provider_receipt_id) for update;
  if found then
    if x.reservation_id<>p_reservation_id or x.provider_receipt_hash<>p_provider_receipt_hash or x.reported_units<>p_reported_units or x.reported_cost_microusd<>p_reported_cost_microusd then raise exception 'Provider usage receipt identity collision with modified payload or reservation'; end if;
    return jsonb_build_object('usage_receipt_id',x.usage_receipt_id,'duplicate',true,'reservation_id',x.reservation_id);
  end if;
  insert into public.command_center_provider_usage_receipts(owner_id,reservation_id,provider_key,account_id,environment,provider_receipt_id,provider_receipt_hash,reported_units,reported_cost_microusd,evidence_refs,occurred_at,observed_at)
    values(u,r.reservation_id,b.provider_key,b.account_id,b.environment,btrim(p_provider_receipt_id),p_provider_receipt_hash,p_reported_units,p_reported_cost_microusd,p_evidence_refs,p_occurred_at,p_observed_at)
    returning * into x;
  perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'receipt_recorded',r.generation,jsonb_build_object('provider_receipt_id',x.provider_receipt_id,'reported_units',x.reported_units,'reported_cost_microusd',x.reported_cost_microusd),p_evidence_refs,p_observed_at);
  return jsonb_build_object('usage_receipt_id',x.usage_receipt_id,'duplicate',false,'reservation_id',x.reservation_id);
end $$;

create or replace function public.command_center_resource_reconcile_usage(
  p_reservation_id uuid,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; v_count integer; v_units bigint; v_cost bigint; v_state text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Usage reconciliation evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Usage reconciliation evidence required'; end if;
  select * into r from public.command_center_resource_quota_reservations where owner_id=u and reservation_id=p_reservation_id for update;
  if not found or r.state not in ('settled_pending_receipt','reconciled') then raise exception 'Usage reconciliation requires settled reservation'; end if;
  select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id;
  select count(*)::integer,coalesce(sum(reported_units),0)::bigint,coalesce(sum(reported_cost_microusd),0)::bigint into v_count,v_units,v_cost from public.command_center_provider_usage_receipts where owner_id=u and reservation_id=r.reservation_id;
  if v_count=0 then raise exception 'Usage reconciliation requires provider receipt evidence'; end if;
  if v_units=r.actual_internal_units and v_cost=r.actual_internal_cost_microusd then v_state:='matched';
  elsif v_units>=r.actual_internal_units and v_cost>=r.actual_internal_cost_microusd then v_state:='provider_higher';
  elsif v_units<=r.actual_internal_units and v_cost<=r.actual_internal_cost_microusd then v_state:='internal_higher';
  else v_state:='mixed_mismatch'; end if;

  insert into public.command_center_resource_usage_reconciliations(owner_id,reservation_id,state,internal_units,provider_units,internal_cost_microusd,provider_cost_microusd,receipt_count,evidence_refs,reconciled_at)
  values(u,r.reservation_id,v_state,r.actual_internal_units,v_units,r.actual_internal_cost_microusd,v_cost,v_count,p_evidence_refs,p_now)
  on conflict(owner_id,reservation_id) do update set state=excluded.state,internal_units=excluded.internal_units,provider_units=excluded.provider_units,internal_cost_microusd=excluded.internal_cost_microusd,provider_cost_microusd=excluded.provider_cost_microusd,receipt_count=excluded.receipt_count,evidence_refs=excluded.evidence_refs,reconciled_at=excluded.reconciled_at;

  if v_state='matched' then
    update public.command_center_resource_quota_reservations set state='reconciled',generation=generation+1,evidence_refs=p_evidence_refs,reconciled_at=p_now,updated_at=p_now where owner_id=u and reservation_id=r.reservation_id returning * into r;
    perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'reconciled',r.generation,jsonb_build_object('receipt_count',v_count),p_evidence_refs,p_now);
  else
    perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'mismatch',r.generation,jsonb_build_object('state',v_state,'internal_units',r.actual_internal_units,'provider_units',v_units,'internal_cost_microusd',r.actual_internal_cost_microusd,'provider_cost_microusd',v_cost),p_evidence_refs,p_now);
  end if;
  return jsonb_build_object('reservation_id',r.reservation_id,'reconciliation_state',v_state,'receipt_count',v_count,'release_gate_eligible',v_state='matched' and b.state='active');
end $$;

create or replace function public.command_center_resource_usage_release_gate(
  p_project_id text,p_environment text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_open integer; v_mismatch integer; v_breached integer; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_environment not in ('development','test','staging','production') then raise exception 'Invalid quota environment'; end if;
  select count(*)::integer into v_open from public.command_center_resource_quota_reservations r join public.command_center_resource_quota_buckets b on b.bucket_id=r.bucket_id and b.owner_id=r.owner_id
    where r.owner_id=u and r.project_id=btrim(p_project_id) and b.environment=p_environment and r.state in ('reserved','settled_pending_receipt');
  select count(*)::integer into v_mismatch from public.command_center_resource_usage_reconciliations x join public.command_center_resource_quota_reservations r on r.reservation_id=x.reservation_id and r.owner_id=x.owner_id join public.command_center_resource_quota_buckets b on b.bucket_id=r.bucket_id and b.owner_id=r.owner_id
    where x.owner_id=u and r.project_id=btrim(p_project_id) and b.environment=p_environment and x.state<>'matched';
  select count(*)::integer into v_breached from public.command_center_resource_quota_buckets where owner_id=u and project_id=btrim(p_project_id) and environment=p_environment and state='breached';
  return jsonb_build_object('eligible',v_open=0 and v_mismatch=0 and v_breached=0,'open_reservations',v_open,'usage_mismatches',v_mismatch,'breached_buckets',v_breached);
end $$;

create or replace function public.command_center_resource_assert_usage_reconciled(
  p_project_id text,p_environment text
) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); g jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  g:=public.command_center_resource_usage_release_gate(p_project_id,p_environment);
  if not (g->>'eligible')::boolean then raise exception 'Provider usage reconciliation is incomplete or breached: %',g::text; end if;
end $$;

revoke all on function public.command_center_resource_configure_quota(text,text,text,text,text,text,text,bigint,bigint,text,bigint,text[],timestamptz) from public,anon;
revoke all on function public.command_center_resource_reserve_quota(text,text,text,text,text,text,text,text,text,text,bigint,bigint,timestamptz,text[],timestamptz) from public,anon;
revoke all on function public.command_center_resource_release_quota(uuid,bigint,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_resource_expire_quota_reservations(text,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_resource_settle_quota(uuid,bigint,bigint,bigint,text[],timestamptz) from public,anon;
revoke all on function public.command_center_resource_record_provider_usage_receipt(uuid,text,text,bigint,bigint,text[],timestamptz,timestamptz) from public,anon;
revoke all on function public.command_center_resource_reconcile_usage(uuid,text[],timestamptz) from public,anon;
revoke all on function public.command_center_resource_usage_release_gate(text,text) from public,anon;
revoke all on function public.command_center_resource_assert_usage_reconciled(text,text) from public,anon;

grant execute on function public.command_center_resource_configure_quota(text,text,text,text,text,text,text,bigint,bigint,text,bigint,text[],timestamptz) to authenticated;
grant execute on function public.command_center_resource_reserve_quota(text,text,text,text,text,text,text,text,text,text,bigint,bigint,timestamptz,text[],timestamptz) to authenticated;
grant execute on function public.command_center_resource_release_quota(uuid,bigint,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_resource_expire_quota_reservations(text,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_resource_settle_quota(uuid,bigint,bigint,bigint,text[],timestamptz) to authenticated;
grant execute on function public.command_center_resource_record_provider_usage_receipt(uuid,text,text,bigint,bigint,text[],timestamptz,timestamptz) to authenticated;
grant execute on function public.command_center_resource_reconcile_usage(uuid,text[],timestamptz) to authenticated;
grant execute on function public.command_center_resource_usage_release_gate(text,text) to authenticated;
grant execute on function public.command_center_resource_assert_usage_reconciled(text,text) to authenticated;