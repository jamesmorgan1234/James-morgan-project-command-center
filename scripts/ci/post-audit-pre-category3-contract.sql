-- A11.2 verified predecessor-schema contract for post-audit SQL execution proof.
--
-- This is NOT a production migration and must never be applied to the live Supabase project.
-- The Command Center database predates repository migration tracking, so A11.2 cannot
-- truthfully start the post-audit Category 3/5/7 chain from an empty application schema.
-- This contract restores only the pre-Category-3 application relations that later
-- checked migrations are allowed to depend on and that are absent from the tracked
-- post-audit migration chain.
--
-- Definitions are recovered from committed source-of-truth migrations:
--   supabase/migrations/20261021_security_complete.sql
--   supabase/migrations/20261024102000_category2_session_device_inventory.sql
--   supabase/migrations/20261024103000_category2_policy_single_use_authorizations.sql
--
-- Keep this file narrow. A missing dependency must be added only from verified
-- repository/provider evidence; never add a CI-only synthetic application shim.

create table if not exists public.command_center_owner_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  client_device_id uuid not null,
  label text not null default 'Owner device',
  platform text,
  trust_state text not null default 'untrusted'
    check (trust_state in ('untrusted','trusted','revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  unique (owner_id, client_device_id)
);

create table if not exists public.command_center_owner_sessions (
  session_id uuid primary key,
  owner_id uuid not null,
  device_id uuid references public.command_center_owner_devices(id) on delete set null,
  assurance text not null default 'unknown',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text
);

create index if not exists command_center_owner_devices_owner_seen_idx
  on public.command_center_owner_devices(owner_id, last_seen_at desc);
create index if not exists command_center_owner_sessions_owner_seen_idx
  on public.command_center_owner_sessions(owner_id, last_seen_at desc);
create index if not exists command_center_owner_sessions_device_idx
  on public.command_center_owner_sessions(device_id) where device_id is not null;

alter table public.command_center_owner_devices enable row level security;
alter table public.command_center_owner_sessions enable row level security;

revoke all on table public.command_center_owner_devices from public, anon, authenticated;
revoke all on table public.command_center_owner_sessions from public, anon, authenticated;
grant select on table public.command_center_owner_devices to authenticated;
grant select on table public.command_center_owner_sessions to authenticated;

drop policy if exists command_center_owner_devices_select_own on public.command_center_owner_devices;
create policy command_center_owner_devices_select_own
on public.command_center_owner_devices
for select
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists command_center_owner_sessions_select_own on public.command_center_owner_sessions;
create policy command_center_owner_sessions_select_own
on public.command_center_owner_sessions
for select
to authenticated
using (owner_id = (select auth.uid()));

create table if not exists public.security_action_authorizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  action_key text not null,
  resource_type text not null,
  resource_id text not null,
  risk_level text not null default 'protected'
    check (risk_level in ('protected','high','critical')),
  status text not null default 'authorized'
    check (status in ('authorized','consumed','revoked','expired')),
  reason text null,
  idempotency_key text not null,
  authorized_at timestamptz not null default now(),
  expires_at timestamptz null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  authorized_session_id uuid,
  fresh_verified_at timestamptz,
  policy_version text,
  unique(owner_id,idempotency_key)
);

create index if not exists security_action_authorizations_owner_idx
  on public.security_action_authorizations(owner_id,status,created_at desc);
create index if not exists security_action_authorizations_source_session_idx
  on public.security_action_authorizations(owner_id, authorized_session_id)
  where authorized_session_id is not null;

alter table public.security_action_authorizations enable row level security;
revoke all on public.security_action_authorizations from anon, authenticated;
grant select on public.security_action_authorizations to authenticated;

drop policy if exists security_action_authorizations_select_own on public.security_action_authorizations;
create policy security_action_authorizations_select_own
on public.security_action_authorizations for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
