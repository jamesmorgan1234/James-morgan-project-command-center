-- Category 7 post-audit retrofit — durable external side-effect outbox/inbox.
-- Branch-only migration. Committing this file does not apply it to production.
-- Intent is persisted before dispatch; unknown effects must be reconciled before retry.

create table if not exists public.command_center_agency_side_effect_outbox (
  effect_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  task_id text,
  company_id text,
  account_id text,
  environment text not null check (environment in ('development','test','staging','production')),
  provider_key text not null,
  action_key text not null,
  idempotency_key text not null,
  intent_hash text not null check (intent_hash ~ '^[a-f0-9]{64}$'),
  payload_ref text not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  state text not null check (state in ('prepared','claimed','dispatched','unknown','succeeded','failed_no_effect','reconciled_no_effect','reconciled_succeeded','cancelled')),
  dispatch_generation bigint not null default 0 check (dispatch_generation>=0),
  attempt_count integer not null default 0 check (attempt_count>=0),
  claimed_by text,
  claim_expires_at timestamptz,
  external_effect_possible boolean not null default false,
  next_attempt_at timestamptz,
  last_dispatched_at timestamptz,
  last_outcome_at timestamptz,
  reconciliation text check (reconciliation is null or reconciliation in ('no_effect','succeeded')),
  reconciled_at timestamptz,
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(owner_id,idempotency_key),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (length(btrim(provider_key)) between 1 and 240),
  check (length(btrim(action_key)) between 1 and 240),
  check (length(btrim(idempotency_key)) between 1 and 500),
  check (length(btrim(payload_ref)) between 1 and 1000),
  check (task_id is null or length(btrim(task_id)) between 1 and 500),
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (account_id is null or length(btrim(account_id)) between 1 and 240),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state='claimed' and claimed_by is not null and claim_expires_at is not null) or state<>'claimed'),
  check ((state in ('dispatched','unknown','succeeded','reconciled_succeeded') and external_effect_possible) or state not in ('dispatched','unknown','succeeded','reconciled_succeeded')),
  check ((state in ('reconciled_no_effect','reconciled_succeeded') and reconciliation is not null and reconciled_at is not null) or state not in ('reconciled_no_effect','reconciled_succeeded'))
);
create index if not exists command_center_agency_side_effect_outbox_ready_idx
  on public.command_center_agency_side_effect_outbox(owner_id,project_id,state,next_attempt_at,created_at,effect_id);

create table if not exists public.command_center_agency_side_effect_events (
  side_effect_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  effect_id uuid not null references public.command_center_agency_side_effect_outbox(effect_id) on delete restrict,
  from_state text,
  to_state text not null,
  dispatch_generation bigint not null check (dispatch_generation>=0),
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail)='object'),
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_side_effect_events_idx
  on public.command_center_agency_side_effect_events(owner_id,project_id,effect_id,occurred_at,side_effect_event_id);

create table if not exists public.command_center_agency_side_effect_inbox (
  inbox_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  effect_id uuid references public.command_center_agency_side_effect_outbox(effect_id) on delete restrict,
  provider_key text not null,
  account_id text not null,
  environment text not null check (environment in ('development','test','staging','production')),
  provider_event_id text not null,
  provider_event_hash text not null check (provider_event_hash ~ '^[a-f0-9]{64}$'),
  provider_sequence bigint,
  state text not null check (state in ('received','out_of_order','applied','ignored','rejected')),
  evidence_refs text[] not null,
  received_at timestamptz not null,
  applied_at timestamptz,
  recorded_at timestamptz not null default now(),
  unique(owner_id,provider_key,account_id,provider_event_id),
  check (length(btrim(provider_key)) between 1 and 240),
  check (length(btrim(account_id)) between 1 and 240),
  check (length(btrim(provider_event_id)) between 1 and 500),
  check (provider_sequence is null or provider_sequence>=0),
  check (cardinality(evidence_refs)>0),
  check ((state='applied' and applied_at is not null) or state<>'applied')
);
create index if not exists command_center_agency_side_effect_inbox_sequence_idx
  on public.command_center_agency_side_effect_inbox(owner_id,provider_key,account_id,provider_sequence desc,received_at desc,inbox_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_side_effect_outbox','command_center_agency_side_effect_events','command_center_agency_side_effect_inbox'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c7_record_side_effect_event(
  p_owner_id uuid,p_project_id text,p_effect_id uuid,p_from_state text,p_to_state text,p_dispatch_generation bigint,p_detail jsonb,p_evidence_refs text[],p_occurred_at timestamptz
) returns void language plpgsql security definer set search_path='' as $$
begin
  insert into public.command_center_agency_side_effect_events(owner_id,project_id,effect_id,from_state,to_state,dispatch_generation,detail,evidence_refs,occurred_at)
  values(p_owner_id,p_project_id,p_effect_id,p_from_state,p_to_state,p_dispatch_generation,coalesce(p_detail,'{}'::jsonb),p_evidence_refs,p_occurred_at);
end $$;
revoke all on function command_center_private.c7_record_side_effect_event(uuid,text,uuid,text,text,bigint,jsonb,text[],timestamptz) from public,anon,authenticated;

create or replace function public.command_center_agency_prepare_side_effect(
  p_project_id text,p_run_id text,p_task_id text,p_company_id text,p_account_id text,p_environment text,p_provider_key text,p_action_key text,
  p_idempotency_key text,p_intent_hash text,p_payload_ref text,p_payload_hash text,p_evidence_refs text[],p_created_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_side_effect_outbox%rowtype; v_effect_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Side-effect run not found'; end if;
  if p_task_id is not null and not exists(select 1 from public.command_center_agency_tasks where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) and task_id=btrim(p_task_id)) then raise exception 'Side-effect task scope mismatch'; end if;
  if p_environment not in ('development','test','staging','production') then raise exception 'Invalid side-effect environment'; end if;
  if coalesce(btrim(p_provider_key),'')='' or coalesce(btrim(p_action_key),'')='' or coalesce(btrim(p_idempotency_key),'')='' or coalesce(btrim(p_payload_ref),'')='' then raise exception 'Side-effect provider/action/idempotency/payload reference required'; end if;
  if coalesce(p_intent_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(p_payload_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Side-effect intent and payload hashes required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect prepare evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Side-effect prepare requires evidence'; end if;

  select * into e from public.command_center_agency_side_effect_outbox where owner_id=u and idempotency_key=btrim(p_idempotency_key) for update;
  if found then
    if e.project_id<>btrim(p_project_id) or e.run_id<>btrim(p_run_id) or coalesce(e.task_id,'')<>coalesce(btrim(p_task_id),'')
       or coalesce(e.company_id,'')<>coalesce(btrim(p_company_id),'') or coalesce(e.account_id,'')<>coalesce(btrim(p_account_id),'')
       or e.environment<>p_environment or e.provider_key<>btrim(p_provider_key) or e.action_key<>btrim(p_action_key)
       or e.intent_hash<>p_intent_hash or e.payload_hash<>p_payload_hash or e.payload_ref<>btrim(p_payload_ref) then
      raise exception 'Idempotency key reuse with modified side-effect intent';
    end if;
    return jsonb_build_object('effect_id',e.effect_id,'state',e.state,'duplicate',true,'dispatch_generation',e.dispatch_generation);
  end if;

  insert into public.command_center_agency_side_effect_outbox(owner_id,project_id,run_id,task_id,company_id,account_id,environment,provider_key,action_key,idempotency_key,intent_hash,payload_ref,payload_hash,state,evidence_refs,created_at,updated_at,next_attempt_at)
  values(u,btrim(p_project_id),btrim(p_run_id),nullif(btrim(p_task_id),''),nullif(btrim(p_company_id),''),nullif(btrim(p_account_id),''),p_environment,btrim(p_provider_key),btrim(p_action_key),btrim(p_idempotency_key),p_intent_hash,btrim(p_payload_ref),p_payload_hash,'prepared',p_evidence_refs,p_created_at,p_created_at,p_created_at)
  returning effect_id into v_effect_id;
  perform command_center_private.c7_record_side_effect_event(u,btrim(p_project_id),v_effect_id,null,'prepared',0,jsonb_build_object('intent_hash',p_intent_hash),p_evidence_refs,p_created_at);
  return jsonb_build_object('effect_id',v_effect_id,'state','prepared','duplicate',false,'dispatch_generation',0);
end $$;

create or replace function public.command_center_agency_claim_side_effect(
  p_project_id text,p_worker_ref text,p_claim_ttl_seconds integer,p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_side_effect_outbox%rowtype; v_next_generation bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_worker_ref),'')='' then raise exception 'Side-effect worker identity required'; end if;
  if p_claim_ttl_seconds<5 or p_claim_ttl_seconds>3600 then raise exception 'Side-effect claim TTL out of range'; end if;

  select * into e from public.command_center_agency_side_effect_outbox
  where owner_id=u and project_id=btrim(p_project_id)
    and (
      (state in ('prepared','failed_no_effect','reconciled_no_effect') and coalesce(next_attempt_at,p_now)<=p_now)
      or (state='claimed' and claim_expires_at<=p_now)
    )
  order by coalesce(next_attempt_at,created_at),created_at,effect_id
  for update skip locked limit 1;
  if not found then return null; end if;

  v_next_generation:=e.dispatch_generation+1;
  update public.command_center_agency_side_effect_outbox
    set state='claimed',dispatch_generation=v_next_generation,attempt_count=attempt_count+1,claimed_by=btrim(p_worker_ref),claim_expires_at=p_now+make_interval(secs=>p_claim_ttl_seconds),updated_at=p_now
    where effect_id=e.effect_id and owner_id=u;
  perform command_center_private.c7_record_side_effect_event(u,e.project_id,e.effect_id,e.state,'claimed',v_next_generation,jsonb_build_object('worker_ref',btrim(p_worker_ref)),e.evidence_refs,p_now);
  return jsonb_build_object('effect_id',e.effect_id,'provider_key',e.provider_key,'action_key',e.action_key,'payload_ref',e.payload_ref,'payload_hash',e.payload_hash,'intent_hash',e.intent_hash,'dispatch_generation',v_next_generation,'attempt_count',e.attempt_count+1);
end $$;

create or replace function public.command_center_agency_mark_side_effect_dispatched(
  p_effect_id uuid,p_expected_generation bigint,p_worker_ref text,p_evidence_refs text[],p_dispatched_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_side_effect_outbox%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.command_center_agency_side_effect_outbox where owner_id=u and effect_id=p_effect_id for update;
  if not found then raise exception 'Side-effect not found'; end if;
  if e.state<>'claimed' or e.dispatch_generation<>p_expected_generation or e.claimed_by<>btrim(p_worker_ref) then raise exception 'Side-effect dispatch claim/generation conflict'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect dispatch evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Side-effect dispatch requires evidence'; end if;
  update public.command_center_agency_side_effect_outbox
    set state='dispatched',external_effect_possible=true,last_dispatched_at=p_dispatched_at,claimed_by=null,claim_expires_at=null,evidence_refs=p_evidence_refs,updated_at=p_dispatched_at
    where owner_id=u and effect_id=p_effect_id;
  perform command_center_private.c7_record_side_effect_event(u,e.project_id,e.effect_id,'claimed','dispatched',e.dispatch_generation,jsonb_build_object('worker_ref',btrim(p_worker_ref)),p_evidence_refs,p_dispatched_at);
  return jsonb_build_object('effect_id',e.effect_id,'state','dispatched','dispatch_generation',e.dispatch_generation,'retry_allowed',false);
end $$;

create or replace function public.command_center_agency_record_side_effect_outcome(
  p_effect_id uuid,p_expected_generation bigint,p_outcome text,p_retry_after timestamptz,p_detail jsonb,p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_side_effect_outbox%rowtype; v_state text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_outcome not in ('succeeded','failed_no_effect','unknown') then raise exception 'Invalid side-effect outcome'; end if;
  select * into e from public.command_center_agency_side_effect_outbox where owner_id=u and effect_id=p_effect_id for update;
  if not found then raise exception 'Side-effect not found'; end if;
  if e.state<>'dispatched' or e.dispatch_generation<>p_expected_generation then raise exception 'Side-effect outcome generation conflict'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect outcome evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Side-effect outcome requires evidence'; end if;
  v_state:=p_outcome;
  update public.command_center_agency_side_effect_outbox
    set state=v_state,last_outcome_at=p_occurred_at,next_attempt_at=case when v_state='failed_no_effect' then coalesce(p_retry_after,p_occurred_at) else null end,
        evidence_refs=p_evidence_refs,updated_at=p_occurred_at
    where owner_id=u and effect_id=p_effect_id;
  perform command_center_private.c7_record_side_effect_event(u,e.project_id,e.effect_id,'dispatched',v_state,e.dispatch_generation,coalesce(p_detail,'{}'::jsonb),p_evidence_refs,p_occurred_at);
  return jsonb_build_object('effect_id',e.effect_id,'state',v_state,'dispatch_generation',e.dispatch_generation,'retry_allowed',v_state='failed_no_effect');
end $$;

create or replace function public.command_center_agency_mark_stale_dispatched_unknown(
  p_project_id text,p_dispatched_before timestamptz,p_now timestamptz,p_evidence_refs text[]
) returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_side_effect_outbox%rowtype; v_count integer:=0; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect unknown evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Unknown side-effect marking requires evidence'; end if;
  for e in select * from public.command_center_agency_side_effect_outbox
    where owner_id=u and project_id=btrim(p_project_id) and state='dispatched' and last_dispatched_at<=p_dispatched_before
    order by last_dispatched_at,effect_id for update skip locked
  loop
    update public.command_center_agency_side_effect_outbox set state='unknown',last_outcome_at=p_now,evidence_refs=p_evidence_refs,updated_at=p_now where owner_id=u and effect_id=e.effect_id;
    perform command_center_private.c7_record_side_effect_event(u,e.project_id,e.effect_id,'dispatched','unknown',e.dispatch_generation,jsonb_build_object('reason','stale_dispatched_without_outcome'),p_evidence_refs,p_now);
    v_count:=v_count+1;
  end loop;
  return v_count;
end $$;

create or replace function public.command_center_agency_reconcile_unknown_side_effect(
  p_effect_id uuid,p_resolution text,p_retry_after timestamptz,p_detail jsonb,p_evidence_refs text[],p_reconciled_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_side_effect_outbox%rowtype; v_state text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_resolution not in ('no_effect','succeeded') then raise exception 'Invalid side-effect reconciliation'; end if;
  select * into e from public.command_center_agency_side_effect_outbox where owner_id=u and effect_id=p_effect_id for update;
  if not found then raise exception 'Side-effect not found'; end if;
  if e.state<>'unknown' then raise exception 'Only unknown side effects may be reconciled'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect reconciliation evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Side-effect reconciliation requires evidence'; end if;
  v_state:=case when p_resolution='no_effect' then 'reconciled_no_effect' else 'reconciled_succeeded' end;
  update public.command_center_agency_side_effect_outbox
    set state=v_state,reconciliation=p_resolution,reconciled_at=p_reconciled_at,next_attempt_at=case when p_resolution='no_effect' then coalesce(p_retry_after,p_reconciled_at) else null end,
        evidence_refs=p_evidence_refs,updated_at=p_reconciled_at
    where owner_id=u and effect_id=p_effect_id;
  perform command_center_private.c7_record_side_effect_event(u,e.project_id,e.effect_id,'unknown',v_state,e.dispatch_generation,coalesce(p_detail,'{}'::jsonb),p_evidence_refs,p_reconciled_at);
  return jsonb_build_object('effect_id',e.effect_id,'state',v_state,'dispatch_generation',e.dispatch_generation,'retry_allowed',p_resolution='no_effect');
end $$;

create or replace function public.command_center_agency_record_side_effect_inbox(
  p_project_id text,p_effect_id uuid,p_provider_key text,p_account_id text,p_environment text,p_provider_event_id text,p_provider_event_hash text,p_provider_sequence bigint,p_evidence_refs text[],p_received_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); i public.command_center_agency_side_effect_inbox%rowtype; v_state text:='received'; v_inbox_id uuid; v_max_sequence bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_effect_id is not null and not exists(select 1 from public.command_center_agency_side_effect_outbox where owner_id=u and project_id=btrim(p_project_id) and effect_id=p_effect_id) then raise exception 'Inbox effect scope mismatch'; end if;
  if p_environment not in ('development','test','staging','production') or coalesce(btrim(p_provider_key),'')='' or coalesce(btrim(p_account_id),'')='' or coalesce(btrim(p_provider_event_id),'')='' then raise exception 'Inbox provider/account/environment/event identity required'; end if;
  if coalesce(p_provider_event_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Inbox event hash required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect inbox evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Side-effect inbox requires evidence'; end if;

  select * into i from public.command_center_agency_side_effect_inbox
    where owner_id=u and provider_key=btrim(p_provider_key) and account_id=btrim(p_account_id) and provider_event_id=btrim(p_provider_event_id) for update;
  if found then
    if i.provider_event_hash<>p_provider_event_hash or i.project_id<>btrim(p_project_id) or i.environment<>p_environment or i.effect_id is distinct from p_effect_id then raise exception 'Provider event identity collision with modified payload/scope/effect'; end if;
    return jsonb_build_object('inbox_id',i.inbox_id,'state',i.state,'duplicate',true,'apply_allowed',false);
  end if;

  if p_provider_sequence is not null then
    select max(provider_sequence) into v_max_sequence from public.command_center_agency_side_effect_inbox
      where owner_id=u and provider_key=btrim(p_provider_key) and account_id=btrim(p_account_id) and provider_sequence is not null and state in ('received','applied');
    if v_max_sequence is not null and p_provider_sequence<v_max_sequence then v_state:='out_of_order'; end if;
  end if;

  insert into public.command_center_agency_side_effect_inbox(owner_id,project_id,effect_id,provider_key,account_id,environment,provider_event_id,provider_event_hash,provider_sequence,state,evidence_refs,received_at)
  values(u,btrim(p_project_id),p_effect_id,btrim(p_provider_key),btrim(p_account_id),p_environment,btrim(p_provider_event_id),p_provider_event_hash,p_provider_sequence,v_state,p_evidence_refs,p_received_at)
  returning inbox_id into v_inbox_id;
  return jsonb_build_object('inbox_id',v_inbox_id,'state',v_state,'duplicate',false,'apply_allowed',v_state='received');
end $$;

create or replace function public.command_center_agency_apply_side_effect_inbox(
  p_inbox_id uuid,p_effect_id uuid,p_evidence_refs text[],p_applied_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); i public.command_center_agency_side_effect_inbox%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into i from public.command_center_agency_side_effect_inbox where owner_id=u and inbox_id=p_inbox_id for update;
  if not found then raise exception 'Inbox event not found'; end if;
  if i.state='applied' then return jsonb_build_object('inbox_id',i.inbox_id,'state','applied','duplicate_apply',true); end if;
  if i.state<>'received' then raise exception 'Inbox event is not eligible for application'; end if;
  if p_effect_id is not null and not exists(select 1 from public.command_center_agency_side_effect_outbox where owner_id=u and project_id=i.project_id and effect_id=p_effect_id) then raise exception 'Inbox apply effect scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Side-effect inbox apply evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Inbox application requires evidence'; end if;
  update public.command_center_agency_side_effect_inbox set state='applied',effect_id=coalesce(p_effect_id,effect_id),evidence_refs=p_evidence_refs,applied_at=p_applied_at where owner_id=u and inbox_id=p_inbox_id;
  return jsonb_build_object('inbox_id',i.inbox_id,'state','applied','duplicate_apply',false);
end $$;

revoke all on function public.command_center_agency_prepare_side_effect(text,text,text,text,text,text,text,text,text,text,text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_claim_side_effect(text,text,integer,timestamptz) from public,anon;
revoke all on function public.command_center_agency_mark_side_effect_dispatched(uuid,bigint,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_record_side_effect_outcome(uuid,bigint,text,timestamptz,jsonb,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_mark_stale_dispatched_unknown(text,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_reconcile_unknown_side_effect(uuid,text,timestamptz,jsonb,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_record_side_effect_inbox(text,uuid,text,text,text,text,text,bigint,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_apply_side_effect_inbox(uuid,uuid,text[],timestamptz) from public,anon;

grant execute on function public.command_center_agency_prepare_side_effect(text,text,text,text,text,text,text,text,text,text,text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_claim_side_effect(text,text,integer,timestamptz) to authenticated;
grant execute on function public.command_center_agency_mark_side_effect_dispatched(uuid,bigint,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_record_side_effect_outcome(uuid,bigint,text,timestamptz,jsonb,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_mark_stale_dispatched_unknown(text,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_reconcile_unknown_side_effect(uuid,text,timestamptz,jsonb,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_record_side_effect_inbox(text,uuid,text,text,text,text,text,bigint,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_apply_side_effect_inbox(uuid,uuid,text[],timestamptz) to authenticated;