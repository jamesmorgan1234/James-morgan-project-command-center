-- Category 3 / P3.1-P3.5 — canonical persistence, provenance, assets, graph and provider registry.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_canonical_entities (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null,
  project_id text,
  entity_type text not null,
  version bigint not null default 1 check (version >= 1),
  schema_version integer not null default 1 check (schema_version >= 1),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key(owner_id,entity_id),
  check (length(btrim(entity_id)) between 1 and 240),
  check (length(btrim(entity_type)) between 1 and 120),
  check (updated_at >= created_at),
  check (deleted_at is null or deleted_at >= created_at)
);

create table if not exists public.command_center_canonical_entity_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  entity_id text not null,
  version bigint not null check (version >= 1),
  project_id text,
  entity_type text not null,
  schema_version integer not null check (schema_version >= 1),
  payload jsonb not null check (jsonb_typeof(payload)='object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  operation text not null check (operation in ('create','replace','tombstone')),
  source_ref text not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,entity_id,version),
  foreign key(owner_id,entity_id) references public.command_center_canonical_entities(owner_id,entity_id) on delete cascade,
  check (length(btrim(source_ref)) between 1 and 500)
);

create table if not exists public.command_center_knowledge_claims (
  owner_id uuid not null references auth.users(id) on delete cascade,
  claim_id text not null,
  project_id text,
  subject_id text not null,
  version bigint not null check (version >= 1),
  kind text not null check (kind in ('owner_stated','verified','calculated','inferred','generated','historical')),
  state text not null check (state in ('current','conflicting','superseded')),
  truth_state text not null check (truth_state in ('known','unknown','not_applicable')),
  value_jsonb jsonb,
  confidence numeric(6,5) not null check (confidence >= 0 and confidence <= 1),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  stale_after timestamptz,
  supersedes_claim_id text,
  primary key(owner_id,claim_id),
  check (length(btrim(subject_id)) between 1 and 240),
  check ((truth_state='known' and value_jsonb is not null) or (truth_state in ('unknown','not_applicable') and value_jsonb is null)),
  check (kind <> 'inferred' or confidence < 1),
  check (stale_after is null or stale_after >= observed_at),
  check (supersedes_claim_id is null or supersedes_claim_id <> claim_id)
);
create unique index if not exists command_center_knowledge_one_current_idx
  on public.command_center_knowledge_claims(owner_id,subject_id) where state='current';
create index if not exists command_center_knowledge_subject_history_idx
  on public.command_center_knowledge_claims(owner_id,subject_id,version desc,recorded_at desc);

create table if not exists public.command_center_assets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  project_id text,
  name text not null,
  sha256 text,
  version bigint not null default 1 check (version >= 1),
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected','secret')),
  original_state text not null check (original_state in ('available','missing','reconstruction')),
  approval_state text not null check (approval_state in ('unreviewed','approved','locked')),
  source_ref text not null,
  media_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,asset_id),
  check (length(btrim(name)) between 1 and 500),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  check (original_state <> 'available' or sha256 is not null),
  check (updated_at >= created_at)
);

create table if not exists public.command_center_asset_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  version bigint not null check (version >= 1),
  sha256 text,
  original_state text not null check (original_state in ('available','missing','reconstruction')),
  approval_state text not null check (approval_state in ('unreviewed','approved','locked')),
  source_ref text not null,
  owner_decision_ref text,
  recorded_at timestamptz not null default now(),
  unique(owner_id,asset_id,version),
  foreign key(owner_id,asset_id) references public.command_center_assets(owner_id,asset_id) on delete cascade,
  check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$')
);

create table if not exists public.command_center_graph_nodes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  node_id text not null,
  project_id text,
  node_type text not null check (node_type in ('project','business','person','account','book','provider','asset','rule','decision','task','metric','obligation','alias','release')),
  canonical_name text not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,node_id),
  check (length(btrim(canonical_name)) between 1 and 500)
);

create table if not exists public.command_center_graph_edges (
  owner_id uuid not null references auth.users(id) on delete cascade,
  edge_id text not null,
  from_node_id text not null,
  to_node_id text not null,
  relation text not null check (relation in ('owns','belongs_to','uses','depends_on','aliases','renamed_to','merged_into','supersedes','derived_from','references','produced_by')),
  version bigint not null default 1 check (version >= 1),
  source_ref text not null,
  effective_at timestamptz not null,
  superseded_at timestamptz,
  primary key(owner_id,edge_id),
  foreign key(owner_id,from_node_id) references public.command_center_graph_nodes(owner_id,node_id) on delete restrict,
  foreign key(owner_id,to_node_id) references public.command_center_graph_nodes(owner_id,node_id) on delete restrict,
  check (from_node_id <> to_node_id),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (superseded_at is null or superseded_at >= effective_at)
);
create index if not exists command_center_graph_from_idx on public.command_center_graph_edges(owner_id,from_node_id) where superseded_at is null;
create index if not exists command_center_graph_to_idx on public.command_center_graph_edges(owner_id,to_node_id) where superseded_at is null;
create unique index if not exists command_center_graph_active_alias_idx on public.command_center_graph_edges(owner_id,from_node_id) where relation='aliases' and superseded_at is null;

create table if not exists public.command_center_provider_registry (
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_key text not null,
  version bigint not null check (version >= 1),
  enabled boolean not null default false,
  auth_mode text not null check (auth_mode in ('none','oauth','api_key_ref','session','passkey','custom_ref')),
  credential_reference_id text,
  capabilities text[] not null default '{}'::text[],
  scopes text[] not null default '{}'::text[],
  freshness_seconds integer not null default 0 check (freshness_seconds >= 0),
  cost text not null check (cost in ('free','paid','unknown')),
  health text not null check (health in ('available','degraded','unavailable','unconfigured')),
  verification text not null check (verification in ('none','source','tool_result','live_verified')),
  failure_mode text not null check (failure_mode in ('fail_closed','read_only','degraded')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,provider_key),
  check (provider_key ~ '^provider:[a-z0-9][a-z0-9._:-]{0,119}$'),
  check (credential_reference_id is null or credential_reference_id ~ '^(secret-ref|provider-ref):[A-Za-z0-9._:-]{1,200}$'),
  check (configuration::text !~* '"(secret|token|password|api[_-]?key|private[_-]?key|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret|webhook[_-]?secret)"[[:space:]]*:'),
  check (configuration::text !~* '(Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}|sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{20,})')
);

create table if not exists public.command_center_provider_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_key text not null,
  version bigint not null check (version >= 1),
  enabled boolean not null,
  health text not null,
  verification text not null,
  cost text not null,
  failure_mode text not null,
  recorded_at timestamptz not null default now(),
  source_ref text not null check (length(btrim(source_ref)) between 1 and 1000),
  unique(owner_id,provider_key,version),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete cascade
);

-- Owner read access only. All mutation is through narrow, authenticated, SECURITY DEFINER RPCs.
do $$
declare t text;
begin
  foreach t in array array[
    'command_center_canonical_entities','command_center_canonical_entity_versions','command_center_knowledge_claims',
    'command_center_assets','command_center_asset_versions','command_center_graph_nodes','command_center_graph_edges',
    'command_center_provider_registry','command_center_provider_versions'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c3_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c3_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c3_hash_json(p_payload jsonb)
returns text language sql immutable set search_path='' as $$
  select encode(extensions.digest(coalesce(p_payload,'{}'::jsonb)::text,'sha256'),'hex');
$$;
revoke all on function command_center_private.c3_hash_json(jsonb) from public,anon,authenticated;

create or replace function command_center_private.c3_assert_unique_text_array(p_values text[],p_label text)
returns void language plpgsql immutable set search_path='' as $$
begin
  if exists(select 1 from unnest(coalesce(p_values,'{}'::text[])) value group by value having count(*)>1) then
    raise exception '% entries must be unique',p_label;
  end if;
  if exists(select 1 from unnest(coalesce(p_values,'{}'::text[])) value where coalesce(btrim(value),'')='') then
    raise exception '% entries cannot be blank',p_label;
  end if;
end $$;
revoke all on function command_center_private.c3_assert_unique_text_array(text[],text) from public,anon,authenticated;

create or replace function public.command_center_canonical_create_entity(p_entity_id text,p_entity_type text,p_project_id text,p_schema_version integer,p_payload jsonb,p_source_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_hash text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_entity_id),'')='' or coalesce(btrim(p_entity_type),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Entity identity and provenance are required'; end if;
  if coalesce(p_schema_version,0)<1 or jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' then raise exception 'Invalid canonical schema/payload'; end if;
  v_hash:=command_center_private.c3_hash_json(p_payload);
  insert into public.command_center_canonical_entities(owner_id,entity_id,project_id,entity_type,version,schema_version,payload,content_hash)
  values(u,btrim(p_entity_id),nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_entity_type),1,p_schema_version,p_payload,v_hash);
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,btrim(p_entity_id),1,nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_entity_type),p_schema_version,p_payload,v_hash,'create',btrim(p_source_ref));
  return jsonb_build_object('entity_id',btrim(p_entity_id),'version',1,'content_hash',v_hash);
end $$;

create or replace function public.command_center_canonical_replace_entity(p_entity_id text,p_expected_version bigint,p_schema_version integer,p_payload jsonb,p_source_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_canonical_entities%rowtype; v_next bigint; v_hash text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=btrim(p_entity_id) for update;
  if not found then raise exception 'Canonical entity not found'; end if;
  if e.deleted_at is not null then raise exception 'Tombstoned canonical entity cannot be silently revived'; end if;
  if e.version<>p_expected_version then raise exception 'Canonical version conflict'; end if;
  if coalesce(p_schema_version,0)<1 or jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Invalid canonical replacement'; end if;
  v_next:=e.version+1; v_hash:=command_center_private.c3_hash_json(p_payload);
  update public.command_center_canonical_entities set version=v_next,schema_version=p_schema_version,payload=p_payload,content_hash=v_hash,updated_at=now() where owner_id=u and entity_id=e.entity_id;
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,e.entity_id,v_next,e.project_id,e.entity_type,p_schema_version,p_payload,v_hash,'replace',btrim(p_source_ref));
  return jsonb_build_object('entity_id',e.entity_id,'version',v_next,'content_hash',v_hash);
end $$;

create or replace function public.command_center_canonical_tombstone_entity(p_entity_id text,p_expected_version bigint,p_source_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_canonical_entities%rowtype; v_next bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.command_center_canonical_entities where owner_id=u and entity_id=btrim(p_entity_id) for update;
  if not found then raise exception 'Canonical entity not found'; end if;
  if e.version<>p_expected_version then raise exception 'Canonical version conflict'; end if;
  if e.deleted_at is not null then raise exception 'Canonical entity is already tombstoned'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Tombstone provenance is required'; end if;
  v_next:=e.version+1;
  update public.command_center_canonical_entities set version=v_next,updated_at=now(),deleted_at=now() where owner_id=u and entity_id=e.entity_id;
  insert into public.command_center_canonical_entity_versions(owner_id,entity_id,version,project_id,entity_type,schema_version,payload,content_hash,operation,source_ref)
  values(u,e.entity_id,v_next,e.project_id,e.entity_type,e.schema_version,e.payload,e.content_hash,'tombstone',btrim(p_source_ref));
  return jsonb_build_object('entity_id',e.entity_id,'version',v_next,'deleted',true);
end $$;

create or replace function public.command_center_append_knowledge_claim(p_claim_id text,p_project_id text,p_subject_id text,p_version bigint,p_kind text,p_state text,p_truth_state text,p_value_jsonb jsonb,p_confidence numeric,p_source_refs text[],p_observed_at timestamptz,p_stale_after timestamptz,p_supersedes_claim_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); current_claim public.command_center_knowledge_claims%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_claim_id),'')='' or coalesce(btrim(p_subject_id),'')='' or p_observed_at is null then raise exception 'Knowledge identity/time are required'; end if;
  if p_kind not in ('owner_stated','verified','calculated','inferred','generated','historical') or p_state not in ('current','conflicting','superseded') or p_truth_state not in ('known','unknown','not_applicable') then raise exception 'Invalid knowledge classification'; end if;
  if p_version<1 or p_confidence<0 or p_confidence>1 or (p_kind='inferred' and p_confidence=1) then raise exception 'Invalid knowledge version/confidence'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_source_refs,'source_refs');
  if coalesce(cardinality(p_source_refs),0)=0 then raise exception 'Knowledge provenance is required'; end if;
  if (p_truth_state='known' and p_value_jsonb is null) or (p_truth_state<>'known' and p_value_jsonb is not null) then raise exception 'Ambiguous knowledge truth state'; end if;
  if p_state='current' then
    select * into current_claim from public.command_center_knowledge_claims where owner_id=u and subject_id=btrim(p_subject_id) and state='current' for update;
    if found then
      if p_supersedes_claim_id is distinct from current_claim.claim_id or p_version<=current_claim.version then raise exception 'Current knowledge requires explicit advancing supersession'; end if;
      update public.command_center_knowledge_claims set state='superseded' where owner_id=u and claim_id=current_claim.claim_id;
    elsif p_supersedes_claim_id is not null then raise exception 'Superseded knowledge target not found'; end if;
  end if;
  insert into public.command_center_knowledge_claims(owner_id,claim_id,project_id,subject_id,version,kind,state,truth_state,value_jsonb,confidence,source_refs,observed_at,stale_after,supersedes_claim_id)
  values(u,btrim(p_claim_id),nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_subject_id),p_version,p_kind,p_state,p_truth_state,p_value_jsonb,p_confidence,p_source_refs,p_observed_at,p_stale_after,p_supersedes_claim_id);
  return jsonb_build_object('claim_id',btrim(p_claim_id),'state',p_state,'truth_state',p_truth_state);
end $$;

create or replace function public.command_center_register_asset(p_asset_id text,p_project_id text,p_name text,p_sha256 text,p_sensitivity text,p_original_state text,p_approval_state text,p_source_ref text,p_media_type text,p_byte_size bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  insert into public.command_center_assets(owner_id,asset_id,project_id,name,sha256,version,sensitivity,original_state,approval_state,source_ref,media_type,byte_size)
  values(u,btrim(p_asset_id),nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_name),nullif(lower(btrim(coalesce(p_sha256,''))),''),1,p_sensitivity,p_original_state,p_approval_state,btrim(p_source_ref),nullif(btrim(coalesce(p_media_type,'')),''),p_byte_size);
  insert into public.command_center_asset_versions(owner_id,asset_id,version,sha256,original_state,approval_state,source_ref)
  values(u,btrim(p_asset_id),1,nullif(lower(btrim(coalesce(p_sha256,''))),''),p_original_state,p_approval_state,btrim(p_source_ref));
  return jsonb_build_object('asset_id',btrim(p_asset_id),'version',1);
end $$;

create or replace function public.command_center_replace_asset(p_asset_id text,p_expected_version bigint,p_sha256 text,p_original_state text,p_approval_state text,p_source_ref text,p_owner_decision_ref text,p_authorization_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.command_center_assets%rowtype; v_next bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.command_center_assets where owner_id=u and asset_id=btrim(p_asset_id) for update;
  if not found then raise exception 'Asset not found'; end if;
  if a.version<>p_expected_version then raise exception 'Asset version conflict'; end if;
  if a.approval_state='locked' then
    if coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Locked asset replacement requires owner decision evidence'; end if;
    perform command_center_private.consume_action_authorization(u,p_authorization_id,'protected_asset.modify','protected_asset',a.asset_id);
  end if;
  v_next:=a.version+1;
  update public.command_center_assets set version=v_next,sha256=nullif(lower(btrim(coalesce(p_sha256,''))),''),original_state=p_original_state,approval_state=p_approval_state,source_ref=btrim(p_source_ref),updated_at=now() where owner_id=u and asset_id=a.asset_id;
  insert into public.command_center_asset_versions(owner_id,asset_id,version,sha256,original_state,approval_state,source_ref,owner_decision_ref)
  values(u,a.asset_id,v_next,nullif(lower(btrim(coalesce(p_sha256,''))),''),p_original_state,p_approval_state,btrim(p_source_ref),nullif(btrim(coalesce(p_owner_decision_ref,'')),''));
  return jsonb_build_object('asset_id',a.asset_id,'version',v_next);
end $$;

create or replace function public.command_center_graph_add_node(p_node_id text,p_project_id text,p_node_type text,p_canonical_name text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  insert into public.command_center_graph_nodes(owner_id,node_id,project_id,node_type,canonical_name)
  values(u,btrim(p_node_id),nullif(btrim(coalesce(p_project_id,'')),''),p_node_type,btrim(p_canonical_name));
  return jsonb_build_object('node_id',btrim(p_node_id));
end $$;

create or replace function public.command_center_graph_add_edge(p_edge_id text,p_from_node_id text,p_to_node_id text,p_relation text,p_source_ref text,p_effective_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  insert into public.command_center_graph_edges(owner_id,edge_id,from_node_id,to_node_id,relation,version,source_ref,effective_at)
  values(u,btrim(p_edge_id),btrim(p_from_node_id),btrim(p_to_node_id),p_relation,1,btrim(p_source_ref),p_effective_at);
  return jsonb_build_object('edge_id',btrim(p_edge_id),'version',1);
end $$;

create or replace function public.command_center_graph_supersede_edge(p_edge_id text,p_expected_version bigint,p_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_graph_edges%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.command_center_graph_edges where owner_id=u and edge_id=btrim(p_edge_id) for update;
  if not found then raise exception 'Graph edge not found'; end if;
  if e.version<>p_expected_version or e.superseded_at is not null then raise exception 'Graph edge version/state conflict'; end if;
  if p_at<e.effective_at then raise exception 'Graph supersession cannot predate effective time'; end if;
  update public.command_center_graph_edges set version=e.version+1,superseded_at=p_at where owner_id=u and edge_id=e.edge_id;
  return jsonb_build_object('edge_id',e.edge_id,'version',e.version+1,'superseded',true);
end $$;

create or replace function public.command_center_register_provider(p_provider_key text,p_version bigint,p_enabled boolean,p_auth_mode text,p_credential_reference_id text,p_capabilities text[],p_scopes text[],p_freshness_seconds integer,p_cost text,p_health text,p_verification text,p_failure_mode text,p_configuration jsonb,p_source_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_version<>1 or coalesce(btrim(p_source_ref),'')='' then raise exception 'New provider requires version 1 and provenance'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'capabilities');
  perform command_center_private.c3_assert_unique_text_array(p_scopes,'scopes');
  insert into public.command_center_provider_registry(owner_id,provider_key,version,enabled,auth_mode,credential_reference_id,capabilities,scopes,freshness_seconds,cost,health,verification,failure_mode,configuration)
  values(u,btrim(p_provider_key),p_version,p_enabled,p_auth_mode,nullif(btrim(coalesce(p_credential_reference_id,'')),''),coalesce(p_capabilities,'{}'::text[]),coalesce(p_scopes,'{}'::text[]),p_freshness_seconds,p_cost,p_health,p_verification,p_failure_mode,coalesce(p_configuration,'{}'::jsonb));
  insert into public.command_center_provider_versions(owner_id,provider_key,version,enabled,health,verification,cost,failure_mode,source_ref)
  values(u,btrim(p_provider_key),1,p_enabled,p_health,p_verification,p_cost,p_failure_mode,btrim(p_source_ref));
  return jsonb_build_object('provider_key',btrim(p_provider_key),'version',1);
end $$;

create or replace function public.command_center_replace_provider(p_provider_key text,p_expected_version bigint,p_enabled boolean,p_auth_mode text,p_credential_reference_id text,p_capabilities text[],p_scopes text[],p_freshness_seconds integer,p_cost text,p_health text,p_verification text,p_failure_mode text,p_configuration jsonb,p_source_ref text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.command_center_provider_registry%rowtype; v_next bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Provider replacement provenance is required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'capabilities');
  perform command_center_private.c3_assert_unique_text_array(p_scopes,'scopes');
  select * into p from public.command_center_provider_registry where owner_id=u and provider_key=btrim(p_provider_key) for update;
  if not found then raise exception 'Provider not found'; end if;
  if p.version<>p_expected_version then raise exception 'Provider version conflict'; end if;
  v_next:=p.version+1;
  update public.command_center_provider_registry set version=v_next,enabled=p_enabled,auth_mode=p_auth_mode,credential_reference_id=nullif(btrim(coalesce(p_credential_reference_id,'')),''),capabilities=coalesce(p_capabilities,'{}'::text[]),scopes=coalesce(p_scopes,'{}'::text[]),freshness_seconds=p_freshness_seconds,cost=p_cost,health=p_health,verification=p_verification,failure_mode=p_failure_mode,configuration=coalesce(p_configuration,'{}'::jsonb),updated_at=now() where owner_id=u and provider_key=p.provider_key;
  insert into public.command_center_provider_versions(owner_id,provider_key,version,enabled,health,verification,cost,failure_mode,source_ref)
  values(u,p.provider_key,v_next,p_enabled,p_health,p_verification,p_cost,p_failure_mode,btrim(p_source_ref));
  return jsonb_build_object('provider_key',p.provider_key,'version',v_next);
end $$;

-- Narrow RPC exposure; anon/public never gain execute through default function privileges.
do $$
declare r regprocedure;
begin
  foreach r in array array[
    'public.command_center_canonical_create_entity(text,text,text,integer,jsonb,text)'::regprocedure,
    'public.command_center_canonical_replace_entity(text,bigint,integer,jsonb,text)'::regprocedure,
    'public.command_center_canonical_tombstone_entity(text,bigint,text)'::regprocedure,
    'public.command_center_append_knowledge_claim(text,text,text,bigint,text,text,text,jsonb,numeric,text[],timestamptz,timestamptz,text)'::regprocedure,
    'public.command_center_register_asset(text,text,text,text,text,text,text,text,text,bigint)'::regprocedure,
    'public.command_center_replace_asset(text,bigint,text,text,text,text,text,uuid)'::regprocedure,
    'public.command_center_graph_add_node(text,text,text,text)'::regprocedure,
    'public.command_center_graph_add_edge(text,text,text,text,text,timestamptz)'::regprocedure,
    'public.command_center_graph_supersede_edge(text,bigint,timestamptz)'::regprocedure,
    'public.command_center_register_provider(text,bigint,boolean,text,text,text[],text[],integer,text,text,text,text,jsonb,text)'::regprocedure,
    'public.command_center_replace_provider(text,bigint,boolean,text,text,text[],text[],integer,text,text,text,text,jsonb,text)'::regprocedure
  ] loop
    execute format('revoke all on function %s from public, anon',r);
    execute format('grant execute on function %s to authenticated',r);
  end loop;
end $$;
