-- C8 / P8.6 — durable onboarding prerequisite manifests and completion evidence.

create table if not exists public.command_center_onboarding_requirements (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete restrict,
  spec_version bigint not null check (spec_version >= 1),
  requirement_id text not null check (btrim(requirement_id) <> ''),
  kind text not null check (kind in ('account','provider','credential','domain','device','permission','legal')),
  title text not null check (btrim(title) <> ''),
  dependency_ids text[] not null default '{}'::text[],
  unlock_refs text[] not null check (cardinality(unlock_refs) > 0),
  required_environment text not null check (required_environment in ('pc','phone','local_browser','any_device')),
  owner_only boolean not null,
  known_at_spec_time boolean not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,project_id,spec_version,requirement_id)
);

create table if not exists public.command_center_onboarding_completions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  spec_version bigint not null,
  requirement_id text not null,
  completed_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  created_at timestamptz not null default now(),
  primary key(owner_id,project_id,spec_version,requirement_id),
  foreign key(owner_id,project_id,spec_version,requirement_id)
    references public.command_center_onboarding_requirements(owner_id,project_id,spec_version,requirement_id) on delete restrict
);

create index if not exists command_center_onboarding_known_idx
  on public.command_center_onboarding_requirements(owner_id,project_id,spec_version,known_at_spec_time,required_environment);
create index if not exists command_center_onboarding_dependency_idx
  on public.command_center_onboarding_requirements using gin(dependency_ids);
create index if not exists command_center_onboarding_unlock_idx
  on public.command_center_onboarding_requirements using gin(unlock_refs);

create or replace function public.command_center_reject_onboarding_completion_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Onboarding completion evidence is immutable'; end $$;

drop trigger if exists command_center_onboarding_completions_immutable on public.command_center_onboarding_completions;
create trigger command_center_onboarding_completions_immutable before update or delete on public.command_center_onboarding_completions
for each row execute function public.command_center_reject_onboarding_completion_mutation();

do $$ declare t text; begin
  foreach t in array array['command_center_onboarding_requirements','command_center_onboarding_completions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_onboarding_requirements to authenticated;
grant select,insert on table public.command_center_onboarding_completions to authenticated;

create policy p8_6_onboarding_requirements_owner on public.command_center_onboarding_requirements for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_6_onboarding_completions_owner on public.command_center_onboarding_completions for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_6_onboarding_completions_insert on public.command_center_onboarding_completions for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
