-- C8 / P8.2 — durable calendar truth and provider reconciliation.
-- Provider adapters remain replaceable; mutations still require owner authorization in the application/security layer.

create table if not exists public.command_center_calendar_events (
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null check (btrim(event_id) <> ''),
  provider_key text not null check (btrim(provider_key) <> ''),
  external_id text not null check (btrim(external_id) <> ''),
  project_id text references public.projects(id) on delete restrict,
  title text not null check (btrim(title) <> ''),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text not null check (btrim(time_zone) <> ''),
  provider_version bigint not null check (provider_version >= 1),
  source_ref text not null check (btrim(source_ref) <> ''),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, event_id),
  unique(owner_id, provider_key, external_id),
  check(ends_at > starts_at)
);

create table if not exists public.command_center_calendar_reconciliations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  reconciliation_id uuid primary key default gen_random_uuid(),
  event_id text not null,
  provider_key text not null,
  external_id text not null,
  local_version bigint not null check (local_version >= 1),
  remote_version bigint not null check (remote_version >= 1),
  status text not null check (status in ('unchanged','remote_applied','stale_remote_ignored','conflict')),
  local_source_ref text not null check (btrim(local_source_ref) <> ''),
  remote_source_ref text not null check (btrim(remote_source_ref) <> ''),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  reconciled_at timestamptz not null default now(),
  foreign key(owner_id,event_id) references public.command_center_calendar_events(owner_id,event_id) on delete restrict
);

create index if not exists command_center_calendar_events_window_idx
  on public.command_center_calendar_events(owner_id, starts_at, ends_at);
create index if not exists command_center_calendar_events_project_idx
  on public.command_center_calendar_events(owner_id, project_id, starts_at);
create index if not exists command_center_calendar_reconciliations_event_idx
  on public.command_center_calendar_reconciliations(owner_id, event_id, reconciled_at desc);

create or replace function public.command_center_calendar_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists command_center_calendar_events_set_updated_at on public.command_center_calendar_events;
create trigger command_center_calendar_events_set_updated_at
before update on public.command_center_calendar_events
for each row execute function public.command_center_calendar_set_updated_at();

create or replace function public.command_center_reject_calendar_reconciliation_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Calendar reconciliation history is immutable'; end $$;

drop trigger if exists command_center_calendar_reconciliations_immutable on public.command_center_calendar_reconciliations;
create trigger command_center_calendar_reconciliations_immutable
before update or delete on public.command_center_calendar_reconciliations
for each row execute function public.command_center_reject_calendar_reconciliation_mutation();

do $$ declare t text; begin
  foreach t in array array['command_center_calendar_events','command_center_calendar_reconciliations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public,anon,authenticated', t);
  end loop;
end $$;

grant select,insert,update on table public.command_center_calendar_events to authenticated;
grant select,insert on table public.command_center_calendar_reconciliations to authenticated;

create policy p8_2_calendar_events_owner_all on public.command_center_calendar_events
for all to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy p8_2_calendar_reconciliations_owner_select on public.command_center_calendar_reconciliations
for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy p8_2_calendar_reconciliations_owner_insert on public.command_center_calendar_reconciliations
for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
