-- PIF.2 — durable Capability/Method Portfolio, extending C1 capability ownership.
-- Branch-only migration. No production database mutation until explicitly authorized.

create table if not exists public.command_center_capability_methods (
  owner_id uuid not null references auth.users(id) on delete cascade,
  method_id text not null,
  capability_key text not null,
  version bigint not null check (version >= 1),
  implementation_version_ref text not null,
  enabled boolean not null default true,
  lifecycle text not null check (lifecycle in ('experimental','active','deprecated','retired')),
  applicability_scope_keys text[] not null,
  contraindications text[] not null default '{}'::text[],
  prerequisites text[] not null default '{}'::text[],
  quality_score numeric(6,5) not null check (quality_score between 0 and 1),
  calibration_score numeric(6,5) not null check (calibration_score between 0 and 1),
  latency_ms bigint not null check (latency_ms >= 0),
  resource_class text not null check (resource_class in ('low','medium','high')),
  cost_class text not null check (cost_class in ('free','paid','unknown')),
  privacy_class text not null check (privacy_class in ('local','private_remote','remote')),
  max_data_sensitivity text not null check (max_data_sensitivity in ('internal','sensitive','protected','secret')),
  security_assurance numeric(6,5) not null check (security_assurance between 0 and 1),
  reliability_score numeric(6,5) not null check (reliability_score between 0 and 1),
  benchmark_evidence_ids text[] not null,
  outcome_evidence_ids text[] not null default '{}'::text[],
  provenance_evidence_ids text[] not null,
  fallback_method_ids text[] not null default '{}'::text[],
  rollback_evidence_id text not null,
  revalidated_at timestamptz not null,
  revalidate_after timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,method_id),
  check (method_id ~ '^mth_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (capability_key ~ '^capability:[A-Za-z0-9._:-]+$'),
  check (length(btrim(implementation_version_ref)) > 0),
  check (cardinality(applicability_scope_keys) > 0),
  check (cardinality(benchmark_evidence_ids) > 0),
  check (cardinality(provenance_evidence_ids) > 0),
  check (rollback_evidence_id ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (revalidate_after > revalidated_at),
  check (not (enabled and lifecycle in ('deprecated','retired')))
);

create table if not exists public.command_center_capability_method_versions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  method_id text not null,
  version bigint not null check (version >= 1),
  capability_key text not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot)='object'),
  provenance_evidence_ids text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,method_id,version),
  foreign key(owner_id,method_id) references public.command_center_capability_methods(owner_id,method_id) on delete cascade
);

create index if not exists command_center_capability_methods_route_idx
  on public.command_center_capability_methods(owner_id,capability_key,lifecycle,enabled,revalidate_after);

create or replace function command_center_private.pif2_canonical_array_valid(p_values text[],p_prefix text,p_require_one boolean)
returns boolean language sql immutable set search_path='' as $$
  select (not p_require_one or cardinality(p_values)>0)
     and command_center_private.c3_text_array_unique_nonblank(p_values)
     and not exists (
       select 1 from unnest(p_values) v(value)
       where v.value !~ ('^'||p_prefix||'_[a-z0-9]+(?:-[a-z0-9]+)*$')
     );
$$;
revoke all on function command_center_private.pif2_canonical_array_valid(text[],text,boolean) from public,anon,authenticated;

alter table public.command_center_capability_methods
  drop constraint if exists command_center_capability_methods_evidence_valid;
alter table public.command_center_capability_methods
  add constraint command_center_capability_methods_evidence_valid check (
    command_center_private.pif2_canonical_array_valid(benchmark_evidence_ids,'evd',true)
    and command_center_private.pif2_canonical_array_valid(outcome_evidence_ids,'evd',false)
    and command_center_private.pif2_canonical_array_valid(provenance_evidence_ids,'evd',true)
    and command_center_private.pif2_canonical_array_valid(fallback_method_ids,'mth',false)
    and not (method_id = any(fallback_method_ids))
    and (lifecycle <> 'active' or cardinality(outcome_evidence_ids)>0)
  );

alter table public.command_center_capability_method_versions
  drop constraint if exists command_center_capability_method_versions_provenance_valid;
alter table public.command_center_capability_method_versions
  add constraint command_center_capability_method_versions_provenance_valid check (
    command_center_private.pif2_canonical_array_valid(provenance_evidence_ids,'evd',true)
  );

do $$
declare t text;
begin
  foreach t in array array['command_center_capability_methods','command_center_capability_method_versions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','pif2_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','pif2_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_register_capability_method(
  p_method_id text,p_capability_key text,p_implementation_version_ref text,p_enabled boolean,p_lifecycle text,
  p_applicability_scope_keys text[],p_contraindications text[],p_prerequisites text[],
  p_quality_score numeric,p_calibration_score numeric,p_latency_ms bigint,p_resource_class text,p_cost_class text,p_privacy_class text,p_max_data_sensitivity text,
  p_security_assurance numeric,p_reliability_score numeric,p_benchmark_evidence_ids text[],p_outcome_evidence_ids text[],p_provenance_evidence_ids text[],
  p_fallback_method_ids text[],p_rollback_evidence_id text,p_revalidated_at timestamptz,p_revalidate_after timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); snap jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_method_id !~ '^mth_[a-z0-9]+(?:-[a-z0-9]+)*$' or p_capability_key !~ '^capability:[A-Za-z0-9._:-]+$' then raise exception 'Invalid method/capability identity'; end if;
  insert into public.command_center_capability_methods(owner_id,method_id,capability_key,version,implementation_version_ref,enabled,lifecycle,applicability_scope_keys,contraindications,prerequisites,quality_score,calibration_score,latency_ms,resource_class,cost_class,privacy_class,max_data_sensitivity,security_assurance,reliability_score,benchmark_evidence_ids,outcome_evidence_ids,provenance_evidence_ids,fallback_method_ids,rollback_evidence_id,revalidated_at,revalidate_after)
  values(u,p_method_id,p_capability_key,1,p_implementation_version_ref,p_enabled,p_lifecycle,p_applicability_scope_keys,p_contraindications,p_prerequisites,p_quality_score,p_calibration_score,p_latency_ms,p_resource_class,p_cost_class,p_privacy_class,p_max_data_sensitivity,p_security_assurance,p_reliability_score,p_benchmark_evidence_ids,p_outcome_evidence_ids,p_provenance_evidence_ids,p_fallback_method_ids,p_rollback_evidence_id,p_revalidated_at,p_revalidate_after);
  select to_jsonb(m)-'owner_id' into snap from public.command_center_capability_methods m where owner_id=u and method_id=p_method_id;
  insert into public.command_center_capability_method_versions(owner_id,method_id,version,capability_key,snapshot,provenance_evidence_ids)
  values(u,p_method_id,1,p_capability_key,snap,p_provenance_evidence_ids);
  return jsonb_build_object('method_id',p_method_id,'version',1,'capability_key',p_capability_key);
end $$;

create or replace function public.command_center_replace_capability_method(
  p_method_id text,p_expected_version bigint,p_implementation_version_ref text,p_enabled boolean,p_lifecycle text,
  p_applicability_scope_keys text[],p_contraindications text[],p_prerequisites text[],
  p_quality_score numeric,p_calibration_score numeric,p_latency_ms bigint,p_resource_class text,p_cost_class text,p_privacy_class text,p_max_data_sensitivity text,
  p_security_assurance numeric,p_reliability_score numeric,p_benchmark_evidence_ids text[],p_outcome_evidence_ids text[],p_provenance_evidence_ids text[],
  p_fallback_method_ids text[],p_rollback_evidence_id text,p_revalidated_at timestamptz,p_revalidate_after timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); current_row public.command_center_capability_methods%rowtype; next_version bigint; snap jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into current_row from public.command_center_capability_methods where owner_id=u and method_id=p_method_id for update;
  if not found then raise exception 'Capability method not found'; end if;
  if current_row.version<>p_expected_version then raise exception 'Capability method version conflict'; end if;
  next_version:=current_row.version+1;
  update public.command_center_capability_methods set version=next_version,implementation_version_ref=p_implementation_version_ref,enabled=p_enabled,lifecycle=p_lifecycle,applicability_scope_keys=p_applicability_scope_keys,contraindications=p_contraindications,prerequisites=p_prerequisites,quality_score=p_quality_score,calibration_score=p_calibration_score,latency_ms=p_latency_ms,resource_class=p_resource_class,cost_class=p_cost_class,privacy_class=p_privacy_class,max_data_sensitivity=p_max_data_sensitivity,security_assurance=p_security_assurance,reliability_score=p_reliability_score,benchmark_evidence_ids=p_benchmark_evidence_ids,outcome_evidence_ids=p_outcome_evidence_ids,provenance_evidence_ids=p_provenance_evidence_ids,fallback_method_ids=p_fallback_method_ids,rollback_evidence_id=p_rollback_evidence_id,revalidated_at=p_revalidated_at,revalidate_after=p_revalidate_after,updated_at=now() where owner_id=u and method_id=p_method_id;
  select to_jsonb(m)-'owner_id' into snap from public.command_center_capability_methods m where owner_id=u and method_id=p_method_id;
  insert into public.command_center_capability_method_versions(owner_id,method_id,version,capability_key,snapshot,provenance_evidence_ids)
  values(u,p_method_id,next_version,current_row.capability_key,snap,p_provenance_evidence_ids);
  return jsonb_build_object('method_id',p_method_id,'version',next_version,'capability_key',current_row.capability_key);
end $$;

revoke all on function public.command_center_register_capability_method(text,text,text,boolean,text,text[],text[],text[],numeric,numeric,bigint,text,text,text,text,numeric,numeric,text[],text[],text[],text[],text,timestamptz,timestamptz) from public,anon;
grant execute on function public.command_center_register_capability_method(text,text,text,boolean,text,text[],text[],text[],numeric,numeric,bigint,text,text,text,text,numeric,numeric,text[],text[],text[],text[],text,timestamptz,timestamptz) to authenticated;
revoke all on function public.command_center_replace_capability_method(text,bigint,text,boolean,text,text[],text[],text[],numeric,numeric,bigint,text,text,text,text,numeric,numeric,text[],text[],text[],text[],text,timestamptz,timestamptz) from public,anon;
grant execute on function public.command_center_replace_capability_method(text,bigint,text,boolean,text,text[],text[],text[],numeric,numeric,bigint,text,text,text,text,numeric,numeric,text[],text[],text[],text[],text,timestamptz,timestamptz) to authenticated;
