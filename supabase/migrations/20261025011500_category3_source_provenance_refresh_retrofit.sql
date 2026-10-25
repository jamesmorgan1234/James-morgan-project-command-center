-- Category 3 post-audit retrofit — durable source identity, temporal provenance,
-- derived-data lifecycle, provider capability drift and resumable source refresh.
-- Branch-only migration. Committing this file does not mutate production Supabase.

create table if not exists public.command_center_source_registry (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  provider_key text not null,
  source_type text not null,
  external_stable_id text not null,
  company_id text,
  project_id text,
  account_id text,
  environment text,
  trust text not null check (trust in ('owner_authoritative','verified_provider','historical_evidence','untrusted_external')),
  instruction_policy text not null check (instruction_policy in ('data_only','owner_statement_candidate')),
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected','secret')),
  purpose text[] not null,
  retention_class text not null,
  lifecycle text not null check (lifecycle in ('active','degraded','unavailable','tombstoned')),
  version bigint not null check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,source_id),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete restrict,
  check (source_id ~ '^source:[A-Za-z0-9._:-]{1,240}$'),
  check (provider_key ~ '^provider:[a-z0-9][a-z0-9._:-]{0,119}$'),
  check (length(btrim(source_type)) between 1 and 120),
  check (length(btrim(external_stable_id)) between 1 and 1000),
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (project_id is null or length(btrim(project_id)) between 1 and 240),
  check (account_id is null or length(btrim(account_id)) between 1 and 240),
  check (environment is null or environment in ('development','test','staging','production')),
  check (cardinality(purpose) > 0),
  check (length(btrim(retention_class)) between 1 and 120),
  check (trust not in ('historical_evidence','untrusted_external') or instruction_policy='data_only'),
  check (updated_at >= created_at)
);

create unique index if not exists command_center_source_stable_identity_idx
  on public.command_center_source_registry(
    owner_id,provider_key,source_type,external_stable_id,
    coalesce(company_id,''),coalesce(project_id,''),coalesce(account_id,''),coalesce(environment,'')
  );
create index if not exists command_center_source_scope_idx
  on public.command_center_source_registry(owner_id,company_id,project_id,account_id,environment,lifecycle);

create table if not exists public.command_center_source_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  version bigint not null check (version >= 1),
  trust text not null check (trust in ('owner_authoritative','verified_provider','historical_evidence','untrusted_external')),
  instruction_policy text not null check (instruction_policy in ('data_only','owner_statement_candidate')),
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected','secret')),
  purpose text[] not null,
  retention_class text not null,
  lifecycle text not null check (lifecycle in ('active','degraded','unavailable','tombstoned')),
  source_ref text not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,source_id,version),
  foreign key(owner_id,source_id) references public.command_center_source_registry(owner_id,source_id) on delete cascade,
  check (cardinality(purpose) > 0),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (trust not in ('historical_evidence','untrusted_external') or instruction_policy='data_only')
);

create table if not exists public.command_center_source_observations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  observation_id text not null,
  source_id text not null,
  sequence bigint not null check (sequence >= 1),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  state text not null check (state in ('current','superseded','corrected','retracted','tombstone')),
  observed_at timestamptz not null,
  effective_at timestamptz not null,
  ingested_at timestamptz not null,
  supersedes_observation_id text,
  reason text,
  provider_revision_id text,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,observation_id),
  unique(owner_id,source_id,sequence),
  unique(owner_id,source_id,observation_id,content_hash),
  foreign key(owner_id,source_id) references public.command_center_source_registry(owner_id,source_id) on delete cascade,
  foreign key(owner_id,supersedes_observation_id) references public.command_center_source_observations(owner_id,observation_id) on delete restrict,
  check (observation_id ~ '^observation:[A-Za-z0-9._:-]{1,240}$'),
  check ((state in ('corrected','retracted','tombstone') and length(btrim(coalesce(reason,''))) > 0) or state not in ('corrected','retracted','tombstone')),
  check (supersedes_observation_id is null or supersedes_observation_id<>observation_id),
  check (provider_revision_id is null or length(btrim(provider_revision_id)) between 1 and 1000)
);
create unique index if not exists command_center_source_one_live_observation_idx
  on public.command_center_source_observations(owner_id,source_id)
  where state in ('current','corrected');
create index if not exists command_center_source_observation_history_idx
  on public.command_center_source_observations(owner_id,source_id,sequence desc,recorded_at desc);

create table if not exists public.command_center_derived_records (
  owner_id uuid not null references auth.users(id) on delete cascade,
  derived_id text not null,
  company_id text,
  project_id text,
  purpose text not null,
  retention_class text not null,
  state text not null check (state in ('active','restricted','deleted')),
  legal_hold boolean not null default false,
  restriction_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,derived_id),
  check (derived_id ~ '^derived:[A-Za-z0-9._:-]{1,240}$'),
  check (length(btrim(purpose)) between 1 and 240),
  check (length(btrim(retention_class)) between 1 and 120),
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (project_id is null or length(btrim(project_id)) between 1 and 240),
  check (not (state='deleted' and legal_hold)),
  check (updated_at >= created_at)
);

create table if not exists public.command_center_derived_provenance (
  owner_id uuid not null references auth.users(id) on delete cascade,
  derived_id text not null,
  observation_id text not null,
  source_id text not null,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  linked_at timestamptz not null default now(),
  primary key(owner_id,derived_id,observation_id),
  foreign key(owner_id,derived_id) references public.command_center_derived_records(owner_id,derived_id) on delete cascade,
  foreign key(owner_id,source_id,observation_id,content_hash) references public.command_center_source_observations(owner_id,source_id,observation_id,content_hash) on delete restrict
);
create index if not exists command_center_derived_provenance_observation_idx
  on public.command_center_derived_provenance(owner_id,observation_id,derived_id);

create table if not exists public.command_center_provider_capability_snapshots (
  owner_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id text not null,
  provider_key text not null,
  observed_at timestamptz not null,
  api_version text,
  model_version text,
  schema_fingerprint text not null,
  capability_fingerprint text not null,
  capabilities text[] not null,
  enumeration jsonb not null,
  callbacks text not null check (callbacks in ('verified_supported','verified_unsupported','unverified')),
  pricing text not null check (pricing in ('free','paid','unknown')),
  verification text not null check (verification in ('tool_result','live_verified')),
  drift text not null check (drift in ('none','compatible','breaking','pricing_unknown')),
  recorded_at timestamptz not null default now(),
  primary key(owner_id,snapshot_id),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete cascade,
  check (snapshot_id ~ '^provider-snapshot:[A-Za-z0-9._:-]{1,240}$'),
  check (length(btrim(schema_fingerprint)) between 1 and 500),
  check (length(btrim(capability_fingerprint)) between 1 and 500),
  check (jsonb_typeof(enumeration)='object'),
  check (enumeration ?& array['enumerate_all','stable_ids','updated_metadata','revision_ids','content_hashes','delta_fetch','deletion_detection','stable_pagination']),
  check ((enumeration->>'enumerate_all') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'stable_ids') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'updated_metadata') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'revision_ids') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'content_hashes') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'delta_fetch') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'deletion_detection') in ('verified_supported','verified_unsupported','unverified')),
  check ((enumeration->>'stable_pagination') in ('verified_supported','verified_unsupported','unverified'))
);
create index if not exists command_center_provider_capability_history_idx
  on public.command_center_provider_capability_snapshots(owner_id,provider_key,observed_at desc,recorded_at desc);

create table if not exists public.command_center_source_refresh_leases (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  generation bigint not null default 0 check (generation >= 0),
  holder_id text,
  acquired_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(owner_id,source_id),
  foreign key(owner_id,source_id) references public.command_center_source_registry(owner_id,source_id) on delete cascade,
  check ((holder_id is null and acquired_at is null and expires_at is null) or (length(btrim(holder_id)) between 1 and 240 and acquired_at is not null and expires_at is not null and expires_at>acquired_at))
);

create table if not exists public.command_center_source_refresh_checkpoints (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  generation bigint not null check (generation >= 1),
  checkpoint_ref text not null,
  classification text not null check (classification in ('changed','unchanged','uncertain')),
  content_hash text,
  provider_revision_id text,
  provider_updated_at timestamptz,
  message_count bigint check (message_count is null or message_count >= 0),
  byte_size bigint check (byte_size is null or byte_size >= 0),
  checked_at timestamptz not null,
  successful boolean not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,source_id),
  foreign key(owner_id,source_id) references public.command_center_source_registry(owner_id,source_id) on delete cascade,
  check (length(btrim(checkpoint_ref)) between 1 and 1000),
  check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  check (provider_revision_id is null or length(btrim(provider_revision_id)) between 1 and 1000)
);

create table if not exists public.command_center_source_refresh_runs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  provider_key text not null,
  company_id text,
  project_id text,
  account_id text,
  environment text,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  enumeration_complete boolean not null,
  expected_count bigint not null check (expected_count >= 0),
  readable_count bigint not null check (readable_count >= 0),
  unreadable_count bigint not null check (unreadable_count >= 0),
  tombstone_count bigint not null check (tombstone_count >= 0),
  unaccounted_count bigint not null check (unaccounted_count >= 0),
  complete boolean not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,run_id),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete restrict,
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (project_id is null or length(btrim(project_id)) between 1 and 240),
  check (account_id is null or length(btrim(account_id)) between 1 and 240),
  check (environment is null or environment in ('development','test','staging','production')),
  check (completed_at >= started_at),
  check (complete=(enumeration_complete and unaccounted_count=0))
);

create table if not exists public.command_center_source_refresh_inventory (
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  external_stable_id text not null,
  state text not null check (state in ('readable','unreadable','tombstone')),
  reason text,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,run_id,external_stable_id),
  foreign key(owner_id,run_id) references public.command_center_source_refresh_runs(owner_id,run_id) on delete cascade,
  check (length(btrim(external_stable_id)) between 1 and 1000),
  check ((state in ('unreadable','tombstone') and length(btrim(coalesce(reason,'')))>0) or state='readable')
);

-- Owner-readable evidence/state; no direct authenticated mutations.
do $$
declare t text;
begin
  foreach t in array array[
    'command_center_source_registry','command_center_source_versions','command_center_source_observations',
    'command_center_derived_records','command_center_derived_provenance','command_center_provider_capability_snapshots',
    'command_center_source_refresh_leases','command_center_source_refresh_checkpoints',
    'command_center_source_refresh_runs','command_center_source_refresh_inventory'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c3_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c3_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c3_source_validate_enumeration(p_enumeration jsonb)
returns void language plpgsql immutable set search_path='' as $$
declare k text; v text;
begin
  if jsonb_typeof(coalesce(p_enumeration,'null'::jsonb))<>'object' then raise exception 'Provider enumeration capability truth must be an object'; end if;
  foreach k in array array['enumerate_all','stable_ids','updated_metadata','revision_ids','content_hashes','delta_fetch','deletion_detection','stable_pagination'] loop
    v:=p_enumeration->>k;
    if v is null or v not in ('verified_supported','verified_unsupported','unverified') then raise exception 'Provider enumeration capability % is missing or invalid',k; end if;
  end loop;
  if exists(select 1 from jsonb_object_keys(p_enumeration) key where key not in ('enumerate_all','stable_ids','updated_metadata','revision_ids','content_hashes','delta_fetch','deletion_detection','stable_pagination')) then
    raise exception 'Provider enumeration capability contains unknown keys';
  end if;
end $$;
revoke all on function command_center_private.c3_source_validate_enumeration(jsonb) from public,anon,authenticated;

create or replace function public.command_center_source_register(
  p_source_id text,p_provider_key text,p_source_type text,p_external_stable_id text,
  p_company_id text,p_project_id text,p_account_id text,p_environment text,
  p_trust text,p_instruction_policy text,p_sensitivity text,p_purpose text[],p_retention_class text,p_lifecycle text,p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_purpose,'Source purpose');
  if cardinality(coalesce(p_purpose,'{}'::text[]))=0 then raise exception 'Source purpose is required'; end if;
  if p_trust in ('historical_evidence','untrusted_external') and p_instruction_policy<>'data_only' then raise exception 'Historical/untrusted source content is data only'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Source registration provenance is required'; end if;
  insert into public.command_center_source_registry(owner_id,source_id,provider_key,source_type,external_stable_id,company_id,project_id,account_id,environment,trust,instruction_policy,sensitivity,purpose,retention_class,lifecycle,version)
  values(u,btrim(p_source_id),btrim(p_provider_key),btrim(p_source_type),btrim(p_external_stable_id),nullif(btrim(coalesce(p_company_id,'')),''),nullif(btrim(coalesce(p_project_id,'')),''),nullif(btrim(coalesce(p_account_id,'')),''),nullif(btrim(coalesce(p_environment,'')),''),p_trust,p_instruction_policy,p_sensitivity,p_purpose,btrim(p_retention_class),p_lifecycle,1);
  insert into public.command_center_source_versions(owner_id,source_id,version,trust,instruction_policy,sensitivity,purpose,retention_class,lifecycle,source_ref)
  values(u,btrim(p_source_id),1,p_trust,p_instruction_policy,p_sensitivity,p_purpose,btrim(p_retention_class),p_lifecycle,btrim(p_source_ref));
  return jsonb_build_object('source_id',btrim(p_source_id),'version',1,'lifecycle',p_lifecycle);
end $$;

create or replace function public.command_center_source_replace_metadata(
  p_source_id text,p_expected_version bigint,p_trust text,p_instruction_policy text,p_sensitivity text,p_purpose text[],p_retention_class text,p_lifecycle text,p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); s public.command_center_source_registry%rowtype; v_next bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_purpose,'Source purpose');
  if cardinality(coalesce(p_purpose,'{}'::text[]))=0 or coalesce(btrim(p_source_ref),'')='' then raise exception 'Source purpose/provenance are required'; end if;
  if p_trust in ('historical_evidence','untrusted_external') and p_instruction_policy<>'data_only' then raise exception 'Historical/untrusted source content is data only'; end if;
  select * into s from public.command_center_source_registry where owner_id=u and source_id=btrim(p_source_id) for update;
  if not found then raise exception 'Source not found'; end if;
  if s.version<>p_expected_version then raise exception 'Source version conflict'; end if;
  v_next:=s.version+1;
  update public.command_center_source_registry set trust=p_trust,instruction_policy=p_instruction_policy,sensitivity=p_sensitivity,purpose=p_purpose,retention_class=btrim(p_retention_class),lifecycle=p_lifecycle,version=v_next,updated_at=now()
    where owner_id=u and source_id=s.source_id;
  insert into public.command_center_source_versions(owner_id,source_id,version,trust,instruction_policy,sensitivity,purpose,retention_class,lifecycle,source_ref)
  values(u,s.source_id,v_next,p_trust,p_instruction_policy,p_sensitivity,p_purpose,btrim(p_retention_class),p_lifecycle,btrim(p_source_ref));
  return jsonb_build_object('source_id',s.source_id,'version',v_next,'lifecycle',p_lifecycle);
end $$;

create or replace function public.command_center_source_append_observation(
  p_observation_id text,p_source_id text,p_sequence bigint,p_content_hash text,p_state text,
  p_observed_at timestamptz,p_effective_at timestamptz,p_ingested_at timestamptz,
  p_supersedes_observation_id text,p_reason text,p_provider_revision_id text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); s public.command_center_source_registry%rowtype; prior public.command_center_source_observations%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.command_center_source_registry where owner_id=u and source_id=btrim(p_source_id) for update;
  if not found then raise exception 'Source not found'; end if;
  select * into prior from public.command_center_source_observations where owner_id=u and source_id=s.source_id order by sequence desc limit 1 for update;
  if not found then
    if p_sequence<>1 or p_supersedes_observation_id is not null then raise exception 'First source observation must start at sequence 1 without supersedes'; end if;
  else
    if p_sequence<>prior.sequence+1 then raise exception 'Source observation sequence gap'; end if;
    if p_supersedes_observation_id is distinct from prior.observation_id then raise exception 'Source observation must explicitly supersede latest observation'; end if;
    if prior.state in ('current','corrected') then
      update public.command_center_source_observations set state='superseded' where owner_id=u and observation_id=prior.observation_id;
    end if;
    update public.command_center_derived_records d
      set state=case when d.legal_hold then 'restricted' else 'deleted' end,
          restriction_reason=case when d.legal_hold then 'legal_hold:upstream_superseded:'||p_state else 'upstream_superseded:'||p_state end,
          updated_at=p_ingested_at
      where d.owner_id=u and d.state<>'deleted'
        and exists(select 1 from public.command_center_derived_provenance dp where dp.owner_id=u and dp.derived_id=d.derived_id and dp.observation_id=prior.observation_id);
  end if;
  insert into public.command_center_source_observations(owner_id,observation_id,source_id,sequence,content_hash,state,observed_at,effective_at,ingested_at,supersedes_observation_id,reason,provider_revision_id)
  values(u,btrim(p_observation_id),s.source_id,p_sequence,lower(p_content_hash),p_state,p_observed_at,p_effective_at,p_ingested_at,nullif(btrim(coalesce(p_supersedes_observation_id,'')),''),nullif(btrim(coalesce(p_reason,'')),''),nullif(btrim(coalesce(p_provider_revision_id,'')),''));
  if p_state='tombstone' then update public.command_center_source_registry set lifecycle='tombstoned',updated_at=p_ingested_at where owner_id=u and source_id=s.source_id; end if;
  return jsonb_build_object('observation_id',btrim(p_observation_id),'source_id',s.source_id,'sequence',p_sequence,'state',p_state,'current_truth',p_state in ('current','corrected'));
end $$;

create or replace function public.command_center_source_register_derived(
  p_derived_id text,p_company_id text,p_project_id text,p_purpose text,p_retention_class text,p_legal_hold boolean,p_provenance jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r jsonb; o public.command_center_source_observations%rowtype; s public.command_center_source_registry%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if jsonb_typeof(coalesce(p_provenance,'null'::jsonb))<>'array' or jsonb_array_length(p_provenance)=0 then raise exception 'Derived record requires provenance references'; end if;
  if exists(select 1 from (select x->>'observation_id' observation_id,count(*) n from jsonb_array_elements(p_provenance) x group by 1 having count(*)>1) d) then raise exception 'Derived provenance references must be unique'; end if;
  insert into public.command_center_derived_records(owner_id,derived_id,company_id,project_id,purpose,retention_class,state,legal_hold)
  values(u,btrim(p_derived_id),nullif(btrim(coalesce(p_company_id,'')),''),nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_purpose),btrim(p_retention_class),'active',coalesce(p_legal_hold,false));
  for r in select value from jsonb_array_elements(p_provenance) loop
    select * into o from public.command_center_source_observations where owner_id=u and observation_id=r->>'observation_id' and source_id=r->>'source_id' and content_hash=lower(r->>'content_hash');
    if not found or o.state not in ('current','corrected') then raise exception 'Derived provenance must reference current/corrected source truth'; end if;
    select * into s from public.command_center_source_registry where owner_id=u and source_id=o.source_id;
    if (s.company_id is not null and s.company_id is distinct from nullif(btrim(coalesce(p_company_id,'')),'')) or (s.project_id is not null and s.project_id is distinct from nullif(btrim(coalesce(p_project_id,'')),'')) then raise exception 'Derived provenance scope mismatch'; end if;
    insert into public.command_center_derived_provenance(owner_id,derived_id,observation_id,source_id,content_hash)
    values(u,btrim(p_derived_id),o.observation_id,o.source_id,o.content_hash);
  end loop;
  return jsonb_build_object('derived_id',btrim(p_derived_id),'state','active','provenance_count',jsonb_array_length(p_provenance));
exception when others then
  delete from public.command_center_derived_records where owner_id=u and derived_id=btrim(p_derived_id);
  raise;
end $$;

create or replace function public.command_center_provider_record_capability_snapshot(
  p_snapshot_id text,p_provider_key text,p_observed_at timestamptz,p_api_version text,p_model_version text,
  p_schema_fingerprint text,p_capability_fingerprint text,p_capabilities text[],p_enumeration jsonb,
  p_callbacks text,p_pricing text,p_verification text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); prior public.command_center_provider_capability_snapshots%rowtype; v_drift text:='compatible';
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'Provider capabilities');
  perform command_center_private.c3_source_validate_enumeration(p_enumeration);
  if not exists(select 1 from public.command_center_provider_registry where owner_id=u and provider_key=btrim(p_provider_key)) then raise exception 'Provider not registered'; end if;
  select * into prior from public.command_center_provider_capability_snapshots where owner_id=u and provider_key=btrim(p_provider_key) order by observed_at desc,recorded_at desc limit 1 for update;
  if p_pricing='unknown' then
    v_drift:='pricing_unknown';
  elsif found then
    if exists(select 1 from unnest(prior.capabilities) c where not (c=any(coalesce(p_capabilities,'{}'::text[]))))
       or exists(select 1 from jsonb_each_text(prior.enumeration) e where e.value='verified_supported' and coalesce(p_enumeration->>e.key,'unverified')<>'verified_supported') then
      v_drift:='breaking';
    elsif prior.schema_fingerprint is distinct from p_schema_fingerprint
       or prior.capability_fingerprint is distinct from p_capability_fingerprint
       or prior.api_version is distinct from nullif(btrim(coalesce(p_api_version,'')),'')
       or prior.model_version is distinct from nullif(btrim(coalesce(p_model_version,'')),'')
       or prior.pricing is distinct from p_pricing then
      v_drift:='compatible';
    else
      v_drift:='none';
    end if;
  end if;
  insert into public.command_center_provider_capability_snapshots(owner_id,snapshot_id,provider_key,observed_at,api_version,model_version,schema_fingerprint,capability_fingerprint,capabilities,enumeration,callbacks,pricing,verification,drift)
  values(u,btrim(p_snapshot_id),btrim(p_provider_key),p_observed_at,nullif(btrim(coalesce(p_api_version,'')),''),nullif(btrim(coalesce(p_model_version,'')),''),btrim(p_schema_fingerprint),btrim(p_capability_fingerprint),coalesce(p_capabilities,'{}'::text[]),p_enumeration,p_callbacks,p_pricing,p_verification,v_drift);
  return jsonb_build_object('snapshot_id',btrim(p_snapshot_id),'provider_key',btrim(p_provider_key),'drift',v_drift,'safe_for_automatic_reuse',v_drift in ('none','compatible'));
end $$;

create or replace function public.command_center_source_acquire_refresh_lease(
  p_source_id text,p_holder_id text,p_acquired_at timestamptz,p_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); l public.command_center_source_refresh_leases%rowtype; v_generation bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_holder_id),'')='' or p_expires_at<=p_acquired_at then raise exception 'Invalid refresh lease'; end if;
  if not exists(select 1 from public.command_center_source_registry where owner_id=u and source_id=btrim(p_source_id)) then raise exception 'Source not found'; end if;
  insert into public.command_center_source_refresh_leases(owner_id,source_id,generation) values(u,btrim(p_source_id),0) on conflict(owner_id,source_id) do nothing;
  select * into l from public.command_center_source_refresh_leases where owner_id=u and source_id=btrim(p_source_id) for update;
  if l.holder_id is not null and l.expires_at>p_acquired_at then raise exception 'Source refresh already leased'; end if;
  v_generation:=l.generation+1;
  update public.command_center_source_refresh_leases set generation=v_generation,holder_id=btrim(p_holder_id),acquired_at=p_acquired_at,expires_at=p_expires_at,updated_at=now() where owner_id=u and source_id=l.source_id;
  return jsonb_build_object('source_id',l.source_id,'holder_id',btrim(p_holder_id),'generation',v_generation,'expires_at',p_expires_at);
end $$;

create or replace function public.command_center_source_commit_refresh_checkpoint(
  p_source_id text,p_holder_id text,p_generation bigint,p_checkpoint_ref text,p_classification text,
  p_content_hash text,p_provider_revision_id text,p_provider_updated_at timestamptz,p_message_count bigint,p_byte_size bigint,
  p_checked_at timestamptz,p_successful boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); l public.command_center_source_refresh_leases%rowtype; c public.command_center_source_refresh_checkpoints%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.command_center_source_refresh_checkpoints where owner_id=u and source_id=btrim(p_source_id) for update;
  if found and c.generation=p_generation then
    if c.checkpoint_ref=btrim(p_checkpoint_ref) and c.classification=p_classification
       and c.content_hash is not distinct from nullif(lower(btrim(coalesce(p_content_hash,''))),'')
       and c.provider_revision_id is not distinct from nullif(btrim(coalesce(p_provider_revision_id,'')),'')
       and c.provider_updated_at is not distinct from p_provider_updated_at
       and c.message_count is not distinct from p_message_count and c.byte_size is not distinct from p_byte_size
       and c.checked_at=p_checked_at and c.successful=p_successful then
      return jsonb_build_object('source_id',c.source_id,'generation',c.generation,'checkpoint_ref',c.checkpoint_ref,'duplicate_commit',true);
    end if;
    raise exception 'Refresh generation already committed with different checkpoint';
  end if;
  if found and c.generation>p_generation then raise exception 'Stale refresh generation rejected'; end if;
  select * into l from public.command_center_source_refresh_leases where owner_id=u and source_id=btrim(p_source_id) for update;
  if not found or l.holder_id is distinct from btrim(p_holder_id) or l.generation<>p_generation then raise exception 'Stale refresh generation rejected'; end if;
  if p_checked_at>=l.expires_at then raise exception 'Expired refresh lease cannot commit'; end if;
  insert into public.command_center_source_refresh_checkpoints(owner_id,source_id,generation,checkpoint_ref,classification,content_hash,provider_revision_id,provider_updated_at,message_count,byte_size,checked_at,successful)
  values(u,l.source_id,p_generation,btrim(p_checkpoint_ref),p_classification,nullif(lower(btrim(coalesce(p_content_hash,''))),''),nullif(btrim(coalesce(p_provider_revision_id,'')),''),p_provider_updated_at,p_message_count,p_byte_size,p_checked_at,p_successful)
  on conflict(owner_id,source_id) do update set generation=excluded.generation,checkpoint_ref=excluded.checkpoint_ref,classification=excluded.classification,content_hash=excluded.content_hash,provider_revision_id=excluded.provider_revision_id,provider_updated_at=excluded.provider_updated_at,message_count=excluded.message_count,byte_size=excluded.byte_size,checked_at=excluded.checked_at,successful=excluded.successful,recorded_at=now();
  update public.command_center_source_refresh_leases set holder_id=null,acquired_at=null,expires_at=null,updated_at=now() where owner_id=u and source_id=l.source_id and generation=p_generation;
  return jsonb_build_object('source_id',l.source_id,'generation',p_generation,'checkpoint_ref',btrim(p_checkpoint_ref),'duplicate_commit',false);
end $$;

create or replace function public.command_center_source_record_refresh_coverage(
  p_run_id uuid,p_provider_key text,p_company_id text,p_project_id text,p_account_id text,p_environment text,
  p_started_at timestamptz,p_completed_at timestamptz,p_enumeration_complete boolean,p_expected_count bigint,p_items jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); prior public.command_center_source_refresh_runs%rowtype; v_readable bigint; v_unreadable bigint; v_tombstones bigint; v_total bigint; v_unaccounted bigint; v_complete boolean; item jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into prior from public.command_center_source_refresh_runs where owner_id=u and run_id=p_run_id;
  if found then return jsonb_build_object('run_id',prior.run_id,'complete',prior.complete,'readable',prior.readable_count,'unreadable',prior.unreadable_count,'tombstones',prior.tombstone_count,'unaccounted',prior.unaccounted_count,'duplicate_run',true); end if;
  if jsonb_typeof(coalesce(p_items,'null'::jsonb))<>'array' or p_expected_count<0 or p_completed_at<p_started_at then raise exception 'Invalid refresh coverage envelope'; end if;
  if not exists(select 1 from public.command_center_provider_registry where owner_id=u and provider_key=btrim(p_provider_key)) then raise exception 'Provider not registered'; end if;
  if exists(select 1 from jsonb_array_elements(p_items) x where coalesce(btrim(x->>'stable_id'),'')='' or (x->>'state') not in ('readable','unreadable','tombstone') or ((x->>'state') in ('unreadable','tombstone') and coalesce(btrim(x->>'reason'),'')='')) then raise exception 'Refresh inventory item is invalid'; end if;
  if exists(select 1 from (select x->>'stable_id' stable_id,count(*) n from jsonb_array_elements(p_items) x group by 1 having count(*)>1) d) then raise exception 'Refresh inventory stable ids must be unique'; end if;
  select count(*) filter(where x->>'state'='readable'),count(*) filter(where x->>'state'='unreadable'),count(*) filter(where x->>'state'='tombstone'),count(*)
    into v_readable,v_unreadable,v_tombstones,v_total from jsonb_array_elements(p_items) x;
  v_unaccounted:=greatest(0,p_expected_count-v_total);
  v_complete:=coalesce(p_enumeration_complete,false) and v_unaccounted=0;
  insert into public.command_center_source_refresh_runs(owner_id,run_id,provider_key,company_id,project_id,account_id,environment,started_at,completed_at,enumeration_complete,expected_count,readable_count,unreadable_count,tombstone_count,unaccounted_count,complete)
  values(u,p_run_id,btrim(p_provider_key),nullif(btrim(coalesce(p_company_id,'')),''),nullif(btrim(coalesce(p_project_id,'')),''),nullif(btrim(coalesce(p_account_id,'')),''),nullif(btrim(coalesce(p_environment,'')),''),p_started_at,p_completed_at,coalesce(p_enumeration_complete,false),p_expected_count,v_readable,v_unreadable,v_tombstones,v_unaccounted,v_complete);
  for item in select value from jsonb_array_elements(p_items) loop
    insert into public.command_center_source_refresh_inventory(owner_id,run_id,external_stable_id,state,reason)
    values(u,p_run_id,btrim(item->>'stable_id'),item->>'state',nullif(btrim(coalesce(item->>'reason','')),''));
  end loop;
  return jsonb_build_object('run_id',p_run_id,'complete',v_complete,'readable',v_readable,'unreadable',v_unreadable,'tombstones',v_tombstones,'unaccounted',v_unaccounted,'duplicate_run',false);
end $$;

revoke all on function public.command_center_source_register(text,text,text,text,text,text,text,text,text,text,text,text[],text,text,text) from public,anon;
revoke all on function public.command_center_source_replace_metadata(text,bigint,text,text,text,text[],text,text,text) from public,anon;
revoke all on function public.command_center_source_append_observation(text,text,bigint,text,text,timestamptz,timestamptz,timestamptz,text,text,text) from public,anon;
revoke all on function public.command_center_source_register_derived(text,text,text,text,text,boolean,jsonb) from public,anon;
revoke all on function public.command_center_provider_record_capability_snapshot(text,text,timestamptz,text,text,text,text,text[],jsonb,text,text,text) from public,anon;
revoke all on function public.command_center_source_acquire_refresh_lease(text,text,timestamptz,timestamptz) from public,anon;
revoke all on function public.command_center_source_commit_refresh_checkpoint(text,text,bigint,text,text,text,text,timestamptz,bigint,bigint,timestamptz,boolean) from public,anon;
revoke all on function public.command_center_source_record_refresh_coverage(uuid,text,text,text,text,text,timestamptz,timestamptz,boolean,bigint,jsonb) from public,anon;

grant execute on function public.command_center_source_register(text,text,text,text,text,text,text,text,text,text,text,text[],text,text,text) to authenticated;
grant execute on function public.command_center_source_replace_metadata(text,bigint,text,text,text,text[],text,text,text) to authenticated;
grant execute on function public.command_center_source_append_observation(text,text,bigint,text,text,timestamptz,timestamptz,timestamptz,text,text,text) to authenticated;
grant execute on function public.command_center_source_register_derived(text,text,text,text,text,boolean,jsonb) to authenticated;
grant execute on function public.command_center_provider_record_capability_snapshot(text,text,timestamptz,text,text,text,text,text[],jsonb,text,text,text) to authenticated;
grant execute on function public.command_center_source_acquire_refresh_lease(text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.command_center_source_commit_refresh_checkpoint(text,text,bigint,text,text,text,text,timestamptz,bigint,bigint,timestamptz,boolean) to authenticated;
grant execute on function public.command_center_source_record_refresh_coverage(uuid,text,text,text,text,text,timestamptz,timestamptz,boolean,bigint,jsonb) to authenticated;
