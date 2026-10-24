-- Category 6 / P6.2 corrective hardening — deterministic fallback ordering.
-- Branch-only migration. Primary and fallback AI routes now use the same stable policy ordering.

create or replace function public.command_center_brain_select_ai_route(
  p_capability text,
  p_allow_paid boolean,
  p_max_privacy text,
  p_prefer_quality boolean,
  p_request_hash text,
  p_evidence_refs text[],
  p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  chosen record;
  fallbacks text[]:='{}'::text[];
  v_result text;
  v_reason text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_capability),'')='' then raise exception 'AI routing capability is required'; end if;
  if p_max_privacy not in ('local','private_remote','remote') then raise exception 'Invalid maximum privacy class'; end if;
  if coalesce(p_request_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'AI routing request hash must be SHA-256 hex'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'AI route evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'AI routing requires evidence'; end if;

  select m.route_key,m.provider_key,m.model_id,m.model_version_ref,m.registry_version,m.cost,m.privacy,m.health,m.quota_state,m.execution_mode,
         p.health as provider_health,p.version as provider_version
  into chosen
  from public.command_center_ai_models m
  join public.command_center_provider_registry p on p.owner_id=m.owner_id and p.provider_key=m.provider_key
  where m.owner_id=u
    and m.enabled
    and m.retired_at is null
    and m.health<>'unavailable'
    and m.quota_state<>'exhausted'
    and p.enabled
    and p.health not in ('unavailable','unconfigured')
    and btrim(p_capability)=any(m.capabilities)
    and (p_allow_paid or m.cost<>'paid')
    and (case m.privacy when 'local' then 0 when 'private_remote' then 1 else 2 end)
        <= (case p_max_privacy when 'local' then 0 when 'private_remote' then 1 else 2 end)
  order by
    case m.cost when 'free' then 0 when 'unknown' then 1 else 2 end asc,
    case when p_prefer_quality then m.quality_rank end desc nulls last,
    case when p_prefer_quality then m.latency_rank end asc nulls last,
    case when not p_prefer_quality then m.latency_rank end asc nulls last,
    case when not p_prefer_quality then m.quality_rank end desc nulls last,
    m.route_key asc
  limit 1;

  if chosen.route_key is null then
    v_result:='unavailable'; v_reason:='no_eligible_route';
    insert into public.command_center_ai_route_events(owner_id,request_hash,capability,allow_paid,max_privacy,prefer_quality,result,reason,evidence_refs,occurred_at)
    values(u,p_request_hash,btrim(p_capability),p_allow_paid,p_max_privacy,p_prefer_quality,v_result,v_reason,p_evidence_refs,p_occurred_at);
    return jsonb_build_object('result',v_result,'reason',v_reason,'route',null,'fallback_route_keys','[]'::jsonb);
  end if;

  select coalesce(array_agg(q.route_key order by q.cost_rank,q.quality_sort,q.latency_sort,q.route_key),'{}'::text[])
  into fallbacks
  from (
    select m.route_key,
           case m.cost when 'free' then 0 when 'unknown' then 1 else 2 end as cost_rank,
           case when p_prefer_quality then -m.quality_rank else m.latency_rank end as quality_sort,
           case when p_prefer_quality then m.latency_rank else -m.quality_rank end as latency_sort
    from public.command_center_ai_models m
    join public.command_center_provider_registry p on p.owner_id=m.owner_id and p.provider_key=m.provider_key
    where m.owner_id=u and m.route_key<>chosen.route_key and m.enabled and m.retired_at is null
      and m.health<>'unavailable' and m.quota_state<>'exhausted'
      and p.enabled and p.health not in ('unavailable','unconfigured')
      and btrim(p_capability)=any(m.capabilities)
      and (p_allow_paid or m.cost<>'paid')
      and (case m.privacy when 'local' then 0 when 'private_remote' then 1 else 2 end)
          <= (case p_max_privacy when 'local' then 0 when 'private_remote' then 1 else 2 end)
    order by
      case m.cost when 'free' then 0 when 'unknown' then 1 else 2 end asc,
      case when p_prefer_quality then m.quality_rank end desc nulls last,
      case when p_prefer_quality then m.latency_rank end asc nulls last,
      case when not p_prefer_quality then m.latency_rank end asc nulls last,
      case when not p_prefer_quality then m.quality_rank end desc nulls last,
      m.route_key asc
    limit 5
  ) q;

  v_result:=case when chosen.health='degraded' or chosen.provider_health='degraded' or chosen.quota_state in ('limited','unknown') then 'degraded' else 'selected' end;
  v_reason:=case when v_result='degraded' then 'best_eligible_route_degraded' else 'best_eligible_route' end;
  insert into public.command_center_ai_route_events(owner_id,request_hash,capability,allow_paid,max_privacy,prefer_quality,selected_route_key,selected_registry_version,fallback_route_keys,result,reason,evidence_refs,occurred_at)
  values(u,p_request_hash,btrim(p_capability),p_allow_paid,p_max_privacy,p_prefer_quality,chosen.route_key,chosen.registry_version,fallbacks,v_result,v_reason,p_evidence_refs,p_occurred_at);

  return jsonb_build_object(
    'result',v_result,
    'reason',v_reason,
    'route',jsonb_build_object(
      'route_key',chosen.route_key,
      'provider_key',chosen.provider_key,
      'provider_version',chosen.provider_version,
      'model_id',chosen.model_id,
      'model_version_ref',chosen.model_version_ref,
      'registry_version',chosen.registry_version,
      'cost',chosen.cost,
      'privacy',chosen.privacy,
      'health',chosen.health,
      'quota_state',chosen.quota_state,
      'execution_mode',chosen.execution_mode
    ),
    'fallback_route_keys',to_jsonb(fallbacks)
  );
end $$;

revoke all on function public.command_center_brain_select_ai_route(text,boolean,text,boolean,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_select_ai_route(text,boolean,text,boolean,text,text[],timestamptz) to authenticated;
