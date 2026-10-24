-- Category 6 / P6.2 — durable AI provider/model routing over the canonical Category 3 provider registry.
-- Branch-only migration. Committing this file does not mutate production.
-- Brain owns routing policy; provider identity/credential references remain owned by command_center_provider_registry.

create table if not exists public.command_center_ai_models (
  owner_id uuid not null references auth.users(id) on delete cascade,
  route_key text not null,
  provider_key text not null,
  model_id text not null,
  model_version_ref text not null,
  registry_version bigint not null default 1 check (registry_version >= 1),
  enabled boolean not null default false,
  capabilities text[] not null,
  cost text not null check (cost in ('free','paid','unknown')),
  privacy text not null check (privacy in ('local','private_remote','remote')),
  health text not null check (health in ('available','degraded','unavailable')),
  quota_state text not null check (quota_state in ('available','limited','exhausted','unknown')),
  quality_rank integer not null check (quality_rank between 0 and 1000000),
  latency_rank integer not null check (latency_rank between 0 and 1000000),
  execution_mode text not null check (execution_mode in ('local','self_hosted','remote','hybrid')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,route_key),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete restrict,
  unique(owner_id,provider_key,model_id,model_version_ref),
  check (route_key ~ '^ai-route:[a-z0-9][a-z0-9._:-]{0,180}$'),
  check (length(btrim(model_id)) between 1 and 240),
  check (length(btrim(model_version_ref)) between 1 and 500),
  check (cardinality(capabilities) > 0),
  check (updated_at >= created_at),
  check (retired_at is null or retired_at >= created_at),
  check (metadata::text !~* '"(secret|token|password|api[_-]?key|private[_-]?key|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret)"[[:space:]]*:'),
  check (metadata::text !~* '(Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}|sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{20,})')
);

create table if not exists public.command_center_ai_model_versions (
  version_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  route_key text not null,
  registry_version bigint not null check (registry_version >= 1),
  provider_key text not null,
  model_id text not null,
  model_version_ref text not null,
  enabled boolean not null,
  capabilities text[] not null,
  cost text not null,
  privacy text not null,
  health text not null,
  quota_state text not null,
  quality_rank integer not null,
  latency_rank integer not null,
  execution_mode text not null,
  retired_at timestamptz,
  source_ref text not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,route_key,registry_version),
  foreign key(owner_id,route_key) references public.command_center_ai_models(owner_id,route_key) on delete cascade,
  check (length(btrim(source_ref)) between 1 and 1000)
);

create table if not exists public.command_center_ai_route_events (
  route_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_hash text not null check (request_hash ~ '^[a-f0-9]{64}$'),
  capability text not null,
  allow_paid boolean not null,
  max_privacy text not null check (max_privacy in ('local','private_remote','remote')),
  prefer_quality boolean not null,
  selected_route_key text,
  selected_registry_version bigint,
  fallback_route_keys text[] not null default '{}'::text[],
  result text not null check (result in ('selected','degraded','unavailable')),
  reason text not null,
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,selected_route_key) references public.command_center_ai_models(owner_id,route_key) on delete restrict,
  check (length(btrim(capability)) between 1 and 160),
  check (length(btrim(reason)) between 1 and 500),
  check (cardinality(evidence_refs) > 0),
  check (selected_route_key is not null or selected_registry_version is null),
  check (occurred_at <= recorded_at + interval '5 minutes')
);
create index if not exists command_center_ai_models_route_idx
  on public.command_center_ai_models(owner_id,enabled,health,quota_state,cost,privacy,retired_at,quality_rank desc,latency_rank,route_key);
create index if not exists command_center_ai_route_events_idx
  on public.command_center_ai_route_events(owner_id,recorded_at desc,route_event_id);

-- Browser roles may inspect their own routing state/evidence but never directly mutate registry rows.
do $$
declare t text;
begin
  foreach t in array array['command_center_ai_models','command_center_ai_model_versions','command_center_ai_route_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_register_ai_model(
  p_route_key text,
  p_provider_key text,
  p_model_id text,
  p_model_version_ref text,
  p_enabled boolean,
  p_capabilities text[],
  p_cost text,
  p_privacy text,
  p_health text,
  p_quota_state text,
  p_quality_rank integer,
  p_latency_rank integer,
  p_execution_mode text,
  p_metadata jsonb,
  p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_provider_registry p where p.owner_id=u and p.provider_key=btrim(p_provider_key)) then raise exception 'Canonical provider not found'; end if;
  if coalesce(btrim(p_route_key),'') !~ '^ai-route:[a-z0-9][a-z0-9._:-]{0,180}$' then raise exception 'Invalid AI route key'; end if;
  if coalesce(btrim(p_model_id),'')='' or coalesce(btrim(p_model_version_ref),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Model identity/version/source are required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'AI model capabilities');
  if cardinality(coalesce(p_capabilities,'{}'::text[]))=0 then raise exception 'AI model requires at least one capability'; end if;
  if p_cost not in ('free','paid','unknown') or p_privacy not in ('local','private_remote','remote') or p_health not in ('available','degraded','unavailable') or p_quota_state not in ('available','limited','exhausted','unknown') or p_execution_mode not in ('local','self_hosted','remote','hybrid') then raise exception 'Invalid AI routing classification'; end if;
  if coalesce(p_quality_rank,-1) not between 0 and 1000000 or coalesce(p_latency_rank,-1) not between 0 and 1000000 then raise exception 'Invalid AI route ranks'; end if;
  if jsonb_typeof(coalesce(p_metadata,'null'::jsonb))<>'object' then raise exception 'AI model metadata must be an object'; end if;
  if p_metadata::text ~* '"(secret|token|password|api[_-]?key|private[_-]?key|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret)"[[:space:]]*:' then raise exception 'Secret-bearing AI model metadata is forbidden'; end if;

  insert into public.command_center_ai_models(owner_id,route_key,provider_key,model_id,model_version_ref,enabled,capabilities,cost,privacy,health,quota_state,quality_rank,latency_rank,execution_mode,metadata)
  values(u,btrim(p_route_key),btrim(p_provider_key),btrim(p_model_id),btrim(p_model_version_ref),p_enabled,p_capabilities,p_cost,p_privacy,p_health,p_quota_state,p_quality_rank,p_latency_rank,p_execution_mode,p_metadata);
  insert into public.command_center_ai_model_versions(owner_id,route_key,registry_version,provider_key,model_id,model_version_ref,enabled,capabilities,cost,privacy,health,quota_state,quality_rank,latency_rank,execution_mode,retired_at,source_ref)
  values(u,btrim(p_route_key),1,btrim(p_provider_key),btrim(p_model_id),btrim(p_model_version_ref),p_enabled,p_capabilities,p_cost,p_privacy,p_health,p_quota_state,p_quality_rank,p_latency_rank,p_execution_mode,null,btrim(p_source_ref));
  return jsonb_build_object('route_key',btrim(p_route_key),'registry_version',1,'provider_key',btrim(p_provider_key));
end $$;

create or replace function public.command_center_brain_update_ai_model_state(
  p_route_key text,
  p_expected_registry_version bigint,
  p_enabled boolean,
  p_health text,
  p_quota_state text,
  p_retire boolean,
  p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); m public.command_center_ai_models%rowtype; v_next bigint; v_retired timestamptz; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into m from public.command_center_ai_models where owner_id=u and route_key=btrim(p_route_key) for update;
  if not found then raise exception 'AI route not found'; end if;
  if m.registry_version<>p_expected_registry_version then raise exception 'AI route version conflict'; end if;
  if p_health not in ('available','degraded','unavailable') or p_quota_state not in ('available','limited','exhausted','unknown') then raise exception 'Invalid AI route health/quota state'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'AI route state change requires source evidence'; end if;
  v_next:=m.registry_version+1;
  v_retired:=case when p_retire then coalesce(m.retired_at,now()) else m.retired_at end;
  update public.command_center_ai_models set registry_version=v_next,enabled=case when p_retire then false else p_enabled end,health=p_health,quota_state=p_quota_state,retired_at=v_retired,updated_at=now() where owner_id=u and route_key=m.route_key;
  insert into public.command_center_ai_model_versions(owner_id,route_key,registry_version,provider_key,model_id,model_version_ref,enabled,capabilities,cost,privacy,health,quota_state,quality_rank,latency_rank,execution_mode,retired_at,source_ref)
  select owner_id,route_key,registry_version,provider_key,model_id,model_version_ref,enabled,capabilities,cost,privacy,health,quota_state,quality_rank,latency_rank,execution_mode,retired_at,btrim(p_source_ref)
  from public.command_center_ai_models where owner_id=u and route_key=m.route_key;
  return jsonb_build_object('route_key',m.route_key,'registry_version',v_next,'retired',v_retired is not null);
end $$;

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

revoke all on function public.command_center_brain_register_ai_model(text,text,text,text,boolean,text[],text,text,text,text,integer,integer,text,jsonb,text) from public,anon;
revoke all on function public.command_center_brain_update_ai_model_state(text,bigint,boolean,text,text,boolean,text) from public,anon;
revoke all on function public.command_center_brain_select_ai_route(text,boolean,text,boolean,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_register_ai_model(text,text,text,text,boolean,text[],text,text,text,text,integer,integer,text,jsonb,text) to authenticated;
grant execute on function public.command_center_brain_update_ai_model_state(text,bigint,boolean,text,text,boolean,text) to authenticated;
grant execute on function public.command_center_brain_select_ai_route(text,boolean,text,boolean,text,text[],timestamptz) to authenticated;
