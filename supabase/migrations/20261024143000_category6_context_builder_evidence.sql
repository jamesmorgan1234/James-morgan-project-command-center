-- Category 6 / P6.4 — durable Brain Context Builder evidence over immutable Category 3 context snapshots.
-- Branch-only migration. Committing this file does not change production.

create table if not exists public.command_center_brain_context_builds (
  context_build_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  snapshot_id uuid not null references public.command_center_context_snapshots(id) on delete restrict,
  decision_id uuid references public.command_center_brain_decisions(decision_id) on delete set null,
  max_sensitivity text not null check (max_sensitivity in ('internal','sensitive','protected')),
  min_relevance numeric(6,5) not null check (min_relevance between 0 and 1),
  max_items integer not null check (max_items between 1 and 10000),
  selected_source_keys text[] not null,
  omitted_stale_keys text[] not null default '{}'::text[],
  omitted_scope_keys text[] not null default '{}'::text[],
  omitted_sensitivity_keys text[] not null default '{}'::text[],
  evidence_refs text[] not null,
  built_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(selected_source_keys) <= max_items),
  check (cardinality(evidence_refs) > 0),
  check (built_at <= recorded_at + interval '5 minutes')
);
create index if not exists command_center_brain_context_builds_project_idx
  on public.command_center_brain_context_builds(owner_id,project_id,built_at desc,context_build_id);

alter table public.command_center_brain_context_builds enable row level security;
revoke all on table public.command_center_brain_context_builds from public,anon,authenticated;
grant select on table public.command_center_brain_context_builds to authenticated;
drop policy if exists c6_owner_select_brain_context_builds on public.command_center_brain_context_builds;
create policy c6_owner_select_brain_context_builds
  on public.command_center_brain_context_builds for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_brain_record_context_build(
  p_project_id text,
  p_snapshot_id uuid,
  p_decision_id uuid,
  p_max_sensitivity text,
  p_min_relevance numeric,
  p_max_items integer,
  p_selected_source_keys text[],
  p_omitted_stale_keys text[],
  p_omitted_scope_keys text[],
  p_omitted_sensitivity_keys text[],
  p_evidence_refs text[],
  p_built_at timestamptz
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_id uuid;
  s public.command_center_context_snapshots%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_project_id),'')='' then raise exception 'Context build requires project scope'; end if;
  select * into s from public.command_center_context_snapshots where id=p_snapshot_id and owner_id=u;
  if not found or s.project_id<>btrim(p_project_id) then raise exception 'Context snapshot is outside owner/project scope'; end if;
  if p_max_sensitivity<>s.max_sensitivity then raise exception 'Context sensitivity must match immutable snapshot'; end if;
  if p_min_relevance<0 or p_min_relevance>1 or p_max_items<1 then raise exception 'Invalid Context Builder selection policy'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_selected_source_keys,'Context selected source keys');
  perform command_center_private.c3_assert_unique_text_array(p_omitted_stale_keys,'Context stale omissions');
  perform command_center_private.c3_assert_unique_text_array(p_omitted_scope_keys,'Context scope omissions');
  perform command_center_private.c3_assert_unique_text_array(p_omitted_sensitivity_keys,'Context sensitivity omissions');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Context build evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Context build requires evidence'; end if;
  if cardinality(coalesce(p_selected_source_keys,'{}'::text[]))>p_max_items then raise exception 'Context selection exceeds max_items'; end if;
  if exists(
    select 1 from unnest(coalesce(p_selected_source_keys,'{}'::text[])) k
    where not exists(
      select 1 from public.command_center_context_snapshot_sources src
      where src.owner_id=u and src.snapshot_id=p_snapshot_id and src.source_key=k
    )
  ) then raise exception 'Selected context source is not part of immutable snapshot'; end if;
  if p_decision_id is not null and not exists(select 1 from public.command_center_brain_decisions d where d.owner_id=u and d.decision_id=p_decision_id and coalesce(d.project_id,'')=btrim(p_project_id)) then raise exception 'Brain decision is outside context project scope'; end if;

  insert into public.command_center_brain_context_builds(
    owner_id,project_id,snapshot_id,decision_id,max_sensitivity,min_relevance,max_items,selected_source_keys,
    omitted_stale_keys,omitted_scope_keys,omitted_sensitivity_keys,evidence_refs,built_at
  ) values(
    u,btrim(p_project_id),p_snapshot_id,p_decision_id,p_max_sensitivity,p_min_relevance,p_max_items,
    coalesce(p_selected_source_keys,'{}'::text[]),coalesce(p_omitted_stale_keys,'{}'::text[]),coalesce(p_omitted_scope_keys,'{}'::text[]),
    coalesce(p_omitted_sensitivity_keys,'{}'::text[]),p_evidence_refs,p_built_at
  ) returning context_build_id into v_id;
  return v_id;
end $$;

revoke all on function public.command_center_brain_record_context_build(text,uuid,uuid,text,numeric,integer,text[],text[],text[],text[],text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_context_build(text,uuid,uuid,text,numeric,integer,text[],text[],text[],text[],text[],timestamptz) to authenticated;
