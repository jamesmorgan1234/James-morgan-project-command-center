create table if not exists public.command_center_specialist_types (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  type_key text not null,
  truth_owner text not null,
  isolation_class text not null,
  required_provider_capabilities jsonb not null default '[]'::jsonb check (jsonb_typeof(required_provider_capabilities) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  version bigint not null check (version > 0),
  registered_at timestamptz not null default now(),
  unique (owner_user_id, type_key, version)
);

create table if not exists public.command_center_specialist_projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  type_key text not null,
  display_name text not null,
  canonical_ref text not null,
  lifecycle_status text not null check (lifecycle_status in ('active','dormant','archived','replaced')),
  provider_capabilities jsonb not null default '[]'::jsonb check (jsonb_typeof(provider_capabilities) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  replaced_by_project_ref text,
  recovery_ref text not null,
  version bigint not null check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_ref),
  unique (owner_user_id, canonical_ref)
);

create table if not exists public.command_center_specialist_project_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  version bigint not null check (version > 0),
  type_key text not null,
  display_name text not null,
  canonical_ref text not null,
  lifecycle_status text not null check (lifecycle_status in ('active','dormant','archived','replaced')),
  provider_capabilities jsonb not null default '[]'::jsonb check (jsonb_typeof(provider_capabilities) = 'array'),
  replaced_by_project_ref text,
  action text not null check (action in ('register','rename','dormant','activate','merge','replace','archive','recover')),
  authorization_ref text,
  actor_ref text not null,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, version),
  foreign key (owner_user_id, project_ref)
    references public.command_center_specialist_projects(owner_user_id, project_ref)
    on delete cascade
);

create table if not exists public.command_center_specialist_provider_assessments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  provider_capability text not null,
  health text not null check (health in ('available','degraded','unavailable')),
  isolated_failure boolean not null,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key (owner_user_id, project_ref)
    references public.command_center_specialist_projects(owner_user_id, project_ref)
    on delete cascade
);

create or replace function public.command_center_reject_specialist_lifecycle_evidence_mutation()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  raise exception 'Specialist lifecycle evidence is immutable';
end
$$;

create trigger command_center_specialist_types_immutable
before update or delete on public.command_center_specialist_types
for each row execute function public.command_center_reject_specialist_lifecycle_evidence_mutation();

create trigger command_center_specialist_project_history_immutable
before update or delete on public.command_center_specialist_project_history
for each row execute function public.command_center_reject_specialist_lifecycle_evidence_mutation();

create trigger command_center_specialist_provider_assessments_immutable
before update or delete on public.command_center_specialist_provider_assessments
for each row execute function public.command_center_reject_specialist_lifecycle_evidence_mutation();

alter table public.command_center_specialist_types enable row level security;
alter table public.command_center_specialist_projects enable row level security;
alter table public.command_center_specialist_project_history enable row level security;
alter table public.command_center_specialist_provider_assessments enable row level security;

create policy p12_8_specialist_types_owner
on public.command_center_specialist_types
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_8_specialist_projects_owner
on public.command_center_specialist_projects
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_8_specialist_project_history_owner
on public.command_center_specialist_project_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_8_specialist_provider_assessments_owner
on public.command_center_specialist_provider_assessments
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create index if not exists command_center_specialist_types_owner_type_idx
  on public.command_center_specialist_types(owner_user_id, type_key, version desc);
create index if not exists command_center_specialist_projects_owner_type_idx
  on public.command_center_specialist_projects(owner_user_id, type_key, lifecycle_status);
create index if not exists command_center_specialist_provider_assessments_owner_project_idx
  on public.command_center_specialist_provider_assessments(owner_user_id, project_ref, observed_at desc);
