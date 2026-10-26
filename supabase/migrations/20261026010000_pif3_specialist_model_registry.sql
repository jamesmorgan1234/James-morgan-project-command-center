-- PIF.3 — Specialist Model Registry. Extends the existing C6 specialist Brain owner; no parallel identity store.
-- Branch-only migration. No production database mutation until explicitly authorized.

alter table public.command_center_specialist_brains
  add column if not exists specialist_id text,
  add column if not exists control_plane text not null default 'command_center',
  add column if not exists domain text not null default 'legacy',
  add column if not exists subdomains text[] not null default '{}'::text[],
  add column if not exists supported_company_ids text[] not null default '{}'::text[],
  add column if not exists supported_project_ids text[] not null default '{}'::text[],
  add column if not exists supported_work_classes text[] not null default array['legacy'],
  add column if not exists strengths text[] not null default array['legacy-compatible'],
  add column if not exists weaknesses text[] not null default array['legacy-contract-incomplete'],
  add column if not exists method_ids text[] not null default '{}'::text[],
  add column if not exists permission_keys text[] not null default '{}'::text[],
  add column if not exists protected_action_boundaries text[] not null default array['owner-authorization'],
  add column if not exists data_classes text[] not null default array['legacy'],
  add column if not exists tool_keys text[] not null default '{}'::text[],
  add column if not exists provider_keys text[] not null default '{}'::text[],
  add column if not exists model_assignments jsonb not null default '[]'::jsonb,
  add column if not exists dependency_version_refs text[] not null default array['c6-specialist-contract'],
  add column if not exists calibration_score numeric(6,5) not null default 0,
  add column if not exists evaluation_evidence_ids text[] not null default '{}'::text[],
  add column if not exists historical_accuracy numeric(6,5) not null default 0,
  add column if not exists reliability_score numeric(6,5) not null default 0,
  add column if not exists latency_ms bigint not null default 0,
  add column if not exists resource_class text not null default 'low',
  add column if not exists cost_class text not null default 'free',
  add column if not exists failure_modes text[] not null default array['legacy-contract-incomplete'],
  add column if not exists degraded_modes text[] not null default array['legacy-read-only'],
  add column if not exists fallback_specialist_ids text[] not null default '{}'::text[],
  add column if not exists delegation_targets text[] not null default '{}'::text[],
  add column if not exists learning_eligibility text not null default 'none',
  add column if not exists experiment_status text not null default 'stable',
  add column if not exists health text not null default 'healthy',
  add column if not exists lifecycle text not null default 'active',
  add column if not exists rollback_evidence_id text,
  add column if not exists provenance_evidence_ids text[] not null default '{}'::text[],
  add column if not exists evaluation_history jsonb not null default '[]'::jsonb,
  add column if not exists verification_state text not null default 'experimental',
  add column if not exists revalidated_at timestamptz not null default now(),
  add column if not exists revalidate_after timestamptz not null default (now()+interval '30 days');

update public.command_center_specialist_brains
set specialist_id = 'brn_legacy-' || substr(md5(brain_key),1,16)
where specialist_id is null;

alter table public.command_center_specialist_brains
  alter column specialist_id set not null;

create unique index if not exists command_center_specialist_brains_specialist_id_uq
  on public.command_center_specialist_brains(owner_id,specialist_id);

alter table public.command_center_specialist_brains drop constraint if exists command_center_specialist_brains_pif3_contract;
alter table public.command_center_specialist_brains add constraint command_center_specialist_brains_pif3_contract check (
  specialist_id ~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$'
  and control_plane='command_center'
  and length(btrim(domain))>0
  and cardinality(supported_work_classes)>0
  and cardinality(strengths)>0
  and cardinality(weaknesses)>0
  and cardinality(protected_action_boundaries)>0
  and cardinality(data_classes)>0
  and cardinality(dependency_version_refs)>0
  and cardinality(failure_modes)>0
  and cardinality(degraded_modes)>0
  and calibration_score between 0 and 1
  and historical_accuracy between 0 and 1
  and reliability_score between 0 and 1
  and latency_ms>=0
  and resource_class in ('low','medium','high')
  and cost_class in ('free','paid','unknown')
  and learning_eligibility in ('none','local_only','promotion_candidate')
  and experiment_status in ('stable','experimental','control','candidate')
  and health in ('healthy','degraded','unavailable')
  and lifecycle in ('active','suspended','retired')
  and verification_state in ('verified','owner_approved','experimental')
  and jsonb_typeof(model_assignments)='array'
  and jsonb_typeof(evaluation_history)='array'
  and revalidate_after>revalidated_at
  and not (lifecycle<>'active' and enabled)
  and not (lifecycle='retired' and learning_eligibility<>'none')
);

create table if not exists public.command_center_specialist_brain_versions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  specialist_id text not null,
  version bigint not null check(version>=1),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  authority_evidence_ids text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,specialist_id,version),
  foreign key(owner_id,specialist_id) references public.command_center_specialist_brains(owner_id,specialist_id) on delete cascade,
  check(cardinality(authority_evidence_ids)>0)
);

alter table public.command_center_specialist_brain_versions enable row level security;
revoke all on table public.command_center_specialist_brain_versions from public,anon,authenticated;
grant select on table public.command_center_specialist_brain_versions to authenticated;
drop policy if exists pif3_owner_select_specialist_versions on public.command_center_specialist_brain_versions;
create policy pif3_owner_select_specialist_versions on public.command_center_specialist_brain_versions for select to authenticated
  using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function command_center_private.pif3_canonical_ids_valid(p_values text[],p_prefix text,p_require_one boolean)
returns boolean language sql immutable set search_path='' as $$
  select (not p_require_one or cardinality(p_values)>0)
     and command_center_private.c3_text_array_unique_nonblank(p_values)
     and not exists(select 1 from unnest(p_values) v(value) where v.value !~ ('^'||p_prefix||'_[a-z0-9]+(?:-[a-z0-9]+)*$'));
$$;
revoke all on function command_center_private.pif3_canonical_ids_valid(text[],text,boolean) from public,anon,authenticated;

create or replace function public.command_center_register_specialist_model(
  p_specialist_id text,p_brain_key text,p_scope text,p_project_id text,p_domain text,p_subdomains text[],p_supported_company_ids text[],p_supported_project_ids text[],p_supported_work_classes text[],
  p_strengths text[],p_weaknesses text[],p_capability_keys text[],p_method_ids text[],p_permission_keys text[],p_protected_action_boundaries text[],p_data_classes text[],p_tool_keys text[],p_provider_keys text[],p_model_assignments jsonb,p_dependency_version_refs text[],
  p_calibration_score numeric,p_evaluation_evidence_ids text[],p_historical_accuracy numeric,p_reliability_score numeric,p_latency_ms bigint,p_resource_class text,p_cost_class text,p_failure_modes text[],p_degraded_modes text[],p_fallback_specialist_ids text[],p_delegation_targets text[],
  p_learning_eligibility text,p_experiment_status text,p_health text,p_rollback_evidence_id text,p_provenance_evidence_ids text[],p_verification_state text,p_revalidated_at timestamptz,p_revalidate_after timestamptz,p_allowed_memory_kinds text[],p_authority_evidence_ids text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); snap jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_specialist_id !~ '^brn_[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid canonical specialist identity'; end if;
  if not command_center_private.pif3_canonical_ids_valid(p_method_ids,'mth',false)
     or not command_center_private.pif3_canonical_ids_valid(p_evaluation_evidence_ids,'evd',true)
     or not command_center_private.pif3_canonical_ids_valid(p_provenance_evidence_ids,'evd',true)
     or not command_center_private.pif3_canonical_ids_valid(p_fallback_specialist_ids,'brn',false)
     or p_rollback_evidence_id !~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'
     or not command_center_private.pif3_canonical_ids_valid(p_authority_evidence_ids,'evd',true)
  then raise exception 'Invalid specialist canonical evidence/method/fallback envelope'; end if;
  if p_specialist_id=any(p_fallback_specialist_ids) then raise exception 'Specialist cannot fall back to itself'; end if;
  if p_revalidate_after<=p_revalidated_at then raise exception 'Invalid specialist revalidation window'; end if;
  insert into public.command_center_specialist_brains(owner_id,brain_key,specialist_id,version,scope,project_id,capabilities,allowed_memory_kinds,enabled,configuration_ref,provenance_refs,control_plane,domain,subdomains,supported_company_ids,supported_project_ids,supported_work_classes,strengths,weaknesses,method_ids,permission_keys,protected_action_boundaries,data_classes,tool_keys,provider_keys,model_assignments,dependency_version_refs,calibration_score,evaluation_evidence_ids,historical_accuracy,reliability_score,latency_ms,resource_class,cost_class,failure_modes,degraded_modes,fallback_specialist_ids,delegation_targets,learning_eligibility,experiment_status,health,lifecycle,rollback_evidence_id,provenance_evidence_ids,evaluation_history,verification_state,revalidated_at,revalidate_after)
  values(u,p_brain_key,p_specialist_id,1,p_scope,nullif(btrim(coalesce(p_project_id,'')),''),p_capability_keys,p_allowed_memory_kinds,true,null,p_provenance_evidence_ids,'command_center',p_domain,p_subdomains,p_supported_company_ids,p_supported_project_ids,p_supported_work_classes,p_strengths,p_weaknesses,p_method_ids,p_permission_keys,p_protected_action_boundaries,p_data_classes,p_tool_keys,p_provider_keys,p_model_assignments,p_dependency_version_refs,p_calibration_score,p_evaluation_evidence_ids,p_historical_accuracy,p_reliability_score,p_latency_ms,p_resource_class,p_cost_class,p_failure_modes,p_degraded_modes,p_fallback_specialist_ids,p_delegation_targets,p_learning_eligibility,p_experiment_status,p_health,'active',p_rollback_evidence_id,p_provenance_evidence_ids,'[]'::jsonb,p_verification_state,p_revalidated_at,p_revalidate_after);
  select to_jsonb(s)-'owner_id' into snap from public.command_center_specialist_brains s where owner_id=u and specialist_id=p_specialist_id;
  insert into public.command_center_specialist_brain_versions(owner_id,specialist_id,version,snapshot,authority_evidence_ids) values(u,p_specialist_id,1,snap,p_authority_evidence_ids);
  return jsonb_build_object('specialist_id',p_specialist_id,'version',1,'control_plane','command_center');
end $$;

create or replace function public.command_center_set_specialist_lifecycle(p_specialist_id text,p_expected_version bigint,p_lifecycle text,p_authority_evidence_ids text[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); current_row public.command_center_specialist_brains%rowtype; next_version bigint; snap jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_lifecycle not in ('suspended','retired') then raise exception 'Lifecycle mutation must suspend or retire'; end if;
  if not command_center_private.pif3_canonical_ids_valid(p_authority_evidence_ids,'evd',true) then raise exception 'Authority evidence required'; end if;
  select * into current_row from public.command_center_specialist_brains where owner_id=u and specialist_id=p_specialist_id for update;
  if not found then raise exception 'Specialist not found'; end if;
  if current_row.version<>p_expected_version then raise exception 'Specialist version conflict'; end if;
  if current_row.lifecycle='retired' then raise exception 'Retired specialist cannot be mutated'; end if;
  next_version:=current_row.version+1;
  update public.command_center_specialist_brains set version=next_version,enabled=false,lifecycle=p_lifecycle,learning_eligibility=case when p_lifecycle='retired' then 'none' else learning_eligibility end,updated_at=now() where owner_id=u and specialist_id=p_specialist_id;
  select to_jsonb(s)-'owner_id' into snap from public.command_center_specialist_brains s where owner_id=u and specialist_id=p_specialist_id;
  insert into public.command_center_specialist_brain_versions(owner_id,specialist_id,version,snapshot,authority_evidence_ids) values(u,p_specialist_id,next_version,snap,p_authority_evidence_ids);
  return jsonb_build_object('specialist_id',p_specialist_id,'version',next_version,'lifecycle',p_lifecycle);
end $$;

revoke all on function public.command_center_register_specialist_model(text,text,text,text,text,text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],jsonb,text[],numeric,text[],numeric,numeric,bigint,text,text,text[],text[],text[],text[],text,text,text,text,text[],text,text,timestamptz,timestamptz,text[],text[]) from public,anon;
grant execute on function public.command_center_register_specialist_model(text,text,text,text,text,text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],text[],jsonb,text[],numeric,text[],numeric,numeric,bigint,text,text,text[],text[],text[],text[],text,text,text,text,text[],text,text,timestamptz,timestamptz,text[],text[]) to authenticated;
revoke all on function public.command_center_set_specialist_lifecycle(text,bigint,text,text[]) from public,anon;
grant execute on function public.command_center_set_specialist_lifecycle(text,bigint,text,text[]) to authenticated;
