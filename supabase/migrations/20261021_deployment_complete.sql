-- Command Center Deployment — phases 1–7
-- Durable release manifests, validation evidence, post-deploy health, version history,
-- controlled rollback records, and PWA release identity. No fake rows are seeded.

create table if not exists public.deployment_releases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  release_key text not null,
  environment text not null default 'production' check (environment in ('production','staging')),
  provider text not null default 'github_pages' check (provider in ('github_pages')),
  repository text not null,
  branch text not null default 'main',
  source_commit text not null check (length(source_commit)>=7),
  manifest_version integer not null default 1 check (manifest_version>0),
  app_config_version integer not null check (app_config_version>0),
  pwa_cache_version integer not null check (pwa_cache_version>0),
  status text not null default 'prepared' check (status in ('prepared','validated','deployed','verified','failed','rolled_back','superseded')),
  known_good boolean not null default false,
  pages_run_id bigint null,
  pages_run_number integer null,
  deployed_at timestamptz null,
  verified_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,environment,source_commit),
  unique(owner_id,release_key)
);
create index if not exists deployment_releases_owner_time_idx
  on public.deployment_releases(owner_id,created_at desc);
create index if not exists deployment_releases_owner_status_idx
  on public.deployment_releases(owner_id,environment,status,verified_at desc nulls last);
alter table public.deployment_releases enable row level security;
drop policy if exists deployment_releases_select_own on public.deployment_releases;
create policy deployment_releases_select_own on public.deployment_releases
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.deployment_releases from anon,authenticated;
grant select on public.deployment_releases to authenticated;
drop trigger if exists deployment_releases_updated_at on public.deployment_releases;
create trigger deployment_releases_updated_at before update on public.deployment_releases
for each row execute function public.command_center_set_updated_at();

create table if not exists public.deployment_validations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  release_id uuid not null references public.deployment_releases(id) on delete cascade,
  check_key text not null,
  status text not null check (status in ('pending','passed','failed','cancelled')),
  workflow_run_id bigint null,
  evidence jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(release_id,check_key)
);
create index if not exists deployment_validations_owner_release_idx
  on public.deployment_validations(owner_id,release_id,checked_at desc);
create index if not exists deployment_validations_release_fk_idx
  on public.deployment_validations(release_id);
alter table public.deployment_validations enable row level security;
drop policy if exists deployment_validations_select_own on public.deployment_validations;
create policy deployment_validations_select_own on public.deployment_validations
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.deployment_validations from anon,authenticated;
grant select on public.deployment_validations to authenticated;

create table if not exists public.deployment_health_checks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  release_id uuid not null references public.deployment_releases(id) on delete cascade,
  check_key text not null,
  status text not null check (status in ('passed','failed','unavailable')),
  evidence jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(release_id,check_key)
);
create index if not exists deployment_health_checks_owner_release_idx
  on public.deployment_health_checks(owner_id,release_id,checked_at desc);
create index if not exists deployment_health_checks_release_fk_idx
  on public.deployment_health_checks(release_id);
alter table public.deployment_health_checks enable row level security;
drop policy if exists deployment_health_checks_select_own on public.deployment_health_checks;
create policy deployment_health_checks_select_own on public.deployment_health_checks
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.deployment_health_checks from anon,authenticated;
grant select on public.deployment_health_checks to authenticated;

create table if not exists public.deployment_rollbacks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_release_id uuid not null references public.deployment_releases(id) on delete restrict,
  target_release_id uuid not null references public.deployment_releases(id) on delete restrict,
  status text not null default 'requested' check (status in ('requested','pr_open','merged','verified','cancelled','failed')),
  rollback_branch text null,
  pull_request_number integer null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz null,
  check (source_release_id<>target_release_id)
);
create index if not exists deployment_rollbacks_owner_time_idx
  on public.deployment_rollbacks(owner_id,created_at desc);
create index if not exists deployment_rollbacks_source_fk_idx
  on public.deployment_rollbacks(source_release_id);
create index if not exists deployment_rollbacks_target_fk_idx
  on public.deployment_rollbacks(target_release_id);
alter table public.deployment_rollbacks enable row level security;
drop policy if exists deployment_rollbacks_select_own on public.deployment_rollbacks;
create policy deployment_rollbacks_select_own on public.deployment_rollbacks
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
revoke all on public.deployment_rollbacks from anon,authenticated;
grant select on public.deployment_rollbacks to authenticated;
drop trigger if exists deployment_rollbacks_updated_at on public.deployment_rollbacks;
create trigger deployment_rollbacks_updated_at before update on public.deployment_rollbacks
for each row execute function public.command_center_set_updated_at();

-- Browser history is deliberately read-only. Verified release truth is written only by
-- trusted execution after GitHub/Pages evidence has been checked.

create or replace function public.command_center_deployment_status()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  u uuid := (select auth.uid());
  r public.deployment_releases%rowtype;
  validation_total integer := 0;
  validation_passed integer := 0;
  health_total integer := 0;
  health_passed integer := 0;
  rollback_total integer := 0;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.deployment_releases
   where owner_id=u and environment='production'
   order by coalesce(verified_at,deployed_at,created_at) desc limit 1;
  if r.id is not null then
    select count(*),count(*) filter(where status='passed') into validation_total,validation_passed
      from public.deployment_validations where owner_id=u and release_id=r.id;
    select count(*),count(*) filter(where status='passed') into health_total,health_passed
      from public.deployment_health_checks where owner_id=u and release_id=r.id;
  end if;
  select count(*) into rollback_total from public.deployment_rollbacks where owner_id=u;
  return jsonb_build_object(
    'current_release_id',r.id,
    'release_key',r.release_key,
    'source_commit',r.source_commit,
    'status',r.status,
    'known_good',coalesce(r.known_good,false),
    'app_config_version',r.app_config_version,
    'pwa_cache_version',r.pwa_cache_version,
    'pages_run_id',r.pages_run_id,
    'pages_run_number',r.pages_run_number,
    'deployed_at',r.deployed_at,
    'verified_at',r.verified_at,
    'validation_total',validation_total,
    'validation_passed',validation_passed,
    'health_total',health_total,
    'health_passed',health_passed,
    'rollback_records',rollback_total
  );
end $$;
revoke all on function public.command_center_deployment_status() from public,anon,authenticated;
grant execute on function public.command_center_deployment_status() to authenticated,service_role;
