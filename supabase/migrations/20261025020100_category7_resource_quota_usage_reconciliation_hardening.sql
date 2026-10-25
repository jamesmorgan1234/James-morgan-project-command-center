-- Category 7 resource-governor lifecycle hardening.
-- Branch-only migration. No live database mutation is performed by committing this file.
-- A new late provider receipt reopens prior reconciliation; unchanged repeated reconciliation is idempotent.

create or replace function public.command_center_resource_record_provider_usage_receipt(
  p_reservation_id uuid,p_provider_receipt_id text,p_provider_receipt_hash text,p_reported_units bigint,p_reported_cost_microusd bigint,p_evidence_refs text[],p_occurred_at timestamptz,p_observed_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; x public.command_center_provider_usage_receipts%rowtype; v_reopened boolean:=false; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_provider_receipt_id),'')='' or coalesce(p_provider_receipt_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Provider usage receipt stable identity and hash required'; end if;
  if p_reported_units is null or p_reported_units<0 or p_reported_cost_microusd is null or p_reported_cost_microusd<0 then raise exception 'Provider usage receipt must report known non-negative usage and cost'; end if;
  if p_observed_at<p_occurred_at then raise exception 'Provider usage receipt observed time cannot precede occurrence'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Provider usage receipt evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Provider usage receipt evidence required'; end if;

  select * into r from public.command_center_resource_quota_reservations where owner_id=u and reservation_id=p_reservation_id for update;
  if not found or r.state not in ('settled_pending_receipt','reconciled') then raise exception 'Provider usage receipt requires settled reservation'; end if;
  select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id;

  select * into x from public.command_center_provider_usage_receipts
    where owner_id=u and provider_key=b.provider_key and account_id=b.account_id and environment=b.environment and provider_receipt_id=btrim(p_provider_receipt_id) for update;
  if found then
    if x.reservation_id<>p_reservation_id or x.provider_receipt_hash<>p_provider_receipt_hash or x.reported_units<>p_reported_units or x.reported_cost_microusd<>p_reported_cost_microusd then
      raise exception 'Provider usage receipt identity collision with modified payload or reservation';
    end if;
    return jsonb_build_object('usage_receipt_id',x.usage_receipt_id,'duplicate',true,'reservation_id',x.reservation_id,'reconciliation_reopened',false);
  end if;

  if r.state='reconciled' then
    v_reopened:=true;
    update public.command_center_resource_quota_reservations
      set state='settled_pending_receipt',generation=generation+1,reconciled_at=null,evidence_refs=p_evidence_refs,updated_at=p_observed_at
      where owner_id=u and reservation_id=r.reservation_id returning * into r;
  end if;

  insert into public.command_center_provider_usage_receipts(owner_id,reservation_id,provider_key,account_id,environment,provider_receipt_id,provider_receipt_hash,reported_units,reported_cost_microusd,evidence_refs,occurred_at,observed_at)
    values(u,r.reservation_id,b.provider_key,b.account_id,b.environment,btrim(p_provider_receipt_id),p_provider_receipt_hash,p_reported_units,p_reported_cost_microusd,p_evidence_refs,p_occurred_at,p_observed_at)
    returning * into x;
  perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'receipt_recorded',r.generation,jsonb_build_object('provider_receipt_id',x.provider_receipt_id,'reported_units',x.reported_units,'reported_cost_microusd',x.reported_cost_microusd,'reconciliation_reopened',v_reopened),p_evidence_refs,p_observed_at);
  return jsonb_build_object('usage_receipt_id',x.usage_receipt_id,'duplicate',false,'reservation_id',x.reservation_id,'reconciliation_reopened',v_reopened);
end $$;

create or replace function public.command_center_resource_reconcile_usage(
  p_reservation_id uuid,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_resource_quota_reservations%rowtype; b public.command_center_resource_quota_buckets%rowtype; x public.command_center_resource_usage_reconciliations%rowtype; v_count integer; v_units bigint; v_cost bigint; v_state text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Usage reconciliation evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Usage reconciliation evidence required'; end if;

  select * into r from public.command_center_resource_quota_reservations where owner_id=u and reservation_id=p_reservation_id for update;
  if not found or r.state not in ('settled_pending_receipt','reconciled') then raise exception 'Usage reconciliation requires settled reservation'; end if;
  select * into b from public.command_center_resource_quota_buckets where owner_id=u and bucket_id=r.bucket_id;

  if r.state='reconciled' then
    select * into x from public.command_center_resource_usage_reconciliations where owner_id=u and reservation_id=r.reservation_id;
    if not found or x.state<>'matched' then raise exception 'Reconciled reservation is missing matched reconciliation evidence'; end if;
    return jsonb_build_object('reservation_id',r.reservation_id,'reconciliation_state','matched','receipt_count',x.receipt_count,'release_gate_eligible',b.state='active','duplicate_reconciliation',true,'generation',r.generation);
  end if;

  select count(*)::integer,coalesce(sum(reported_units),0)::bigint,coalesce(sum(reported_cost_microusd),0)::bigint
    into v_count,v_units,v_cost from public.command_center_provider_usage_receipts where owner_id=u and reservation_id=r.reservation_id;
  if v_count=0 then raise exception 'Usage reconciliation requires provider receipt evidence'; end if;
  if v_units=r.actual_internal_units and v_cost=r.actual_internal_cost_microusd then v_state:='matched';
  elsif v_units>=r.actual_internal_units and v_cost>=r.actual_internal_cost_microusd then v_state:='provider_higher';
  elsif v_units<=r.actual_internal_units and v_cost<=r.actual_internal_cost_microusd then v_state:='internal_higher';
  else v_state:='mixed_mismatch'; end if;

  insert into public.command_center_resource_usage_reconciliations(owner_id,reservation_id,state,internal_units,provider_units,internal_cost_microusd,provider_cost_microusd,receipt_count,evidence_refs,reconciled_at)
  values(u,r.reservation_id,v_state,r.actual_internal_units,v_units,r.actual_internal_cost_microusd,v_cost,v_count,p_evidence_refs,p_now)
  on conflict(owner_id,reservation_id) do update set state=excluded.state,internal_units=excluded.internal_units,provider_units=excluded.provider_units,internal_cost_microusd=excluded.internal_cost_microusd,provider_cost_microusd=excluded.provider_cost_microusd,receipt_count=excluded.receipt_count,evidence_refs=excluded.evidence_refs,reconciled_at=excluded.reconciled_at;

  if v_state='matched' then
    update public.command_center_resource_quota_reservations
      set state='reconciled',generation=generation+1,evidence_refs=p_evidence_refs,reconciled_at=p_now,updated_at=p_now
      where owner_id=u and reservation_id=r.reservation_id returning * into r;
    perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'reconciled',r.generation,jsonb_build_object('receipt_count',v_count),p_evidence_refs,p_now);
  else
    perform command_center_private.c7_record_quota_event(u,b.bucket_id,r.reservation_id,'mismatch',r.generation,jsonb_build_object('state',v_state,'internal_units',r.actual_internal_units,'provider_units',v_units,'internal_cost_microusd',r.actual_internal_cost_microusd,'provider_cost_microusd',v_cost),p_evidence_refs,p_now);
  end if;
  return jsonb_build_object('reservation_id',r.reservation_id,'reconciliation_state',v_state,'receipt_count',v_count,'release_gate_eligible',v_state='matched' and b.state='active','duplicate_reconciliation',false,'generation',r.generation);
end $$;

revoke all on function public.command_center_resource_record_provider_usage_receipt(uuid,text,text,bigint,bigint,text[],timestamptz,timestamptz) from public,anon;
revoke all on function public.command_center_resource_reconcile_usage(uuid,text[],timestamptz) from public,anon;
grant execute on function public.command_center_resource_record_provider_usage_receipt(uuid,text,text,bigint,bigint,text[],timestamptz,timestamptz) to authenticated;
grant execute on function public.command_center_resource_reconcile_usage(uuid,text[],timestamptz) to authenticated;