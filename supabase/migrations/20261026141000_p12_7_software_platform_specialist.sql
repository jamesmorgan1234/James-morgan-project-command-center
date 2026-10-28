create table if not exists public.command_center_software_platforms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  company_ref text not null,
  repository_ref text not null,
  deployment_provider_ref text not null,
  analytics_provider_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(analytics_provider_refs) = 'array'),
  support_provider_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(support_provider_refs) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  recovery_ref text not null,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_ref),
  unique (owner_user_id, repository_ref)
);

create table if not exists public.command_center_software_platform_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  version bigint not null check (version > 0),
  company_ref text not null,
  repository_ref text not null,
  deployment_provider_ref text not null,
  analytics_provider_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(analytics_provider_refs) = 'array'),
  support_provider_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(support_provider_refs) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  actor_ref text not null,
  owner_approved boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, version),
  foreign key (owner_user_id, project_ref)
    references public.command_center_software_platforms(owner_user_id, project_ref)
    on delete cascade
);

create table if not exists public.command_center_software_platform_states (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  state_id text not null,
  company_ref text not null,
  domain text not null check (domain in ('user','role','roadmap','repository','deployment','provider','analytics','support','monetization')),
  canonical_ref text not null,
  state text not null,
  provider_ref text,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  version bigint not null check (version > 0),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, state_id),
  foreign key (owner_user_id, project_ref)
    references public.command_center_software_platforms(owner_user_id, project_ref)
    on delete cascade
);

create table if not exists public.command_center_software_platform_state_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  state_id text not null,
  version bigint not null check (version > 0),
  company_ref text not null,
  domain text not null check (domain in ('user','role','roadmap','repository','deployment','provider','analytics','support','monetization')),
  canonical_ref text not null,
  state text not null,
  provider_ref text,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  actor_ref text not null,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, state_id, version),
  foreign key (owner_user_id, project_ref, state_id)
    references public.command_center_software_platform_states(owner_user_id, project_ref, state_id)
    on delete cascade
);

create table if not exists public.command_center_software_platform_deployments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  deployment_id text not null,
  company_ref text not null,
  repository_ref text not null,
  commit_ref text not null,
  environment_ref text not null,
  deployment_provider_ref text not null,
  deployment_ref text not null,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  observed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, deployment_id),
  unique (owner_user_id, project_ref, deployment_ref),
  foreign key (owner_user_id, project_ref)
    references public.command_center_software_platforms(owner_user_id, project_ref)
    on delete cascade
);

create or replace function public.command_center_reject_software_platform_evidence_mutation()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  raise exception 'Software-platform evidence is immutable';
end
$$;

create trigger command_center_software_platform_history_immutable
before update or delete on public.command_center_software_platform_history
for each row execute function public.command_center_reject_software_platform_evidence_mutation();

create trigger command_center_software_platform_state_history_immutable
before update or delete on public.command_center_software_platform_state_history
for each row execute function public.command_center_reject_software_platform_evidence_mutation();

create trigger command_center_software_platform_deployments_immutable
before update or delete on public.command_center_software_platform_deployments
for each row execute function public.command_center_reject_software_platform_evidence_mutation();

alter table public.command_center_software_platforms enable row level security;
alter table public.command_center_software_platform_history enable row level security;
alter table public.command_center_software_platform_states enable row level security;
alter table public.command_center_software_platform_state_history enable row level security;
alter table public.command_center_software_platform_deployments enable row level security;

create policy p12_7_software_platforms_owner
on public.command_center_software_platforms
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_7_software_platform_history_owner
on public.command_center_software_platform_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_7_software_platform_states_owner
on public.command_center_software_platform_states
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_7_software_platform_state_history_owner
on public.command_center_software_platform_state_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_7_software_platform_deployments_owner
on public.command_center_software_platform_deployments
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create index if not exists command_center_software_platforms_owner_project_idx
  on public.command_center_software_platforms(owner_user_id, project_ref);
create index if not exists command_center_software_platform_states_owner_project_idx
  on public.command_center_software_platform_states(owner_user_id, project_ref, domain);
create index if not exists command_center_software_platform_deployments_owner_project_idx
  on public.command_center_software_platform_deployments(owner_user_id, project_ref, observed_at desc);
