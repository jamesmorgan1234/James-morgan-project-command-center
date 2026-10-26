-- C8 / P8.3 — personal operations projections.
-- Specialist-owned domain truth remains in the specialist; this table stores only owner-scoped references/projections.

create table if not exists public.command_center_personal_operations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null check (btrim(operation_id) <> ''),
  kind text not null check (kind in ('household','errand','shopping','vehicle','travel','obligation')),
  title text not null check (btrim(title) <> ''),
  truth_owner_key text not null check (btrim(truth_owner_key) <> ''),
  canonical_ref text not null check (btrim(canonical_ref) <> ''),
  specialist_project_id text,
  projection_only boolean generated always as (truth_owner_key <> 'personal-core') stored,
  status text not null check (status in ('open','planned','done','cancelled')),
  sensitivity_rank integer not null default 1 check (sensitivity_rank between 0 and 4),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, operation_id),
  unique(owner_id, canonical_ref),
  check ((truth_owner_key = 'personal-core' and specialist_project_id is null) or (truth_owner_key <> 'personal-core' and btrim(coalesce(specialist_project_id,'')) <> ''))
);

create index if not exists command_center_personal_operations_view_idx
  on public.command_center_personal_operations(owner_id, kind, status, sensitivity_rank);
create index if not exists command_center_personal_operations_specialist_idx
  on public.command_center_personal_operations(owner_id, specialist_project_id) where specialist_project_id is not null;

create or replace function public.command_center_personal_operations_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists command_center_personal_operations_set_updated_at on public.command_center_personal_operations;
create trigger command_center_personal_operations_set_updated_at
before update on public.command_center_personal_operations
for each row execute function public.command_center_personal_operations_set_updated_at();

alter table public.command_center_personal_operations enable row level security;
revoke all on table public.command_center_personal_operations from public,anon,authenticated;
grant select,insert,update on table public.command_center_personal_operations to authenticated;

create policy p8_3_personal_operations_owner_all on public.command_center_personal_operations
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
