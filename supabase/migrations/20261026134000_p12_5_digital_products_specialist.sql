-- C12 / P12.5 — generic digital-product specialist durable evidence

create table if not exists public.command_center_digital_product_ventures (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  venture_id text not null,
  company_ref text not null,
  project_ref text not null,
  storefront_ref text not null,
  delivery_provider_ref text not null,
  archetype text not null check (archetype in ('template','download','course','bundle','toolkit','license','other')),
  state text not null check (state in ('idea','draft','validated','ready','live','paused','recovery','retired')),
  autonomy_mode text not null check (autonomy_mode in ('off','assist','agent')),
  owner_approval_required boolean not null default true,
  approver_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(approver_refs) = 'array'),
  artifact_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(artifact_snapshot) = 'array'),
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  retention_ref text not null,
  legal_ref text not null,
  recovery_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, venture_id),
  unique (owner_user_id, storefront_ref)
);

create table if not exists public.command_center_digital_product_venture_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  venture_id text not null,
  version bigint not null check (version > 0),
  company_ref text not null,
  project_ref text not null,
  storefront_ref text not null,
  delivery_provider_ref text not null,
  state text not null check (state in ('idea','draft','validated','ready','live','paused','recovery','retired')),
  actor_ref text not null,
  owner_approved boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, venture_id, version),
  foreign key (owner_user_id, venture_id)
    references public.command_center_digital_product_ventures(owner_user_id, venture_id)
    on delete cascade
);

create table if not exists public.command_center_digital_product_state_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  venture_id text not null,
  transition_id text not null,
  from_state text check (from_state is null or from_state in ('idea','draft','validated','ready','live','paused','recovery','retired')),
  state text not null check (state in ('idea','draft','validated','ready','live','paused','recovery','retired')),
  actor_ref text not null,
  owner_approved boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, transition_id),
  foreign key (owner_user_id, venture_id)
    references public.command_center_digital_product_ventures(owner_user_id, venture_id)
    on delete cascade
);

create table if not exists public.command_center_digital_product_artifact_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  venture_id text not null,
  artifact_event_id text not null,
  artifact_id text not null,
  artifact_kind text not null,
  product_ref text not null check (btrim(product_ref) <> ''),
  file_ref text not null check (btrim(file_ref) <> ''),
  content_hash text not null check (btrim(content_hash) <> ''),
  delivery_ref text not null check (btrim(delivery_ref) <> ''),
  price numeric not null check (price >= 0),
  currency text not null check (btrim(currency) <> ''),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  state text not null check (state in ('draft','qa','approved','listed','delivered','withdrawn')),
  source_ref text not null,
  actor_ref text not null,
  owner_approved boolean not null default false,
  evidence_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_refs) = 'array'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (owner_user_id, artifact_event_id),
  foreign key (owner_user_id, venture_id)
    references public.command_center_digital_product_ventures(owner_user_id, venture_id)
    on delete cascade
);

create or replace function public.command_center_reject_digital_product_evidence_mutation()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  raise exception 'Digital-product evidence is immutable';
end
$$;

create trigger command_center_digital_product_venture_history_immutable
before update or delete on public.command_center_digital_product_venture_history
for each row execute function public.command_center_reject_digital_product_evidence_mutation();

create trigger command_center_digital_product_state_history_immutable
before update or delete on public.command_center_digital_product_state_history
for each row execute function public.command_center_reject_digital_product_evidence_mutation();

create trigger command_center_digital_product_artifact_history_immutable
before update or delete on public.command_center_digital_product_artifact_history
for each row execute function public.command_center_reject_digital_product_evidence_mutation();

alter table public.command_center_digital_product_ventures enable row level security;
alter table public.command_center_digital_product_venture_history enable row level security;
alter table public.command_center_digital_product_state_history enable row level security;
alter table public.command_center_digital_product_artifact_history enable row level security;

create policy p12_5_digital_product_venture_owner
on public.command_center_digital_product_ventures
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_5_digital_product_venture_history_owner
on public.command_center_digital_product_venture_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_5_digital_product_state_history_owner
on public.command_center_digital_product_state_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));

create policy p12_5_digital_product_artifact_history_owner
on public.command_center_digital_product_artifact_history
for all to authenticated
using (auth.uid() = owner_user_id and (select public.is_command_center_authorized()))
with check (auth.uid() = owner_user_id and (select public.is_command_center_authorized()));
