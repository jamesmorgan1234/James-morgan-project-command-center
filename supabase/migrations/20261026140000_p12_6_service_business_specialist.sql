create table if not exists public.command_center_service_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  company_ref text not null,
  crm_ref text not null,
  calendar_ref text,
  payment_provider_ref text,
  recovery_ref text not null,
  version bigint not null default 1 check (version > 0),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_ref),
  unique (owner_user_id, crm_ref)
);

create table if not exists public.command_center_service_business_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  version bigint not null check (version > 0),
  company_ref text not null,
  crm_ref text not null,
  calendar_ref text,
  payment_provider_ref text,
  actor_ref text not null,
  owner_approved boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, version),
  foreign key (owner_user_id, project_ref)
    references public.command_center_service_businesses(owner_user_id, project_ref)
    on delete cascade
);

create table if not exists public.command_center_service_business_states (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  state_id text not null,
  company_ref text not null,
  domain text not null check (domain in ('lead','estimate','contract','job','material','schedule','payment','follow_up','reputation')),
  canonical_ref text not null,
  state text not null,
  provider_ref text,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  version bigint not null check (version > 0),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, state_id),
  foreign key (owner_user_id, project_ref)
    references public.command_center_service_businesses(owner_user_id, project_ref)
    on delete cascade
);

create table if not exists public.command_center_service_business_state_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  state_id text not null,
  version bigint not null check (version > 0),
  company_ref text not null,
  domain text not null check (domain in ('lead','estimate','contract','job','material','schedule','payment','follow_up','reputation')),
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
    references public.command_center_service_business_states(owner_user_id, project_ref, state_id)
    on delete cascade
);

create table if not exists public.command_center_service_business_job_links (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  link_id text not null,
  company_ref text not null,
  lead_ref text,
  estimate_ref text,
  contract_ref text,
  job_ref text not null,
  schedule_ref text,
  payment_ref text,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  version bigint not null check (version > 0),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, link_id),
  unique (owner_user_id, project_ref, job_ref),
  foreign key (owner_user_id, project_ref)
    references public.command_center_service_businesses(owner_user_id, project_ref)
    on delete cascade,
  check (lead_ref is not null or estimate_ref is not null or contract_ref is not null or schedule_ref is not null or payment_ref is not null)
);

create table if not exists public.command_center_service_business_job_link_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  project_ref text not null,
  link_id text not null,
  version bigint not null check (version > 0),
  company_ref text not null,
  job_ref text not null,
  lead_ref text,
  estimate_ref text,
  contract_ref text,
  schedule_ref text,
  payment_ref text,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  actor_ref text not null,
  owner_approved boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, project_ref, link_id, version),
  foreign key (owner_user_id, project_ref, link_id)
    references public.command_center_service_business_job_links(owner_user_id, project_ref, link_id)
    on delete cascade
);

create or replace function public.command_center_reject_service_business_evidence_mutation()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  raise exception 'Service-business evidence is immutable';
end
$$;

create trigger command_center_service_business_history_immutable
before update or delete on public.command_center_service_business_history
for each row execute function public.command_center_reject_service_business_evidence_mutation();

create trigger command_center_service_business_state_history_immutable
before update or delete on public.command_center_service_business_state_history
for each row execute function public.command_center_reject_service_business_evidence_mutation();

create trigger command_center_service_business_job_link_history_immutable
before update or delete on public.command_center_service_business_job_link_history
for each row execute function public.command_center_reject_service_business_evidence_mutation();

alter table public.command_center_service_businesses enable row level security;
alter table public.command_center_service_business_history enable row level security;
alter table public.command_center_service_business_states enable row level security;
alter table public.command_center_service_business_state_history enable row level security;
alter table public.command_center_service_business_job_links enable row level security;
alter table public.command_center_service_business_job_link_history enable row level security;

create policy p12_6_service_businesses_owner
on public.command_center_service_businesses
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_6_service_business_history_owner
on public.command_center_service_business_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_6_service_business_states_owner
on public.command_center_service_business_states
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_6_service_business_state_history_owner
on public.command_center_service_business_state_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_6_service_business_job_links_owner
on public.command_center_service_business_job_links
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_6_service_business_job_link_history_owner
on public.command_center_service_business_job_link_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create index if not exists command_center_service_businesses_owner_project_idx
  on public.command_center_service_businesses(owner_user_id, project_ref);
create index if not exists command_center_service_business_states_owner_project_idx
  on public.command_center_service_business_states(owner_user_id, project_ref, domain);
create index if not exists command_center_service_business_job_links_owner_project_idx
  on public.command_center_service_business_job_links(owner_user_id, project_ref, job_ref);
