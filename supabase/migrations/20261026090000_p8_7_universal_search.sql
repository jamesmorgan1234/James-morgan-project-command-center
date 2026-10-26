-- C8 / P8.7 — owner-scoped universal-search projections.
-- This is an index/projection only; source systems remain canonical truth owners.

create table if not exists public.command_center_search_projections (
  owner_id uuid not null references auth.users(id) on delete cascade,
  projection_id text not null check (btrim(projection_id) <> ''),
  domain text not null check (btrim(domain) <> ''),
  project_id text,
  title text not null check (btrim(title) <> ''),
  search_text text not null default '',
  sensitivity_rank integer not null check (sensitivity_rank >= 0),
  permission_refs text[] not null default '{}'::text[],
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  source_pointer text not null check (btrim(source_pointer) <> ''),
  source_version bigint check (source_version is null or source_version >= 1),
  source_updated_at timestamptz,
  stale_after timestamptz,
  deleted_at timestamptz,
  indexed_at timestamptz not null default now(),
  primary key(owner_id,projection_id)
);

create index if not exists command_center_search_scope_idx
  on public.command_center_search_projections(owner_id,domain,project_id,sensitivity_rank);
create index if not exists command_center_search_permissions_idx
  on public.command_center_search_projections using gin(permission_refs);
create index if not exists command_center_search_provenance_idx
  on public.command_center_search_projections using gin(provenance_refs);
create index if not exists command_center_search_live_idx
  on public.command_center_search_projections(owner_id,indexed_at) where deleted_at is null;

alter table public.command_center_search_projections enable row level security;
revoke all on table public.command_center_search_projections from public,anon,authenticated;
grant select,insert,update,delete on table public.command_center_search_projections to authenticated;

create policy p8_7_search_projection_owner on public.command_center_search_projections
for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
