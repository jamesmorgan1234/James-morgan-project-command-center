-- Category 6 / P6.2 — durable scoped Brain memory with provenance, contradiction and supersession history.
-- Branch-only migration. No production state is changed by committing this file.
-- Secret values are never stored in Brain memory; only safe summaries/references/hashes are permitted.

create table if not exists public.command_center_brain_memories (
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid primary key default gen_random_uuid(),
  project_id text,
  canonical_entity_id text,
  kind text not null check (kind in ('fact','decision','preference','constraint','instruction','unknown','observation','precedent')),
  scope text not null check (scope in ('owner','project')),
  sensitivity text not null check (sensitivity in ('public','private','protected')),
  trust_state text not null check (trust_state in ('verified','observed','inferred','disputed','retracted')),
  summary text not null,
  content_ref text not null,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  confidence numeric(6,5) not null check (confidence>=0 and confidence<=1),
  provenance_refs text[] not null,
  evidence_refs text[] not null,
  observed_at timestamptz not null,
  valid_from timestamptz,
  valid_until timestamptz,
  contradiction_group text,
  superseded_by uuid,
  superseded_at timestamptz,
  retracted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  foreign key(owner_id,canonical_entity_id) references public.command_center_canonical_entities(owner_id,entity_id) on delete restrict,
  foreign key(superseded_by) references public.command_center_brain_memories(memory_id) on delete restrict,
  check ((scope='owner' and project_id is null) or (scope='project' and project_id is not null)),
  check (length(btrim(summary)) between 1 and 2000),
  check (length(btrim(content_ref)) between 1 and 1000),
  check (cardinality(provenance_refs)>0),
  check (cardinality(evidence_refs)>0),
  check (valid_until is null or valid_from is null or valid_until>=valid_from),
  check ((superseded_by is null and superseded_at is null) or (superseded_by is not null and superseded_at is not null)),
  check (retracted_at is null or trust_state='retracted')
);
create index if not exists command_center_brain_memory_scope_idx
  on public.command_center_brain_memories(owner_id,scope,project_id,kind,observed_at desc,memory_id);
create index if not exists command_center_brain_memory_active_idx
  on public.command_center_brain_memories(owner_id,project_id,observed_at desc)
  where superseded_by is null and retracted_at is null;
create index if not exists command_center_brain_memory_contradiction_idx
  on public.command_center_brain_memories(owner_id,contradiction_group,observed_at desc)
  where contradiction_group is not null;

create table if not exists public.command_center_brain_memory_relations (
  relation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  from_memory_id uuid not null references public.command_center_brain_memories(memory_id) on delete cascade,
  to_memory_id uuid not null references public.command_center_brain_memories(memory_id) on delete restrict,
  relation_type text not null check (relation_type in ('supports','contradicts','supersedes','derived_from','clarifies')),
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  unique(owner_id,from_memory_id,to_memory_id,relation_type),
  check (from_memory_id<>to_memory_id),
  check (cardinality(evidence_refs)>0)
);
create index if not exists command_center_brain_memory_relations_from_idx
  on public.command_center_brain_memory_relations(owner_id,from_memory_id,relation_type);

-- Browser roles inspect memory/evidence but do not directly mutate it.
do $$
declare t text;
begin
  foreach t in array array['command_center_brain_memories','command_center_brain_memory_relations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c6_assert_safe_memory_summary(p_summary text,p_content_ref text)
returns void language plpgsql immutable set search_path='' as $$
begin
  if coalesce(btrim(p_summary),'')='' or coalesce(btrim(p_content_ref),'')='' then raise exception 'Brain memory summary and content reference are required'; end if;
  -- Reject common raw credential/token shapes. Brain stores references and safe summaries, never credential values.
  if p_summary ~* '(sk-[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|service[_-]?role[^ ]{0,20}[=:][^ ]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)' then
    raise exception 'Raw secret material is forbidden in Brain memory';
  end if;
  if p_content_ref ~* '(token=|password=|secret=|apikey=|api_key=)' then raise exception 'Secret-bearing URL/reference is forbidden in Brain memory'; end if;
end $$;
revoke all on function command_center_private.c6_assert_safe_memory_summary(text,text) from public,anon,authenticated;

create or replace function public.command_center_brain_record_memory(
  p_project_id text,
  p_canonical_entity_id text,
  p_kind text,
  p_scope text,
  p_sensitivity text,
  p_trust_state text,
  p_summary text,
  p_content_ref text,
  p_content_hash text,
  p_confidence numeric,
  p_provenance_refs text[],
  p_evidence_refs text[],
  p_observed_at timestamptz,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_contradiction_group text,
  p_contradicts_memory_ids uuid[]
)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; v_project text:=nullif(btrim(coalesce(p_project_id,'')),''); other uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c6_assert_safe_memory_summary(p_summary,p_content_ref);
  if p_kind not in ('fact','decision','preference','constraint','instruction','unknown','observation','precedent') then raise exception 'Invalid Brain memory kind'; end if;
  if p_scope not in ('owner','project') then raise exception 'Invalid Brain memory scope'; end if;
  if p_sensitivity not in ('public','private','protected') then raise exception 'Invalid Brain memory sensitivity'; end if;
  if p_trust_state not in ('verified','observed','inferred','disputed','retracted') then raise exception 'Invalid Brain memory trust state'; end if;
  if p_scope='project' and (v_project is null or not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project)) then raise exception 'Project-scoped memory requires a valid project'; end if;
  if p_scope='owner' and v_project is not null then raise exception 'Owner-scoped memory cannot carry project scope'; end if;
  if nullif(btrim(coalesce(p_canonical_entity_id,'')),'') is not null and not exists(select 1 from public.command_center_canonical_entities where owner_id=u and entity_id=btrim(p_canonical_entity_id)) then raise exception 'Canonical entity reference not found'; end if;
  if coalesce(p_content_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Brain memory content hash must be SHA-256 hex'; end if;
  if p_confidence<0 or p_confidence>1 then raise exception 'Invalid Brain memory confidence'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_provenance_refs,'Brain memory provenance');
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Brain memory evidence');
  if cardinality(coalesce(p_provenance_refs,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Brain memory requires provenance and evidence'; end if;

  insert into public.command_center_brain_memories(owner_id,project_id,canonical_entity_id,kind,scope,sensitivity,trust_state,summary,content_ref,content_hash,confidence,provenance_refs,evidence_refs,observed_at,valid_from,valid_until,contradiction_group,retracted_at)
  values(u,v_project,nullif(btrim(coalesce(p_canonical_entity_id,'')),''),p_kind,p_scope,p_sensitivity,p_trust_state,btrim(p_summary),btrim(p_content_ref),p_content_hash,p_confidence,p_provenance_refs,p_evidence_refs,p_observed_at,p_valid_from,p_valid_until,nullif(btrim(coalesce(p_contradiction_group,'')),''),case when p_trust_state='retracted' then now() else null end)
  returning memory_id into v_id;

  foreach other in array coalesce(p_contradicts_memory_ids,'{}'::uuid[]) loop
    if not exists(select 1 from public.command_center_brain_memories where owner_id=u and memory_id=other and scope=p_scope and coalesce(project_id,'')=coalesce(v_project,'')) then raise exception 'Contradiction target must exist in the same owner/project scope'; end if;
    insert into public.command_center_brain_memory_relations(owner_id,from_memory_id,to_memory_id,relation_type,evidence_refs)
    values(u,v_id,other,'contradicts',p_evidence_refs);
  end loop;
  return v_id;
end $$;

create or replace function public.command_center_brain_supersede_memory(
  p_old_memory_id uuid,
  p_new_memory_id uuid,
  p_evidence_refs text[],
  p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); oldm public.command_center_brain_memories%rowtype; newm public.command_center_brain_memories%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_old_memory_id=p_new_memory_id then raise exception 'Memory cannot supersede itself'; end if;
  select * into oldm from public.command_center_brain_memories where owner_id=u and memory_id=p_old_memory_id for update;
  select * into newm from public.command_center_brain_memories where owner_id=u and memory_id=p_new_memory_id;
  if oldm.memory_id is null or newm.memory_id is null then raise exception 'Memory not found'; end if;
  if oldm.scope<>newm.scope or coalesce(oldm.project_id,'')<>coalesce(newm.project_id,'') then raise exception 'Supersession must remain in the same memory scope'; end if;
  if oldm.superseded_by is not null then raise exception 'Memory is already superseded'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Brain supersession evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Supersession requires evidence'; end if;
  update public.command_center_brain_memories set superseded_by=newm.memory_id,superseded_at=p_occurred_at where owner_id=u and memory_id=oldm.memory_id;
  insert into public.command_center_brain_memory_relations(owner_id,from_memory_id,to_memory_id,relation_type,evidence_refs)
  values(u,newm.memory_id,oldm.memory_id,'supersedes',p_evidence_refs);
  return jsonb_build_object('old_memory_id',oldm.memory_id,'new_memory_id',newm.memory_id,'superseded_at',p_occurred_at);
end $$;

revoke all on function public.command_center_brain_record_memory(text,text,text,text,text,text,text,text,text,numeric,text[],text[],timestamptz,timestamptz,timestamptz,text,uuid[]) from public,anon;
revoke all on function public.command_center_brain_supersede_memory(uuid,uuid,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_memory(text,text,text,text,text,text,text,text,text,numeric,text[],text[],timestamptz,timestamptz,timestamptz,text,uuid[]) to authenticated;
grant execute on function public.command_center_brain_supersede_memory(uuid,uuid,text[],timestamptz) to authenticated;
