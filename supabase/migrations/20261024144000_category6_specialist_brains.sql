-- Category 6 / P6.6 — durable specialist Brain registry and reusable verified patterns.
-- Branch-only migration. Specialist scope never grants broader project/account authority.

create table if not exists public.command_center_specialist_brains (
  owner_id uuid not null references auth.users(id) on delete cascade,
  brain_key text not null,
  version bigint not null check (version >= 1),
  scope text not null check (scope in ('meta','project','business','books','finance','personal','custom')),
  project_id text,
  capabilities text[] not null,
  allowed_memory_kinds text[] not null,
  enabled boolean not null default true,
  configuration_ref text,
  provenance_refs text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,brain_key),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (brain_key ~ '^brain:[a-z0-9][a-z0-9._:-]{0,160}$'),
  check (cardinality(capabilities)>0),
  check (cardinality(allowed_memory_kinds)>0),
  check (cardinality(provenance_refs)>0),
  check ((scope='project' and project_id is not null) or (scope<>'project')),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_brain_shared_patterns (
  owner_id uuid not null references auth.users(id) on delete cascade,
  pattern_id text not null,
  version bigint not null check (version >= 1),
  title text not null check (length(btrim(title)) between 1 and 500),
  applicable_scopes text[] not null,
  content_ref text not null check (length(btrim(content_ref)) between 1 and 1000),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  confidence numeric(6,5) not null check (confidence between 0 and 1),
  verification_state text not null check (verification_state in ('verified','owner_approved','experimental')),
  provenance_refs text[] not null,
  evidence_refs text[] not null,
  deprecated_at timestamptz,
  replacement_pattern_id text,
  created_at timestamptz not null default now(),
  primary key(owner_id,pattern_id),
  check (cardinality(applicable_scopes)>0),
  check (cardinality(provenance_refs)>0),
  check (cardinality(evidence_refs)>0),
  check (replacement_pattern_id is null or replacement_pattern_id<>pattern_id)
);

create table if not exists public.command_center_brain_shared_pattern_versions (
  version_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pattern_id text not null,
  version bigint not null check (version>=1),
  applicable_scopes text[] not null,
  content_ref text not null,
  content_hash text not null,
  confidence numeric(6,5) not null,
  verification_state text not null,
  deprecated_at timestamptz,
  replacement_pattern_id text,
  source_ref text not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,pattern_id,version),
  foreign key(owner_id,pattern_id) references public.command_center_brain_shared_patterns(owner_id,pattern_id) on delete cascade
);

-- Owner-readable registry; mutation only through scoped RPCs.
do $$
declare t text;
begin
  foreach t in array array['command_center_specialist_brains','command_center_brain_shared_patterns','command_center_brain_shared_pattern_versions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_register_specialist(
  p_brain_key text,p_scope text,p_project_id text,p_capabilities text[],p_allowed_memory_kinds text[],p_configuration_ref text,p_provenance_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_project text:=nullif(btrim(coalesce(p_project_id,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_brain_key),'') !~ '^brain:[a-z0-9][a-z0-9._:-]{0,160}$' then raise exception 'Invalid specialist Brain key'; end if;
  if p_scope not in ('meta','project','business','books','finance','personal','custom') then raise exception 'Invalid specialist Brain scope'; end if;
  if p_scope='project' and (v_project is null or not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project)) then raise exception 'Project Brain requires valid owner project'; end if;
  if p_scope<>'project' and v_project is not null then raise exception 'Non-project specialist cannot silently bind project scope'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'Specialist capabilities');
  perform command_center_private.c3_assert_unique_text_array(p_allowed_memory_kinds,'Specialist memory kinds');
  perform command_center_private.c3_assert_unique_text_array(p_provenance_refs,'Specialist provenance');
  if cardinality(coalesce(p_capabilities,'{}'::text[]))=0 or cardinality(coalesce(p_allowed_memory_kinds,'{}'::text[]))=0 or cardinality(coalesce(p_provenance_refs,'{}'::text[]))=0 then raise exception 'Specialist Brain requires capabilities, memory boundaries and provenance'; end if;
  insert into public.command_center_specialist_brains(owner_id,brain_key,version,scope,project_id,capabilities,allowed_memory_kinds,configuration_ref,provenance_refs)
  values(u,btrim(p_brain_key),1,p_scope,v_project,p_capabilities,p_allowed_memory_kinds,nullif(btrim(coalesce(p_configuration_ref,'')),''),p_provenance_refs);
  return jsonb_build_object('brain_key',btrim(p_brain_key),'version',1,'scope',p_scope,'project_id',v_project);
end $$;

create or replace function public.command_center_brain_register_shared_pattern(
  p_pattern_id text,p_title text,p_applicable_scopes text[],p_content_ref text,p_content_hash text,p_confidence numeric,p_verification_state text,p_provenance_refs text[],p_evidence_refs text[],p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_pattern_id),'')='' or coalesce(btrim(p_title),'')='' or coalesce(btrim(p_content_ref),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Shared pattern identity/content/source required'; end if;
  if coalesce(p_content_hash,'') !~ '^[a-f0-9]{64}$' or p_confidence<0 or p_confidence>1 or p_verification_state not in ('verified','owner_approved','experimental') then raise exception 'Invalid shared pattern verification envelope'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_applicable_scopes,'Pattern scopes');
  perform command_center_private.c3_assert_unique_text_array(p_provenance_refs,'Pattern provenance');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Pattern evidence');
  if cardinality(coalesce(p_applicable_scopes,'{}'::text[]))=0 or cardinality(coalesce(p_provenance_refs,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Shared pattern requires scope, provenance and evidence'; end if;
  insert into public.command_center_brain_shared_patterns(owner_id,pattern_id,version,title,applicable_scopes,content_ref,content_hash,confidence,verification_state,provenance_refs,evidence_refs)
  values(u,btrim(p_pattern_id),1,btrim(p_title),p_applicable_scopes,btrim(p_content_ref),p_content_hash,p_confidence,p_verification_state,p_provenance_refs,p_evidence_refs);
  insert into public.command_center_brain_shared_pattern_versions(owner_id,pattern_id,version,applicable_scopes,content_ref,content_hash,confidence,verification_state,source_ref)
  values(u,btrim(p_pattern_id),1,p_applicable_scopes,btrim(p_content_ref),p_content_hash,p_confidence,p_verification_state,btrim(p_source_ref));
  return jsonb_build_object('pattern_id',btrim(p_pattern_id),'version',1);
end $$;

create or replace function public.command_center_brain_deprecate_shared_pattern(
  p_pattern_id text,p_expected_version bigint,p_replacement_pattern_id text,p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.command_center_brain_shared_patterns%rowtype; v_next bigint; v_replacement text:=nullif(btrim(coalesce(p_replacement_pattern_id,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into p from public.command_center_brain_shared_patterns where owner_id=u and pattern_id=btrim(p_pattern_id) for update;
  if not found then raise exception 'Shared pattern not found'; end if;
  if p.version<>p_expected_version then raise exception 'Shared pattern version conflict'; end if;
  if p.deprecated_at is not null then raise exception 'Shared pattern already deprecated'; end if;
  if v_replacement is not null and not exists(select 1 from public.command_center_brain_shared_patterns where owner_id=u and pattern_id=v_replacement and deprecated_at is null) then raise exception 'Replacement pattern must be active and owner-scoped'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Pattern deprecation requires source'; end if;
  v_next:=p.version+1;
  update public.command_center_brain_shared_patterns set version=v_next,deprecated_at=now(),replacement_pattern_id=v_replacement,updated_at=now() where owner_id=u and pattern_id=p.pattern_id;
  insert into public.command_center_brain_shared_pattern_versions(owner_id,pattern_id,version,applicable_scopes,content_ref,content_hash,confidence,verification_state,deprecated_at,replacement_pattern_id,source_ref)
  select owner_id,pattern_id,version,applicable_scopes,content_ref,content_hash,confidence,verification_state,deprecated_at,replacement_pattern_id,btrim(p_source_ref) from public.command_center_brain_shared_patterns where owner_id=u and pattern_id=p.pattern_id;
  return jsonb_build_object('pattern_id',p.pattern_id,'version',v_next,'deprecated',true,'replacement_pattern_id',v_replacement);
end $$;

revoke all on function public.command_center_brain_register_specialist(text,text,text,text[],text[],text,text[]) from public,anon;
revoke all on function public.command_center_brain_register_shared_pattern(text,text,text[],text,text,numeric,text,text[],text[],text) from public,anon;
revoke all on function public.command_center_brain_deprecate_shared_pattern(text,bigint,text,text) from public,anon;
grant execute on function public.command_center_brain_register_specialist(text,text,text,text[],text[],text,text[]) to authenticated;
grant execute on function public.command_center_brain_register_shared_pattern(text,text,text[],text,text,numeric,text,text[],text[],text) to authenticated;
grant execute on function public.command_center_brain_deprecate_shared_pattern(text,bigint,text,text) to authenticated;
